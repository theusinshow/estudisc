"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PAID_ACCESS_ENDS_AT } from "@/features/payments/contracts";

/** Start of the exam day in Brasília (access ends at the end of that day). */
const EXAM_DAY_START = new Date(Date.parse(PAID_ACCESS_ENDS_AT) - 86_400_000).toISOString();

/* Exam countdown as a flip board (ADR 0069, lab 8.13). Client-only: the device clock drives it. */
const noopSubscribe = () => () => {};

function parts(now: number, exam: number) {
  const s = Math.max(0, Math.floor((exam - now) / 1000));
  return [["dias", Math.floor(s / 86400)], ["horas", Math.floor((s % 86400) / 3600)], ["min", Math.floor((s % 3600) / 60)], ["seg", s % 60]] as const;
}

function Flip({ value }: Readonly<{ value: number }>) {
  const text = String(value).padStart(2, "0");
  return (
    <span className="flip-digit">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 90, opacity: 0 }} transition={{ duration: 0.3 }}>{text}</motion.span>
      </AnimatePresence>
    </span>
  );
}

export function ExamCountdownBoard({ examAt = EXAM_DAY_START }: Readonly<{ examAt?: string }>) {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const exam = Date.parse(examAt);
  if (!hydrated || !Number.isFinite(exam) || exam <= now) return null;
  const p = parts(now, exam);
  return (
    <MotionConfig reducedMotion="user">
      <div className="flip-board" role="timer" aria-label={`Faltam ${p[0][1]} dias para a prova`}>
        {p.map(([label, value]) => <div key={label} className="flip-cell"><Flip value={value} /><small>{label}</small></div>)}
      </div>
    </MotionConfig>
  );
}
