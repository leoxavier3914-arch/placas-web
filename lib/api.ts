export async function parseJsonSafe<T = any>(
  res: Response | Request
): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if ('status' in res) {
      throw new Error(text || `Servidor retornou ${res.status} sem JSON.`);
    }
    throw new Error(text || 'Requisição sem JSON.');
  }
  return res.json();
}
