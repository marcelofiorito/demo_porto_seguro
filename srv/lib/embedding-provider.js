/**
 * EmbeddingProvider — gera vetores via SAP AI Core ou modo determinístico local
 * Configuração via variáveis de ambiente:
 *   INSURANCE_USE_AICORE=true            → usa @sap-ai-sdk/foundation-models
 *   INSURANCE_EMBEDDING_MODEL            → nome do modelo (default: text-embedding-3-small)
 *   INSURANCE_AI_RESOURCE_GROUP          → resource group AI Core (default: default)
 */

const { deterministicEmbedding } = require('./text-utils');

class EmbeddingProvider {
  constructor() {
    this.useAiCore     = process.env.INSURANCE_USE_AICORE === 'true';
    this.modelName     = process.env.INSURANCE_EMBEDDING_MODEL    || 'text-embedding-3-small';
    this.resourceGroup = process.env.INSURANCE_AI_RESOURCE_GROUP  || 'default';
    this.client        = null;
    this.initPromise   = null;
  }

  async init() {
    if (!this.useAiCore || this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const { AzureOpenAiEmbeddingClient } = require('@sap-ai-sdk/foundation-models');
        this.client = new AzureOpenAiEmbeddingClient({
          modelName:     this.modelName,
          resourceGroup: this.resourceGroup
        });
      } catch (err) {
        cds.log('embedding').warn('AI Core não disponível, usando embedding determinístico:', err.message);
        this.useAiCore = false;
      }
    })();

    return this.initPromise;
  }

  async embed(text) {
    const cleanText = (text || '').trim();
    if (!cleanText) return deterministicEmbedding('');

    await this.init();

    if (!this.useAiCore || !this.client) {
      return deterministicEmbedding(cleanText);
    }

    try {
      const response  = await this.client.run({ input: cleanText });
      const embedding = response.getEmbedding();
      if (!Array.isArray(embedding) || embedding.length === 0) {
        return deterministicEmbedding(cleanText);
      }
      return embedding;
    } catch (err) {
      cds.log('embedding').warn('Falha ao gerar embedding via AI Core, usando fallback:', err.message);
      return deterministicEmbedding(cleanText);
    }
  }
}

// Singleton — uma instância por processo
let _instance = null;
function getEmbeddingProvider() {
  if (!_instance) _instance = new EmbeddingProvider();
  return _instance;
}

module.exports = { EmbeddingProvider, getEmbeddingProvider };
