using InsuranceService as service from '../../srv/insurance-service';

// ─── CLAIMS: List Report + Object Page ───────────────────────────────────────
annotate service.Claims with @(

    UI.SelectionFields : [ 
        policy.policyNumber,
        status, 
        severity, 
        adjusterName,
        incidentDate
    ],

    UI.LineItem : [
        { $Type : 'UI.DataField', Value : claimNumber,     Label : '{i18n>claimNumber}' },
        { $Type : 'UI.DataField', Value : policy.policyNumber, Label : '{i18n>policyNumber}' },
        { $Type : 'UI.DataField', Value : policy.customerName, Label : '{i18n>customerName}' },
        { $Type : 'UI.DataField', Value : incidentDate,    Label : '{i18n>incidentDate}' },
        { 
            $Type : 'UI.DataField', 
            Value : status,
            Label : '{i18n>status}',
            Criticality : claimStatusCriticality
        },
        { 
            $Type : 'UI.DataField', 
            Value : severity, 
            Label : '{i18n>severity}',
            Criticality : severityCriticality
        },
        { $Type : 'UI.DataField', Value : estimatedAmount, Label : '{i18n>estimatedAmount}' },
        { $Type : 'UI.DataField', Value : adjusterName,    Label : '{i18n>adjusterName}' },
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'InsuranceService.approveClaim',
            Label  : '{i18n>approveClaim}'
        },
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'InsuranceService.rejectClaim',
            Label  : '{i18n>rejectClaim}'
        }
    ],

    UI.HeaderInfo : {
        TypeName       : '{i18n>entityTypeNameSingular}',
        TypeNamePlural : '{i18n>entityTypeNamePlural}',
        Title          : { Value : claimNumber },
        Description    : { Value : description }
    },

    UI.HeaderFacets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'StatusKPI',
            Target : '@UI.DataPoint#Status'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'SeverityKPI',
            Target : '@UI.DataPoint#Severity'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'EstimatedAmountKPI',
            Target : '@UI.DataPoint#EstimatedAmount'
        }
    ],

    UI.DataPoint #Status : {
        Value       : status,
        Title       : '{i18n>dpStatus}',
        Criticality : claimStatusCriticality
    },

    UI.DataPoint #Severity : {
        Value       : severity,
        Title       : '{i18n>severity}',
        Criticality : severityCriticality
    },

    UI.DataPoint #EstimatedAmount : {
        Value : estimatedAmount,
        Title : '{i18n>estimatedAmount}'
    },

    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : claimNumber,
            },
            {
                $Type : 'UI.DataField',
                Value : incidentDate,
            },
            {
                $Type : 'UI.DataField',
                Value : reportedDate,
            },
            {
                $Type : 'UI.DataField',
                Value : description,
            },
            {
                $Type : 'UI.DataField',
                Value : location,
            },
            {
                $Type : 'UI.DataField',
                Value : status,
            },
            {
                $Type : 'UI.DataField',
                Value : severity,
            },
            {
                $Type : 'UI.DataField',
                Value : estimatedAmount,
            },
            {
                $Type : 'UI.DataField',
                Value : approvedAmount,
            },
            {
                $Type : 'UI.DataField',
                Value : paidAmount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'currency_code',
                Value : currency_code,
            },
            {
                $Type : 'UI.DataField',
                Label : 'approvalDate',
                Value : approvalDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'paymentDate',
                Value : paymentDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'closureDate',
                Value : closureDate,
            },
            {
                $Type : 'UI.DataField',
                Value : adjusterName,
            },
            {
                $Type : 'UI.DataField',
                Value : adjusterNotes,
            },
        ],
    },
    UI.Facets : [
        {
            $Type  : 'UI.CollectionFacet',
            ID     : 'ClaimInfo',
            Label  : '{i18n>facetClaimInfo}',
            Facets : [
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'IncidentData',
                    Label  : '{i18n>facetIncidentData}',
                    Target : '@UI.FieldGroup#IncidentData'
                },
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'FinancialData',
                    Label  : '{i18n>facetFinancialData}',
                    Target : '@UI.FieldGroup#FinancialData'
                },
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'ProcessData',
                    Label  : '{i18n>facetProcessData}',
                    Target : '@UI.FieldGroup#ProcessData'
                }
            ]
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'PolicyData',
            Label  : '{i18n>facetPolicyData}',
            Target : '@UI.FieldGroup#PolicyData'
        }
    ],

    UI.FieldGroup #IncidentData : {
        Data : [
            { $Type : 'UI.DataField', Value : incidentDate,  Label : '{i18n>incidentDate}' },
            { $Type : 'UI.DataField', Value : reportedDate,  Label : '{i18n>reportedDate}' },
            { $Type : 'UI.DataField', Value : location,      Label : '{i18n>location}' },
            { $Type : 'UI.DataField', Value : description,   Label : '{i18n>description}' },
            { 
                $Type : 'UI.DataField', 
                Value : severity, 
                Label : '{i18n>severity}',
                Criticality : severityCriticality
            }
        ]
    },

    UI.FieldGroup #FinancialData : {
        Data : [
            { $Type : 'UI.DataField', Value : estimatedAmount, Label : '{i18n>estimatedAmount}' },
            { $Type : 'UI.DataField', Value : approvedAmount,  Label : '{i18n>approvedAmount}' },
            { $Type : 'UI.DataField', Value : paidAmount,      Label : '{i18n>paidAmount}' },
            { $Type : 'UI.DataField', Value : currency_code,   Label : '{i18n>currency}' }
        ]
    },

    UI.FieldGroup #ProcessData : {
        Data : [
            { 
                $Type : 'UI.DataField', 
                Value : status, 
                Label : '{i18n>status}',
                Criticality : claimStatusCriticality
            },
            { $Type : 'UI.DataField', Value : adjusterName,    Label : '{i18n>adjusterName}' },
            { $Type : 'UI.DataField', Value : adjusterNotes,   Label : '{i18n>adjusterNotes}' },
            { $Type : 'UI.DataField', Value : approvalDate,    Label : '{i18n>approvalDate}' },
            { $Type : 'UI.DataField', Value : paymentDate,     Label : '{i18n>paymentDate}' },
            { $Type : 'UI.DataField', Value : closureDate,     Label : '{i18n>closureDate}' }
        ]
    },

    UI.FieldGroup #PolicyData : {
        Data : [
            { 
                $Type : 'UI.DataField', 
                Value : policy.policyNumber, 
                Label : '{i18n>policyNumber}' 
            },
            { 
                $Type : 'UI.DataField', 
                Value : policy.customerName, 
                Label : '{i18n>customerName}' 
            },
            { 
                $Type : 'UI.DataField', 
                Value : policy.insuranceType, 
                Label : '{i18n>insuranceType}' 
            },
            { 
                $Type : 'UI.DataField', 
                Value : policy.coverageAmount, 
                Label : '{i18n>coverageAmount}' 
            }
        ]
    }
);

// ─── VALUE HELPS ──────────────────────────────────────────────────────────────
annotate service.Claims with {
    policy @(
        Common.Text            : policy.policyNumber,
        Common.TextArrangement : #TextOnly,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Policies',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : policy_ID,
                    ValueListProperty : 'ID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'policyNumber',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'customerName',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'insuranceType',
                }
            ],
        }
    );
};

