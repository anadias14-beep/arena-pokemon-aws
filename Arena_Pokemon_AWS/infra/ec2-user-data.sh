#!/bin/bash
# User data do EC2 (Amazon Linux 2023). Cole em:
#   EC2 > Launch instance > Advanced details > User data
# Troque o nome do bucket na linha abaixo antes de lançar a instância.
# A instância precisa do perfil IAM "LabInstanceProfile" (já existe no Learner Lab)
# para ter permissão de ler o S3.
BUCKET="arena-pokemon-site-SUBSTITUA"

dnf install -y httpd
systemctl enable --now httpd

# script que copia o build do React do S3 para o Apache
cat > /usr/local/bin/atualizar-site.sh <<EOF
#!/bin/bash
aws s3 sync s3://${BUCKET}/site/ /var/www/html/ --delete
EOF
chmod +x /usr/local/bin/atualizar-site.sh

# o React é uma SPA: qualquer rota desconhecida volta para o index.html
cat > /etc/httpd/conf.d/spa.conf <<'EOF'
<Directory "/var/www/html">
    FallbackResource /index.html
</Directory>
EOF

/usr/local/bin/atualizar-site.sh
systemctl restart httpd
