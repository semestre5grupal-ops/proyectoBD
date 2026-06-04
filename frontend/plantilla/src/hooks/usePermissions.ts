export type RoleType = 'gerentetth' | 'auxiliartth' | 'operativotth' | string;

export function usePermissions() {
  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch {
      return null;
    }
  };

  const user = getUserInfo();
  // Asumimos operativotth por defecto o si no hay rol definido para máxima restricción. 
  // Si el usuario es admin, le damos gerentetth por defecto.
  const role: RoleType = user?.usu_nombre === 'admin' ? 'gerentetth' : (user?.rol_nombre || 'operativotth'); 

  const isGerente = role === 'gerentetth';
  const isAuxiliar = role === 'auxiliartth';
  const isOperativo = role === 'operativotth';

  return {
    role,
    isGerente,
    isAuxiliar,
    isOperativo,
    // Permisos generales
    canApprove: isGerente,
    canManageUsers: isGerente,
    canManagePeriods: isGerente,
    canEditCore: isGerente || isAuxiliar, // aux y gerente pueden editar catálogos
  };
}
