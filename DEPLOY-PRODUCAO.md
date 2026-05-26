# Guia de Deploy em Produção

Sistema de Gestão de Recursos - Thomson Reuters

## 📋 Pré-requisitos

No servidor Windows onde será hospedado:

- [ ] **Windows Server 2016+** ou **Windows 10/11 Pro**
- [ ] **Node.js 16+** instalado ([download](https://nodejs.org/))
- [ ] **Porta 5000** liberada no firewall interno
- [ ] **~500MB de espaço em disco**
- [ ] Acesso administrador (para instalar como serviço)

## 🚀 Deploy em 3 Passos

### Passo 1 — Copiar arquivos para o servidor

Copie a pasta do projeto para o servidor, ex:
```
C:\Aplicacoes\TR-GestaoRecursos\
```

> ⚠️ **Não copie a pasta `node_modules`** - será recriada no servidor.
> ⚠️ **Não copie `database.sqlite`** se for um novo ambiente.

### Passo 2 — Build de produção

No servidor, abra o **Prompt de Comando** na pasta do projeto e execute:

```cmd
build-producao.bat
```

Isso faz:
1. Instala dependências do backend (produção)
2. Instala dependências do frontend (build)
3. Gera o build otimizado do React (`frontend/build/`)

Tempo estimado: **3-5 minutos**

### Passo 3 — Iniciar 24/7 como Serviço Windows

**Clique com botão direito** em `install-service.bat` → **Executar como administrador**

Isso vai:
- Instalar o sistema como serviço Windows chamado `TR-GestaoRecursos`
- Iniciar o serviço automaticamente
- Configurar para iniciar com o Windows
- Reiniciar automaticamente em caso de falha

✅ **Pronto!** Acesse `http://localhost:5000` no servidor ou `http://NOME-SERVIDOR:5000` da rede.

---

## 🔧 Gerenciamento do Serviço

### Pelo Painel de Serviços (interface gráfica)

1. Pressione `Windows + R`, digite `services.msc` e Enter
2. Procure por **`TR-GestaoRecursos`**
3. Clique direito para Iniciar / Parar / Reiniciar

### Por linha de comando (como Administrador)

```cmd
REM Iniciar
net start TR-GestaoRecursos

REM Parar
net stop TR-GestaoRecursos

REM Status
sc query TR-GestaoRecursos

REM Reiniciar
net stop TR-GestaoRecursos && net start TR-GestaoRecursos
```

### Logs do Serviço

Os logs ficam em:
```
service\daemon\TR-GestaoRecursos.out.log    (saída padrão)
service\daemon\TR-GestaoRecursos.err.log    (erros)
```

---

## 🌐 Acesso pela Rede

Após o deploy, o sistema fica acessível em:

- **No servidor**: `http://localhost:5000`
- **Da rede**: `http://NOME-DO-SERVIDOR:5000` ou `http://IP-DO-SERVIDOR:5000`

### Liberando porta no Firewall

Se a porta não estiver acessível pela rede, execute como administrador:

```cmd
netsh advfirewall firewall add rule name="TR-GestaoRecursos" dir=in action=allow protocol=TCP localport=5000
```

### Configurando nome amigável (opcional)

Para acessar via `http://recursos-tr/` em vez do IP, você precisa:
- Pedir ao time de redes/TI para criar um registro DNS interno
- Ou adicionar ao arquivo `hosts` de cada cliente: `192.168.X.X recursos-tr`

---

## 🔐 Segurança em Produção

### 1. Alterar senha do admin (PRIMEIRA COISA A FAZER!)

A senha padrão `admin123` deve ser alterada. Por enquanto, faça via banco:

```cmd
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NOVA_SENHA_FORTE', 10))"
```

Copie o hash gerado e atualize no banco:

```cmd
sqlite3 database.sqlite "UPDATE users SET password='HASH_AQUI' WHERE username='admin';"
```

### 2. JWT Secret

O arquivo `backend\.env` contém o `JWT_SECRET`. Verifique que:
- ✅ Tem pelo menos 32 caracteres aleatórios
- ✅ NÃO está versionado no Git
- ✅ Permissões: apenas administradores podem ler

### 3. Backup do Banco de Dados

O banco fica em `backend\database.sqlite`. Configure backup automático:

```cmd
REM Crie uma tarefa agendada (Task Scheduler) que execute:
copy "C:\Aplicacoes\TR-GestaoRecursos\backend\database.sqlite" "C:\Backup\database-%date%.sqlite"
```

Recomendado: **backup diário às 23h00** mantendo 30 dias de histórico.

### 4. HTTPS (recomendado)

Para HTTPS, use um **Reverse Proxy** (IIS, nginx ou Apache) na frente do Node.js:

- Cliente → HTTPS (porta 443) → Reverse Proxy → HTTP (porta 5000 - Node)

Ou solicite ao time de infra um certificado SSL interno da TR.

---

## 🔄 Atualizações

Quando houver mudanças no código:

```cmd
REM 1. Parar o serviço
net stop TR-GestaoRecursos

REM 2. Atualizar arquivos (copiar nova versão)

REM 3. Rebuild
build-producao.bat

REM 4. Reiniciar
net start TR-GestaoRecursos
```

---

## 📊 Monitoramento

### Verificar se está rodando

```cmd
curl http://localhost:5000/api/health
```

Resposta esperada:
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

### Painel de Serviços Windows

`services.msc` → `TR-GestaoRecursos`
- Status: **Em Execução**
- Tipo de Inicialização: **Automático**

### Recursos do servidor

- **CPU**: ~1-2% em uso normal
- **RAM**: ~80-120MB
- **Disco**: cresce conforme registros (estimativa: 1MB/100 despesas)

---

## ❓ Troubleshooting

### Serviço não inicia

1. Veja os logs em `service\daemon\TR-GestaoRecursos.err.log`
2. Verifique se a porta 5000 não está em uso: `netstat -ano | findstr :5000`
3. Verifique permissões da pasta: o usuário do serviço (LocalSystem) precisa ler/escrever

### Não consigo acessar pela rede

1. Verifique o firewall do Windows
2. Confirme o IP do servidor: `ipconfig`
3. Teste do próprio servidor primeiro: `http://localhost:5000`

### Banco corrompido

Backup automático recomendado. Para restaurar:
```cmd
net stop TR-GestaoRecursos
copy "C:\Backup\database-DATA.sqlite" "backend\database.sqlite"
net start TR-GestaoRecursos
```

### Esqueci a senha do admin

```cmd
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```
Copie o hash e atualize no banco via SQLite browser ou comando.

---

## 📞 Suporte

- **Logs**: `service\daemon\`
- **Banco**: `backend\database.sqlite`
- **Configuração**: `backend\.env`
- **Health check**: `http://localhost:5000/api/health`

---

## ✅ Checklist de Deploy

- [ ] Node.js instalado no servidor
- [ ] Arquivos copiados para `C:\Aplicacoes\TR-GestaoRecursos\`
- [ ] `build-producao.bat` executado com sucesso
- [ ] Banco inicializado (`backend\database.sqlite` existe)
- [ ] `.env` configurado com JWT_SECRET seguro
- [ ] `install-service.bat` executado como Administrador
- [ ] Serviço `TR-GestaoRecursos` rodando (verificar em `services.msc`)
- [ ] Porta 5000 liberada no firewall
- [ ] Acessível em `http://NOME-SERVIDOR:5000`
- [ ] Senha do admin alterada
- [ ] Backup do banco configurado
- [ ] Usuários gerentes reais cadastrados
- [ ] Equipe treinada / comunicado enviado
