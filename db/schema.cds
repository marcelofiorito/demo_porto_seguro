namespace com.portoseguro;

using { cuid, managed } from '@sap/cds/common';

/**
 * Classificação de risco estendida por cliente.
 * Dados de extensão Porto Seguro — não existem no S/4HANA.
 */
entity CustomerRisk : managed {
  key businessPartner : String(10);
      riskLevel       : String(10) enum { BAIXO; MEDIO; ALTO; CRITICO; };
      riskReason      : String(500);
      segment         : String(30) enum { AUTO; SAUDE; VIDA; RESIDENCIAL; EMPRESARIAL; };
      owner           : String(100);
      reviewDate      : Date;
}

// Lookup entities for ValueHelp dropdowns (unique values, no duplicates)
entity RiskLevelVH { key code: String(10); }
entity SegmentVH   { key code: String(30); }
entity GroupingVH  { key code: String(10); }

entity CustomerNote : cuid, managed {
  businessPartner : String(10)  @mandatory;
  noteType        : String(20)  enum { LIGACAO; EMAIL; REUNIAO; COMPROMISSO; INTERNO; };
  noteText        : LargeString @mandatory;
  followUpDate    : Date;
  resolved        : Boolean default false;
}
