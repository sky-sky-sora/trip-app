let DATA = {};
let isAdmin = false;
let currentMember = null;
let currentSection = 'home';
let checkedItems = JSON.parse(localStorage.getItem('checkedItems') || '{}');

const CATEGORY_LABELS = {
  documents: '📄 書類', clothing: '👕 衣類',
  toiletries: '🪥 洗面', electronics: '🔌 電子機器',
  medicine: '💊 薬', other: '📦 その他'
};

const NAV_TABS = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'flight', label: 'フライト', icon: '✈️' },
  { id: 'accommodation', label: '宿', icon: '🏨' },
  { id: 'schedule', label: '予定', icon: '📅' },
  { id: 'money', label: '金銭', icon: '💰' },
  { id: 'packing', label: '持ち物', icon: '🎒' },
  { id: 'places', label: '場所', icon: '📍' },
  { id: 'announcements', label: 'お知らせ', icon: '📢' },
];

// ===== INIT =====
async function init() {
  const res = await fetch('data.json?v=' + Date.now());
  DATA = await res.json();
  renderTop();
}

// ===== TOP PAGE =====
function renderTop() {
  const { trip, members, announcements } = DATA;

  document.getElementById('trip-title').textContent = trip.title;

  // Countdown
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(trip.startDate);
  const diff = Math.round((start - today) / 86400000);

  const numEl = document.getElementById('countdown-num');
  const labelEl = document.getElementById('countdown-label');
  const dateEl = document.getElementById('countdown-date');

  if (diff > 0) {
    numEl.textContent = diff;
    labelEl.textContent = '日後に出発 ✈️';
  } else if (diff === 0) {
    numEl.textContent = '🎉';
    labelEl.textContent = '今日が出発日！';
  } else {
    numEl.textContent = '🌟';
    labelEl.textContent = '旅行完了';
  }

  dateEl.textContent = formatDate(trip.startDate) + ' 〜 ' + formatDate(trip.endDate);

  // Meeting info
  const meetEl = document.getElementById('meeting-info');
  if (trip.meetingPlace || trip.meetingTime) {
    meetEl.innerHTML = `
      <div class="info-card">
        <div class="info-label">📍 集合情報</div>
        <div class="info-value">${trip.meetingPlace}　${trip.meetingTime}</div>
      </div>`;
  }

  // Latest announcement
  const annEl = document.getElementById('announcement-preview');
  if (announcements && announcements.length > 0) {
    const a = announcements[0];
    annEl.innerHTML = `
      <div class="info-card" style="border-left: 3px solid #FFB74D">
        <div class="info-label">📢 最新のお知らせ</div>
        <div class="info-value">${a.title}</div>
      </div>`;
  }

  // Members
  const grid = document.getElementById('member-grid');
  grid.innerHTML = members.map(m => `
    <div class="member-card" onclick="enterMember('${m.id}')" style="border-color: ${m.color}30">
      <div class="member-avatar" style="background: ${m.color}">${m.name[0]}</div>
      <div class="member-name">${m.name}</div>
    </div>
  `).join('');
}

// ===== ADMIN =====
function toggleAdmin() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('admin-btn').classList.remove('active');
    document.getElementById('admin-btn').textContent = '管理者';
    document.getElementById('admin-settings-btn').classList.add('hidden');
  } else {
    document.getElementById('passcode-overlay').classList.add('show');
    document.getElementById('passcode-input').value = '';
    document.getElementById('passcode-error').textContent = '';
    setTimeout(() => document.getElementById('passcode-input').focus(), 100);
  }
}

function closePasscode() {
  document.getElementById('passcode-overlay').classList.remove('show');
}

function submitPasscode() {
  const input = document.getElementById('passcode-input').value;
  if (input === DATA.trip.passcode) {
    isAdmin = true;
    closePasscode();
    document.getElementById('admin-btn').classList.add('active');
    document.getElementById('admin-btn').textContent = '管理者ON';
    document.getElementById('admin-settings-btn').classList.remove('hidden');
    if (currentMember) {
      document.getElementById('admin-badge').classList.remove('hidden');
      renderSection(currentSection);
    }
  } else {
    document.getElementById('passcode-error').textContent = 'パスコードが正しくありません';
  }
}

