// Executa o CLI do Next.js garantindo que nenhum dado saia da máquina:
// - desativa a telemetria do Next.js;
// - pré-carrega um bloqueio de rede que impede requisições a hosts externos
//   (ex.: verificação de versão que o `next dev` faz no registro npm).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const bloqueio = pathToFileURL(path.join(dir, 'bloquear-rede.mjs')).href;
const nextBin = require.resolve('next/dist/bin/next');

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import=${bloqueio}`].filter(Boolean).join(' '),
};

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => child.kill(sinal));
}
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
