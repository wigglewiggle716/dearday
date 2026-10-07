// Staff MFA helpers. Authorization is also checked by database predicates.
export const STAFF_ROLES=new Set(['super_admin','admin','operations','accountant','partner_manager','customer_support','marketing','content_admin']);
export function safePortalPath(value,fallback='/Dear-Day-Staff.html'){
  try{const u=new URL(value,location.origin);return u.origin===location.origin&&/^\/Dear-Day-(Admin(?:-[A-Za-z-]+)?|Staff|Finance|Notifications)\.html$/.test(u.pathname)?u.pathname:fallback}catch{return fallback}
}
export async function needsChallenge(client){
  const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error)throw error;
  return data.nextLevel==='aal2'&&data.currentLevel!=='aal2';
}
export async function guardMfa(client,role,next=location.pathname){
  if(STAFF_ROLES.has(role)&&await needsChallenge(client)){
    location.replace('/Dear-Day-Security.html?next='+encodeURIComponent(safePortalPath(next)));
    return false;
  }
  return true;
}
