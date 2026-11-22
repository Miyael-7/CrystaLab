/** Normaliza el hash de la URL a una ruta: '' | '#' | '#/' → '/'; quita '?…' y la '/' final. */
export function readHashPath(hash: string): string {
  let p = hash.replace(/^#/, '');
  const q = p.indexOf('?');
  if (q >= 0) p = p.slice(0, q);
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}
