// APIのルーティングをまとめるファイル。
// server.js から分けておくことで、テストからは起動処理を通さずに
// このファイルだけを読み込んで確認できるようにする（第9章で説明）
const express = require('express');

const app = express();

// リクエストの本文（JSON）を読み取れるようにする（第7章で説明）
app.use(express.json());

// public以下の画面ファイルを配信する（第7章で説明）
app.use(express.static('public'));

// タスクをファイル内の配列に保存する。サーバーを再起動すると消えてしまう
// （第9章でデータベースに置き換える）
let tasks = [
  { id: 1, title: '牛乳を買う', done: false, createdAt: '2026-01-01' },
  { id: 2, title: '掃除をする', done: true, createdAt: '2026-01-01' }
];
let nextTaskId = 3;

// Renderのヘルスチェックや、動作確認に使うAPI
app.get('/health', getHealth);
app.get('/api/tasks', getTasks);
app.post('/api/tasks', createTask);
app.put('/api/tasks/:id', updateTask);
app.delete('/api/tasks/:id', deleteTask);

// 上のどれにも当てはまらない/api/以下のURLは、404で知らせる
// （URLの打ち間違いに気づけるように。第8章で説明）
app.use('/api', handleApiNotFound);

// public以下にもない、それ以外のURLへの案内
app.use(handleNotFound);

// 動作確認用に、状態が正常であることを返す
function getHealth(req, res) {
  res.json({ status: 'ok' });
}

// タスクの一覧を返す
async function getTasks(req, res) {
  try {
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました' });
  }
}

// 新しいタスクのオブジェクトを組み立てる。
// データベースを使う第9章で、この作り方をSQLのINSERTに書き換える
function buildTask(title) {
  // 現在の日時を取得し、保存できる形の文字列にする
  const now = new Date();
  const createdAt = now.toISOString();

  const newTask = {
    id: nextTaskId,
    title: title,
    done: false,
    createdAt: createdAt
  };
  nextTaskId = nextTaskId + 1;
  return newTask;
}

// 新しいタスクをtasks配列に追加する
async function createTask(req, res) {
  try {
    // リクエストの形が正しいかを確認する（Content-Typeの付け忘れなど。第8章のつまずき対策）
    if (!req.body) {
      res.status(400).json({ error: 'JSON形式で、Content-Type: application/json を付けて送ってください' });
      return;
    }
    if (typeof req.body.title !== 'string') {
      res.status(400).json({ error: 'タイトルを文字列で送ってください' });
      return;
    }
    const title = req.body.title.trim();
    if (title === '' || title.length > 100) {
      res.status(400).json({ error: 'タイトルは1文字以上100文字以内で入力してください' });
      return;
    }

    const newTask = buildTask(title);
    tasks.push(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました' });
  }
}

// 完了状態を更新する。タイトルの更新は第11章で追加する
async function updateTask(req, res) {
  try {
    if (!req.body) {
      res.status(400).json({ error: 'JSON形式で、Content-Type: application/json を付けて送ってください' });
      return;
    }
    if (typeof req.body.done !== 'boolean') {
      res.status(400).json({ error: '完了状態（done）をtrueかfalseで送ってください' });
      return;
    }
    const taskId = Number(req.params.id);
    let targetTask = null;
    for (const task of tasks) {
      if (task.id === taskId) {
        targetTask = task;
      }
    }
    if (targetTask === null) {
      res.status(404).json({ error: 'タスクが見つかりません' });
      return;
    }
    targetTask.done = req.body.done;
    res.json(targetTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました' });
  }
}

// タスクを削除する
async function deleteTask(req, res) {
  try {
    const taskId = Number(req.params.id);
    let taskExists = false;
    const remainingTasks = [];
    for (const task of tasks) {
      if (task.id === taskId) {
        taskExists = true;
      } else {
        remainingTasks.push(task);
      }
    }
    if (taskExists === false) {
      res.status(404).json({ error: 'タスクが見つかりません' });
      return;
    }
    tasks = remainingTasks;
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました' });
  }
}

// 用意されていない/api/以下のURLが呼ばれたときに返す
function handleApiNotFound(req, res) {
  res.status(404).json({ error: '指定されたAPIが見つかりません' });
}

// ここまでのどれにも当てはまらないURLへの案内
function handleNotFound(req, res) {
  res.status(404).send('お探しのページは見つかりませんでした');
}

// 壊れたJSON（閉じカッコ忘れ、ダブルクォートなしなど）が送られてきたときの対処。
// express.jsonがエラーを投げてくるので、詳しい内容は画面に出さず400で返す
// （完成済みのコードとして提供。第7章で簡単に触れるのみで、深入りしない）
app.use(handleJsonParseError);

function handleJsonParseError(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: '送られてきたJSONの形式が正しくありません' });
    return;
  }
  next(err);
}

// ここまでのどの処理でも対応できなかった、想定外のエラーへの対処。
// 詳しい内容は画面に出さずサーバーのログにだけ出し、500を返す
// （完成済みのコードとして提供。第7章で簡単に触れるのみで、深入りしない）
app.use(handleUnexpectedError);

function handleUnexpectedError(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'サーバーでエラーが発生しました' });
}

module.exports = app;
