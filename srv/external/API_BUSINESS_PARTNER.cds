/**
 * Simplified SAP API_BUSINESS_PARTNER model for CAP external service.
 * Contains only the fields needed for the Porto Seguro demo.
 *
 * For production: run `cds import API_BUSINESS_PARTNER.edmx` to regenerate
 * from the full S/4HANA Public Cloud metadata document.
 */

@cds.external
service API_BUSINESS_PARTNER {

  @Capabilities: { Deletable: false, Insertable: false, Updatable: false }
  entity A_BusinessPartner {
    key BusinessPartner          : String(10);
        BusinessPartnerFullName  : String(81);
        BusinessPartnerGrouping  : String(4);
        BusinessPartnerType      : String(2);
        SearchTerm1              : String(20);
        Industry                 : String(10);
        BusinessPartnerIsBlocked : Boolean;
        CreationDate             : Date;
        CreatedByUser            : String(12);
        LastChangeDate           : Date;
        OrganizationBPName1      : String(40);
        OrganizationBPName2      : String(40);
        IsNaturalPerson          : String(1);
        BusinessPartnerCategory  : String(1);
        Customer                 : String(10);
  }

}
