import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import "@/styles/landing.css";
import "@/styles/access-offer.css";
import { LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { AccessFacts } from "@/features/public-site/access-facts";
import { CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { PublicLayout } from "@/features/public-site/public-layout";
import { getSellerIdentity } from "@/features/public-site/seller";
import { publicPageMetadata } from "@/features/public-site/seo";
import { getServerEnv } from "@/lib/env";

export const metadata: Metadata = publicPageMetadata({
  path: "/pais-e-escolas",
  title: "Preparatório IFSC integrado para seu filho do 9º ano · Estudisc",
  description: "Como o Estudisc ajuda estudantes do 9º ano a se prepararem para a prova do IFSC 2027, quanto custa e como escolas e projetos podem participar."
});
export const dynamic = "force-dynamic";

/** Parents and schools: same vibrante pieces as the landing and the paywall, in the guardian's voice. */
export default function PaisEEscolasPage() {
  const seller = getSellerIdentity();
  const c = CONTENT_SUMMARY;
  const salesOpen = getServerEnv().FEATURE_PAID_ACCESS;
  const buy = <Link href="/auth/signin?callbackUrl=%2Fupgrade&origem=parents_price" className="primary-action">Criar conta e comprar<ArrowRight aria-hidden="true" /></Link>;
  return (
    <PublicLayout labelledBy="pais-title">
      <div className="landing">
        <section className="landing-hero">
          <p className="landing-kicker">Para pais e responsáveis · Exame de Classificação IFSC 2027/1</p>
          <h1 id="pais-title">Um plano para a prova do IFSC que seu filho usa no celular</h1>
          <p className="landing-lead">O Estudisc organiza o que estudar a cada dia para a prova de ingresso nos cursos técnicos integrados do IFSC 2027/1: aulas curtas, questões explicadas e revisão do que o estudante erra.</p>
          <div className="landing-actions">
            {salesOpen ? buy : null}
            <Link href="/conheca" className={salesOpen ? "landing-text-link" : "primary-action"}>Ver como funciona</Link>
          </div>
        </section>

        <section className="landing-block" aria-labelledby="o-que-title">
          <h2 id="o-que-title">O que o estudante recebe</h2>
          <ul className="landing-numbers">
            <li><strong>{formatCount(c.lessons)}</strong><span>aulas sobre os conteúdos do edital</span></li>
            <li><strong>{formatCount(c.lessonQuestions)}</strong><span>questões com dica e solução comentada</span></li>
            <li><strong>{c.simulationTemplates}</strong><span>simulados completos no formato da prova</span></li>
            <li><strong>{c.pastExams}</strong><span>provas anteriores do IFSC, corrigidas pelo gabarito oficial</span></li>
          </ul>
          <ul className="offer-checks">
            <li><Check aria-hidden="true" /><span><strong>Revisão automática:</strong> o que o estudante erra volta nos dias seguintes.</span></li>
            <li><Check aria-hidden="true" /><span><strong>Um botão para continuar:</strong> ele abre a próxima aula sem precisar decidir por onde ir, e retoma de onde parou.</span></li>
          </ul>
        </section>

        <section className="landing-sheet" aria-labelledby="acompanhar-title">
          <h2 id="acompanhar-title">Como acompanhar</h2>
          <p>A tela de Progresso mostra as aulas concluídas, o domínio de cada conceito, o equilíbrio entre as matérias e o que precisa de revisão. Uma boa rotina é olhar junto com o estudante uma vez por semana e combinar uma meta de estudo por dia.</p>
        </section>

        <section className="landing-sheet" aria-labelledby="seguranca-title">
          <h2 id="seguranca-title">Segurança e privacidade</h2>
          <ul className="offer-checks">
            <li><Check aria-hidden="true" />Sem anúncios e sem venda de dados.</li>
            <li><Check aria-hidden="true" />Sem chat entre usuários: o estudante não conversa com desconhecidos dentro da plataforma.</li>
            <li><Check aria-hidden="true" />Entrada pela conta Google ou por um código enviado ao e-mail, sem senha.</li>
            <li><Check aria-hidden="true" /><span>Tratamento de dados conforme a LGPD, com atenção ao uso por menores de idade. Detalhes na <Link href="/privacidade">política de privacidade</Link>.</span></li>
          </ul>
        </section>

        <section className="offer-price" aria-labelledby="preco-pais-title">
          <h2 id="preco-pais-title">Quanto custa</h2>
          <p className="offer-price-value"><strong>R$&nbsp;{LIFETIME_PRICE_BRL}</strong><span>pagamento único</span></p>
          <AccessFacts withContent={false} />
          <p>Antes de pagar, a conta grátis já abre uma aula completa de cada matéria.</p>
          {salesOpen ? buy : <Link href="/conheca" className="secondary-action">Ver como funciona</Link>}
        </section>

        <section className="landing-sheet" aria-labelledby="escolas-title">
          <h2 id="escolas-title">Para escolas, cursinhos e projetos sociais</h2>
          <p>Turmas podem receber códigos de acesso para que os estudantes entrem sem pagamento individual. É uma boa opção para escolas públicas, cursinhos populares e projetos que preparam estudantes para o IFSC.</p>
          {seller
            ? <a className="secondary-action" href={`mailto:${seller.email}?subject=${encodeURIComponent("Estudisc para turmas")}`}>Falar sobre turmas: {seller.email}</a>
            : <p className="landing-note">O canal de contato para turmas será publicado em breve.</p>}
        </section>

        <section className="landing-fine" aria-labelledby="aviso-pais-title">
          <h2 id="aviso-pais-title">Importante</h2>
          <ul>
            <li>O Estudisc é um material de estudo independente, sem vínculo com o IFSC.</li>
            <li>Ele não garante aprovação: organiza o estudo, e o resultado depende da dedicação de cada estudante.</li>
            <li>As regras e os conteúdos oficiais estão no edital do IFSC.</li>
          </ul>
        </section>
      </div>
    </PublicLayout>
  );
}
