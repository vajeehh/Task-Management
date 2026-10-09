// script.js - Frontend logic using Fetch API and JWT in localStorage

// Base API path
const API_BASE = 'http://localhost:5006/api';
const TOKEN_KEY = 'jwt_token';


// =========================================================
// AUTH HEADERS
// =========================================================

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}


// =========================================================
// UI HELPERS
// =========================================================

function showSection(sectionId) {
  document.querySelectorAll('section').forEach(section => {
    section.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);

  if (target) {
    target.classList.remove('hidden');
  }
}


function showMessage(elem, msg, isError = false) {
  if (!elem) return;

  elem.textContent = msg;

  elem.className = isError
    ? 'message error'
    : 'message success';

  elem.classList.remove('hidden');

  setTimeout(() => {
    elem.classList.add('hidden');
  }, 4000);
}


// =========================================================
// SAFE RESPONSE JSON
// =========================================================

async function getResponseData(response) {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Invalid JSON response:', text);
    return {};
  }
}


// =========================================================
// AUTH UI
// =========================================================

const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const authMessageEl = document.getElementById('auth-message');


// Login tab

loginTab.addEventListener('click', () => {

  loginTab.classList.add('active');
  signupTab.classList.remove('active');

  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');

  authMessageEl.classList.add('hidden');
});


// Signup tab

