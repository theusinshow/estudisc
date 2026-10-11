/** Session mutations need a fresh document, including transitions on the current session URL. */
export function openStudySession(sessionId: string, location: Pick<Location, "assign"> = window.location) {
  location.assign(`/study/${sessionId}`);
}
