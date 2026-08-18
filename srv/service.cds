using API_BUSINESS_PARTNER as ext from './external/API_BUSINESS_PARTNER';
using com.portoseguro as db from '../db/schema';

// ════════════════════════════════════════════════════════════════
//  Serviço principal: CustomerService
//  Exposição OData V4 do modelo de extensão Porto Seguro
// ════════════════════════════════════════════════════════════════

service CustomerService @(path: '/odata/v4/porto-seguro') {

  // ── Clientes lidos do S/4HANA, enriquecidos com campos de extensão ──
  @readonly
  entity Customers as projection on ext.A_BusinessPartner {
    key BusinessPartner,
        BusinessPartnerFullName,
        BusinessPartnerGrouping,
        BusinessPartnerType,
        SearchTerm1,
        Industry,
        CreationDate,
        Customer,
        IsNaturalPerson,
        BusinessPartnerCategory,
        // Campos virtuais: populados no handler via CustomerRisk local
        virtual null as riskLevel            : String(10),
        virtual null as riskLevelCriticality : Integer,
        virtual null as segment              : String(30),
        virtual null as riskReason           : String(500),
        virtual null as owner                : String(100),
        virtual null as reviewDate           : Date
  }

  // ── Classificações de risco (extensão local) ──────────────────────
  entity CustomerRisks  as projection on db.CustomerRisk;

  // ── Notas de interação (extensão local) ──────────────────────────
  entity CustomerNotes  as projection on db.CustomerNote;

  // ── Lookup entities para ValueHelp (sem duplicatas) ──────────────
  @readonly entity RiskLevelVH as projection on db.RiskLevelVH;
  @readonly entity SegmentVH   as projection on db.SegmentVH;
  @readonly entity GroupingVH  as projection on db.GroupingVH;

  // ── Ação: classificar risco de um cliente ────────────────────────
  action setRisk(
    businessPartner : String(10),
    riskLevel       : String(10),
    riskReason      : String(500),
    segment         : String(30),
    owner           : String(100),
    reviewDate      : Date
  ) returns CustomerRisks;
}

// ════════════════════════════════════════════════════════════════
//  Anotações Fiori Elements — Customers
// ════════════════════════════════════════════════════════════════

