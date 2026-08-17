sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"policymanagement/test/integration/pages/PoliciesList.gen",
	"policymanagement/test/integration/pages/PoliciesObjectPage.gen"
], function (JourneyRunner, PoliciesListGenerated, PoliciesObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('policymanagement') + '/test/flp.html#app-preview',
        pages: {
			onThePoliciesListGenerated: PoliciesListGenerated,
			onThePoliciesObjectPageGenerated: PoliciesObjectPageGenerated
        },
        async: true
    });

    return runner;
});

