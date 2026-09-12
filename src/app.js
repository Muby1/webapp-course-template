// ルーティングをまとめるファイル。
// server.js から分けておくことで、テストからは起動処理を通さずに
// このファイルだけを読み込んで確認できるようにする（第9章で説明）
const express = require('express');

const app = express();

// Renderのヘルスチェックや、動作確認に使うAPI（第7章で説明）
app.get('/health', getHealth);

// 動作確認用に、状態が正常であることを返す
function getHealth(req, res) {
  res.json({ status: 'ok' });
}

// 上のどれにも当てはまらないURLへの案内。
// この時点ではまだpublic以下の画面を配信していないため、
// どのパスを開いてもこの案内が表示される（第7章から配信を始める）
app.use(handleNotFound);

function handleNotFound(req, res) {
  res.status(404).send('このページは第7章から使えるようになります');
}

module.exports = app;
