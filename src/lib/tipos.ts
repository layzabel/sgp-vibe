export type Administrador = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  organizacao: string;
};

export type Nivel = 'junior' | 'pleno' | 'senior';

export type Desenvolvedor = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  nivel: Nivel | '';
  tecnologia: string;
  timeId: string;
};

export type Time = {
  id: string;
  nome: string;
  descricao: string;
  area: string;
};

export type Situacao = 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';

export type Projeto = {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string; // AAAA-MM-DD
  dataTermino: string; // AAAA-MM-DD (opcional)
  situacao: Situacao | '';
  timeId: string;
};

export type Relatorio = {
  id: string;
  projetoId: string;
  texto: string;
  criadoEm: string; // ISO 8601
};

export type Marco = {
  id: string;
  projetoId: string;
  descricao: string;
  criadoEm: string; // ISO 8601
};

export type ItemCronograma = {
  id: string;
  projetoId: string;
  atividade: string;
  dataPrevista: string; // AAAA-MM-DD
};

export type Dados = {
  administradores: Administrador[];
  usuarios: Usuario[];
  desenvolvedores: Desenvolvedor[];
  times: Time[];
  projetos: Projeto[];
  relatorios: Relatorio[];
  marcos: Marco[];
  cronograma: ItemCronograma[];
};

/** Cadastros que possuem tela própria de CRUD. */
export type ChaveCadastro = 'administradores' | 'usuarios' | 'desenvolvedores' | 'times' | 'projetos';

export type RegistroDe<K extends ChaveCadastro> = Dados[K][number];

export const NIVEIS: { valor: Nivel; rotulo: string }[] = [
  { valor: 'junior', rotulo: 'Júnior' },
  { valor: 'pleno', rotulo: 'Pleno' },
  { valor: 'senior', rotulo: 'Sênior' },
];

export const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'planejado', rotulo: 'Planejado' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Concluído' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
];
