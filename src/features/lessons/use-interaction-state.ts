"use client";
import { useState } from "react";
import { useLessonResume } from "./resume-provider";
import { interactionKey, type InteractionKind, type InteractionState, type InteractionTarget, type StateFor } from "./interaction-state";

export function useInteractionState<K extends InteractionKind>(ref: (InteractionTarget & { kind: K }) | undefined, initial: StateFor<K>, valid: (value: StateFor<K>) => boolean) {
  const resume = useLessonResume();
  const saved = ref ? resume?.data.interactions?.find(entry => interactionKey(entry) === interactionKey(ref)) : undefined;
  const compatible = Boolean(saved && ref && saved.kind === ref.kind && valid(saved.state as StateFor<K>));
  const [value, setValue] = useState<StateFor<K>>(() => compatible ? saved!.state as StateFor<K> : initial);
  const update = (next: StateFor<K>) => {
    setValue(() => next);
    if (ref) resume?.setInteraction({ ...ref, state: next } as InteractionState);
  };
  return { value, update, recovered: Boolean(saved && !compatible) };
}
