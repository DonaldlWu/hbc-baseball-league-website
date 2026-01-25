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

// 球團資料（舊格式，保留向下相容）
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

// 球團資料（all_teams.json 格式）
export interface TeamInfo {
  id: string;
  name: string;
  iconUrl: string;
  yearsActive: number[];
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
  iconUrl?: string;  // 球隊圖標 URL
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

// 球隊戰績（原始資料，從 JSON 讀取）
export interface TeamRecordRaw {
  teamId: string;           // 球隊 ID
  teamName: string;         // 球隊名稱
  wins: number;             // 勝場
  losses: number;           // 敗場
  draws: number;            // 和局
  runsAllowed: number;      // 均失（平均失分）
  runsScored: number;       // 均得（平均得分）
}

// 球隊戰績（含計算欄位）
export interface TeamRecord extends TeamRecordRaw {
  rank: number;             // 排名（計算後）
  gamesPlayed: number;      // 已賽場數
  points: number;           // 積分（勝3分、和1分、敗0分）
  winRate: number;          // 勝率 = 勝 / (勝 + 敗)
  gamesBehind: number | null; // 勝差（第一名為 null）
}

// 聯盟戰績排名
export interface LeagueStandings {
  year: number;
  league: string;           // 聯盟名稱
  lastUpdated: string;
  teams: TeamRecord[];
}

// 公告圖片
export interface AnnouncementImage {
  url: string;
  alt: string;
}

// 公告連結
export interface AnnouncementLink {
  label: string;
  url: string;
}

// 公告資料
export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;  // ISO 8601 格式
  images: AnnouncementImage[];
  links: AnnouncementLink[];
  category: string;
  priority: number;     // 數字越小優先級越高
  pinned: boolean;      // 是否置頂
}

// 公告列表（含 metadata）
export interface AnnouncementsData {
  announcements: Announcement[];
  meta: {
    lastUpdated: string;
    totalCount: number;
    categories: string[];
  };
}

// 賽程時段
export type TimeSlot = '上午' | '中午' | '下午';

// 單場比賽
export interface Game {
  gameNumber: string;      // 賽程編號 (如 "2025201"，格式：賽季年度+場次編號)
  homeTeam: string;        // 主隊名稱
  awayTeam: string;        // 客隊名稱
  venue: string;           // 場地 (如 "中正A")
  timeSlot: TimeSlot;      // 時段
  startTime: string;       // 開始時間 (如 "08:00")
  endTime: string;         // 結束時間 (如 "11:00")
  season?: number;         // 賽季年度 (如 2025)，可從 gameNumber 解析
  result?: {               // 比賽結果（選填，未開打則無）
    homeScore: number;
    awayScore: number;
    status: 'finished' | 'in_progress' | 'postponed' | 'cancelled';
  };
}

// 單日賽程（按場地分組）
export interface DaySchedule {
  date: string;            // 日期 (ISO 8601: "2026-01-03")
  venues: {
    [venueName: string]: Game[];  // 場地名稱 -> 該場地的比賽列表
  };
}

// 月賽程
export interface MonthSchedule {
  year: number;            // 日曆年份 (如 2026)
  month: number;           // 月份 (1-12)
  season?: number;         // 賽季年度 (如 2025)，比賽所屬的賽季
  days: DaySchedule[];     // 該月所有有賽程的日期
}

// 賽程資料（含 metadata）
export interface ScheduleData {
  schedule: MonthSchedule;
  meta: {
    lastUpdated: string;
    totalGames: number;
    venues: string[];      // 所有場地列表
  };
}

// ============ 比賽戰報 ============

// 投手數據
export interface PitcherStats {
  number: string;
  name: string;
  ip: string;      // 投球局數
  np: number;      // 投球數
  h: number;       // 被安打
  r: number;       // 失分
  er: number;      // 自責分
  bb: number;      // 保送
  k: number;       // 三振
}

// 打者數據
export interface BatterStats {
  number: string;
  name: string;
  pa: number;      // 打席
  ab: number;      // 打數
  r: number;       // 得分
  h: number;       // 安打
  rbi: number;     // 打點
  bb: number;      // 保送
  so: number;      // 三振
  sb: number;      // 盜壘
}

// 球隊戰報數據
export interface TeamGameStats {
  name: string;
  runs: number;
  hits: number;
  errors: number;
  battingAvg?: number;
  pitchers: PitcherStats[];
  batters: BatterStats[];
}

// 比賽戰報
export interface GameReport {
  gameNumber: string;      // 賽程編號 (如 "2025201"，格式：賽季年度+場次編號)
  date: string;
  venue?: string;
  season?: number;         // 賽季年度 (如 2025)，可從 gameNumber 解析
  innings: {
    home: (number | null)[];
    away: (number | null)[];
  };
  homeTeam: TeamGameStats;
  awayTeam: TeamGameStats;
}

// gameNumber 解析結果
export interface ParsedGameNumber {
  season: number;          // 賽季年度 (如 2025)
  number: number;          // 場次編號 (如 201)
}
