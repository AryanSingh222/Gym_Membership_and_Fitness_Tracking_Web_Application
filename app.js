const DEMO_USERS = [
  {
    id: 'admin-001', firstName: 'Raj', lastName: 'Kapoor',
    name: 'Raj Kapoor', email: 'admin@gym.com', password: 'admin123',
    role: 'admin', plan: 'staff', status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'trainer-001', firstName: 'Priya', lastName: 'Verma',
    name: 'Priya Verma', email: 'trainer@gym.com', password: 'trainer123',
    role: 'trainer', plan: 'staff', status: 'active', rating: 4.9,
    speciality: 'Strength & Conditioning', clients: 12,
    createdAt: '2024-02-15',
  },
  {
    id: 'member-001', firstName: 'Arjun', lastName: 'Sharma',
    name: 'Arjun Sharma', email: 'member@gym.com', password: 'member123',
    role: 'member', plan: 'pro', status: 'active',
    createdAt: '2024-06-10',
  },
];

function seedDemoUsers() {
  const existing = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const emails   = existing.map(u => u.email);
  DEMO_USERS.forEach(u => { if (!emails.includes(u.email)) existing.push(u); });
  localStorage.setItem('ip_users', JSON.stringify(existing));
}

const Session = (() => {
  const KEY = 'ip_session';
  return {
    save(data)    { localStorage.setItem(KEY, JSON.stringify(data)); },
    load()        { try { return JSON.parse(localStorage.getItem(KEY)) ?? null; } catch { return null; } },
    clear()       { localStorage.removeItem(KEY); },
    isLoggedIn()  { return this.load() !== null; },
    getUser()     { return this.load()?.user ?? null; },
    getRole()     { return this.load()?.user?.role ?? null; },
    updateUser(p) { const s = this.load(); if (!s) return; s.user = { ...s.user, ...p }; this.save(s); },
  };
})();


const ROUTES = {
  'dashboard.html':       ['member'],
  'tracker.html':         ['member'],
  'membership.html':      ['member'],
  'trainer-dashboard.html': ['trainer'],
  'admin-dashboard.html': ['admin'],
};
const GUEST_ONLY = ['login.html'];

// Where to land after login per role
const ROLE_HOME = {
  member:  'dashboard.html',
  trainer: 'trainer-dashboard.html',
  admin:   'admin-dashboard.html',
};

const Auth = {
  currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  },

  init() {
    seedDemoUsers();
    const page     = this.currentPage();
    const loggedIn = Session.isLoggedIn();
    const role     = Session.getRole();

    if (ROUTES[page] && !loggedIn) {
      sessionStorage.setItem('ip_redirect', page);
      window.location.replace('login.html');
      return false;
    }

    if (ROUTES[page] && loggedIn && !ROUTES[page].includes(role)) {
      window.location.replace(ROLE_HOME[role] || 'index.html');
      return false;
    }

    if (GUEST_ONLY.includes(page) && loggedIn) {
      window.location.replace(ROLE_HOME[role] || 'index.html');
      return false;
    }

    this.buildNavbar(loggedIn, role);
    return true;
  },

  buildNavbar(loggedIn, role) {
    const ul = document.getElementById('navLinks');
    if (!ul) return;
    const page = this.currentPage();
    const user = Session.getUser();
    const name = user?.firstName || 'You';
    const a    = (p) => page === p ? 'class="active"' : '';

    if (!loggedIn) {
      ul.innerHTML = `
        <li><a href="index.html"      ${a('index.html')}>Home</a></li>
        <li><a href="membership.html" ${a('membership.html')}>Membership</a></li>
        <li><a href="login.html" class="btn-nav ${page==='login.html'?'active':''}">Login</a></li>`;
    } else if (role === 'member') {
      ul.innerHTML = `
        <li><a href="index.html"      ${a('index.html')}>Home</a></li>
        <li><a href="dashboard.html"  ${a('dashboard.html')}>Dashboard</a></li>
        <li><a href="membership.html" ${a('membership.html')}>Membership</a></li>
        <li><a href="tracker.html"    ${a('tracker.html')}>Tracker</a></li>
        <li><span class="nav-user role-member">🏋️ ${name}</span></li>
        <li><a href="#" class="btn-nav" id="logoutBtn">Logout</a></li>`;
    } else if (role === 'trainer') {
      ul.innerHTML = `
        <li><a href="index.html"            ${a('index.html')}>Home</a></li>
        <li><a href="trainer-dashboard.html" ${a('trainer-dashboard.html')}>My Dashboard</a></li>
        <li><span class="nav-user role-trainer">👟 ${name}</span></li>
        <li><a href="#" class="btn-nav" id="logoutBtn" style="background:var(--blue)">Logout</a></li>`;
    } else if (role === 'admin') {
      ul.innerHTML = `
        <li><a href="index.html"           ${a('index.html')}>Home</a></li>
        <li><a href="admin-dashboard.html" ${a('admin-dashboard.html')}>Admin Panel</a></li>
        <li><span class="nav-user role-admin">🛡️ ${name}</span></li>
        <li><a href="#" class="btn-nav" id="logoutBtn" style="background:#a855f7">Logout</a></li>`;
    }

    document.getElementById('logoutBtn')?.addEventListener('click', e => {
      e.preventDefault(); Session.clear(); window.location.replace('login.html');
    });
    ul.querySelectorAll('a').forEach(a => a.addEventListener('click', () => ul.classList.remove('open')));
  },
};