document.getElementById('passcode-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitPasscode();
});

// ===== NAVIGATION =====
function enterMember(memberId) {
  currentMember = DATA.members.find(m => m.id === memberId);
  currentSection = 'home';

  document.getElementById('top-page').style.display = 'none';
  document.getElementById('member-page').style.display = 'flex';

  const avatar = document.getElementById('app-bar-avatar');
  avatar.style.background = currentMember.color;
  avatar.textContent = currentMember.name[0];
  document.getElementById('app-bar-name').textContent = currentMember.name;

  if (isAdmin) {
    document.getElementById('admin-badge').classList.remove('hidden');
  }

  renderNav();
  renderSection('home');
}

function goBack() {
  document.getElementById('top-page').style.display = 'block';
  document.getElementById('member-page').style.display = 'none';
  document.getElementById('admin-badge').classList.add('hidden');
  currentMember = null;
}

function renderNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = NAV_TABS.map(tab => `
    <button class="nav-item ${tab.id === currentSection ? 'active' : ''}"
      onclick="renderSection('${tab.id}')" style="${tab.id === currentSection ? 'color:' + currentMember.color : ''}">
      <span class="nav-icon">${tab.icon}</span>
      <span>${tab.label}</span>
    </button>
  `).join('');
}

function renderSection(sectionId) {
  currentSection = sectionId;
  renderNav();

  const content = document.getElementById('section-content');
  switch (sectionId) {
    case 'home': content.innerHTML = renderHome(); break;
    case 'flight': content.innerHTML = renderFlight(); break;
    case 'accommodation': content.innerHTML = renderAccommodation(); break;
    case 'schedule': content.innerHTML = renderSchedule(); break;
    case 'money': content.innerHTML = renderMoney(); break;
    case 'packing': content.innerHTML = renderPacking(); break;
    case 'places': content.innerHTML = renderPlaces(); break;
    case 'announcements': content.innerHTML = renderAnnouncements(); break;
  }

  // packing checkboxes
  if (sectionId === 'packing') bindPackingChecks();
}

// ===== SECTIONS =====

function renderHome() {
  const { trip, announcements } = DATA;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(trip.startDate);
  const diff = Math.round((start - today) / 86400000);

  let countdownHtml = '';
  if (diff > 0) countdownHtml = `<div style="font-size:48px;font-weight:900;color:#4FC3F7">${diff}</div><div style="color:rgba(255,255,255,0.6)">日後に出発 ✈️</div>`;
  else if (diff === 0) countdownHtml = `<div style="font-size:32px;font-weight:900;color:#FFB74D">🎉 今日が出発日！</div>`;
  else countdownHtml = `<div style="font-size:32px;font-weight:900;color:#81C784">🌟 旅行完了</div>`;

  const annHtml = announcements && announcements.length > 0
    ? announcements.slice(0, 2).map(a => `
        <div class="announcement-item">
          <div class="announcement-title">${a.title}</div>
          <div class="announcement-date">${a.createdAt}</div>
          <div class="announcement-body">${a.body}</div>
        </div>`).join('')
    : '<div style="color:rgba(255,255,255,0.4);font-size:13px">お知らせはありません</div>';

  return `
    <div class="card" style="text-align:center;padding:24px">
      ${countdownHtml}
      <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:8px">${formatDate(trip.startDate)} 〜 ${formatDate(trip.endDate)}</div>
    </div>
    ${trip.meetingPlace ? `
    <div class="card">
      <div class="card-title">📍 集合情報</div>
      <div class="row"><div class="row-label">場所</div><div class="row-value">${trip.meetingPlace}</div></div>
      <div class="row"><div class="row-label">時間</div><div class="row-value">${trip.meetingTime}</div></div>
    </div>` : ''}
    <div class="card">
      <div class="card-title">📢 お知らせ</div>
      ${annHtml}
    </div>
  `;
}

