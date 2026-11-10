# SGP – Sistema de Gerenciamento de Projetos

Aplicação web para a equipe de administração organizar administradores, usuários,
desenvolvedores, times e projetos de software, com relatórios, marcos e cronograma
de cada projeto.

- **Stack:** Next.js 16 (App Router) + TypeScript, Node.js 24 LTS.
- **Dados:** ficam somente no `localStorage` do navegador (chave `sgp:dados:v1`).
  Não há backend nem banco de dados; nada é enviado a servidores ou terceiros.

## Como executar

Requer Node.js 24 ou superior.

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
```

Produção:

```bash
npm run build
npm start          # http://localhost:3000
```

Outros comandos: `npm run typecheck`.

## Privacidade

- Os scripts `dev`, `build` e `start` passam por [scripts/next.mjs](scripts/next.mjs), que
  desativa a telemetria do Next.js (`NEXT_TELEMETRY_DISABLED=1`) e pré-carrega
  [scripts/bloquear-rede.mjs](scripts/bloquear-rede.mjs), que impede os processos do Next.js de
  fazer requisições a hosts externos (por exemplo, a verificação de versão do `next dev`).
- O navegador recebe uma Content-Security-Policy que só permite comunicação com a própria
  aplicação ([next.config.ts](next.config.ts)).
- Não são usadas fontes, scripts ou imagens de CDNs.

## Estrutura

```
src/
  app/                 Rotas (App Router): /, /administradores, /usuarios,
                       /desenvolvedores, /times, /projetos
  cadastros/           Configuração de cada cadastro (campos, validações, filtros)
                       e o acompanhamento de projetos (relatórios, marcos, cronograma)
  components/          Componente genérico de cadastro, menu, mensagens e diálogos
  lib/                 Tipos, armazenamento local e utilitários
```

Cada tela de cadastro usa parâmetros na URL para o modo atual:
`?novo=1` (cadastrar), `?ver=<id>` (detalhes) e `?editar=<id>` (atualizar).
