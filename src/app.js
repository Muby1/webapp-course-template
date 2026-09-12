// APIのルーティングをまとめるファイル。
// server.js から分けておくことで、テストからは起動処理を通さずに
// このファイルだけを読み込んで確認できるようにする（第9章で説明）
const express = require('express');
const db = require('./db');

const app = express();

// リクエストの本文（JSON）を読み取れるようにする（第7章で説明）
app.use(express.json());

// public以下の画面ファイルを配信する（第7章で説明）
app.use(express.static('public'));

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

// db.jsで起きたエラーに応じたレスポンスを返す。
// db.js側でエラーにstatusを付けて投げている場合は、そのstatusとメッセージを
// そのまま使う。付いていなければ、想定外のエラーとして500を返す
function respondToError(res, error) {
  if (typeof error.status === 'number') {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'サーバーでエラーが発生しました' });
}

// タスクの一覧を返す
async function getTasks(req, res) {
  try {
    const taskList = await db.getAllTasks();
    res.json(taskList);
  } catch (error) {
    respondToError(res, error);
  }
}

// 新しいタスクを追加する
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

    const newTask = await db.insertTask(title);
    res.status(201).json(newTask);
  } catch (error) {
    respondToError(res, error);
  }
}

// 完了状態・タイトルを更新する。doneとtitleは片方だけ送ってもよく、
// 送らなかった方は変更しない（第11章で追加）
async function updateTask(req, res) {
  try {
    if (!req.body) {
      res.status(400).json({ error: 'JSON形式で、Content-Type: application/json を付けて送ってください' });
      return;
    }

    const doneIsSent = typeof req.body.done === 'boolean';
    const titleIsSent = typeof req.body.title === 'string';
    if (doneIsSent === false && titleIsSent === false) {
      res.status(400).json({ error: '完了状態（done）かタイトル（title）のどちらかを送ってください' });
      return;
    }

    const updates = {};
    if (doneIsSent) {
      updates.done = req.body.done;
    }
    if (titleIsSent) {
      const title = req.body.title.trim();
      if (title === '' || title.length > 100) {
        res.status(400).json({ error: 'タイトルは1文字以上100文字以内で入力してください' });
        return;
      }
      updates.title = title;
    }

    const taskId = Number(req.params.id);
    const updatedTask = await db.updateTask(taskId, updates);
    if (updatedTask === null) {
      res.status(404).json({ error: 'タスクが見つかりません' });
      return;
    }
    res.json(updatedTask);
  } catch (error) {
    respondToError(res, error);
  }
}

// タスクを削除する
async function deleteTask(req, res) {
  try {
    const taskId = Number(req.params.id);
    const wasDeleted = await db.deleteTaskById(taskId);
    if (wasDeleted === false) {
      res.status(404).json({ error: 'タスクが見つかりません' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    respondToError(res, error);
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
