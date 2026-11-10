import type { Metadata } from 'next';
import { Suspense } from 'react';
import Projetos from '@/cadastros/Projetos';

export const metadata: Metadata = { title: 'Projetos' };

export default function Pagina() {
  return (
    <Suspense fallback={<p className="carregando">Carregando…</p>}>
      <Projetos />
    </Suspense>
  );
}
