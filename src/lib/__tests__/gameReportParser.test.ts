import { parseGameReportCSV, fetchSheetCSV, getGameReport } from '../gameReportParser';

// 模擬 CSV 資料（基於實際 Google Sheet 格式）
// CSV 打者欄位: 背號, 名字, 打席(PA), 安打(H), 三振(SO), 四死(BB), 打點(RBI), 得分(R), 盜壘(SB)
// CSV 投手欄位: 背號, 名字, 局數(IP), 人次(NP), 奪三振(K), 四死(BB), 被安打(H), 被HR, 失分(R)
const mockCSV = `"","","","","","","","","","","","","","2026/1/10","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","","","","1","2","3","4","5","6","","7","8","9","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","","","","6","1","0","1","6","0","","2","","","16","18","2","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","","","","2","0","0","0","0","2","","0","","","4","8","7","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","永春TB","","","","","","","","","","台大經濟OB","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"46","楊鈞睿","7","32","7","2","8","0","4","","87","游承軒","2","17","1","4","6","0","7","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","102","許兆銘","4","26","4","1","10","0","7","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","TOTAL","7","32","7","2","8","0","4","","","TOTAL","7","50","5","5","18","0","16","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"","永春TB","","","","","","","","0.315","","台大經濟OB","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"39","林倫齊","6","3","0","1","1","2","0","","31","陳一德","4","2","0","0","0","1","0","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"79","呂柏融","6","2","0","0","0","1","0","","52","蔡竣宇","4","2","0","0","0","1","0","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""
"51","黃上維","6","2","1","0","2","1","0","","39","莊炘睿","4","0","1","0","0","0","0","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""`;

