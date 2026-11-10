import type { Opcao } from '@/components/Cadastro';
import type { Dados } from '@/lib/tipos';
import { normalizarTexto } from '@/lib/util';

export function opcoesTimes(d: Dados): Opcao[] {
  return [...d.times]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    .map((t) => ({ valor: t.id, rotulo: t.nome }));
}

export function nomeTime(d: Dados, id: string): string {
  return d.times.find((t) => t.id === id)?.nome ?? '—';
}

/** Verifica se já existe outro registro com o mesmo valor (sem diferenciar maiúsculas/acentos). */
export function repetido(
  lista: { id: string }[],
  campo: string,
  valor: string,
  idEditando: string | null,
): boolean {
  const alvo = normalizarTexto(valor);
  if (!alvo) return false;
  return lista.some(
    (r) => r.id !== idEditando && normalizarTexto(String((r as Record<string, unknown>)[campo] ?? '')) === alvo,
  );
}
