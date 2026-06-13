
(function () {
  'use strict';

  var TOP_DOMAINS = [
    'mail.ru', 'yandex.ru', 'gmail.com', 'bk.ru', 'list.ru',
    'inbox.ru', 'rambler.ru', 'internet.ru', 'icloud.com', 'outlook.com'
  ];
  var EXTRA_DOMAINS = [
    'ya.ru', 'yandex.com', 'hotmail.com', 'live.com', 'mail.com',
    'protonmail.com', 'proton.me', 'vk.com', 'me.com', 'yahoo.com',
    'gmx.com', 'fastmail.com', 'pisem.net', 'pochta.ru', 'narod.ru'
  ];
  var ALL_DOMAINS = TOP_DOMAINS.concat(EXTRA_DOMAINS);

  var groups = [];
  var seq = 0;
  var editingId = null;

  var overlay   = document.getElementById('popupOverlay');
  var popup     = overlay.querySelector('.ok-popup');
  var form      = document.getElementById('okForm');
  var titleEl   = document.getElementById('popupTitle');
  var submitBtn = document.getElementById('popupSubmit');
  var cancelBtn = document.getElementById('popupCancel');
  var closeBtn  = document.getElementById('popupClose');
  var addBtn    = document.getElementById('addGroupBtn');
  var listEl    = document.getElementById('groupsList');
  var picker    = document.getElementById('xlsxPicker');
  var pageCard  = document.querySelector('.ok-pagecard');

  var FIELDS = ['link', 'addname', 'gid', 'appid', 'pubkey', 'login', 'pass'];
  var inputs = {};
  FIELDS.forEach(function (k) { inputs[k] = document.getElementById('f_' + k); });

  function refreshField(field) {
    var input = field.querySelector('.ok-input');
    if (input.value.length > 0) field.classList.add('filled');
    else field.classList.remove('filled');
  }

  function validate() {

    var ok = true;
    FIELDS.forEach(function (k) {
      if (inputs[k].dataset.required === '1' && inputs[k].value.trim() === '') ok = false;
    });
    submitBtn.disabled = !ok;
    popup.classList.toggle('valid', ok);
    return ok;
  }

  form.querySelectorAll('.ok-field').forEach(function (field) {
    var input = field.querySelector('.ok-input');
    var clear = field.querySelector('.ok-clear');
    input.addEventListener('input', function () { refreshField(field); validate(); });
    input.addEventListener('focus', function () { field.classList.add('focused'); });
    input.addEventListener('blur',  function () { field.classList.remove('focused'); });

    input.addEventListener('paste', function () { setTimeout(function () { refreshField(field); validate(); }, 0); });
    clear.addEventListener('click', function () {
      input.value = ''; refreshField(field); validate(); input.focus();
    });
  });

  function openPopup(mode, group) {
    editingId = (mode === 'edit' && group) ? group.id : null;
    titleEl.textContent = editingId ? 'Редактировать группу в ОК' : 'Добавить группу в ОК';
    submitBtn.textContent = editingId ? 'Сохранить' : 'Добавить';
    FIELDS.forEach(function (k) {
      inputs[k].value = (editingId && group) ? (group[k] || '') : '';
      refreshField(inputs[k].closest('.ok-field'));
    });
    overlay.hidden = false;
    validate();
    setTimeout(function () { inputs.link.focus(); }, 0);
  }
  function closePopup() { overlay.hidden = true; editingId = null; }

  addBtn.addEventListener('click', function () { openPopup('add'); });
  cancelBtn.addEventListener('click', closePopup);
  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) closePopup(); });

  submitBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = {};
    FIELDS.forEach(function (k) { data[k] = inputs[k].value.trim(); });
    if (editingId) {
      var g = groups.find(function (x) { return x.id === editingId; });
      if (g) FIELDS.forEach(function (k) { g[k] = data[k]; });
    } else {
      seq += 1;
      groups.push({
        id: 'g' + Date.now() + '_' + seq, num: seq, link: data.link, addname: data.addname,
        gid: data.gid, appid: data.appid, pubkey: data.pubkey, login: data.login, pass: data.pass,
        collapsed: false,
        settings: { minutes: '', email: '', xlsxPath: '', vacXlsx: '', vacCount: '', caption: '' }
      });
    }
    renumber();
    render();
    closePopup();
  });

  function renumber() { groups.forEach(function (g, i) { g.num = i + 1; }); }

  var ICON_EDIT = '<img class="ag-ic-img" src="icons/fig-pencil.svg" alt="">';
  var ICON_DEL  = '<img class="ag-ic-img" src="icons/fig-card.svg" alt="">';
  var ICON_ARR  = '<img class="ag-ic-img ag-ic-img-arrow" src="icons/fig-arrow-down.svg" alt="">';
  var ICON_CLIP = '<svg viewBox="0 0 13 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.88889 5.7798V23.4234C2.88889 23.4234 2.62022 27.1263 6.55922 27.1263C10.1111 27.1263 10.1111 23.4234 10.1111 23.4234V4.8672C10.1111 4.8672 10.1111 0 5.05556 0C0 0 0 4.8672 0 4.8672V23.4234C0 23.4234 0 30.42 6.5 30.42C13 30.42 13 23.4234 13 23.4234V4.8672C13 4.1067 11.5556 4.1067 11.5556 4.8672V23.4234C11.5556 23.4234 12.0813 29.0373 6.5 29.0373C1.44444 29.0373 1.44444 23.4234 1.44444 23.4234V4.8672C1.44444 4.8672 1.44444 1.38273 5.05556 1.38273C8.66667 1.38273 8.66667 4.8672 8.66667 4.8672V23.4234C8.66667 23.4234 8.66667 25.6054 6.55922 25.6054C4.45182 25.6054 4.33333 23.4234 4.33333 23.4234V5.7798C4.33333 5.0193 2.88889 5.0193 2.88889 5.7798Z" fill="currentColor"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var GRP_BLOCK = 806;
  var GRP_COLLAPSED = 90;

  function render() {
    listEl.innerHTML = '';
    if (groups.length) pageCard.classList.add('has-groups');
    else pageCard.classList.remove('has-groups');
    var total = 0;
    groups.forEach(function (g) { total += GRP_BLOCK; });
    pageCard.style.minHeight = groups.length
      ? 'calc(' + ((141 + total + 15) / 19.2).toFixed(5) + '*var(--fvw,1vw))'
      : '';
    var offset = 0;
    groups.forEach(function (g, i) {
      var card = buildCard(g, i, offset);
      listEl.appendChild(card);
      offset += GRP_BLOCK;
    });
  }

  function buildCard(g, idx, offsetPx) {
    var wrap = document.createElement('div');
    wrap.className = 'app-group' + (g.collapsed ? ' is-collapsed' : '');
    wrap.dataset.id = g.id;
    wrap.style.top = 'calc(' + ((141 + (offsetPx || 0)) / 19.2).toFixed(5) + '*var(--fvw,1vw))';

    function btn(cls, label) {
      return '<button type="button" class="ag-btn-' + cls + '"></button>' +
             '<span class="ag-btn-' + cls + '-t">' + label + '</span>';
    }
    function cb(cls, labelHTML) {
      return '<span class="ag-cb-' + cls + '" data-cb></span>' +
             '<span class="ag-cl-' + cls + '">' + labelHTML + '</span>';
    }
    function cred(cls, label, val) {
      return '<div class="ag-' + cls + '"><b>' + esc(label) + '</b>&nbsp;&nbsp;' + esc(val) + '</div>';
    }

    var link = g.link || ('Группа ' + g.num);
    var minVal = esc(g.settings.minutes || '');

    wrap.innerHTML =
      '<div class="ag-titlerow">' +
        '<span>Группа в ОК №' + g.num + ':</span>' +
        '<span class="ag-link">' + esc(link) + (g.addname ? '&nbsp;&nbsp;(' + esc(g.addname) + ')' : '') + '</span>' +
        '<button type="button" class="ag-ic ag-ic-arrow" data-act="toggle" title="Свернуть">' + ICON_ARR + '</button>' +
        '<button type="button" class="ag-ic ag-ic-x" data-act="delete">' + ICON_DEL + '<span class="ag-ic-tip">Удалить группу</span></button>' +
        '<button type="button" class="ag-ic ag-ic-edit" data-act="edit" title="Редактировать">' + ICON_EDIT + '</button>' +
      '</div>' +
      cred('kluch', 'Ключ:', g.pubkey) +
      cred('appid', 'Id приложения:', g.appid) +
      cred('gid', 'Id группы:', g.gid) +
      cred('pass', 'Пароль:', g.pass) +
      cred('login', 'Логин:', g.login) +
      btn('pub', 'Публиковать') + btn('stop1', 'Остановить') +
      btn('depub', 'Депубликовать') + btn('run', 'Запустить') +
      btn('parse', 'Парсинг подписчиков') + btn('stop2', 'Остановить') +
      btn('alldep', 'Все Депубликовать') + btn('stop3', 'Остановить') +
      '<img class="ag-ico-pub" src="icons/fig-pub.svg" alt="">' +
      '<img class="ag-ico-parse" src="icons/fig-parse.svg" alt="">' +
      '<img class="ag-ico-depub" src="icons/fig-depub.svg" alt="">' +
      '<img class="ag-ico-alldep" src="icons/fig-alldep.svg" alt="">' +
      '<div class="ag-lbl-xlsx1">Прописать путь к файлу xlsx, который нужно загрузить в сообщество</div>' +
      '<div class="ag-field-xlsx1"><input class="ag-fld-input js-fp1" type="text" value="' + esc(g.settings.xlsxPath || '') + '"></div>' +
      '<span class="ag-clip1 js-clip">' + ICON_CLIP + '<span class="ag-clip-tip">Пропишите путь к файлу, после этого, его название попадет в поле</span></span>' +
      '<div class="ag-vaccount js-vac">Количество вакансий&nbsp;&nbsp;' + esc(g.settings.vacCount || 'ХХ') + '</div>' +
      cb('c1', 'Через какое время публиковать новый пост на канале, минут') +
      '<input class="ag-min-val js-minutes" type="text" inputmode="numeric" maxlength="4" value="' + minVal + '">' +
      '<span class="ag-min-uline"></span>' +
      cb('c2', 'Заменить email для объявлений тип “Газета” на' +
        '<span class="ag-email-wrap"><input class="ag-email-input js-email" type="text" value="' + esc(g.settings.email || '') + '">' +
        '<div class="ag-suggest js-suggest"></div></span>') +
      '<span class="ag-email-uline"></span>' +
      cb('c3', 'Режим объединений объявлений по названию вакансии.') +
      cb('c4', 'Режим объединений объявлений по номеру счета') +
      cb('c5', 'Не публиковать названия компаний') +
      cb('c6', 'У зарплата руб./месяц если сумма менее 50000руб. менять на текст “По договоренности”') +
      cb('c7', esc('Без <DOPINFORMSOBYZANOSTI> <DOPINFORMSTREBOVANIY> <DOPINFORMSUSLOVIY>')) +
      cb('c8', 'Без адреса') +
      cb('c9', 'Без email') +
      cb('m1', 'Публиковать&nbsp;&nbsp;с&nbsp;&nbsp;картинками') +
      cb('m2', 'Публиковать&nbsp;&nbsp;с&nbsp;&nbsp;эмодзи') +
      cb('r1', 'Не указывать телефон в картинке') +
      cb('r2', 'Выводить номер счета') +
      '<div class="ag-lbl-xlsx2">Прописать путь к файлу xlsx, путь к картинкам по названию вакансии</div>' +
      '<div class="ag-field-xlsx2"><input class="ag-fld-input js-fp2" type="text" value="' + esc(g.settings.vacXlsx || '') + '"></div>' +
      '<button type="button" class="ag-browse js-browse"></button><span class="ag-browse-t">Обзор</span>' +
      '<div class="ag-lbl-xlsx3">Текст под названием вакансии в картинке</div>' +
      '<div class="ag-field-xlsx3"><input class="ag-fld-input js-fp3" type="text" value="' + esc(g.settings.caption || '') + '"></div>';

    wrap.querySelector('.ag-titlerow').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'edit') openPopup('edit', g);
      else if (act === 'delete') { groups = groups.filter(function (x) { return x.id !== g.id; }); renumber(); render(); }
      else if (act === 'toggle') { g.collapsed = !g.collapsed; render(); }
    });
    wrap.querySelectorAll('[data-cb]').forEach(function (box) {
      box.addEventListener('click', function () { box.classList.toggle('checked'); });
    });

    var GREEN_FILTER = 'brightness(0) saturate(100%) invert(48%) sepia(46%) saturate(497%) hue-rotate(48deg) brightness(92%) contrast(88%)';
    [['pub','pub'], ['depub','depub'], ['parse','parse'], ['alldep','alldep']].forEach(function (p) {
      var b = wrap.querySelector('.ag-btn-' + p[0]);
      var t = wrap.querySelector('.ag-btn-' + p[0] + '-t');
      var ic = wrap.querySelector('.ag-ico-' + p[1]);
      if (!b) return;
      b.addEventListener('mouseenter', function () { if (t) t.style.color = '#5E8B33'; if (ic) ic.style.filter = GREEN_FILTER; });
      b.addEventListener('mouseleave', function () { if (t) t.style.color = ''; if (ic) ic.style.filter = ''; });
    });

    wireBody(wrap, g);
    return wrap;
  }

  function wireBody(card, g) {

    var min = card.querySelector('.js-minutes');
    if (min) {
      min.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
        g.settings.minutes = this.value;
      });
      min.addEventListener('keypress', function (e) {
        if (e.key && /\D/.test(e.key) && e.key.length === 1) e.preventDefault();
      });
    }

    var email = card.querySelector('.js-email');
    var sugg  = card.querySelector('.js-suggest');
    var activeIdx = -1;
    if (email && sugg) {

    function closeSugg() { sugg.classList.remove('open'); sugg.innerHTML = ''; activeIdx = -1; }
    function buildSuggestions() {
      var v = email.value;
      var at = v.indexOf('@');
      if (at === -1) { closeSugg(); return; }
      var local = v.slice(0, at);
      var typed = v.slice(at + 1).toLowerCase();
      var list;
      if (typed === '') {
        list = TOP_DOMAINS.slice(0, 10);
      } else {
        var match = ALL_DOMAINS.filter(function (d) { return d.indexOf(typed) === 0; });

        list = match.slice(0, 10);
      }
      if (!list.length) { closeSugg(); return; }
      sugg.innerHTML = list.map(function (d, i) {
        return '<div class="ok-suggest-item" data-d="' + d + '">' + esc(local) + '@' + d + '</div>';
      }).join('');
      sugg.classList.add('open'); activeIdx = -1;
    }
    email.addEventListener('input', function () { g.settings.email = this.value; buildSuggestions(); });
    email.addEventListener('focus', function () { if (this.value.indexOf('@') !== -1) buildSuggestions(); });
    email.addEventListener('blur',  function () { setTimeout(closeSugg, 120); });
    email.addEventListener('keydown', function (e) {
      var items = sugg.querySelectorAll('.ok-suggest-item');
      if (!sugg.classList.contains('open') || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % items.length; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - 1 + items.length) % items.length; }
      else if (e.key === 'Enter') { if (activeIdx >= 0) { e.preventDefault(); items[activeIdx].click(); } return; }
      else return;
      items.forEach(function (it, i) { it.classList.toggle('active', i === activeIdx); });
    });
    sugg.addEventListener('mousedown', function (e) {
      var it = e.target.closest('.ok-suggest-item'); if (!it) return;
      email.value = email.value.slice(0, email.value.indexOf('@') + 1) + it.dataset.d;
      g.settings.email = email.value; closeSugg();
    });
    }

    var fp1 = card.querySelector('.js-fp1');
    if (fp1) fp1.addEventListener('input', function () { g.settings.xlsxPath = this.value; });
    var clip  = card.querySelector('.js-clip');
    var vacEl = card.querySelector('.js-vac');
    if (clip) clip.addEventListener('click', function () {
      picker.value = '';
      picker.onchange = function () {
        var f = picker.files[0]; if (!f) return;
        g.settings.xlsxPath = f.name;
        if (fp1) fp1.value = f.name;
        countXlsxRows(f).then(function (n) {
          g.settings.vacCount = String(n);
          vacEl.innerHTML = 'Количество вакансий&nbsp;&nbsp;' + n;
        }).catch(function () { vacEl.innerHTML = 'Количество вакансий&nbsp;&nbsp;ХХ'; });
      };
      picker.click();
    });

    var fp2 = card.querySelector('.js-fp2');
    if (fp2) fp2.addEventListener('input', function () { g.settings.vacXlsx = this.value; });
    var browse = card.querySelector('.js-browse');
    if (browse) browse.addEventListener('click', function () {
      picker.value = '';
      picker.onchange = function () {
        var f = picker.files[0]; if (!f) return;
        g.settings.vacXlsx = f.name;
        if (fp2) fp2.value = f.name;
      };
      picker.click();
    });

    var fp3 = card.querySelector('.js-fp3');
    if (fp3) fp3.addEventListener('input', function () { g.settings.caption = this.value; });
  }

  function countXlsxRows(file) {
    return file.arrayBuffer().then(function (buf) {
      return readZipEntry(new Uint8Array(buf), /sheet1\.xml$/);
    }).then(function (xml) {
      if (!xml) throw new Error('no sheet');

      var rows = xml.match(/<row[ >][\s\S]*?<\/row>/g) || [];
      var filled = rows.filter(function (r) { return /<c[ >][\s\S]*?<v>|<is>|t="inlineStr"/.test(r); });
      var n = Math.max(0, filled.length - 1);
      return n;
    });
  }

  function readZipEntry(bytes, nameRe) {
    var dv = new DataView(bytes.buffer);

    var i = bytes.length - 22;
    for (; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) break; }
    if (i < 0) return Promise.resolve(null);
    var cdOff = dv.getUint32(i + 16, true);
    var cdCount = dv.getUint16(i + 10, true);
    var p = cdOff, target = null;
    for (var c = 0; c < cdCount; c++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var method = dv.getUint16(p + 10, true);
      var compSize = dv.getUint32(p + 20, true);
      var nameLen = dv.getUint16(p + 28, true);
      var extraLen = dv.getUint16(p + 30, true);
      var commentLen = dv.getUint16(p + 32, true);
      var lho = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
      if (nameRe.test(name)) { target = { method: method, compSize: compSize, lho: lho }; break; }
      p += 46 + nameLen + extraLen + commentLen;
    }
    if (!target) return Promise.resolve(null);

    var lp = target.lho;
    var lNameLen = dv.getUint16(lp + 26, true);
    var lExtraLen = dv.getUint16(lp + 28, true);
    var dataStart = lp + 30 + lNameLen + lExtraLen;
    var comp = bytes.subarray(dataStart, dataStart + target.compSize);
    if (target.method === 0) return Promise.resolve(new TextDecoder().decode(comp));
    if (target.method === 8 && typeof DecompressionStream !== 'undefined') {
      var ds = new DecompressionStream('deflate-raw');
      var stream = new Blob([comp]).stream().pipeThrough(ds);
      return new Response(stream).arrayBuffer().then(function (ab) {
        return new TextDecoder().decode(new Uint8Array(ab));
      });
    }
    return Promise.resolve(null);
  }

})();
