const taskForm = document.querySelector('.task-form')
const taskInput = document.querySelector('.task-input')
const taskItemsList = document.querySelector('.task-items')
const checkedTaskItemsList = document.querySelector('.checked-task-items')
let tasks = []
taskForm.addEventListener('submit', function (event) {
  event.preventDefault()
  addTask(taskInput.value) 
})
function addTask(item) {
  if (item.trim() !== '') {
    const task = {
      id: Date.now(),
      name: item,
      completed: false,
    }
    tasks.push(task)
    addToLocalStorage(tasks)
    taskInput.value = ''
  }
}
function renderTasks(tasks) {
  taskItemsList.innerHTML = ''
  checkedTaskItemsList.innerHTML = ''
  if (tasks.length===0) {
    taskItemsList.innerHTML = '<p class="gray">No tasks</p>'
    checkedTaskItemsList.innerHTML = '<p class="gray">No completed tasks</p>'
    return
  }
  if (tasks.filter(t => t.completed).length === 0) {
    checkedTaskItemsList.innerHTML = '<p class="gray">No completed tasks</p>'
  }
  tasks.forEach(function (item) {
    const checked = item.completed ? 'checked' : null
    const li = document.createElement('li')
    li.setAttribute('class', 'item')
    li.setAttribute('data-key', item.id)
    if (item.completed === true) {
      li.classList.add('checked')
    }
    li.innerHTML = `
      <input type="checkbox" class="checkbox" ${checked}>
      ${item.name}
      <button class="delete-button">X</button>
    `
    if (checked) {
      checkedTaskItemsList.append(li)
    } else {
      taskItemsList.append(li)
    }
  })
}
function addToLocalStorage(tasks) {
  localStorage.setItem('tasks:tasks', JSON.stringify(tasks))
  renderTasks(tasks)
}
function getFromLocalStorage() {
  const reference = localStorage.getItem('tasks:tasks')
  if (reference) {
    tasks = JSON.parse(reference)
    renderTasks(tasks)
  }
}
function toggle(id) {
  tasks.forEach(function (item) {
    // we have to use double equals cuz types are difeerent
    if (item.id == id) {
      item.completed = !item.completed
    }
  })
  addToLocalStorage(tasks)
}
function deleteTask(id) {
  tasks = tasks.filter(function (item) {
    return item.id != id
  })
  addToLocalStorage(tasks)
}
getFromLocalStorage()
function taskItemsListClick(event) {
  if (event.target.type === 'checkbox') {
    toggle(event.target.parentElement.getAttribute('data-key'))
  }
  if (event.target.classList.contains('delete-button')) {
    deleteTask(event.target.parentElement.getAttribute('data-key'))
  }
}
taskItemsList.addEventListener('click', taskItemsListClick)
checkedTaskItemsList.addEventListener('click', taskItemsListClick)

function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}
