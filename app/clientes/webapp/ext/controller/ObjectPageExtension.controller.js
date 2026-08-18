sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/VBox",
  "sap/m/Label",
  "sap/m/Select",
  "sap/m/TextArea",
  "sap/m/DatePicker",
  "sap/ui/core/Item"
], function (JSONModel, Filter, FilterOperator,
             MessageToast, Dialog, Button, VBox, Label, Select, TextArea, DatePicker, Item) {
  "use strict";

  const RISK_LEVELS = [
    { key: "BAIXO",   text: "Baixo"   },
    { key: "MEDIO",   text: "Médio"   },
    { key: "ALTO",    text: "Alto"    },
    { key: "CRITICO", text: "Crítico" }
  ];

  const SEGMENTS = [
    { key: "AUTO",        text: "Automóvel"   },
    { key: "SAUDE",       text: "Saúde"       },
    { key: "VIDA",        text: "Vida"        },
    { key: "RESIDENCIAL", text: "Residencial" },
    { key: "EMPRESARIAL", text: "Empresarial" }
  ];

  const NOTE_TYPES = [
    { key: "LIGACAO",     text: "Ligação"      },
    { key: "EMAIL",       text: "E-mail"       },
    { key: "REUNIAO",     text: "Reunião"      },
    { key: "COMPROMISSO", text: "Compromisso"  },
    { key: "INTERNO",     text: "Interno"      }
  ];

  const NOTE_TYPE_STATE = {
    LIGACAO: "Information", EMAIL: "Success", REUNIAO: "Warning",
    COMPROMISSO: "Error",   INTERNO: "None"
  };

  return {

    onAfterBinding: function (oBindingContext) {
      if (!oBindingContext) return;
      const oView = this.getView();
      const sBP   = oBindingContext.getProperty("BusinessPartner");

      oView.setModel(new JSONModel({
        riskLevel:  oBindingContext.getProperty("riskLevel")  || "",
        segment:    oBindingContext.getProperty("segment")    || "",
        riskReason: oBindingContext.getProperty("riskReason") || "",
        owner:      oBindingContext.getProperty("owner")      || "",
        reviewDate: oBindingContext.getProperty("reviewDate") || "",
        riskLevels: RISK_LEVELS,
        segments:   SEGMENTS
      }), "riskModel");

      this._loadNotes(sBP);
    },

    onSaveRisk: async function () {
      const oView     = this.getView();
      const oModel    = oView.getModel();
      const oCtx      = oView.getBindingContext();
      const oRiskData = oView.getModel("riskModel").getData();
      const sBP       = oCtx.getProperty("BusinessPartner");

      if (!oRiskData.riskLevel) {
        MessageToast.show("Selecione o nível de risco antes de salvar.");
        return;
      }

      try {
        const oAction = oModel.bindContext("/setRisk(...)");
        oAction.setParameter("businessPartner", sBP);
        oAction.setParameter("riskLevel",       oRiskData.riskLevel);
        oAction.setParameter("riskReason",      oRiskData.riskReason  || "");
        oAction.setParameter("segment",         oRiskData.segment     || "");
        oAction.setParameter("owner",           oRiskData.owner       || "");
        if (oRiskData.reviewDate) {
          oAction.setParameter("reviewDate", oRiskData.reviewDate);
        }
        await oAction.execute();
        oCtx.refresh();
        MessageToast.show("Classificação de risco atualizada com sucesso.");
      } catch (oErr) {
        MessageToast.show("Erro ao salvar classificação. Tente novamente.");
        console.error("[RiskClassification] setRisk error:", oErr);
      }
    },

    onAddNote: function () {
      const oView = this.getView();

      if (!this._oNoteDialog) {
        oView.setModel(new JSONModel({
          noteType:    "LIGACAO",
          noteText:    "",
          followUpDate: "",
          noteTypes:   NOTE_TYPES
        }), "noteForm");

        this._oNoteDialog = new Dialog({
          title: "Nova Nota de Interação",
          contentWidth: "520px",
          content: [
            new VBox({
              class: "sapUiSmallMarginBeginEnd",
              items: [
                new Label({ text: "Tipo de Interação", required: true }),
                new Select({
                  selectedKey: "{noteForm>/noteType}",
                  width: "100%",
                  items: {
                    path: "noteForm>/noteTypes",
                    template: new Item({ key: "{noteForm>key}", text: "{noteForm>text}" })
                  }
                }),
                new Label({ text: "Descrição", required: true, class: "sapUiSmallMarginTop" }),
                new TextArea({
                  value: "{noteForm>/noteText}",
                  rows: 5,
                  growing: true,
                  width: "100%",
                  placeholder: "Descreva a interação com o cliente..."
                }),
                new Label({ text: "Data de Acompanhamento", class: "sapUiSmallMarginTop" }),
                new DatePicker({
                  value: "{noteForm>/followUpDate}",
                  valueFormat: "yyyy-MM-dd",
                  displayFormat: "dd/MM/yyyy",
                  width: "100%"
                })
              ]
            })
          ],
          beginButton: new Button({
            text: "Salvar Nota",
            type: "Emphasized",
            press: this.onSaveNote.bind(this)
          }),
          endButton: new Button({
            text: "Cancelar",
            press: () => this._oNoteDialog.close()
          })
        });

        oView.addDependent(this._oNoteDialog);
      }

      const oNoteFormModel = oView.getModel("noteForm");
      oNoteFormModel.setProperty("/noteType",    "LIGACAO");
      oNoteFormModel.setProperty("/noteText",    "");
      oNoteFormModel.setProperty("/followUpDate", "");

      this._oNoteDialog.open();
    },

    onSaveNote: async function () {
      const oView  = this.getView();
      const oModel = oView.getModel();
      const sBP    = oView.getBindingContext().getProperty("BusinessPartner");
      const oData  = oView.getModel("noteForm").getData();

      if (!oData.noteText || !oData.noteText.trim()) {
        MessageToast.show("A descrição da nota é obrigatória.");
        return;
      }

      try {
        const oListBinding = oModel.bindList("/CustomerNotes");
        oListBinding.create({
          businessPartner: sBP,
          noteType:        oData.noteType,
          noteText:        oData.noteText.trim(),
          followUpDate:    oData.followUpDate || null,
          resolved:        false
        });

        this._oNoteDialog.close();
        MessageToast.show("Nota registrada com sucesso.");
        this._loadNotes(sBP);
      } catch (oErr) {
        MessageToast.show("Erro ao salvar nota. Tente novamente.");
        console.error("[InteractionNotes] createNote error:", oErr);
      }
    },

    _loadNotes: async function (sBP) {
      if (!sBP) return;
      const oView  = this.getView();
      const oModel = oView.getModel();

      try {
        const oListBinding = oModel.bindList("/CustomerNotes", null, null, [
          new Filter("businessPartner", FilterOperator.EQ, sBP)
        ], { $orderby: "createdAt desc" });

        const aContexts = await oListBinding.requestContexts(0, 100);

        const aNotes = aContexts.map(ctx => {
          const o = ctx.getObject();
          return {
            ...o,
            noteTypeText:  NOTE_TYPES.find(t => t.key === o.noteType)?.text || o.noteType,
            noteTypeState: NOTE_TYPE_STATE[o.noteType] || "None",
            createdAt:     o.createdAt
              ? new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
              : "",
            createdBy:    (o.createdBy || "").replace(/@.*$/, ""),
            followUpDate: o.followUpDate || ""
          };
        });

        oView.setModel(new JSONModel(aNotes), "notesModel");
      } catch (oErr) {
        console.error("[InteractionNotes] loadNotes error:", oErr);
        oView.setModel(new JSONModel([]), "notesModel");
      }
    }
  };
});
