const STORAGE_KEY = "ptcb-passport/state-v1";

export function getStorageKey() {
  return STORAGE_KEY;
}

export function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredState(fallbackState) {
  if (!canUseStorage()) {
    return fallbackState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackState;
    }

    const parsed = JSON.parse(raw);
    return mergeStoredState(parsed, fallbackState);
  } catch (error) {
    console.error("Failed to load study state", error);
    return fallbackState;
  }
}

export function saveStoredState(state) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save study state", error);
  }
}

export function clearStoredState() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function mergeStoredState(parsed, fallbackState) {
  return {
    ...fallbackState,
    ...parsed,
    profile: {
      ...fallbackState.profile,
      ...(parsed.profile ?? {}),
    },
    ui: {
      ...fallbackState.ui,
      ...(parsed.ui ?? {}),
    },
    progress: {
      ...fallbackState.progress,
      ...(parsed.progress ?? {}),
    },
    mastery: {
      ...fallbackState.mastery,
      ...(parsed.mastery ?? {}),
    },
    weakTopics: parsed.weakTopics ?? {},
    flashcardProgress: parsed.flashcardProgress ?? {},
    completionsByDate: parsed.completionsByDate ?? {},
    sessionHistory: parsed.sessionHistory ?? [],
    tutorHistory: parsed.tutorHistory ?? [],
    activeSession: parsed.activeSession ?? null,
    notes: parsed.notes ?? "",
  };
}
