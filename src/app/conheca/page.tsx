import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, X } from "lucide-react";
import "@/styles/landing.css";
import { getServerEnv } from "@/lib/env";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay, accessLastDayIso, CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { examCountdownLabel } from "@/features/public-site/countdown";
import { courseJsonLd, faqJsonLd, JsonLd, organizationJsonLd, type FaqItem } from "@/features/public-site/json-ld";
import { publicPageMetadata } from "@/features/public-site/seo";
import { siteUrl } from "@/features/public-site/site-url";
import { PublicLayout } from "@/features/public-site/public-layout";
import { AccessFacts } from "@/features/public-site/access-facts";
import { daysUntilExam } from "@/features/public-site/countdown";
import { SampleQuestion } from "@/features/public-site/sample-question";
import { loadSampleQuestion } from "@/features/public-site/sample-question-loader";
import { GoalTower } from "@/features/today/goal-tower";

// The product's main URL: signed-out "/" 301s here (for signed-in students "/" is the study app).
export const metadata: Metadata = publicPageMetadata({
  path: "/conheca",
  title: "Exame de Classificação IFSC 2027/1 (técnico integrado) · Estudisc",
  description: `Preparação para o Exame de Classificação do IFSC 2027/1 com aulas, questões comentadas, simulados e provas anteriores. R$ ${LIFETIME_PRICE_BRL}, acesso até o dia da prova.`
});
export const dynamic = "force-dynamic";

/** Subject code from a lesson id ("MAT-07" → "MAT"); colors the chip with the subject accent. */
const subjectOf = (lessonId: string) => lessonId.split("-")[0];

const SUBJECTS = [
  { code: "MAT", name: "Matemática" },
  { code: "CIE", name: "Ciências" },
  { code: "POR", name: "Língua Portuguesa" },
  { code: "GH", name: "Geografia e História" }
] as const;

