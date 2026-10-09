"use client";

import {usePathname} from "next/navigation";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import StaffAdminShell from "./staff-admin-shell";
import {isStaffAdminPath} from "../lib/staff-admin-navigation";

// Keep the approved public storefront header/footer entirely separate from
// the administrator's fixed sidebar and operations layout.
export default function SiteLayoutChrome({children,locale}){
 const pathname=usePathname()||"/";
 if(isStaffAdminPath(pathname))
  return <StaffAdminShell locale={locale}>{children}</StaffAdminShell>;
 return <>
  <SiteHeader locale={locale}/>
  {children}
  <SiteFooter locale={locale}/>
 </>;
}
