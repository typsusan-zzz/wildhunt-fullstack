export type MatchEndSummary = {
  title: string;
  detail: string;
  expDelta?: number;
  trophyDelta?: number;
};

export function summarizeMatchEnd(result: Partial<MatchEndSummary> | undefined): MatchEndSummary {
  return {
    title: result?.title ?? '对局已结算',
    detail: result?.detail ?? '结果来自服务器 MATCH_END。',
    expDelta: result?.expDelta,
    trophyDelta: result?.trophyDelta,
  };
}
