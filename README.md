# PerFisio

Diretório de fisioterapeutas e clínicas + CRM e sistema de gestão completo — **full-stack**.

- **Frontend:** HTML/CSS/JS puro (sem frameworks, sem build)
- **Backend:** Node.js + Express + PostgreSQL (`server/server.js`)
- **Auth:** JWT (bcrypt para senhas) · multi-tenant por clínica
- **Deploy:** Dokploy (app + Postgres) · imagem Docker pelo GitHub Actions · produção: https://www.perfisio.com.br

## Como funciona

1. **Cadastro** (`login.html#registro`): cria a clínica + usuário gestor + fisioterapeuta, já com biblioteca de 18 exercícios e 5 pacotes padrão (seed).
2. **Perfil público** (Configurações): com o perfil visível, a clínica aparece no diretório da landing (`/api/public/perfis`).
3. **Captação**: visitante pede avaliação na landing → vira lead no CRM (`/api/public/leads`) → arrastado até "Convertido" vira paciente automaticamente.
4. **Operação**: agenda com recorrência e check-in (incrementa sessões do pacote), prontuário SOAP, prescrição de exercícios, financeiro (pagamentos/pacotes/convênios), equipe com comissões, relatórios calculados dos dados reais.

## Estrutura

```
server/server.js      Express: API REST /api/* + serve o site estático + migrations no boot
login.html            Login / criar conta
index.html            Landing pública (diretório dinâmico)
app/*.html            Sistema (10 páginas, todas ligadas à API)
assets/js/api.js      Camada de acesso à API (fetch + JWT em localStorage)
assets/js/sidebar.js  Shell do app + guarda de autenticação
```

## API (resumo)

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/me`
- `GET|PUT /api/clinica` — dados + perfil público (jsonb)
- `GET|POST /api/usuarios`
- CRUD genérico escopado por clínica: `fisios, pacientes, leads, sessoes, evolucoes, exercicios, prescricoes, pacotes, pagamentos, convenios`
- `PATCH /api/sessoes/:id/status` — realizada/falta (atualiza contador do paciente)
- `POST /api/leads/:id/converter` — lead → paciente
- Públicas: `GET /api/public/perfis` · `POST /api/public/leads`

## Rodar localmente

```bash
npm install
DATABASE_URL=postgres://... JWT_SECRET=qualquer node server/server.js
# http://localhost:3000
```

O schema é criado/verificado automaticamente no boot (`CREATE TABLE IF NOT EXISTS`).

## Deploy (Dokploy)

O workflow `.github/workflows/deploy.yml` constrói a imagem (`Dockerfile`, Alpine + node 22) e, em push na `main`, envia
`container-registry.br-se1.magalu.cloud/conjunta-registry/perfisio` com as tags `:latest` e `:sha-<commit>` e chama a API do Dokploy.
Em pull request só constrói. Secrets do repositório: `MGC_REGISTRY_USERNAME`, `MGC_REGISTRY_PASSWORD`, `DOKPLOY_URL`,
`DOKPLOY_APP_ID`, `DOKPLOY_API_KEY` (sem os `DOKPLOY_*` a imagem é enviada e o deploy é pulado).
Rollback: no Dokploy, troque a tag da imagem para `sha-<commit>` e faça o deploy.

No Dokploy: Application com Provider **Docker**, porta **3000**, sem volume (anexos ficam no Postgres como `bytea`),
mais um serviço **PostgreSQL** cuja *Internal Connection URL* vai em `DATABASE_URL`. O schema é criado no primeiro boot
(`CREATE TABLE IF NOT EXISTS`), então um banco vazio funciona sem passo manual.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `DATABASE_URL` | obrigatória (URL interna do Postgres do Dokploy, sem TLS). `DATABASE_SSL=true` liga TLS para Postgres externo |
| `JWT_SECRET` | obrigatória em produção (segredo forte; sem ela usa um segredo de desenvolvimento e avisa no log) |
| `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | cria/sincroniza o superadmin em cada boot (`/admin`) |
| `SITE_HOST` | `www.perfisio.com.br`: ativa a separação site / app e o redirect do apex para o www |
| `APP_HOST` | `app.perfisio.com.br` (login e painel; alvo do CNAME dos domínios das clínicas) |
| `SHORT_HOST` | `perfis.io` (links curtos `perfis.io/<usuario>`; padrão já é este) |
| `APP_URL` | `https://app.perfisio.com.br` (links em e-mails e retorno da Stripe) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | assinaturas (opcionais) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | e-mail (opcionais, ver abaixo) |
| `GOOGLE_CLIENT_ID` | login com Google (opcional) |
| `MAPBOX_TOKEN` | mapa (opcional) |
| `LOJA_DESCONTO_FISIO` | % de desconto da loja para quem usa o sistema (padrão 5) |

`PORT` (3000) e `NODE_ENV` já vêm na imagem. Hosts `*.traefik.me` (domínio de teste do Dokploy) contam como host do
sistema: servem o app inteiro sem os redirects de `SITE_HOST`. Para testar, deixe `SITE_HOST` vazio.

### Domínios próprios das clínicas

A clínica salva o domínio em Configurações → Domínio próprio e aponta o DNS (CNAME) para `APP_HOST`. Não há integração
com a API do Dokploy: o domínio precisa ser **adicionado à mão** em Dokploy → Application → Domains (porta 3000, HTTPS,
Let's Encrypt). Ao salvar, o servidor registra um aviso no log e responde `registro.automatico = false`.
O cadastro da clínica não falha por causa disso.

## E-mail (módulo Marketing)

O envio real de campanhas usa SMTP via nodemailer. Configure no app do Dokploy:

- `SMTP_HOST`, `SMTP_PORT` (587 ou 465), `SMTP_USER`, `SMTP_PASS`
- `SMTP_FROM` (opcional, ex.: `"Clínica Movimente" <contato@movimente.com.br>`)

Sem essas variáveis, as campanhas são registradas como **simuladas** (nada é enviado).
Exemplos de provedor: Gmail (senha de app), Brevo, Resend SMTP, Amazon SES.

## Anexos do prontuário

Fotos (JPG/PNG/WebP) e PDFs até 8 MB, armazenados como `bytea` no Postgres — sem
dependência de S3. O arquivo é servido em `/api/anexos/:id/arquivo` com autenticação
por header ou `?t=<jwt>` (para `<img src>`).

## Pendências conhecidas

- Lembretes por WhatsApp são um ponto de integração futuro (ex.: Z-API / Twilio).
