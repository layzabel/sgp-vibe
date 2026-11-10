'use client';

import { useId, useState, type FormEvent } from 'react';
import { CampoFormulario, type Campo, type Erros, type Valores } from '@/components/Cadastro';
import { useNotificacoes } from '@/components/Notificacoes';
import { adicionarAcompanhamento, novoId } from '@/lib/armazenamento';
import type { Dados } from '@/lib/tipos';
import { dataValida, formatarData, formatarDataHora } from '@/lib/util';

/**
 * Formulário simples de inclusão usado pelas três seções de acompanhamento.
 * Valida campos obrigatórios e datas, e chama `salvar` com os valores já limpos.
 */
function FormInclusao({
  campos,
  dados,
  textoBotao,
  salvar,
}: {
  campos: Campo[];
  dados: Dados;
  textoBotao: string;
  salvar: (valores: Valores) => boolean;
}) {
  const { erro } = useNotificacoes();
  const prefixo = useId();
  const vazio = () => Object.fromEntries(campos.map((c) => [c.nome, ''])) as Valores;
  const [valores, setValores] = useState<Valores>(vazio);
  const [erros, setErros] = useState<Erros>({});

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const limpos = Object.fromEntries(campos.map((c) => [c.nome, (valores[c.nome] ?? '').trim()])) as Valores;
    const novosErros: Erros = {};
    for (const c of campos) {
      if (c.obrigatorio && !limpos[c.nome]) novosErros[c.nome] = `O campo "${c.rotulo}" é obrigatório.`;
      else if (c.tipo === 'date' && limpos[c.nome] && !dataValida(limpos[c.nome])) novosErros[c.nome] = 'Informe uma data válida.';
    }
    if (Object.keys(novosErros).length) {
      setErros(novosErros);
      const rotulos = campos.filter((c) => novosErros[c.nome]).map((c) => c.rotulo);
      erro(`Não foi possível registrar. Verifique ${rotulos.length === 1 ? 'o campo' : 'os campos'}: ${rotulos.join(', ')}.`);
      const primeiro = campos.find((c) => novosErros[c.nome]);
      if (primeiro) document.getElementById(`${prefixo}-${primeiro.nome}`)?.focus();
      return;
    }
    if (salvar(limpos)) {
      setValores(vazio());
      setErros({});
    }
  };

  return (
    <form className="form-inclusao" onSubmit={enviar} noValidate>
      <div className="grade-campos">
        {campos.map((c) => (
          <CampoFormulario
            key={c.nome}
            id={`${prefixo}-${c.nome}`}
            campo={c}
            valor={valores[c.nome] ?? ''}
            erro={erros[c.nome]}
            dados={dados}
            onChange={(v) => {
              setValores((atual) => ({ ...atual, [c.nome]: v }));
              if (erros[c.nome]) setErros(({ [c.nome]: _, ...resto }) => resto);
            }}
          />
        ))}
      </div>
      <div className="acoes-formulario">
        <button type="submit" className="botao botao-primario">
          {textoBotao}
        </button>
      </div>
    </form>
  );
}

const CAMPOS_RELATORIO: Campo[] = [{ nome: 'texto', rotulo: 'Texto do relatório', tipo: 'textarea', obrigatorio: true, maxLength: 5000 }];
const CAMPOS_MARCO: Campo[] = [{ nome: 'descricao', rotulo: 'Descrição do marco', tipo: 'text', obrigatorio: true, maxLength: 300 }];
const CAMPOS_CRONOGRAMA: Campo[] = [
  { nome: 'atividade', rotulo: 'Atividade', tipo: 'text', obrigatorio: true, maxLength: 300 },
  { nome: 'dataPrevista', rotulo: 'Data prevista', tipo: 'date', obrigatorio: true },
];

