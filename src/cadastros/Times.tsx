'use client';

import Link from 'next/link';
import { Cadastro, type ConfigCadastro } from '@/components/Cadastro';
import { SeloSituacao } from '@/components/SeloSituacao';
import { NIVEIS } from '@/lib/tipos';
import { contem } from '@/lib/util';
import { repetido } from './comum';

function plural(n: number, singular: string, pluralTexto: string) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

const config: ConfigCadastro<'times'> = {
  chave: 'times',
  singular: 'Time',
  plural: 'Times',
  artigo: 'o',
  descricao: 'Times de desenvolvimento responsáveis pelos projetos.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
    { nome: 'area', rotulo: 'Área de atuação', tipo: 'text' },
    { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
  ],
  colunas: [
    { rotulo: 'Nome', valor: (r) => r.nome },
    { rotulo: 'Área de atuação', valor: (r) => r.area || '—' },
    { rotulo: 'Desenvolvedores', valor: (r, d) => d.desenvolvedores.filter((x) => x.timeId === r.id).length },
    { rotulo: 'Projetos', valor: (r, d) => d.projetos.filter((x) => x.timeId === r.id).length },
  ],
  buscaRotulo: 'Buscar por nome',
  busca: (r, termo) => contem(r.nome, termo),
  validar: (v, d, id) => (repetido(d.times, 'nome', v.nome, id) ? { nome: 'Já existe outro time com este nome.' } : {}),
  impedirExclusao: (r, d) => {
    const devs = d.desenvolvedores.filter((x) => x.timeId === r.id).length;
    const projs = d.projetos.filter((x) => x.timeId === r.id).length;
    if (!devs && !projs) return null;
    const partes = [devs && plural(devs, 'desenvolvedor', 'desenvolvedores'), projs && plural(projs, 'projeto', 'projetos')]
      .filter(Boolean)
      .join(' e ');
    return `O time "${r.nome}" possui ${partes} vinculado(s). Para excluí-lo, primeiro transfira ou exclua os desenvolvedores e os projetos deste time.`;
  },
  detalhesExtras: (r, d) => {
    const devs = d.desenvolvedores
      .filter((x) => x.timeId === r.id)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    const projs = d.projetos
      .filter((x) => x.timeId === r.id)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    return (
      <div className="grade-secoes">
        <section className="cartao" aria-labelledby="time-devs">
          <h2 id="time-devs">Desenvolvedores do time ({devs.length})</h2>
          {devs.length === 0 ? (
            <p className="texto-suave">Nenhum desenvolvedor neste time.</p>
          ) : (
            <ul className="lista-simples">
              {devs.map((x) => (
                <li key={x.id}>
                  <Link href={`/desenvolvedores?ver=${encodeURIComponent(x.id)}`}>{x.nome}</Link>
                  <span className="texto-suave">
                    {[NIVEIS.find((n) => n.valor === x.nivel)?.rotulo, x.cargo].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="cartao" aria-labelledby="time-projs">
          <h2 id="time-projs">Projetos sob responsabilidade ({projs.length})</h2>
          {projs.length === 0 ? (
            <p className="texto-suave">Nenhum projeto sob responsabilidade deste time.</p>
          ) : (
            <ul className="lista-simples">
              {projs.map((x) => (
                <li key={x.id}>
                  <Link href={`/projetos?ver=${encodeURIComponent(x.id)}`}>{x.nome}</Link>
                  <SeloSituacao situacao={x.situacao} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  },
};

export default function Times() {
  return <Cadastro config={config} />;
}
