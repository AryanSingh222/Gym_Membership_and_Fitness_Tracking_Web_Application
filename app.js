(function () {
  const nav = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
})();


function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `form-msg ${type}`;
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}


function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  if (!loginForm) return;

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

function handleLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const pass = document.getElementById('loginPassword')?.value;

  if (!email || !pass) {
    showMsg('loginMsg', '⚠ Please fill in all fields.', 'error');
    return;
  }


  if (email === 'demo@ironpulse.com' && pass === 'demo123') {
    showMsg('loginMsg', '✅ Login successful! Redirecting...', 'success');
    localStorage.setItem('ip_user', JSON.stringify({ name: 'Champion', email, plan: 'pro' }));
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    return;
  }


  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const found = users.find(u => u.email === email && u.password === pass);
  if (found) {
    showMsg('loginMsg', '✅ Login successful! Redirecting...', 'success');
    localStorage.setItem('ip_user', JSON.stringify(found));
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  } else {
    showMsg('loginMsg', '✗ Invalid credentials. Try demo@ironpulse.com / demo123', 'error');
  }
}

function handleSignup() {
  const first = document.getElementById('firstName')?.value.trim();
  const last = document.getElementById('lastName')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim();
  const pass = document.getElementById('signupPassword')?.value;
  const plan = document.getElementById('planSelect')?.value;
  const agree = document.getElementById('agreeTerms')?.checked;

  if (!first || !last || !email || !pass) {
    showMsg('signupMsg', '⚠ Please fill in all required fields.', 'error');
    return;
  }
  if (pass.length < 6) {
    showMsg('signupMsg', '⚠ Password must be at least 6 characters.', 'error');
    return;
  }
  if (!agree) {
    showMsg('signupMsg', '⚠ Please agree to the Terms & Conditions.', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  if (users.find(u => u.email === email)) {
    showMsg('signupMsg', '✗ An account with this email already exists.', 'error');
    return;
  }

  const newUser = { name: `${first} ${last}`, email, password: pass, plan };
  users.push(newUser);
  localStorage.setItem('ip_users', JSON.stringify(users));
  localStorage.setItem('ip_user', JSON.stringify(newUser));

  showMsg('signupMsg', `✅ Account created! Welcome, ${first}! Redirecting...`, 'success');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1400);
}


function initDashboard() {
  const greeting = document.getElementById('dashGreeting');
  const dateEl = document.getElementById('headerDate');

  if (!greeting) return;


  const user = JSON.parse(localStorage.getItem('ip_user') || '{}');
  const name = user.name || 'Champion';
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  greeting.textContent = `${timeGreet}, ${name}! 💪`;


  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }


  const chartEl = document.getElementById('activityChart');
  const labelsEl = document.getElementById('chartLabels');
  if (chartEl) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const vals = [45, 60, 0, 75, 50, 90, 30];
    const max = Math.max(...vals);
    const today = new Date().getDay(); // 0=Sun
    const todayIdx = today === 0 ? 6 : today - 1;

    chartEl.innerHTML = vals.map((v, i) => `
      <div class="bar-wrap">
        <div class="bar ${i === todayIdx ? 'active' : ''}"
          style="height:${v === 0 ? 4 : Math.max(8, (v / max) * 90)}px; background:${v === 0 ? 'var(--border)' : i === todayIdx ? 'var(--accent)' : '#3a3a4a'}"
          data-val="${v ? v + ' min' : 'Rest'}"
        ></div>
      </div>
    `).join('');

    if (labelsEl) {
      labelsEl.innerHTML = days.map(d => `<span>${d}</span>`).join('');
    }
  }


  const wl = document.getElementById('recentWorkouts');
  if (wl) {
    const workouts = getWorkouts().slice(-3).reverse();
    if (workouts.length === 0) {
      const sample = [
        { type: '💪 Strength Training', duration: 60, calories: 420 },
        { type: '🏃 Cardio / Running', duration: 35, calories: 310 },
        { type: '🧘 Yoga / Flexibility', duration: 45, calories: 150 }
      ];
      wl.innerHTML = sample.map(w => `
        <li class="workout-item">
          <span class="workout-item-icon">${w.type.split(' ')[0]}</span>
          <div class="workout-item-info">
            <div class="workout-item-name">${w.type.substring(2)}</div>
            <div class="workout-item-meta">${w.duration} min</div>
          </div>
          <span class="workout-item-cal">${w.calories} kcal</span>
        </li>
      `).join('');
    } else {
      wl.innerHTML = workouts.map(w => `
        <li class="workout-item">
          <span class="workout-item-icon">💪</span>
          <div class="workout-item-info">
            <div class="workout-item-name">${w.type}</div>
            <div class="workout-item-meta">${w.duration} min · ${w.date}</div>
          </div>
          <span class="workout-item-cal">${w.calories} kcal</span>
        </li>
      `).join('');
    }
  }


  const gl = document.getElementById('goalsList');
  if (gl) {
    const goals = [
      { text: 'Work out 5 days this week', done: true },
      { text: 'Burn 2,000 calories', done: true },
      { text: 'Complete 1 cardio session', done: false },
      { text: 'Stretch for 15 min daily', done: false },
    ];
    gl.innerHTML = goals.map(g => `
      <li class="goal-item">
        <div class="goal-check ${g.done ? 'done' : ''}">✓</div>
        <span class="goal-text ${g.done ? 'done' : ''}">${g.text}</span>
      </li>
    `).join('');
  }


  const wks = getWorkouts();
  const streak = document.getElementById('streakCount');
  const total = document.getElementById('workoutsCount');
  const cals = document.getElementById('caloriesCount');
  const goals2 = document.getElementById('goalsCount');

  if (total) total.textContent = 24 + wks.length;
  if (cals) {
    const userCals = wks.reduce((s, w) => s + (parseInt(w.calories) || 0), 0);
    cals.textContent = (12840 + userCals).toLocaleString('en-IN');
  }
}


