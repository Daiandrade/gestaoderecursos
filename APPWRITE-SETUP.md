# 🔧 Configuração do Appwrite Cloud

Guia passo a passo para criar Database e Collections no painel Appwrite.

## ✅ Pré-requisitos
- Conta criada em https://cloud.appwrite.io
- Projeto `gestao-recursos-tr` criado
- Plataforma Web adicionada com hostname `localhost`

---

## 📁 PASSO 1 — Criar o Database

1. No menu lateral esquerdo, clique em **Databases**
2. Clique em **Create database**
3. Preencha:
   - **Database ID**: `gestao_recursos`
   - **Name**: `Gestão de Recursos`
4. Clique em **Create**

---

## 📋 PASSO 2 — Criar as Collections

Dentro do database `gestao_recursos`, crie as 5 collections abaixo.

---

### 🟢 Collection 1: `products`

1. Clique em **Create collection**
2. **Collection ID**: `products`
3. **Name**: `Products`
4. Crie a permissão de leitura para qualquer usuário logado:
   - Aba **Settings** → **Permissions**
   - Adicione: **Role: Users** → Permissões: ✅ Read

5. Crie os **Attributes**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `name` | String | 100 | ✅ Sim | - |
| `description` | String | 500 | ❌ Não | - |

6. Crie um **Index**:
   - Key: `name_index`
   - Type: `key`
   - Attributes: `name` (ASC)

---

### 🟢 Collection 2: `user_profiles`

Guarda dados extras dos usuários (role, produto vinculado).

1. **Create collection**
2. **Collection ID**: `user_profiles`
3. **Name**: `User Profiles`
4. **Permissions**: 
   - Role: **Users** → ✅ Read, ✅ Create
   - Role: **Users** → Permission Level: **Document** (cada um vê só seu próprio)

5. **Attributes**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `user_id` | String | 50 | ✅ Sim | - |
| `username` | String | 100 | ✅ Sim | - |
| `email` | Email | - | ✅ Sim | - |
| `role` | Enum | - | ✅ Sim | `product_manager` |
| `product_id` | String | 50 | ❌ Não | - |

> Para `role`: Type **Enum**, valores: `admin`, `product_manager`

6. **Indexes**:
   - `user_id_index`: type `unique`, attribute `user_id`
   - `product_id_index`: type `key`, attribute `product_id`

---

### 🟢 Collection 3: `resources`

1. **Create collection**
2. **Collection ID**: `resources`
3. **Name**: `Resources`
4. **Permissions**:
   - Role: **Users** → ✅ Read, ✅ Create, ✅ Update, ✅ Delete

5. **Attributes**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `name` | String | 150 | ✅ Sim | - |
| `product_id` | String | 50 | ✅ Sim | - |
| `job_title` | String | 200 | ✅ Sim | - |
| `job_description` | String | 5000 | ❌ Não | - |
| `allocation_percentage` | Integer | - | ❌ Não | 100 |
| `status` | Enum | - | ✅ Sim | `active` |

> Para `status`: Type **Enum**, valores: `active`, `inactive`
> Para `allocation_percentage`: Type **Integer**, Min: 0, Max: 100

6. **Indexes**:
   - `product_id_index`: type `key`, attribute `product_id`
   - `status_index`: type `key`, attribute `status`

---

### 🟢 Collection 4: `expenses`

1. **Create collection**
2. **Collection ID**: `expenses`
3. **Name**: `Expenses`
4. **Permissions**:
   - Role: **Users** → ✅ Read, ✅ Create, ✅ Update, ✅ Delete

5. **Attributes**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `resource_id` | String | 50 | ✅ Sim | - |
| `product_id` | String | 50 | ✅ Sim | - |
| `month` | Integer | - | ✅ Sim | - |
| `year` | Integer | - | ✅ Sim | - |
| `amount` | Float | - | ✅ Sim | - |
| `description` | String | 500 | ❌ Não | - |
| `created_by` | String | 50 | ❌ Não | - |
| `created_by_name` | String | 100 | ❌ Não | - |

