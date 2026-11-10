'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { excluirRegistro, novoId, salvarRegistro, useDados } from '@/lib/armazenamento';
import type { ChaveCadastro, Dados, RegistroDe } from '@/lib/tipos';
import { dataValida, emailValido, formatarData } from '@/lib/util';
import { useNotificacoes } from './Notificacoes';

export type Opcao = { valor: string; rotulo: string };
export type Valores = Record<string, string>;
export type Erros = Record<string, string>;

export type Campo = {
  nome: string;
  rotulo: string;
  tipo: 'text' | 'email' | 'tel' | 'textarea' | 'date' | 'select';
  obrigatorio?: boolean;
  opcoes?: (d: Dados) => Opcao[];
  /** Mensagem exibida quando um campo de seleção não tem opções disponíveis. */
  semOpcoes?: ReactNode;
  maxLength?: number;
  autoComplete?: string;
};

export type Filtro<T> = {
  nome: string;
  rotulo: string;
  todos: string;
  opcoes: (d: Dados) => Opcao[];
  aplicar: (registro: T, valor: string) => boolean;
};

export type Coluna<T> = {
  rotulo: string;
  valor: (registro: T, d: Dados) => ReactNode;
  principal?: boolean;
};

export type ConfigCadastro<K extends ChaveCadastro> = {
  chave: K;
  singular: string;
  plural: string;
  /** Artigo para mensagens: "o" administrador, "o" time... */
  artigo: 'o' | 'a';
  descricao: string;
  campos: Campo[];
  colunas: Coluna<RegistroDe<K>>[];
  buscaRotulo: string;
  busca: (registro: RegistroDe<K>, termo: string, d: Dados) => boolean;
  filtros?: Filtro<RegistroDe<K>>[];
  validar?: (valores: Valores, d: Dados, idEditando: string | null) => Partial<Erros>;
  impedirExclusao?: (registro: RegistroDe<K>, d: Dados) => string | null;
  avisoExclusao?: (registro: RegistroDe<K>, d: Dados) => ReactNode;
  detalhesExtras?: (registro: RegistroDe<K>, d: Dados) => ReactNode;
};

type Modo = { tipo: 'lista' } | { tipo: 'novo' } | { tipo: 'editar'; id: string } | { tipo: 'detalhes'; id: string };

function lerModo(params: URLSearchParams): Modo {
  const ver = params.get('ver');
  const editar = params.get('editar');
  if (params.has('novo')) return { tipo: 'novo' };
  if (editar) return { tipo: 'editar', id: editar };
  if (ver) return { tipo: 'detalhes', id: ver };
  return { tipo: 'lista' };
}

function valorExibido(campo: Campo, valor: string, d: Dados): string {
  if (!valor) return '—';
  if (campo.tipo === 'date') return formatarData(valor);
  if (campo.tipo === 'select' && campo.opcoes) {
    return campo.opcoes(d).find((o) => o.valor === valor)?.rotulo ?? '(registro não encontrado)';
  }
  return valor;
}

