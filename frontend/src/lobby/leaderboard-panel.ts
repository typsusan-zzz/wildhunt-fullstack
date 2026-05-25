import type { LeaderboardEntry } from '../types/match';

export type LeaderboardType = 'TROPHY' | 'WINS';

const leaderboardTabs: Array<{ type: LeaderboardType; label: string; metric: string }> = [
  { type: 'TROPHY', label: '奖杯榜', metric: '奖杯' },
  { type: 'WINS', label: '胜场榜', metric: '胜场' },
];

const sampleEntries: LeaderboardEntry[] = [
  { rank: 1, userId: '1', nickname: '狼王之王', leaderboardType: 'TROPHY', score: 620, rating: 2450, level: 8, trophies: 620, wins: 7, wolfWins: 4, deerSurvivals: 3 },
  { rank: 2, userId: '2', nickname: 'ForestKiller', leaderboardType: 'TROPHY', score: 540, rating: 1980, level: 6, trophies: 540, wins: 5, wolfWins: 3, deerSurvivals: 2 },
  { rank: 3, userId: '3', nickname: 'NightHowl', leaderboardType: 'TROPHY', score: 490, rating: 1750, level: 5, trophies: 490, wins: 4, wolfWins: 2, deerSurvivals: 2 },
  { rank: 4, userId: '4', nickname: 'DeerMaster', leaderboardType: 'TROPHY', score: 430, rating: 1520, level: 5, trophies: 430, wins: 4, wolfWins: 1, deerSurvivals: 3 },
  { rank: 5, userId: '5', nickname: '风之追猎者', leaderboardType: 'TROPHY', score: 380, rating: 1280, level: 4, trophies: 380, wins: 3, wolfWins: 2, deerSurvivals: 1 },
];

export function leaderboardPanelTemplate(entries: LeaderboardEntry[], activeType: LeaderboardType = 'TROPHY') {
  const visibleEntries = entries.length ? entries : sampleEntries;
  const activeTab = leaderboardTabs.find((tab) => tab.type === activeType) ?? leaderboardTabs[0];
  const rows = visibleEntries.map((entry, index) => {
    const score = leaderboardScore(entry, activeType);
    return `
      <li>
        <span class="rank-badge rank-${entry.rank <= 3 ? entry.rank : 'plain'}">${entry.rank}</span>
        <i class="board-avatar icon-sprite ${index % 3 === 0 ? 'icon-wolf' : index % 3 === 1 ? 'icon-deer' : 'icon-squirrel'}" aria-hidden="true"></i>
        <strong>${escapeHtml(entry.nickname)}<small>Lv.${entry.level ?? 1}</small></strong>
        <b><span class="tiny-trophy icon-sprite icon-trophy" aria-hidden="true"></span>${score}<small>${activeTab.metric}</small></b>
      </li>
    `;
  }).join('');
  return `
    <section class="leaderboard-card parchment-panel">
      <h2>排行榜</h2>
      <div class="board-tabs" role="tablist" aria-label="排行榜切换">
        ${leaderboardTabs.map((tab) => `
          <button class="${tab.type === activeType ? 'active' : ''}" type="button" role="tab" aria-selected="${tab.type === activeType}" data-leaderboard-type="${tab.type}">
            ${tab.label}
          </button>
        `).join('')}
      </div>
      <ol class="leaderboard-list">${rows}</ol>
    </section>
  `;
}

function leaderboardScore(entry: LeaderboardEntry, activeType: LeaderboardType) {
  if (typeof entry.score === 'number' && entry.leaderboardType === activeType) return entry.score;
  if (activeType === 'WINS') return entry.wins;
  return entry.trophies ?? entry.rating;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char] ?? char));
}
