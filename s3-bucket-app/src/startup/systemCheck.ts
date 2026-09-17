import type { Plugin, ViteDevServer, PreviewServer } from 'vite';

const green = '\x1b[32m';
const reset = '\x1b[0m';

const ok = (label: string) => console.log(`${label}: ${green}ok ✔${reset}`);

async function checkBackend(backendTarget: string) {
  try {
    const res = await fetch(`${backendTarget}/api`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      ok('Conexão com o backend');
    } else {
      console.log(`Conexão com o backend: \x1b[31mfalhou ✖\x1b[0m (respondeu com status ${res.status})`);
    }
  } catch (error: any) {
    console.log(`Conexão com o backend: \x1b[31mfalhou ✖\x1b[0m (${error?.message || 'erro desconhecido'})`);
  }
}

const ROTAS_PROXY = ['/api', '/login', '/logout', '/oauth'];

function checkRotas() {
  console.log('Rotas (proxy para o backend):');
  ROTAS_PROXY.forEach((rota) => ok(`  ${rota}`));
}

// plugin que roda um checklist de saúde colorido quando o servidor dev/preview sobe
export function systemCheckPlugin(backendTarget: string): Plugin {
  async function runChecks() {
    await checkBackend(backendTarget);
    checkRotas();
  }

  return {
    name: 'system-check',
    configureServer(server: ViteDevServer) {
      server.httpServer?.once('listening', runChecks);
    },
    configurePreviewServer(server: PreviewServer) {
      server.httpServer?.once('listening', runChecks);
    },
  };
}