export function Acompanhamento({ projetoId, dados }: { projetoId: string; dados: Dados }) {
  const { sucesso, erro } = useNotificacoes();

  const registrar = (acao: () => void, mensagem: string): boolean => {
    try {
      acao();
      sucesso(mensagem);
      return true;
    } catch (e) {
      console.error(e);
      erro('Não foi possível registrar. Verifique se o projeto ainda existe e se há espaço disponível no navegador.');
      return false;
    }
  };

  // Itens são gravados em ordem de criação; o índice desempata registros com o mesmo horário.
  const relatorios = dados.relatorios
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.projetoId === projetoId)
    .sort((a, b) => b.r.criadoEm.localeCompare(a.r.criadoEm) || b.i - a.i)
    .map(({ r }) => r);

  const marcos = dados.marcos
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.projetoId === projetoId)
    .sort((a, b) => a.m.criadoEm.localeCompare(b.m.criadoEm) || a.i - b.i)
    .map(({ m }) => m);

  const cronograma = dados.cronograma
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.projetoId === projetoId)
    .sort((a, b) => a.c.dataPrevista.localeCompare(b.c.dataPrevista) || a.i - b.i)
    .map(({ c }) => c);

  return (
    <div className="acompanhamento">
      <h2 className="titulo-secao">Acompanhamento do projeto</h2>

      <section className="cartao" aria-labelledby="sec-relatorios">
        <h3 id="sec-relatorios">Relatórios ({relatorios.length})</h3>
        <FormInclusao
          campos={CAMPOS_RELATORIO}
          dados={dados}
          textoBotao="Criar relatório"
          salvar={(v) =>
            registrar(
              () => adicionarAcompanhamento('relatorios', { id: novoId(), projetoId, texto: v.texto, criadoEm: new Date().toISOString() }),
              'Relatório criado com sucesso.',
            )
          }
        />
        {relatorios.length === 0 ? (
          <p className="texto-suave">Nenhum relatório registrado.</p>
        ) : (
          <ol className="linha-tempo" aria-label="Relatórios, do mais recente para o mais antigo">
            {relatorios.map((r) => (
              <li key={r.id}>
                <time dateTime={r.criadoEm} className="data-item">
                  {formatarDataHora(r.criadoEm)}
                </time>
                <p className="texto-livre">{r.texto}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="cartao" aria-labelledby="sec-marcos">
        <h3 id="sec-marcos">Marcos ({marcos.length})</h3>
        <FormInclusao
          campos={CAMPOS_MARCO}
          dados={dados}
          textoBotao="Criar marco"
          salvar={(v) =>
            registrar(
              () => adicionarAcompanhamento('marcos', { id: novoId(), projetoId, descricao: v.descricao, criadoEm: new Date().toISOString() }),
              'Marco criado com sucesso.',
            )
          }
        />
        {marcos.length === 0 ? (
          <p className="texto-suave">Nenhum marco registrado.</p>
        ) : (
          <ol className="lista-numerada" aria-label="Marcos, na ordem de criação">
            {marcos.map((m) => (
              <li key={m.id}>
                <span>{m.descricao}</span>
                <span className="texto-suave"> — registrado em {formatarDataHora(m.criadoEm)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="cartao" aria-labelledby="sec-cronograma">
        <h3 id="sec-cronograma">Cronograma ({cronograma.length})</h3>
        <FormInclusao
          campos={CAMPOS_CRONOGRAMA}
          dados={dados}
          textoBotao="Adicionar ao cronograma"
          salvar={(v) =>
            registrar(
              () =>
                adicionarAcompanhamento('cronograma', {
                  id: novoId(),
                  projetoId,
                  atividade: v.atividade,
                  dataPrevista: v.dataPrevista,
                }),
              'Item do cronograma criado com sucesso.',
            )
          }
        />
        {cronograma.length === 0 ? (
          <p className="texto-suave">Nenhum item no cronograma.</p>
        ) : (
          <div className="tabela-container">
            <table className="tabela">
              <caption className="sr-only">Cronograma ordenado pela data prevista</caption>
              <thead>
                <tr>
                  <th scope="col">Data prevista</th>
                  <th scope="col">Atividade</th>
                </tr>
              </thead>
              <tbody>
                {cronograma.map((c) => (
                  <tr key={c.id}>
                    <td data-rotulo="Data prevista">{formatarData(c.dataPrevista)}</td>
                    <td data-rotulo="Atividade">{c.atividade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
