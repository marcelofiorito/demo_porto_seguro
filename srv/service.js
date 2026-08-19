"use strict";

const cds = require("@sap/cds");

// ── Mock Business Partners (dados realistas Porto Seguro para demo local) ──────
const MOCK_BUSINESS_PARTNERS = [
  {
    BusinessPartner: "0000000001",
    BusinessPartnerFullName: "Automóveis Pinheiro Ltda",
    BusinessPartnerGrouping: "PJ",
    BusinessPartnerType: "2",
    SearchTerm1: "PINHEIRO",
    Industry: "45",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2020-03-15",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-10",
    OrganizationBPName1: "Automóveis Pinheiro",
    OrganizationBPName2: "Ltda",
    IsNaturalPerson: "0",
    BusinessPartnerCategory: "2",
    Customer: "1000000001"
  },
  {
    BusinessPartner: "0000000002",
    BusinessPartnerFullName: "Maria da Silva Santos",
    BusinessPartnerGrouping: "PF",
    BusinessPartnerType: "1",
    SearchTerm1: "MARIA SILVA",
    Industry: "",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2021-07-22",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-01",
    OrganizationBPName1: "",
    OrganizationBPName2: "",
    IsNaturalPerson: "1",
    BusinessPartnerCategory: "1",
    Customer: "1000000002"
  },
  {
    BusinessPartner: "0000000003",
    BusinessPartnerFullName: "Clínica São Lucas S/A",
    BusinessPartnerGrouping: "PJ",
    BusinessPartnerType: "2",
    SearchTerm1: "SAO LUCAS",
    Industry: "86",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2019-01-10",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-07-15",
    OrganizationBPName1: "Clínica São Lucas",
    OrganizationBPName2: "S/A",
    IsNaturalPerson: "0",
    BusinessPartnerCategory: "2",
    Customer: "1000000003"
  },
  {
    BusinessPartner: "0000000004",
    BusinessPartnerFullName: "João Carlos Oliveira",
    BusinessPartnerGrouping: "PF",
    BusinessPartnerType: "1",
    SearchTerm1: "JOAO OLIVEIRA",
    Industry: "",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2022-04-05",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-05",
    OrganizationBPName1: "",
    OrganizationBPName2: "",
    IsNaturalPerson: "1",
    BusinessPartnerCategory: "1",
    Customer: "1000000004"
  },
  {
    BusinessPartner: "0000000005",
    BusinessPartnerFullName: "Construtora Horizonte S/A",
    BusinessPartnerGrouping: "PJ",
    BusinessPartnerType: "2",
    SearchTerm1: "HORIZONTE",
    Industry: "41",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2018-09-30",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-07-30",
    OrganizationBPName1: "Construtora Horizonte",
    OrganizationBPName2: "S/A",
    IsNaturalPerson: "0",
    BusinessPartnerCategory: "2",
    Customer: "1000000005"
  },
  {
    BusinessPartner: "0000000006",
    BusinessPartnerFullName: "Ana Paula Ferreira Costa",
    BusinessPartnerGrouping: "PF",
    BusinessPartnerType: "1",
    SearchTerm1: "ANA FERREIRA",
    Industry: "",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2023-02-14",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-06-20",
    OrganizationBPName1: "",
    OrganizationBPName2: "",
    IsNaturalPerson: "1",
    BusinessPartnerCategory: "1",
    Customer: "1000000006"
  },
  {
    BusinessPartner: "0000000007",
    BusinessPartnerFullName: "Logística Rápida Transportes Ltda",
    BusinessPartnerGrouping: "PJ",
    BusinessPartnerType: "2",
    SearchTerm1: "LOG RAPIDA",
    Industry: "49",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2017-11-20",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-12",
    OrganizationBPName1: "Logística Rápida",
    OrganizationBPName2: "Transportes Ltda",
    IsNaturalPerson: "0",
    BusinessPartnerCategory: "2",
    Customer: "1000000007"
  },
  {
    BusinessPartner: "0000000008",
    BusinessPartnerFullName: "Roberto Nascimento Lima",
    BusinessPartnerGrouping: "PF",
    BusinessPartnerType: "1",
    SearchTerm1: "ROBERTO LIMA",
    Industry: "",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2020-08-18",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-08",
    OrganizationBPName1: "",
    OrganizationBPName2: "",
    IsNaturalPerson: "1",
    BusinessPartnerCategory: "1",
    Customer: "1000000008"
  },
  {
    BusinessPartner: "0000000009",
    BusinessPartnerFullName: "Hospital e Maternidade São José",
    BusinessPartnerGrouping: "PJ",
    BusinessPartnerType: "2",
    SearchTerm1: "SAO JOSE",
    Industry: "86",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2015-05-03",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-05-10",
    OrganizationBPName1: "Hospital e Maternidade",
    OrganizationBPName2: "São José",
    IsNaturalPerson: "0",
    BusinessPartnerCategory: "2",
    Customer: "1000000009"
  },
  {
    BusinessPartner: "0000000010",
    BusinessPartnerFullName: "Carla Beatriz Mendes Rocha",
    BusinessPartnerGrouping: "PF",
    BusinessPartnerType: "1",
    SearchTerm1: "CARLA MENDES",
    Industry: "",
    BusinessPartnerIsBlocked: false,
    CreationDate: "2024-01-08",
    CreatedByUser: "SISTEMA",
    LastChangeDate: "2026-08-01",
    OrganizationBPName1: "",
    OrganizationBPName2: "",
    IsNaturalPerson: "1",
    BusinessPartnerCategory: "1",
    Customer: "1000000010"
  }
];

