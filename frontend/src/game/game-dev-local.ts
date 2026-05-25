export function localDevEnabled(hasMatchId: boolean, isDev: boolean) {
  return isDev && !hasMatchId;
}
