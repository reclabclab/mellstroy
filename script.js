// Mellstroy Tap Game — авто-скин по карточке, профиль с датами, тосты, нормальная сетка

const HERO_DEFAULT = 'foto/melfoto.jpg';
const MONEY_SRC = 'foto/denfoto.jpg';

// DOM
const scoreEl = document.getElementById('score');
const hero = document.getElementById('hero');
const moneyLayer = document.getElementById('money-layer');

const friendsBtn = document.getElementById('friendsBtn');
const tasksBtn = document.getElementById('tasksBtn');
const profileBtn = document.getElementById('profileBtn');
const cardsNavBtn = document.getElementById('cardsBtn');

const modalFriends = document.getElementById('modalFriends');
const modalTasks = document.getElementById('modalTasks');
const modalProfile = document.getElementById('modalProfile');
const modalCards = document.getElementById('modalCards');

const copyLinkBtn = document.getElementById('copyLinkBtn');
const inviteCountEl = document.getElementById('inviteCount');
const claimTaskBtn = document.getElementById('claimTaskBtn');

const nickInput = document.getElementById('nickInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileInfoBox = document.getElementById('profileInfo');
const profileEditBox = document.getElementById('profileEdit');
const editNickBtn = document.getElementById('editNickBtn');

const cardsContainer = document.getElementById('cardsContainer');

// LocalStorage keys
const KEY_SCORE = 'mell_score_v3';
const KEY_CLICKCOUNT = 'mell_clickcount_v3';
const KEY_TASK1_DONE = 'mell_task1_done_v3';
const KEY_TASK_NICK_DONE = 'mell_task_nick_done_v1';
const KEY_TASK_INV_DONE = 'mell_task_inv_done_v1';

const KEY_REF = 'mell_ref_code_v3';
const KEY_INVITES_PREFIX = 'mell_invites_';

const KEY_NICK = 'mell_nick_v3';
const KEY_REG_TS = 'mell_reg_ts_v1';
const KEY_NICK_TS = 'mell_nick_ts_v1';

const KEY_OWNED_CARDS = 'mell_owned_cards_v3';
const KEY_ACTIVE_SKIN = 'mell_active_skin_v1';

// Data
let score = Number(localStorage.getItem(KEY_SCORE) || 0);
let clickCount = Number(localStorage.getItem(KEY_CLICKCOUNT) || 0);
let ownedCards = JSON.parse(localStorage.getItem(KEY_OWNED_CARDS) || '[]');
let activeSkinId = Number(localStorage.getItem(KEY_ACTIVE_SKIN) || 0);

// Скины: carper/carper{ID}.png (положи PNG без фона)
const SKIN_SRC = (id) => `carper/carper${id}.png`;

// Каталог карточек
const cards = [
  { id:1, price:1_000_000, src:'Cart/cart1.jpg', title:'Карточка 1', desc:'Описание карточки 1' },
  { id:2, price:3_000_000, src:'Cart/cart2.jpg', title:'Карточка 2', desc:'Описание карточки 2' },
  { id:3, price:5_000_000, src:'Cart/cart3.jpg', title:'Карточка 3', desc:'Описание карточки 3' },
];

// Utils
const fmt = (n) => n.toLocaleString('ru-RU');
function fmtDate(ts){
  const d = new Date(ts);
  const pad = (x)=> String(x).padStart(2,'0');
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('show'));
  setTimeout(()=> el.classList.remove('show'), 1600);
  setTimeout(()=> el.remove(), 2000);
}

// Base ops
function renderScore(){
  scoreEl.textContent = fmt(score);
  localStorage.setItem(KEY_SCORE, String(score));
}
function setScore(val){ score = Math.max(0, Number(val)||0); renderScore(); }

function ensureRegistrationTs(){
  if(!localStorage.getItem(KEY_REG_TS)){
    localStorage.setItem(KEY_REG_TS, String(Date.now()));
  }
}
function getRegistrationTs(){
  return Number(localStorage.getItem(KEY_REG_TS)||Date.now());
}

// Skins
function updateHeroSkin(){
  if (activeSkinId && ownedCards.includes(activeSkinId)) {
    hero.src = SKIN_SRC(activeSkinId);
  } else {
    hero.src = HERO_DEFAULT;
  }
}
function setActiveSkin(id){
  activeSkinId = id;
  localStorage.setItem(KEY_ACTIVE_SKIN, String(id));
  updateHeroSkin();
  const card = cards.find(c=>c.id===id);
  toast(`Скин активирован: ${card ? card.title : ('#'+id)}`);
}

