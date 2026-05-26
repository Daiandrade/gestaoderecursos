# Guia Rápido de Início

## Instalação Rápida (3 minutos)

### 1. Instalar tudo
```bash
# Na raiz do projeto
npm install
npm run install-all
```

### 2. Criar e popular banco de dados
```bash
cd backend
npm run init-db
npm run seed
cd ..
```

### 3. Iniciar aplicação
```bash
npm run dev
```

Pronto! Acesse http://localhost:3000

## Credenciais de Teste

### Administrador (acesso total)
- **Username**: `admin`
- **Password**: `admin123`

### Gerentes de Produto
| Username | Password | Produto |
|----------|----------|---------|
| manager_taxone | senha123 | Tax One |
| manager_sap | senha123 | Tax One For SAP |
| manager_obi | senha123 | Integrações-OBI |
| manager_dfe | senha123 | DF-e |

## Dados de Exemplo

O comando `npm run seed` cria automaticamente:
- ✅ 4 produtos pré-configurados
- ✅ 5 usuários (1 admin + 4 gerentes)
- ✅ 9 recursos (pessoas) distribuídos pelos produtos
- ✅ Despesas dos últimos 6 meses para cada recurso

## Comandos Úteis

```bash
# Instalar dependências
npm run install-all

# Inicializar banco (cria estrutura e admin)
cd backend && npm run init-db

# Popular com dados de exemplo
cd backend && npm run seed

# Iniciar ambos (backend + frontend)
npm run dev

# Iniciar apenas backend
npm run backend:dev

# Iniciar apenas frontend
npm run frontend:dev
```

## Testando o Sistema

### Como Admin:
1. Login com `admin / admin123`
2. Veja dashboard com todos os produtos
3. Gerencie recursos de qualquer produto
4. Acesse "Usuários" para criar novos usuários

### Como Gerente de Produto:
1. Login com um dos gerentes (ex: `manager_taxone / senha123`)
2. Veja apenas dados do seu produto
3. Gerencie recursos do seu produto
4. Registre despesas mensais

## Fluxo Típico de Uso

1. **Login** → Use admin ou um gerente
2. **Dashboard** → Visualize estatísticas e gráficos
3. **Produtos** → Veja informações dos produtos
4. **Recursos** → Cadastre pessoas/profissionais
   - Nome, cargo, descrição
   - Alocação percentual (50%, 100%, etc.)
   - Status (ativo/inativo)
5. **Despesas** → Registre gastos mensais
   - Selecione produto e ano
   - Veja gráfico de evolução
   - Adicione despesas por recurso/mês
   - Consulte histórico de alterações

## Estrutura de Permissões

| Ação | Admin | Product Manager |
|------|-------|-----------------|
| Ver todos os produtos | ✅ | ❌ (só o seu) |
| Ver recursos | ✅ Todos | ❌ Só do seu produto |
| Criar/editar recursos | ✅ | ✅ (só do seu produto) |
| Ver despesas | ✅ Todas | ❌ Só do seu produto |
| Registrar despesas | ✅ | ✅ (só do seu produto) |
| Gerenciar usuários | ✅ | ❌ |
| Criar produtos | ✅ | ❌ |

## Problemas Comuns

### Porta 3000 ou 5000 já em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou mude a porta no .env (backend) ou package.json (frontend)
```

### Banco de dados corrompido
```bash
cd backend
rm database.sqlite
npm run init-db
npm run seed
```

### Erro de permissão ao criar recurso/despesa
- Verifique se está logado com usuário correto
- Product Manager só pode acessar seu próprio produto
- Use admin para acesso total

## Próximos Passos

- [ ] Explorar todos os produtos no Dashboard
- [ ] Criar recursos para cada produto
- [ ] Registrar despesas mensais
- [ ] Visualizar gráficos de evolução
- [ ] Criar novos usuários (como admin)
- [ ] Testar controle de acesso (login como gerente)

## Suporte

Para dúvidas ou problemas:
1. Consulte o README.md completo
2. Verifique os logs do terminal
3. Entre em contato com a equipe de desenvolvimento
