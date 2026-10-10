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
 // The original account dashboard is a self-contained workspace, not a
 // storefront page. Do not wrap its classic sidebar in the shop header/footer.
 if(/^\/(?:en\/)?partner(?:\/|$)/.test(pathname))return children;
 return <>
  <SiteHeader locale={locale}/>
  {children}
  <SiteFooter locale={locale}/>
 </>;
}
