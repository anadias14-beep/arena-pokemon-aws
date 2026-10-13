#!/usr/bin/env bash
# Gera o build do React e envia para o bucket S3 de onde o EC2 copia o site.
# Rode no AWS CloudShell (ou na sua máquina com a AWS CLI configurada):
#   ./infra/deploy-frontend.sh nome-do-seu-bucket
set -euo pipefail

BUCKET="${1:?informe o nome do bucket S3, ex.: ./infra/deploy-frontend.sh arena-pokemon-site-ana}"

if [ ! -f .env ]; then
  echo "Crie o arquivo .env a partir do .env.example antes de gerar o build." >&2
  exit 1
fi

npm install --no-audit --no-fund
npm run build

# --delete remove do bucket arquivos antigos que não existem mais no build
aws s3 sync build/ "s3://${BUCKET}/site/" --delete

echo "Site enviado para s3://${BUCKET}/site/"
echo "No EC2, rode: sudo /usr/local/bin/atualizar-site.sh"
