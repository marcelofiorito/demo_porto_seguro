sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  const RISK_LABEL = { BAIXO: "Baixo", MEDIO: "Médio", ALTO: "Alto", CRITICO: "Crítico" };
  const RISK_STATE = { BAIXO: "Success", MEDIO: "Warning", ALTO: "Error", CRITICO: "Error" };

  return Controller.extend("com.portoseguro.dashboard.controller.Main", {

    onInit: function () {
      const oDashModel = new JSONModel({
        kpis: { total: 0, critico: 0, alto: 0, reviewPending: 0 },
        chartData: [],
        criticalClients: []
      });
      this.getView().setModel(oDashModel, "dashModel");
      this._loadDashboardData();
    },

    // ── Carrega CustomerRisks e computa KPIs + dados de gráfico ──────────────
    _loadDashboardData: async function () {
      const oModel = this.getOwnerComponent().getModel();
      const oView  = this.getView();

      try {
        const oListBinding = oModel.bindList("/CustomerRisks", null, null, null, {
          $orderby: "riskLevel desc,reviewDate asc"
        });
        const aContexts = await oListBinding.requestContexts(0, 500);
        const aRisks    = aContexts.map(ctx => ctx.getObject());

        const today    = new Date();
        const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        // KPIs
        const kpis = {
          total: aRisks.length,
          critico: aRisks.filter(r => r.riskLevel === "CRITICO").length,
          alto:    aRisks.filter(r => r.riskLevel === "ALTO").length,
          reviewPending: aRisks.filter(r => {
            if (!r.reviewDate) return false;
            const d = new Date(r.reviewDate);
            return d >= today && d <= in30Days;
          }).length
        };

        // Chart data (donut: Baixo/Médio/Alto/Crítico)
        const countMap = { BAIXO: 0, MEDIO: 0, ALTO: 0, CRITICO: 0 };
        aRisks.forEach(r => { if (countMap[r.riskLevel] !== undefined) countMap[r.riskLevel]++; });
        const chartData = Object.entries(countMap)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => ({ riskLabel: RISK_LABEL[k] || k, count: v }));

        // Top critical + alto clients (max 15)
        const criticalClients = aRisks
          .filter(r => r.riskLevel === "CRITICO" || r.riskLevel === "ALTO")
          .slice(0, 15)
          .map(r => ({
            businessPartner: r.businessPartner,
            riskLevel:       RISK_LABEL[r.riskLevel] || r.riskLevel,
            riskState:       RISK_STATE[r.riskLevel] || "None",
            segment:         r.segment   || "–",
            owner:           r.owner     || "–",
            reviewDate:      r.reviewDate
              ? new Date(r.reviewDate).toLocaleDateString("pt-BR")
              : "–"
          }));

        oView.getModel("dashModel").setData({ kpis, chartData, criticalClients });

      } catch (oErr) {
        console.error("[Dashboard] _loadDashboardData:", oErr);
      }
    },

    onNavigateToCustomers: function () {
      const sBase = window.location.href.replace(/\/dashboard\/.*/, "");
      window.location.href = sBase + "/clientes/webapp/index.html";
    }
  });
});
