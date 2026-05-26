# Sistema de Gestão de Recursos de Produtos

Sistema completo para organização e gerenciamento de recursos de produtos, com controle de despesas mensais, jobs description e sistema de permissões por produto.

## Funcionalidades

### Principais
- ✅ Gerenciamento de 4 produtos: Tax One, Tax One For SAP, Integrações-OBI e DF-e
- ✅ Cadastro de recursos (pessoas/profissionais) por produto
- ✅ Jobs Description com cargo e descrição de função
- ✅ Conta corrente para registro de despesas mensais
- ✅ Histórico de alterações de valores
- ✅ Gráficos e relatórios de gastos
- ✅ Sistema de autenticação com JWT
- ✅ Controle de acesso por produto (Admin vs Product Manager)

### Usuários
- **Admin**: Acesso total a todos os produtos e funcionalidades
- **Product Manager**: Acesso restrito ao seu produto específico

## Tecnologias Utilizadas

### Backend
- Node.js
- Express
- SQLite (banco de dados)
- JWT (autenticação)
- bcryptjs (criptografia de senhas)

### Frontend
- React
- React Router
- Axios
- Recharts (gráficos)

## Instalação

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Passo a Passo

1. **Instalar dependências**

```bash
# Instalar dependências do projeto raiz
npm install

# Instalar dependências do backend e frontend
npm run install-all
```

2. **Inicializar o banco de dados**

```bash
cd backend
npm run init-db
```

Isso criará o banco de dados SQLite com:
- Tabelas necessárias
- 4 produtos pré-cadastrados
- Usuário admin padrão

3. **Iniciar a aplicação**

```bash
# Voltar para a raiz do projeto
cd ..

# Iniciar backend e frontend simultaneamente
npm run dev
```

Ou iniciar separadamente:

```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend
npm run frontend:dev
```

## Acesso ao Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Credenciais Padrão

```
Usuário: admin
Senha: admin123
```

## Estrutura do Projeto

```
.
├── backend/
│   ├── src/
│   │   ├── config/        # Configuração do banco de dados
│   │   ├── middleware/    # Middleware de autenticação
│   │   ├── models/        # Modelos de dados
│   │   ├── routes/        # Rotas da API
│   │   └── server.js      # Servidor principal
│   ├── .env               # Variáveis de ambiente
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Context API (Auth)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Serviços (API)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── package.json           # Scripts do projeto
```

## Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/me` - Obter usuário atual

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/:id` - Atualizar produto (admin)

### Recursos
- `GET /api/resources` - Listar recursos
- `GET /api/resources/product/:productId` - Recursos por produto
- `GET /api/resources/:id` - Buscar recurso
- `POST /api/resources` - Criar recurso
- `PUT /api/resources/:id` - Atualizar recurso
- `DELETE /api/resources/:id` - Deletar recurso

### Despesas
- `GET /api/expenses/resource/:resourceId` - Despesas por recurso
- `GET /api/expenses/product/:productId` - Despesas por produto
- `GET /api/expenses/product/:productId/monthly/:year` - Totais mensais
- `GET /api/expenses/product/:productId/yearly` - Comparação anual
- `POST /api/expenses` - Criar despesa
- `PUT /api/expenses/:id` - Atualizar despesa
- `DELETE /api/expenses/:id` - Deletar despesa
- `GET /api/expenses/:id/history` - Histórico de alterações

### Usuários (apenas admin)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

## Fluxo de Uso

### 1. Login
- Acesse http://localhost:3000
- Faça login com as credenciais padrão ou com um usuário criado

### 2. Dashboard
- Visualize estatísticas gerais
- Veja gráficos de recursos e despesas por produto

### 3. Gerenciar Recursos
- Acesse "Recursos" no menu
- Cadastre recursos (pessoas) com cargo e descrição
- Defina alocação percentual
- Marque status (ativo/inativo)

### 4. Registrar Despesas
- Acesse "Despesas" no menu
- Selecione o produto e ano
- Visualize gráfico de evolução mensal
- Registre despesas mensais por recurso
- Consulte histórico de alterações

### 5. Gerenciar Usuários (Admin)
- Acesse "Usuários" no menu (apenas admin)
- Crie usuários tipo "Admin" ou "Gerente de Produto"
- Atribua produtos aos gerentes

## Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Controle de acesso baseado em roles
- Validação de permissões por produto
- Histórico de alterações auditável

## Variáveis de Ambiente

Backend (.env):
```
PORT=5000
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_mude_em_producao
NODE_ENV=development
DB_PATH=./database.sqlite
```

## Suporte

Para reportar bugs ou sugerir melhorias, entre em contato com a equipe de desenvolvimento.

## Licença

Uso interno - Thomson Reuters
