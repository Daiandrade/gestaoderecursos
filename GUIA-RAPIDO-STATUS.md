# Guia Rápido - Status e Gestão Financeira de Recursos

## 📋 Visão Geral

Este guia explica como usar as novas funcionalidades de status expandido, período de alocação e gestão financeira (planejado vs. real).

## 🚦 Status de Recursos

### Três Status Disponíveis

#### 🟢 Ativo
- **Quando usar**: Recurso operando normalmente
- **Significado**: Pessoa trabalhando ativamente no produto
- **Visualização**: Badge verde no Dashboard e tabelas

#### 🟡 Urgente
- **Quando usar**: Recurso que requer atenção imediata
- **Exemplos de uso**:
  - Recurso com previsão de saída em breve
  - Necessidade de substituição urgente
  - Problema de performance ou engajamento
  - Recurso crítico em risco
- **Visualização**: Badge amarelo com destaque no Dashboard

#### ⚪ Inativo
- **Quando usar**: Recurso fora de operação
- **Exemplos de uso**:
  - Recurso que já saiu do projeto
  - Licença prolongada
  - Transferido para outro produto
- **Visualização**: Badge cinza

## 📅 Período de Alocação

### Quando Preencher

- **Data Início**: Quando o recurso começou ou vai começar a trabalhar no produto
- **Data Término**: 
  - Para alocações temporárias: data prevista de saída
  - Para recursos permanentes: pode deixar em branco
  - Para recursos inativos: data em que saíram

### Dicas de Uso

```
✅ Bom uso:
- Consultor com contrato de 6 meses: preencher início e término
- Funcionário permanente: preencher apenas início
- Recurso já desligado: status "Inativo" + data término preenchida

❌ Evitar:
- Deixar ambos em branco (dificulta planejamento)
- Data término no passado com status "Ativo"
```

## 💰 Gestão Financeira

### Valor Planejado

**O que é**: Valor estimado/orçado para o recurso

**Como definir**:
1. Calcule o custo mensal do recurso (salário + encargos)
2. Multiplique pelo número de meses de alocação
3. Insira no campo "Valor Planejado"

**Exemplo**:
```
Recurso: João Silva
Custo mensal: R$ 15.000,00
Período: 6 meses (Jan a Jun/2026)
Valor Planejado: R$ 90.000,00
```

### Valor Real (Calculado)

**O que é**: Soma automática de todas as despesas lançadas para o recurso

**Como funciona**:
- Você lança despesas mensais na tela "Despesas"
- O sistema soma automaticamente
- Exibe na coluna "Valor Real"

**Não precisa preencher manualmente!**

### Comparação Planejado vs. Real

#### No Dashboard
- Card "Variação" mostra percentual geral
- Verde: dentro do planejado
- Vermelho: acima do planejado

#### Na Tabela de Recursos
- Cada recurso mostra seus valores
- Comparação visual no modal de detalhes

#### No Modal de Detalhes
```
Valores
Planejado: R$ 90.000,00
Real (Despesas): R$ 85.500,00
95.0% do planejado ✅
```

## 🎯 Fluxo Recomendado

### 1. Cadastrar Novo Recurso

```
1. Acesse "Recursos" → "+ Novo Recurso"
2. Preencha:
   - Nome completo
   - Produto
   - Cargo
   - Data início ✨
   - Data término (se temporário) ✨
   - Alocação %
   - Status: "Ativo" ✨
   - Valor Planejado ✨
3. Salvar
```

### 2. Lançar Despesas Mensais

```
1. Acesse "Despesas"
2. Selecione produto e ano
3. Para cada recurso/mês:
   - Clique "+ Nova Despesa"
   - Selecione o recurso
   - Escolha mês
   - Insira valor real gasto
   - Adicione descrição (opcional)
4. Salvar
```

### 3. Monitorar no Dashboard

```
Dashboard mostra automaticamente:
- ✅ Quantos recursos ativos
- ⚠ Quantos recursos urgentes (precisam atenção)
- ⏸ Quantos recursos inativos
- 💰 Valor total planejado
- 💰 Valor total real (despesas)
- 📊 Variação % (está no orçamento?)
```

### 4. Marcar Recurso como Urgente

```
Quando identificar problema:
1. Edite o recurso
2. Mude status para "Urgente"
3. Salvar

O recurso aparecerá:
- No card amarelo do Dashboard
- Com badge amarelo na listagem
```

### 5. Desativar Recurso

```
Quando recurso sair:
1. Edite o recurso
2. Preencha "Data Término" (se ainda não tiver)
3. Mude status para "Inativo"
4. Salvar

O recurso vai para o card cinza do Dashboard
```

## 📊 Relatórios e Análises

### Dashboard - Seção "Recursos por Status"

Exibe cards grandes com:
- Número de recursos em cada status
- Percentual em relação ao total
- Cores distintas para fácil identificação

### Tabela de Recursos

- Filtro por status (dropdown)
- Ordenação por qualquer coluna
- Visão consolidada: período + valores + status

### Modal de Detalhes

- Informações completas do recurso
- Período formatado
- Comparação financeira visual
- Indicador de % realizado

## ⚠️ Atenção

### Migração de Dados

Se você já tinha recursos cadastrados:
- Status "active" → convertido para "ativo"
- Status "inactive" → convertido para "inativo"
- Campos novos iniciam vazios (datas) ou zerados (valor planejado)
- **Recomendação**: Atualize os recursos existentes com as novas informações

### Boas Práticas

✅ **Fazer**:
- Atualizar status regularmente
- Marcar como "Urgente" quando houver risco
- Preencher datas de início ao cadastrar
- Definir valor planejado baseado em orçamento real
- Lançar despesas todo mês

❌ **Evitar**:
- Deixar recursos inativos como "Ativo"
- Ignorar o status "Urgente" (perde o propósito)
- Deixar campos vazios sem necessidade
- Esquecer de lançar despesas (valor real fica defasado)

## 🆘 Dúvidas Frequentes

**P: O que acontece se não preencher "Valor Planejado"?**  
R: O sistema funciona normalmente, mas você perde a comparação planejado vs. real.

**P: Posso mudar o status de um recurso depois?**  
R: Sim! Edite o recurso a qualquer momento e altere o status.

**P: O "Valor Real" é editável?**  
R: Não. Ele é calculado automaticamente das despesas. Para alterar, edite as despesas lançadas.

**P: Posso ter um recurso com data término mas status "Ativo"?**  
R: Sim. Por exemplo: recurso temporário que ainda está trabalhando mas já tem data de saída definida.

**P: Quando usar "Urgente" vs "Inativo"?**  
R: "Urgente" = recurso ainda está trabalhando mas há um problema. "Inativo" = recurso já saiu/parou.

---

**Versão**: 2.0.0  
**Atualizado em**: 02/06/2026
