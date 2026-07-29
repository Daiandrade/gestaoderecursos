# ✅ Sistema Migrado para Backend Local

## 🔄 O que foi feito

O sistema foi **migrado de Appwrite (nuvem) para Backend Local (SQLite)** para resolver o problema de compatibilidade com os novos status e campos.

### Mudanças Aplicadas

1. ✅ **authService** → Usa backend local (`/api/auth`)
2. ✅ **resourcesService** → Usa backend local (`/api/resources`)
3. ✅ **productsService** → Usa backend local (`/api/products`)
4. ✅ **expensesService** → Usa backend local (`/api/expenses`)
5. ✅ **Login** → Usa username ao invés de email
6. ✅ **Banco de dados** → SQLite com estrutura atualizada (novos status e campos)

### Arquivos Modificados

**Serviços (frontend/src/services/):**
- `authService.js` → Versão local
- `resourcesService.js` → Versão local
- `productsService.js` → Versão local
- `expensesService.js` → Versão local

**Páginas (frontend/src/pages/):**
- `Login.js` → Campo "Usuário" ao invés de "Email"

### Backups Criados

Os arquivos Appwrite originais foram salvos com sufixo `-appwrite.backup.js`:
- `authService-appwrite.backup.js`
- `resourcesService-appwrite.backup.js`
- `productsService-appwrite.backup.js`
- `expensesService-appwrite.backup.js`

## 🌐 Como Acessar

**URL**: http://localhost:3000

**Credenciais**:
```
Usuário: admin
Senha: admin123
```

## ✨ Funcionalidades Disponíveis

Agora que está usando o backend local com SQLite, você tem acesso a:

### Status de Recursos
- 🟢 **Ativo** - Operação normal
- 🟡 **Urgente** - Requer atenção
- ⚪ **Inativo** - Fora de operação

### Novos Campos
- 📅 **start_date** - Data de início da alocação
- 📅 **end_date** - Data de término da alocação
- 💰 **planned_value** - Valor planejado
- 💰 **actual_value** - Valor real (calculado das despesas)

### Dashboard Atualizado
- Cards separados por status
- Comparação planejado vs. real
- Indicadores visuais de variação
- Estatísticas por status

## 🔧 Backend Local vs Appwrite

| Característica | Backend Local (Atual) | Appwrite (Anterior) |
|----------------|----------------------|---------------------|
| Banco de dados | SQLite (arquivo local) | Cloud database |
| Autenticação | JWT | Appwrite Auth |
| Tempo real | ❌ Não | ✅ Sim |
| Estrutura | Totalmente atualizada | Desatualizada |
| Controle | Total | Limitado |

## 📝 Diferenças na Autenticação

### Backend Local (Atual)
```javascript
// Login
POST /api/auth/login
Body: { username, password }
Response: { token, user }

// Token é armazenado em localStorage
// Enviado em todas as requisições via header Authorization
```

### Appwrite (Anterior)
```javascript
// Login
account.createEmailPasswordSession(email, password)
// Sessão gerenciada pelo Appwrite SDK
```

## 🚀 Próximos Passos

1. **Teste o login** com `admin` / `admin123`
2. **Crie/edite recursos** usando os novos status
3. **Explore o Dashboard** com as novas visualizações
4. **Adicione períodos e valores** aos recursos existentes

## 🔙 Reverter para Appwrite (Se Necessário)

Se por algum motivo você precisar voltar para Appwrite:

```bash
# Na pasta frontend/src/services/
cp authService-appwrite.backup.js authService.js
cp resourcesService-appwrite.backup.js resourcesService.js
cp productsService-appwrite.backup.js productsService.js
cp expensesService-appwrite.backup.js expensesService.js

# Depois reinicie o frontend
cd frontend
npm start
```

⚠️ **Nota**: Para usar Appwrite novamente, você precisará atualizar a estrutura da coleção lá também.

## ⚙️ Configuração

O backend local usa:
- **Porta**: 5000
- **Banco**: `backend/database.sqlite`
- **JWT Secret**: Definido em `backend/.env`

O frontend conecta em:
- **API URL**: `http://localhost:5000` (desenvolvimento)
- **URL relativa** (produção)

---

**Data da migração**: 02/06/2026  
**Versão**: 2.0.0 (Backend Local)
