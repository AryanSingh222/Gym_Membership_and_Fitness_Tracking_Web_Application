const Session = (() => {
  const KEY = 'ip_session';

  return {
    save(data)   { localStorage.setItem(KEY, JSON.stringify(data)); },
    load()       { try { return JSON.parse(localStorage.getItem(KEY)) ?? null; } catch { return null; } },
    clear()      { localStorage.removeItem(KEY); },
    isLoggedIn() { return this.load() !== null; },
    getUser()    { return this.load()?.user         ?? null; },
    getToken()   { return this.load()?.accessToken  ?? null; },
    getRefresh() { return this.load()?.refreshToken ?? null; },
    updateUser(patch) {
      const s = this.load();
      if (!s) return;
      s.user = { ...s.user, ...patch };
      this.save(s);
    },
  };
})();


const Auth = (() => {
  const PROTECTED  = ['dashboard.html', 'tracker.html', 'membership.html'];
  const GUEST_ONLY = ['login.html'];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function init() {
    const page     = currentPage();
    const loggedIn = Session.isLoggedIn();

    // ── Route guards ─────────────────────────────────────────
    if (PROTECTED.includes(page) && !loggedIn) {
      sessionStorage.setItem('ip_redirect', page);   // remember destination
      window.location.replace('login.html');
      return false;
    }
    if (GUEST_ONLY.includes(page) && loggedIn) {
      window.location.replace('dashboard.html');
      return false;
    }

    buildNavbar(loggedIn);
    return true;
  }

  function buildNavbar(loggedIn) {
    const ul = document.getElementById('navLinks');
    if (!ul) return;

    const page = currentPage();
    const user = Session.getUser();
    const name = user?.firstName || user?.name?.split(' ')[0] || 'You';

    const active = (p) => page === p ? 'class="active"' : '';

    if (loggedIn) {
      ul.innerHTML = `
        <li><a href="index.html"      ${active('index.html')}>Home</a></li>
        <li><a href="dashboard.html"  ${active('dashboard.html')}>Dashboard</a></li>
        <li><a href="membership.html" ${active('membership.html')}>Membership</a></li>
        <li><a href="tracker.html"    ${active('tracker.html')}>Tracker</a></li>
        <li><span class="nav-user">👤 ${name}</span></li>
        <li><a href="#" class="btn-nav" id="logoutBtn">Logout</a></li>
      `;
      document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    } else {
      ul.innerHTML = `
        <li><a href="index.html"      ${active('index.html')}>Home</a></li>
        <li><a href="membership.html" ${active('membership.html')}>Membership</a></li>
        <li><a href="login.html" class="btn-nav ${page === 'login.html' ? 'active' : ''}">Login</a></li>
      `;
    }

    ul.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => ul.classList.remove('open'))
    );
  }

  function logout() {
    Session.clear();
    window.location.replace('login.html');
  }

  return { init, logout };
})();

(function () {
  const nav       = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (nav) {
    window.addEventListener('scroll', () =>
      nav.classList.toggle('scrolled', window.scrollY > 20)
    );
  }
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () =>
      navLinks.classList.toggle('open')
    );
  }
})();

