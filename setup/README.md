# 🚀 Setup Automático do Appwrite

Em vez de criar tudo manualmente no painel (5 collections, 30+ atributos, índices...), rode esse script e tudo é criado em **30 segundos**.

## 📋 Pré-requisitos

- Node.js instalado
- Projeto criado no Appwrite Cloud
- 1 API Key do Appwrite (instruções abaixo)

---

## 🔑 PASSO 1 — Criar API Key no Appwrite (2 minutos)

A API Key dá permissão pro script criar tudo automaticamente. Use APENAS para o setup, depois pode deletar.

1. Acesse https://cloud.appwrite.io
2. Entre no seu projeto `gestao-recursos-tr`
3. Menu lateral esquerdo → **Overview** → role para baixo até **"Integrations"** ou
   - Menu lateral → **Settings** → **API Keys** → **Create API Key**
4. **Name**: `Setup Script`
5. **Expiration**: `Never` (ou 1 dia)
6. **Scopes** - marque TODOS estes:
   - ✅ `databases.read`
   - ✅ `databases.write`
   - ✅ `collections.read`
   - ✅ `collections.write`
   - ✅ `attributes.read`
   - ✅ `attributes.write`
   - ✅ `indexes.read`
   - ✅ `indexes.write`
   - ✅ `documents.read`
   - ✅ `documents.write`
   - ✅ `users.read`
   - ✅ `users.write`
7. Clique em **Create**
8. **Copie a key gerada** (começa com `standard_...`)

---

## ⚙️ PASSO 2 — Configurar e Rodar

```bash
# Entrar na pasta setup
cd setup

# Instalar dependências (uma vez só)
npm install

# Copiar o exemplo de .env
copy .env.example .env

# Editar .env e colar sua API Key no campo APPWRITE_API_KEY
notepad .env

# Rodar o setup
node setup.js
```

Você verá saída como:
```
============================================================
  Setup Automático - Sistema de Gestão de Recursos TR
============================================================
📦 Criando database...
  ✓ Database "gestao_recursos"

📋 Configurando collection: products
  ✓ Collection "Products"
  ✓ Attribute: name
  ✓ Attribute: description
  ✓ Index: name_index

👤 Configurando collection: user_profiles
  ✓ Collection "User Profiles"
  ... (continua para todas as collections)

🌱 Populando produtos iniciais...
  ✓ Tax One
  ✓ Tax One For SAP
  ✓ Integrações-OBI
  ✓ DF-e

✅ Setup concluído com sucesso!
```

---

## 👑 PASSO 3 — Criar Usuário Admin

Em vez de criar manualmente no painel, use:

```bash
node create-admin.js seu.email@thomsonreuters.com SuaSenha123 "Seu Nome Completo"
```

Pronto! Já pode fazer login no sistema com esse email e senha.

---

## 👥 PASSO 4 — Criar Gerentes (Opcional)

Para cada gerente de produto:

```bash
node create-manager.js joao@tr.com Senha123 "João Silva" "Tax One"
node create-manager.js maria@tr.com Senha123 "Maria Santos" "Tax One For SAP"
node create-manager.js pedro@tr.com Senha123 "Pedro Costa" "Integrações-OBI"
node create-manager.js ana@tr.com Senha123 "Ana Lima" "DF-e"
```

**Produtos válidos** (use exatamente assim):
- `"Tax One"`
- `"Tax One For SAP"`
- `"Integrações-OBI"`
- `"DF-e"`

---

## 🧪 PASSO 5 — Testar o Sistema

```bash
cd ../frontend
npm start
```

Acesse http://localhost:3000 e faça login!

---

## 🔒 Segurança Pós-Setup

**Após terminar o setup**, recomendo:

1. Voltar no Appwrite Console → Settings → API Keys
2. **Deletar** a API Key que criou (`Setup Script`)
3. O sistema não precisa mais dela — só o frontend conecta agora

---

## 🆘 Problemas Comuns

### "APPWRITE_API_KEY não configurada"
- Você precisa criar o arquivo `.env` na pasta `setup/` com a API Key

### "Permission denied" ou "401 Unauthorized"
- A API Key não tem todos os scopes. Recrie marcando TODOS os scopes de `databases` e `users`

### "Attribute already exists" / "Collection already exists"
- Normal se rodar duas vezes. O script trata como "já existia" e continua.

### "Failed to fetch" ou erro de rede
- Confira se o `APPWRITE_ENDPOINT` no `.env` está correto

---

## 📦 O Que Foi Criado

Após rodar tudo, você terá:

```
Appwrite Project
├── Database: gestao_recursos
│   ├── Collection: products (4 documentos)
│   ├── Collection: user_profiles
│   ├── Collection: resources
│   ├── Collection: expenses
│   └── Collection: history
└── Auth
    └── Usuário admin (se rodou create-admin.js)
```

Tudo configurado, permissões certas, pronto para usar!
