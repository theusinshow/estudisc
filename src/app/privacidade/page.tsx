import type { Metadata } from "next";
import { PublicLayout } from "@/features/public-site/public-layout";
import { getSellerIdentity } from "@/features/public-site/seller";
import { SellerBlock } from "@/features/public-site/seller-block";
import { LegalHeading, LegalIndex } from "@/features/public-site/legal-index";
import { publicPageMetadata } from "@/features/public-site/seo";

export const metadata: Metadata = publicPageMetadata({
  path: "/privacidade",
  title: "Política de privacidade — Estudisc",
  description: "Política de privacidade do Estudisc: dados de conta, estudo e pagamento, para que os usamos, com quem compartilhamos e os seus direitos pela LGPD."
});
export const dynamic = "force-dynamic";

const SECTIONS = [
  "Dados que tratamos",
  "Para que usamos",
  "Crianças e adolescentes",
  "Com quem compartilhamos",
  "Cookies",
  "Por quanto tempo guardamos",
  "Seus direitos",
  "Segurança",
  "Alterações"
] as const;

export default function PrivacidadePage() {
  const seller = getSellerIdentity();
  return (
    <PublicLayout labelledBy="privacidade-title">
      <article className="public-legal">
        <p className="eyebrow">Versão de 16/10/2026</p>
        <h1 id="privacidade-title">Política de privacidade</h1>
        <p>Esta política explica quais dados o Estudisc trata, para quê e quais são os seus direitos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018). O controlador dos dados é o responsável indicado abaixo.</p>
        <SellerBlock seller={seller} />

        <LegalIndex sections={SECTIONS} />
        <div className="legal-sheet">
          <LegalHeading number={1} sections={SECTIONS} />
          <ul>
            <li><strong>Conta:</strong> nome e e-mail, informados no cadastro ou vindos da sua conta Google, usados para identificar você; se você tem menos de 18 anos, a declaração de que seu responsável autorizou o uso, com a data; e a data em que você aceitou os termos. Não usamos senha: para entrar, mandamos um código de 6 dígitos para o seu e-mail, guardado de forma protegida e válido por 10 minutos.</li>
            <li><strong>Estudo:</strong> respostas, acertos e erros, aulas iniciadas e concluídas, revisões, simulados e anotações. É o que permite continuar de onde você parou e montar a revisão.</li>
            <li><strong>Pagamento:</strong> identificador, situação e valor do pagamento informados pelo Mercado Pago. Os dados de cartão e de Pix ficam com o Mercado Pago; o Estudisc não os recebe.</li>
            <li><strong>Técnicos:</strong> registros de funcionamento e segurança (por exemplo, data e hora de acesso e erros), mantidos pelo tempo necessário para operar e proteger o serviço.</li>
          </ul>

          <LegalHeading number={2} sections={SECTIONS} />
          <ul>
            <li>Prestar o serviço contratado: mostrar aulas, corrigir respostas, montar a revisão e o plano de estudo (base legal: execução de contrato).</li>
            <li>Controlar o acesso pago e cumprir obrigações legais e fiscais (base legal: execução de contrato e obrigação legal).</li>
            <li>Manter a segurança e corrigir falhas (base legal: legítimo interesse).</li>
          </ul>
          <p>Não vendemos seus dados, não exibimos anúncios e não usamos ferramentas de rastreamento publicitário.</p>

          <LegalHeading number={3} sections={SECTIONS} />
          <p>O Estudisc é usado por estudantes que, em geral, têm menos de 18 anos. Nesse caso, a conta deve ser criada e a compra feita com o consentimento do pai, da mãe ou do responsável legal, conforme o artigo 14 da LGPD. No cadastro, quem tem menos de 18 anos declara que o responsável autorizou o uso, e guardamos essa declaração com a data. Tratamos apenas os dados necessários para o estudo.</p>

          <LegalHeading number={4} sections={SECTIONS} />
          <ul>
            <li><strong>Google:</strong> para o login.</li>
            <li><strong>Mercado Pago:</strong> para processar o pagamento.</li>
            <li><strong>Resend:</strong> para enviar os e-mails com o código de acesso.</li>
            <li><strong>Hospedagem e banco de dados:</strong> provedores de nuvem (Railway, com DNS da Cloudflare) que guardam os dados por nossa conta, inclusive em servidores fora do Brasil, com proteções contratuais.</li>
            <li><strong>Ajuda com inteligência artificial:</strong> quando esse recurso opcional estiver disponível e você pedir ajuda, o conteúdo da questão e o seu pedido são enviados a um provedor de IA (DeepSeek) apenas para gerar a resposta.</li>
          </ul>
          <p>Também podemos fornecer dados quando a lei ou uma ordem judicial exigir.</p>

          <LegalHeading number={5} sections={SECTIONS} />
          <p>Usamos apenas cookies necessários para manter você conectado e proteger o login. Não usamos cookies de publicidade.</p>

          <LegalHeading number={6} sections={SECTIONS} />
          <p>Os dados de estudo ficam guardados enquanto a conta existir ou até você pedir a exclusão. Registros de pagamento são mantidos pelo prazo exigido pela legislação fiscal. Cópias de segurança podem manter dados por um período limitado antes de serem substituídas.</p>

          <LegalHeading number={7} sections={SECTIONS} />
          <p>Você pode pedir a confirmação do tratamento, o acesso, a correção, a cópia (portabilidade) e a exclusão dos seus dados, além de informações sobre o compartilhamento. Para qualquer um desses pedidos, inclusive uma cópia do seu histórico de estudo, escreva para o contato indicado acima; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

          <LegalHeading number={8} sections={SECTIONS} />
          <p>Usamos conexão criptografada, acesso restrito aos dados e contas separadas por estudante. Nenhum sistema é totalmente imune a falhas; se ocorrer um incidente relevante, avisaremos os afetados e a ANPD, como manda a lei.</p>

          <LegalHeading number={9} sections={SECTIONS} />
          <p>Esta política pode ser atualizada; a data da versão aparece no topo. Mudanças importantes serão avisadas na plataforma.</p>
        </div>
      </article>
    </PublicLayout>
  );
}
