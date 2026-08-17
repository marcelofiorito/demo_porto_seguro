'use strict';

const cds = require('@sap/cds');
const { splitIntoChunks, cosineSimilarity } = require('./lib/text-utils');
const { getEmbeddingProvider }              = require('./lib/embedding-provider');
const { calculatePolicyRisk }               = require('./lib/risk-calculator');

const LOG = cds.log('insurance');

async function callLLM(sysPrompt, userPrompt) {
  if (process.env.INSURANCE_USE_AICORE !== 'true')
    return '[IA nao configurada - defina INSURANCE_USE_AICORE=true]';
  try {
    const { AzureOpenAiChatClient } = require('@sap-ai-sdk/foundation-models');
    const client = new AzureOpenAiChatClient({
      modelName:     process.env.INSURANCE_CHAT_MODEL        || 'gpt-4o',
      resourceGroup: process.env.INSURANCE_AI_RESOURCE_GROUP || 'default',
      deploymentId:  process.env.INSURANCE_AI_DEPLOYMENT_ID
    });
    const res = await client.run({
      messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.3, max_tokens: 800
    });
    return res.getContent();
  } catch (err) {
    LOG.warn('Falha LLM:', err.message);
    return '[Erro IA: ' + err.message + ']';
  }
}

module.exports = cds.service.impl(async function () {
  const { Policies, Claims } = this.entities;
  const embed = getEmbeddingProvider();

  // ── Criticality helpers ────────────────────────────────────────────────────
  // UI5 Criticality: 0=None, 1=Positive(green), 2=Critical(orange), 3=Negative(red)
  function policyStatusCriticality(status) {
    switch (status) {
      case 'ACTIVE':    return 1; // green
      case 'DRAFT':     return 0; // neutral
      case 'SUSPENDED': return 2; // orange
      case 'CANCELLED': return 3; // red
      case 'EXPIRED':   return 3; // red
      default:          return 0;
    }
  }
  function riskLevelCriticality(level) {
    switch (level) {
      case 'LOW':      return 1; // green
      case 'MEDIUM':   return 2; // orange
      case 'HIGH':     return 3; // red
      case 'CRITICAL': return 3; // red
      default:         return 0;
    }
  }
  function claimStatusCrit(status) {
    switch (status) {
      case 'PAID':         return 1;
      case 'APPROVED':     return 1;
      case 'SUBMITTED':    return 0;
      case 'UNDER_REVIEW': return 2;
      case 'REJECTED':     return 3;
      case 'CLOSED':       return 0;
      default:             return 0;
    }
  }
  function severityCrit(severity) {
    switch (severity) {
      case 'LOW':      return 1;
      case 'MEDIUM':   return 2;
      case 'HIGH':     return 3;
      case 'CRITICAL': return 3;
      default:         return 0;
    }
  }

  this.after('READ', 'Policies', (results) => {
    const rows = Array.isArray(results) ? results : [results];
    rows.forEach(p => {
      if (!p) return;
      p.statusCriticality = policyStatusCriticality(p.status);
      p.riskCriticality   = riskLevelCriticality(p.riskLevel);
    });
  });

  this.after('READ', 'Claims', (results) => {
    const rows = Array.isArray(results) ? results : [results];
    rows.forEach(c => {
      if (!c) return;
      c.claimStatusCriticality = claimStatusCrit(c.status);
      c.severityCriticality    = severityCrit(c.severity);
    });
  });

  this.before(['CREATE', 'UPDATE'], Policies, (req) => {
    const { startDate, endDate, coverageAmount, premium } = req.data;
    if (startDate && endDate && endDate <= startDate)
      req.reject(400, 'A data de termino deve ser posterior a data de inicio.');
    if (coverageAmount !== undefined && coverageAmount <= 0)
      req.reject(400, 'O valor de cobertura deve ser maior que zero.');
    if (premium !== undefined && premium <= 0)
      req.reject(400, 'O valor do premio deve ser maior que zero.');
  });

  this.before('CREATE', Claims, async (req) => {
    const { policy_ID, incidentDate } = req.data;
    const policy = await SELECT.one.from(Policies).where({ ID: policy_ID });
    if (!policy) return req.reject(404, 'Apolice nao encontrada.');
    if (policy.status !== 'ACTIVE')
      return req.reject(400, 'Apolice deve estar ATIVA. Status: ' + policy.status);
    if (incidentDate && (incidentDate < policy.startDate || incidentDate > policy.endDate))
      return req.reject(400, 'Data do incidente fora da vigencia da apolice.');
    if (!req.data.reportedDate) req.data.reportedDate = new Date().toISOString();
  });

  this.on('calculateRisk', Policies, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const p = await SELECT.one.from(Policies).where({ ID: id });
    if (!p) return req.reject(404, 'Apolice nao encontrada.');
    const claims = await SELECT.from(Claims).where({ policy_ID: id });
    const result = calculatePolicyRisk(p, claims);
    await UPDATE(Policies, id).set(result);
    return SELECT.one.from(Policies).where({ ID: id });
  });

  this.on('submitPolicy', Policies, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const p = await SELECT.one.from(Policies).where({ ID: id });
    if (!p) return req.reject(404, 'Apolice nao encontrada.');
    if (p.status !== 'DRAFT') return req.reject(400, 'Apenas rascunhos podem ser submetidos.');
    await UPDATE(Policies, id).set({ status: 'ACTIVE', issueDate: new Date().toISOString().split('T')[0] });
    return SELECT.one.from(Policies).where({ ID: id });
  });

  this.on('cancelPolicy', Policies, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { reason } = req.data;
    const p = await SELECT.one.from(Policies).where({ ID: id });
    if (!p) return req.reject(404, 'Apolice nao encontrada.');
    if (!['ACTIVE', 'SUSPENDED'].includes(p.status)) return req.reject(400, 'Status nao permite cancelamento.');
    const open = await SELECT.from(Claims).where({ policy_ID: id, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } });
    if (open.length) return req.reject(400, open.length + ' sinistro(s) em aberto impedem o cancelamento.');
    await UPDATE(Policies, id).set({ status: 'CANCELLED', riskBreakdown: reason ? 'Cancelada: ' + reason : 'Cancelada' });
    return SELECT.one.from(Policies).where({ ID: id });
  });

  this.on('renewPolicy', Policies, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { months = 12 } = req.data;
    const p = await SELECT.one.from(Policies).where({ ID: id });
    if (!p) return req.reject(404, 'Apolice nao encontrada.');
    if (!['ACTIVE', 'EXPIRED'].includes(p.status)) return req.reject(400, 'Apenas ATIVAS ou EXPIRADAS podem ser renovadas.');
    const base = p.status === 'EXPIRED' ? new Date() : new Date(p.endDate);
    base.setMonth(base.getMonth() + months);
    await UPDATE(Policies, id).set({ endDate: base.toISOString().split('T')[0], status: 'ACTIVE' });
    return SELECT.one.from(Policies).where({ ID: id });
  });

  this.on('approveClaim', Claims, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { approvedAmount, notes } = req.data;
    const c = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(c.status)) return req.reject(400, 'Status nao permite aprovacao.');
    const upd = { status: 'APPROVED', approvedAmount: approvedAmount != null ? approvedAmount : c.estimatedAmount, approvalDate: new Date().toISOString().split('T')[0] };
    if (notes) upd.adjusterNotes = notes;
    await UPDATE(Claims, id).set(upd);
    return SELECT.one.from(Claims).where({ ID: id });
  });

  this.on('rejectClaim', Claims, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { reason } = req.data;
    const c = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(c.status)) return req.reject(400, 'Status nao permite rejeicao.');
    await UPDATE(Claims, id).set({ status: 'REJECTED', adjusterNotes: reason || 'Rejeitado', closureDate: new Date().toISOString().split('T')[0] });
    return SELECT.one.from(Claims).where({ ID: id });
  });

  this.on('assignAdjuster', Claims, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { adjusterName } = req.data;
    const c = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    await UPDATE(Claims, id).set({ adjusterName, status: c.status === 'SUBMITTED' ? 'UNDER_REVIEW' : c.status });
    return SELECT.one.from(Claims).where({ ID: id });
  });

  this.on('markAsPaid', Claims, async (req) => {
    const id = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const { paidAmount } = req.data;
    const c = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    if (c.status !== 'APPROVED') return req.reject(400, 'Apenas sinistros APROVADOS podem ser pagos.');
    await UPDATE(Claims, id).set({ status: 'PAID', paidAmount: paidAmount != null ? paidAmount : c.approvedAmount, paymentDate: new Date().toISOString().split('T')[0] });
    return SELECT.one.from(Claims).where({ ID: id });
  });

  this.on('summarize', Claims, async (req) => {
    const id  = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const c   = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    const pol = await SELECT.one.from(Policies).where({ ID: c.policy_ID });
    const rag = await semanticSearch(c.description + ' ' + (pol ? pol.insuranceType : '') + ' cobertura', pol ? pol.insuranceType : null, 3);
    const ctx = rag.length ? rag.map(function(r) { return '[' + r.documentName + ']: ' + r.snippet; }).join('\n\n') : 'Sem clausulas na base.';
    const txt = await callLLM(
      'Voce e analista de sinistros da Porto Seguro. Seja objetivo e cite fontes.',
      'Sinistro: ' + c.claimNumber + '\nData: ' + c.incidentDate + '\nDescricao: ' + c.description +
      '\nSeveridade: ' + c.severity + '\nValor: R$ ' + (c.estimatedAmount || 0) +
      '\n\nCLAUSULAS:\n' + ctx + '\n\nAnalise cobertura, valor vs franquia, recomende aprovacao/rejeicao.'
    );
    const sources = rag.map(function(r) { return r.documentName; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).join('; ');
    return { summary: txt, sources: sources };
  });

  this.on('draftEmail', Claims, async (req) => {
    const id  = req.params[0].ID != null ? req.params[0].ID : req.params[0];
    const c   = await SELECT.one.from(Claims).where({ ID: id });
    if (!c) return req.reject(404, 'Sinistro nao encontrado.');
    const pol = await SELECT.one.from(Policies).where({ ID: c.policy_ID });
    const rag = await semanticSearch('prazo pagamento comunicacao cliente ' + (pol ? pol.insuranceType : ''), pol ? pol.insuranceType : null, 2);
    const ctx = rag.length ? rag.map(function(r) { return '[' + r.documentName + ']: ' + r.snippet; }).join('\n\n') : 'N/A';
    const raw = await callLLM(
      'Voce e relacionamento com clientes da Porto Seguro. E-mails profissionais em pt-BR. SOMENTE JSON: {"subject":"...","body":"..."}',
      'Sinistro: ' + c.claimNumber + '\nStatus: ' + c.status + '\nValor: R$ ' + (c.approvedAmount || 'a confirmar') +
      '\n\nPoliticas:\n' + ctx + '\n\nRedija e-mail de atualizacao para o cliente.'
    );
    try { var m = raw.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {}
    return { subject: 'Atualizacao Sinistro ' + c.claimNumber, body: raw };
  });

  this.on('calculatePolicyRisk', async (req) => {
    const { policyID } = req.data;
    const p = await SELECT.one.from(Policies).where({ ID: policyID });
    if (!p) return req.reject(404, 'Apolice nao encontrada.');
    const claims = await SELECT.from(Claims).where({ policy_ID: policyID });
    const result = calculatePolicyRisk(p, claims);
    await UPDATE(Policies, policyID).set(result);
    return Object.assign({ policyID: policyID }, result);
  });

  this.on('uploadInsurancePolicy', async (req) => {
    const { fileName, category, policyType, description, content } = req.data;
    if (!fileName || !content) return req.reject(400, 'fileName e content sao obrigatorios.');
    var text = content;
    try { var b = Buffer.from(content, 'base64'); if (b.toString('base64') === content.replace(/\s/g, '')) text = b.toString('utf-8'); } catch (_) {}
    var docID = cds.utils.uuid();
    await INSERT.into('insurance.InsurancePolicyDocument').entries({
      ID: docID, fileName: fileName.trim(),
      category: (category || 'GERAL').toUpperCase(),
      policyType: (policyType || 'GERAL').toUpperCase(),
      description: description || '', chunkCount: 0
    });
    var chunks = splitIntoChunks(text, 1200, 200);
    var rows = [];
    for (var i = 0; i < chunks.length; i++) {
      var ch = chunks[i];
      var emb = await embed.embed(ch.chunkText);
      rows.push({ ID: cds.utils.uuid(), document_ID: docID, chunkIndex: ch.chunkIndex, chunkText: ch.chunkText, embeddingJson: JSON.stringify(emb), tokenEstimate: ch.tokenEstimate });
    }
    if (rows.length) await INSERT.into('insurance.InsurancePolicyChunk').entries(rows);
    await UPDATE('insurance.InsurancePolicyDocument', docID).set({ chunkCount: rows.length });
    LOG.info('RAG: "' + fileName + '" - ' + rows.length + ' chunks');
    return { ID: docID, fileName: fileName, chunkCount: rows.length };
  });

  this.on('deleteInsurancePolicy', async (req) => {
    var ID = req.data.ID;
    var doc = await SELECT.one.from('insurance.InsurancePolicyDocument').where({ ID: ID });
    if (!doc) return req.reject(404, 'Documento nao encontrado.');
    await DELETE.from('insurance.InsurancePolicyChunk').where({ document_ID: ID });
    await DELETE.from('insurance.InsurancePolicyDocument').where({ ID: ID });
    LOG.info('RAG: "' + doc.fileName + '" removido');
    return true;
  });

  this.on('searchPolicyClauses', async (req) => {
    const { query, policyType, topK = 5 } = req.data;
    if (!query || !query.trim()) return req.reject(400, 'query e obrigatoria.');
    return semanticSearch(query, policyType, topK);
  });

  async function semanticSearch(query, policyType, topK) {
    topK = topK || 5;
    var qEmb = await embed.embed(query);
    var filter = {};
    if (policyType && policyType.toUpperCase() !== 'GERAL')
      filter = { policyType: { in: [policyType.toUpperCase(), 'GERAL'] } };
    var docs = await SELECT.from('insurance.InsurancePolicyDocument')
      .columns('ID', 'fileName', 'category').where(filter);
    if (!docs.length) return [];
    var docMap = {};
    docs.forEach(function(d) { docMap[d.ID] = d; });
    var docIDs = docs.map(function(d) { return d.ID; });
    var chunks = await SELECT.from('insurance.InsurancePolicyChunk')
      .columns('ID', 'document_ID', 'chunkText', 'embeddingJson')
      .where({ document_ID: { in: docIDs } });
    return chunks.map(function(ch) {
      var e = [];
      try { e = JSON.parse(ch.embeddingJson || '[]'); } catch (_) {}
      return { ch: ch, s: cosineSimilarity(qEmb, e) };
    }).filter(function(x) { return x.s > 0.15; })
      .sort(function(a, b) { return b.s - a.s; })
      .slice(0, topK)
      .map(function(x) {
        var d = docMap[x.ch.document_ID] || {};
        return {
          chunkID:      x.ch.ID,
          documentName: d.fileName || '?',
          category:     d.category || '',
          score:        Math.round(x.s * 1000) / 1000,
          snippet:      (x.ch.chunkText || '').slice(0, 500)
        };
      });
  }
});
