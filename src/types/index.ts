// 球員打擊數據
export interface BattingStats {
  games: number;           // 出賽
  pa: number;             // 打席
  ab: number;             // 打數
  hits: number;           // 安打
  singles: number;        // 一壘安打
  doubles: number;        // 二壘安打
  triples: number;        // 三壘安打
  hr: number;             // 全壘打
  rbi: number;            // 打點
  runs: number;           // 得分
  bb: number;             // 四死球
  so: number;             // 三振
  sb: number;             // 盜壘成功
  sf: number;             // 高飛犧牲打
  totalBases: number;     // 壘打數
}

// 計算數據
export interface CalculatedStats {
  avg: number;            // 打擊率
  obp: number;            // 上壘率
  slg: number;            // 長打率
  ops: number;            // OPS
  iso: number;            // ISO
  babip: number;          // BABIP
  kPct: number;           // 三振率 %
  bbPct: number;          // 保送率 %
}

// 加權數據
export interface WeightedStats {
  wOBA: number | null;    // wOBA
  wRC: number | null;     // wRC
  wRCPlus: number | null; // wRC+
  opsPlus: number | null; // OPS+
}

// 球員投球數據
export interface PitchingStats {
  games: number;          // 出場（投手）
  ip: number;             // 局數
  bf: number;             // 面對打者（人次）
  so: number;             // 奪三振
  bb: number;             // 四死球（保送）
  h: number;              // 被安打
  hr: number;             // 被全壘打
  r: number;              // 失分
  er: number;             // 責任失分
  w: number;              // 勝
  l: number;              // 敗
  sv: number;             // 救援成功
  hld: number;            // 中繼成功（和局）
  cs: number;             // 阻殺成功
  csAttempts: number;     // 阻殺嘗試
}

// 投球計算數據
export interface PitchingCalculatedStats {
  era: number;            // 防禦率
  whip: number;           // WHIP
  fip: number | null;     // FIP
  kPer9: number;          // K/9
  bbPer9: number;         // BB/9
  hPer9: number;          // H/9
  csPercentage: number;   // 阻殺率
}

// 球員單季數據
export interface PlayerSeason {
  year: number;
  team: string;
  number: string;
  batting: BattingStats;
  pitching?: PitchingStats;
  calculated?: CalculatedStats;
  pitchingCalculated?: PitchingCalculatedStats;
  weighted?: WeightedStats;
  rankings: Record<string, number>;
}

// 球員完整資料
export interface Player {
  id: string;
  code: string;
  name: string;
  photo: string;
  career: {
    debut: number;
    teams: string[];
    totalSeasons: number;
  };
  seasons: PlayerSeason[];
  careerTotals?: BattingStats & CalculatedStats;
}

// 球員摘要（用於列表）
export interface PlayerSummary {
  id: string;
  name: string;
  number: string;
  photo: string;
  team: string;
  seasonStats: BattingStats & CalculatedStats;
  pitchingStats?: PitchingStats & PitchingCalculatedStats;
  rankings: Record<string, number>;
}

// 球團資料
export interface Team {
  id: string;
  name: string;
  code: string;
  logo: string;
  founded?: number;
  description?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

// 球團摘要（用於列表）
export interface TeamSummary {
  teamId: string;
  teamName: string;
  year: number;
  stats: {
    totalPlayers: number;
    avgBattingAvg: number;
    totalHomeRuns: number;
  };
  playerCount: number;
}

// 賽季摘要
export interface SeasonSummary {
  year: number;
  lastUpdated: string;
  teams: Record<string, {
    teamId: string;
    teamName: string;
    stats: {
      totalPlayers: number;
      avgBattingAvg: number;
      totalHomeRuns: number;
    };
    players: PlayerSummary[];
  }>;
}

// 聯盟統計
export interface LeagueStats {
  year: number;
  avgBattingAvg: number;
  avgOBP: number;
  avgSLG: number;
  avgOPS: number;
  totalPA: number;
  totalAB: number;
  wOBAScale: number;
  wOBAWeights: {
    BB: number;
    HBP: number;
    '1B': number;
    '2B': number;
    '3B': number;
    HR: number;
  };
}

// 球隊戰績
export interface TeamRecord {
  rank: number;             // 排名
  teamId: string;           // 球隊 ID
  teamName: string;         // 球隊名稱
  wins: number;             // 勝場
  losses: number;           // 敗場
  draws: number;            // 和局
  runsAllowed: number;      // 均失（平均失分）
  runsScored: number;       // 均得（平均得分）
}

// 聯盟戰績排名
export interface LeagueStandings {
  year: number;
  league: string;           // 聯盟名稱
  lastUpdated: string;
  teams: TeamRecord[];
}
