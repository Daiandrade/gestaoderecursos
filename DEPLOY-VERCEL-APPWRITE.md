# 🚀 Deploy Completo - Vercel + Appwrite

Guia passo a passo do início ao fim.

## ✅ Status Atual

- [x] Código adaptado para Appwrite
- [x] Vercel configurado (`vercel.json`)
- [x] Credenciais Appwrite no `.env`
- [ ] Collections criadas no Appwrite (você faz)
- [ ] Código no GitHub (você faz)
- [ ] Deploy na Vercel (você faz)

---

## 📋 ORDEM DE EXECUÇÃO

### 1️⃣ Criar Collections no Appwrite

**Siga o arquivo `APPWRITE-SETUP.md`** - lá tem todas as instruções para criar:
- Database `gestao_recursos`
- 5 collections (`products`, `resources`, `expenses`, `history`, `user_profiles`)
- Adicionar os 4 produtos iniciais
- Criar seu usuário admin

⏱️ **Tempo estimado**: 20-30 minutos (criar collections com seus atributos é o trabalho maior)

---

### 2️⃣ Testar Localmente

Antes de subir pro GitHub, vamos garantir que tudo funciona local:

```bash
cd frontend
npm start
```

Acesse: http://localhost:3000

1. Faça login com o email do usuário admin que você criou no Appwrite
2. Verifique se aparece o dashboard com os 4 produtos
3. Tente criar um recurso
4. Tente criar uma despesa

Se algo der erro, me avise antes de continuar.

---

### 3️⃣ Subir Código para o GitHub

#### Se ainda não tem Git instalado:
- Baixe em https://git-scm.com/download/win e instale (Next, Next, Next)

#### Criar repositório no GitHub:

1. Acesse https://github.com e faça login
2. Canto superior direito → **+ → New repository**
3. **Repository name**: `gestao-recursos-tr`
4. **Privacy**: 🔒 **PRIVATE** (importante!)
5. **NÃO** marque "Initialize with README"
6. Clique em **Create repository**

#### Subir o código (no terminal/PowerShell do projeto):

```bash
git init
git add .
git commit -m "Versão inicial - Sistema de Gestão de Recursos"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/gestao-recursos-tr.git
git push -u origin main
```

> ⚠️ **Atenção**: O `.env` **NÃO** vai pro GitHub (já está no `.gitignore`). As credenciais ficam só no seu PC e na Vercel.

---

### 4️⃣ Deploy no Vercel

1. Acesse https://vercel.com
2. **Sign Up** com sua conta GitHub
3. No dashboard, clique em **Add New → Project**
4. Selecione o repositório `gestao-recursos-tr`
5. Em **Configure Project**:
   - **Framework Preset**: Other (Vercel detecta automaticamente)
   - **Root Directory**: deixe `./` (padrão)
   - **Build Command**: deixe o padrão (já está configurado no `vercel.json`)

6. **Environment Variables** — Adicione TODAS estas (importante!):

   | Name | Value |
   |------|-------|
   | `REACT_APP_APPWRITE_ENDPOINT` | `https://nyc.cloud.appwrite.io/v1` |
   | `REACT_APP_APPWRITE_PROJECT_ID` | `6a1601ab0027b2b90173` |
   | `REACT_APP_APPWRITE_DATABASE_ID` | `gestao_recursos` |
   | `REACT_APP_APPWRITE_PRODUCTS_COLLECTION` | `products` |
   | `REACT_APP_APPWRITE_RESOURCES_COLLECTION` | `resources` |
   | `REACT_APP_APPWRITE_EXPENSES_COLLECTION` | `expenses` |
   | `REACT_APP_APPWRITE_HISTORY_COLLECTION` | `history` |
   | `REACT_APP_APPWRITE_USER_PROFILES_COLLECTION` | `user_profiles` |

7. Clique em **Deploy**

Aguarde ~2-3 minutos. Quando terminar, você terá uma URL tipo:
`https://gestao-recursos-tr.vercel.app`

---

### 5️⃣ Autorizar Domínio Vercel no Appwrite

⚠️ **IMPORTANTE**: Sem isso, o sistema não consegue se conectar do domínio público.