function toggleBilling() {
  const isAnnual = document.getElementById('billingToggle')?.checked;
  const lblMonthly = document.getElementById('lblMonthly');
  const lblAnnual = document.getElementById('lblAnnual');

  document.querySelectorAll('.plan-amount').forEach(el => {
    const val = isAnnual ? el.dataset.annual : el.dataset.monthly;
    el.textContent = parseInt(val).toLocaleString('en-IN');
  });

  if (lblMonthly) lblMonthly.classList.toggle('toggle-active', !isAnnual);
  if (lblAnnual) {
    const span = lblAnnual.querySelector('.save-badge');
    lblAnnual.childNodes[0].textContent = 'Annual ';
    lblAnnual.classList.toggle('toggle-active', isAnnual);
  }
}

function selectPlan(planId, btn) {
  const toast = document.getElementById('planToast');
  const names = { basic: 'Basic', pro: 'Pro', elite: 'Elite' };
  const isAnnual = document.getElementById('billingToggle')?.checked;


  const user = JSON.parse(localStorage.getItem('ip_user') || '{}');
  user.plan = planId;
  localStorage.setItem('ip_user', JSON.stringify(user));

  if (toast) {
    toast.textContent = `✅ You've selected the ${names[planId]} plan (${isAnnual ? 'Annual' : 'Monthly'}). Redirecting to dashboard...`;
    toast.classList.remove('hidden');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
  }
}


function getWorkouts() {
  return JSON.parse(localStorage.getItem('ip_workouts') || '[]');
}
function saveWorkouts(arr) {
  localStorage.setItem('ip_workouts', JSON.stringify(arr));
}

function logWorkout() {
  const type = document.getElementById('workoutType')?.value;
  const duration = document.getElementById('workoutDuration')?.value;
  const calories = document.getElementById('workoutCalories')?.value;
  const date = document.getElementById('workoutDate')?.value;
  const intensity = document.getElementById('workoutIntensity')?.value;
  const notes = document.getElementById('workoutNotes')?.value;

  if (!type || !duration || !calories || !date) {
    showMsg('trackerMsg', '⚠ Please fill in all required fields.', 'error');
    return;
  }

  const entry = {
    id: Date.now(),
    type, duration: parseInt(duration), calories: parseInt(calories),
    date, intensity, notes
  };

  const workouts = getWorkouts();
  workouts.push(entry);
  saveWorkouts(workouts);

  showMsg('trackerMsg', `✅ Workout logged! +${calories} calories burned. Keep it up! 🔥`, 'success');
  renderWorkoutLog();
  updateTrackerStats();

  document.getElementById('workoutType').value = '';
  document.getElementById('workoutDuration').value = '';
  document.getElementById('workoutCalories').value = '';
  document.getElementById('workoutNotes').value = '';
}