function renderFlight() {
  const { members, flights } = DATA;

  const tabs = members.map((m, i) => `
    <button class="tab ${i === 0 ? 'active' : ''}" onclick="switchFlightTab('${m.id}', this)">${m.name}</button>
  `).join('');

  const flightCards = members.map(m => {
    const outbound = (flights || []).find(f => f.memberId === m.id && f.direction === 'outbound');
    const returning = (flights || []).find(f => f.memberId === m.id && f.direction === 'return');
    return `
      <div class="flight-member" id="flight-${m.id}" style="display:${members[0].id === m.id ? 'block' : 'none'}">
        ${renderFlightCard(outbound, '往路')}
        ${renderFlightCard(returning, '復路')}
      </div>`;
  }).join('');

  return `<div class="tabs">${tabs}</div>${flightCards}`;
}

function renderFlightCard(f, label) {
  if (!f) return `<div class="card"><div class="card-title">${label === '往路' ? '✈️' : '🛬'} ${label}</div><div style="color:rgba(255,255,255,0.4);font-size:13px">情報未登録</div></div>`;
  return `
    <div class="card">
      <div class="card-title">${label === '往路' ? '✈️' : '🛬'} ${label}</div>
      ${f.airline ? `<div class="row"><div class="row-label">航空会社</div><div class="row-value">${f.airline} ${f.flightNumber || ''}</div></div>` : ''}
      ${f.seat ? `<div class="row"><div class="row-label">座席</div><div class="row-value">${f.seat}</div></div>` : ''}
      ${f.departureTime ? `<div class="row"><div class="row-label">出発</div><div class="row-value">${f.departureTime}</div></div>` : ''}
      ${f.arrivalTime ? `<div class="row"><div class="row-label">到着</div><div class="row-value">${f.arrivalTime}</div></div>` : ''}
      ${f.reservationNumber ? `<div class="row"><div class="row-label">予約番号</div><div class="row-value">${f.reservationNumber}</div></div>` : ''}
      ${f.pdfUrl && f.pdfUrl !== 'https://drive.google.com/your-pdf-link' ? `<a class="link-btn" href="${f.pdfUrl}" target="_blank">📄 PDFを開く</a>` : ''}
    </div>`;
}

function switchFlightTab(memberId, btn) {
  document.querySelectorAll('.flight-member').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tabs .tab').forEach(el => el.classList.remove('active'));
  document.getElementById('flight-' + memberId).style.display = 'block';
  btn.classList.add('active');
}

function renderAccommodation() {
  const a = DATA.accommodation;
  if (!a) return '<div class="card"><div style="color:rgba(255,255,255,0.4)">情報未登録</div></div>';

  return `
    <div class="card">
      <div class="card-title">🏨 ${a.name}</div>
      ${a.checkIn ? `<div class="row"><div class="row-label">チェックイン</div><div class="row-value">${a.checkIn}</div></div>` : ''}
      ${a.checkOut ? `<div class="row"><div class="row-label">チェックアウト</div><div class="row-value">${a.checkOut}</div></div>` : ''}
      ${a.reservationNumber ? `<div class="row"><div class="row-label">予約番号</div><div class="row-value">${a.reservationNumber}</div></div>` : ''}
      ${a.address ? `<div class="row"><div class="row-label">住所</div><div class="row-value">${a.address}</div></div>` : ''}
      ${a.mapUrl ? `<a class="link-btn" href="${a.mapUrl}" target="_blank">🗺️ 地図を開く</a>` : ''}
    </div>
    ${(a.wifi || a.wifiPassword || a.doorCode) ? `
    <div class="card">
      <div class="card-title">🔑 設備・アクセス</div>
      ${a.wifi ? `<div class="row"><div class="row-label">Wi-Fi名</div><div class="row-value">${a.wifi}</div></div>` : ''}
      ${a.wifiPassword ? `<div class="row"><div class="row-label">Wi-Fiパスワード</div><div class="row-value"><span class="blur-text" onclick="this.classList.toggle('revealed')">${a.wifiPassword}</span><br><span style="font-size:11px;color:rgba(255,255,255,0.3)">タップで表示</span></div></div>` : ''}
      ${a.doorCode ? `<div class="row"><div class="row-label">暗証番号</div><div class="row-value"><span class="blur-text" onclick="this.classList.toggle('revealed')">${a.doorCode}</span><br><span style="font-size:11px;color:rgba(255,255,255,0.3)">タップで表示</span></div></div>` : ''}
    </div>` : ''}
    ${a.notes ? `
    <div class="card" style="border-left:3px solid #FFB74D">
      <div class="card-title">⚠️ 注意事項</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);white-space:pre-wrap">${a.notes}</div>
    </div>` : ''}
  `;
}

