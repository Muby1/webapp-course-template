// タスクAPIの動作を確認するテストファイル（第11章で説明）

// APP_ENVがtestでなければ実行を中止する（安全装置）。
// テストのたびにtasksテーブルの中身を空にするため、間違って開発用・本番用の
// データベースに対して実行してしまうと、データが消えてしまう
if (process.env.APP_ENV !== 'test') {
  throw new Error('APP_ENVがtestではありません。.env.testを使って実行してください（npm test）');
}

const fs = require('fs');
const path = require('path');

// .env.testの接続文字列が、開発用の.envと同じになっていないか確認する（安全装置）。
// .envがない環境（CIなど）では、比べる相手がないので確認しない。
// 完成済みのコードとして提供する（fs・pathは第9章のdb.jsと同じ理由で新出用語には含めない）
const devDatabaseUrl = readDevDatabaseUrl();
if (devDatabaseUrl !== null && devDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error(
    '.env.testの接続文字列が.envと同じです。開発用のデータベースを使おうとしている可能性があります。'
    + 'Neonのtestブランチの接続文字列を確認し、.env.testに貼り直してください'
  );
}

// .envファイルからDATABASE_URLの値だけを取り出す。ファイルがなければnullを返す
function readDevDatabaseUrl() {
  const devEnvPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(devEnvPath)) {
    return null;
  }
  const content = fs.readFileSync(devEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
      return line.substring('DATABASE_URL='.length).trim();
    }
  }
  return null;
}

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

test.before(prepareDatabase);
test.beforeEach(clearTasksTable);
test.after(closeDatabase);

async function prepareDatabase() {
  await db.initializeSchema();
}

async function clearTasksTable() {
  await db.clearAllTasks();
}

async function closeDatabase() {
  await db.closePool();
}

test('GET /api/tasksは、タスクの配列を返す', async function () {
  const response = await request(app).get('/api/tasks');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(Array.isArray(response.body), true);
});

test('POST /api/tasksは、タイトルを送ると201でタスクを追加する', async function () {
  const response = await request(app)
    .post('/api/tasks')
    .send({ title: '牛乳を買う' });
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.title, '牛乳を買う');
  assert.strictEqual(response.body.done, false);
});

test('POST /api/tasksは、空のタイトルだと400を返す', async function () {
  const response = await request(app)
    .post('/api/tasks')
    .send({ title: '' });
  assert.strictEqual(response.status, 400);
});

test('POST /api/tasksは、100文字を超えるタイトルだと400を返す', async function () {
  const longTitle = 'あ'.repeat(101);
  const response = await request(app)
    .post('/api/tasks')
    .send({ title: longTitle });
  assert.strictEqual(response.status, 400);
});

test('PUT /api/tasks/:idは、完了状態を更新できる', async function () {
  const createdResponse = await request(app)
    .post('/api/tasks')
    .send({ title: '掃除をする' });
  const taskId = createdResponse.body.id;

  const response = await request(app)
    .put('/api/tasks/' + taskId)
    .send({ done: true });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.done, true);
});

test('PUT /api/tasks/:idで完了状態だけを更新しても、タイトルは変わらない', async function () {
  const createdResponse = await request(app)
    .post('/api/tasks')
    .send({ title: '元のタイトル' });
  const taskId = createdResponse.body.id;

  const response = await request(app)
    .put('/api/tasks/' + taskId)
    .send({ done: true });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.done, true);
  assert.strictEqual(response.body.title, '元のタイトル');
});

test('PUT /api/tasks/:idは、存在しないidだと404を返す', async function () {
  const response = await request(app)
    .put('/api/tasks/999999')
    .send({ done: true });
  assert.strictEqual(response.status, 404);
});

test('DELETE /api/tasks/:idは、タスクを削除できる', async function () {
  const createdResponse = await request(app)
    .post('/api/tasks')
    .send({ title: '洗濯をする' });
  const taskId = createdResponse.body.id;

  const response = await request(app).delete('/api/tasks/' + taskId);
  assert.strictEqual(response.status, 204);
});

test('DELETE /api/tasks/:idは、存在しないidだと404を返す', async function () {
  const response = await request(app).delete('/api/tasks/999999');
  assert.strictEqual(response.status, 404);
});
