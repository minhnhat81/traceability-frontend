export type Claims = {
  sub: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  roles?: string[];
  tenant?: string;
};

export function hasRole(claims: Claims | null, role: string) {
  if (!claims?.roles) return false;
  return claims.roles.includes(role);
}

export function sameTenant(claims: Claims | null, tenant: string) {
  if (!claims?.tenant) return false;
  return claims.tenant === tenant;
}