// Invites
function updateInvites(){
  const myRef = localStorage.getItem(KEY_REF);
  if (!myRef) { inviteCountEl && (inviteCountEl.textContent = '0'); return; }
  const key = KEY_INVITES_PREFIX + myRef;
  inviteCountEl && (inviteCountEl.textContent = Number(localStorage.getItem(key) || 0));
}
(function handleReferralOnce(){
  const url = new URL(window.location.href);
  const ref = url.searchParams.get('ref');
  if (ref) {
    const marker = 'mell_ref_incoming_mark_'+ref;
    if (!localStorage.getItem(marker)) {
      const key = KEY_INVITES_PREFIX + ref;
      const current = Number(localStorage.getItem(key) || 0);
      localStorage.setItem(key, String(current+1));
      localStorage.setItem(marker, '1');
    }
  }
})();
function ensureMyRef(){
  let myRef = localStorage.getItem(KEY_REF);
  if (!myRef) {
    myRef = Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem(KEY_REF, myRef);
  }
  return myRef;
}

// Modals
function openModal(el){ if(el){ el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); } }
function closeModal(el){ if(el){ el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); } }

// Nav
friendsBtn?.addEventListener('click', ()=> { updateInvites(); openModal(modalFriends); });
tasksBtn?.addEventListener('click', ()=> openModal(modalTasks));
profileBtn?.addEventListener('click', ()=> { renderProfileView(); openModal(modalProfile); });
cardsNavBtn?.addEventListener('click', ()=> { renderCardsList(); openModal(modalCards); });

// Закрытие любых модалок по кнопкам id^="close"
document.querySelectorAll('button[id^="close"]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const modalId = btn.id.replace(/^close/, 'modal');
    const el = document.getElementById(modalId) || btn.closest('.modal');
    closeModal(el);
  });
});

// Friends — copy link
copyLinkBtn?.addEventListener('click', async ()=>{
  const myRef = ensureMyRef();
  const url = new URL(window.location.href);
  url.searchParams.set('ref', myRef);
  try{
    await navigator.clipboard.writeText(url.toString());
    toast('Ссылка скопирована!');
  }catch{
    const ta = document.createElement('textarea');
    ta.value = url.toString();
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('Ссылка скопирована!');
  }
  updateInvites();
});

// Cards list
function renderCardsList(){
  if(!cardsContainer) return;
  cardsContainer.innerHTML = '';
  cards.forEach(c=>{
    const owned = ownedCards.includes(c.id);
    const el = document.createElement('div');
    el.className = 'card' + (owned ? ' owned' : '');
    el.innerHTML = `
      <img src="${c.src}" alt="${c.title}" class="card-img"/>
      <div class="card-info">
        <span>${c.title}</span>
        <small>${owned ? 'Куплено' : fmt(c.price)}</small>
      </div>
      <div class="card-actions">
        ${owned
          ? `<button class="btn tiny ${activeSkinId===c.id?'disabled':''}" data-act="activate" data-id="${c.id}" ${activeSkinId===c.id?'disabled':''}>${activeSkinId===c.id?'Активно':'Сделать персонажем'}</button>`
          : `<button class="btn tiny primary" data-act="buy" data-id="${c.id}">Купить</button>`}
      </div>
    `;
    cardsContainer.appendChild(el);
  });

  cardsContainer.querySelectorAll('.card-actions .btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = Number(b.dataset.id);
      const act = b.dataset.act;
      const card = cards.find(x=>x.id===id);
      if(!card) return;

      if (act==='buy'){
        if (ownedCards.includes(id)) { toast('У тебя уже есть эта карточка'); return; }
        if (score < card.price) { toast('Недостаточно монет'); return; }
        setScore(score - card.price);
        ownedCards.push(id);
        localStorage.setItem(KEY_OWNED_CARDS, JSON.stringify(ownedCards));
        setActiveSkin(id);       // авто-активация скина
        renderCardsList();
      } else if (act==='activate'){
        if (!ownedCards.includes(id)) return;
        setActiveSkin(id);
        renderCardsList();
      }
    });
  });
}