1. No painel Appwrite, vá em **Settings → Domains** (ou Platforms)
2. Clique em **Add platform → Web**
3. **Name**: `Vercel Production`
4. **Hostname**: `gestao-recursos-tr.vercel.app` (use o seu domínio Vercel)
5. **Register**

Se você mudar o domínio na Vercel, adicione o novo aqui também.

---

### 6️⃣ Testar em Produção

1. Acesse `https://gestao-recursos-tr.vercel.app`
2. Login com o email/senha admin
3. ✅ Sistema funcionando online!

---

## 👥 Como Adicionar os Gerentes da Equipe

Para cada gerente (Tax One, SAP, OBI, DF-e):

### Passo 1: Criar conta no Appwrite

1. Appwrite Console → **Auth → Users → Create user**
2. **Email**: email TR do gerente
3. **Password**: senha temporária (ex: `TR2026!`)
4. **Create**
5. **Copie o User ID** gerado

### Passo 2: Criar perfil no sistema

1. No sistema (logado como admin), acesse **Usuários**
2. Clique em **+ Novo Perfil**
3. Cole o **User ID**
4. Preencha nome, email, role = `Gerente de Produto`
5. Selecione o produto correspondente
6. Salvar

### Passo 3: Compartilhar acesso

Envie pro gerente:
- 🌐 URL: `https://gestao-recursos-tr.vercel.app`
- 📧 Email cadastrado
- 🔑 Senha temporária (pedir para trocar no primeiro acesso)

---

## 🔄 Atualizações Futuras

Quando você quiser mudar algo no código:

```bash
# Faça as alterações
git add .
git commit -m "Descrição da mudança"
git push
```

**Vercel detecta automaticamente** e faz o deploy em ~1 minuto.

---

## 🎨 Domínio Customizado (Opcional)

Quer usar `recursos.suaempresa.com` em vez de `*.vercel.app`?

1. Compre um domínio (Registro.br, Namecheap, etc.)
2. Vercel → Project → Settings → Domains
3. Adicione o domínio
4. Aponte o DNS do domínio para Vercel (instruções aparecem lá)

---

## ⚡ Realtime Funcionando

O sistema já está com **Realtime habilitado**. Quando dois gerentes estão logados ao mesmo tempo:

- Um cria uma despesa → o outro vê **automaticamente** sem F5
- Um edita um recurso → todos veem na hora
- Dashboard atualiza em tempo real

---

## 🆘 Problemas Comuns

### "Não consigo fazer login"
- Verifique se criou o perfil em `user_profiles` no Appwrite
- O `user_id` no perfil deve ser EXATAMENTE igual ao ID do usuário em Auth

### "CORS error" ou "Failed to fetch"
- Adicione o domínio Vercel em Appwrite → Platforms

### "Permission denied" ao salvar
- Verifique as permissões das collections no painel Appwrite
- Deve estar: Role `Users` com Read + Create + Update + Delete

### Build falha na Vercel
- Verifique se todas as variáveis de ambiente estão configuradas
- Veja os logs do build em Vercel → Deployments → [deploy] → View Function Logs

---

## 📊 Limites Free Tier

### Vercel Free
- 100GB bandwidth/mês
- Builds ilimitados
- HTTPS automático
- **Suficiente para 10 usuários:** Sim, muito sobra

### Appwrite Free
- 75.000 usuários
- 5GB storage
- 10GB bandwidth/mês
- Realtime ilimitado
- **Suficiente para 10 usuários:** Sim, muito sobra

**Custo total mensal: R$ 0** 🎉

---

## ✅ Checklist Final

- [ ] Collections criadas no Appwrite (`APPWRITE-SETUP.md`)
- [ ] 4 produtos populados
- [ ] Usuário admin criado (Auth + perfil)
- [ ] Testado localmente (`cd frontend && npm start`)
- [ ] Repositório GitHub criado (privado)
- [ ] Código pushed para GitHub
- [ ] Projeto Vercel criado com variáveis de ambiente
- [ ] Domínio Vercel adicionado nas Platforms do Appwrite
- [ ] Login funcionando em produção
- [ ] Gerentes da equipe cadastrados
- [ ] URL compartilhada com a equipe
