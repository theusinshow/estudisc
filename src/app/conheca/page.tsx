import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, X } from "lucide-react";
import "@/styles/landing.css";
import { getServerEnv } from "@/lib/env";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay, accessLastDayIso, CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { courseJsonLd, faqJsonLd, JsonLd, organizationJsonLd, type FaqItem } from "@/features/public-site/json-ld";
import { publicPageMetadata } from "@/features/public-site/seo";
import { siteUrl } from "@/features/public-site/site-url";
import { PublicLayout } from "@/features/public-site/public-layout";
import { AccessFacts } from "@/features/public-site/access-facts";
import { daysUntilExam } from "@/features/public-site/countdown";
import { SampleQuestion } from "@/features/public-site/sample-question";
import { loadSampleQuestion } from "@/features/public-site/sample-question-loader";
import { GoalTower } from "@/features/today/goal-tower";

// The product's main URL: "/" redirects visitors here (for signed-in students "/" is the study app).
export const metadata: Metadata = publicPageMetadata({
  path: "/conheca",
  title: "Exame de Classificação IFSC 2027/1 (técnico integrado) · Estudisc",
  description: `Preparação para o Exame de Classificação do IFSC 2027/1 com aulas, questões comentadas, simulados e provas anteriores. R$ ${LIFETIME_PRICE_BRL}, acesso até o dia da prova.`
});
export const dynamic = "force-dynamic";

/** Subject code from a lesson id ("MAT-07" → "MAT"); colors the chip with the subject accent. */
const subjectOf = (lessonId: string) => lessonId.split("-")[0];

