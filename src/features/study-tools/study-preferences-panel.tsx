"use client";

import { Vibrate, Volume2 } from "lucide-react";

import { playFeedback, vibrate } from "./feedback-signals";
import { setStudyPreference, useStudyPreferences } from "./preferences";

/** Switches for the optional feedback sound and vibration (saved on this device only). */
export function StudyPreferencesPanel() {
  const preferences = useStudyPreferences();
  return (
    <ul className="hub-list study-preferences">
      <li>
        <button type="button" role="switch" aria-checked={preferences.sound} className="study-switch"
          onClick={() => { const next = !preferences.sound; setStudyPreference("sound", next); if (next) playFeedback("correct"); }}>
          <Volume2 aria-hidden="true" /><span><strong>Som ao responder</strong><small>Um “plim” no acerto, um tom suave no erro</small></span>
          <span className="study-switch-track" aria-hidden="true"><span className="study-switch-thumb" /></span>
        </button>
      </li>
      <li>
        <button type="button" role="switch" aria-checked={preferences.haptics} className="study-switch"
          onClick={() => { const next = !preferences.haptics; setStudyPreference("haptics", next); if (next) vibrate(30); }}>
          <Vibrate aria-hidden="true" /><span><strong>Vibrar no acerto</strong><small>Só em celulares Android</small></span>
          <span className="study-switch-track" aria-hidden="true"><span className="study-switch-thumb" /></span>
        </button>
      </li>
    </ul>
  );
}
