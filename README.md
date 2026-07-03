# A7-3DLAB Store

Loja virtual simples e responsiva para produtos impressos em 3D, com catalogo, pagina de produto, painel administrativo, WhatsApp, Instagram, checkout mock do Mercado Pago e autenticacao com senha forte e 2FA.

## Tecnologias

- Next.js 16
- React 19
- Tailwind CSS 4
- API Routes do Next.js
- Persistencia local em `src/data/products.json`
- Auth local com `bcryptjs`, `otplib`, `qrcode` e `nodemailer`

## Como instalar

```bash
pnpm install
cp .env.example .env.local
```

No Windows, copie `.env.example` para `.env.local` manualmente se preferir.

## Como rodar

```bash
pnpm dev
```

Abra `http://localhost:3000`.

Para build de producao:

```bash
pnpm build
pnpm start
```

## Autenticacao e painel administrativo

O painel fica em `/admin` e redireciona para `/login` quando nao existe sessao valida. As APIs de cadastro, edicao e exclusao de produtos tambem verificam a sessao no backend.

Credenciais iniciais de desenvolvimento:

```text
E-mail: admin@a7-3dlab.local
Senha: A7-Admin-2026!
```

Configure no `.env.local` antes de publicar:

```env
AUTH_ADMIN_EMAIL=admin@a7-3dlab.local
AUTH_INITIAL_ADMIN_PASSWORD=A7-Admin-2026!
AUTH_SESSION_SECRET=troque-este-segredo-longo-com-32-caracteres-ou-mais
AUTH_RESET_TOKEN_TTL_MINUTES=30
```

Depois do primeiro acesso, o app cria `src/data/auth.json` com o hash da senha, configuracoes de 2FA e tokens de recuperacao. Esse arquivo fica no `.gitignore` e nao deve ser commitado.

### Requisitos de senha

A senha precisa ter:

- 8 caracteres ou mais
- 1 letra maiuscula
- 1 letra minuscula
- 1 numero
- 1 caractere especial
- Nao estar na lista de senhas comuns, como `12345678`, `password`, `admin123` e `qwerty123`

A tela `/seguranca` mostra barra de forca em tempo real e checklist visual.

### Troca de senha

Entre no painel e acesse `/seguranca`. A troca exige senha atual, nova senha e confirmacao. Ao trocar, o app incrementa a versao de sessao do usuario, invalida sessoes antigas e cria uma nova sessao apenas para o navegador atual.

### Recuperacao de senha

Use `/esqueci-senha`. A resposta e sempre generica para nao revelar se o e-mail existe. O link enviado aponta para `/redefinir-senha?token=...`, expira conforme `AUTH_RESET_TOKEN_TTL_MINUTES` e o token e armazenado apenas como hash. Depois do uso, todos os tokens pendentes sao invalidados.

### Envio de e-mail

Para SMTP real, configure:

```env
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="A7-3DLAB <contato@seudominio.com>"
```

Sem SMTP, o app usa modo dev e salva os e-mails em `src/data/dev-emails.json`. Isso permite testar recuperacao de senha localmente sem API paga. Esse arquivo tambem fica no `.gitignore`.

### Dupla autenticacao

O 2FA usa TOTP com `otplib`, compativel com Google Authenticator, Microsoft Authenticator e Authy. Em `/seguranca`:

1. Clique em **Ativar 2FA**.
2. Escaneie o QR Code no aplicativo autenticador.
3. Informe o codigo de 6 digitos.
4. Guarde os codigos de recuperacao exibidos.

Quando o 2FA estiver ativo, o login exige senha e depois o codigo TOTP ou um codigo de recuperacao. A desativacao exige senha atual e codigo 2FA.

### Seguranca implementada

- Senhas salvas com hash bcrypt (`bcryptjs`) e salt.
- Tokens de redefinicao armazenados apenas como hash SHA-256 de token aleatorio de alta entropia.
- Cookies HTTP-only e assinados por HMAC.
- Secrets somente no backend.
- Rate limit em login, recuperacao, redefinicao, troca de senha e 2FA.
- Logs de eventos suspeitos em `src/data/security-events.jsonl`.
- Em producao, use HTTPS e defina um `AUTH_SESSION_SECRET` longo e unico.

## Mercado Pago

As variaveis ja estao preparadas:

```env
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_USE_MOCK=true
```

Por padrao, o botao **Comprar** usa um checkout mock em `/checkout-mock`. Para ativar a chamada real:

1. Preencha `MERCADO_PAGO_ACCESS_TOKEN`.
2. Ajuste `NEXT_PUBLIC_SITE_URL` para a URL publica da loja.
3. Defina `MERCADO_PAGO_USE_MOCK=false`.

O token privado fica apenas em codigo server-side, no arquivo `src/services/mercado-pago.ts`.

## WhatsApp

Edite no `.env.local`:

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

Use DDI + DDD + numero, somente digitos. O botao fixo envia a mensagem:

```text
Ola! Tenho interesse em um produto personalizado de impressao 3D.
```

Produtos personalizados enviam uma mensagem com o nome do produto.

## Instagram

Edite no `.env.local`:

```env
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/a7.3dlab
```

O link aparece no cabecalho, rodape e secao inicial.

## Produtos

Os produtos de exemplo estao em `src/data/products.json`. Tambem e possivel criar, editar e excluir pelo painel administrativo.

Campos suportados:

- Nome
- Descricao
- Categoria
- Preco
- Fotos
- Quantidade disponivel
- Produto personalizado ou produto pronto
- Destaque na pagina inicial

## Proximos passos sugeridos

- Trocar a persistencia local por Supabase, Firebase ou SQLite.
- Adicionar upload de imagens para storage externo.
- Criar webhooks do Mercado Pago para confirmar pagamento.
- Adicionar controle de pedidos e status de producao.
