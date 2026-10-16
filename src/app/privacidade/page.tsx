import { notFound } from "next/navigation";
import { LegalPage } from "@/features/billing/legal-page";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacidade · Estudisc" };

export default function PrivacyPage() {
  if (!isPaidAccessEnabled(getServerEnv())) notFound();
  return <LegalPage title="Política de privacidade" sections={[
    { heading: "Controlador", body: ["[nome completo ou razão social], [CPF ou CNPJ], contato para dados pessoais: [e-mail]."] },
    { heading: "Dados que tratamos", body: ["Conta: e-mail e nome informados pelo Google ao entrar.", "Estudo: respostas, tentativas, progresso por conceito, revisões e erros, para mostrar sua evolução e escolher a próxima aula.", "Pagamento: identificador e situação do pagamento enviados pelo Mercado Pago. Não recebemos nem guardamos dados de cartão."] },
    { heading: "Estudantes menores de idade", body: ["Os estudantes costumam ter entre 14 e 15 anos. O uso por menores depende do consentimento do responsável legal, dado no momento da compra (LGPD, art. 14). Coletamos apenas o necessário para o estudo e não usamos os dados para publicidade."] },
    { heading: "Para que usamos", body: ["Prestar o serviço contratado, liberar o acesso pago, dar suporte e cumprir obrigações legais. Não vendemos dados."] },
    { heading: "Com quem compartilhamos", body: ["Provedores necessários para operar o serviço: hospedagem (Vercel), banco de dados (Aiven), autenticação (Google) e pagamento (Mercado Pago)."] },
    { heading: "Seus direitos", body: ["Você pode pedir acesso, correção, exportação ou exclusão dos seus dados pelo contato acima. A exportação do histórico de estudo também está disponível no próprio Estudisc."] },
    { heading: "Retenção", body: ["Os dados de estudo ficam guardados enquanto a conta existir ou até você pedir a exclusão. Registros de pagamento são guardados pelo prazo exigido em lei."] }
  ]} />;
}
