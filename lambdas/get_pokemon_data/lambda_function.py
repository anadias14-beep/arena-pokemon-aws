"""
GetPokemonData — Entrega o catálogo ao jogo.

Rotas (API Gateway HTTP "PokemonAPI"):
  GET /pokemons        -> lista completa do catálogo, ordenada por id
  GET /pokemons/{id}   -> um Pokémon específico

Roda na SUB-REDE PRIVADA da VPC e acessa o DynamoDB pelo
VPC Gateway Endpoint (sem passar pela internet).

Variável de ambiente:
  CATALOG_TABLE -> PokemonCatalog
"""

import json
import os
import re
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
tabela = dynamodb.Table(os.environ.get("CATALOG_TABLE", "PokemonCatalog"))

# id aceito: só dígitos, de 1 a 4 casas (ex.: "25"); bloqueia injeção/lixo na URL
ID_REGEX = re.compile(r"^[1-9]\d{0,3}$")


def lambda_handler(event, context):
    metodo = (event.get("requestContext", {}).get("http", {}).get("method") or "GET").upper()
    if metodo == "OPTIONS":
        return resposta(204, None)
    if metodo != "GET":
        return resposta(405, {"erro": "método não permitido; use GET"})

    pid = (event.get("pathParameters") or {}).get("id")

    try:
        if pid is None:
            return resposta(200, listar_catalogo())

        pid = str(pid).strip()
        if not ID_REGEX.match(pid):
            return resposta(400, {"erro": "id inválido: use apenas números (ex.: /pokemons/25)"})

        item = tabela.get_item(Key={"pokemonId": int(pid)}).get("Item")  # chave é Number
        if not item:
            return resposta(404, {"erro": f"Pokémon {pid} não encontrado no catálogo"})
        return resposta(200, item)

    except Exception as erro:  # erro de permissão, rede ou DynamoDB
        print(f"[ERRO] falha ao consultar o DynamoDB: {erro}")
        return resposta(500, {"erro": "falha ao consultar o catálogo"})


def listar_catalogo():
    """Scan paginado: o DynamoDB devolve no máximo 1 MB por chamada."""
    itens, kwargs = [], {}
    while True:
        pagina = tabela.scan(**kwargs)
        itens.extend(pagina.get("Items", []))
        if "LastEvaluatedKey" not in pagina:
            break
        kwargs["ExclusiveStartKey"] = pagina["LastEvaluatedKey"]
    return sorted(itens, key=lambda p: int(p["pokemonId"]))


def _json_padrao(valor):
    # o DynamoDB devolve números como Decimal; o JSON precisa de int/float
    if isinstance(valor, Decimal):
        return int(valor) if valor % 1 == 0 else float(valor)
    raise TypeError(f"tipo não serializável: {type(valor)}")


def resposta(status, corpo):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300",
        },
        "body": "" if corpo is None else json.dumps(corpo, ensure_ascii=False, default=_json_padrao),
    }
