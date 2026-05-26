# 🚀 Colocar em Produção (Guia Rápido)

**Pré-requisito**: Você já rodou `node setup.js` com sucesso ✅

---

## 1️⃣ Criar seu usuário admin (2 min)

```bash
cd setup
node create-admin.js seu.email@thomsonreuters.com SuaSenha123 "Seu Nome"
```

Pronto! Já tem acesso admin.

---

## 2️⃣ Testar localmente (2 min)

```bash
cd ../frontend
npm install
npm start
```

- Acesse http://localhost:3000
- Faça login com o email/senha que criou
- Teste criar produto, recurso, despesa
- Se funcionou, pode seguir!

---

## 3️⃣ Criar repositório GitHub (3 min)

1. Acesse https://github.com/new
2. **Nome**: `gestao-recursos-tr` (ou o que preferir)
3. **Visibilidade**: ✅ **Private** (importante!)
4. **Não** adicione README/gitignore (já temos)
5. Clique em **Create repository**

6. Copie os comandos mostrados e rode na pasta do projeto:

```bash
git init
git add .
git commit -m "Setup inicial completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/gestao-recursos-tr.git
git push -u origin main
```

---

## 4️⃣ Deploy no Vercel (5 min)

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em **Add New** → **Project**
3. Importe o repositório `gestao-recursos-tr`
4. **Framework Preset**: Create React App
5. **Root Directory**: Deixe em branco (raiz)
6. **Build Command**: `cd frontend && npm install && npm run build`
7. **Output Directory**: `frontend/build`

8. **Environment Variables** — adicione TODAS estas:

```
REACT_APP_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=6a1601ab0027b2b90173
REACT_APP_APPWRITE_DATABASE_ID=gestao_recursos
REACT_APP_APPWRITE_PRODUCTS_COLLECTION=products
REACT_APP_APPWRITE_RESOURCES_COLLECTION=resources
REACT_APP_APPWRITE_EXPENSES_COLLECTION=expenses
REACT_APP_APPWRITE_HISTORY_COLLECTION=history
REACT_APP_APPWRITE_USER_PROFILES_COLLECTION=user_profiles
```

9. Clique em **Deploy**

Aguarde 2-3 minutos. Você receberá uma URL tipo: `https://gestao-recursos-tr.vercel.app`

---

## 5️⃣ Conectar Vercel ao Appwrite (2 min)

1. Copie a URL do Vercel (ex: `https://gestao-recursos-tr.vercel.app`)
2. Acesse https://cloud.appwrite.io
3. Abra seu projeto `gestao-recursos-tr`
4. Menu lateral → **Settings** → **Platforms**
5. Clique em **Add Platform** → **Web**
6. **Name**: `Produção`
7. **Hostname**: Cole a URL do Vercel (SEM https://)
8. Clique em **Create**

Pronto! Agora o frontend pode se conectar ao Appwrite.

---

## 6️⃣ Testar em produção (1 min)

- Acesse a URL do Vercel
- Faça login com seu email/senha
- Teste criar algo

Funcionou? **Sistema no ar!** 🎉

---

## 7️⃣ Criar contas para os gerentes (5 min)

Para cada gerente de produto, rode:

```bash
cd setup
node create-manager.js joao@tr.com Senha123 "João Silva" "Tax One"
node create-manager.js maria@tr.com Senha123 "Maria Santos" "Tax One For SAP"
node create-manager.js pedro@tr.com Senha123 "Pedro Costa" "Integrações-OBI"
node create-manager.js ana@tr.com Senha123 "Ana Lima" "DF-e"
```

Envie o email/senha para cada gerente. Eles já podem acessar!

---

## 8️⃣ Compartilhar acesso

Mande para a equipe:

```
Sistema de Gestão de Recursos TR
🔗 https://gestao-recursos-tr.vercel.app

Seu login:
📧 Email: seu.email@tr.com
🔑 Senha: SuaSenha123

Após o primeiro login, recomendo trocar a senha:
Menu → Perfil → Alterar Senha
```

---

## ✅ Resumo do que foi criado

- **Database**: Appwrite Cloud (grátis)
- **Frontend**: Vercel (grátis, 100GB/mês)
- **Usuários**: 1 admin + 4 gerentes
- **Produtos**: Tax One, Tax One For SAP, Integrações-OBI, DF-e
- **Funcionalidades**: Recursos, Jobs, Despesas, Histórico

**Custos**: R$ 0,00 (free tier)

---

## 🔧 Atualizações futuras

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Vercel detecta automaticamente e faz deploy em 2-3 minutos.

---

## 🆘 Problemas?

- **Erro de login**: Confira se adicionou o domínio Vercel no Appwrite (passo 5)
- **"Failed to fetch"**: Verifique as variáveis de ambiente no Vercel (passo 4)
- **Gerente vê todos os produtos**: O script criou com role errado. Delete o perfil no Appwrite Console e recrie.

Dúvidas? Veja os arquivos:
- `setup/README.md` — Setup detalhado do Appwrite
- `DEPLOY-VERCEL-APPWRITE.md` — Guia completo de deploy
