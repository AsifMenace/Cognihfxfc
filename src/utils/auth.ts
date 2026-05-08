export function getAdminHeaders(): Record<string, string> {
  const token = localStorage.getItem('adminToken') ?? '';
  return { 'Content-Type': 'application/json', 'X-Admin-Token': token };
}
