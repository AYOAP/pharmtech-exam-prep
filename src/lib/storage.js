import { STORAGE_KEY } from "./constants";

function sortSessions(sessions) {
  return [...sessions].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  );
}

export function loadSessions() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortSessions(parsed) : [];
  } catch (error) {
    console.error("Failed to read saved sessions", error);
    return [];
  }
}

export function persistSessions(sessions) {
  if (typeof window === "undefined") {
    return sessions;
  }

  const sorted = sortSessions(sessions);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}

export function addSession(session, existingSessions) {
  return persistSessions([session, ...existingSessions]);
}

export function deleteSessionById(sessionId, existingSessions) {
  return persistSessions(existingSessions.filter((session) => session.id !== sessionId));
}

export function clearAllSessions() {
  return persistSessions([]);
}
