using { insurance } from '../db/schema';

/**
 * InsuranceService — OData V4
 * Gestão de Apólices, Sinistros, Coberturas e RAG para seguros
 */
@path: '/odata/v4/insurance'
service InsuranceService {

    // ═══════════════════════════════════════════════════════════════
    // ENTIDADES CORE
    // ═══════════════════════════════════════════════════════════════

    @odata.draft.enabled
    entity Policies as projection on insurance.Policies {
        *,
        // Criticality calculada para cores no Fiori (1=Positive,2=Critical,3=Negative)
        virtual statusCriticality : Integer,
        virtual riskCriticality   : Integer,
        coverages : redirected to Coverages,
        claims    : redirected to Claims,
        documents : redirected to PolicyDocuments
    } actions {
        action calculateRisk()            returns Policies;
        action submitPolicy()             returns Policies;
        action cancelPolicy(reason : String(500)) returns Policies;
        action renewPolicy(months : Integer)      returns Policies;
    };

    entity Coverages as projection on insurance.Coverages {
        *,
        policy : redirected to Policies
    };

    entity Claims as projection on insurance.Claims {
        *,
        virtual claimStatusCriticality : Integer,
        virtual severityCriticality    : Integer,
        policy : redirected to Policies
    } actions {
        action approveClaim(approvedAmount : Decimal(15,2), notes : String(500)) returns Claims;
        action rejectClaim(reason : String(500))  returns Claims;
        action assignAdjuster(adjusterName : String(100))                        returns Claims;
        action markAsPaid(paidAmount : Decimal(15,2))                            returns Claims;
        action summarize()                         returns { summary : String(2000); sources : String(1000); };
        action draftEmail()                        returns { subject : String(200); body : String(4000); };
    };

    entity PolicyDocuments as projection on insurance.PolicyDocuments {
        *,
        policy : redirected to Policies,
        claim  : redirected to Claims
    };

    // ═══════════════════════════════════════════════════════════════
    // RAG — Documentos de Conhecimento
    // ═══════════════════════════════════════════════════════════════

    @readonly
    entity InsurancePolicyDocuments as projection on insurance.InsurancePolicyDocument {
        ID, fileName, category, policyType, description, chunkCount, createdAt, modifiedAt
    };

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS GLOBAIS — Risk & RAG
    // ═══════════════════════════════════════════════════════════════

    /** Calcula score de risco de uma apólice com breakdown dos fatores */
    action calculatePolicyRisk(policyID : UUID) returns {
        policyID      : UUID;
        riskScore     : Integer;
        riskLevel     : String(8);
        riskBreakdown : String(1000);
    };

    /** Upload de documento de conhecimento (texto/PDF) para RAG */
    action uploadInsurancePolicy(
        fileName    : String(255),
        category    : String(50),
        policyType  : String(20),
        description : String(500),
        content     : LargeString   // texto plain ou base64
    ) returns {
        ID         : UUID;
        fileName   : String(255);
        chunkCount : Integer;
    };

    /** Remove documento de conhecimento e seus chunks */
    action deleteInsurancePolicy(ID : UUID) returns Boolean;

    /** Busca semântica em documentos de conhecimento */
    function searchPolicyClauses(
        query      : String(500),
        policyType : String(20),
        topK       : Integer
    ) returns array of {
        chunkID      : UUID;
        documentName : String(255);
        category     : String(50);
        score        : Double;
        snippet      : String(600);
    };

    // ═══════════════════════════════════════════════════════════════
    // TYPES
    // ═══════════════════════════════════════════════════════════════

    type RiskResult {
        policyID      : UUID;
        riskScore     : Integer;
        riskLevel     : String(8);
        riskBreakdown : String(1000);
    }
}
