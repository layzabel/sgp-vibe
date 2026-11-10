import type { Metadata } from 'next';
import { Suspense } from 'react';
import Usuarios from '@/cadastros/Usuarios';

export const metadata: Metadata = { title: 'Usuários' };

export default function Pagina() {
  return (
    <Suspense fallback={<p className="carregando">Carregando…</p>}>
      <Usuarios />
    </Suspense>
  );
}
