# SaaS de Casamento - Plano de Implementação

> **Para Hermes:** Construir direto, sem delegar.

**Objetivo:** SaaS multi-tenant de planejamento de casamento com gestão de convidados, fornecedores, orçamento e cronograma.

**Stack:** Node.js/Express/Prisma/PostgreSQL (backend) + React/Vite/Tailwind/shadcn (frontend) + Docker

**Arquitetura:** 1 backend + 1 banco + frontend template com VITE_WEDDING_SLUG. Cada casamento acessado por slug na URL.

---

## Estrutura

```
/root/casamento-saas/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── server.js
│   │   ├── lib/prisma.js
│   │   ├── routes/
│   │   │   ├── wedding.js
│   │   │   ├── guests.js
│   │   │   ├── vendors.js
│   │   │   ├── budget.js
│   │   │   └── timeline.js
│   │   └── middleware/auth.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/api.js
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yaml
```

## Models

### Wedding (tenant)
- id, slug (único, ex: "joao-e-maria")
- coupleName, partner1Name, partner2Name
- weddingDate, location, description
- primaryColor, accentColor
- logo, coverImage
- isPublic (site público visível)
- adminPassword (bcrypt)

### Guest
- id, weddingId, name, email, phone
- side (GROOM/BRIDE/BOTH)
- category (FAMILY/FRIEND/COWORKER/OTHER)
- rsvpStatus (PENDING/CONFIRMED/DECLINED/MAYBE)
- plusOne (bool), plusOneName
- tableNumber, dietaryRestrictions
- invitedToCeremony, invitedToReception
- notes

### Vendor
- id, weddingId, name, category (VENUE/CATERING/PHOTOGRAPHY/MUSIC/FLOWERS/DRESS/OTHER)
- contactName, email, phone, website
- contractValue, paidAmount, paymentStatus (PENDING/PARTIAL/PAID)
- notes, rating (1-5)

### BudgetItem
- id, weddingId, category, description
- estimatedAmount, actualAmount
- isPaid, paidDate, vendorId (nullable FK)
- notes

### TimelineTask
- id, weddingId, title, description
- dueDate, completedAt
- status (PENDING/IN_PROGRESS/DONE)
- category (BEFORE_WEDDING/WEDDING_DAY/AFTER_WEDDING)
- priority (LOW/MEDIUM/HIGH)
- assignedTo, notes

---

## Tarefas

### Task 1: Scaffold do projeto
- Criar estrutura backend + frontend
- package.json, Dockerfile, docker-compose

### Task 2: Schema Prisma + migrate
- schema.prisma com todos os models
- db push

### Task 3: Backend - server + auth + wedding routes
- Express server, CORS
- Auth middleware (JWT)
- Wedding CRUD + login público

### Task 4: Backend - guests routes
- CRUD completo
- Filtro por status, lado, categoria

### Task 5: Backend - vendors routes
- CRUD completo
- Status de pagamento

### Task 6: Backend - budget routes
- CRUD completo
- Totais por categoria

### Task 7: Backend - timeline routes
- CRUD completo
- Filtro por status

### Task 8: Frontend scaffold
- Vite + Tailwind + shadcn
- Layout base + rotas

### Task 9: Frontend - páginas
- Landing pública (slug)
- Dashboard admin
- CRUD guests, vendors, budget, timeline

### Task 10: Docker + deploy
- Dockerfile backend + frontend
- docker-compose para dev
---

## MVP entregável
- Sistema funcional com todos os CRUDs
- Acessível via http://localhost:5173/{slug}
- Admin com senha
- Página pública do casal
