/**
 * SalvarResultadoBatalha — Registra partidas e mantém o ranking.
 *
 * Rotas (API Gateway HTTP "ApiPokemonBatalhas"):
 *   POST /batalhas  -> grava a partida em HistoricoBatalhas e atualiza
 *                      os pontos do jogador em RankingJogadores
 *   GET  /ranking   -> top 10 jogadores por pontuação
 *
 * A pontuação é calculada AQUI, no servidor (+100 vitória, -50 derrota,
 * nunca abaixo de 0). O navegador só informa o resultado, então ninguém
 * consegue se dar 1 milhão de pontos editando o JavaScript da página.
 *
 * Roda na SUB-REDE PRIVADA e acessa o DynamoDB pelo VPC Gateway Endpoint.
 *
 * Variáveis de ambiente:
 *   HISTORY_TABLE -> HistoricoBatalhas
 *   RANKING_TABLE -> RankingJogadores
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const HISTORY_TABLE = process.env.HISTORY_TABLE || "HistoricoBatalhas";
const RANKING_TABLE = process.env.RANKING_TABLE || "RankingJogadores";

// ---------------------------------------------------------------------------
// Regras de validação
// ---------------------------------------------------------------------------
// nickname: letras (inclusive acentuadas), números, espaço, _ e -; 2 a 20 caracteres
const NICK_REGEX = /^[\p{L}\p{N} _-]{2,20}$/u;
// arenas que existem no jogo (mesmas chaves do objeto ARENAS do App.js)
const ARENAS_VALIDAS = new Set([
  "ginasio", "floresta", "vulcao", "oceano", "usina", "caverna", "torre",
]);
const RESULTADOS = { vitoria: 100, derrota: -50 };
// id de Pokémon da 1ª geração: 1 a 151
const ID_POKEMON_REGEX = /^(?:[1-9]|[1-9]\d|1[0-4]\d|15[01])$/;

export const handler = async (event) => {
  const rota = event.routeKey || `${event.requestContext?.http?.method} ${event.rawPath}`;

  try {
    if (rota.startsWith("OPTIONS")) return resposta(204, null);
    if (rota === "GET /ranking") return resposta(200, await buscarRanking());
    if (rota === "POST /batalhas") return await registrarBatalha(event);
    return resposta(404, { erro: `rota não encontrada: ${rota}` });
  } catch (erro) {
    console.error("[ERRO] falha inesperada:", erro);
    return resposta(500, { erro: "falha interna ao processar a batalha" });
  }
};

async function registrarBatalha(event) {
  // 1) o corpo precisa ser JSON
  let corpo;
  try {
    const bruto = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    corpo = JSON.parse(bruto);
  } catch {
    return resposta(400, { erro: "corpo da requisição não é um JSON válido" });
  }

  // 2) valida e normaliza cada campo
  const erros = [];
  const nickname = typeof corpo.nickname === "string" ? corpo.nickname.trim().replace(/\s+/g, " ") : "";
  if (!NICK_REGEX.test(nickname)) erros.push("nickname: use 2 a 20 letras, números, espaço, _ ou -");

  const arena = String(corpo.arena || "").trim().toLowerCase();
  if (!ARENAS_VALIDAS.has(arena)) erros.push(`arena: deve ser uma de ${[...ARENAS_VALIDAS].join(", ")}`);

  const resultado = String(corpo.resultado || "").trim().toLowerCase();
  if (!(resultado in RESULTADOS)) erros.push("resultado: deve ser 'vitoria' ou 'derrota'");

  const time = Array.isArray(corpo.time) ? corpo.time.map((id) => String(id).trim()) : [];
  if (time.length !== 3 || !time.every((id) => ID_POKEMON_REGEX.test(id)) || new Set(time).size !== 3) {
    erros.push("time: precisa de exatamente 3 ids de Pokémon diferentes, entre 1 e 151");
  }

  if (erros.length) return resposta(422, { erro: "dados inválidos", detalhes: erros });

  // 3) grava a partida no histórico
  const partida = {
    partidaId: randomUUID(),
    dataHora: new Date().toISOString(),
    nickname,
    arena,
    resultado,
    time,
  };
  await doc.send(new PutCommand({ TableName: HISTORY_TABLE, Item: partida }));

  // 4) atualiza o ranking de forma ATÔMICA (duas abas abertas não se sobrescrevem)
  const chave = nickname.toLowerCase(); // "Ana" e "ana" são o mesmo jogador
  const atualizado = await doc.send(new UpdateCommand({
    TableName: RANKING_TABLE,
    Key: { jogadorId: chave },
    UpdateExpression:
      "SET nickname = :nick, ultimaPartida = :agora, " +
      "pontuacao = if_not_exists(pontuacao, :zero) + :delta, " +
      "vitorias = if_not_exists(vitorias, :zero) + :vit, " +
      "partidas = if_not_exists(partidas, :zero) + :um",
    ExpressionAttributeValues: {
      ":nick": nickname,
      ":agora": partida.dataHora,
      ":zero": 0,
      ":um": 1,
      ":delta": RESULTADOS[resultado],
      ":vit": resultado === "vitoria" ? 1 : 0,
    },
    ReturnValues: "ALL_NEW",
  }));

  let jogador = atualizado.Attributes;

  // 5) pontuação nunca fica negativa
  if (jogador.pontuacao < 0) {
    const corrigido = await doc.send(new UpdateCommand({
      TableName: RANKING_TABLE,
      Key: { jogadorId: chave },
      UpdateExpression: "SET pontuacao = :zero",
      ConditionExpression: "pontuacao < :zero",
      ExpressionAttributeValues: { ":zero": 0 },
      ReturnValues: "ALL_NEW",
    })).catch(() => null);
    jogador = corrigido?.Attributes ?? { ...jogador, pontuacao: 0 };
  }

  return resposta(201, { partida, jogador });
}

async function buscarRanking() {
  const itens = [];
  let ExclusiveStartKey;
  do {
    const pagina = await doc.send(new ScanCommand({ TableName: RANKING_TABLE, ExclusiveStartKey }));
    itens.push(...(pagina.Items || []));
    ExclusiveStartKey = pagina.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return itens
    .sort((a, b) => (b.pontuacao - a.pontuacao) || (b.vitorias - a.vitorias))
    .slice(0, 10)
    .map(({ nickname, pontuacao, vitorias, partidas }) => ({ nickname, pontuacao, vitorias, partidas }));
}

function resposta(statusCode, corpo) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: corpo === null ? "" : JSON.stringify(corpo),
  };
}
