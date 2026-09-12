// 画面の動きを担当するファイル（第6章で説明）
// タスクの配列はまだこのファイルの中だけにあり、ページを再読み込みすると元に戻る

const taskTitleInput = document.getElementById('taskTitleInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskListElement = document.getElementById('taskList');

// あとで一覧表示・追加・完了切り替え・削除を試すためのダミーのタスク一覧
let taskList = [
  { id: 1, title: '牛乳を買う', done: false },
  { id: 2, title: '掃除をする', done: true }
];
let nextTaskId = 3;

// タスク一覧の表示を、taskList配列の内容に合わせて作り直す
function renderTaskList() {
  // TODO(ch06-1): 手順書 6-4 を参考に、taskList配列の中身をひとつずつ画面に表示しましょう
  taskListElement.textContent = 'ここは手順書 6-4 で実装します（TODO ch06-1）';
}

// 1件分のタスクの行（チェックボックス・タイトル・削除ボタン）を作る
function createTaskElement(task) {
  const listItem = document.createElement('li');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.dataset.taskId = String(task.id);
  checkbox.addEventListener('click', handleToggleClick);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = task.title;
  titleSpan.className = 'task-title';
  if (task.done) {
    titleSpan.classList.add('done');
  }

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = '削除';
  deleteButton.dataset.taskId = String(task.id);
  deleteButton.addEventListener('click', handleDeleteClick);

  listItem.appendChild(checkbox);
  listItem.appendChild(titleSpan);
  listItem.appendChild(deleteButton);

  return listItem;
}

// 入力欄の内容を新しいタスクとしてtaskList配列に追加する
function handleAddClick() {
  // TODO(ch06-2): 手順書 6-5 を参考に、入力欄の値を新しいタスクとしてtaskList配列に追加しましょう
  taskListElement.textContent = 'ここは手順書 6-5 で実装します（TODO ch06-2）';
}

// チェックボックスがクリックされたタスクの完了状態を反転させる
function handleToggleClick(event) {
  // TODO(ch06-3): 手順書 6-6 を参考に、クリックされたタスクのdoneを反転させましょう
  taskListElement.textContent = 'ここは手順書 6-6 で実装します（TODO ch06-3）';
}

// 削除ボタンが押されたタスクをtaskList配列から取り除く
function handleDeleteClick(event) {
  // TODO(ch06-4): 手順書 6-7 を参考に、押されたタスクをtaskList配列から取り除きましょう
  taskListElement.textContent = 'ここは手順書 6-7 で実装します（TODO ch06-4）';
}

addTaskButton.addEventListener('click', handleAddClick);
renderTaskList();
