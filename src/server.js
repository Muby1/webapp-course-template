// サーバーの起動だけを行うファイル。
// ルーティングの中身は app.js にまとめてある（第9章で説明）
const app = require('./app');

// 環境変数にPORTがあればそれを使い、なければ3000を使う。
// Renderは自動でPORTを設定するため、本番ではこの環境変数側の値が使われる
const port = process.env.PORT || 3000;

startServer();

function startServer() {
  app.listen(port, handleListening);
}

function handleListening() {
  console.log('サーバーを起動しました：http://localhost:' + port);
}
