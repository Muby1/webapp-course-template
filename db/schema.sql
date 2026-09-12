-- タスクを保存するテーブル（第9章で説明）
-- IF NOT EXISTS を付けて、何度実行しても安全（すでにあれば何もしない）にする
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY, -- SERIALなので、idは1, 2, 3...とDBが自動で割り振る（第7章のように自分で数える必要がない）
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