(function () {
  const nav  = document.getElementById('navbar');
  const hbg  = document.getElementById('hamburger');
  const nl   = document.getElementById('navLinks');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
  if (hbg && nl) hbg.addEventListener('click', () => nl.classList.toggle('open'));
})();


const el = (id) => document.getElementById(id);

function showMsg(id, text, type) {
  const e = el(id); if (!e) return;
  e.textContent = text; e.className = `form-msg ${type}`;
}

function togglePw(id, btn) {
  const i = el(id); if (!i) return;
  i.type = i.type === 'password' ? 'text' : 'password';
  btn.textContent = i.type === 'password' ? '👁' : '🙈';
}

function openModal(id)  { el(id)?.classList.remove('hidden'); }
function closeModal(id) { el(id)?.classList.add('hidden'); }

let currentRole = 'member';

const ROLE_META = {
  member:  { tag:'MEMBER PORTAL',  quote:'PUSH<br/>YOUR<br/>LIMITS.',     desc:'Access your dashboard, track workouts and manage your membership.',     accentVar:'--accent',  loginTitle:'Member Login',  loginSub:'Login to your member account' },
  trainer: { tag:'TRAINER PORTAL', quote:'TRAIN<br/>THE<br/>BEST.',        desc:'View your clients, log sessions and manage your training schedule.',    accentVar:'--blue',    loginTitle:'Trainer Login', loginSub:'Login to your trainer account' },
  admin:   { tag:'ADMIN PANEL',    quote:'LEAD<br/>THE<br/>GYM.',          desc:'Full control over members, trainers, revenue and gym operations.',       accentVar:'',          loginTitle:'Admin Login',   loginSub:'Restricted — authorised personnel only' },
};

const ROLE_COLORS = {
  member:  { bg: 'linear-gradient(160deg,#1a0d00,#0d0d0f)', border: 'var(--accent)' },
  trainer: { bg: 'linear-gradient(160deg,#001020,#0d0d0f)', border: 'var(--blue)' },
  admin:   { bg: 'linear-gradient(160deg,#130a1f,#0d0d0f)', border: '#a855f7' },
};

function setRole(role) {
  currentRole = role;
  const meta  = ROLE_META[role];

  if (el('leftTag'))   el('leftTag').textContent   = meta.tag;
  if (el('leftQuote')) el('leftQuote').innerHTML   = meta.quote;
  if (el('leftDesc'))  el('leftDesc').textContent  = meta.desc;

  const left = el('authLeft');
  if (left) {
    left.style.background = ROLE_COLORS[role].bg;
    left.style.borderRight = `1px solid ${ROLE_COLORS[role].border}`;
  }

  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  el(`pill-${role}`) || document.querySelector(`.pill-${role}`)?.classList.add('active');
  document.querySelector(`.pill-${role}`)?.classList.add('active');

  document.querySelectorAll('.role-hint').forEach(h => h.classList.remove('active-hint'));
  document.querySelector(`.hint-${role}`)?.classList.add('active-hint');

  if (el('loginTitle')) el('loginTitle').textContent = meta.loginTitle;
  if (el('loginSub'))   el('loginSub').textContent   = meta.loginSub;

  const tabs = el('authTabs');
  if (tabs) tabs.style.display = role === 'member' ? 'flex' : 'none';

  switchTab('login');
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  el('loginForm') ?.classList.toggle('hidden', !isLogin);
  el('signupForm')?.classList.toggle('hidden',  isLogin);
  el('tabLogin')  ?.classList.toggle('active',  isLogin);
  el('tabSignup') ?.classList.toggle('active', !isLogin);
}

