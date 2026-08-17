using InsuranceService as service from '../../srv/insurance-service';

// ─── POLICIES: List Report + Object Page ─────────────────────────────────────
annotate service.Policies with @(

    UI.SelectionFields : [ insuranceType, status, riskLevel, customerName ],

    UI.LineItem : [
        { $Type : 'UI.DataField', Value : policyNumber,   Label : 'No Apolice' },
        { $Type : 'UI.DataField', Value : customerName,   Label : 'Cliente' },
        { $Type : 'UI.DataField', Value : insuranceType,  Label : 'Tipo' },
        { $Type : 'UI.DataField', Value : status,         Label : 'Status',         Criticality : statusCriticality },
        { $Type : 'UI.DataField', Value : premium,        Label : 'Premio (R$)' },
        { $Type : 'UI.DataField', Value : coverageAmount, Label : 'Cobertura (R$)' },
        { $Type : 'UI.DataField', Value : riskLevel,      Label : 'Risco',          Criticality : riskCriticality },
        { $Type : 'UI.DataField', Value : startDate,      Label : 'Inicio' },
        { $Type : 'UI.DataField', Value : endDate,        Label : 'Vencimento' },
    ],

    UI.HeaderInfo : {
        TypeName       : 'Apolice',
        TypeNamePlural : 'Apolices',
        Title       : { $Type : 'UI.DataField', Value : policyNumber },
        Description : { $Type : 'UI.DataField', Value : customerName },
    },

    UI.HeaderFacets : [
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#Status' },
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#RiskLevel' },
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#Premium' },
        { $Type : 'UI.ReferenceFacet', Target : '@UI.DataPoint#CoverageAmount' },
    ],

    UI.DataPoint #Status         : { Value : status,         Title : 'Status',         Criticality : statusCriticality },
    UI.DataPoint #RiskLevel      : { Value : riskLevel,      Title : 'Nivel de Risco', Criticality : riskCriticality },
    UI.DataPoint #Premium        : { Value : premium,        Title : 'Premio Mensal' },
    UI.DataPoint #CoverageAmount : { Value : coverageAmount, Title : 'Valor Segurado' },

    UI.Facets : [
        {
            $Type : 'UI.CollectionFacet', ID : 'PolicyInfo', Label : 'Informacoes da Apolice',
            Facets : [
                { $Type : 'UI.ReferenceFacet', ID : 'GeneralData',   Label : 'Dados Gerais',      Target : '@UI.FieldGroup#GeneralData' },
                { $Type : 'UI.ReferenceFacet', ID : 'CustomerData',  Label : 'Cliente',           Target : '@UI.FieldGroup#CustomerData' },
                { $Type : 'UI.ReferenceFacet', ID : 'FinancialData', Label : 'Dados Financeiros', Target : '@UI.FieldGroup#FinancialData' },
            ],
        },
        { $Type : 'UI.ReferenceFacet', ID : 'Coverages', Label : 'Coberturas',       Target : 'coverages/@UI.LineItem' },
        { $Type : 'UI.ReferenceFacet', ID : 'Claims',    Label : 'Sinistros',        Target : 'claims/@UI.LineItem' },
        { $Type : 'UI.ReferenceFacet', ID : 'RiskData',  Label : 'Analise de Risco', Target : '@UI.FieldGroup#RiskData' },
    ],

    UI.FieldGroup #GeneralData : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : policyNumber,     Label : 'No Apolice' },
            { $Type : 'UI.DataField', Value : insuranceType,    Label : 'Tipo de Seguro' },
            { $Type : 'UI.DataField', Value : status,           Label : 'Status', Criticality : statusCriticality },
            { $Type : 'UI.DataField', Value : startDate,        Label : 'Inicio da Vigencia' },
            { $Type : 'UI.DataField', Value : endDate,          Label : 'Fim da Vigencia' },
            { $Type : 'UI.DataField', Value : issueDate,        Label : 'Data de Emissao' },
            { $Type : 'UI.DataField', Value : assetDescription, Label : 'Bem Segurado' },
        ],
    },
    UI.FieldGroup #CustomerData : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : customerName,  Label : 'Nome' },
            { $Type : 'UI.DataField', Value : customerCPF,   Label : 'CPF' },
            { $Type : 'UI.DataField', Value : customerEmail, Label : 'E-mail' },
            { $Type : 'UI.DataField', Value : customerPhone, Label : 'Telefone' },
        ],
    },
    UI.FieldGroup #FinancialData : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : coverageAmount, Label : 'Valor de Cobertura (R$)' },
            { $Type : 'UI.DataField', Value : premium,        Label : 'Premio (R$)' },
            { $Type : 'UI.DataField', Value : deductible,     Label : 'Franquia (R$)' },
            { $Type : 'UI.DataField', Value : currency_code,  Label : 'Moeda' },
        ],
    },
    UI.FieldGroup #RiskData : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : riskScore,     Label : 'Score de Risco' },
            { $Type : 'UI.DataField', Value : riskLevel,     Label : 'Nivel de Risco', Criticality : riskCriticality },
            { $Type : 'UI.DataField', Value : riskBreakdown, Label : 'Analise Detalhada' },
        ],
    },

    UI.Identification : [
        { $Type : 'UI.DataFieldForAction', Action : 'InsuranceService.renewPolicy',   Label : 'Renovar Apolice' },
        { $Type : 'UI.DataFieldForAction', Action : 'InsuranceService.cancelPolicy',  Label : 'Cancelar Apolice' },
        { $Type : 'UI.DataFieldForAction', Action : 'InsuranceService.calculateRisk', Label : 'Calcular Risco' },
    ],
);


