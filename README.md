# CECI FUNCIONALIDADES

Servico Node.js 22 + TypeScript para garantir que atendimentos assumidos por vendedores nao fiquem mais de 15 minutos sem resposta.

Quando uma sessao em `WAITING_SELLER` expira, o worker chama `transferSession(sessionId)` e, em caso de sucesso, marca o registro como `RETURNED_TO_QUEUE`.

## Stack

- Node.js 22
- TypeScript
- Fastify
- Supabase
- Redis
- Axios
- Pino
- node-cron
- dotenv

## Fluxo

### POST /webhook

Eventos aceitos:

- `SESSION_UPDATE`
  - Se `property = Status` e a mudanca for `PENDING -> IN_PROGRESS`, ou se houver mudanca em `UserId`, a sessao passa a ser monitoravel.
  - Salva `status = IN_PROGRESS`.
- `MESSAGE_RECEIVED`
  - Se a sessao estiver `IN_PROGRESS` ou `SELLER_RESPONDED`, salva `status = WAITING_SELLER` e `expires_at = now + 15 minutos`.
- `MESSAGE_SENT`
  - Se `origin = BOT`, ignora.
  - Se `origin = DEFAULT` e `userId` estiver preenchido, salva `status = SELLER_RESPONDED` e `expires_at = null`.
- `SESSION_COMPLETE`
  - Salva `status = CLOSED`.

### Worker

Com `REDIS_ENABLED=true`, o Redis controla o temporizador com TTL:

- cliente envia mensagem: cria/reinicia `ceci:timer:{clientId}:{sessionId}` com TTL do cliente
- atendente responde: apaga a chave do timer
- chave expira: worker Redis transfere o atendimento

Com `REDIS_ENABLED=false`, o cron antigo continua como fallback. Ele executa a cada 60 segundos por padrao e consulta:

- `status = WAITING_SELLER`
- `expires_at <= now`

Para cada sessao expirada:

1. Chama `transferSession(sessionId)`.
2. Atualiza `status = RETURNED_TO_QUEUE` apos sucesso.

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Principais variaveis:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WTS_TRANSFER_SESSION_URL`
- `WTS_API_TOKEN`
- `SESSION_TIMEOUT_MINUTES`
- `WORKER_CRON`
- `REDIS_ENABLED`
- `REDIS_URL`

`WTS_TRANSFER_SESSION_URL` usa a API FLW/CECI de transferencia de conversa. Exemplo:

```text
https://api.wts.chat/chat/v1/session/{id}/transfer
```

O servico faz uma chamada `PUT`, substitui `{id}` ou `{sessionId}` pelo ID da conversa e envia:

```json
{
  "type": "DEPARTMENT",
  "newDepartmentId": "id-da-fila",
  "newUserId": null,
  "options": {}
}
```

`WTS_API_TOKEN` e enviado no header `Authorization: Bearer ...`.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Redis local

Para usar timer preciso com Redis:

1. Suba um Redis local. Com Docker:

```bash
docker run --name ceci-redis -p 6379:6379 redis:7-alpine redis-server --notify-keyspace-events Ex
```

2. No `.env`, habilite:

```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

3. Reinicie o sistema:

```bash
npm run dev
```

No Docker Compose, o Redis ja esta incluido e o app usa `REDIS_URL=redis://redis:6379`.

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker compose up --build
```

## Healthcheck

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "ceci-funcionalidades"
}
```

## Tabela Supabase

Antes de usar o painel, rode o script `supabase/schema.sql` no SQL Editor do Supabase. Ele cria:

- `automation_settings`
- `automation_clients`
- `webhook_logs`
- `session_timeout`

O worker usa `session_timeout` com os campos:

- `session_id`
- `company_id`
- `department_id`
- `user_id`
- `status`
- `expires_at`
- `created_at`
- `updated_at`

Recomendacao para producao: garantir indice em `status, expires_at` e unicidade em `session_id`.
