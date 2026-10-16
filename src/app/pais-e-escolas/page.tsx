import type { Metadata } from "next";
import Link from "next/link";
import { LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay, CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { PublicLayout } from "@/features/public-site/public-layout";
import { getSellerIdentity } from "@/features/public-site/seller";

export const metadata: Metadata = {
  title: "Para pais e escolas — Estudisc",
  description: "Como o Estudisc ajuda estudantes do 9º ano a se prepararem para a prova do IFSC 2027, quanto custa e como escolas e projetos podem participar."
};
export const dynamic = "force-dynamic";

export default function PaisEEscolasPage() {
  const seller = getSellerIdentity();
  const c = CONTENT_SUMMARY;
  return (
    <PublicLayout labelledBy="pais-title">
      <section className="public-hero">
        <p className="eyebrow">Para pais, responsáveis e escolas</p>
        <h1 id="pais-title">Um plano de estudo para a prova do IFSC, do jeito que o estudante usa: no celular</h1>
        <p>O Estudisc organiza o que estudar a cada dia para a prova de ingresso nos cursos técnicos integrados do IFSC 2027/1, com aulas curtas, questões explicadas e revisão do que o estudante erra.</p>
      </section>

      <section className="public-section" aria-labelledby="o-que-title">
        <h2 id="o-que-title">O que o estudante recebe</h2>
        <ul className="public-list">
          <li><strong>{formatCount(c.lessons)} aulas</strong> de {c.subjects.join(", ")}, organizadas pelos conteúdos do edital.</li>
          <li><strong>{formatCount(c.lessonQuestions)} questões</strong> em que cada alternativa errada mostra o erro de raciocínio que leva a ela.</li>
          <li><strong>Revisão automática:</strong> o que o estudante erra volta nos dias seguintes.</li>
          <li><strong>{c.simulationTemplates} simulados</strong> no formato da prova e <strong>{c.pastExams} provas anteriores</strong> do IFSC, corrigidas pelo gabarito oficial.</li>
          <li><strong>Um botão para continuar:</strong> o estudante abre a próxima aula sem precisar decidir por onde ir, e retoma de onde parou.</li>
        </ul>
      </section>

      <section className="public-section" aria-labelledby="acompanhar-title">
        <h2 id="acompanhar-title">Como acompanhar</h2>
        <p>A tela de Progresso mostra as aulas concluídas, o domínio de cada conceito, o equilíbrio entre as matérias e o que precisa de revisão. Uma boa rotina é olhar junto com o estudante uma vez por semana e combinar uma meta de estudo por dia.</p>
      </section>

      <section className="public-section" aria-labelledby="seguranca-title">
        <h2 id="seguranca-title">Segurança e privacidade</h2>
        <ul className="public-list">
          <li>Sem anúncios e sem venda de dados.</li>
          <li>Sem chat entre usuários: o estudante não conversa com desconhecidos dentro da plataforma.</li>
          <li>Login pela conta Google, sem senha própria do Estudisc.</li>
          <li>Tratamento de dados conforme a LGPD, com atenção ao uso por menores de idade. Detalhes na <Link href="/privacidade">política de privacidade</Link>.</li>
        </ul>
      </section>

      <section className="public-section public-price" aria-labelledby="preco-pais-title">
        <h2 id="preco-pais-title">Quanto custa</h2>
        <p className="public-price-value"><strong>R$ {LIFETIME_PRICE_BRL}</strong> pagamento único</p>
        <p>Acesso completo até {accessLastDay()}, o dia da prova. Sem mensalidade e sem renovação automática. É possível testar uma aula de cada matéria antes de pagar, e desistir em até 7 dias após a compra com reembolso integral.</p>
        <Link href="/conheca" className="primary-action">Ver como funciona</Link>
      </section>

      <section className="public-section" aria-labelledby="escolas-title">
        <h2 id="escolas-title">Para escolas, cursinhos e projetos sociais</h2>
        <p>Turmas podem receber códigos de acesso para que os estudantes entrem sem pagamento individual. É uma boa opção para escolas públicas, cursinhos populares e projetos que preparam estudantes para o IFSC.</p>
        {seller
          ? <a className="secondary-action" href={`mailto:${seller.email}?subject=${encodeURIComponent("Estudisc para turmas")}`}>Falar sobre turmas: {seller.email}</a>
          : <p className="public-note">O canal de contato para turmas será publicado em breve.</p>}
      </section>

      <section className="public-section" aria-labelledby="aviso-pais-title">
        <h2 id="aviso-pais-title">Importante</h2>
        <p>O Estudisc é um material de estudo independente, sem vínculo com o IFSC, e não garante aprovação. As regras e os conteúdos oficiais estão no edital do IFSC.</p>
      </section>
    </PublicLayout>
  );
}