function handleLogin() {
  const email = el('loginEmail')?.value.trim().toLowerCase();
  const pass  = el('loginPassword')?.value;

  if (!email || !pass) { showMsg('loginMsg', '⚠ Please fill in all fields.', 'error'); return; }

  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const user  = users.find(u => u.email === email && u.password === pass);

  if (!user) { showMsg('loginMsg', '✗ Invalid email or password.', 'error'); return; }

  if (user.role !== currentRole) {
    showMsg('loginMsg', `✗ This account is a "${user.role}" account. Please select the correct role tab.`, 'error');
    return;
  }

  const { password, ...safeUser } = user;
  _onLoginSuccess({ user: safeUser, accessToken: 'local-' + Date.now(), refreshToken: 'local-r-' + Date.now() }, 'loginMsg');
}

function handleSignup() {
  const first = el('firstName')?.value.trim();
  const last  = el('lastName')?.value.trim();
  const email = el('signupEmail')?.value.trim().toLowerCase();
  const pass  = el('signupPassword')?.value;
  const plan  = el('planSelect')?.value || 'basic';
  const agree = el('agreeTerms')?.checked;

  if (!first || !last || !email || !pass) { showMsg('signupMsg', '⚠ Fill in all fields.', 'error'); return; }
  if (pass.length < 6)  { showMsg('signupMsg', '⚠ Password min 6 characters.', 'error'); return; }
  if (!agree)           { showMsg('signupMsg', '⚠ Please agree to Terms.', 'error'); return; }

  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  if (users.find(u => u.email === email)) { showMsg('signupMsg', '✗ Email already registered.', 'error'); return; }

  const newUser = {
    id: 'u-' + Date.now(), firstName: first, lastName: last, name: `${first} ${last}`,
    email, password: pass, role: 'member', plan, status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  users.push(newUser);
  localStorage.setItem('ip_users', JSON.stringify(users));

  showMsg('signupMsg', `✅ Welcome, ${first}! Setting up your account...`, 'success');
  const { password, ...safe } = newUser;
  setTimeout(() => _onLoginSuccess({ user: safe, accessToken: 'local-'+Date.now(), refreshToken: 'local-r-'+Date.now() }, 'signupMsg'), 800);
}

function _onLoginSuccess(sessionData, msgId) {
  Session.save(sessionData);
  const role = sessionData.user.role;
  showMsg(msgId, `✅ Logged in as ${role}! Redirecting...`, 'success');
  const intended = sessionStorage.getItem('ip_redirect') || ROLE_HOME[role] || 'index.html';
  if (ROUTES[intended] && !ROUTES[intended].includes(role)) {
    sessionStorage.removeItem('ip_redirect');
  }
  sessionStorage.removeItem('ip_redirect');
  setTimeout(() => window.location.replace(ROLE_HOME[role]), 900);
}

function initMemberDashboard() {
  if (!el('dashGreeting')) return;

  const user  = Session.getUser();
  const name  = user?.firstName || 'Champion';
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  el('dashGreeting').textContent = `${greet}, ${name}! 💪`;
  if (el('headerDate')) el('headerDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const chartEl  = el('activityChart');
  const labelsEl = el('chartLabels');
  if (chartEl) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const wks  = getWorkouts();
    const now  = new Date();
    const ws   = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0);
    const vals = days.map((_,i) => {
      const d = new Date(ws); d.setDate(ws.getDate()+i);
      return wks.filter(w=>w.date===d.toISOString().slice(0,10)).reduce((s,w)=>s+(w.duration||0),0);
    });
    const display = vals.every(v=>v===0) ? [45,60,0,75,50,90,30] : vals;
    const max = Math.max(...display, 1);
    const ti  = (now.getDay()+6)%7;
    chartEl.innerHTML = display.map((v,i) => `
      <div class="bar-wrap"><div class="bar"
        style="height:${v===0?4:Math.max(8,(v/max)*90)}px;background:${v===0?'var(--border)':i===ti?'var(--accent)':'#3a3a4a'}"
        data-val="${v?v+' min':'Rest'}"></div></div>`).join('');
    if (labelsEl) labelsEl.innerHTML = days.map(d=>`<span>${d}</span>`).join('');
  }

  const wl = el('recentWorkouts');
  if (wl) {
    const recent = getWorkouts().slice(-3).reverse();
    const sample = [
      { type:'💪 Strength Training', duration:60, calories:420 },
      { type:'🏃 Cardio / Running',   duration:35, calories:310 },
      { type:'🧘 Yoga / Flexibility', duration:45, calories:150 },
    ];
    wl.innerHTML = (recent.length ? recent : sample).map(w => `
      <li class="workout-item">
        <span class="workout-item-icon">${getIcon(w.type)}</span>
        <div class="workout-item-info">
          <div class="workout-item-name">${w.type.replace(/^[^\s]+\s/,'')}</div>
          <div class="workout-item-meta">${w.duration} min${w.date?' · '+w.date:''}</div>
        </div>
        <span class="workout-item-cal">${w.calories} kcal</span>
      </li>`).join('');
  }

  const gl = el('goalsList');
  if (gl) {
    const wks = getWorkouts();
    const now = new Date(); const ws = new Date(now); ws.setDate(now.getDate()-ws.getDay()); ws.setHours(0,0,0,0);
    const tw  = wks.filter(w=>new Date(w.date)>=ws).length;
    const tc  = wks.reduce((s,w)=>s+(w.calories||0),0);
    [
      { text:'Work out 5 days this week', done: tw>=5 },
      { text:'Burn 2,000 calories',       done: tc>=2000 },
      { text:'Complete 1 cardio session', done: wks.some(w=>/Cardio|Running/i.test(w.type)) },
      { text:'Stretch for 15 min daily',  done: false },
    ].forEach(g => {
      gl.innerHTML += `<li class="goal-item">
        <div class="goal-check ${g.done?'done':''}">✓</div>
        <span class="goal-text ${g.done?'done':''}">${g.text}</span></li>`;
    });
  }

  const wks  = getWorkouts();
  const tcal = wks.reduce((s,w)=>s+(w.calories||0),0);
  if (el('workoutsCount')) el('workoutsCount').textContent = 24 + wks.length;
  if (el('caloriesCount')) el('caloriesCount').textContent = (12840+tcal).toLocaleString('en-IN');
  if (el('memberBadge'))   el('memberBadge').textContent   = (Session.getUser()?.plan||'basic').toUpperCase();

  // Streak
  if (el('streakCount')) {
    const dates = [...new Set(wks.map(w=>w.date))].sort().reverse();
    let st=0, ck=new Date(); ck.setHours(0,0,0,0);
    for (const d of dates) { if(d===ck.toISOString().slice(0,10)){st++;ck.setDate(ck.getDate()-1);}else break; }
    el('streakCount').textContent = st || 7;
  }
}

