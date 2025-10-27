export function ensurePublicUrl(name: string, value?: string) {
  if (!value || typeof value !== "string") {
    throw new Error(`${name} no está definido en el .env`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} no es una URL válida: ${value}`);
  }
  if (url.protocol !== "https:") {
    console.warn(`[WARN] ${name} no es https (${value}). Usa un túnel tipo ngrok/localtunnel en dev.`);
  }
  return url;
}

export function joinUrl(base: string, path: string) {
  const u = new URL(base);
  return new URL(path.replace(/^\/+/, ""), u).toString();
}
