import { SITUACOES } from '@/lib/tipos';

export function rotuloSituacao(valor: string): string {
  return SITUACOES.find((s) => s.valor === valor)?.rotulo ?? '—';
}

export function SeloSituacao({ situacao }: { situacao: string }) {
  return <span className={`selo selo-${situacao || 'nenhuma'}`}>{rotuloSituacao(situacao)}</span>;
}
