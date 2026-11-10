'use client';

import Link from 'next/link';
import { Cadastro, type ConfigCadastro } from '@/components/Cadastro';
import { NIVEIS } from '@/lib/tipos';
import { contem } from '@/lib/util';
import { nomeTime, opcoesTimes, repetido } from './comum';

const opcoesNiveis = () => NIVEIS.map((n) => ({ valor: n.valor, rotulo: n.rotulo }));
const rotuloNivel = (v: string) => NIVEIS.find((n) => n.valor === v)?.rotulo ?? '—';

const config: ConfigCadastro<'desenvolvedores'> = {
  chave: 'desenvolvedores',
  singular: 'Desenvolvedor',
  plural: 'Desenvolvedores',
  artigo: 'o',
  descricao: 'Integrantes dos times de desenvolvimento.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, autoComplete: 'name' },
    { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, autoComplete: 'email' },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', autoComplete: 'tel', maxLength: 30 },
    { nome: 'cargo', rotulo: 'Cargo', tipo: 'text' },
    { nome: 'nivel', rotulo: 'Nível', tipo: 'select', obrigatorio: true, opcoes: opcoesNiveis },
    { nome: 'tecnologia', rotulo: 'Principal tecnologia', tipo: 'text' },
    {
      nome: 'timeId',
      rotulo: 'Time',
      tipo: 'select',
      obrigatorio: true,
      opcoes: opcoesTimes,
      semOpcoes: (
        <>
          Nenhum time cadastrado. <Link href="/times?novo=1">Cadastre um time</Link> antes.
        </>
      ),
    },
  ],
  colunas: [
    { rotulo: 'Nome', valor: (r) => r.nome },
    { rotulo: 'E-mail', valor: (r) => r.email },
    { rotulo: 'Nível', valor: (r) => rotuloNivel(r.nivel) },
    { rotulo: 'Time', valor: (r, d) => nomeTime(d, r.timeId) },
    { rotulo: 'Principal tecnologia', valor: (r) => r.tecnologia || '—' },
  ],
  buscaRotulo: 'Buscar por nome',
  busca: (r, termo) => contem(r.nome, termo),
  filtros: [
    { nome: 'time', rotulo: 'Time', todos: 'Todos os times', opcoes: opcoesTimes, aplicar: (r, v) => r.timeId === v },
    { nome: 'nivel', rotulo: 'Nível', todos: 'Todos os níveis', opcoes: opcoesNiveis, aplicar: (r, v) => r.nivel === v },
  ],
  validar: (v, d, id) =>
    repetido(d.desenvolvedores, 'email', v.email, id)
      ? { email: 'Já existe outro desenvolvedor cadastrado com este e-mail.' }
      : {},
};

export default function Desenvolvedores() {
  return <Cadastro config={config} />;
}
