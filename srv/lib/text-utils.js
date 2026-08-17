/**
 * Utilitários de texto: chunking, similarity e embeddings determinísticos
 * Copiado e adaptado de dms-grounding-app
 */

const DEFAULT_VECTOR_SIZE = 1536;

function normalizeWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function splitIntoChunks(text, chunkSize = 1200, overlap = 200) {
  const clean = normalizeWhitespace(text);
  if (!clean) return [];

  const safeChunkSize = Number.isInteger(chunkSize) && chunkSize > 0 ? chunkSize : 1200;
  const safeOverlap  = Number.isInteger(overlap) && overlap >= 0 && overlap < safeChunkSize ? overlap : 200;
  const step = Math.max(1, safeChunkSize - safeOverlap);

  const chunks = [];
  for (let start = 0; start < clean.length; start += step) {
    const end       = Math.min(clean.length, start + safeChunkSize);
    const chunkText = clean.slice(start, end).trim();
    if (!chunkText) continue;
    chunks.push({
      chunkIndex:    chunks.length,
      chunkText,
      tokenEstimate: Math.ceil(chunkText.length / 4)
    });
    if (end >= clean.length) break;
  }

  return chunks;
}

function deterministicEmbedding(text, size = DEFAULT_VECTOR_SIZE) {
  const normalized = normalizeWhitespace(text).toLowerCase();
  const vector = new Array(size).fill(0);
  if (!normalized) return vector;

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const slot = (charCode * (i + 17)) % size;
    vector[slot] += ((charCode % 31) + 1) / 31;
  }

  return l2Normalize(vector);
}

function l2Normalize(vector) {
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  if (!norm) return vector;
  return vector.map(v => v / norm);
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0, aNorm = 0, bNorm = 0;
  for (let i = 0; i < a.length; i++) {
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot   += av * bv;
    aNorm += av * av;
    bNorm += bv * bv;
  }

  const denom = Math.sqrt(aNorm) * Math.sqrt(bNorm);
  return denom ? dot / denom : 0;
}

module.exports = {
  DEFAULT_VECTOR_SIZE,
  normalizeWhitespace,
  splitIntoChunks,
  deterministicEmbedding,
  cosineSimilarity
};
