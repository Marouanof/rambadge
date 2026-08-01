export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYE: 'employe',
  SURETE: 'surete',
}

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 0,
  [ROLES.ADMIN]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.SURETE]: 3,
  [ROLES.EMPLOYE]: 4,
}