function renderSchedule() {
  const items = DATA.schedule || [];
  if (items.length === 0) return '<div class="card"><div style="color:rgba(255,255,255,0.4)">スケジュールはまだありません</div></div>';

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  return Object.keys(grouped).sort().map(date => {
    const dayItems = grouped[date];
    return `
      <div class="schedule-date">📅 ${formatDate(date)}</div>
      ${dayItems.map((item, i) => `
        <div class="timeline-item">
          <div class="timeline-dot">
            <div class="dot"></div>
            ${i < dayItems.length - 1 ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-content">
            ${item.time ? `<div class="timeline-time">${item.time}</div>` : ''}
            <div class="timeline-title">${item.title}</div>
            ${item.place ? `<div class="timeline-place">📍 ${item.place}</div>` : ''}
            ${item.memo ? `<div class="timeline-memo">${item.memo}</div>` : ''}
          </div>
        </div>`).join('')}
    `;
  }).join('');
}

function renderMoney() {
  const { payments, members } = DATA;
  const items = payments || [];

  // 精算計算
  const balance = {};
  members.forEach(m => balance[m.id] = 0);
  items.forEach(p => {
    const share = Math.round(p.amount / p.splitAmong.length);
    balance[p.paidByMemberId] += p.amount;
    p.splitAmong.forEach(id => balance[id] -= share);
  });

  const creditors = [], debtors = [];
  Object.entries(balance).forEach(([id, amt]) => {
    if (amt > 0) creditors.push({ id, amount: amt });
    else if (amt < 0) debtors.push({ id, amount: -amt });
  });

  const settlements = [];
  let i = 0, j = 0;
  const c = creditors.map(x => ({...x})), d = debtors.map(x => ({...x}));
  while (i < c.length && j < d.length) {
    const amt = Math.min(c[i].amount, d[j].amount);
    if (amt > 0) settlements.push({ from: d[j].id, to: c[i].id, amount: amt });
    c[i].amount -= amt; d[j].amount -= amt;
    if (c[i].amount === 0) i++;
    if (d[j].amount === 0) j++;
  }

  const memberName = id => members.find(m => m.id === id)?.name || id;
  const memberColor = id => members.find(m => m.id === id)?.color || '#888';
  const total = items.reduce((s, p) => s + p.amount, 0);

  const summaryHtml = members.map(m => `
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px">${m.name[0]}</div>
        <div style="font-weight:700">${m.name}</div>
      </div>
      <div class="money-summary">
        <div class="money-box">
          <div class="money-box-label">支払額</div>
          <div class="money-box-value">¥${items.filter(p => p.paidByMemberId === m.id).reduce((s,p) => s+p.amount, 0).toLocaleString()}</div>
        </div>
        <div class="money-box">
          <div class="money-box-label">負担額</div>
          <div class="money-box-value">¥${items.filter(p => p.splitAmong.includes(m.id)).reduce((s,p) => s+Math.round(p.amount/p.splitAmong.length), 0).toLocaleString()}</div>
        </div>
      </div>
    </div>`).join('');

  const paymentsHtml = items.length > 0
    ? items.map(p => `
        <div class="payment-item">
          <div>
            <div class="payment-desc">${p.description}</div>
            <div class="payment-meta">${p.date}　${memberName(p.paidByMemberId)}が支払い</div>
          </div>
          <div class="payment-amount">¥${p.amount.toLocaleString()}</div>
        </div>`).join('')
    : '<div style="color:rgba(255,255,255,0.4);font-size:13px">支払い記録がありません</div>';

  const settlementHtml = settlements.length > 0
    ? settlements.map(s => `
        <div class="settlement-item">
          <div class="s-avatar" style="background:${memberColor(s.from)}">${memberName(s.from)[0]}</div>
          <div style="font-size:13px">${memberName(s.from)}</div>
          <div class="s-arrow">→</div>
          <div class="s-avatar" style="background:${memberColor(s.to)}">${memberName(s.to)[0]}</div>
          <div style="font-size:13px">${memberName(s.to)}</div>
          <div class="s-amount">¥${s.amount.toLocaleString()}</div>
        </div>`).join('')
    : '<div style="color:#81C784;font-weight:700;padding:12px 0">✅ 精算不要です！</div>';

  return `
    <div style="color:rgba(255,255,255,0.4);font-size:13px;text-align:right;margin-bottom:8px">総支出 ¥${total.toLocaleString()}</div>

    <div class="tabs">
      <button class="tab active" onclick="switchMoneyTab('summary', this)">サマリー</button>
      <button class="tab" onclick="switchMoneyTab('payments', this)">支払い一覧</button>
      <button class="tab" onclick="switchMoneyTab('settlement', this)">精算</button>
    </div>

    <div id="money-summary">${summaryHtml}</div>
    <div id="money-payments" style="display:none"><div class="card">${paymentsHtml}</div></div>
    <div id="money-settlement" style="display:none"><div class="card">${settlementHtml}</div></div>
  `;
}

function switchMoneyTab(tab, btn) {
  ['summary', 'payments', 'settlement'].forEach(t => {
    document.getElementById('money-' + t).style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.tabs .tab').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
}

function renderPacking() {
  const items = DATA.packing || [];
  const memberId = currentMember.id;
  const myChecked = checkedItems[memberId] || {};
  const checkedCount = items.filter(i => myChecked[i.id]).length;
  const progress = items.length > 0 ? (checkedCount / items.length * 100) : 0;

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const listHtml = Object.keys(CATEGORY_LABELS).map(cat => {
    const catItems = grouped[cat];
    if (!catItems || catItems.length === 0) return '';
    return `
      <div style="font-size:12px;font-weight:700;color:#4FC3F7;margin:16px 0 6px">${CATEGORY_LABELS[cat]}</div>
      <div class="card">
        ${catItems.map(item => `
          <div class="packing-item">
            <div class="packing-check ${myChecked[item.id] ? 'checked' : ''}" data-id="${item.id}">
              ${myChecked[item.id] ? '✓' : ''}
            </div>
            <div class="packing-name ${myChecked[item.id] ? 'checked' : ''}" data-id="${item.id}-name">${item.name}</div>
          </div>`).join('')}
      </div>`;
  }).join('');

  return `
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <div style="font-size:13px">チェック済み</div>
      <div style="font-size:13px">${checkedCount} / ${items.length}</div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
    ${listHtml}
  `;
}

function bindPackingChecks() {
  document.querySelectorAll('.packing-check').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const memberId = currentMember.id;
      if (!checkedItems[memberId]) checkedItems[memberId] = {};
      checkedItems[memberId][id] = !checkedItems[memberId][id];
      localStorage.setItem('checkedItems', JSON.stringify(checkedItems));
      renderSection('packing');
    });
  });
}