function renderWorkoutLog() {
  const container = document.getElementById('workoutLog');
  if (!container) return;
  const workouts = getWorkouts().reverse();

  if (workouts.length === 0) {
    container.innerHTML = '<p class="empty-state">No workouts logged yet. Add your first one! 💪</p>';
    return;
  }

  container.innerHTML = workouts.map(w => `
    <div class="log-entry" id="entry-${w.id}">
      <span class="log-entry-icon">${getIcon(w.type)}</span>
      <div class="log-entry-info">
        <div class="log-entry-type">${w.type.replace(/^[^\s]+ /, '')}</div>
        <div class="log-entry-meta">
          ${w.date} · ${w.duration} min · ${w.calories} kcal
          ${w.notes ? `· <em>${w.notes}</em>` : ''}
        </div>
      </div>
      <span class="intensity-badge intensity-${w.intensity}">${w.intensity}</span>
      <button class="log-entry-delete" onclick="deleteWorkout(${w.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

function getIcon(type) {
  const map = { 'Strength': '💪', 'Cardio': '🏃', 'Yoga': '🧘', 'Cycling': '🚴', 'Boxing': '🥊', 'Swimming': '🏊', 'CrossFit': '🏋️' };
  for (const [k, v] of Object.entries(map)) {
    if (type.includes(k)) return v;
  }
  return '⚡';
}

function deleteWorkout(id) {
  const workouts = getWorkouts().filter(w => w.id !== id);
  saveWorkouts(workouts);
  renderWorkoutLog();
  updateTrackerStats();
}

function clearWorkouts() {
  if (confirm('Clear all workout history? This cannot be undone.')) {
    saveWorkouts([]);
    renderWorkoutLog();
    updateTrackerStats();
  }
}

function updateTrackerStats() {
  const workouts = getWorkouts();
  const now = new Date();
  const month = now.getMonth(); const year = now.getFullYear();

  const monthly = workouts.filter(w => {
    const d = new Date(w.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const el = (id) => document.getElementById(id);
  if (el('totalWorkouts')) el('totalWorkouts').textContent = monthly.length;
  if (el('totalMinutes')) el('totalMinutes').textContent = monthly.reduce((s, w) => s + w.duration, 0);
  if (el('totalCalories')) el('totalCalories').textContent = monthly.reduce((s, w) => s + w.calories, 0);


  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const thisWeek = workouts.filter(w => new Date(w.date) >= weekStart);
  const goal = parseInt(localStorage.getItem('ip_goal') || '5');
  const pct = Math.min(100, (thisWeek.length / goal) * 100);

  if (el('goalBar')) el('goalBar').style.width = pct + '%';
  if (el('goalProgress')) el('goalProgress').textContent = `${thisWeek.length} / ${goal} completed`;
}

function updateGoalTarget(val) {
  localStorage.setItem('ip_goal', val);
  const label = document.getElementById('sliderLabel');
  const target = document.getElementById('weeklyTarget');
  if (label) label.textContent = `${val} days`;
  if (target) target.textContent = `${val} workouts`;
  updateTrackerStats();
}


function setDateDefault() {
  const d = document.getElementById('workoutDate');
  if (d) {
    const today = new Date().toISOString().split('T')[0];
    d.value = today;
    d.max = today;
  }
}


function initGoalSlider() {
  const slider = document.getElementById('goalSlider');
  if (!slider) return;
  const saved = parseInt(localStorage.getItem('ip_goal') || '5');
  slider.value = saved;
  updateGoalTarget(saved);
}


document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html' || page === '') {
    initDashboard();
  }
  if (page === 'tracker.html') {
    setDateDefault();
    renderWorkoutLog();
    updateTrackerStats();
    initGoalSlider();
  }
});