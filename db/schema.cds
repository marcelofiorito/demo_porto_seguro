namespace insurance;

using { cuid, managed, Currency } from '@sap/cds/common';

// ═══════════════════════════════════════════════════════════════════
// TIPOS E ENUMS
// ═══════════════════════════════════════════════════════════════════

type InsuranceType : String(10) enum {
    AUTO     = 'AUTO';
    HOME     = 'HOME';
    LIFE     = 'LIFE';
    HEALTH   = 'HEALTH';
    BUSINESS = 'BUSINESS';
}

type PolicyStatus : String(12) enum {
    DRAFT     = 'DRAFT';
    ACTIVE    = 'ACTIVE';
    SUSPENDED = 'SUSPENDED';
    CANCELLED = 'CANCELLED';
    EXPIRED   = 'EXPIRED';
}

type ClaimStatus : String(14) enum {
    SUBMITTED    = 'SUBMITTED';
    UNDER_REVIEW = 'UNDER_REVIEW';
    APPROVED     = 'APPROVED';
    REJECTED     = 'REJECTED';
    PAID         = 'PAID';
    CLOSED       = 'CLOSED';
}

type ClaimSeverity : String(8) enum {
    LOW      = 'LOW';
    MEDIUM   = 'MEDIUM';
    HIGH     = 'HIGH';
    CRITICAL = 'CRITICAL';
}

type RiskLevel : String(8) enum {
    LOW      = 'LOW';
    MEDIUM   = 'MEDIUM';
    HIGH     = 'HIGH';
    CRITICAL = 'CRITICAL';
}

// ═══════════════════════════════════════════════════════════════════
// ENTIDADES CORE
// ═══════════════════════════════════════════════════════════════════

/**
 * Apólices de Seguro — entidade principal
 */
entity Policies : cuid, managed {
    policyNumber     : String(20)     @mandatory;
    // Cliente
    customerName     : String(100)    @mandatory;
    customerEmail    : String(100);
    customerPhone    : String(20);
    customerCPF      : String(14);
    // Apólice
    insuranceType    : InsuranceType  @mandatory;
    status           : PolicyStatus   default 'DRAFT';
    // Datas
    startDate        : Date           @mandatory;
    endDate          : Date           @mandatory;
    issueDate        : Date;
    // Valores
    coverageAmount   : Decimal(15,2)  @mandatory;
    premium          : Decimal(10,2)  @mandatory;
    deductible       : Decimal(10,2);
    currency         : Currency       default 'BRL';
    // Bem segurado
    assetDescription : String(500);
    // Risco calculado
    riskScore        : Integer        default 0;
    riskLevel        : RiskLevel      default 'LOW';
    riskBreakdown    : String(1000);
    // Relacionamentos
    coverages        : Composition of many Coverages      on coverages.policy = $self;
    claims           : Composition of many Claims         on claims.policy    = $self;
    documents        : Composition of many PolicyDocuments on documents.policy = $self;
}

/**
 * Coberturas de cada Apólice
 */
entity Coverages : cuid, managed {
    policy         : Association to Policies;
    coverageName   : String(100)   @mandatory;
    description    : String(500);
    coverageAmount : Decimal(15,2) @mandatory;
    isActive       : Boolean       default true;
}

/**
 * Sinistros — ocorrências registradas pelos segurados
 */
entity Claims : cuid, managed {
    policy          : Association to Policies @mandatory;
    claimNumber     : String(20)    @mandatory;
    // Incidente
    incidentDate    : Date          @mandatory;
    reportedDate    : DateTime      @mandatory;
    description     : String(1000) @mandatory;
    location        : String(200);
    // Status
    status          : ClaimStatus   default 'SUBMITTED';
    severity        : ClaimSeverity default 'MEDIUM';
    // Valores
    estimatedAmount : Decimal(15,2);
    approvedAmount  : Decimal(15,2);
    paidAmount      : Decimal(15,2);
    currency        : Currency      default 'BRL';
    // Processamento
    approvalDate    : Date;
    paymentDate     : Date;
    closureDate     : Date;
    // Avaliador
    adjusterName    : String(100);
    adjusterNotes   : String(2000);
}

/**
 * Documentos vinculados a apólices/sinistros
 * Preparado para integração futura com SAP DMS (CMIS)
 */
entity PolicyDocuments : cuid, managed {
    policy       : Association to Policies;
    claim        : Association to Claims;
    documentType : String(50);   // Foto, Laudo, BO, Contrato
    fileName     : String(255);
    mimeType     : String(100);
    fileSize     : Integer;
    // DMS metadata (futuro)
    objectId     : String(255);
    repositoryId : String(120);
    description  : String(500);
}

// ═══════════════════════════════════════════════════════════════════
// RAG — Base de Conhecimento (Contratos, Cláusulas, SLAs)
// ═══════════════════════════════════════════════════════════════════

/**
 * Documentos de políticas/contratos para grounding da IA
 */
entity InsurancePolicyDocument : cuid, managed {
    fileName    : String(255) @mandatory;
    category    : String(50);    // CONTRATO, CLAUSULA, SLA, REGULAMENTO, CONDICOES
    policyType  : String(20);    // AUTO, HOME, LIFE, GERAL
    description : String(500);
    chunkCount  : Integer        default 0;
    chunks      : Composition of many InsurancePolicyChunk on chunks.document = $self;
}

/**
 * Chunks de texto com embeddings para busca semântica
 * Em SQLite: embeddingJson (JSON serializado)
 * Em HANA Cloud: embedding (Vector nativo 1536 dims)
 */
entity InsurancePolicyChunk : cuid {
    document      : Association to InsurancePolicyDocument @mandatory;
    chunkIndex    : Integer;
    chunkText     : LargeString;
    embeddingJson : LargeString;  // fallback para SQLite / dev local
    tokenEstimate : Integer;
}