annotate CustomerService.Customers with @(

  UI.HeaderInfo: {
    TypeName       : 'Cliente',
    TypeNamePlural : 'Clientes',
    Title          : { $Type: 'UI.DataField', Value: BusinessPartnerFullName },
    Description    : { $Type: 'UI.DataField', Value: BusinessPartner }
  },

  UI.LineItem: [
    { $Type: 'UI.DataField',              Value: BusinessPartner,         Label: 'Cód. BP',      ![@UI.Importance]: #Low  },
    { $Type: 'UI.DataField',              Value: BusinessPartnerFullName,  Label: 'Nome Completo'                          },
    { $Type: 'UI.DataField',              Value: BusinessPartnerGrouping,  Label: 'Agrupamento',  ![@UI.Importance]: #Low  },
    { $Type: 'UI.DataField',              Value: Industry,                 Label: 'Setor',        ![@UI.Importance]: #Low  },
    {
      $Type       : 'UI.DataFieldWithCriticality',
      Value       : riskLevel,
      Criticality : riskLevelCriticality,
      Label       : 'Nível de Risco',
      ![@UI.Importance]: #High
    },
    { $Type: 'UI.DataField', Value: segment,      Label: 'Segmento'        },
    { $Type: 'UI.DataField', Value: CreationDate, Label: 'Data de Criação', ![@UI.Importance]: #Low }
  ],

  UI.SelectionFields: [ BusinessPartnerGrouping, riskLevel, segment ],

  UI.HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#RiskLevel' }
  ],

  UI.DataPoint#RiskLevel: {
    Title       : 'Nível de Risco',
    Value       : riskLevel,
    Criticality : riskLevelCriticality
  },

  UI.Facets: [
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'GeneralInfoFacet',
      Label  : 'Informações Gerais',
      Target : '@UI.FieldGroup#GeneralInfo'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'RiskFacet',
      Label  : 'Perfil de Risco',
      Target : '@UI.FieldGroup#RiskProfile'
    }
  ],

  UI.FieldGroup#GeneralInfo: {
    Label : 'Informações Gerais',
    Data  : [
      { $Type: 'UI.DataField', Value: BusinessPartner,        Label: 'Cód. BP'         },
      { $Type: 'UI.DataField', Value: BusinessPartnerFullName, Label: 'Nome Completo'   },
      { $Type: 'UI.DataField', Value: BusinessPartnerGrouping, Label: 'Agrupamento'     },
      { $Type: 'UI.DataField', Value: BusinessPartnerType,     Label: 'Tipo de BP'      },
      { $Type: 'UI.DataField', Value: Industry,                Label: 'Setor'           },
      { $Type: 'UI.DataField', Value: IsNaturalPerson,         Label: 'Pessoa Física'   },
      { $Type: 'UI.DataField', Value: CreationDate,            Label: 'Data de Criação' }
    ]
  },

  UI.FieldGroup#RiskProfile: {
    Label : 'Perfil de Risco',
    Data  : [
      { $Type: 'UI.DataFieldWithCriticality', Value: riskLevel,   Criticality: riskLevelCriticality, Label: 'Nível de Risco' },
      { $Type: 'UI.DataField',                Value: segment,      Label: 'Segmento'                   },
      { $Type: 'UI.DataField',                Value: owner,        Label: 'Responsável'                },
      { $Type: 'UI.DataField',                Value: reviewDate,   Label: 'Data de Revisão'            },
      { $Type: 'UI.DataField',                Value: riskReason,   Label: 'Motivo do Risco'            }
    ]
  },

  Common.Label : 'Clientes'
);

// Labels e Value Helps para campos dos filtros
annotate CustomerService.Customers with {
  BusinessPartnerGrouping @(
    Common.Label: 'Agrupamento',
    Common.ValueList: {
      CollectionPath : 'GroupingVH',
      Parameters     : [{ $Type: 'Common.ValueListParameterOut', LocalDataProperty: BusinessPartnerGrouping, ValueListProperty: 'code' }]
    },
    Common.ValueListWithFixedValues: true
  );
  riskLevel @(
    Common.Label: 'Nível de Risco',
    Common.ValueList: {
      CollectionPath : 'RiskLevelVH',
      Parameters     : [{ $Type: 'Common.ValueListParameterOut', LocalDataProperty: riskLevel, ValueListProperty: 'code' }]
    },
    Common.ValueListWithFixedValues: true
  );
  segment @(
    Common.Label: 'Segmento',
    Common.ValueList: {
      CollectionPath : 'SegmentVH',
      Parameters     : [{ $Type: 'Common.ValueListParameterOut', LocalDataProperty: segment, ValueListProperty: 'code' }]
    },
    Common.ValueListWithFixedValues: true
  );
}

// ════════════════════════════════════════════════════════════════
//  Anotações Fiori Elements — CustomerNotes
// ════════════════════════════════════════════════════════════════

annotate CustomerService.CustomerNotes with @(
  UI.HeaderInfo: {
    TypeName       : 'Nota',
    TypeNamePlural : 'Notas'
  },
  UI.LineItem: [
    {
      $Type       : 'UI.DataField',
      Value       : noteType,
      Label       : 'Tipo',
      ![@UI.Importance]: #High
    },
    { $Type: 'UI.DataField', Value: noteText,     Label: 'Texto'             },
    { $Type: 'UI.DataField', Value: followUpDate, Label: 'Follow-up'         },
    { $Type: 'UI.DataField', Value: resolved,     Label: 'Resolvido'         },
    { $Type: 'UI.DataField', Value: createdAt,    Label: 'Criado em',        ![@UI.Importance]: #Low }
  ]
);
