import type { Metadata } from 'next';
import { Suspense } from 'react';
import Desenvolvedores from '@/cadastros/Desenvolvedores';

export const metadata: Metadata = { title: 'Desenvolvedores' };

export default function Pagina() {
  return (
    <Suspense fallback={<p className="carregando">Carregando…</p>}>
      <Desenvolvedores />
    </Suspense>
  );
}
