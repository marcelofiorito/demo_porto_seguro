# 🚨 CAP SQLite Deadlock - Lição Crítica

**Data**: 2026-08-16  
**Projeto**: Porto Seguro Insurance Policies  
**Severidade**: CRÍTICA ⛔

---

## 🔴 PROBLEMA

**Sintoma**: Servidor CAP inicia OK (`server listening on http://localhost:4004`) mas **TODAS as queries OData travam** (timeout 5-8s). Nenhum erro aparece nos logs.

**Root Cause**: Conflito de versão entre:
- **Global**: `@sap/cds-dk` 10.0.6 (instalado via `npm install -g`)
- **Local**: `@sap/cds` 9.9.3 (dependency do projeto)

Quando usamos `cds watch` (comando global), ele carrega o CDS-DK 10.x que é **incompatível** com o runtime CAP 9.x local, causando deadlock interno no SQLite.

---

## ✅ SOLUÇÃO

### ❌ NUNCA USE:
```bash
cds watch
cds serve
cds-serve
```

### ✅ SEMPRE USE:
```bash
npm start
# OU
node node_modules/@sap/cds/bin/serve.js
```

### 📝 Configurar package.json:
```json
{
  "scripts": {
    "start": "node node_modules/@sap/cds/bin/serve.js",
    "watch": "node node_modules/@sap/cds/bin/serve.js",
    "deploy": "node node_modules/@sap/cds-dk/bin/cds.js deploy --to sqlite"
  }
}
```

---

## 🔍 DIAGNÓSTICO

**15 testes realizados** antes de descobrir a causa:

✅ Eliminado:
- Annotations complexas → testado com annotations mínimo
- Handlers `after READ` → comentados todos
- `redirected to` → removidos
- Handler JS completo → renomeado para .BAK
- Fiori Tools middleware → ui5.yaml desabilitado
- SQLite corrupto → db.sqlite recriado 3x
- Foreign keys → SQLite não cria FKs

❌ Todos travavam igual!

**Breakthrough**: 
1. `cds serve --in-memory` → ✅ **FUNCIONOU** (prova que não é código)
2. Comparado com `SalesOrderExtension` (CAP 9.x) → ✅ **FUNCIONOU**
3. `node node_modules/@sap/cds/bin/serve.js` → ✅ **RESOLVEU!**

---

## 🛡️ PREVENÇÃO

### Para NOVOS projetos CAP:

1. ✅ Verificar versões:
```bash
cds --version  # global
cat package.json | grep "@sap/cds"  # local
```

2. ✅ Se versões diferem (major), configurar scripts com binário local

3. ✅ Adicionar ao README:
```markdown
## ⚠️ IMPORTANTE
Sempre use `npm start` em vez de `cds watch` (conflito de versão global/local)
```

### Para DEBUG de timeouts CAP:

1. **PRIMEIRO**: Verificar conflito de versão global vs local
2. Testar: `node node_modules/@sap/cds/bin/serve.js`
3. Testar: `cds serve --in-memory`
4. Comparar com projeto de referência (SalesOrderExtension, MyFranchise)
5. **SÓ DEPOIS**: investigar código/annotations

---

## 📚 PROJETOS DE REFERÊNCIA (FUNCIONANDO)

| Projeto | Path | CAP | SQLite | Status |
|---------|------|-----|--------|--------|
| SalesOrderExtension | `/Users/I848942/User_Projects/SalesOrderExtension` | 9.9.1 | 2.4.0 | ✅ |
| RunMyFranchise | `/Users/I848942/MyFranchise` | 9.9.1 | - | ✅ |

---

## 🎓 LIÇÕES APRENDIDAS

1. **Global npm packages causam conflitos silenciosos**
2. **CAP 10.x NÃO é backward compatible com CAP 9.x**
3. **Sempre usar binários locais do projeto**
4. **Conflitos de versão podem travar sem mostrar erros**
5. **`--in-memory` ajuda a isolar problemas do SQLite**
6. **Comparar com projetos funcionando é essencial**
7. **Quando servidor inicia mas queries travam → suspeitar de versão PRIMEIRO**

---

## ✅ VALIDAÇÃO PÓS-FIX

Após aplicar solução:
- ✅ OData queries respondem < 1s
- ✅ `$expand` funciona
- ✅ Handlers executam
- ✅ Virtual fields calculados
- ✅ Fiori apps carregam
- ✅ Draft mode funciona
- ✅ Actions executam

---

**NUNCA MAIS ESQUECER**: `cds watch` com conflito de versão = deadlock silencioso! 🚨