export function Cadastro<K extends ChaveCadastro>({ config }: { config: ConfigCadastro<K> }) {
  const dados = useDados();
  const params = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();
  const modo = lerModo(params);

  const ir = (query: string) => {
    router.push(query ? `${caminho}?${query}` : caminho, { scroll: true });
  };

  if (dados === null) {
    return <p className="carregando">Carregando dados…</p>;
  }

  const registros = dados[config.chave] as RegistroDe<K>[];
  const registro = 'id' in modo ? registros.find((r) => r.id === modo.id) : undefined;

  if ((modo.tipo === 'editar' || modo.tipo === 'detalhes') && !registro) {
    return (
      <section>
        <Cabecalho titulo={config.plural} />
        <div className="vazio">
          <p>O registro solicitado não foi encontrado. Ele pode ter sido excluído.</p>
          <button type="button" className="botao" onClick={() => ir('')}>
            Voltar à lista
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {modo.tipo === 'lista' && <Lista config={config} dados={dados} registros={registros} ir={ir} />}
      {modo.tipo === 'novo' && <Formulario key="novo" config={config} dados={dados} ir={ir} />}
      {modo.tipo === 'editar' && registro && (
        <Formulario key={`editar-${registro.id}`} config={config} dados={dados} registro={registro} ir={ir} />
      )}
      {modo.tipo === 'detalhes' && registro && <Detalhes config={config} dados={dados} registro={registro} ir={ir} />}
    </>
  );
}

function Cabecalho({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <header className="cabecalho-pagina">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p className="descricao">{descricao}</p>}
      </div>
      {acoes && <div className="acoes">{acoes}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Exclusão                                                            */
/* ------------------------------------------------------------------ */

function useExcluir<K extends ChaveCadastro>(config: ConfigCadastro<K>, dados: Dados) {
  const { confirmar, informar, sucesso, erro } = useNotificacoes();
  return async (registro: RegistroDe<K>): Promise<boolean> => {
    const nome = (registro as { nome?: string }).nome ?? '';
    const motivo = config.impedirExclusao?.(registro, dados);
    if (motivo) {
      await informar({ titulo: `Não é possível excluir ${config.artigo} ${config.singular.toLowerCase()}`, mensagem: <p>{motivo}</p> });
      return false;
    }
    const aviso = config.avisoExclusao?.(registro, dados);
    const ok = await confirmar({
      titulo: `Excluir ${config.singular.toLowerCase()}?`,
      mensagem: (
        <>
          <p>
            Tem certeza de que deseja excluir {config.artigo} {config.singular.toLowerCase()} <strong>{nome}</strong>?
          </p>
          {aviso}
          <p>Esta ação não pode ser desfeita.</p>
        </>
      ),
      textoConfirmar: 'Excluir',
    });
    if (!ok) return false;
    try {
      excluirRegistro(config.chave, registro.id);
      sucesso(`${config.singular} "${nome}" excluíd${config.artigo} com sucesso.`);
      return true;
    } catch (e) {
      console.error(e);
      erro(`Não foi possível excluir ${config.artigo} ${config.singular.toLowerCase()}. Tente novamente.`);
      return false;
    }
  };
}

/* ------------------------------------------------------------------ */
/* Lista                                                               */
/* ------------------------------------------------------------------ */

function Lista<K extends ChaveCadastro>({
  config,
  dados,
  registros,
  ir,
}: {
  config: ConfigCadastro<K>;
  dados: Dados;
  registros: RegistroDe<K>[];
  ir: (q: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const excluir = useExcluir(config, dados);
  const idBusca = useId();

  const visiveis = useMemo(() => {
    return registros
      .filter((r) => (busca.trim() ? config.busca(r, busca, dados) : true))
      .filter((r) => (config.filtros ?? []).every((f) => !filtros[f.nome] || f.aplicar(r, filtros[f.nome])))
      .sort((a, b) =>
        String((a as { nome?: string }).nome ?? '').localeCompare(String((b as { nome?: string }).nome ?? ''), 'pt-BR', {
          sensitivity: 'base',
        }),
      );
  }, [registros, busca, filtros, config, dados]);

  const temFiltroAtivo = busca.trim() !== '' || Object.values(filtros).some(Boolean);

  return (
    <section>
      <Cabecalho
        titulo={config.plural}
        descricao={config.descricao}
        acoes={
          <button type="button" className="botao botao-primario" onClick={() => ir('novo=1')}>
            + Cadastrar {config.singular.toLowerCase()}
          </button>
        }
      />

      <div className="barra-filtros" role="search">
        <div className="campo campo-busca">
          <label htmlFor={idBusca}>{config.buscaRotulo}</label>
          <input id={idBusca} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar…" />
        </div>
        {(config.filtros ?? []).map((f) => (
          <div className="campo" key={f.nome}>
            <label htmlFor={`${idBusca}-${f.nome}`}>{f.rotulo}</label>
            <select
              id={`${idBusca}-${f.nome}`}
              value={filtros[f.nome] ?? ''}
              onChange={(e) => setFiltros((atual) => ({ ...atual, [f.nome]: e.target.value }))}
            >
              <option value="">{f.todos}</option>
              {f.opcoes(dados).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </div>
        ))}
        {temFiltroAtivo && (
          <button
            type="button"
            className="botao botao-link"
            onClick={() => {
              setBusca('');
              setFiltros({});
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <p className="contagem" aria-live="polite">
        {visiveis.length === registros.length
          ? `${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}`
          : `${visiveis.length} de ${registros.length} registros`}
      </p>

      {registros.length === 0 ? (
        <div className="vazio">
          <p>
            Nenhum{config.artigo === 'a' ? 'a' : ''} {config.singular.toLowerCase()} cadastrad{config.artigo} ainda.
          </p>
          <button type="button" className="botao botao-primario" onClick={() => ir('novo=1')}>
            Cadastrar {config.singular.toLowerCase()}
          </button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="vazio">
          <p>Nenhum registro encontrado com a busca e os filtros informados.</p>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                {config.colunas.map((c) => (
                  <th key={c.rotulo} scope="col">
                    {c.rotulo}
                  </th>
                ))}
                <th scope="col" className="col-acoes">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((r) => {
                const nome = (r as { nome?: string }).nome ?? '';
                return (
                  <tr key={r.id}>
                    {config.colunas.map((c, i) => (
                      <td key={c.rotulo} data-rotulo={c.rotulo}>
                        {i === 0 ? (
                          <Link href={`?ver=${encodeURIComponent(r.id)}`} className="link-registro">
                            {c.valor(r, dados)}
                          </Link>
                        ) : (
                          c.valor(r, dados)
                        )}
                      </td>
                    ))}
                    <td className="col-acoes">
                      <div className="acoes-linha">
                        <button type="button" className="botao botao-pequeno" onClick={() => ir(`ver=${encodeURIComponent(r.id)}`)} aria-label={`Ver detalhes de ${nome}`}>
                          Detalhes
                        </button>
                        <button type="button" className="botao botao-pequeno" onClick={() => ir(`editar=${encodeURIComponent(r.id)}`)} aria-label={`Editar ${nome}`}>
                          Editar
                        </button>
                        <button type="button" className="botao botao-pequeno botao-perigo-contorno" onClick={() => excluir(r)} aria-label={`Excluir ${nome}`}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

function validarComum(campos: Campo[], valores: Valores, d: Dados): Erros {
  const erros: Erros = {};
  for (const c of campos) {
    const v = valores[c.nome] ?? '';
    if (c.obrigatorio && !v) {
      erros[c.nome] = c.tipo === 'select' ? `Selecione ${c.rotulo.toLowerCase()}.` : `O campo "${c.rotulo}" é obrigatório.`;
      continue;
    }
    if (!v) continue;
    if (c.tipo === 'email' && !emailValido(v)) {
      erros[c.nome] = 'Informe um e-mail válido (exemplo: nome@empresa.com).';
    } else if (c.tipo === 'date' && !dataValida(v)) {
      erros[c.nome] = 'Informe uma data válida.';
    } else if (c.tipo === 'select' && c.opcoes && !c.opcoes(d).some((o) => o.valor === v)) {
      erros[c.nome] = `Selecione uma opção válida para "${c.rotulo}".`;
    }
  }
  return erros;
}

function Formulario<K extends ChaveCadastro>({
  config,
  dados,
  registro,
  ir,
}: {
  config: ConfigCadastro<K>;
  dados: Dados;
  registro?: RegistroDe<K>;
  ir: (q: string) => void;
}) {
  const { sucesso, erro } = useNotificacoes();
  const editando = Boolean(registro);
  const [valores, setValores] = useState<Valores>(() => {
    const inicial: Valores = {};
    for (const c of config.campos) inicial[c.nome] = String((registro as Record<string, unknown> | undefined)?.[c.nome] ?? '');
    return inicial;
  });
  const [erros, setErros] = useState<Erros>({});
  const refForm = useRef<HTMLFormElement>(null);
  const prefixo = useId();

  useEffect(() => {
    refForm.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
  }, []);

  const alterarCampo = (nome: string, valor: string) => {
    setValores((v) => ({ ...v, [nome]: valor }));
    if (erros[nome]) setErros(({ [nome]: _, ...resto }) => resto);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const limpos: Valores = {};
    for (const c of config.campos) limpos[c.nome] = (valores[c.nome] ?? '').trim();

    const idAtual = registro?.id ?? null;
    // As validações comuns (obrigatório, formato) têm prioridade sobre as específicas do cadastro.
    const novosErros: Erros = Object.fromEntries(
      Object.entries({ ...config.validar?.(limpos, dados, idAtual), ...validarComum(config.campos, limpos, dados) }).filter(
        (par): par is [string, string] => Boolean(par[1]),
      ),
    );

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      const primeiro = config.campos.find((c) => novosErros[c.nome]);
      const rotulos = config.campos.filter((c) => novosErros[c.nome]).map((c) => c.rotulo);
      erro(`Não foi possível salvar. Verifique ${rotulos.length === 1 ? 'o campo' : 'os campos'}: ${rotulos.join(', ')}.`);
      if (primeiro) document.getElementById(`${prefixo}-${primeiro.nome}`)?.focus();
      return;
    }

    const id = registro?.id ?? novoId();
    try {
      salvarRegistro(config.chave, { ...limpos, id } as unknown as RegistroDe<K>);
    } catch (e) {
      console.error(e);
      erro('Não foi possível salvar os dados no navegador. Verifique se há espaço disponível e tente novamente.');
      return;
    }
    sucesso(
      `${config.singular} "${limpos.nome}" ${editando ? 'atualizad' : 'cadastrad'}${config.artigo} com sucesso.`,
    );
    ir(`ver=${encodeURIComponent(id)}`);
  };

  const cancelar = () => (registro ? ir(`ver=${encodeURIComponent(registro.id)}`) : ir(''));

  return (
    <section>
      <Cabecalho
        titulo={editando ? `Editar ${config.singular.toLowerCase()}` : `Cadastrar ${config.singular.toLowerCase()}`}
        descricao={editando ? `Alterando: ${(registro as { nome?: string }).nome}` : undefined}
      />
      <form ref={refForm} className="formulario cartao" onSubmit={enviar} noValidate>
        <p className="legenda-obrigatorio">
          Campos marcados com <span className="obrigatorio">*</span> são obrigatórios.
        </p>
        <div className="grade-campos">
          {config.campos.map((c) => (
            <CampoFormulario
              key={c.nome}
              id={`${prefixo}-${c.nome}`}
              campo={c}
              valor={valores[c.nome] ?? ''}
              erro={erros[c.nome]}
              dados={dados}
              onChange={(v) => alterarCampo(c.nome, v)}
            />
          ))}
        </div>
        <div className="acoes-formulario">
          <button type="button" className="botao" onClick={cancelar}>
            Cancelar
          </button>
          <button type="submit" className="botao botao-primario">
            {editando ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function CampoFormulario({
  id,
  campo,
  valor,
  erro,
  dados,
  onChange,
}: {
  id: string;
  campo: Campo;
  valor: string;
  erro?: string;
  dados: Dados;
  onChange: (valor: string) => void;
}) {
  const idErro = `${id}-erro`;
  const comuns = {
    id,
    name: campo.nome,
    value: valor,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': erro ? idErro : undefined,
    'aria-required': campo.obrigatorio || undefined,
  } as const;
  const opcoes = campo.opcoes?.(dados) ?? [];

  return (
    <div className={`campo${campo.tipo === 'textarea' ? ' campo-largo' : ''}${erro ? ' campo-com-erro' : ''}`}>
      <label htmlFor={id}>
        {campo.rotulo}
        {campo.obrigatorio && (
          <span className="obrigatorio" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {campo.tipo === 'textarea' ? (
        <textarea {...comuns} rows={4} maxLength={campo.maxLength ?? 2000} onChange={(e) => onChange(e.target.value)} />
      ) : campo.tipo === 'select' ? (
        <select {...comuns} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...comuns}
          type={campo.tipo}
          maxLength={campo.tipo === 'date' ? undefined : (campo.maxLength ?? 150)}
          autoComplete={campo.autoComplete ?? 'off'}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {campo.tipo === 'select' && opcoes.length === 0 && campo.semOpcoes && <p className="dica">{campo.semOpcoes}</p>}
      {erro && (
        <p id={idErro} className="erro-campo">
          {erro}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detalhes                                                            */
/* ------------------------------------------------------------------ */

function Detalhes<K extends ChaveCadastro>({
  config,
  dados,
  registro,
  ir,
}: {
  config: ConfigCadastro<K>;
  dados: Dados;
  registro: RegistroDe<K>;
  ir: (q: string) => void;
}) {
  const excluir = useExcluir(config, dados);
  const valores = registro as unknown as Valores;

  return (
    <section>
      <nav className="trilha" aria-label="Trilha de navegação">
        <button type="button" className="botao botao-link" onClick={() => ir('')}>
          ← Voltar para {config.plural.toLowerCase()}
        </button>
      </nav>
      <Cabecalho
        titulo={valores.nome}
        descricao={`Detalhes d${config.artigo} ${config.singular.toLowerCase()}`}
        acoes={
          <>
            <button type="button" className="botao" onClick={() => ir(`editar=${encodeURIComponent(registro.id)}`)}>
              Editar
            </button>
            <button
              type="button"
              className="botao botao-perigo-contorno"
              onClick={async () => {
                if (await excluir(registro)) ir('');
              }}
            >
              Excluir
            </button>
          </>
        }
      />
      <div className="cartao">
        <dl className="lista-detalhes">
          {config.campos.map((c) => (
            <div key={c.nome} className={c.tipo === 'textarea' ? 'detalhe-largo' : undefined}>
              <dt>{c.rotulo}</dt>
              <dd className={c.tipo === 'textarea' ? 'texto-livre' : undefined}>{valorExibido(c, valores[c.nome] ?? '', dados)}</dd>
            </div>
          ))}
        </dl>
      </div>
      {config.detalhesExtras?.(registro, dados)}
    </section>
  );
}
