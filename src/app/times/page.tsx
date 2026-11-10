import type { Metadata } from 'next';
import { Suspense } from 'react';
import Times from '@/cadastros/Times';

export const metadata: Metadata = { title: 'Times' };

export default function Pagina() {
  return (
    <Suspense fallback={<p className="carregando">Carregando…</p>}>
      <Times />
    </Suspense>
  );
}