export default async function ConhecaPage() {
  const salesOpen = getServerEnv().FEATURE_PAID_ACCESS;
  const lastDay = accessLastDay();
  const days = daysUntilExam();
  const sample = await loadSampleQuestion();
  const c = CONTENT_SUMMARY;
  const base = await siteUrl();
  // Visible FAQ and FAQPage data share one source; every answer restates what this page already says.
  const faq: FaqItem[] = [
    { question: "Quanto custa?", answer: `R$ ${LIFETIME_PRICE_BRL}, pagamento único.` },
    { question: "Até quando vale o acesso?", answer: `Até ${lastDay}, o dia da prova.` },
    { question: "Posso desistir?", answer: "Sim, em até 7 dias após a compra. Você recebe o valor de volta, como prevê o Código de Defesa do Consumidor." },
    { question: "O Estudisc tem vínculo com o IFSC?", answer: "Não. O Estudisc é um material de estudo independente, sem vínculo com o IFSC." },
    { question: "Quem compra se o aluno for menor de idade?", answer: "O responsável. Menores de 18 anos usam o Estudisc com autorização do responsável, que faz a compra." }
  ];
  // `origem` names the button in the cta_clicked funnel event logged by the sign-in page.
  const signup = (origem: "landing_hero" | "landing_free") => salesOpen
    ? <Link href={`/auth/signin?callbackUrl=%2F&origem=${origem}`} className="primary-action">Criar conta grátis<ArrowRight aria-hidden="true" /></Link>
    : <Link href="/suporte?acesso=1" className="primary-action">Peça acesso<ArrowRight aria-hidden="true" /></Link>;
  return (
    <PublicLayout labelledBy="conheca-title">
      <div className="landing">
        <section className="landing-hero">
          <div className="landing-hero-top">
            <p className="landing-kicker">Exame de Classificação IFSC 2027/1</p>
            {days === null ? null : days === 0
              ? <p className="landing-countdown"><span>A prova é hoje</span></p>
              : <p className="landing-countdown"><strong>{days}</strong><span>{days === 1 ? "dia" : "dias"} para a prova<br />{lastDay}</span></p>}
          </div>
          <h1 id="conheca-title">Seu plano para a prova do IFSC, uma aula por vez</h1>
          <p className="landing-lead">Aulas curtas, questões com explicação, simulados e provas anteriores do IFSC, tudo no celular. {salesOpen ? "Comece grátis." : "Por enquanto, o acesso é por convite."}</p>
          <div className="landing-actions">
            {signup("landing_hero")}
            <Link href="/auth/signin" className="landing-text-link">Já tenho conta</Link>
          </div>
        </section>

        {sample ? <section className="landing-block landing-try" aria-labelledby="try-title">
          <h2 id="try-title">Tenta uma</h2>
          <p>Uma questão de verdade, tirada de uma aula. Marque e confira.</p>
          <SampleQuestion question={sample} />
        </section> : null}

        <section className="landing-block" aria-labelledby="como-title">
          <h2 id="como-title">Como é estudar aqui</h2>
          <ol className="landing-steps">
            <li>
              <div className="landing-shot landing-shot-lesson" data-subject="MAT" aria-hidden="true">
                <span className="landing-shot-subject">Matemática</span>
                <strong>Porcentagem</strong>
                <span className="landing-shot-meta">Próxima aula · ~15 min</span>
                <span className="landing-shot-cta">Continuar<ArrowRight /></span>
              </div>
              <h3>Um botão abre a próxima aula</h3>
              <p>Você não precisa decidir por onde começar. Parou no meio? Ele volta de onde você parou.</p>
            </li>
            <li>
              <div className="landing-shot landing-shot-hint" aria-hidden="true">
                <span className="landing-shot-stem">Quanto é 25% de 80?</span>
                <span className="landing-shot-answer" data-result="incorrect"><b>B</b><span>25</span><X /></span>
                <span className="landing-shot-answer" data-result="correct"><b>D</b><span>20</span><Check /></span>
                <span className="landing-shot-tip"><Lightbulb />Dica: 25% é a quarta parte do todo.</span>
              </div>
              <h3>Errou? Tem dica e explicação</h3>
              <p>Tente de novo, peça uma dica ou veja a solução comentada de cada questão.</p>
            </li>
            <li>
              <div className="landing-shot landing-shot-goal" aria-hidden="true"><GoalTower answered={6} decorative /></div>
              <h3>O que você erra volta para revisar</h3>
              <p>Nos dias seguintes, o que você errou volta para revisão. A meta do dia mostra quanto falta.</p>
            </li>
          </ol>
        </section>

        <section className="landing-block" aria-labelledby="conteudo-title">
          <h2 id="conteudo-title">Tudo para a prova</h2>
          <ul className="landing-numbers">
            <li><strong>{formatCount(c.lessons)}</strong><span>aulas sobre os conteúdos do edital</span></li>
            <li><strong>{formatCount(c.lessonQuestions)}</strong><span>questões com dica e solução comentada</span></li>
            <li><strong>{c.simulationTemplates}</strong><span>simulados completos no formato da prova</span></li>
            <li><strong>{c.pastExams}</strong><span>provas anteriores do IFSC, corrigidas pelo gabarito oficial</span></li>
          </ul>
          <p>{c.subjects.join(", ").replace(/, ([^,]+)$/, " e $1")}.</p>
        </section>

        <section className="landing-block" aria-labelledby="gratis-title">
          <h2 id="gratis-title">Grátis para começar</h2>
          <p>{salesOpen ? "Crie sua conta e faça uma aula completa de cada matéria, sem pagar nada:" : "Quem recebe acesso começa por uma aula completa de cada matéria:"}</p>
          <ul className="landing-free">
            {FREE_SAMPLE_LESSONS.map(lesson => <li key={lesson.id} data-subject={subjectOf(lesson.id)}>
              <span>{lesson.subject}</span><strong>{lesson.title}</strong>
            </li>)}
          </ul>
          {signup("landing_free")}
        </section>

        <section id="preco" className="landing-price" aria-labelledby="preco-title">
          <h2 id="preco-title">Acesso completo</h2>
          <p className="landing-price-value"><strong>R$ {LIFETIME_PRICE_BRL}</strong><span>pagamento único</span></p>
          <AccessFacts className="landing-checks" withContent={false} />
          {salesOpen
            ? <Link href="/auth/signin?callbackUrl=%2Fupgrade&origem=landing_price" className="primary-action">Criar conta e comprar<ArrowRight aria-hidden="true" /></Link>
            : <p className="landing-note">As inscrições abrem em breve. <Link href="/suporte?acesso=1">Peça acesso</Link> enquanto isso.</p>}
        </section>

        <section className="landing-fine" aria-labelledby="aviso-title">
          <h2 id="aviso-title">Antes de comprar</h2>
          <div className="landing-faq">
            {faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
          <ul>
            <li>O Estudisc não garante aprovação. Ele organiza o estudo; o resultado depende da dedicação de cada estudante.</li>
            <li>Confira sempre datas, regras e conteúdos no edital oficial do IFSC.</li>
          </ul>
          <p>É responsável por um estudante do 9º ano? Veja como acompanhar o estudo em <Link href="/pais-e-escolas">Estudisc para pais e responsáveis</Link>.</p>
        </section>
        <JsonLd data={[organizationJsonLd(base), courseJsonLd(base, accessLastDayIso()), faqJsonLd(faq)]} />
      </div>
    </PublicLayout>
  );
}
