# 💒 Casamento SaaS

Plataforma de planejamento de casamento multi-tenant.

## Stack

- **Backend:** Express + Prisma + PostgreSQL
- **Frontend:** React + Vite + TailwindCSS
- **Deploy:** Docker + docker-compose

## Funcionalidades

- Multi-tenant por slug (`/joao-e-maria`)
- Site público personalizável (cores, capa, descrição)
- Área admin com login por senha
- **Convidados** — CRUD, RSVP, filtros por status/lado/categoria
- **Fornecedores** — 7 categorias, status de pagamento, valor de contrato
- **Orçamento** — estimado vs real, totais, marcação de pago
- **Cronograma** — tarefas com prioridade, progresso, filtros

## Rodar local

```bash
# Banco
docker run -d --name casamento-db --network coolify \
  -e POSTGRES_USER=bolo -e POSTGRES_PASSWORD=*** -e POSTGRES_DB=casamento_saas \
  postgres:16-alpine

# Instalar deps
cd backend && npm install && npx prisma@5 generate
cd ../frontend && npm install

# Seed (precisa de bcrypt hash)
# Backend
cd backend && DATABASE_URL="postgresql://bolo:***@...casamento-db:5432/casamento_saas" node src/server.js

# Frontend
cd frontend && npm run dev
```

## Demo

- Público: http://localhost:5173/demo
- Admin: http://localhost:5173/demo/admin/login (senha: `admin123`)
