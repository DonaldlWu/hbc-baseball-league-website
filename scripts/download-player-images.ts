/**
 * 下載球員圖片到本地（選用功能）
 *
 * ⚠️ 注意：這是選用功能，不是必要步驟
 *
 * 預設行為：
 * - 使用遠端圖片 URL（Google Photos）
 * - Next.js Image Optimization 會自動優化並快取
 * - 不佔用 git 空間
 *
 * 使用此腳本的情境：
 * 1. 想要完全避免 Image Optimization 配額消耗
 * 2. 需要離線開發環境
 * 3. 外部圖片來源不穩定
 *
 * 執行後：
 * 1. 下載圖片到 public/images/players/
 * 2. 更新 JSON 中的 photo 路徑為本地路徑
 * 3. 需要提交圖片到 git（會增加 repo 大小）
 *
 * 使用方式：
 * npm run download-images
 *
 * 如果要還原為遠端圖片：
 * 1. 刪除 public/images/players/ 目錄
 * 2. 手動還原 JSON 中的 photo URL 為原始 URL
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface PlayerData {
  id: string;
  photo: string;
  [key: string]: any;
}

// 設定
const PLAYERS_DATA_DIR = path.join(process.cwd(), 'public/data/players');
const IMAGES_OUTPUT_DIR = path.join(process.cwd(), 'public/images/players');
const CONCURRENT_DOWNLOADS = 5; // 同時下載數量

/**
 * 下載圖片
 */
async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`  ❌ HTTP ${response.status}: ${url}`);
      return false;
    }

    if (!response.body) {
      console.error(`  ❌ No response body: ${url}`);
      return false;
    }

    // 確保目錄存在
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // 使用 stream 下載以節省記憶體
    const fileStream = createWriteStream(outputPath);
    // @ts-ignore - Node.js stream compatibility
    await pipeline(response.body, fileStream);

    return true;
  } catch (error) {
    console.error(`  ❌ Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * 取得圖片副檔名
 */
function getImageExtension(url: string): string {
  // Google Photos URL 通常沒有副檔名，預設使用 .jpg
  if (url.includes('googleusercontent.com')) {
    return '.jpg';
  }

  const match = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : '.jpg';
}

/**
 * 檢查檔案是否存在
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 處理單個球員
 */
async function processPlayer(
  playerFile: string,
  skipExisting: boolean = true
): Promise<{ success: boolean; skipped: boolean }> {
  const playerPath = path.join(PLAYERS_DATA_DIR, playerFile);

  try {
    const content = await fs.readFile(playerPath, 'utf-8');
    const player: PlayerData = JSON.parse(content);

    // 如果沒有照片 URL，跳過
    if (!player.photo) {
      return { success: true, skipped: true };
    }

    // 如果已經是本地路徑，跳過
    if (player.photo.startsWith('/images/')) {
      return { success: true, skipped: true };
    }

    // 產生本地檔案路徑
    const ext = getImageExtension(player.photo);
    const localFileName = `${player.id}${ext}`;
    const localFilePath = path.join(IMAGES_OUTPUT_DIR, localFileName);
    const localUrlPath = `/images/players/${localFileName}`;

    // 如果檔案已存在且設定跳過，直接更新 JSON
    if (skipExisting && await fileExists(localFilePath)) {
      // 更新 JSON
      player.photo = localUrlPath;
      await fs.writeFile(playerPath, JSON.stringify(player, null, 2));
      return { success: true, skipped: true };
    }

    // 下載圖片
    console.log(`  ⬇️  ${player.name} (${player.id})`);
    const downloaded = await downloadImage(player.photo, localFilePath);

    if (!downloaded) {
      return { success: false, skipped: false };
    }

    // 更新 JSON 中的路徑
    player.photo = localUrlPath;
    await fs.writeFile(playerPath, JSON.stringify(player, null, 2));

    return { success: true, skipped: false };
  } catch (error) {
    console.error(`  ❌ Error processing ${playerFile}:`, error);
    return { success: false, skipped: false };
  }
}

/**
 * 批次處理（控制並發數）
 */
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  concurrency: number
): Promise<any[]> {
  const results: any[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始下載球員圖片...\n');

  // 建立輸出目錄
  await fs.mkdir(IMAGES_OUTPUT_DIR, { recursive: true });

  // 讀取所有球員檔案
  const playerFiles = (await fs.readdir(PLAYERS_DATA_DIR))
    .filter(file => file.endsWith('.json'));

  console.log(`📄 找到 ${playerFiles.length} 位球員\n`);

  // 處理所有球員（控制並發數）
  const results = await processBatch(
    playerFiles,
    (file) => processPlayer(file, true),
    CONCURRENT_DOWNLOADS
  );

  // 統計結果
  const successful = results.filter(r => r.success).length;
  const skipped = results.filter(r => r.skipped).length;
  const downloaded = successful - skipped;
  const failed = results.length - successful;

  console.log('\n📊 下載完成統計：');
  console.log(`  ✅ 成功下載: ${downloaded} 張`);
  console.log(`  ⏭️  跳過（已存在）: ${skipped} 張`);
  console.log(`  ❌ 失敗: ${failed} 張`);
  console.log(`  📁 圖片儲存位置: ${IMAGES_OUTPUT_DIR}`);

  if (failed > 0) {
    console.log('\n⚠️  有部分圖片下載失敗，請檢查錯誤訊息');
    process.exit(1);
  }

  console.log('\n✨ 所有圖片已下載完成！');
}

// 執行
main().catch(error => {
  console.error('💥 執行失敗：', error);
  process.exit(1);
});
