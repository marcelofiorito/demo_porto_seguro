# 🛡️ Porto Seguro — Insurance Policies Management

**Sistema completo de gestão de apólices e sinistros** com SAP CAP + Fiori Elements.

---

## 🚀 Quick Start

```bash
npm install
npm start  # IMPORTANTE: Sempre usar npm start, nunca cds watch!
```

**URLs:**
- 🏠 Home: http://localhost:4004
- 📄 Policy Management: http://localhost:4004/policymanagement/index.html
- 📋 Claims Management: http://localhost:4004/claimsmanagement/index.html

---

## ⚠️ IMPORTANTE: Conflito CDS Global vs Local

### 🚨 Problema

Se você tem `@sap/cds-dk` **10.x** instalado globalmente, o comando `cds watch` **causará deadlock no SQLite**.

**Sintomas:**
- Servidor inicia OK (`server listening`)
- Todas as queries OData **travam** (timeout 5-8s)

### ✅ Solução

**NUNCA use `cds watch` diretamente!** Sempre:

```bash
npm start
```

Os scripts estão configurados para usar o CDS **local** do projeto:

```json
"scripts": {
  "start": "node node_modules/@sap/cds/bin/serve.js"
}
```

---

## 📊 Dados de Exemplo

- **10 Policies** (AUTO, LIFE, HOME, HEALTH)
- **15 Claims** (diferentes status)
- **30 Coverages** (3 por apólice)

---

## 🔧 Stack

- `@sap/cds` 9.9.3
- `@cap-js/sqlite` 2.4.0
- SAPUI5 1.136.7
- Node.js >= 18.x

---

## 🐛 Troubleshooting

### OData queries travam
```bash
# NUNCA use:
cds watch  # ❌ Causa deadlock!

# SEMPRE use:
npm start  # ✅ Correto
```

### Recriar banco
```bash
rm db.sqlite
cds deploy --to sqlite
npm start
```
