import type { Metadata } from 'next';
import { Suspense } from 'react';
import Administradores from '@/cadastros/Administradores';

export const metadata: Metadata = { title: 'Administradores' };

export default function Pagina() {
  return (
    <Suspense fallback={<p className="carregando">Carregando…</p>}>
      <Administradores />
    </Suspense>
  );
}
