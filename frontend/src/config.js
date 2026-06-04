/** API and WebSocket base URLs (see frontend/.env.development). */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function resolveWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}
