# ✅ Solução Rápida - Erro de Status

## 🔴 Erro que Você Está Vendo

```
Invalid document structure: Attribute "status" has invalid format. 
Value must be one of (active, inactive)
```

## 🎯 Solução em 3 Passos

### Passo 1: Atualizar Estrutura no Appwrite (⏱️ ~5 minutos)

1. **Acesse**: https://nyc.cloud.appwrite.io/console
2. **Login** na sua conta Appwrite
3. **Selecione** o projeto (ID: `6a1601ab0027b2b90173`)
4. Vá em: **Databases** → `gesstao_recursos` → Coleção `resources` → Aba **Attributes**

#### 1.1. Atualizar Atributo "status"
- Clique no **ícone de editar** (✏️) ao lado de `status`
- **Mude os valores** do Enum para:
  ```
  ativo
  urgente  
  inativo
  ```
- **Valor padrão**: `ativo`
- Clique em **"Update"**

#### 1.2. Adicionar 3 Novos Atributos

Clique em **"Create Attribute"** para cada um:

| Key | Tipo | Obrigatório | Padrão |
|-----|------|-------------|--------|
| `start_date` | DateTime | ❌ Não | (vazio) |
| `end_date` | DateTime | ❌ Não | (vazio) |
| `planned_value` | Float | ❌ Não | 0 |

⚠️ **Importante**: Aguarde alguns segundos após cada criação para a estrutura ser atualizada.

---

### Passo 2: Migrar Dados Existentes (⏱️ ~1 minuto)

Depois de atualizar a estrutura, execute:

```bash
node migrate-appwrite.js
```

Este script irá automaticamente:
- ✅ Converter `active` → `ativo`
- ✅ Converter `inactive` → `inativo`
- ✅ Adicionar valores padrão para os novos campos

---

### Passo 3: Testar (⏱️ ~30 segundos)

1. Volte para: http://localhost:3000
2. Tente criar ou editar um recurso
3. ✅ O erro não deve mais aparecer!

---

## 🆘 Se Ainda Houver Erro

### Se o script de migração falhar:

**Erro de autenticação?**
- Verifique se o `Project ID` está correto em `frontend/.env`

**Erro "Attribute not found"?**
- Certifique-se de ter **completado o Passo 1** (atualizar estrutura no Appwrite)
- Aguarde ~30 segundos para o Appwrite processar as mudanças
- Tente executar o script novamente

### Se o erro persistir no navegador:

1. **Limpe o cache** do navegador (Ctrl + Shift + R)
2. **Reinicie o servidor** frontend:
   ```bash
   # Pressione Ctrl+C para parar
   cd frontend
   npm start
   ```
3. Tente novamente

---

## 📞 Precisa de Ajuda?

Se encontrar dificuldades:
1. Consulte o guia detalhado: `ATUALIZAR-APPWRITE.md`
2. Verifique os logs do script de migração
3. Verifique no painel Appwrite se os atributos foram criados corretamente

---

## ✨ Depois da Migração

Você terá acesso às novas funcionalidades:
- 🟢 Status **Ativo** (operação normal)
- 🟡 Status **Urgente** (requer atenção)
- ⚪ Status **Inativo** (fora de operação)
- 📅 Período de alocação (início e término)
- 💰 Valores planejado vs. real

Aproveite! 🚀
