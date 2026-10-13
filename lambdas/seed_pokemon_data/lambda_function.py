"""
SeedPokemonData — Carga e atualização do catálogo de Pokémon.

Fluxo: PokéAPI (pública) -> validação/normalização -> DynamoDB.

Roda FORA da VPC, porque precisa de internet para chamar a PokéAPI e a
sub-rede privada não tem NAT Gateway (o que evita esse custo extra).
É disparada manualmente (Test com {}) na primeira vez e depois, de forma
automática, por uma agenda do Amazon EventBridge Scheduler (1x por semana).

Variáveis de ambiente:
  CATALOG_TABLE  -> PokemonCatalog   (dados prontos para o jogo)
  RAW_TABLE      -> TabelaPokemons   (dados coletados + metadados da coleta)
  FIRST_ID / LAST_ID -> faixa de Pokémon a carregar (padrão 1..151)
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")
tabela_catalogo = dynamodb.Table(os.environ.get("CATALOG_TABLE", "PokemonCatalog"))
tabela_bruta = dynamodb.Table(os.environ.get("RAW_TABLE", "TabelaPokemons"))

POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/{}"
FIRST_ID = int(os.environ.get("FIRST_ID", "1"))
LAST_ID = int(os.environ.get("LAST_ID", "151"))

# ---------------------------------------------------------------------------
# Regras de validação (expressões regulares e listas permitidas)
# ---------------------------------------------------------------------------
# nome: minúsculas, números e hífen (ex.: "pikachu", "mr-mime", "nidoran-f")
NOME_REGEX = re.compile(r"^[a-z][a-z0-9-]{0,49}$")
# sprite: precisa ser uma URL https de imagem .png do repositório oficial
SPRITE_REGEX = re.compile(r"^https://raw\.githubusercontent\.com/PokeAPI/sprites/[\w/.-]+\.png$")
TIPOS_VALIDOS = {
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
    "steel", "fairy",
}
STAT_MIN, STAT_MAX = 1, 255  # limites oficiais de base stats


class DadoInvalido(Exception):
    """Dado da PokéAPI que não passou nas regras de validação."""


def lambda_handler(event, context):
    inicio = time.time()
    carregados, falhas = 0, []
    coletado_em = datetime.now(timezone.utc).isoformat()

    with tabela_catalogo.batch_writer() as lote_catalogo, \
         tabela_bruta.batch_writer() as lote_bruto:
        for pid in range(FIRST_ID, LAST_ID + 1):
            try:
                bruto = buscar_na_pokeapi(pid)
                tratado = normalizar_e_validar(bruto, pid)

                lote_catalogo.put_item(Item=tratado)
                lote_bruto.put_item(Item={
                    "id_pokemon": str(pid),
                    "nome": tratado["name"],
                    "altura_dm": int(bruto.get("height") or 0),
                    "peso_hg": int(bruto.get("weight") or 0),
                    "experiencia_base": int(bruto.get("base_experience") or 0),
                    "fonte": POKEAPI_URL.format(pid),
                    "coletadoEm": coletado_em,
                })
                carregados += 1
            except (DadoInvalido, RuntimeError) as erro:
                # um Pokémon com problema não derruba a carga inteira
                falhas.append({"id": pid, "erro": str(erro)})
                print(f"[AVISO] Pokémon {pid} ignorado: {erro}")

            time.sleep(0.05)  # respeita a PokéAPI pública

    resumo = {
        "carregados": carregados,
        "falhas": falhas,
        "segundos": round(time.time() - inicio, 1),
    }
    print(json.dumps(resumo, ensure_ascii=False))
    return resumo


def buscar_na_pokeapi(pid: int, tentativas: int = 3) -> dict:
    """GET na PokéAPI com até 3 tentativas (falhas de rede são comuns)."""
    ultimo_erro = None
    for tentativa in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(
                POKEAPI_URL.format(pid),
                headers={"User-Agent": "arena-batalha-pokemon/1.0"},
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise RuntimeError(f"Pokémon {pid} não existe na PokéAPI")
            ultimo_erro = f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError) as e:
            ultimo_erro = f"rede: {getattr(e, 'reason', e)}"
        time.sleep(0.5 * tentativa)  # espera crescente entre tentativas
    raise RuntimeError(f"PokéAPI indisponível após {tentativas} tentativas ({ultimo_erro})")


def normalizar_e_validar(bruto: dict, pid_esperado: int) -> dict:
    """Converte a resposta crua (centenas de campos) no formato enxuto que o
    jogo usa e garante que cada campo é coerente."""
    # --- id ---
    pid = bruto.get("id")
    if not isinstance(pid, int) or pid != pid_esperado:
        raise DadoInvalido(f"id inconsistente: esperado {pid_esperado}, veio {pid!r}")

    # --- nome ---
    nome = str(bruto.get("name", "")).strip().lower()
    if not NOME_REGEX.match(nome):
        raise DadoInvalido(f"nome fora do padrão: {nome!r}")

    # --- tipos (1 ou 2, ordenados pelo slot) ---
    tipos_ordenados = sorted(bruto.get("types", []), key=lambda t: t.get("slot", 9))
    tipos = [t["type"]["name"] for t in tipos_ordenados]
    if not 1 <= len(tipos) <= 2 or any(t not in TIPOS_VALIDOS for t in tipos):
        raise DadoInvalido(f"tipos inválidos: {tipos}")

    # --- atributos ---
    stats = {s["stat"]["name"]: s.get("base_stat") for s in bruto.get("stats", [])}
    atributos = {}
    for chave_api, chave_jogo in (("hp", "hp"), ("attack", "attack"),
                                  ("defense", "defense"), ("speed", "speed")):
        valor = stats.get(chave_api)
        if not isinstance(valor, int) or not STAT_MIN <= valor <= STAT_MAX:
            raise DadoInvalido(f"{chave_api} fora da faixa {STAT_MIN}-{STAT_MAX}: {valor!r}")
        atributos[chave_jogo] = valor

    # --- sprite (opcional, mas se vier precisa ser válido) ---
    sprite = (bruto.get("sprites") or {}).get("front_default") or ""
    if sprite and not SPRITE_REGEX.match(sprite):
        sprite = ""  # descarta URL suspeita em vez de rejeitar o Pokémon

    return {
        "pokemonId": pid,  # Number, igual à chave da tabela PokemonCatalog
        "name": nome.replace("-", " ").title(),  # "mr-mime" -> "Mr Mime"
        "type1": tipos[0],
        "type2": tipos[1] if len(tipos) > 1 else "",
        **atributos,
        "sprite": sprite,
    }
