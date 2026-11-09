#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { access, readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const DEFAULT_SOURCE = '/Users/wuderen/WorkSpace/fbpost';
const GROUP = 'https://www.facebook.com/groups/1572865402911021/';
const AUTHOR = '100000312762702';

export function weeklyRange(asOf) {
  const today = asOf ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('--as-of 必須為 YYYY-MM-DD');
  const end = new Date(`${today}T12:00:00Z`);
  if (!Number.isFinite(end.getTime()) || end.toISOString().slice(0, 10) !== today) throw new Error('--as-of 日期不存在');
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
  return { from: start.toISOString().slice(0, 10), to: today, timezone: 'Asia/Taipei' };
}

export function buildPlan({ fbpostDir = DEFAULT_SOURCE, asOf, runId = randomUUID() } = {}) {
  const cwd = resolve(fbpostDir);
  const range = weeklyRange(asOf);
  const output = join(cwd, 'output', `hbc-weekly-${range.to}-${runId}.json`);
  return { cwd, range, output, args: [join(cwd, 'src/cli.js'), 'extract', '--channel', 'chrome',
    '--group', GROUP, '--from', range.from, '--to', range.to, '--timezone', range.timezone,
    '--profile', join(cwd, '.local/profile'), '--max-posts', '2', '--max-scrolls', '3',
    '--post-delay-ms', '5000', '--delay-ms', '5000', '--output', output] };
}

function isAuthor(post) {
  try { return new URL(post.author?.url).pathname === `/groups/1572865402911021/user/${AUTHOR}/`; }
  catch { return false; }
}

async function checkCooldown(cwd) {
  let files;
  try { files = await readdir(join(cwd, 'output')); }
  catch (e) { if (e.code === 'ENOENT') return; throw e; }
  for (const file of files.filter(f => f.endsWith('.state.json'))) {
    const state = JSON.parse(await readFile(join(cwd, 'output', file), 'utf8'));
    const until = state.rateLimit?.notBefore;
    if (until && (!Number.isFinite(Date.parse(until)) || Date.parse(until) > Date.now())) {
      throw new Error(`cooldown-active：${file} 記錄冷卻至 ${until}；本次不啟動瀏覽器`);
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({ args: argv, options: {
    'as-of': { type: 'string' }, 'fbpost-dir': { type: 'string' },
    'dry-run': { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('抓取最近七個台北日曆日（含當天）的戰報候選。\n--as-of YYYY-MM-DD 指定截止日\n--fbpost-dir PATH 指定本機 fbpost 專案\n--dry-run 只顯示計畫，不開瀏覽器或寫檔');
    return;
  }
  const plan = buildPlan({ fbpostDir: values['fbpost-dir'], asOf: values['as-of'] });
  if (values['dry-run']) { console.log(JSON.stringify(plan, null, 2)); return; }
  await access(join(plan.cwd, 'src/cli.js'));
  if (!(await stat(join(plan.cwd, '.local/profile'))).isDirectory()) throw new Error('本機登入 profile 不存在，請先執行 fbpost login');
  await checkCooldown(plan.cwd);
  const code = await new Promise((resolveCode, reject) => {
    const child = spawn(process.execPath, plan.args, { cwd: plan.cwd, stdio: 'inherit', shell: false });
    child.once('error', reject);
    child.once('exit', (status, signal) => resolveCode(status ?? (signal ? 130 : 1)));
  });
  let raw;
  try { raw = JSON.parse(await readFile(plan.output, 'utf8')); }
  catch (e) { if (code) throw new Error(`抓取失敗（exit ${code}），未取得有效結果；不自動重試。${e.message}`); throw e; }
  if (!Array.isArray(raw.posts) || !Array.isArray(raw.unresolved) || !raw.scan) throw new Error('擷取結果格式不符');
  const posts = raw.posts.filter(p => isAuthor(p) && /No\.\s*\d{5,}/i.test(p.text));
  const selected = { range: plan.range, authorId: AUTHOR, rawReport: plan.output,
    posts, unresolved: raw.unresolved.filter(isAuthor), scan: raw.scan,
    note: '有界掃描，不保證一週完整。姓名以網站專案為準；本檔不是可直接套用的更新計畫。' };
  const selectedPath = plan.output.replace(/\.json$/, '.selected.json');
  await writeFile(selectedPath, JSON.stringify(selected, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ selectedPath, range: plan.range, reportCandidates: posts.length,
    unresolved: selected.unresolved.length, stopReason: raw.scan.stopReason, completeness: 'not-guaranteed' }));
  if (code || ['login-required', 'access-denied', 'loading-timeout', 'rate-limited', 'http-forbidden', 'error', 'post-not-found', 'interrupted'].includes(raw.scan.stopReason)) process.exitCode = code || 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => { console.error(e.message); process.exitCode = 1; });
}