signupTab.addEventListener('click', () => {

  signupTab.classList.add('active');
  loginTab.classList.remove('active');

  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');

  authMessageEl.classList.add('hidden');
});


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener('submit', async event => {

  event.preventDefault();

  const email =
    document.getElementById('login-email').value.trim();

  const password =
    document.getElementById('login-password').value.trim();


  try {

    const response = await fetch(
      `${API_BASE}/auth/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          email,
          password
        })
      }
    );


    const data = await getResponseData(response);


    if (!response.ok) {

      showMessage(
        authMessageEl,
        data.message || 'Login failed',
        true
      );

      return;
    }


    // Make sure token exists

    if (!data.token) {

      console.error('Login response:', data);

      showMessage(
        authMessageEl,
        'Login failed: authentication token not received.',
        true
      );

      return;
    }


    // Save JWT

    localStorage.setItem(
      TOKEN_KEY,
      data.token
    );


    // Get email from token

    let userEmail = email;

    try {

      const payload =
        JSON.parse(
          atob(data.token.split('.')[1])
        );

      if (payload.email) {
        userEmail = payload.email;
      }

    } catch (error) {

      console.warn(
        'Could not decode token email.'
      );
    }


    initDashboard(userEmail);

  } catch (error) {

    console.error(
      'Login error:',
      error
    );

    showMessage(
      authMessageEl,
      'Network error. Please try again.',
      true
    );
  }

});


// =========================================================
// SIGNUP
// =========================================================

signupForm.addEventListener('submit', async event => {

  event.preventDefault();

  const email =
    document.getElementById('signup-email').value.trim();

  const password =
    document.getElementById('signup-password').value.trim();


  try {

    const response = await fetch(
      `${API_BASE}/auth/signup`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          email,
          password
        })
      }
    );


    // IMPORTANT:
    // Read response safely instead of directly using response.json()

    const data =
      await getResponseData(response);


    if (!response.ok) {

      showMessage(
        authMessageEl,
        data.message || 'Signup failed',
        true
      );

      return;
    }


    // Signup successful

    showMessage(
      authMessageEl,
      data.message ||
      'Account created successfully. Please login.'
    );


    signupForm.reset();


    // Switch to login after 2 seconds

    setTimeout(() => {

      loginTab.click();

    }, 2000);


  } catch (error) {

    console.error(
      'Signup error:',
      error
    );

    showMessage(
      authMessageEl,
      'Network error. Please try again.',
      true
    );
  }

});


// =========================================================
// DASHBOARD ELEMENTS
// =========================================================

const logoutBtn =
  document.getElementById('logout-btn');

const userEmailEl =
  document.getElementById('user-email');

const taskListEl =
  document.getElementById('task-list');

const addTaskBtn =
  document.getElementById('add-task-btn');

const filterBtns =
  document.querySelectorAll('.filter-btn');

const totalCountEl =
  document.getElementById('total-count');

const pendingCountEl =
  document.getElementById('pending-count');

const completedCountEl =
  document.getElementById('completed-count');


// =========================================================
// MODAL ELEMENTS
// =========================================================

const taskModal =
  document.getElementById('task-modal');

const modalTitle =
  document.getElementById('modal-title');

const modalTaskTitle =
  document.getElementById('modal-task-title');

const modalTaskDesc =
  document.getElementById('modal-task-desc');

const modalSaveBtn =
  document.getElementById('modal-save');

const modalCancelBtn =
  document.getElementById('modal-cancel');


let currentFilter = 'all';

let editingTaskId = null;

let currentUserEmail = '';


// =========================================================
// LOGOUT
// =========================================================

if (logoutBtn) {

  logoutBtn.addEventListener('click', () => {

    localStorage.removeItem(TOKEN_KEY);

    currentUserEmail = '';

    if (userEmailEl) {
      userEmailEl.textContent = '';
    }

    if (taskListEl) {
      taskListEl.innerHTML = '';
    }

    showSection('auth-section');

  });

}


// =========================================================
// FILTER BUTTONS
// =========================================================

filterBtns.forEach(button => {

  button.addEventListener('click', () => {

    filterBtns.forEach(btn => {
      btn.classList.remove('active');
    });

    button.classList.add('active');

    currentFilter =
      button.dataset.filter;

    loadTasks();

  });

});


// =========================================================
// ADD TASK
// =========================================================

if (addTaskBtn) {

  addTaskBtn.addEventListener('click', () => {

    editingTaskId = null;

    modalTitle.textContent =
      'Add Task';

    modalTaskTitle.value = '';

    modalTaskDesc.value = '';

    taskModal.classList.remove('hidden');

  });

}


// =========================================================
// CANCEL MODAL
// =========================================================

if (modalCancelBtn) {

  modalCancelBtn.addEventListener('click', () => {

    taskModal.classList.add('hidden');

  });

}


// =========================================================
// SAVE TASK
// =========================================================

if (modalSaveBtn) {

  modalSaveBtn.addEventListener(
    'click',
    async () => {

      const title =
        modalTaskTitle.value.trim();

      const description =
        modalTaskDesc.value.trim();


      if (!title) {

        showMessage(
          authMessageEl,
          'Title is required',
          true
        );

        return;
      }


      try {

        let response;


        // EDIT EXISTING TASK

        if (editingTaskId) {

          response = await fetch(
            `${API_BASE}/tasks/${editingTaskId}`,
            {
              method: 'PUT',

              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },

              body: JSON.stringify({
                title,
                description
              })
            }
          );

        }


        // CREATE NEW TASK

        else {

          response = await fetch(
            `${API_BASE}/tasks`,
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },

              body: JSON.stringify({
                title,
                description
              })
            }
          );

        }


        if (!response.ok) {

          const data =
            await getResponseData(response);

          throw new Error(
            data.message ||
            'Task operation failed'
          );
        }


        taskModal.classList.add('hidden');

        loadTasks();


      } catch (error) {

        console.error(
          'Task save error:',
          error
        );

        showMessage(
          authMessageEl,
          editingTaskId
            ? 'Task update failed'
            : 'Task creation failed',
          true
        );

      }

    }
  );

}


// =========================================================
// RENDER TASKS
// =========================================================

function renderTasks(tasks) {

  taskListEl.innerHTML = '';


  // No tasks

  if (!tasks.length) {

    taskListEl.innerHTML =
      '<li class="task-item">No tasks found</li>';

    return;
  }


  tasks.forEach(task => {

    const li =
      document.createElement('li');


    li.className =
      `task-item ${task.completed ? 'completed' : ''
      }`;


    li.dataset.id =
      task._id;


    li.innerHTML = `
      <div class="task-content">
        <div class="task-title">
          ${task.title}
        </div>

        ${task.description
        ? `<div class="task-description">
                 ${task.description}
               </div>`
        : ''
      }
      </div>

      <div class="task-actions">

        <button class="toggle">
          ${task.completed ? 'Undo' : 'Done'}
        </button>

        <button class="edit">
          Edit
        </button>

        <button class="delete">
          Delete
        </button>

      </div>
    `;


    // =====================================================
    // TOGGLE COMPLETE
    // =====================================================

    li.querySelector('.toggle')
      .addEventListener(
        'click',
        async () => {

          try {

            const response =
              await fetch(
                `${API_BASE}/tasks/${task._id}/toggle`,
                {
                  method: 'PATCH',

                  headers:
                    getAuthHeaders()
                }
              );


            if (!response.ok) {

              throw new Error(
                'Could not update task'
              );
            }


            loadTasks();


          } catch (error) {

            console.error(
              'Toggle error:',
              error
            );

          }

        }
      );


    // =====================================================
    // DELETE
    // =====================================================

    li.querySelector('.delete')
      .addEventListener(
        'click',
        async () => {

          if (
            !confirm(
              'Delete this task?'
            )
          ) {
            return;
          }


          try {

            const response =
              await fetch(
                `${API_BASE}/tasks/${task._id}`,
                {
                  method: 'DELETE',

                  headers:
                    getAuthHeaders()
                }
              );


            if (!response.ok) {

              throw new Error(
                'Could not delete task'
              );
            }


            loadTasks();


          } catch (error) {

            console.error(
              'Delete error:',
              error
            );

          }

        }
      );


    // =====================================================
    // EDIT
    // =====================================================

    li.querySelector('.edit')
      .addEventListener(
        'click',
        () => {

          editingTaskId =
            task._id;

          modalTitle.textContent =
            'Edit Task';

          modalTaskTitle.value =
            task.title;

          modalTaskDesc.value =
            task.description || '';

          taskModal.classList.remove(
            'hidden'
          );

        }
      );


    taskListEl.appendChild(li);

  });

}


// =========================================================
// UPDATE STATS
// =========================================================

function updateStats(tasks) {

  const total =
    tasks.length;

  const pending =
    tasks.filter(
      task => !task.completed
    ).length;

  const completed =
    tasks.filter(
      task => task.completed
    ).length;


  totalCountEl.textContent =
    total;

  pendingCountEl.textContent =
    pending;

  completedCountEl.textContent =
    completed;

}


// =========================================================
// LOAD TASKS
// =========================================================

async function loadTasks() {

  try {

    const response =
      await fetch(
        `${API_BASE}/tasks?filter=${currentFilter}`,
        {
          headers:
            getAuthHeaders()
        }
      );


    // Token invalid

    if (response.status === 401) {

      localStorage.removeItem(
        TOKEN_KEY
      );

      currentUserEmail = '';

      showSection(
        'auth-section'
      );

      return;
    }


    if (!response.ok) {

      throw new Error(
        'Could not load tasks'
      );
    }


    const tasks =
      await getResponseData(
        response
      );


    if (!Array.isArray(tasks)) {

      console.error(
        'Unexpected tasks response:',
        tasks
      );

      renderTasks([]);

      updateStats([]);

      return;
    }


    renderTasks(tasks);

    updateStats(tasks);


  } catch (error) {

    console.error(
      'Load tasks error:',
      error
    );

    showMessage(
      authMessageEl,
      'Could not load tasks',
      true
    );

  }

}


// =========================================================
// INITIALIZE DASHBOARD
// =========================================================

function initDashboard(userEmail = '') {

  const token =
    localStorage.getItem(
      TOKEN_KEY
    );


  if (!token) {

    showSection(
      'auth-section'
    );

    return;
  }


  // Get email from JWT if not supplied

  if (!userEmail) {

    try {

      const payload =
        JSON.parse(
          atob(
            token.split('.')[1]
          )
        );

      userEmail =
        payload.email || '';

    } catch (error) {

      console.warn(
        'Could not read user email from token.'
      );

    }

  }


  currentUserEmail =
    userEmail;


  if (userEmailEl) {

    userEmailEl.textContent =
      currentUserEmail;

  }


  showSection(
    'dashboard-section'
  );


  loadTasks();

}


// =========================================================
// INITIAL PAGE LOAD
// =========================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    const token =
      localStorage.getItem(
        TOKEN_KEY
      );


    if (token) {

      initDashboard();

    } else {

      showSection(
        'auth-section'
      );

    }

  }
);