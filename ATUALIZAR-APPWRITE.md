# 🔧 Atualizar Estrutura no Appwrite

## ⚠️ Problema Atual

Você está vendo o erro:
```
Invalid document structure: Attribute "status" has invalid format. 
Value must be one of (active, inactive)
```

**Causa**: A coleção "resources" no Appwrite ainda está configurada com os status antigos (`active`, `inactive`) e precisa ser atualizada para aceitar os novos status (`ativo`, `urgente`, `inativo`).

## 📋 Solução: Atualizar Coleção no Appwrite

### Passo 1: Acessar o Painel Appwrite

1. Acesse: https://nyc.cloud.appwrite.io/console
2. Faça login na sua conta
3. Selecione o projeto: **ID `6a1601ab0027b2b90173`**

### Passo 2: Atualizar Atributo "status"

1. No menu lateral, clique em **"Databases"**
2. Selecione o database: **`gesstao_recursos`** (note: tem typo no nome)
3. Clique na coleção: **`resources`**
4. Vá para a aba **"Attributes"**
5. Localize o atributo **`status`**
6. Clique no ícone de **editar** (lápis) ao lado de `status`
7. Na configuração do tipo **Enum**, atualize os valores para:
   ```
   ativo
   urgente
   inativo
   ```
8. Defina o valor padrão como: **`ativo`**
9. Clique em **"Update"**

### Passo 3: Adicionar Novos Atributos (Campos)

Ainda na coleção `resources`, adicione os seguintes atributos:

#### 3.1. Campo: start_date (Data de Início)
- Clique em **"Create Attribute"**
- Tipo: **DateTime**
- Key: `start_date`
- Label: `Data de Início`
- Required: ❌ (NÃO obrigatório)
- Array: ❌
- Default: (vazio)
- Clique em **"Create"**

#### 3.2. Campo: end_date (Data de Término)
- Clique em **"Create Attribute"**
- Tipo: **DateTime**
- Key: `end_date`
- Label: `Data de Término`
- Required: ❌ (NÃO obrigatório)
- Array: ❌
- Default: (vazio)
- Clique em **"Create"**

#### 3.3. Campo: planned_value (Valor Planejado)
- Clique em **"Create Attribute"**
- Tipo: **Float** (ou Double)
- Key: `planned_value`
- Label: `Valor Planejado`
- Required: ❌ (NÃO obrigatório)
- Array: ❌
- Min: 0
- Default: 0
- Clique em **"Create"**

### Passo 4: Atualizar Documentos Existentes

Após adicionar os campos, você precisa atualizar os documentos (recursos) existentes para usar os novos status:

1. Ainda na coleção `resources`
2. Vá para a aba **"Documents"**
3. Para cada documento que tem `status: "active"`:
   - Clique no documento
   - Edite o campo `status` para `"ativo"`
   - Salve
4. Para cada documento que tem `status: "inactive"`:
   - Clique no documento
   - Edite o campo `status` para `"inativo"`
   - Salve

**OU** use a API do Appwrite para fazer isso em massa (mais rápido).

### Passo 5: Testar a Aplicação

1. Volte para o sistema: http://localhost:3000
2. Tente criar ou editar um recurso
3. O erro não deve mais aparecer!

---

## 🚀 Alternativa: Script de Migração Appwrite

Se preferir automatizar a atualização dos documentos existentes, posso criar um script que:

1. Conecta no Appwrite
2. Lista todos os recursos
3. Atualiza `active` → `ativo` e `inactive` → `inativo`
4. Adiciona valores padrão para os novos campos

Gostaria que eu crie esse script para você? Responda "sim" e eu crio o script de migração.

---

## 📝 Resumo das Mudanças Necessárias

| Campo | Ação | Configuração |
|-------|------|--------------|
| `status` | ✏️ Editar | Enum: `ativo`, `urgente`, `inativo` (padrão: `ativo`) |
| `start_date` | ➕ Adicionar | DateTime, opcional |
| `end_date` | ➕ Adicionar | DateTime, opcional |
| `planned_value` | ➕ Adicionar | Float/Double, opcional, padrão: 0 |

---

## ⚠️ Importante

- **Faça backup** antes de fazer mudanças estruturais
- Os documentos existentes precisam ter o campo `status` atualizado manualmente
- Os novos campos (`start_date`, `end_date`, `planned_value`) podem ficar vazios/zero nos registros antigos

---

## 🆘 Precisa de Ajuda?

Se preferir, posso:
1. ✅ Criar um script de migração automática
2. ✅ Fornecer comandos curl para usar a API do Appwrite
3. ✅ Criar um painel admin no sistema para fazer a migração

Me avise como prefere proceder! 🚀
