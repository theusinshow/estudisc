import { ImageResponse } from "next/og";
import { LIFETIME_PRICE_BRL } from "@/features/payments/contracts";
import { CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";

export const alt = "Estudisc — preparação para a prova do IFSC 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Design-token colors (design-system/design-tokens.json): paper, ink, signal, panel.
const paper = "#FFF4E0", ink = "#17141F", signal = "#FFD43B", panel = "#FFFCF5";

/** Link preview shown when the site is shared on WhatsApp, Instagram and other apps. */
export default function OpenGraphImage() {
  const stats = [
    [formatCount(CONTENT_SUMMARY.lessons), "aulas"],
    [formatCount(CONTENT_SUMMARY.lessonQuestions), "questões"],
    [String(CONTENT_SUMMARY.pastExams), "provas anteriores"]
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: paper, color: ink, padding: 64, border: `12px solid ${ink}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill={signal} stroke={ink} strokeWidth="4" /><path d="M32 20 Q23 15 12 18 V46 Q23 43 32 48 Z" fill={panel} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" /><path d="M32 20 Q41 15 52 18 V46 Q41 43 32 48 Z" fill={panel} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" /><path d="M17.5 26.5 Q22 25 27 27 M17.5 33 Q22 31.5 27 33.5" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" /></svg>
          <div style={{ fontSize: 56, fontWeight: 800 }}>Estudisc</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>Prepare-se para o IFSC 2027 pelo celular</div>
          <div style={{ fontSize: 32 }}>Aulas, questões explicadas, simulados e provas anteriores.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 20 }}>
            {stats.map(([value, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", background: panel, border: `4px solid ${ink}`, padding: "12px 22px" }}>
                <div style={{ fontSize: 40, fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 22 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", background: signal, border: `5px solid ${ink}`, padding: "16px 28px", fontSize: 36, fontWeight: 800 }}>R$ {LIFETIME_PRICE_BRL} até a prova</div>
        </div>
      </div>
    ),
    size
  );
}