describe('gameReportParser', () => {
  describe('parseGameReportCSV', () => {
    it('應該正確解析日期', () => {
      const result = parseGameReportCSV(mockCSV, '2025142', '中正A');
      expect(result.date).toBe('2026-1-10');
    });

    it('應該正確解析比賽編號和場地', () => {
      const result = parseGameReportCSV(mockCSV, '2025142', '中正A');
      expect(result.gameNumber).toBe('2025142');
      expect(result.venue).toBe('中正A');
    });

    it('應該正確解析隊名（左側=先攻=客隊，右側=後攻=主隊）', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');
      expect(result.homeTeam.name).toBe('台大經濟OB'); // 右側 = 後攻 = 主隊
      expect(result.awayTeam.name).toBe('永春TB');     // 左側 = 先攻 = 客隊
    });

    it('應該正確解析 R/H/E', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');
      expect(result.homeTeam.runs).toBe(4);   // 後攻(主隊) = Row 3
      expect(result.homeTeam.hits).toBe(8);
      expect(result.homeTeam.errors).toBe(7);
      expect(result.awayTeam.runs).toBe(16);  // 先攻(客隊) = Row 2
      expect(result.awayTeam.hits).toBe(18);
      expect(result.awayTeam.errors).toBe(2);
    });

    it('應該正確解析逐局得分（跳過空欄 column 10）', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');

      // 主隊(後攻): 2-0-0-0-0-2-0 (7局, Row 3)
      expect(result.innings.home).toEqual([2, 0, 0, 0, 0, 2, 0, null, null]);

      // 客隊(先攻): 6-1-0-1-6-0-2 (7局, Row 2)
      expect(result.innings.away).toEqual([6, 1, 0, 1, 6, 0, 2, null, null]);
    });

    it('應該正確解析投手數據', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');

      // 投手格式: 背號, 名字, 局數(IP), 人次(NP), 奪三振(K), 四死(BB), 被安打(H), 被HR, 失分
      // 楊鈞睿在左側(先攻=客隊) cols 0-8
      expect(result.awayTeam.pitchers).toHaveLength(1);
      expect(result.awayTeam.pitchers[0]).toEqual({
        number: '46',
        name: '楊鈞睿',
        ip: '7',
        np: 32,
        k: 7,     // 奪三振
        bb: 2,    // 四死
        h: 8,     // 被安打
        r: 4,     // 失分
        er: 4,    // 責失 (CSV 無此欄位，用失分代替)
      });

      // 游承軒、許兆銘在右側(後攻=主隊) cols 10-18
      expect(result.homeTeam.pitchers).toHaveLength(2);
      expect(result.homeTeam.pitchers[0]).toEqual({
        number: '87',
        name: '游承軒',
        ip: '2',
        np: 17,
        k: 1,     // 奪三振
        bb: 4,    // 四死
        h: 6,     // 被安打
        r: 7,     // 失分
        er: 7,    // 責失 (CSV 無此欄位，用失分代替)
      });
    });

    it('應該正確解析客隊打者數據（左側=先攻=客隊）', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');

      // 打者格式: 背號, 名字, 打席(PA), 安打(H), 三振(SO), 四死(BB), 打點(RBI), 得分(R), 盜壘(SB)
      // 林倫齊在左側(先攻=客隊): 39, 林倫齊, 6, 3, 0, 1, 1, 2, 0
      expect(result.awayTeam.batters).toHaveLength(3);
      expect(result.awayTeam.batters[0]).toEqual({
        number: '39',
        name: '林倫齊',
        pa: 6,    // 打席
        ab: 5,    // 打數 = 打席(6) - 四死(1)
        r: 2,     // 得分
        h: 3,     // 安打
        rbi: 1,   // 打點
        bb: 1,    // 四死
        so: 0,    // 三振
        sb: 0,    // 盜壘
      });
    });

    it('應該正確解析主隊打者數據（右側=後攻=主隊）', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');

      // 陳一德在右側(後攻=主隊): 31, 陳一德, 4, 2, 0, 0, 0, 1, 0
      expect(result.homeTeam.batters).toHaveLength(3);
      expect(result.homeTeam.batters[0]).toEqual({
        number: '31',
        name: '陳一德',
        pa: 4,    // 打席
        ab: 4,    // 打數 = 打席(4) - 四死(0)
        r: 1,     // 得分
        h: 2,     // 安打
        rbi: 0,   // 打點
        bb: 0,    // 四死
        so: 0,    // 三振
        sb: 0,    // 盜壘
      });
    });

    it('應該正確解析客隊打擊率（左側=先攻=客隊）', () => {
      const result = parseGameReportCSV(mockCSV, '2025142');
      expect(result.awayTeam.battingAvg).toBe(0.315);
    });

    it('應該處理空值和無效數值', () => {
      const emptyCSV = `"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""
"","","","","","","","","","","","","","","","","",""`;

      const result = parseGameReportCSV(emptyCSV, '2025999');

      expect(result.homeTeam.runs).toBe(0);
      expect(result.homeTeam.hits).toBe(0);
      expect(result.homeTeam.name).toBe('');
      expect(result.innings.home).toEqual([null, null, null, null, null, null, null, null, null]);
    });
  });

  describe('fetchSheetCSV', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('應該從 Google Sheet 取得 CSV', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      });

      const result = await fetchSheetCSV('test-sheet-id');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://docs.google.com/spreadsheets/d/test-sheet-id/gviz/tq?tqx=out:csv'
      );
      expect(result).toBe(mockCSV);
    });

    it('應該在請求失敗時拋出錯誤', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchSheetCSV('invalid-id')).rejects.toThrow('Failed to fetch sheet: 404');
    });
  });

  describe('getGameReport', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('應該取得並解析完整的比賽戰報', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      });

      const result = await getGameReport('test-id', '2025142', '中正A');

      expect(result.gameNumber).toBe('2025142');
      expect(result.venue).toBe('中正A');
      expect(result.homeTeam.name).toBe('台大經濟OB'); // 右側 = 後攻 = 主隊
      expect(result.awayTeam.name).toBe('永春TB');     // 左側 = 先攻 = 客隊
      // 驗證林倫齊（客隊打者）的數據
      expect(result.awayTeam.batters[0].name).toBe('林倫齊');
      expect(result.awayTeam.batters[0].ab).toBe(5);
      expect(result.awayTeam.batters[0].h).toBe(3);
    });
  });
});
