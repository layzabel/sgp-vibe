'use client';

import { Cadastro, type ConfigCadastro } from '@/components/Cadastro';
import { contem } from '@/lib/util';
import { repetido } from './comum';

const config: ConfigCadastro<'usuarios'> = {
  chave: 'usuarios',
  singular: 'Usuário',
  plural: 'Usuários',
  artigo: 'o',
  descricao: 'Pessoas que acompanham os projetos, como clientes e solicitantes.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, autoComplete: 'name' },
    { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, autoComplete: 'email' },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', autoComplete: 'tel', maxLength: 30 },
    { nome: 'organizacao', rotulo: 'Organização', tipo: 'text', autoComplete: 'organization' },
  ],
  colunas: [
    { rotulo: 'Nome', valor: (r) => r.nome },
    { rotulo: 'E-mail', valor: (r) => r.email },
    { rotulo: 'Telefone', valor: (r) => r.telefone || '—' },
    { rotulo: 'Organização', valor: (r) => r.organizacao || '—' },
  ],
  buscaRotulo: 'Buscar por nome ou organização',
  busca: (r, termo) => contem(r.nome, termo) || contem(r.organizacao, termo),
  validar: (v, d, id) =>
    repetido(d.usuarios, 'email', v.email, id) ? { email: 'Já existe outro usuário cadastrado com este e-mail.' } : {},
};

export default function Usuarios() {
  return <Cadastro config={config} />;
}
