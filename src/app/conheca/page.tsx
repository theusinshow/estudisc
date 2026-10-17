import type { Metadata } from "next";
import Link from "next/link";
import { getServerEnv } from "@/lib/env";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay, CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { PublicLayout } from "@/features/public-site/public-layout";
import { daysUntilExam, examCountdownLabel } from "@/features/public-site/countdown";
import { SampleQuestion } from "@/features/public-site/sample-question";
import { loadSampleQuestion } from "@/features/public-site/sample-question-loader";

export const metadata: Metadata = {
  title: "Estudisc — preparação para a prova do IFSC 2027",
  description: "Aulas, questões comentadas, simulados e provas anteriores para a prova de ingresso do IFSC 2027/1."
};
export const dynamic = "force-dynamic";

export default async function ConhecaPage() {
  const salesOpen = getServerEnv().FEATURE_PAID_ACCESS;
  const lastDay = accessLastDay();
  const days = daysUntilExam();
  const sample = await loadSampleQuestion();
  const c = CONTENT_SUMMARY;
  return (
    <PublicLayout labelledBy="conheca-title">
      <section className="public-hero caderno-hero" data-sample={sample ? "" : undefined}>
        <div className="hero-copy">
          <p className="type-meta hero-kicker">IFSC 2027/1 · ensino técnico integrado</p>
          <h1 id="conheca-title" className="type-display">Estude para a prova do IFSC com um plano que diz o que fazer hoje</h1>
          <p className="hero-lead">Aulas curtas, questões com solução comentada, simulados no formato da prova e as provas anteriores do IFSC, tudo em um só lugar e pensado para estudar pelo celular.</p>
          <div className="auth-actions">
            {salesOpen ? (
              <>
                <Link href="/auth/signin?callbackUrl=%2F" className="primary-action elev-action">Começar agora</Link>
                <a href="#preco" className="text-link">Ver preço</a>
              </>
            ) : (
              <>
                <Link href="/suporte?acesso=1" className="primary-action elev-action">Peça acesso</Link>
                <Link href="/auth/signin" className="text-link">Já tenho conta</Link>
              </>
            )}
          </div>
          {!salesOpen ? <p className="public-note" role="status">O cadastro aberto ainda não começou. Por enquanto, o acesso é por convite.</p> : null}
          {days !== null ? <p className="type-meta hero-countdown"><strong>{examCountdownLabel(days)}</strong> · prova em {lastDay}</p> : null}
        </div>
        {sample ? <SampleQuestion question={sample} /> : null}
      </section>

      <section className="public-section caderno-plain" aria-labelledby="conteudo-title">
        <h2 id="conteudo-title">O que você encontra</h2>
        <ul className="public-stats stat-line type-meta">
          <li><strong>{formatCount(c.lessons)}</strong><span>aulas cobrindo os conteúdos do edital</span></li>
          <li><strong>{formatCount(c.lessonQuestions)}</strong><span>questões com dica e solução comentada</span></li>
          <li><strong>{c.simulationTemplates}</strong><span>simulados completos no formato da prova</span></li>
          <li><strong>{c.pastExams}</strong><span>provas anteriores do IFSC com correção pelo gabarito oficial</span></li>
        </ul>
        <p>Matérias: {c.subjects.join(", ")}.</p>
      </section>

      <section className="public-section caderno-plain" aria-labelledby="como-title">
        <h2 id="como-title">Como funciona</h2>
        <ol className="public-steps ruled-sheet">
          <li><span><strong>Continuar estudando.</strong> Um botão abre a próxima aula. Se você parar no meio, ele volta de onde parou.</span></li>
          <li><span><strong>Praticar com explicação.</strong> Errou? Tente de novo, peça uma dica ou veja a solução comentada.</span></li>
          <li><span><strong>Revisar no tempo certo.</strong> O que você erra volta para revisão nos dias seguintes.</span></li>
          <li><span><strong>Treinar como na prova.</strong> Simulados no formato da prova e provas anteriores mostram como você está.</span></li>
        </ol>
      </section>

      <section className="public-section caderno-plain" aria-labelledby="gratis-title">
        <h2 id="gratis-title">Experimente antes de pagar</h2>
        <p>{salesOpen ? "Com uma conta gratuita você faz uma aula completa de cada matéria:" : "Quem recebe acesso começa por uma aula completa de cada matéria:"}</p>
        <ul className="public-list">
          {FREE_SAMPLE_LESSONS.map(lesson => <li key={lesson.id}><strong>{lesson.subject}:</strong> {lesson.title}</li>)}
        </ul>
      </section>

      <section className="public-section public-honest" aria-labelledby="aviso-title">
        <h2 id="aviso-title">Antes de comprar</h2>
        <ul className="public-list">
          <li>O Estudisc não garante aprovação. Ele organiza o estudo; o resultado depende da dedicação de cada estudante.</li>
          <li>Confira sempre datas, regras e conteúdos no edital oficial do IFSC.</li>
          <li>Menores de 18 anos devem usar o Estudisc com autorização do responsável, que deve fazer a compra.</li>
        </ul>
      </section>

      <section id="preco" className="public-section public-price receipt" aria-labelledby="preco-title">
        <h2 id="preco-title">Preço</h2>
        <dl className="receipt-lines">
          <div><dt>Valor</dt><dd className="public-price-value"><strong>R$ {LIFETIME_PRICE_BRL}</strong> pagamento único</dd></div>
          <div><dt>Validade</dt><dd>Acesso completo até {lastDay}, o dia da prova. Sem mensalidade e sem renovação automática. Pagamento por Pix ou cartão pelo Mercado Pago.</dd></div>
          <div><dt>Arrependimento</dt><dd>Você pode desistir em até 7 dias após a compra e receber o valor de volta, como prevê o Código de Defesa do Consumidor.</dd></div>
        </dl>
        {salesOpen ? <Link href="/auth/signin?callbackUrl=%2Fupgrade" className="secondary-action">Criar conta e comprar</Link> : <p className="public-note">As inscrições abrem em breve. <Link href="/suporte?acesso=1">Peça acesso</Link> enquanto isso.</p>}
      </section>
    </PublicLayout>
  );
}
