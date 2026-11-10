'use client';

import { Cadastro, type ConfigCadastro } from '@/components/Cadastro';
import { contem } from '@/lib/util';
import { repetido } from './comum';

const config: ConfigCadastro<'administradores'> = {
  chave: 'administradores',
  singular: 'Administrador',
  plural: 'Administradores',
  artigo: 'o',
  descricao: 'Pessoas que administram os projetos.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, autoComplete: 'name' },
    { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, autoComplete: 'email' },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', obrigatorio: true, autoComplete: 'tel', maxLength: 30 },
    { nome: 'cargo', rotulo: 'Cargo', tipo: 'text', obrigatorio: true },
    { nome: 'setor', rotulo: 'Setor', tipo: 'text', obrigatorio: true },
  ],
  colunas: [
    { rotulo: 'Nome', valor: (r) => r.nome },
    { rotulo: 'E-mail', valor: (r) => r.email },
    { rotulo: 'Telefone', valor: (r) => r.telefone },
    { rotulo: 'Cargo', valor: (r) => r.cargo },
    { rotulo: 'Setor', valor: (r) => r.setor },
  ],
  buscaRotulo: 'Buscar por nome ou e-mail',
  busca: (r, termo) => contem(r.nome, termo) || contem(r.email, termo),
  validar: (v, d, id) =>
    repetido(d.administradores, 'email', v.email, id)
      ? { email: 'Já existe outro administrador cadastrado com este e-mail.' }
      : {},
};

export default function Administradores() {
  return <Cadastro config={config} />;
}
