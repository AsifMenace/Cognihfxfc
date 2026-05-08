export function validateAdmin(event) {
  const token = event.headers?.['x-admin-token'] ?? '';
  return token !== '' && token === process.env.ADMIN_PASSWORD;
}
