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
  const raw = { posts: [{ id: '1', text: 'No.2026042 測試', author }, { id: '2', text: 'No.2026043 同名不同人', author: { ...author, url: 'https://www.facebook.com/groups/1572865402911021/user/999/' } }, { id: '3', text: '一般公告', author }], unresolved: [{ id: '4', text: '日期待確認', author }], scan: { stopReason: 'post-limit' } };
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
