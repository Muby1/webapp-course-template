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

// 入力欄の内容を新しいタスクとしてtaskList配列に追加する
function handleAddClick() {
  const title = taskTitleInput.value.trim();
  if (title === '') {
    return;
  }
  const newTask = { id: nextTaskId, title: title, done: false };
  taskList.push(newTask);
  nextTaskId = nextTaskId + 1;
  taskTitleInput.value = '';
  renderTaskList();
}

// チェックボックスがクリックされたタスクの完了状態を反転させる
function handleToggleClick(event) {
  const taskId = Number(event.target.dataset.taskId);
  for (const task of taskList) {
    if (task.id === taskId) {
      task.done = !task.done;
    }
  }
  renderTaskList();
}

// 削除ボタンが押されたタスクをtaskList配列から取り除く
function handleDeleteClick(event) {
  const taskId = Number(event.target.dataset.taskId);
  const remainingTasks = [];
  for (const task of taskList) {
    if (task.id !== taskId) {
      remainingTasks.push(task);
    }
  }
  taskList = remainingTasks;
  renderTaskList();
}

addTaskButton.addEventListener('click', handleAddClick);
renderTaskList();
