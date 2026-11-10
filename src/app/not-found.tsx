import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <section className="vazio">
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe.</p>
      <Link href="/" className="botao botao-primario">
        Ir para o início
      </Link>
    </section>
  );
}