function showMsg(id, text, type) {
  const e = document.getElementById(id);
  if (!e) return;
  e.textContent = text;
  e.className   = `form-msg ${type}`;
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type      = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

const el = (id) => document.getElementById(id);

function switchTab(tab) {
  const isLogin = tab === 'login';
  el('loginForm') ?.classList.toggle('hidden', !isLogin);
  el('signupForm')?.classList.toggle('hidden',  isLogin);
  el('tabLogin')  ?.classList.toggle('active',  isLogin);
  el('tabSignup') ?.classList.toggle('active', !isLogin);
}

function handleLogin() {
  const email = el('loginEmail')?.value.trim();
  const pass  = el('loginPassword')?.value;

  if (!email || !pass) {
    showMsg('loginMsg', '⚠ Please fill in all fields.', 'error');
    return;
  }

  // Demo account
  if (email === 'demo@ironpulse.com' && pass === 'demo123') {
    _onLoginSuccess({
      user: { id: 'demo-001', firstName: 'Champion', lastName: 'Demo',
              name: 'Champion Demo', email, plan: 'pro', role: 'member' },
      accessToken:  'demo-access-token',
      refreshToken: 'demo-refresh-token',
    }, 'loginMsg');
    return;
  }

  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const found = users.find(u => u.email === email && u.password === pass);

  if (found) {
    const { password, ...safeUser } = found;
    _onLoginSuccess({
      user: safeUser,
      accessToken:  'local-' + Date.now(),
      refreshToken: 'local-refresh-' + Date.now(),
    }, 'loginMsg');
  } else {
    showMsg('loginMsg', '✗ Invalid credentials. Try demo@ironpulse.com / demo123', 'error');
  }
}

function handleSignup() {
  const first = el('firstName')?.value.trim();
  const last  = el('lastName')?.value.trim();
  const email = el('signupEmail')?.value.trim().toLowerCase();
  const pass  = el('signupPassword')?.value;
  const plan  = el('planSelect')?.value || 'basic';
  const agree = el('agreeTerms')?.checked;

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

  const newUser = {
    id: 'u-' + Date.now(),
    firstName: first, lastName: last, name: `${first} ${last}`,
    email, password: pass, plan, role: 'member',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem('ip_users', JSON.stringify(users));

  showMsg('signupMsg', `✅ Welcome, ${first}! Setting up your account...`, 'success');

  const { password, ...safeUser } = newUser;
  setTimeout(() => _onLoginSuccess({
    user: safeUser,
    accessToken:  'local-' + Date.now(),
    refreshToken: 'local-refresh-' + Date.now(),
  }, 'signupMsg'), 800);
}

function _onLoginSuccess(sessionData, msgId) {
  Session.save(sessionData);
  showMsg(msgId, '✅ Login successful! Redirecting...', 'success');

  const intended = sessionStorage.getItem('ip_redirect') || 'dashboard.html';
  sessionStorage.removeItem('ip_redirect');
  setTimeout(() => window.location.replace(intended), 900);
}


function initDashboard() {
  if (!el('dashGreeting')) return;

  const user  = Session.getUser();
  const name  = user?.firstName || user?.name?.split(' ')[0] || 'Champion';
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  el('dashGreeting').textContent = `${greet}, ${name}! 💪`;

  if (el('headerDate')) {
    el('headerDate').textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  const chartEl  = el('activityChart');
  const labelsEl = el('chartLabels');
  if (chartEl) {
    const days      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const wks       = getWorkouts();
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const vals = days.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return wks.filter(w => w.date === key).reduce((s, w) => s + (w.duration || 0), 0);
    });

    const display  = vals.every(v => v === 0) ? [45, 60, 0, 75, 50, 90, 30] : vals;
    const max      = Math.max(...display, 1);
    const todayIdx = (now.getDay() + 6) % 7;

    chartEl.innerHTML = display.map((v, i) => `
      <div class="bar-wrap">
        <div class="bar"
          style="height:${v === 0 ? 4 : Math.max(8, (v / max) * 90)}px;
                 background:${v === 0 ? 'var(--border)' : i === todayIdx ? 'var(--accent)' : '#3a3a4a'}"
          data-val="${v ? v + ' min' : 'Rest'}"></div>
      </div>`).join('');

    if (labelsEl) labelsEl.innerHTML = days.map(d => `<span>${d}</span>`).join('');
  }

  const wl = el('recentWorkouts');
  if (wl) {
    const recent = getWorkouts().slice(-3).reverse();
    const sample = [
      { type: '💪 Strength Training', duration: 60, calories: 420 },
      { type: '🏃 Cardio / Running',   duration: 35, calories: 310 },
      { type: '🧘 Yoga / Flexibility', duration: 45, calories: 150 },
    ];
    wl.innerHTML = (recent.length ? recent : sample).map(w => `
      <li class="workout-item">
        <span class="workout-item-icon">${getIcon(w.type)}</span>
        <div class="workout-item-info">
          <div class="workout-item-name">${w.type.replace(/^[^\s]+\s/, '')}</div>
          <div class="workout-item-meta">${w.duration} min${w.date ? ' · ' + w.date : ''}</div>
        </div>
        <span class="workout-item-cal">${w.calories} kcal</span>
      </li>`).join('');
  }

  const gl = el('goalsList');
  if (gl) {
    const wks       = getWorkouts();
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = wks.filter(w => new Date(w.date) >= weekStart).length;
    const totalCal  = wks.reduce((s, w) => s + (w.calories || 0), 0);
    const hasCardio = wks.some(w => /Cardio|Running/i.test(w.type));

    [
      { text: 'Work out 5 days this week', done: thisWeek >= 5 },
      { text: 'Burn 2,000 calories',       done: totalCal >= 2000 },
      { text: 'Complete 1 cardio session', done: hasCardio },
      { text: 'Stretch for 15 min daily',  done: false },
    ].forEach(g => {
      gl.innerHTML += `
        <li class="goal-item">
          <div class="goal-check ${g.done ? 'done' : ''}">✓</div>
          <span class="goal-text ${g.done ? 'done' : ''}">${g.text}</span>
        </li>`;
    });
  }

  const wks     = getWorkouts();
  const totalCal = wks.reduce((s, w) => s + (w.calories || 0), 0);
  if (el('workoutsCount')) el('workoutsCount').textContent = 24 + wks.length;
  if (el('caloriesCount')) el('caloriesCount').textContent = (12840 + totalCal).toLocaleString('en-IN');

  if (el('streakCount')) {
    const dates = [...new Set(wks.map(w => w.date))].sort().reverse();
    let streak = 0, check = new Date(); check.setHours(0,0,0,0);
    for (const d of dates) {
      if (d === check.toISOString().slice(0,10)) { streak++; check.setDate(check.getDate()-1); }
      else break;
    }
    el('streakCount').textContent = streak || 7;
  }

  if (el('memberBadge')) {
    el('memberBadge').textContent = (Session.getUser()?.plan || 'basic').toUpperCase();
  }
}


function toggleBilling() {
  const annual = el('billingToggle')?.checked;
  document.querySelectorAll('.plan-amount').forEach(e => {
    e.textContent = parseInt(annual ? e.dataset.annual : e.dataset.monthly).toLocaleString('en-IN');
  });
  el('lblMonthly')?.classList.toggle('toggle-active', !annual);
  el('lblAnnual') ?.classList.toggle('toggle-active',  annual);
}

function selectPlan(planId) {
  const names  = { basic: 'Basic', pro: 'Pro', elite: 'Elite' };
  const annual = el('billingToggle')?.checked;

  Session.updateUser({ plan: planId });

  const user  = Session.getUser();
  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const idx   = users.findIndex(u => u.email === user?.email);
  if (idx > -1) { users[idx].plan = planId; localStorage.setItem('ip_users', JSON.stringify(users)); }

  const toast = el('planToast');
  if (toast) {
    toast.textContent = `✅ ${names[planId]} plan selected (${annual ? 'Annual' : 'Monthly'}). Redirecting to dashboard...`;
    toast.classList.remove('hidden');
    setTimeout(() => window.location.replace('dashboard.html'), 1800);
  }
}


function getWorkouts()    { return JSON.parse(localStorage.getItem('ip_workouts') || '[]'); }
function saveWorkouts(a)  { localStorage.setItem('ip_workouts', JSON.stringify(a)); }

function logWorkout() {
  const type      = el('workoutType')?.value;
  const duration  = el('workoutDuration')?.value;
  const calories  = el('workoutCalories')?.value;
  const date      = el('workoutDate')?.value;
  const intensity = el('workoutIntensity')?.value;
  const notes     = el('workoutNotes')?.value?.trim();

  if (!type || !duration || !calories || !date) {
    showMsg('trackerMsg', '⚠ Please fill in all required fields.', 'error');
    return;
  }

  const entry = { id: Date.now(), type, duration: +duration, calories: +calories, date, intensity, notes };
  const all   = getWorkouts();
  all.push(entry);
  saveWorkouts(all);

  showMsg('trackerMsg', `✅ Workout logged! +${calories} kcal burned. Keep it up! 🔥`, 'success');
  renderWorkoutLog();
  updateTrackerStats();

  el('workoutType').value = el('workoutDuration').value = el('workoutCalories').value = el('workoutNotes').value = '';
}

function renderWorkoutLog() {
  const box = el('workoutLog');
  if (!box) return;
  const list = getWorkouts().slice().reverse();
  if (!list.length) { box.innerHTML = '<p class="empty-state">No workouts logged yet. Add your first one! 💪</p>'; return; }
  box.innerHTML = list.map(w => `
    <div class="log-entry" id="entry-${w.id}">
      <span class="log-entry-icon">${getIcon(w.type)}</span>
      <div class="log-entry-info">
        <div class="log-entry-type">${w.type.replace(/^[^\s]+\s/, '')}</div>
        <div class="log-entry-meta">${w.date} · ${w.duration} min · ${w.calories} kcal${w.notes ? ` <em>· ${w.notes}</em>` : ''}</div>
      </div>
      <span class="intensity-badge intensity-${w.intensity}">${w.intensity}</span>
      <button class="log-entry-delete" onclick="deleteWorkout(${w.id})" title="Delete">✕</button>
    </div>`).join('');
}

function getIcon(type = '') {
  const map = { Strength:'💪', Cardio:'🏃', Running:'🏃', Yoga:'🧘', Cycling:'🚴', Boxing:'🥊', HIIT:'🥊', Swimming:'🏊', CrossFit:'🏋️' };
  for (const [k, v] of Object.entries(map)) if (type.includes(k)) return v;
  return '⚡';
}

function deleteWorkout(id) { saveWorkouts(getWorkouts().filter(w => w.id !== id)); renderWorkoutLog(); updateTrackerStats(); }

function clearWorkouts() {
  if (confirm('Clear all workout history? This cannot be undone.')) { saveWorkouts([]); renderWorkoutLog(); updateTrackerStats(); }
}

function updateTrackerStats() {
  const wks   = getWorkouts();
  const now   = new Date();
  const key   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const mo    = wks.filter(w => w.date.startsWith(key));

  if (el('totalWorkouts')) el('totalWorkouts').textContent = mo.length;
  if (el('totalMinutes'))  el('totalMinutes').textContent  = mo.reduce((s,w)=>s+w.duration, 0);
  if (el('totalCalories')) el('totalCalories').textContent = mo.reduce((s,w)=>s+w.calories, 0);

  const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0);
  const tw = wks.filter(w => new Date(w.date) >= ws);
  const goal = parseInt(localStorage.getItem('ip_goal') || '5');
  const pct  = Math.min(100, (tw.length / goal) * 100);
  if (el('goalBar'))      el('goalBar').style.width     = pct + '%';
  if (el('goalProgress')) el('goalProgress').textContent = `${tw.length} / ${goal} completed`;
}

function updateGoalTarget(val) {
  localStorage.setItem('ip_goal', val);
  if (el('sliderLabel'))  el('sliderLabel').textContent  = `${val} days`;
  if (el('weeklyTarget')) el('weeklyTarget').textContent = `${val} workouts`;
  updateTrackerStats();
}

function setDateDefault() {
  const d = el('workoutDate');
  if (d) { const t = new Date().toISOString().slice(0,10); d.value = t; d.max = t; }
}

function initGoalSlider() {
  const s = el('goalSlider');
  if (!s) return;
  const v = parseInt(localStorage.getItem('ip_goal') || '5');
  s.value = v;
  updateGoalTarget(v);
}


document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.init()) return;       

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'dashboard.html')  initDashboard();
  if (page === 'tracker.html')  { setDateDefault(); renderWorkoutLog(); updateTrackerStats(); initGoalSlider(); }
});