const SAMPLE_CLIENTS = [
  { name:'Arjun Sharma',  goal:'Weight Loss',    sessions:12, progress:72 },
  { name:'Priya Singh',   goal:'Muscle Gain',    sessions: 8, progress:55 },
  { name:'Rahul Mehta',   goal:'General Fitness',sessions:15, progress:80 },
  { name:'Sneha Patel',   goal:'Sports Perf.',   sessions: 5, progress:40 },
  { name:'Vikram Nair',   goal:'Weight Loss',    sessions:20, progress:90 },
];

const SCHEDULE_DATA = [
  { time:'06:30', client:'Arjun Sharma',  type:'Strength Training',       done: true  },
  { time:'08:00', client:'Priya Singh',   type:'Weight Loss Circuit',      done: true  },
  { time:'10:00', client:'Rahul Mehta',   type:'Cardio Conditioning',      done: false },
  { time:'12:30', client:'Sneha Patel',   type:'Flexibility & Mobility',   done: false },
  { time:'17:00', client:'Vikram Nair',   type:'HIIT Training',            done: false },
];

function initTrainerDashboard() {
  if (!el('trainerGreeting')) return;

  const user  = Session.getUser();
  const name  = user?.firstName || 'Coach';
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  el('trainerGreeting').textContent = `${greet}, ${name}! 👟`;
  if (el('headerDate')) el('headerDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });


  const sched = el('scheduleList');
  if (sched) {
    sched.innerHTML = SCHEDULE_DATA.map(s => `
      <div class="schedule-item ${s.done?'sched-done':''}">
        <span class="sched-time">${s.time}</span>
        <div class="sched-info">
          <p class="sched-client">${s.client}</p>
          <p class="sched-type">${s.type}</p>
        </div>
        <span class="sched-status ${s.done?'status-done':'status-upcoming'}">${s.done?'✓ Done':'Upcoming'}</span>
      </div>`).join('');
  }

  const cl = el('clientList');
  if (cl) {
    cl.innerHTML = SAMPLE_CLIENTS.map(c => `
      <li class="client-item">
        <div class="client-avatar">${c.name.split(' ').map(w=>w[0]).join('')}</div>
        <div class="client-info">
          <p class="client-name">${c.name}</p>
          <p class="client-goal">${c.goal} · ${c.sessions} sessions</p>
          <div class="client-progress-bar"><div style="width:${c.progress}%;background:var(--blue)"></div></div>
        </div>
        <span class="client-pct">${c.progress}%</span>
      </li>`).join('');
  }

  const pl = el('plansList');
  if (pl) {
    const plans = JSON.parse(localStorage.getItem('ip_trainer_plans') || '[]');
    const sample = ['Beginner Strength (8 weeks)', 'Fat Loss Accelerator', 'Muscle Builder Pro', 'Athletic Performance'];
    const all = [...sample.map(n=>({name:n,clients:Math.floor(Math.random()*5)+1})), ...plans];
    pl.innerHTML = all.slice(0,5).map(p => `
      <li class="plan-item">
        <span class="plan-icon">📋</span>
        <div class="plan-info"><p class="plan-name">${p.name}</p><p class="plan-clients">${p.clients||1} clients</p></div>
        <button class="btn-ghost small" style="padding:4px 10px;font-size:0.75rem">Edit</button>
      </li>`).join('');
  }
}

function logSession() {
  const client   = el('sessionClient')?.value;
  const type     = el('sessionType')?.value;
  const duration = el('sessionDuration')?.value;
  const rating   = el('sessionRating')?.value;
  const notes    = el('sessionNotes')?.value?.trim();

  if (!client || !duration) { showMsg('sessionMsg','⚠ Select a client and enter duration.','error'); return; }

  const sessions = JSON.parse(localStorage.getItem('ip_sessions') || '[]');
  sessions.push({ id:Date.now(), client, type, duration:+duration, rating, notes, date:new Date().toISOString().slice(0,10) });
  localStorage.setItem('ip_sessions', JSON.stringify(sessions));

  showMsg('sessionMsg', `✅ Session logged for ${client}!`, 'success');
  el('sessionClient').value = '';
  el('sessionDuration').value = '';
  el('sessionNotes').value = '';
}

function addClient() {
  const name = el('newClientName')?.value.trim();
  const email = el('newClientEmail')?.value.trim();
  const goal  = el('newClientGoal')?.value;
  if (!name || !email) return;

  SAMPLE_CLIENTS.push({ name, goal, sessions:0, progress:0 });
  closeModal('addClientModal');

  const cl = el('clientList');
  if (cl) cl.innerHTML += `
    <li class="client-item">
      <div class="client-avatar">${name.split(' ').map(w=>w[0]).join('')}</div>
      <div class="client-info">
        <p class="client-name">${name}</p>
        <p class="client-goal">${goal} · 0 sessions</p>
        <div class="client-progress-bar"><div style="width:0%;background:var(--blue)"></div></div>
      </div>
      <span class="client-pct">0%</span>
    </li>`;

  el('newClientName').value = el('newClientEmail').value = '';
}

function createPlan() {
  const name = prompt('Enter workout plan name:');
  if (!name?.trim()) return;
  const plans = JSON.parse(localStorage.getItem('ip_trainer_plans') || '[]');
  plans.push({ name: name.trim(), clients: 0 });
  localStorage.setItem('ip_trainer_plans', JSON.stringify(plans));

  const pl = el('plansList');
  if (pl) pl.innerHTML += `
    <li class="plan-item">
      <span class="plan-icon">📋</span>
      <div class="plan-info"><p class="plan-name">${name.trim()}</p><p class="plan-clients">0 clients</p></div>
      <button class="btn-ghost small" style="padding:4px 10px;font-size:0.75rem">Edit</button>
    </li>`;
}

function openAddClientModal() { openModal('addClientModal'); }

let allUsersCache = [];

function initAdminDashboard() {
  if (!el('adminGreeting')) return;

  const user  = Session.getUser();
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  el('adminGreeting').textContent = `${greet}, ${user?.firstName||'Admin'}! 🛡️`;

  buildRevenueChart();
  buildPlanDist();
  buildMembersTable();
  buildActivityFeed();
}

function buildRevenueChart() {
  const rc = el('revenueChart');
  const rl = el('revenueLabels');
  if (!rc) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const vals   = [180,210,195,240,225,280,310,290,330,315,360,410];
  const max    = Math.max(...vals);
  rc.innerHTML = vals.map((v,i) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.max(6,(v/max)*90)}px;background:#a855f7" data-val="₹${v}K"></div>
    </div>`).join('');
  if (rl) rl.innerHTML = months.map(m=>`<span>${m}</span>`).join('');
}

function buildPlanDist() {
  const pd = el('planDist');
  if (!pd) return;
  const users   = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const members = users.filter(u => u.role === 'member');
  const counts  = { basic:0, pro:0, elite:0 };
  members.forEach(u => { if (counts[u.plan] !== undefined) counts[u.plan]++; });
  const total = members.length || 1;
  const colors = { basic:'var(--border)', pro:'var(--accent)', elite:'#a855f7' };
  const labels = { basic:'Basic', pro:'Pro', elite:'Elite' };

  pd.innerHTML = Object.entries(counts).map(([plan, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="dist-row">
        <div class="dist-label">
          <span class="dist-dot" style="background:${colors[plan]}"></span>
          <span>${labels[plan]}</span>
        </div>
        <div class="dist-bar-wrap">
          <div class="dist-bar" style="width:${Math.max(pct,4)}%;background:${colors[plan]}"></div>
        </div>
        <span class="dist-pct">${pct}%</span>
        <span class="dist-count">${count}</span>
      </div>`;
  }).join('');

  if (el('totalMembers')) el('totalMembers').textContent = 248 + members.length;
}