// Criticality mapping para badges Fiori Elements
// 0=Neutro(cinza) 1=Negativo(vermelho) 2=Crítico(laranja) 3=Positivo(verde)
const RISK_CRITICALITY = {
  BAIXO: 3,
  MEDIO: 2,
  ALTO: 1,
  CRITICO: 1
};

// Clientes priorizados na lista para a demonstração. A ordem dos IDs define
// a ordem de exibição, incluindo os BPs duplicados de cada pessoa.
const PRIORITY_BUSINESS_PARTNERS = [
  "9980000098",
  "9980000099",
  "9980000096",
  "9980000097"
];

// Referências às entidades do schema (nomes qualificados para uso com db.run)
const DB_RISK = "com.portoseguro.CustomerRisk";
const DB_NOTE = "com.portoseguro.CustomerNote";

module.exports = class CustomerService extends cds.ApplicationService {
  async init() {
    const db = await cds.connect.to("db");

    // Produção: lê do destino BTP configurado; desenvolvimento: usa mock local
    const isProduction = cds.env.profile === "production" || cds.env.profile === "hybrid" ||
      !!cds.env.requires?.API_BUSINESS_PARTNER?.credentials?.destination;

    // ── READ Customers ────────────────────────────────────────────────
    this.on("READ", "Customers", async (req) => {
      let bps;
      let risks;
      const isSingle = req.query.SELECT?.one === true;
      const virtualFilters = _extractVirtualEquals(req.query.SELECT?.where);

      // Os campos virtuais pertencem à extensão local. Resolve primeiro os BPs
      // correspondentes e restringe a consulta remota por BusinessPartner.
      if (virtualFilters.size > 0) {
        const riskQuery = SELECT.from(DB_RISK);
        for (const [field, values] of virtualFilters) {
          riskQuery.where({ [field]: { in: [...values] } });
        }
        risks = await db.run(riskQuery);
        if (risks.length === 0) return isSingle ? null : [];
      }

      if (isProduction) {
        const S4 = await cds.connect.to("API_BUSINESS_PARTNER");
        // Remove campos virtuais da query antes de enviar ao S/4HANA
        const query = _stripVirtualFields(req.query);
        if (risks) {
          _addBusinessPartnerFilter(query, risks.map((risk) => risk.businessPartner));
        }

        if (isSingle) {
          // Leituras da Object Page já endereçam um BP pela chave. O S/4HANA
          // não permite acrescentar $top/$skip a essa URI singleton.
          bps = _asArray(await S4.run(query));
        } else {
          // Busca os clientes prioritários separadamente para que estejam no
          // início global da coleção, e não apenas no início da página corrente.
          const priorityBPs = _sortPriorityBusinessPartners((await Promise.all(
            PRIORITY_BUSINESS_PARTNERS.map(async (businessPartner) => {
              const priorityQuery = cds.ql.clone(query);
              _setPaging(priorityQuery, 1, 0);
              _addBusinessPartnerFilter(priorityQuery, [businessPartner]);
              return _asArray(await S4.run(priorityQuery));
            })
          )).flat());

          const { top, skip } = _getPaging(query);
          const visiblePriorityBPs = priorityBPs.slice(skip, top === null ? undefined : skip + top);
          const remainingTop = top === null ? null : top - visiblePriorityBPs.length;

          let regularBPs = [];
          if (remainingTop === null || remainingTop > 0) {
            const regularQuery = cds.ql.clone(query);
            _addBusinessPartnerExclusion(regularQuery, PRIORITY_BUSINESS_PARTNERS);
            _setPaging(regularQuery, remainingTop, Math.max(0, skip - priorityBPs.length));
            regularBPs = _asArray(await S4.run(regularQuery));
          }

          bps = [...visiblePriorityBPs, ...regularBPs];
        }
      } else {
        bps = _applyMockFilters(MOCK_BUSINESS_PARTNERS, req.query, false);
        if (risks) {
          const matchingBPs = new Set(risks.map((risk) => risk.businessPartner));
          bps = bps.filter((bp) => matchingBPs.has(bp.BusinessPartner));
        }
        if (!isSingle) bps = _applyPaging(_sortPriorityBusinessPartners(bps), req.query);
      }

      if (!bps || bps.length === 0) return isSingle ? null : bps;

      // Enriquece cada BP com dados de risco da extensão local
      const bpKeys = bps.map((bp) => bp.BusinessPartner);
      risks = risks || await db.run(
        SELECT.from(DB_RISK).where({ businessPartner: { in: bpKeys } })
      );

      const riskMap = {};
      risks.forEach((r) => (riskMap[r.businessPartner] = r));

      const result = bps.map((bp) => {
        const risk = riskMap[bp.BusinessPartner] || {};
        return {
          ...bp,
          riskLevel: risk.riskLevel || "",
          riskLevelCriticality: RISK_CRITICALITY[risk.riskLevel] || 0,
          segment: risk.segment || "",
          riskReason: risk.riskReason || "",
          owner: risk.owner || "",
          reviewDate: risk.reviewDate || null
        };
      });
      return isSingle ? result[0] : result;
    });

    // ── setRisk action ────────────────────────────────────────────────
    this.on("setRisk", async (req) => {
      const { businessPartner, riskLevel, riskReason, segment, owner, reviewDate } = req.data;

      if (!businessPartner) return req.error(400, "businessPartner é obrigatório");
      if (!riskLevel) return req.error(400, "riskLevel é obrigatório");

      const validLevels = ["BAIXO", "MEDIO", "ALTO", "CRITICO"];
      if (!validLevels.includes(riskLevel))
        return req.error(400, `riskLevel inválido. Valores permitidos: ${validLevels.join(", ")}`);

      await UPSERT.into(DB_RISK).entries({
        businessPartner,
        riskLevel,
        riskReason: riskReason || "",
        segment: segment || "",
        owner: owner || "",
        reviewDate: reviewDate || null,
        modifiedAt: new Date().toISOString(),
        modifiedBy: req.user?.id || "demo-user"
      });

      return db.run(SELECT.one.from(DB_RISK).where({ businessPartner }));
    });

    await super.init();
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Remove campos virtuais de uma CQN query para não enviá-los ao S/4HANA
function _stripVirtualFields(query) {
  const virtualFields = new Set([
    "riskLevel", "riskLevelCriticality", "segment", "riskReason", "owner", "reviewDate"
  ]);

  const clone = JSON.parse(JSON.stringify(query));
  if (clone.SELECT?.columns) {
    clone.SELECT.columns = clone.SELECT.columns.filter(
      (col) => !virtualFields.has(col.ref?.[0])
    );
  }
  // Remove filtros em campos virtuais (não suportados pelo S/4HANA)
  if (clone.SELECT?.where) {
    clone.SELECT.where = _removeVirtualFilters(clone.SELECT.where, virtualFields);
  }
  return clone;
}

function _removeVirtualFilters(where, virtualFields) {
  if (!Array.isArray(where)) return where;
  const result = [];
  for (let i = 0; i < where.length; i++) {
    const token = where[i];
    if (token?.xpr) {
      const xpr = _removeVirtualFilters(token.xpr, virtualFields);
      if (xpr) result.push({ ...token, xpr });
      continue;
    }
    if (token?.ref && virtualFields.has(token.ref[0])) {
      // Pula o campo, operador e valor (3 tokens: ref, op, val)
      i += 2;
      // Remove AND/OR que ficou orphan
      if (result.length > 0 && (result[result.length - 1] === "and" || result[result.length - 1] === "or")) {
        result.pop();
      }
    } else {
      result.push(token);
    }
  }

  // Remove conectores que ficaram no início/fim ou duplicados após retirar
  // um predicado virtual de uma expressão combinada.
  const normalized = [];
  for (const token of result) {
    const isLogical = token === "and" || token === "or";
    const previous = normalized[normalized.length - 1];
    const previousIsLogical = previous === "and" || previous === "or";
    if (isLogical && (normalized.length === 0 || previousIsLogical)) continue;
    normalized.push(token);
  }
  if (normalized.at(-1) === "and" || normalized.at(-1) === "or") normalized.pop();
  return normalized.length > 0 ? normalized : undefined;
}

// Extrai filtros de igualdade dos campos persistidos em CustomerRisk.
// Condições OR do mesmo campo são consolidadas como uma lista de valores.
function _extractVirtualEquals(where, result = new Map()) {
  if (!Array.isArray(where)) return result;
  const riskFields = new Set(["riskLevel", "segment", "riskReason", "owner", "reviewDate"]);

  for (let i = 0; i < where.length; i++) {
    const token = where[i];
    if (token?.xpr) {
      _extractVirtualEquals(token.xpr, result);
      continue;
    }
    const field = token?.ref?.[0];
    const operator = where[i + 1];
    const value = where[i + 2]?.val;
    if (riskFields.has(field) && operator === "=" && value !== undefined) {
      if (!result.has(field)) result.set(field, new Set());
      result.get(field).add(value);
      i += 2;
    }
  }
  return result;
}

function _addBusinessPartnerFilter(query, businessPartners) {
  const predicate = [
    { ref: ["BusinessPartner"] },
    "in",
    { list: businessPartners.map((businessPartner) => ({ val: businessPartner })) }
  ];
  query.SELECT.where = query.SELECT.where?.length
    ? [{ xpr: query.SELECT.where }, "and", ...predicate]
    : predicate;
}

function _addBusinessPartnerExclusion(query, businessPartners) {
  const predicate = businessPartners.flatMap((businessPartner, index) => [
    ...(index > 0 ? ["and"] : []),
    { ref: ["BusinessPartner"] },
    "!=",
    { val: businessPartner }
  ]);
  query.SELECT.where = query.SELECT.where?.length
    ? [{ xpr: query.SELECT.where }, "and", ...predicate]
    : predicate;
}

function _asArray(result) {
  if (Array.isArray(result)) return result;
  return result ? [result] : [];
}

function _sortPriorityBusinessPartners(bps) {
  const priority = new Map(
    PRIORITY_BUSINESS_PARTNERS.map((businessPartner, index) => [businessPartner, index])
  );
  return [...bps].sort((left, right) => {
    const leftPriority = priority.get(left.BusinessPartner) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priority.get(right.BusinessPartner) ?? Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority;
  });
}

// Aplica filtros básicos nos dados mock locais
function _applyMockFilters(bps, query, applyPaging = true) {
  let result = [...bps];

  const where = query?.SELECT?.where;
  if (where) {
    const filterStr = JSON.stringify(where);

    // Filtro por BusinessPartner
    const bpMatch = filterStr.match(/"BusinessPartner"[^"]*"([0-9]+)"/);
    if (bpMatch) {
      result = result.filter((bp) => bp.BusinessPartner === bpMatch[1]);
    }

    // Filtro por agrupamento (PF/PJ)
    const grpMatch = filterStr.match(/"BusinessPartnerGrouping"[^"]*"([^"]+)"/);
    if (grpMatch) {
      result = result.filter((bp) => bp.BusinessPartnerGrouping === grpMatch[1]);
    }
  }

  return applyPaging ? _applyPaging(result, query) : result;
}

function _applyPaging(result, query) {
  const { top, skip } = _getPaging(query, 50);
  return result.slice(skip, top === null ? undefined : skip + top);
}

function _getPaging(query, defaultTop = null) {
  const limit = query?.SELECT?.limit;
  const topValue = limit?.rows?.val ?? limit?.top;
  const skipValue = limit?.offset?.val ?? limit?.skip ?? 0;
  return {
    top: topValue === undefined ? defaultTop : Number(topValue),
    skip: Number(skipValue)
  };
}

function _setPaging(query, top, skip) {
  if (top === null) {
    delete query.SELECT.limit;
    return;
  }
  query.SELECT.limit = {
    rows: { val: top },
    ...(skip > 0 ? { offset: { val: skip } } : {})
  };
}
