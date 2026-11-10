// Pré-carregado (via NODE_OPTIONS) em todos os processos do Next.js.
// Impede que o servidor de desenvolvimento/produção faça requisições HTTP
// a qualquer host que não seja a própria máquina.
const LOCAIS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0']);

const fetchOriginal = globalThis.fetch;

if (typeof fetchOriginal === 'function' && !globalThis.__sgpRedeBloqueada) {
  globalThis.__sgpRedeBloqueada = true;
  globalThis.fetch = function fetchSomenteLocal(input, init) {
    let url;
    try {
      const bruto = typeof input === 'string' || input instanceof URL ? input : input?.url;
      url = new URL(String(bruto));
    } catch {
      return fetchOriginal(input, init);
    }
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !LOCAIS.has(url.hostname)) {
      return Promise.reject(new Error(`[SGP] Requisição externa bloqueada: ${url.origin}`));
    }
    return fetchOriginal(input, init);
  };
}
