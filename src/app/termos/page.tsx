import { notFound } from "next/navigation";
import { LegalPage } from "@/features/billing/legal-page";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termos de uso · Estudisc" };

export default function TermsPage() {
  if (!isPaidAccessEnabled(getServerEnv())) notFound();
  return <LegalPage title="Termos de uso" sections={[
    { heading: "Quem oferece", body: ["O Estudisc é oferecido por [nome completo ou razão social], [CPF ou CNPJ], contato: [e-mail de atendimento]."] },
    { heading: "O que você compra", body: ["Acesso individual e intransferível às aulas, questões, revisões e simulados do Estudisc para a preparação do Exame de Classificação do IFSC 2027/1, até o fim do dia da prova (29/11/2026). Pagamento único; não há renovação automática.", "O conteúdo é autoral ou usado com base em fontes públicas indicadas nas aulas. O Estudisc não é afiliado ao IFSC e não garante aprovação."] },
    { heading: "Quem pode comprar", body: ["A compra deve ser feita por pessoa maior de 18 anos ou com autorização do responsável legal pelo estudante. A conta usada para entrar é a do estudante ou do responsável."] },
    { heading: "Pagamento, arrependimento e reembolso", body: ["O pagamento é processado pelo Mercado Pago (Pix ou cartão). O acesso é liberado quando o Mercado Pago confirma o pagamento.", "Você pode desistir da compra em até 7 dias após o pagamento, sem justificativa, e receber o valor integral de volta (Código de Defesa do Consumidor, art. 49). Peça pelo contato acima. Depois do reembolso, o acesso é encerrado."] },
    { heading: "Uso da conta", body: ["Não compartilhe sua conta nem copie o conteúdo para redistribuição. Podemos suspender contas usadas de forma abusiva, com aviso e reembolso proporcional quando cabível."] },
    { heading: "Disponibilidade e mudanças", body: ["Trabalhamos para manter o serviço disponível, mas pode haver interrupções. As aulas podem ser corrigidas e ampliadas durante o período de acesso; versões anteriores continuam registradas no seu histórico."] }
  ]} />;
}
