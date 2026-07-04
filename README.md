# A7-3DLAB Store

Loja virtual responsiva para produtos impressos em 3D, com painel administrativo, autenticacao segura, recuperacao de senha, 2FA TOTP, Mercado Pago preparado e persistencia em Supabase.

## Tecnologias

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase Postgres + Supabase Storage
- API Routes do Next.js
- `bcryptjs` para hash de senha
- `otplib` + `qrcode` para 2FA TOTP
- `nodemailer` para SMTP

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e configure:

```env

```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend. O app usa essa chave apenas em rotas server-side e em `src/lib/supabase.ts`.

## Supabase

Crie um projeto no Supabase e execute a migracao:

```sql
-- Arquivo completo em supabase/migrations/001_initial_schema.sql
```

O SQL cria:

- `admin_users`
- `password_reset_tokens`
- `products`
- `security_events`
- `two_factor_recovery_codes`, tabela auxiliar para manter codigos de recuperacao do 2FA

### Bucket de imagens

No painel do Supabase:

1. Acesse **Storage**.
2. Crie um bucket chamado `product-images`.
3. Marque o bucket como **Public** para que as imagens dos produtos possam ser exibidas na loja.

Opcional via SQL:

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;
```

O upload e feito pelo servidor com `SUPABASE_SERVICE_ROLE_KEY`. O frontend nunca recebe essa chave.

## Primeiro admin

Na primeira tentativa de login, se a tabela `admin_users` estiver vazia, o app cria o admin inicial usando:

```env
AUTH_ADMIN_EMAIL
AUTH_INITIAL_ADMIN_PASSWORD
```

A senha precisa cumprir a politica de senha forte. A senha inicial padrao de desenvolvimento e:

```text
E-mail: admin@a7-3dlab.local
Senha: A7-Admin-2026!
```

Depois do primeiro login, troque a senha em `/seguranca`.

## Autenticacao

O painel `/admin` e protegido por cookie HTTP-only assinado com `AUTH_SESSION_SECRET`.

Recursos incluidos:

- Login administrativo em `/login`
- Troca de senha em `/seguranca`
- Recuperacao em `/esqueci-senha`
- Redefinicao em `/redefinir-senha?token=...`
- Hash bcrypt de senha
- Tokens de recuperacao armazenados apenas como hash
- Rate limit em login, recuperacao, redefinicao, troca de senha e 2FA
- Logs de eventos suspeitos em `security_events`
- 2FA TOTP com QR Code e codigos de recuperacao

## E-mail

Configure SMTP para enviar e-mails reais:

```env
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="A7-3DLAB <contato@seudominio.com>"
```

Sem SMTP, o app imprime o conteudo do e-mail no log do servidor. Ele nao grava mais e-mails em arquivos locais.

## Produtos e imagens

Produtos ficam na tabela `products`. O painel `/admin` permite criar, editar e excluir produtos.

Campos:

- Nome
- Descricao
- Categoria
- Preco
- Fotos
- Quantidade disponivel
- Produto personalizado ou produto pronto
- Destaque na pagina inicial

Ao selecionar imagens no painel, o servidor envia os arquivos para o bucket `product-images` e salva as URLs publicas no array `products.images`.

## Como rodar localmente

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

Build:

```bash
pnpm build
```

## Publicar no Netlify

1. Envie o projeto para um repositorio Git.
2. No Netlify, conecte o repositorio.
3. Configure:
   - Build command: `pnpm build`
   - Publish directory: `.next`
4. Instale/ative o suporte do Netlify para Next.js se solicitado.
5. Cadastre todas as variaveis de ambiente do Supabase, auth, SMTP, WhatsApp, Instagram e Mercado Pago em **Site configuration > Environment variables**.
6. Em producao, defina `NEXT_PUBLIC_SITE_URL` com a URL publica do Netlify.

## Mercado Pago

Por padrao, o botao **Comprar** usa checkout mock em `/checkout-mock`. Para ativar a chamada real:

1. Preencha `MERCADO_PAGO_ACCESS_TOKEN`.
2. Ajuste `NEXT_PUBLIC_SITE_URL`.
3. Defina `MERCADO_PAGO_USE_MOCK=false`.

O token privado fica apenas em codigo server-side, em `src/services/mercado-pago.ts`.

## Proximos passos sugeridos

- Criar webhooks do Mercado Pago para confirmar pagamento.
- Adicionar tabela de pedidos e status de producao.
- Criar politicas RLS especificas se decidir acessar produtos diretamente pelo cliente anonimo.
