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

// idで指定したタスクの完了状態を更新する。見つからなければnullを返す。
// タイトルの更新は第11章で追加する（読解のみ、第9章では完成済みのコードとして提供）
async function updateTaskDone(id, done) {
  const result = await pool.query(
    'UPDATE tasks SET done = $1 WHERE id = $2 RETURNING *',
    [done, id]
  );
  if (result.rows.length === 0) {
    return null;
  }
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

module.exports = {
  initializeSchema: initializeSchema,
  getAllTasks: getAllTasks,
  insertTask: insertTask,
  updateTaskDone: updateTaskDone,
  deleteTaskById: deleteTaskById,
  closePool: closePool
};
