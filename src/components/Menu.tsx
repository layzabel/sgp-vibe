'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const ITENS_MENU = [
  { href: '/administradores', rotulo: 'Administradores' },
  { href: '/usuarios', rotulo: 'Usuários' },
  { href: '/desenvolvedores', rotulo: 'Desenvolvedores' },
  { href: '/times', rotulo: 'Times' },
  { href: '/projetos', rotulo: 'Projetos' },
];

export function Menu() {
  const caminho = usePathname();
  return (
    <nav className="menu" aria-label="Menu principal">
      <ul>
        {ITENS_MENU.map((item) => {
          const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link href={item.href} className={ativo ? 'ativo' : undefined} aria-current={ativo ? 'page' : undefined}>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
