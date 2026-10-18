import type { Metadata } from "next";
import Link from "next/link";
import { LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { accessLastDay } from "@/features/public-site/content-summary";
import { PublicLayout } from "@/features/public-site/public-layout";
import { getSellerIdentity } from "@/features/public-site/seller";
import { SellerBlock } from "@/features/public-site/seller-block";
import { publicPageMetadata } from "@/features/public-site/seo";

export const metadata: Metadata = publicPageMetadata({ path: "/termos", title: "Termos de uso — Estudisc" });
export const dynamic = "force-dynamic";

export default function TermosPage() {
  const seller = getSellerIdentity();
  const lastDay = accessLastDay();
  return (
    <PublicLayout labelledBy="termos-title">
      <article className="public-legal">
        <p className="eyebrow">Versão de 16/10/2026</p>
        <h1 id="termos-title">Termos de uso</h1>
        <SellerBlock seller={seller} />

        <h2>1. O serviço</h2>
        <p>O Estudisc é uma plataforma on-line de estudo para a prova de ingresso do IFSC 2027/1. Oferece aulas, questões com explicação, revisão, simulados e folhas de resposta para provas anteriores. É um material independente e não tem vínculo com o Instituto Federal de Santa Catarina.</p>

        <h2>2. Conta</h2>
        <p>Para usar o Estudisc é preciso ter uma conta: você entra com o seu e-mail, recebendo um código de 6 dígitos, ou com uma conta Google. A conta é pessoal: não compartilhe o acesso. Menores de 18 anos só podem usar o serviço com autorização do pai, da mãe ou do responsável legal, que deve fazer a compra.</p>

        <h2>3. Acesso gratuito e acesso completo</h2>
        <p>Sem pagamento, a conta dá acesso ao catálogo, ao diagnóstico e a uma aula de demonstração por matéria. O acesso completo custa R$ {LIFETIME_PRICE_BRL},00, em pagamento único, processado pelo Mercado Pago (Pix ou cartão). Ele vale até as 23h59 de {lastDay} (horário de Brasília), o dia da prova, e não se renova automaticamente.</p>

        <h2>4. Direito de arrependimento e reembolso</h2>
        <p>Você pode desistir da compra em até 7 dias corridos após o pagamento, sem precisar justificar, conforme o artigo 49 do Código de Defesa do Consumidor. Para isso, escreva para o contato indicado acima. O valor é devolvido pelo mesmo meio de pagamento, e o acesso completo é encerrado.</p>

        <h2>5. Conteúdo</h2>
        <p>O conteúdo é revisado com cuidado, mas pode conter erros. Se encontrar algum, avise pelo contato acima. O conteúdo pode ser atualizado e ampliado durante o período de acesso. Datas, regras e conteúdos oficiais da prova estão no edital do IFSC, que sempre prevalece.</p>
        <p>O Estudisc não garante aprovação. O resultado depende da dedicação de cada estudante e de fatores fora do nosso controle.</p>

        <h2>6. Uso permitido</h2>
        <p>O material é para estudo pessoal. Não é permitido copiar, revender ou redistribuir as aulas e questões, nem tentar burlar o controle de acesso. Provas anteriores pertencem a quem as publicou; o Estudisc indica a fonte oficial e oferece a correção pelo gabarito definitivo.</p>

        <h2>7. Disponibilidade</h2>
        <p>Buscamos manter o serviço disponível o tempo todo, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros. Uma indisponibilidade longa durante o período pago será avaliada caso a caso, inclusive com reembolso proporcional.</p>

        <h2>8. Cancelamento pela plataforma</h2>
        <p>Podemos suspender contas que violem estes termos, por exemplo pelo compartilhamento do acesso ou por cópia do conteúdo.</p>

        <h2>9. Privacidade</h2>
        <p>O tratamento dos seus dados está descrito na <Link href="/privacidade">política de privacidade</Link>.</p>

        <h2>10. Alterações e foro</h2>
        <p>Estes termos podem ser atualizados; a data da versão aparece no topo. Mudanças não reduzem direitos de quem já pagou. Aplica-se a lei brasileira, e o consumidor pode escolher o foro do seu domicílio.</p>
      </article>
    </PublicLayout>
  );
}
