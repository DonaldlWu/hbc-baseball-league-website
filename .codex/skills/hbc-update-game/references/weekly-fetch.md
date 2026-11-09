# 近一週自動抓取

在使用者只說「更新戰報」「更新本週戰報」或沒有提供報告／場次時使用本模式。若有貼報告或指定 gameNumber，保留原模式，不額外連 Facebook。

## 執行一次

從 HBCWebsite 根目錄執行：

```sh
node .codex/skills/hbc-update-game/scripts/fetch-weekly-reports.mjs
```

預設使用 `/Users/wuderen/WorkSpace/fbpost`、`.local/profile`，社團 `1572865402911021`，作者帳號 ID `100000312762702`。作者篩選只依帳號 ID，不保存姓名設定。可用 `--fbpost-dir PATH` 指定搬遷位置。只能使用已有登入；不讀出 cookie、不保存密碼。不自動跑 login 或要求使用者貼週報來替代失效登入。

日期為 Asia/Taipei 的最近七個日曆日、含當天。`--as-of YYYY-MM-DD` 指定截止日仍只抓七天；不是上一個週一至週日。先報告實際日期範圍。`--dry-run` 只輸出命令計畫，不抓取、不建立結果。

每次只啟動一次 fbpost：最多處理兩個候選（含其他作者、已知或略過）、最多三輪、逐篇及捲動等待 5000ms。它限制的是操作數，不保證找完兩篇戰報或涵蓋整週。不要因零結果、post-limit 或 max-scrolls 自動增大預算、重跑或回補前週。尊重任何更新的使用者限制。

helper 執行前檢查 fbpost/output/*.state.json 的冷卻；不要搬移/刪除這些檔案來繞過。fbpost 原生保留本次 checkpoint、HTTP 429/403 與提示偵測。自訂 state 位置或外部工具記錄的冷卻不在 helper 掃描範圍，若已知另有冷卻，同樣先停止。不與 login 或使用相同 profile 的程序並行。

瀏覽器 sandbox 限制需依執行環境申請相應權限，不能把瀏覽器啟動失敗當成無戰報。登入失效時提示使用者於 fbpost 更新登入後再執行；不自動循環重試。

helper 最後輸出 selectedPath，原始及篩選 JSON 留在 fbpost/output/，不要複製私人全文到網站 public/ 或提交 Git。讀取 selectedPath 的 posts、unresolved 及 scan。post-limit/stalled/max-scrolls 都不代表週內完整；零候選回報「本次未取得可用戰報」，不是「本週沒有戰報」。任何非零退出不繼續自動寫入；保留結果與停止原因。

## 匹配及本機更新

1. 只使用指定作者的完整正文；有 message-not-found、content-empty、content-not-expanded、日期/身分待確認等警示者先列待確認。
2. 每個 `No.` 場次區塊分開解析，gameNumber 是主鍵；用其賽季找到已存在的 game。不要以發文日或週報標題日期改寫比賽 date。雨延完賽只更新結果，保留完整 rescheduledDates。
3. **隊名以目標 season game 為準**。報告缺字、錯字、簡稱不能導致改網站名稱、擅設別名或新建球隊。若編號相同但報告名稱有異，使用試算表的雙方隊伍、比分、比賽/補賽日期等獨立證據校驗。可證實是報告筆誤才更新該 game 的結果；證據不足列待確認，不做模糊名稱自動配對。
4. 報告比分左側通常為客隊/先攻、右側為主隊/後攻；需對照專案 homeTeam/awayTeam 與 Sheet 先後攻。不能因文字隊伍順序寫錯而倒填比分。0 與 null 分開。
5. `sheets[].spreadsheetId` 對應網站的 `sheetId`，不是 gid。若 plain text 顯示縮略網址，**不按場次與 sheets[] 陣列順序直接配對**。以區塊的連結證據及 Sheet 的隊伍/比分/日期共同確認；唯一縮略前綴只能作候選提示。無法證明某個完整 URL 屬於該場，列待確認，不猜。完整 href 的文字與位置證據若輸出未保存，本次不額外批次抓取，回報缺少證據。
6. 驗證 Sheet 時只讀候選完整網址，循序取得 CSV；使用目前 `src/lib/gameReportParser.ts` 的主客對應，不使用舊 `scripts/parse-game-report.ts` 的相反標示。檢查 CSV 必要欄位；登入 HTML、空日期或 parser 預設補成 0 不構成有效證據。無 gid 時不假設 0；只有預設分頁可驗證且網站現有 parser 能讀時才寫入。
7. 每場分類為可更新、無變更、待確認或衝突。既有不同 finished 比分／sheetId、同批對同場不一致、未知場次或第一版尚未處理的季後賽都列待確認。不要覆蓋非空值或擅自新增賽程。缺少新表單不能清空既有 sheetId。
8. 使用者「更新戰報」已授權可驗證且無衝突的本機結果更新，不重複詢問例行確認；先準備並檢查逐場差異，再只修改對應 status/homeScore/awayScore/sheetId。遇到其明確要求僅預覽則不寫入。寫入前重讀資料，避免覆蓋同期間的人工作業。不同場次的待確認項不必阻塞其他已驗證場次。
9. 按 SKILL.md 的規則重算 calculated standings、保留 adjustments/teamId；manual/partial 不重算。不拿只計算排名的 calculateStandings 當成從 games 重建戰績。只在有實質變更時更新 lastUpdated，重跑同資料不重複改寫。
10. 驗證變更 JSON、相關 Jest 測試及 TypeScript；依變更影響完成專案必要檢查。輸出來源發文日、對應實際賽日、場次、變更前後、更新/無變更/待確認數量、停止原因與未保證完整的範圍。既有未完成檔案與資料不改寫。不自動 commit、push、部署、排程或傳送訊息。

## 本機 helper 驗證

```sh
node --test .codex/skills/hbc-update-game/scripts/fetch-weekly-reports.test.mjs
node .codex/skills/hbc-update-game/scripts/fetch-weekly-reports.mjs --as-of 2026-11-09 --dry-run
```

測試用假的本機擷取程式，不連 Facebook，驗證七日邊界、候選預算、作者 ID、保留 unresolved 與跨任務冷卻阻擋。這不是網站資料更新器；後續匹配和寫入由本 skill 的 agent 執行。自然語言觸發依執行環境的 skill discovery；明確使用 `$hbc-update-game` 最可靠。
