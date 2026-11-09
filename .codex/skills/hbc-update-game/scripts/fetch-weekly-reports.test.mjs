import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyRange, buildPlan } from './fetch-weekly-reports.mjs';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('seven Taipei calendar days include today and cross years correctly', () => {
  assert.deepEqual(weeklyRange('2026-11-09'), { from: '2026-11-03', to: '2026-11-09', timezone: 'Asia/Taipei' });
  assert.deepEqual(weeklyRange('2027-01-02'), { from: '2026-12-27', to: '2027-01-02', timezone: 'Asia/Taipei' });
  assert.throws(() => weeklyRange('2026-02-30'));
  assert.throws(() => weeklyRange('2026-2-3'));
});

test('fetch plan fixes group, existing local profile, two-candidate cap and pacing', () => {
  const plan = buildPlan({ fbpostDir: '/private/tmp/source with spaces', asOf: '2026-11-09', runId: 'test' });
  assert.equal(plan.cwd, '/private/tmp/source with spaces');
  const arg = name => plan.args[plan.args.indexOf(name) + 1];
  assert.equal(arg('--from'), '2026-11-03');
  assert.equal(arg('--to'), '2026-11-09');
  assert.equal(arg('--max-posts'), '2');
  assert.equal(arg('--post-delay-ms'), '5000');
  assert.equal(arg('--max-scrolls'), '3');
  assert.equal(arg('--group'), 'https://www.facebook.com/groups/1572865402911021/');
  assert.equal(arg('--profile'), '/private/tmp/source with spaces/.local/profile');
  assert.equal(plan.args.includes('--resume'), false);
  assert.match(arg('--output'), /\/output\/hbc-weekly-2026-11-09-test.json$/);
});

async function fakeSource(t) {
  const dir = await mkdtemp(join(tmpdir(), 'hbc weekly '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'src')); await mkdir(join(dir, '.local/profile'), { recursive: true }); await mkdir(join(dir, 'output'));
  await writeFile(join(dir, 'package.json'), '{"type":"module"}');
  return dir;
}