// ─── POLICIES: campos e criticality hidden ────────────────────────────────────
annotate service.Policies with {
    statusCriticality @UI.Hidden;
    riskCriticality   @UI.Hidden;
    policyNumber     @title : 'No Apolice';
    customerName     @title : 'Cliente';
    customerEmail    @title : 'E-mail';
    customerPhone    @title : 'Telefone';
    customerCPF      @title : 'CPF';
    insuranceType    @title : 'Tipo de Seguro';
    status           @title : 'Status';
    startDate        @title : 'Inicio';
    endDate          @title : 'Vencimento';
    issueDate        @title : 'Emissao';
    coverageAmount   @title : 'Valor Segurado';
    premium          @title : 'Premio';
    deductible       @title : 'Franquia';
    assetDescription @title : 'Bem Segurado';
    riskScore        @title : 'Score de Risco';
    riskLevel        @title : 'Risco';
    riskBreakdown    @title : 'Analise de Risco';
};

// ─── COVERAGES: tabela inline ─────────────────────────────────────────────────
annotate service.Coverages with @(
    UI.LineItem : [
        { $Type : 'UI.DataField', Value : coverageName,   Label : 'Cobertura' },
        { $Type : 'UI.DataField', Value : description,    Label : 'Descricao' },
        { $Type : 'UI.DataField', Value : coverageAmount, Label : 'Valor (R$)' },
        { $Type : 'UI.DataField', Value : isActive,       Label : 'Ativa' },
    ],
);
annotate service.Coverages with {
    coverageName   @title : 'Cobertura';
    description    @title : 'Descricao';
    coverageAmount @title : 'Valor (R$)';
    isActive       @title : 'Ativa';
};

// ─── CLAIMS: tabela inline ────────────────────────────────────────────────────
// Claims LineItem movido para app/claims-management/annotations.cds
// (para evitar duplicate assignment)
annotate service.Claims with {
    claimStatusCriticality @UI.Hidden;
    severityCriticality    @UI.Hidden;
    claimNumber     @title : 'No Sinistro';
    incidentDate    @title : 'Data Ocorrencia';
    reportedDate    @title : 'Data Abertura';
    description     @title : 'Descricao';
    location        @title : 'Local';
    status          @title : 'Status';
    severity        @title : 'Severidade';
    estimatedAmount @title : 'Valor Estimado (R$)';
    approvedAmount  @title : 'Valor Aprovado (R$)';
    paidAmount      @title : 'Valor Pago (R$)';
    adjusterName    @title : 'Avaliador';
    adjusterNotes   @title : 'Notas do Avaliador';
};


// ─── VALUE HELPS — Campos de seleção ─────────────────────────────────────────

// insuranceType — Tipo de Seguro
annotate service.Policies with {
    insuranceType @(
        Common.ValueList : {
            CollectionPath : 'Policies',
            Label          : 'Tipo de Seguro',
            Parameters     : [
                { $Type : 'Common.ValueListParameterOut', LocalDataProperty : insuranceType, ValueListProperty : 'insuranceType' },
            ],
        },
        Common.ValueListWithFixedValues : true,
    );
    status @(
        Common.ValueList : {
            CollectionPath : 'Policies',
            Label          : 'Status',
            Parameters     : [
                { $Type : 'Common.ValueListParameterOut', LocalDataProperty : status, ValueListProperty : 'status' },
            ],
        },
        Common.ValueListWithFixedValues : true,
    );
    riskLevel @(
        Common.ValueList : {
            CollectionPath : 'Policies',
            Label          : 'Nível de Risco',
            Parameters     : [
                { $Type : 'Common.ValueListParameterOut', LocalDataProperty : riskLevel, ValueListProperty : 'riskLevel' },
            ],
        },
        Common.ValueListWithFixedValues : true,
    );
};

annotate service.Claims with {
    status @(
        Common.ValueList : {
            CollectionPath : 'Claims',
            Label          : 'Status',
            Parameters     : [
                { $Type : 'Common.ValueListParameterOut', LocalDataProperty : status, ValueListProperty : 'status' },
            ],
        },
        Common.ValueListWithFixedValues : true,
    );
    severity @(
        Common.ValueList : {
            CollectionPath : 'Claims',
            Label          : 'Severidade',
            Parameters     : [
                { $Type : 'Common.ValueListParameterOut', LocalDataProperty : severity, ValueListProperty : 'severity' },
            ],
        },
        Common.ValueListWithFixedValues : true,
    );
};

