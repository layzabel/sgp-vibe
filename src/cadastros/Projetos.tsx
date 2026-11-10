'use client';

import Link from 'next/link';
import { Cadastro, type ConfigCadastro } from '@/components/Cadastro';
import { SeloSituacao } from '@/components/SeloSituacao';
import { SITUACOES } from '@/lib/tipos';
import { contem, formatarData } from '@/lib/util';
import { Acompanhamento } from './Acompanhamento';
import { nomeTime, opcoesTimes } from './comum';

const opcoesSituacoes = () => SITUACOES.map((s) => ({ valor: s.valor, rotulo: s.rotulo }));

const config: ConfigCadastro<'projetos'> = {
  chave: 'projetos',
  singular: 'Projeto',
  plural: 'Projetos',
  artigo: 'o',
  descricao: 'Projetos de software, com relatórios, marcos e cronograma.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
    { nome: 'situacao', rotulo: 'Situação', tipo: 'select', obrigatorio: true, opcoes: opcoesSituacoes },
    { nome: 'dataInicio', rotulo: 'Data de início', tipo: 'date', obrigatorio: true },
    { nome: 'dataTermino', rotulo: 'Data de término prevista', tipo: 'date' },
    {
      nome: 'timeId',
      rotulo: 'Time responsável',
      tipo: 'select',
      obrigatorio: true,
      opcoes: opcoesTimes,
      semOpcoes: (
        <>
          Nenhum time cadastrado. <Link href="/times?novo=1">Cadastre um time</Link> antes.
        </>
      ),
    },
    { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
  ],
  colunas: [
    { rotulo: 'Nome', valor: (r) => r.nome },
    { rotulo: 'Situação', valor: (r) => <SeloSituacao situacao={r.situacao} /> },
    { rotulo: 'Time responsável', valor: (r, d) => nomeTime(d, r.timeId) },
    { rotulo: 'Início', valor: (r) => formatarData(r.dataInicio) },
    { rotulo: 'Término previsto', valor: (r) => (r.dataTermino ? formatarData(r.dataTermino) : '—') },
  ],
  buscaRotulo: 'Buscar por nome',
  busca: (r, termo) => contem(r.nome, termo),
  filtros: [
    { nome: 'situacao', rotulo: 'Situação', todos: 'Todas as situações', opcoes: opcoesSituacoes, aplicar: (r, v) => r.situacao === v },
    { nome: 'time', rotulo: 'Time', todos: 'Todos os times', opcoes: opcoesTimes, aplicar: (r, v) => r.timeId === v },
  ],
  validar: (v) =>
    v.dataInicio && v.dataTermino && v.dataTermino < v.dataInicio
      ? { dataTermino: 'A data de término prevista não pode ser anterior à data de início.' }
      : {},
  avisoExclusao: (r, d) => {
    const rel = d.relatorios.filter((x) => x.projetoId === r.id).length;
    const mar = d.marcos.filter((x) => x.projetoId === r.id).length;
    const cro = d.cronograma.filter((x) => x.projetoId === r.id).length;
    return (
      <p className="aviso-exclusao">
        Também serão excluídos {rel} relatório(s), {mar} marco(s) e {cro} item(ns) de cronograma deste projeto.
      </p>
    );
  },
  detalhesExtras: (r, d) => <Acompanhamento projetoId={r.id} dados={d} />,
};

export default function Projetos() {
  return <Cadastro config={config} />;
}
