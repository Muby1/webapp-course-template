// 画面の動きを担当するファイル（第6章で説明）。
// 第8章から、ダミーの配列ではなくバックエンドのAPIと通信するように書き換える

const taskTitleInput = document.getElementById('taskTitleInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskListElement = document.getElementById('taskList');
const errorMessageElement = document.getElementById('errorMessage');

// APIから取得したタスクの一覧を入れておく
let taskList = [];

// バックエンドからタスクの一覧を取得し、画面に表示する（第8章で説明）。
// 一覧取得に失敗した場合は、画面が真っ白にならないようエラーメッセージを表示する
// （完成済みのコードとして提供。手順書8-2では読解として扱う）
async function loadTasks() {
  const response = await fetch('/api/tasks');
  const hasError = await displayErrorIfAny(response);
  if (hasError) {
    return;
  }
  const data = await response.json();
  taskList = data;
  renderTaskList();
}

// タスク一覧の表示を、taskList配列の内容に合わせて作り直す
function renderTaskList() {
  taskListElement.textContent = '';
  for (const task of taskList) {
    const taskElement = createTaskElement(task);
    taskListElement.appendChild(taskElement);
  }
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

// レスポンスがエラーだった場合に、画面にエラーメッセージを表示する。
// 成功していれば、前に表示されていたメッセージを消す。
// エラーがあったかどうかをtrue/falseで返す（第8章で説明）
async function displayErrorIfAny(response) {
  if (response.ok === false) {
    const data = await response.json();
    errorMessageElement.textContent = data.error;
    return true;
  }
  errorMessageElement.textContent = '';
  return false;
}

// 入力欄の内容をバックエンドに送り、新しいタスクを追加する
async function handleAddClick() {
  // Content-Typeヘッダーで「JSON形式で送る」と伝え、
  // JSON.stringifyでオブジェクトを送信できる文字列に変換する（第8章で説明）
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskTitleInput.value })
  });
  const hasError = await displayErrorIfAny(response);
  if (hasError) {
    return;
  }

  taskTitleInput.value = '';
  await loadTasks();
}

// チェックボックスがクリックされたタスクの完了状態を、バックエンドに送って更新する
async function handleToggleClick(event) {
  const taskId = Number(event.target.dataset.taskId);
  const newDone = event.target.checked;
  const response = await fetch('/api/tasks/' + taskId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: newDone })
  });
  const hasError = await displayErrorIfAny(response);
  if (hasError) {
    return;
  }
  await loadTasks();
}

// 削除ボタンが押されたタスクを、バックエンドに送って削除する
async function handleDeleteClick(event) {
  const taskId = Number(event.target.dataset.taskId);
  const response = await fetch('/api/tasks/' + taskId, { method: 'DELETE' });
  const hasError = await displayErrorIfAny(response);
  if (hasError) {
    return;
  }
  await loadTasks();
}

addTaskButton.addEventListener('click', handleAddClick);
loadTasks();
