import Link from 'next/link';

const SECOES = [
  { href: '/administradores', titulo: 'Administradores', texto: 'Pessoas que administram os projetos.' },
  { href: '/usuarios', titulo: 'Usuários', texto: 'Clientes e solicitantes que acompanham os projetos.' },
  { href: '/desenvolvedores', titulo: 'Desenvolvedores', texto: 'Integrantes dos times de desenvolvimento.' },
  { href: '/times', titulo: 'Times', texto: 'Times de desenvolvimento e seus vínculos.' },
  { href: '/projetos', titulo: 'Projetos', texto: 'Projetos, relatórios, marcos e cronograma.' },
];

export default function Inicio() {
  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <h1>Bem-vindo ao SGP</h1>
          <p className="descricao">Escolha uma área para começar.</p>
        </div>
      </header>
      <ul className="grade-atalhos">
        {SECOES.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="atalho cartao">
              <strong>{s.titulo}</strong>
              <span>{s.texto}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