function buildMembersTable() {
  const body = el('membersBody');
  if (!body) return;

  const stored = JSON.parse(localStorage.getItem('ip_users') || '[]');
  allUsersCache = stored;
  renderMembersTable(stored);
}

function renderMembersTable(users) {
  const body = el('membersBody');
  if (!body) return;

  const roleBadge = { member:'badge-member', trainer:'badge-trainer', admin:'badge-admin' };
  const planColor = { basic:'#555', pro:'var(--accent)', elite:'#a855f7', staff:'var(--blue)' };

  body.innerHTML = users.map(u => `
    <tr>
      <td style="text-align:left">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="client-avatar" style="width:32px;height:32px;font-size:0.75rem">${(u.firstName||u.name||'?')[0]}${(u.lastName||'')[0]||''}</div>
          <div>
            <p style="font-weight:600;font-size:0.88rem">${u.name||u.firstName+' '+u.lastName}</p>
            <p style="font-size:0.75rem;color:var(--text-muted)">${u.email}</p>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${roleBadge[u.role]||''}">${u.role}</span></td>
      <td><span style="color:${planColor[u.plan]||'#aaa'};font-weight:600;font-size:0.85rem">${(u.plan||'—').toUpperCase()}</span></td>
      <td><span class="status-badge ${u.status==='active'?'status-active':'status-inactive'}">${u.status||'active'}</span></td>
      <td style="color:var(--text-muted);font-size:0.82rem">${u.createdAt?.slice(0,10)||'—'}</td>
      <td>
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn-ghost small" style="padding:4px 10px;font-size:0.75rem" onclick="toggleUserStatus('${u.id}')">
            ${u.status==='active'?'Suspend':'Activate'}
          </button>
          <button class="btn-ghost small" style="padding:4px 10px;font-size:0.75rem;color:var(--red);border-color:var(--red)" onclick="deleteUser('${u.id}')">Delete</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No users found.</td></tr>';
}

function filterMembers() {
  const q    = el('memberSearch')?.value.toLowerCase() || '';
  const role = el('roleFilter')?.value || '';
  const filtered = allUsersCache.filter(u => {
    const matchQ = (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
    const matchR = !role || u.role === role;
    return matchQ && matchR;
  });
  renderMembersTable(filtered);
}

function toggleUserStatus(id) {
  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const idx   = users.findIndex(u => u.id === id);
  if (idx < 0) return;
  users[idx].status = users[idx].status === 'active' ? 'suspended' : 'active';
  localStorage.setItem('ip_users', JSON.stringify(users));
  allUsersCache = users;
  filterMembers();
}

function deleteUser(id) {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  const users = JSON.parse(localStorage.getItem('ip_users') || '[]').filter(u => u.id !== id);
  localStorage.setItem('ip_users', JSON.stringify(users));
  allUsersCache = users;
  filterMembers();
}

function buildActivityFeed() {
  const feed = el('activityFeed');
  if (!feed) return;
  const items = [
    { icon:'👤', text:'New member <b>Karan Johal</b> registered', time:'2 min ago' },
    { icon:'💳', text:'<b>Sneha Patel</b> upgraded to Elite plan', time:'18 min ago' },
    { icon:'👟', text:'Trainer <b>Amit Kumar</b> logged 3 sessions', time:'1 hr ago' },
    { icon:'🔴', text:'<b>Raj Singh</b> membership expired', time:'2 hr ago' },
    { icon:'💰', text:'Payment of <b>₹1,799</b> received from Rohan V.', time:'3 hr ago' },
    { icon:'👤', text:'New member <b>Divya Menon</b> registered', time:'5 hr ago' },
  ];
  feed.innerHTML = items.map(i => `
    <div class="feed-item">
      <span class="feed-icon">${i.icon}</span>
      <div class="feed-text">${i.text}</div>
      <span class="feed-time">${i.time}</span>
    </div>`).join('');
}

function openAddUserModal() { openModal('addUserModal'); }

function adminAddUser() {
  const first = el('newUserFirst')?.value.trim();
  const last  = el('newUserLast')?.value.trim();
  const email = el('newUserEmail')?.value.trim().toLowerCase();
  const pass  = el('newUserPass')?.value;
  const role  = el('newUserRole')?.value;
  const plan  = el('newUserPlan')?.value;

  if (!first || !last || !email || !pass) { showMsg('addUserMsg','⚠ Fill in all fields.','error'); return; }
  if (pass.length < 6) { showMsg('addUserMsg','⚠ Password min 6 characters.','error'); return; }

  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  if (users.find(u=>u.email===email)) { showMsg('addUserMsg','✗ Email already exists.','error'); return; }

  const newUser = {
    id:'u-'+Date.now(), firstName:first, lastName:last, name:`${first} ${last}`,
    email, password:pass, role, plan, status:'active',
    createdAt: new Date().toISOString().slice(0,10),
  };
  users.push(newUser);
  localStorage.setItem('ip_users', JSON.stringify(users));
  allUsersCache = users;

  showMsg('addUserMsg', `✅ User ${first} ${last} created as ${role}.`, 'success');
  setTimeout(() => { closeModal('addUserModal'); filterMembers(); buildPlanDist(); }, 1000);
  el('newUserFirst').value=el('newUserLast').value=el('newUserEmail').value=el('newUserPass').value='';
}

function exportReport() {
  const users   = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const header  = 'Name,Email,Role,Plan,Status,Joined\n';
  const rows    = users.map(u => `"${u.name||''}","${u.email}","${u.role}","${u.plan}","${u.status||'active'}","${u.createdAt||''}"`).join('\n');
  const blob    = new Blob([header+rows], { type:'text/csv' });
  const link    = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = `ironpulse-members-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
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
  const names = { basic:'Basic', pro:'Pro', elite:'Elite' };
  const annual = el('billingToggle')?.checked;
  Session.updateUser({ plan: planId });
  const user  = Session.getUser();
  const users = JSON.parse(localStorage.getItem('ip_users') || '[]');
  const idx   = users.findIndex(u => u.email === user?.email);
  if (idx > -1) { users[idx].plan = planId; localStorage.setItem('ip_users', JSON.stringify(users)); }
  const toast = el('planToast');
  if (toast) {
    toast.textContent = `✅ ${names[planId]} plan selected (${annual?'Annual':'Monthly'}). Redirecting...`;
    toast.classList.remove('hidden');
    setTimeout(() => window.location.replace('dashboard.html'), 1800);
  }
}

function getWorkouts()   { return JSON.parse(localStorage.getItem('ip_workouts') || '[]'); }
function saveWorkouts(a) { localStorage.setItem('ip_workouts', JSON.stringify(a)); }

function logWorkout() {
  const type      = el('workoutType')?.value;
  const duration  = el('workoutDuration')?.value;
  const calories  = el('workoutCalories')?.value;
  const date      = el('workoutDate')?.value;
  const intensity = el('workoutIntensity')?.value;
  const notes     = el('workoutNotes')?.value?.trim();
  if (!type || !duration || !calories || !date) { showMsg('trackerMsg','⚠ Fill in all required fields.','error'); return; }
  const all = getWorkouts();
  all.push({ id:Date.now(), type, duration:+duration, calories:+calories, date, intensity, notes });
  saveWorkouts(all);
  showMsg('trackerMsg',`✅ Workout logged! +${calories} kcal. Keep going! 🔥`,'success');
  renderWorkoutLog(); updateTrackerStats();
  el('workoutType').value=el('workoutDuration').value=el('workoutCalories').value=el('workoutNotes').value='';
}

function renderWorkoutLog() {
  const box = el('workoutLog');
  if (!box) return;
  const list = getWorkouts().slice().reverse();
  if (!list.length) { box.innerHTML='<p class="empty-state">No workouts yet. Add your first! 💪</p>'; return; }
  box.innerHTML = list.map(w => `
    <div class="log-entry">
      <span class="log-entry-icon">${getIcon(w.type)}</span>
      <div class="log-entry-info">
        <div class="log-entry-type">${w.type.replace(/^[^\s]+\s/,'')}</div>
        <div class="log-entry-meta">${w.date} · ${w.duration} min · ${w.calories} kcal${w.notes?` <em>· ${w.notes}</em>`:''}</div>
      </div>
      <span class="intensity-badge intensity-${w.intensity}">${w.intensity}</span>
      <button class="log-entry-delete" onclick="deleteWorkout(${w.id})">✕</button>
    </div>`).join('');
}

function getIcon(t='') {
  const m={Strength:'💪',Cardio:'🏃',Running:'🏃',Yoga:'🧘',Cycling:'🚴',Boxing:'🥊',HIIT:'🥊',Swimming:'🏊',CrossFit:'🏋️'};
  for(const[k,v]of Object.entries(m)) if(t.includes(k)) return v;
  return '⚡';
}

function deleteWorkout(id) { saveWorkouts(getWorkouts().filter(w=>w.id!==id)); renderWorkoutLog(); updateTrackerStats(); }
function clearWorkouts()   { if(confirm('Clear all history?')){ saveWorkouts([]); renderWorkoutLog(); updateTrackerStats(); } }

function updateTrackerStats() {
  const wks=getWorkouts(), now=new Date();
  const key=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const mo=wks.filter(w=>w.date.startsWith(key));
  if(el('totalWorkouts')) el('totalWorkouts').textContent=mo.length;
  if(el('totalMinutes'))  el('totalMinutes').textContent=mo.reduce((s,w)=>s+w.duration,0);
  if(el('totalCalories')) el('totalCalories').textContent=mo.reduce((s,w)=>s+w.calories,0);
  const ws=new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0);
  const tw=wks.filter(w=>new Date(w.date)>=ws);
  const goal=parseInt(localStorage.getItem('ip_goal')||'5');
  const pct=Math.min(100,(tw.length/goal)*100);
  if(el('goalBar'))      el('goalBar').style.width=pct+'%';
  if(el('goalProgress')) el('goalProgress').textContent=`${tw.length} / ${goal} completed`;
}

function updateGoalTarget(val) {
  localStorage.setItem('ip_goal',val);
  if(el('sliderLabel'))  el('sliderLabel').textContent=`${val} days`;
  if(el('weeklyTarget')) el('weeklyTarget').textContent=`${val} workouts`;
  updateTrackerStats();
}

function setDateDefault() {
  const d=el('workoutDate'); if(d){const t=new Date().toISOString().slice(0,10);d.value=t;d.max=t;}
}
function initGoalSlider() {
  const s=el('goalSlider'); if(!s) return;
  const v=parseInt(localStorage.getItem('ip_goal')||'5'); s.value=v; updateGoalTarget(v);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.init()) return;

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'login.html')            setRole('member');
  if (page === 'dashboard.html')        initMemberDashboard();
  if (page === 'trainer-dashboard.html') initTrainerDashboard();
  if (page === 'admin-dashboard.html')  initAdminDashboard();
  if (page === 'tracker.html')          { setDateDefault(); renderWorkoutLog(); updateTrackerStats(); initGoalSlider(); }
});