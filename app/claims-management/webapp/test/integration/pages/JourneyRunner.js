sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"claimsmanagement/test/integration/pages/ClaimsList.gen",
	"claimsmanagement/test/integration/pages/ClaimsObjectPage.gen"
], function (JourneyRunner, ClaimsListGenerated, ClaimsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('claimsmanagement') + '/test/flp.html#app-preview',
        pages: {
			onTheClaimsListGenerated: ClaimsListGenerated,
			onTheClaimsObjectPageGenerated: ClaimsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