// Profile
function renderProfileView(){
  const nick = localStorage.getItem(KEY_NICK) || '';
  const regTs = getRegistrationTs();
  const nickTs = Number(localStorage.getItem(KEY_NICK_TS)||0);

  if (nick){
    profileEditBox?.classList.add('hidden');
    profileInfoBox?.classList.remove('hidden');
    if (profileInfoBox){
      profileInfoBox.innerHTML = `
        <div class="info-row"><b>Ник:</b> <span>${nick}</span></div>
        <div class="info-row"><b>Регистрация:</b> <span>${fmtDate(regTs)}</span></div>
        <div class="info-row"><b>Ник сохранён:</b> <span>${fmtDate(nickTs||regTs)}</span></div>
        <div class="row" style="margin-top:8px;"><button class="btn ghost" id="switchToEdit">Изменить ник</button></div>
      `;
      // кнопка "Изменить ник"
      profileInfoBox.querySelector('#switchToEdit')?.addEventListener('click', ()=>{
        profileInfoBox.classList.add('hidden');
        profileEditBox.classList.remove('hidden');
        nickInput.value = localStorage.getItem(KEY_NICK) || '';
        nickInput.focus();
      });
    }
  } else {
    profileInfoBox?.classList.add('hidden');
    profileEditBox?.classList.remove('hidden');
  }
}
saveProfileBtn?.addEventListener('click', ()=>{
  const nick = (nickInput.value||'').trim();
  if (!nick) { toast('Введите никнейм'); return; }
  localStorage.setItem(KEY_NICK, nick);
  localStorage.setItem(KEY_NICK_TS, String(Date.now()));
  toast('Ник сохранён');

  if (!localStorage.getItem(KEY_TASK_NICK_DONE)) {
    setScore(score + 200);
    localStorage.setItem(KEY_TASK_NICK_DONE, '1');
    toast('+200 за ник');
  }
  renderProfileView();
});

// Tasks
claimTaskBtn?.addEventListener('click', ()=>{
  if (localStorage.getItem(KEY_TASK1_DONE)) { toast('Задание уже выполнено'); return; }
  const clicks = Number(localStorage.getItem(KEY_CLICKCOUNT) || 0);
  if (clicks >= 10) {
    setScore(score + 500);
    localStorage.setItem(KEY_TASK1_DONE, '1');
    toast('+500 за 10 кликов');
  } else {
    toast(`Сделай ещё ${10 - clicks} кликов`);
  }
});
function tryClaimInviteTaskOnce(){
  if (localStorage.getItem(KEY_TASK_INV_DONE)) return;
  const myRef = localStorage.getItem(KEY_REF);
  if (!myRef) return;
  const key = KEY_INVITES_PREFIX + myRef;
  const inv = Number(localStorage.getItem(key) || 0);
  if (inv >= 1) {
    setScore(score + 1000);
    localStorage.setItem(KEY_TASK_INV_DONE, '1');
    toast('+1000 за приглашение друга');
  }
}

// Hero click
hero?.addEventListener('click', ()=>{
  hero.animate([{transform:'scale(1)'},{transform:'scale(.95)'},{transform:'scale(1)'}],{duration:140});
  setScore(score + 20);
  clickCount += 1;
  localStorage.setItem(KEY_CLICKCOUNT, String(clickCount));
  const cnt = 6 + Math.floor(Math.random()*5);
  for(let i=0;i<cnt;i++) setTimeout(spawnBill,i*40);
});

// Money animation
function spawnBill(){
  const el = document.createElement('img');
  el.src = MONEY_SRC;
  el.className = 'money';
  const hr = hero.getBoundingClientRect();
  el.style.position = 'absolute';
  el.style.left = hr.left + hr.width/2 - 36 + 'px';
  el.style.top = hr.top + hr.height/2 - 24 + 'px';
  el.style.width = '72px';
  el.style.height = '48px';
  el.style.borderRadius = '8px';
  moneyLayer.appendChild(el);

  const dx = (Math.random()-0.5)*400;
  const dy = -200 - Math.random()*400;
  const rot = (Math.random()*720-360)+'deg';
  const dur = 1000 + Math.random()*500;

  requestAnimationFrame(()=>{
    el.style.transition = `transform ${dur}ms cubic-bezier(.18,.7,.2,1), opacity ${dur}ms linear`;
    el.style.transform = `translate(${dx}px,${dy}px) rotate(${rot}) scale(.86)`;
    el.style.opacity = '0';
  });

  let collected = false;
  el.addEventListener('click', ()=>{
    if(collected) return;
    collected=true;
    setScore(score + 100);
    const target = scoreEl.getBoundingClientRect();
    const cur = el.getBoundingClientRect();
    const tx = target.left + target.width/2 - cur.left;
    const ty = target.top + target.height/2 - cur.top;
    el.style.transition = 'transform 600ms cubic-bezier(.2,.9,.3,1), opacity 400ms';
    el.style.transform = `translate(${dx+tx}px,${dy+ty}px) rotate(720deg) scale(.28)`;
    el.style.opacity='0';
    setTimeout(()=>el.remove(),650);
  });

  setTimeout(()=> { if(el.parentElement) el.remove(); }, dur+150);
}

// Init
ensureRegistrationTs();
renderScore();
updateInvites();
renderCardsList();
tryClaimInviteTaskOnce();
updateHeroSkin();