export default async function ConhecaPage() {
  const salesOpen = getServerEnv().FEATURE_PAID_ACCESS;
  const lastDay = accessLastDay();
  const days = daysUntilExam();
  const [sample, base] = await Promise.all([loadSampleQuestion(), siteUrl()]);
  const c = CONTENT_SUMMARY;
  // Visible FAQ and FAQPage data share one source; every answer restates what this page already says.
  const faq: FaqItem[] = [
    { question: "Quanto custa?", answer: `R$ ${LIFETIME_PRICE_BRL}, pagamento único.` },
    { question: "Até quando vale o acesso?", answer: `Até ${lastDay}, o dia da prova.` },
    { question: "Posso desistir?", answer: "Sim, em até 7 dias após a compra. Você recebe o valor de volta, como prevê o Código de Defesa do Consumidor." },
    { question: "O Estudisc tem vínculo com o IFSC?", answer: "Não. O Estudisc é um material de estudo independente, sem vínculo com o IFSC." },
    { question: "Quem compra se o aluno for menor de idade?", answer: "O responsável. Menores de 18 anos usam o Estudisc com autorização do responsável, que faz a compra." }
  ];
  // `origem` names the button in the cta_clicked funnel event logged by the sign-in page.
  const signup = (origem: "landing_hero" | "landing_free", label: string) => salesOpen
    ? <Link href={`/auth/signin?callbackUrl=%2F&origem=${origem}`} className="primary-action">{label}<ArrowRight aria-hidden="true" /></Link>
    : <Link href="/suporte?acesso=1" className="primary-action">Peça acesso<ArrowRight aria-hidden="true" /></Link>;
  const catalog = [
    { value: formatCount(c.lessons), label: "aulas sobre os conteúdos do edital" },
    { value: formatCount(c.lessonQuestions), label: "questões com dica e solução comentada" },
    { value: formatCount(c.simulationTemplates), label: `simulados completos no formato da prova, com ${formatCount(c.simulationQuestions)} questões` },
    { value: formatCount(c.pastExams), label: "provas anteriores do IFSC, corrigidas pelo gabarito oficial" }
  ];
  return (
    <PublicLayout
      labelledBy="conheca-title"
      headerAction={salesOpen
        ? <Link href="/auth/signin?callbackUrl=%2F&origem=landing_hero" className="primary-action header-signup">Criar conta</Link>
        : <Link href="/suporte?acesso=1" className="primary-action header-signup">Peça acesso</Link>}
    >
      <div className="landing landing-sales">
        <div className="sales-intro">
          <section className="sales-hero">
            <div className="sales-hero-copy">
              <p className="landing-kicker">Exame de Classificação IFSC 2027/1 · técnico integrado</p>
              <h1 id="conheca-title">Pare de adivinhar o que estudar para a prova do IFSC.</h1>
              <p className="landing-lead">A próxima aula abre sozinha. Errou? Tem dica e solução comentada, e o assunto volta nos dias seguintes. Simulados no formato da prova e {c.pastExams} provas anteriores do IFSC, corrigidas pelo gabarito oficial. {salesOpen ? "A primeira aula de cada matéria é grátis." : "Por enquanto, o acesso é por convite."}</p>
              <div className="landing-actions">
                {signup("landing_hero", "Começar grátis")}
                <Link href="/auth/signin" className="landing-text-link">Já tenho conta</Link>
              </div>
              <ul className="sales-facts">
                <li>R$ {LIFETIME_PRICE_BRL}, pagamento único</li>
                <li>Acesso até {lastDay}</li>
                <li>7 dias para desistir</li>
              </ul>
            </div>
            <div className="sales-stage">
              <figure className="sales-device" aria-hidden="true">
                <span className="sales-device-progress" />
                <span className="sales-device-top"><span>Hoje</span><span data-subject="MAT">Matemática</span></span>
                <p className="sales-device-stem">Quanto é 25% de 80?</p>
                <div className="sales-device-answers">
                  <span className="sales-device-answer" data-result="incorrect"><b>B</b><span>25</span><X /></span>
                  <span className="sales-device-answer" data-result="correct"><b>D</b><span>20</span><Check /></span>
                </div>
                <p className="sales-device-hint"><Lightbulb />Dica: 25% é a quarta parte do todo.</p>
                <p className="sales-device-stamp"><Check />Certo</p>
              </figure>
              {days === null ? null : <div className="sales-clock" role="timer" aria-label={`${examCountdownLabel(days)}, ${lastDay}`}>
                <span className="sales-clock-days">
                  <small>{days === 0 ? "Hoje" : days === 1 ? "Falta" : "Faltam"}</small>
                  <strong>{days === 0 ? "É a prova" : <>{days}<span>{days === 1 ? " dia" : " dias"}</span></>}</strong>
                </span>
                <span className="sales-clock-date">
                  <small>Dia da prova</small>
                  <time dateTime={accessLastDayIso()}>{lastDay}</time>
                </span>
              </div>}
            </div>
          </section>

          <section className="sales-rail sales-reveal" aria-labelledby="materias-title">
            <h2 id="materias-title">Matérias do edital</h2>
            <ul className="sales-subjects">
              {SUBJECTS.map(subject => <li key={subject.code} data-subject={subject.code}>{subject.name}</li>)}
            </ul>
          </section>
        </div>

        <section className="sales-block sales-reveal" aria-labelledby="como-title">
          <div className="sales-head">
            <h2 id="como-title">O app estuda com você</h2>
            <p>Três coisas que acontecem de verdade, em toda aula.</p>
          </div>
          <ol className="sales-flow">
            <li>
              <div className="sales-flow-copy">
                <h3><span className="sales-step">1</span>A próxima aula já está escolhida</h3>
                <p>Um botão abre o que vem agora. Parou no meio? Ele volta de onde você parou.</p>
              </div>
              <div className="landing-shot landing-shot-lesson" data-subject="MAT" aria-hidden="true">
                <span className="landing-shot-subject">Matemática</span>
                <strong>Porcentagem</strong>
                <span className="landing-shot-meta">Próxima aula</span>
                <span className="landing-shot-cta">Continuar<ArrowRight /></span>
              </div>
            </li>
            <li>
              <div className="sales-flow-copy">
                <h3><span className="sales-step">2</span>O erro vira explicação</h3>
                <p>Tente de novo, peça uma dica ou leia a solução comentada daquela questão.</p>
              </div>
              <div className="landing-shot landing-shot-hint" aria-hidden="true">
                <span className="landing-shot-stem">Quanto é 25% de 80?</span>
                <span className="landing-shot-answer" data-result="incorrect"><b>B</b><span>25</span><X /></span>
                <span className="landing-shot-answer" data-result="correct"><b>D</b><span>20</span><Check /></span>
                <span className="landing-shot-tip"><Lightbulb />Dica: 25% é a quarta parte do todo.</span>
              </div>
            </li>
            <li>
              <div className="sales-flow-copy">
                <h3><span className="sales-step">3</span>O que você erra volta</h3>
                <p>Nos dias seguintes, o assunto entra na revisão. A meta do dia mostra quanto falta.</p>
              </div>
              <div className="landing-shot landing-shot-goal" aria-hidden="true"><GoalTower answered={6} decorative /></div>
            </li>
          </ol>
        </section>

        {sample ? <section className="sales-block sales-reveal landing-try" aria-labelledby="try-title">
          <div className="sales-head">
            <h2 id="try-title">Tenta uma agora</h2>
            <p>Uma questão publicada, de uma aula grátis. Marque e confira. Nada fica gravado.</p>
          </div>
          <SampleQuestion question={sample} />
        </section> : null}

        <section className="sales-block sales-reveal" aria-labelledby="conteudo-title">
          <div className="sales-head">
            <h2 id="conteudo-title">Isto já está no curso</h2>
            <p>Material publicado para o Exame de Classificação 2027/1, nas quatro matérias do edital.</p>
          </div>
          <ul className="sales-index">
            {catalog.map(item => <li key={item.label}><strong>{item.value}</strong><span>{item.label}</span></li>)}
          </ul>
        </section>

        <section className="sales-block sales-reveal" aria-labelledby="gratis-title">
          <div className="sales-head">
            <h2 id="gratis-title">A primeira aula de cada matéria sai de graça</h2>
            <p>{salesOpen ? "Crie a conta e faça uma aula completa, sem pagar nada." : "Quem recebe acesso começa por uma aula completa de cada matéria."}</p>
          </div>
          <ul className="landing-free">
            {FREE_SAMPLE_LESSONS.map(lesson => <li key={lesson.id} data-subject={subjectOf(lesson.id)}>
              <span>{lesson.subject}</span>
              <strong>{lesson.title}</strong>
              <small>{lesson.interactiveFeature}</small>
            </li>)}
          </ul>
          {signup("landing_free", "Criar conta grátis")}
        </section>

        <section id="preco" className="sales-price sales-reveal" aria-labelledby="preco-title">
          <div className="sales-price-offer">
            <h2 id="preco-title">Um pagamento. Até o dia da prova.</h2>
            <p className="landing-price-value"><strong>R$ {LIFETIME_PRICE_BRL}</strong><span>pagamento único</span></p>
            {salesOpen
              ? <Link href="/auth/signin?callbackUrl=%2Fupgrade&origem=landing_price" className="primary-action">Garantir o acesso<ArrowRight aria-hidden="true" /></Link>
              : <p className="landing-note">As inscrições abrem em breve. <Link href="/suporte?acesso=1">Peça acesso</Link> enquanto isso.</p>}
          </div>
          <AccessFacts className="landing-checks" withContent={false} />
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
