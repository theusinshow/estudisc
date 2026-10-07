"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { apiErrorSchema, readValidatedResponse } from "@/lib/api-response";
import { routinePreviewSchema, routineSettingsSchema, routineStateSchema, routineValidationMessage, type RoutinePreview, type RoutineSettings, type RoutineState } from "./routine-contracts";
import { localDate } from "./routine-policy";
import { RoutineWeekView, weekdayLabels } from "./routine-week";

function emptyRoutine(subjects: RoutineState["subjects"]): RoutineSettings {
  return { timezone: "America/Sao_Paulo", mode: "ASSISTED", days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, minutes: 0 })), subjects: subjects.map(subject => ({ code: subject.code, priority: "normal" })), manualAllocations: [], overrides: [], reviewPercent: 20 };
}
const stepLabels = ["Dias", "Tempo", "Prioridades", "Prévia"];

export function RoutinePlanner({ initial }: Readonly<{ initial: RoutineState }>) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [draft, setDraft] = useState<RoutineSettings>(() => initial.routine?.settings ?? emptyRoutine(initial.subjects));
  const [enabledDays, setEnabledDays] = useState(() => (initial.routine?.settings.days ?? []).filter(day => day.minutes > 0).map(day => day.weekday));
  const [editing, setEditing] = useState(!initial.routine);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<RoutinePreview | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [overrideDate, setOverrideDate] = useState(() => localDate(new Date(), draft.timezone));
  const [overrideMinutes, setOverrideMinutes] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const names = Object.assign(Object.create(null), Object.fromEntries(state.subjects.map(subject => [subject.code, subject.title]))) as Record<string, string>;
  const selectableSubjects = [...state.subjects, ...draft.subjects.filter(subject => !names[subject.code]).map(subject => ({ code: subject.code, title: `${subject.code} (indisponível)` }))];
  const today = localDate(new Date(), draft.timezone);
  const update = (patch: Partial<RoutineSettings>) => { setDraft(current => ({ ...current, ...patch })); setPreview(null); setError(""); };
  const move = (next: number) => { setStep(next); setError(""); requestAnimationFrame(() => title.current?.focus()); };

  async function post(body: unknown) {
    const response = await fetch("/api/study-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { const failure = apiErrorSchema.safeParse(await response.json()); throw new Error(failure.success ? failure.data.message ?? "Não foi possível atualizar a rotina." : "Resposta inválida. Tente novamente."); }
    return response;
  }
  async function makePreview() {
    const parsed = routineSettingsSchema.safeParse(draft);
    if (!parsed.success) { setError(routineValidationMessage(parsed.error)); return; }
    if (!draft.days.some(day => day.minutes > 0)) { setError("Escolha pelo menos um dia com tempo disponível."); return; }
    setBusy(true); setError("");
    try { setPreview(await readValidatedResponse(await post({ action: "preview", baseRevision: state.routine?.revision ?? 0, settings: parsed.data }), routinePreviewSchema)); move(3); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Falha ao gerar prévia."); } finally { setBusy(false); }
  }
  async function apply() {
    if (!preview) return;
    setBusy(true); setError("");
    try {
      const saved = await readValidatedResponse(await post({ action: "apply", previewId: preview.id }), routineStateSchema);
      setState(saved); setDraft(saved.routine!.settings); setEditing(false); setPreview(null); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha ao salvar a rotina."); } finally { setBusy(false); }
  }
  async function reload() {
    setBusy(true);
    try {
      const response = await fetch("/api/study-plan");
      if (!response.ok) throw new Error("Não foi possível recarregar. Tente novamente.");
      const saved = await readValidatedResponse(response, routineStateSchema);
      setState(saved); setDraft(saved.routine?.settings ?? emptyRoutine(saved.subjects)); setEnabledDays(saved.routine?.settings.days.filter(day => day.minutes > 0).map(day => day.weekday) ?? []); setPreview(null); move(0);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha de conexão."); } finally { setBusy(false); }
  }

  if (!state.subjects.length && !state.routine) return <section><h2>Minha rotina</h2><p>A rotina fica disponível quando houver matérias com conteúdo publicado. Você pode continuar usando suas sessões existentes.</p></section>;

  if (!editing && state.routine && state.week) return <section className="routine-planner">
    <div className="routine-section-heading"><h2>Minha semana</h2><button type="button" onClick={() => { setDraft(state.routine!.settings); setEnabledDays(state.routine!.settings.days.filter(day => day.minutes > 0).map(day => day.weekday)); setEditing(true); move(0); }}>Editar rotina</button></div>
    {state.routine.settings.subjects.some(subject => !names[subject.code]) && <p role="status">Uma matéria da rotina está indisponível. Edite a seleção antes de gerar outra prévia.</p>}
    <Tabs label="Visualização da rotina" tabs={[
      { id: "week", label: "Semana", content: <RoutineWeekView week={state.week} subjects={state.subjects} /> },
      { id: "routine", label: "Rotina", content: <div><p>Modo: {{ AUTOMATIC: "Automático", ASSISTED: "Assistido", MANUAL: "Manual" }[state.routine.settings.mode]}</p><p>Fuso horário: {state.routine.settings.timezone}</p>
        <ul>{state.routine.settings.days.filter(day => day.minutes > 0).map(day => <li key={day.weekday}>{weekdayLabels[day.weekday]}: {day.minutes} min{day.startTime ? `, a partir de ${day.startTime}` : ""}</li>)}</ul>
        <p>Mudanças temporárias: {state.routine.settings.overrides.length}.</p><p>A rotina ainda não faz parte do arquivo de backup de progresso.</p></div> }
    ]} />
  </section>;

  return <section className="routine-planner" aria-busy={busy}>
    <h2 ref={title} tabIndex={-1}>{state.routine ? "Editar rotina" : "Organize sua semana"} · {stepLabels[step]}</h2>
    <ol className="routine-steps" aria-label="Etapas da rotina">{stepLabels.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}>{label}</li>)}</ol>
    <form onSubmit={event => { event.preventDefault(); if (step === 2) void makePreview(); else if (step === 3) void apply(); else move(step + 1); }}>
      <fieldset disabled={busy}>
        <legend className="visually-hidden">{stepLabels[step]}</legend>
        {step === 0 && <>
          <p>Em quais dias você consegue estudar?</p>
          <div className="routine-days">{draft.days.map(day => <label key={day.weekday}><input type="checkbox" checked={enabledDays.includes(day.weekday)} onChange={event => { setEnabledDays(current => event.target.checked ? [...current, day.weekday] : current.filter(value => value !== day.weekday)); update({ days: draft.days.map(item => item.weekday === day.weekday ? { ...item, minutes: event.target.checked ? 30 : 0 } : item) }); }} />{weekdayLabels[day.weekday]}</label>)}</div>
          <label className="routine-field">Fuso horário<select value={draft.timezone} onChange={event => update({ timezone: event.target.value })}>
            <option value="America/Sao_Paulo">Brasília</option><option value="America/Manaus">Manaus</option><option value="America/Rio_Branco">Rio Branco</option><option value="UTC">UTC</option>
            {!["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "UTC"].includes(draft.timezone) && <option value={draft.timezone}>{draft.timezone}</option>}
          </select></label>
        </>}
        {step === 1 && <>
          <p>Defina o tempo disponível. O horário é uma sugestão; você pode estudar em outro momento do dia.</p>
          {!enabledDays.length && <p role="alert">Volte e escolha pelo menos um dia.</p>}
          {draft.days.filter(day => enabledDays.includes(day.weekday)).map(day => <div className="routine-time-row" key={day.weekday}>
            <label className="routine-field">{weekdayLabels[day.weekday]} · minutos<input type="number" min={1} max={240} step={1} value={day.minutes || ""} required onChange={event => update({ days: draft.days.map(item => item.weekday === day.weekday ? { ...item, minutes: Number(event.target.value) } : item) })} /></label>
            <label className="routine-field">{weekdayLabels[day.weekday]} · horário sugerido<input type="time" value={day.startTime ?? ""} onChange={event => update({ days: draft.days.map(item => item.weekday === day.weekday ? { ...item, startTime: event.target.value || undefined } : item) })} /></label>
          </div>)}
        </>}
        {step === 2 && <>
          <label className="routine-field">Modo<select value={draft.mode} onChange={event => update({ mode: event.target.value as RoutineSettings["mode"], ...(event.target.value === "MANUAL" ? { focus: undefined } : {}) })}>
            <option value="ASSISTED">Assistido · você define prioridades</option><option value="AUTOMATIC">Automático · equilíbrio entre matérias</option><option value="MANUAL">Manual · você distribui o tempo</option>
          </select></label>
          <p>Selecione as matérias. A prévia mostra a distribuição antes de salvar.</p>
          {selectableSubjects.map(subject => { const selected = draft.subjects.find(item => item.code === subject.code); return <div className="routine-subject-row" key={subject.code}>
            <label><input type="checkbox" checked={Boolean(selected)} onChange={event => update({ subjects: event.target.checked ? [...draft.subjects, { code: subject.code, priority: "normal" }] : draft.subjects.filter(item => item.code !== subject.code), manualAllocations: draft.manualAllocations.filter(item => item.subjectCode !== subject.code), focus: draft.focus?.subjectCode === subject.code ? undefined : draft.focus })} />{subject.title}</label>
            {selected && draft.mode === "ASSISTED" && <label className="routine-field">Prioridade de {subject.title}<select value={selected.priority} onChange={event => update({ subjects: draft.subjects.map(item => item.code === subject.code ? { ...item, priority: event.target.value as "low" | "normal" | "high" } : item) })}><option value="low">Menor</option><option value="normal">Normal</option><option value="high">Maior</option></select></label>}
          </div>; })}
          {draft.mode === "MANUAL" && draft.days.filter(day => day.minutes > 0).map(day => <details className="routine-manual-day" key={day.weekday}><summary>{weekdayLabels[day.weekday]} · distribuir {day.minutes} min</summary>
            {draft.subjects.map(subject => <label className="routine-field" key={subject.code}>{weekdayLabels[day.weekday]} · {names[subject.code] ?? subject.code}<input type="number" min={0} max={day.minutes} value={draft.manualAllocations.find(item => item.weekday === day.weekday && item.subjectCode === subject.code)?.minutes ?? 0} onChange={event => update({ manualAllocations: [...draft.manualAllocations.filter(item => item.weekday !== day.weekday || item.subjectCode !== subject.code), ...(Number(event.target.value) > 0 ? [{ weekday: day.weekday, subjectCode: subject.code, minutes: Number(event.target.value) }] : [])] })} /></label>)}
          </details>)}
          <details className="routine-extra"><summary>Ajustes de revisão, simulado e mudanças temporárias</summary>
            <label className="routine-field">Meta de revisão (%)<input type="number" min={0} max={50} value={draft.reviewPercent} onChange={event => update({ reviewPercent: Number(event.target.value) })} /></label>
            <label className="routine-field">Dia reservado para simulado<select value={draft.simulation?.weekday ?? ""} onChange={event => update({ simulation: event.target.value === "" ? undefined : { weekday: Number(event.target.value), minutes: 15 } })}><option value="">Sem reserva</option>{draft.days.filter(day => day.minutes > 0).map(day => <option key={day.weekday} value={day.weekday}>{weekdayLabels[day.weekday]}</option>)}</select></label>
            {draft.simulation && <label className="routine-field">Minutos para simulado<input type="number" min={15} max={240} value={draft.simulation.minutes} onChange={event => update({ simulation: { weekday: draft.simulation!.weekday, minutes: Number(event.target.value) } })} /></label>}
            <h3>Mudar o tempo de uma data</h3>
            <div className="routine-time-row"><label className="routine-field">Data da mudança<input type="date" min={today} value={overrideDate} onChange={event => setOverrideDate(event.target.value)} /></label><label className="routine-field">Tempo nessa data (min)<input type="number" min={0} max={240} value={overrideMinutes} onChange={event => setOverrideMinutes(Number(event.target.value))} /></label></div>
            <button type="button" onClick={() => update({ overrides: [...draft.overrides.filter(item => item.date !== overrideDate), { date: overrideDate, minutes: overrideMinutes }] })}>Adicionar mudança</button>
            <ul>{draft.overrides.map(item => <li key={item.date}>{item.date} · {item.minutes} min <button type="button" aria-label={`Remover mudança ${item.date}`} onClick={() => update({ overrides: draft.overrides.filter(override => override.date !== item.date) })}>Remover</button></li>)}</ul>
            {draft.mode !== "MANUAL" && <>
              <label className="routine-field">Foco temporário<select value={draft.focus?.subjectCode ?? ""} onChange={event => update({ focus: event.target.value ? { subjectCode: event.target.value, from: today, until: today } : undefined })}><option value="">Sem foco extra</option>{draft.subjects.map(subject => <option key={subject.code} value={subject.code}>{names[subject.code] ?? subject.code}</option>)}</select></label>
              {draft.focus && <label className="routine-field">Foco até<input type="date" min={draft.focus.from} value={draft.focus.until} onChange={event => update({ focus: { ...draft.focus!, until: event.target.value } })} /></label>}
            </>}
          </details>
        </>}
        {step === 3 && preview && <><p>Confira sua semana. Nada muda até você salvar esta prévia.</p><RoutineWeekView week={preview.week} subjects={state.subjects} /></>}
        <div className="routine-actions">
          {step > 0 && <button type="button" onClick={() => move(step - 1)}>Voltar</button>}
          <button className="primary-button" type="submit" disabled={step === 0 && !enabledDays.length || step === 3 && !preview}>{busy ? "Aguarde…" : step === 2 ? "Gerar prévia" : step === 3 ? "Salvar rotina" : "Continuar"}</button>
          {state.routine && <button type="button" onClick={() => { setEditing(false); setError(""); }}>Cancelar edição</button>}
        </div>
      </fieldset>
    </form>
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => void reload()}>Recarregar rotina salva</button></div>}
  </section>;
}
