'use client';

import { useSyncExternalStore } from 'react';
import type { ChaveCadastro, Dados, RegistroDe } from './tipos';

/**
 * Todos os dados ficam somente no localStorage do navegador.
 * Nada é enviado a servidores.
 */
const CHAVE = 'sgp:dados:v1';

const VAZIO: Dados = Object.freeze({
  administradores: [],
  usuarios: [],
  desenvolvedores: [],
  times: [],
  projetos: [],
  relatorios: [],
  marcos: [],
  cronograma: [],
}) as Dados;

let cache: Dados | null = null;
const ouvintes = new Set<() => void>();

function lista<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

function normalizar(bruto: unknown): Dados {
  const o = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>;
  return {
    administradores: lista(o.administradores),
    usuarios: lista(o.usuarios),
    desenvolvedores: lista(o.desenvolvedores),
    times: lista(o.times),
    projetos: lista(o.projetos),
    relatorios: lista(o.relatorios),
    marcos: lista(o.marcos),
    cronograma: lista(o.cronograma),
  };
}

function ler(): Dados {
  try {
    const texto = window.localStorage.getItem(CHAVE);
    return texto ? normalizar(JSON.parse(texto)) : { ...VAZIO };
  } catch (erro) {
    console.error('Não foi possível ler os dados salvos.', erro);
    try {
      const texto = window.localStorage.getItem(CHAVE);
      if (texto) window.localStorage.setItem(`${CHAVE}:corrompido:${Date.now()}`, texto);
    } catch {
      /* ignora */
    }
    return { ...VAZIO };
  }
}

function obter(): Dados {
  if (cache === null) cache = ler();
  return cache;
}

function notificar() {
  ouvintes.forEach((fn) => fn());
}

function assinar(fn: () => void) {
  ouvintes.add(fn);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      notificar();
    }
  };
  window.addEventListener('storage', aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(fn);
    window.removeEventListener('storage', aoMudarEmOutraAba);
  };
}

/**
 * Aplica uma alteração aos dados e grava no navegador.
 * Lança erro se não for possível gravar (ex.: armazenamento cheio).
 */
export function alterar(fn: (dados: Dados) => Dados): void {
  const novos = fn(obter());
  window.localStorage.setItem(CHAVE, JSON.stringify(novos));
  cache = novos;
  notificar();
}

/** Retorna os dados atuais, ou `null` enquanto ainda não foram carregados (renderização no servidor). */
export function useDados(): Dados | null {
  return useSyncExternalStore(assinar, obter, () => null);
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Inclui ou atualiza um registro de um cadastro. */
export function salvarRegistro<K extends ChaveCadastro>(chave: K, registro: RegistroDe<K>): void {
  alterar((d) => {
    const atual = d[chave] as RegistroDe<K>[];
    const existe = atual.some((r) => r.id === registro.id);
    const nova = existe ? atual.map((r) => (r.id === registro.id ? registro : r)) : [...atual, registro];
    return { ...d, [chave]: nova };
  });
}

type ChaveAcompanhamento = 'relatorios' | 'marcos' | 'cronograma';

/** Registra um item de acompanhamento de projeto (relatório, marco ou item de cronograma). */
export function adicionarAcompanhamento<K extends ChaveAcompanhamento>(chave: K, item: Dados[K][number]): void {
  alterar((d) => {
    if (!d.projetos.some((p) => p.id === item.projetoId)) {
      throw new Error('Projeto não encontrado.');
    }
    return { ...d, [chave]: [...d[chave], item] };
  });
}

/** Exclui um registro. A exclusão de um projeto remove junto relatórios, marcos e cronograma. */
export function excluirRegistro(chave: ChaveCadastro, id: string): void {
  alterar((d) => {
    const novos: Dados = { ...d, [chave]: (d[chave] as { id: string }[]).filter((r) => r.id !== id) };
    if (chave === 'projetos') {
      novos.relatorios = d.relatorios.filter((r) => r.projetoId !== id);
      novos.marcos = d.marcos.filter((m) => m.projetoId !== id);
      novos.cronograma = d.cronograma.filter((c) => c.projetoId !== id);
    }
    return novos;
  });
}