test('one child extraction filters exact author ID, retains unresolved and does not mutate source', async t => {
  const dir = await fakeSource(t);
  const author = { url: 'https://www.facebook.com/groups/1572865402911021/user/100000312762702/' };
  const raw = { posts: [{ id: '1', text: 'No.2026042 Team A 3:2 Team B', author }, { id: '2', text: 'No.2026043 Team C 1:0 Team D', author: { ...author, url: 'https://www.facebook.com/groups/1572865402911021/user/999/' } }, { id: '3', text: '一般公告', author }], unresolved: [{ id: '4', text: '日期待確認', author }], scan: { stopReason: 'post-limit' } };
  await writeFile(join(dir, 'src/cli.js'), `import fs from 'node:fs';const out=process.argv[process.argv.indexOf('--output')+1];fs.writeFileSync(out,JSON.stringify(${JSON.stringify(raw)}));`);
  const result = spawnSync(process.execPath, [new URL('./fetch-weekly-reports.mjs', import.meta.url).pathname, '--fbpost-dir', dir, '--as-of', '2026-11-09'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout.trim());
  const selected = JSON.parse(await readFile(summary.selectedPath, 'utf8'));
  assert.deepEqual(selected.posts.map(p => p.id), ['1']);
  assert.deepEqual(selected.unresolved.map(p => p.id), ['4']);
  assert.equal(selected.scan.stopReason, 'post-limit');
  assert.deepEqual(JSON.parse(await readFile(selected.rawReport, 'utf8')), raw);
});

test('active cooldown prevents launching even a new dated job', async t => {
  const dir = await fakeSource(t);
  await writeFile(join(dir, 'src/cli.js'), `import fs from 'node:fs';fs.writeFileSync('launched','yes');`);
  await writeFile(join(dir, 'output/previous.state.json'), JSON.stringify({ rateLimit: { notBefore: '2100-01-01T00:00:00Z' } }));
  const result = spawnSync(process.execPath, [new URL('./fetch-weekly-reports.mjs', import.meta.url).pathname, '--fbpost-dir', dir, '--as-of', '2026-11-09'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cooldown-active/);
  assert.equal((await readdir(dir)).includes('launched'), false);
});

test('schedule mode accepts short numbers and future game dates without treating scores as schedules', async t => {
  const dir = await fakeSource(t);
  const author = { url: 'https://www.facebook.com/groups/1572865402911021/user/100000312762702/' };
  const raw = { posts: [
    { id: 'schedule', text: '2026/12/5\nNo.98 Team A VS Team B--場地A--下午(14:30~17:00)', author },
    { id: 'report', text: 'No.2026098 Team A 3:2 Team B', author },
  ], unresolved: [], scan: { stopReason: 'post-limit' } };
  await writeFile(join(dir, 'src/cli.js'), `import fs from 'node:fs';fs.appendFileSync('calls','1');fs.writeFileSync(process.argv[process.argv.indexOf('--output')+1],JSON.stringify(${JSON.stringify(raw)}));`);
  const result = spawnSync(process.execPath, [new URL('./fetch-weekly-reports.mjs', import.meta.url).pathname, '--fbpost-dir', dir, '--as-of', '2026-11-09', '--kind', 'schedule'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const selected = JSON.parse(await readFile(JSON.parse(result.stdout.trim()).selectedPath, 'utf8'));
  assert.deepEqual(selected.posts.map(p => p.id), ['schedule']);
  assert.equal(await readFile(join(dir, 'calls'), 'utf8'), '1');
});

test('all mode splits a mixed announcement into both kinds while retaining one post', async t => {
  const dir = await fakeSource(t);
  const author = { url: 'https://www.facebook.com/groups/1572865402911021/user/100000312762702/' };
  const raw = { posts: [{ id: 'mixed', text: 'No.2026098 Team A 3:2 Team B\n2026/12/5\nNo.99 Team C VS Team D--場地A--中午(12:00~14:30)', author }], unresolved: [], scan: { stopReason: 'post-limit' } };
  await writeFile(join(dir, 'src/cli.js'), `import fs from 'node:fs';fs.appendFileSync('calls','1');fs.writeFileSync(process.argv[process.argv.indexOf('--output')+1],JSON.stringify(${JSON.stringify(raw)}));`);
  const result = spawnSync(process.execPath, [new URL('./fetch-weekly-reports.mjs', import.meta.url).pathname, '--fbpost-dir', dir, '--as-of', '2026-11-09', '--kind', 'all'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const selected = JSON.parse(await readFile(JSON.parse(result.stdout.trim()).selectedPath, 'utf8'));
  assert.deepEqual(selected.posts.map(p => p.id), ['mixed']);
  assert.deepEqual(selected.reportPosts.map(p => p.id), ['mixed']);
  assert.deepEqual(selected.schedulePosts.map(p => p.id), ['mixed']);
  assert.equal(await readFile(join(dir, 'calls'), 'utf8'), '1');
});

test('reuse mode requires matching source and date range and never opens a browser', async t => {
  const dir = await fakeSource(t);
  const source = join(dir, 'saved.json');
  const raw = { groupUrl: 'https://www.facebook.com/groups/1572865402911021/', dateRange: { from: '2026-11-03', to: '2026-11-09', timezone: 'Asia/Taipei' }, posts: [{ id: '1', text: 'No.98 Team A VS Team B', author: { url: 'https://www.facebook.com/groups/1572865402911021/user/100000312762702/' } }], unresolved: [], scan: { stopReason: 'post-limit' } };
  await writeFile(source, JSON.stringify(raw));
  const args = [new URL('./fetch-weekly-reports.mjs', import.meta.url).pathname, '--fbpost-dir', dir, '--as-of', '2026-11-09', '--kind', 'schedule', '--input', source];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const selected = JSON.parse(await readFile(JSON.parse(result.stdout.trim()).selectedPath, 'utf8'));
  assert.equal(selected.rawReport, source);
  assert.deepEqual(selected.posts.map(p => p.id), ['1']);
  raw.dateRange.to = '2026-11-08'; await writeFile(source, JSON.stringify(raw));
  const mismatch = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /input-mismatch/);
});
