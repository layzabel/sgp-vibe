'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type TipoAviso = 'sucesso' | 'erro';
type Aviso = { id: number; tipo: TipoAviso; texto: string };

type OpcoesDialogo = {
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  /** Quando falso, mostra apenas um botão "Entendi" (diálogo informativo). */
  confirmacao?: boolean;
};

type Contexto = {
  sucesso: (texto: string) => void;
  erro: (texto: string) => void;
  confirmar: (opcoes: OpcoesDialogo) => Promise<boolean>;
  informar: (opcoes: Omit<OpcoesDialogo, 'confirmacao' | 'textoConfirmar'>) => Promise<void>;
};

const NotificacoesContexto = createContext<Contexto | null>(null);

export function useNotificacoes(): Contexto {
  const ctx = useContext(NotificacoesContexto);
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de <Notificacoes>.');
  return ctx;
}

export function Notificacoes({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoId = useRef(1);
  const [dialogo, setDialogo] = useState<(OpcoesDialogo & { resolver: (v: boolean) => void }) | null>(null);
  const refDialogo = useRef<HTMLDialogElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  const remover = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);

  const adicionar = useCallback(
    (tipo: TipoAviso, texto: string) => {
      const id = proximoId.current++;
      setAvisos((a) => [...a.slice(-3), { id, tipo, texto }]);
      window.setTimeout(() => remover(id), tipo === 'erro' ? 8000 : 5000);
    },
    [remover],
  );

  const abrirDialogo = useCallback((opcoes: OpcoesDialogo) => {
    return new Promise<boolean>((resolver) => {
      focoAnterior.current = document.activeElement as HTMLElement | null;
      setDialogo({ confirmacao: true, ...opcoes, resolver });
    });
  }, []);

  const valor: Contexto = {
    sucesso: useCallback((t: string) => adicionar('sucesso', t), [adicionar]),
    erro: useCallback((t: string) => adicionar('erro', t), [adicionar]),
    confirmar: abrirDialogo,
    informar: useCallback(
      async (o: Omit<OpcoesDialogo, 'confirmacao' | 'textoConfirmar'>) => {
        await abrirDialogo({ ...o, confirmacao: false });
      },
      [abrirDialogo],
    ),
  };

  useEffect(() => {
    const el = refDialogo.current;
    if (dialogo && el && !el.open) el.showModal();
  }, [dialogo]);

  const fechar = (resultado: boolean) => {
    if (!dialogo) return;
    dialogo.resolver(resultado);
    refDialogo.current?.close();
    setDialogo(null);
    focoAnterior.current?.focus?.();
  };

  return (
    <NotificacoesContexto.Provider value={valor}>
      {children}

      <div className="avisos" role="region" aria-label="Mensagens">
        <div aria-live="polite" aria-atomic="false">
          {avisos.map((a) => (
            <div key={a.id} className={`aviso aviso-${a.tipo}`} role={a.tipo === 'erro' ? 'alert' : 'status'}>
              <span className="aviso-icone" aria-hidden="true">
                {a.tipo === 'sucesso' ? '✓' : '!'}
              </span>
              <span className="aviso-texto">{a.texto}</span>
              <button type="button" className="aviso-fechar" onClick={() => remover(a.id)} aria-label="Fechar mensagem">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <dialog
        ref={refDialogo}
        className="dialogo"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensagem"
        onCancel={(e) => {
          e.preventDefault();
          fechar(false);
        }}
      >
        {dialogo && (
          <>
            <h2 id="dialogo-titulo">{dialogo.titulo}</h2>
            <div id="dialogo-mensagem" className="dialogo-mensagem">
              {dialogo.mensagem}
            </div>
            <div className="dialogo-acoes">
              {dialogo.confirmacao ? (
                <>
                  <button type="button" className="botao" onClick={() => fechar(false)} autoFocus>
                    Cancelar
                  </button>
                  <button type="button" className="botao botao-perigo" onClick={() => fechar(true)}>
                    {dialogo.textoConfirmar ?? 'Confirmar'}
                  </button>
                </>
              ) : (
                <button type="button" className="botao botao-primario" onClick={() => fechar(true)} autoFocus>
                  Entendi
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </NotificacoesContexto.Provider>
  );
}
