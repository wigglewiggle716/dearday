"use client";
import {PartnerPortalProvider} from "./partner-portal-base";
import PartnerOrdersPanel from "./partner-orders-panel";
import PartnerProductsPanel from "./partner-products-panel";
import PartnerPoliciesPanel from "./partner-policies-panel";
import StaffAvailability from "./staff-availability";

export default function PartnerPage({locale="ar",section="overview"}){
 return <PartnerPortalProvider locale={locale}>
  {["overview","orders","cancellations"].includes(section)?<PartnerOrdersPanel section={section}/>:
   section==="products"?<PartnerProductsPanel/>:
   section==="policies"?<PartnerPoliciesPanel/>:
   section==="availability"?<StaffAvailability locale={locale} portal="partner"/>:null}
 </PartnerPortalProvider>;
}