function renderPlaces() {
  const places = [...(DATA.places || [])].sort((a, b) => b.votes.length - a.votes.length);
  if (places.length === 0) return '<div class="card"><div style="color:rgba(255,255,255,0.4)">場所はまだありません</div></div>';

  return `<div class="card">${places.map((p, i) => `
    <div class="place-item">
      <div class="place-header">
        <span class="place-rank">#${i + 1}</span>
        <span class="place-name">${p.name}</span>
        <span class="place-votes">👍 ${p.votes.length}</span>
      </div>
      ${p.description ? `<div class="place-desc">${p.description}</div>` : ''}
      ${p.mapUrl ? `<a class="link-btn" href="${p.mapUrl}" target="_blank">🗺️ 地図を開く</a>` : ''}
    </div>`).join('')}</div>`;
}

function renderAnnouncements() {
  const items = DATA.announcements || [];
  if (items.length === 0) return '<div class="card"><div style="color:rgba(255,255,255,0.4)">お知らせはありません</div></div>';

  return items.map((a, i) => `
    <div class="announcement-item">
      ${i === 0 ? '<span class="chip" style="background:rgba(255,183,77,0.2);color:#FFB74D">最新</span>' : ''}
      <div class="announcement-title">${a.title}</div>
      <div class="announcement-date">${a.createdAt}</div>
      <div class="announcement-body">${a.body}</div>
    </div>`).join('');
}

// ===== UTILS =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['日','月','火','水','木','金','土'];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

// ===== START =====
init();
