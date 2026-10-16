import type { Metadata } from "next";
import Link from "next/link";
import { LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay } from "@/features/public-site/content-summary";
import { PublicLayout } from "@/features/public-site/public-layout";
import { getSellerIdentity } from "@/features/public-site/seller";

export const metadata: Metadata = { title: "Suporte — Estudisc", description: "Perguntas frequentes sobre conta, pagamento, reembolso e estudo no Estudisc, e como falar com a gente." };
export const dynamic = "force-dynamic";

type SupportPageProps = Readonly<{ searchParams?: Promise<{ erro?: string }> }>;

/** Question reference sent by the "report a problem" link: a stable id and a version, nothing else. */
function questionReference(value: string | undefined) {
  return value && /^[A-Za-z0-9._-]{1,80} v\d{1,4}$/.test(value) ? value : null;
}

function mailto(email: string, subject: string, body: string) {
  return `mailto:${email}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20")}`;
}

const faq: ReadonlyArray<{ topic: string; items: ReadonlyArray<{ q: string; a: string }> }> = [
  { topic: "Conta e acesso", items: [
    { q: "Como eu entro?", a: "Com a sua conta Google. Não existe senha do Estudisc: se esquecer a senha, recupere pelo próprio Google." },
    { q: "Preciso instalar algum aplicativo?", a: "Não. O Estudisc funciona no navegador do celular ou do computador. No celular, você pode usar a opção “Adicionar à tela inicial” do navegador para abrir mais rápido." },
    { q: "Posso dividir a conta com um amigo?", a: "Não. A conta é pessoal e guarda o seu progresso, seus erros e a sua revisão. Dividir mistura o histórico e é proibido pelos termos de uso." },
    { q: "O que dá para fazer sem pagar?", a: "Ver o catálogo, fazer o diagnóstico e estudar uma aula completa de cada matéria. Assim você conhece o Estudisc antes de comprar." }
  ] },
  { topic: "Pagamento", items: [
    { q: "Quanto custa e até quando vale?", a: `R$ ${LIFETIME_PRICE_BRL}, em pagamento único, com acesso completo até ${accessLastDay()}, o dia da prova. Não tem mensalidade nem renovação automática.` },
    { q: "Como posso pagar?", a: "Por Pix ou cartão, pelo Mercado Pago. Os dados do cartão ficam com o Mercado Pago; o Estudisc não os recebe." },
    { q: "Paguei e o acesso não liberou. E agora?", a: "Pagamentos por Pix costumam liberar em poucos minutos; cartão pode levar um pouco mais. Atualize a página de acesso completo. Se passar de uma hora, escreva para a gente com o e-mail da sua conta Google e o comprovante." },
    { q: "Quem paga é meu responsável. Tem problema?", a: "Não, é o recomendado. Menores de 18 anos devem usar o Estudisc com autorização do responsável, e a compra pode ser feita por ele." }
  ] },
  { topic: "Reembolso", items: [
    { q: "Posso desistir da compra?", a: "Sim. Em até 7 dias corridos depois do pagamento você recebe o valor de volta, sem precisar explicar o motivo, como garante o Código de Defesa do Consumidor. Escreva para a gente pelo contato desta página." }
  ] },
  { topic: "Estudo", items: [
    { q: "Por onde eu começo?", a: "Pelo diagnóstico e pelo botão “Continuar estudando”. Ele abre a próxima aula e, se você parar no meio, volta de onde parou." },
    { q: "Como funcionam as provas anteriores?", a: "Você resolve a prova oficial do IFSC e marca as respostas na folha do Estudisc, com o tempo da prova. No fim, a folha é corrigida pelo gabarito definitivo publicado pelo IFSC." },
    { q: "O que é a revisão?", a: "As questões que você erra voltam nos dias seguintes, para você fixar o conteúdo antes da prova." },
    { q: "O Estudisc garante que eu passe?", a: "Não. Ele organiza o estudo e mostra o que revisar, mas o resultado depende da sua dedicação. Confira sempre as regras e os conteúdos no edital oficial do IFSC." }
  ] },
  { topic: "Dados e privacidade", items: [
    { q: "Como peço a exclusão dos meus dados?", a: "Escreva para a gente pelo contato desta página, a partir do e-mail da sua conta. Pelo mesmo contato você também pode pedir uma cópia do seu histórico de estudo. Detalhes na política de privacidade." }
  ] }
];

export default async function SuportePage({ searchParams }: SupportPageProps) {
  const seller = getSellerIdentity();
  const reference = questionReference((await searchParams)?.erro);
  return (
    <PublicLayout labelledBy="suporte-title">
      <section className="public-hero">
        <p className="eyebrow">Suporte</p>
        <h1 id="suporte-title">Como podemos ajudar?</h1>
        <p>Veja as dúvidas mais comuns abaixo. Se não encontrar a resposta, escreva para a gente.</p>
      </section>

      {reference ? (
        <section className="public-section public-price" aria-labelledby="erro-title">
          <h2 id="erro-title">Avisar um erro na questão</h2>
          <p>Obrigado por avisar! Conte o que parece errado: o enunciado, uma alternativa, o gabarito ou a explicação. A questão já vai identificada como <strong>{reference}</strong>.</p>
          {seller
            ? <a className="primary-action" href={mailto(seller.email, `Erro na questão ${reference}`, `Questão: ${reference}\n\nO que parece errado:\n`)}>Escrever e-mail sobre esta questão</a>
            : <p className="public-note">O canal de contato será publicado em breve.</p>}
        </section>
      ) : null}

      <section className="public-section" aria-labelledby="contato-title">
        <h2 id="contato-title">Fale com a gente</h2>
        {seller ? (
          <>
            <p>Respondemos por e-mail em até 2 dias úteis. Para assuntos de pagamento, informe o e-mail da sua conta Google.</p>
            <a className="secondary-action" href={mailto(seller.email, "Suporte Estudisc", "")}>{seller.email}</a>
          </>
        ) : <p className="public-note">O canal de contato será publicado em breve.</p>}
      </section>

      {faq.map((group, index) => (
        <section key={group.topic} className="public-section public-faq" aria-labelledby={`faq-${index}`}>
          <h2 id={`faq-${index}`}>{group.topic}</h2>
          {group.items.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      ))}

      <section className="public-section" aria-labelledby="docs-title">
        <h2 id="docs-title">Documentos</h2>
        <p><Link href="/termos">Termos de uso</Link> · <Link href="/privacidade">Política de privacidade</Link></p>
      </section>
    </PublicLayout>
  );
}
