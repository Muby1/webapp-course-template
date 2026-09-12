// データベースへの接続と、SQLをまとめるファイル（第9章で説明）
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// DATABASE_URLが無いと、意味の分からない接続エラーになってしまうため、
// ここで気づけるようにする（第9章で.envを作り忘れた場合の案内）
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URLが設定されていません。.envを作成し、第9章の手順書を参考にNeonの接続文字列を貼り付けてください');
}

// 接続文字列はDATABASE_URLから読む。SSLの設定は接続文字列側で行うため、
// ここでは何も指定しない（CIのPostgreSQLはSSLなしのため）
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// db/schema.sqlを実行し、tasksテーブルがなければ作る。
// サーバー起動時とテストの開始時の両方から呼び出す（完成済みのコードとして提供）
async function initializeSchema() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

// DBの行（created_atなどスネークケース）を、APIで使う形（createdAtなどキャメルケース）に変換する
function mapRowToTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at
  };
  return task;
}

// tasksテーブルの全件を取得する
async function getAllTasks() {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  const taskList = [];
  for (const row of result.rows) {
    taskList.push(mapRowToTask(row));
  }
  return taskList;
}

// tasksテーブルに1件追加する
async function insertTask(title) {
  const result = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title]
  );
  return mapRowToTask(result.rows[0]);
}

// idで指定したタスクを更新する。見つからなければnullを返す。
// updatesにtitle・doneのどちらかだけがあれば、その項目だけを書き換え、
// もう片方は今の値のまま変えない（第11章で追加。片方だけ送られても大丈夫にする）
async function updateTask(id, updates) {
  const currentResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (currentResult.rows.length === 0) {
    return null;
  }
  const currentTask = currentResult.rows[0];

  let newTitle = currentTask.title;
  if (typeof updates.title === 'string') {
    newTitle = updates.title;
  }
  let newDone = currentTask.done;
  if (typeof updates.done === 'boolean') {
    newDone = updates.done;
  }

  const result = await pool.query(
    'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
    [newTitle, newDone, id]
  );
  return mapRowToTask(result.rows[0]);
}

// idで指定したタスクを削除する。削除できたかどうかをtrue/falseで返す
async function deleteTaskById(id) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount > 0;
}

// テストの終わりにDB接続を閉じるために使う（第11章で説明）
async function closePool() {
  await pool.end();
}

// tasksテーブルの中身を全部消す。テストが他のテストの影響を受けないように、
// 各テストの前に呼び出す（テスト専用。第11章で説明）
async function clearAllTasks() {
  await pool.query('DELETE FROM tasks');
}

module.exports = {
  initializeSchema: initializeSchema,
  getAllTasks: getAllTasks,
  insertTask: insertTask,
  updateTask: updateTask,
  deleteTaskById: deleteTaskById,
  closePool: closePool,
  clearAllTasks: clearAllTasks
};