> Para `month`: Min 1, Max 12

6. **Indexes**:
   - `resource_id_index`: type `key`, attribute `resource_id`
   - `product_id_index`: type `key`, attribute `product_id`
   - `year_month_index`: type `key`, attributes `year` (DESC), `month` (DESC)

---

### 🟢 Collection 5: `history`

Registro de auditoria.

1. **Create collection**
2. **Collection ID**: `history`
3. **Name**: `History`
4. **Permissions**:
   - Role: **Users** → ✅ Read, ✅ Create

5. **Attributes**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `table_name` | String | 50 | ✅ Sim | - |
| `record_id` | String | 50 | ✅ Sim | - |
| `action` | Enum | - | ✅ Sim | - |
| `old_values` | String | 2000 | ❌ Não | - |
| `new_values` | String | 2000 | ❌ Não | - |
| `changed_by` | String | 50 | ❌ Não | - |
| `changed_by_name` | String | 100 | ❌ Não | - |

> Para `action`: Type **Enum**, valores: `create`, `update`, `delete`

6. **Indexes**:
   - `record_index`: type `key`, attributes `table_name`, `record_id`

---

## 🌱 PASSO 3 — Popular Dados Iniciais

Após criar todas as collections, popule os 4 produtos iniciais.

### Como adicionar os produtos:

1. Vá em `products` collection
2. Clique em **Create document** (4 vezes, um por vez)

Documento 1:
- **name**: `Tax One`
- **description**: `Sistema Tax One`

Documento 2:
- **name**: `Tax One For SAP`
- **description**: `Tax One integrado com SAP`

Documento 3:
- **name**: `Integrações-OBI`
- **description**: `Integrações OBI`

Documento 4:
- **name**: `DF-e`
- **description**: `Sistema DF-e`

⚠️ **Importante**: Anote os IDs gerados de cada produto (aparecem no canto direito após salvar). Vai usar depois para vincular os gerentes aos produtos.

---

## 👤 PASSO 4 — Habilitar Autenticação Email/Senha

1. No menu lateral esquerdo, clique em **Auth**
2. Aba **Settings**
3. Em **Auth Methods**, certifique-se que **Email/Password** está habilitado
4. (Opcional) Em **Security**, desabilite "Email Verification" temporariamente para testes

---

## 🔐 PASSO 5 — Criar Usuário Admin

1. Vá em **Auth** → **Users**
2. Clique em **Create user**
3. Preencha:
   - **Email**: seu email TR (ex: `seu.nome@thomsonreuters.com`)
   - **Password**: senha forte
4. Após criar, **copie o User ID** que aparece (vai precisar)

### Criar perfil admin do usuário:

5. Vá em **Databases** → `gestao_recursos` → `user_profiles`
6. **Create document**:
   - **user_id**: (cole o User ID copiado)
   - **username**: `admin` (ou seu nome de usuário)
   - **email**: (seu email)
   - **role**: `admin`
   - **product_id**: (deixe vazio)

---

## ✅ Checklist Final

Antes de testar o sistema, confirme:

- [ ] Database `gestao_recursos` criado
- [ ] Collection `products` criada com 4 documentos (Tax One, SAP, OBI, DF-e)
- [ ] Collection `user_profiles` criada
- [ ] Collection `resources` criada
- [ ] Collection `expenses` criada
- [ ] Collection `history` criada
- [ ] Auth Email/Password habilitado
- [ ] Usuário admin criado em Auth → Users
- [ ] Perfil admin criado em user_profiles (vinculando ao User ID)
- [ ] Plataforma Web `localhost` adicionada

---

## ⚡ Habilitar Realtime

O Realtime do Appwrite vem **habilitado por padrão** para todas as collections. Não precisa fazer nada extra! As mudanças vão aparecer automaticamente no sistema.

---

## 🎯 Próximos Passos

Após completar este setup, me avise para eu finalizar a adaptação do código frontend e te ajudar com o deploy no Vercel.
