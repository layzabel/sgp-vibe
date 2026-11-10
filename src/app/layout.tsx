import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Menu } from '@/components/Menu';
import { Notificacoes } from '@/components/Notificacoes';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'SGP – Gerenciamento de Projetos', template: '%s | SGP' },
  description: 'Sistema de gerenciamento de projetos de software. Os dados ficam somente neste navegador.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="pular-para-conteudo">
          Pular para o conteúdo
        </a>
        <Notificacoes>
          <div className="estrutura">
            <aside className="barra-lateral">
              <Link href="/" className="marca">
                <span className="marca-sigla" aria-hidden="true">
                  SGP
                </span>
                <span className="marca-nome">Gerenciamento de Projetos</span>
              </Link>
              <Menu />
              <p className="nota-local">Os dados ficam salvos somente neste navegador.</p>
            </aside>
            <main id="conteudo" className="conteudo" tabIndex={-1}>
              {children}
            </main>
          </div>
        </Notificacoes>
      </body>
    </html>
  );
}
