# Changelog - Sistema de Gestão de Recursos

## [2.0.0] - 2026-06-02

### ✨ Novos Recursos

#### Status Expandido para Recursos
- **Ativo**: Recursos operando normalmente
- **Urgente**: Recursos que requerem atenção imediata
- **Inativo**: Recursos fora de operação

#### Período de Alocação
- Campo `start_date`: Data de início da alocação
- Campo `end_date`: Data de término da alocação
- Visualização do período na tabela e detalhes

#### Gestão Financeira
- **Valor Planejado** (`planned_value`): Valor estimado para o recurso
- **Valor Real** (`actual_value`): Calculado automaticamente das despesas lançadas
- **Comparação**: Percentual realizado vs. planejado
- Indicadores visuais de status (dentro/acima do planejado)

### 🎨 Melhorias no Dashboard

#### Cards de Status
- Card separado para cada status (Ativo, Urgente, Inativo)
- Contadores individuais com cores distintas
- Percentuais em relação ao total

#### Visualização Financeira
- Card com valor planejado total
- Card com valor real (despesas) total
- Card de variação com indicador visual
- Comparação percentual automática

#### Seção Recursos por Status
- Cards visuais grandes com gradiente
- Contadores destacados para cada status
- Percentuais individuais calculados

### 📝 Página de Recursos

#### Tabela Expandida
- Nova coluna: **Período** (exibe datas de início/término)
- Nova coluna: **Valor Planejado**
- Nova coluna: **Valor Real** (calculado das despesas)
- Status atualizado com 3 opções + badges coloridos

#### Formulário de Recurso
- Campos de data: Início e Término da alocação
- Campo numérico: Valor Planejado (R$)
- Dropdown de status com 3 opções
- Dicas contextuais

#### Modal de Detalhes
- Seção de Período de Alocação formatada
- Seção de Valores com comparação visual
- Indicador de percentual realizado
- Cores dinâmicas (verde/vermelho) baseadas em excedentes

### 🗄️ Banco de Dados

#### Migração Automática
- Script `migrate-database.js` para atualização segura
- Preservação de todos os dados existentes
- Conversão automática: `active` → `ativo`, `inactive` → `inativo`
- Adiciona colunas: `start_date`, `end_date`, `planned_value`

#### Modelo Atualizado
- `status`: CHECK constraint com 3 valores
- `start_date`: DATE (opcional)
- `end_date`: DATE (opcional)
- `planned_value`: DECIMAL(10,2) com padrão 0

### 🔧 Backend

#### Model Resource
- Métodos `create` e `update` suportam novos campos
- Query `getWithExpenses` retorna `actual_value` calculado
- Validação de status expandido

#### Rotas
- Todas as rotas de recursos suportam novos campos
- Cálculo automático de `actual_value` em queries

### 📚 Documentação

#### README Atualizado
- Instruções de migração do banco
- Descrição dos novos status
- Fluxo de uso atualizado
- Lista de funcionalidades expandida

#### Novo Arquivo
- `CHANGELOG.md`: Histórico de alterações

### 🎯 Compatibilidade

- ✅ Dados existentes são preservados na migração
- ✅ Campos novos têm valores padrão seguros
- ✅ Status antigos são convertidos automaticamente
- ✅ API permanece compatível com código existente

### 📋 Próximos Passos Recomendados

1. **Backup**: Faça backup do banco antes de migrar
2. **Migração**: Execute `node migrate-database.js`
3. **Testes**: Verifique se todos os recursos foram migrados
4. **Configuração**: Defina períodos e valores planejados para recursos existentes
5. **Monitoramento**: Acompanhe a variação planejado vs. real no Dashboard

---

## Como Migrar de Versão Anterior

Se você já tem um banco de dados com recursos cadastrados:

```bash
# 1. Fazer backup (opcional mas recomendado)
cp backend/database.sqlite backend/database.sqlite.backup

# 2. Executar migração
node migrate-database.js

# 3. Iniciar aplicação normalmente
npm run dev
```

A migração é **idempotente** - pode ser executada múltiplas vezes sem problemas.

---

**Versão**: 2.0.0  
**Data**: 02/06/2026  
**Desenvolvedor**: Sistema de IA Claude
