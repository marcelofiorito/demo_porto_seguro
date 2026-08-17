/**
 * Risk Calculator — Score de Risco para Apólices de Seguro
 * Adaptado do padrão do SalesOrderExtension
 *
 * Metodologia baseada em:
 * - Frequência de sinistros (loss ratio indicator)
 * - Exposição financeira (claim vs coverage ratio)
 * - Sinistros pendentes há muito tempo (stalled claims)
 * - Apólice próxima ao vencimento (expiration risk)
 * - Severidade dos sinistros ativos
 */

const RISK_WEIGHTS = {
  CLAIM_RATIO_HIGH:     25, // Sinistros totalizam > 80% da cobertura
  CLAIM_RATIO_MEDIUM:   12, // Sinistros totalizam 50–80% da cobertura
  MULTIPLE_CLAIMS_3:    20, // 3 ou mais sinistros registrados
  MULTIPLE_CLAIMS_2:    10, // 2 sinistros registrados
  STALLED_CLAIM_14:     20, // Sinistro em análise há 14+ dias
  STALLED_CLAIM_7:      10, // Sinistro em análise há 7+ dias
  CRITICAL_CLAIM:       20, // Sinistro com severidade CRITICAL
  HIGH_CLAIM:           10, // Sinistro com severidade HIGH
  NEAR_EXPIRATION_30:   15, // Apólice vence em 30 dias ou menos
  NEAR_EXPIRATION_60:    8, // Apólice vence em 31–60 dias
  CLAIM_REJECTED:       10  // Sinistro rejeitado (possível reapresentação)
};

function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a) || isNaN(b)) return 999;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(futureDate) {
  return daysBetween(new Date(), futureDate);
}

function daysSince(pastDate) {
  return daysBetween(pastDate, new Date());
}

/**
 * Calcula o score de risco de uma apólice (0–100)
 *
 * @param {object} policy  - Dados da apólice (coverageAmount, endDate, status)
 * @param {Array}  claims  - Sinistros vinculados
 * @returns {{ riskScore, riskLevel, riskBreakdown }}
 */
function calculatePolicyRisk(policy, claims = []) {
  const factors = [];
  let score = 0;

  const coverage = parseFloat(policy.coverageAmount) || 0;

  // ── 1. Exposição financeira (sinistros vs cobertura) ──────────────────────
  const activeClaims  = claims.filter(c => !['CLOSED', 'REJECTED'].includes(c.status));
  const totalEstimate = activeClaims.reduce((sum, c) => sum + (parseFloat(c.estimatedAmount) || 0), 0);

  if (coverage > 0) {
    const ratio = totalEstimate / coverage;
    if (ratio >= 0.8) {
      score += RISK_WEIGHTS.CLAIM_RATIO_HIGH;
      factors.push(`Sinistros equivalem a ${Math.round(ratio * 100)}% da cobertura`);
    } else if (ratio >= 0.5) {
      score += RISK_WEIGHTS.CLAIM_RATIO_MEDIUM;
      factors.push(`Sinistros equivalem a ${Math.round(ratio * 100)}% da cobertura`);
    }
  }

  // ── 2. Frequência de sinistros ────────────────────────────────────────────
  const totalClaims = claims.length;
  if (totalClaims >= 3) {
    score += RISK_WEIGHTS.MULTIPLE_CLAIMS_3;
    factors.push(`${totalClaims} sinistros registrados`);
  } else if (totalClaims === 2) {
    score += RISK_WEIGHTS.MULTIPLE_CLAIMS_2;
    factors.push('2 sinistros registrados');
  }

  // ── 3. Sinistros parados em análise (stalled) ─────────────────────────────
  const stalledClaims = claims.filter(c => c.status === 'UNDER_REVIEW');
  for (const claim of stalledClaims) {
    const days = daysSince(claim.reportedDate);
    if (days >= 14) {
      score += RISK_WEIGHTS.STALLED_CLAIM_14;
      factors.push(`Sinistro ${claim.claimNumber} em análise há ${days} dias`);
    } else if (days >= 7) {
      score += RISK_WEIGHTS.STALLED_CLAIM_7;
      factors.push(`Sinistro ${claim.claimNumber} aguarda análise há ${days} dias`);
    }
  }

  // ── 4. Severidade dos sinistros ativos ────────────────────────────────────
  const hasCritical = activeClaims.some(c => c.severity === 'CRITICAL');
  const hasHigh     = activeClaims.some(c => c.severity === 'HIGH');

  if (hasCritical) {
    score += RISK_WEIGHTS.CRITICAL_CLAIM;
    factors.push('Sinistro com severidade CRÍTICA');
  } else if (hasHigh) {
    score += RISK_WEIGHTS.HIGH_CLAIM;
    factors.push('Sinistro com severidade ALTA');
  }

  // ── 5. Vencimento da apólice ──────────────────────────────────────────────
  if (policy.endDate && policy.status === 'ACTIVE') {
    const daysLeft = daysUntil(policy.endDate);
    if (daysLeft >= 0 && daysLeft <= 30) {
      score += RISK_WEIGHTS.NEAR_EXPIRATION_30;
      factors.push(`Apólice vence em ${daysLeft} dias`);
    } else if (daysLeft > 30 && daysLeft <= 60) {
      score += RISK_WEIGHTS.NEAR_EXPIRATION_60;
      factors.push(`Apólice vence em ${daysLeft} dias`);
    }
  }

  // ── 6. Sinistros rejeitados ───────────────────────────────────────────────
  const rejectedCount = claims.filter(c => c.status === 'REJECTED').length;
  if (rejectedCount > 0) {
    score += RISK_WEIGHTS.CLAIM_REJECTED;
    factors.push(`${rejectedCount} sinistro(s) rejeitado(s)`);
  }

  // Cap em 100
  score = Math.min(score, 100);

  return {
    riskScore:     score,
    riskLevel:     scoreToRiskLevel(score),
    riskBreakdown: factors.length > 0
      ? factors.join('; ')
      : 'Nenhum fator de risco identificado'
  };
}

function scoreToRiskLevel(score) {
  if (score >= 56) return 'CRITICAL';
  if (score >= 36) return 'HIGH';
  if (score >= 16) return 'MEDIUM';
  return 'LOW';
}

/** Criticality para badges coloridos no Fiori (1=red, 2=orange, 3=green, 0=neutral) */
function scoreToFioriCriticality(score) {
  if (score >= 56) return 1;  // vermelho
  if (score >= 36) return 2;  // laranja
  if (score >= 16) return 3;  // amarelo/neutro
  return 0;                   // cinza
}

module.exports = { calculatePolicyRisk, scoreToRiskLevel, scoreToFioriCriticality };
