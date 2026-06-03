export type RolCompras = 'JEFE' | 'AUX' | 'OPER' | 'NONE';

export function getRolCompras(): RolCompras {
  const token = localStorage.getItem("jwt_token");
  if (!token) return 'NONE';
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const userRole = Number(payload.id_rol);
      const username = payload.usu_nombre || "";
      
      // Mapeo:
      // id_rol === 1 o username === 'admin' -> Purchasing Manager (JEFE)
      // id_rol === 11 -> Purchasing Manager (JEFE)
      // id_rol === 12 -> Purchasing Assistant (AUX)
      // id_rol === 13 -> Warehouse Operator (OPER)
      if (userRole === 1 || userRole === 11 || username === 'admin') {
        return 'JEFE';
      }
      if (userRole === 12) {
        return 'AUX';
      }
      if (userRole === 13) {
        return 'OPER';
      }
    }
  } catch (e) {
    console.error("Token decoding failed", e);
  }
  return 'NONE';
}
