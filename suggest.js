// The composer shares one suggestion panel between editable drafts and paused diagnoses.
(() => {
  'use strict';
  const P = window.POC;
  const prompt = document.querySelector('#prompt');
  const panel = document.querySelector('#draft-suggest');
  const choices = panel.querySelector('.draft-choices');
  const live = document.querySelector('#draft-hint');
  const clean = text => text.normalize('NFKC').toLowerCase().replace(/(\d),(?=\d{3}(?:\D|$))/g,'$1').replace(/\s+/g,'');
  const laptopUses = ['用来玩游戏','办公/学习/网课','设计/剪辑/AI创作','编程/开发','学生用','用来送人'];
  const standardBudgets = ['5000 元以下','5000 ~ 10000 元','10000 ~ 20000 元','价格不限'];
  const categories = [
    {name:'笔记本电脑', hint:'拯救者 · 小新 · YOGA · ThinkPad', unit:'台', match:/笔记本|游戏本|轻薄本|办公本|商务本|选电脑|买电脑/, catalog:/^(Lenovo笔记本|ThinkPad电脑|ThinkPad|ThinkBook|笔记本)$/, uses:laptopUses},
    {name:'台式机', hint:'拯救者 · 天逸 · ThinkCentre', unit:'台', match:/台式(?:机|电脑)|台式计算机/, catalog:/台式/, uses:laptopUses.slice(0,4)},
    {name:'手机', hint:'moto 折叠屏 · 直板机', unit:'部', match:/手机/, catalog:/^手机$/, uses:['日常通讯','拍照录像','用来玩游戏','用来送人']},
    {name:'平板电脑', hint:'小新Pad · YOGA Pad · 拯救者', unit:'台', match:/平板/, catalog:/^平板$/, uses:['学习网课','追剧阅读','画画创作','用来玩游戏']},
    {name:'显示器', hint:'拯救者 · ThinkVision · 来酷', unit:'台', match:/显示器/, catalog:/^显示器$/, uses:['办公学习','设计修图','用来玩游戏'], budgets:['1000 元以下','1000 ~ 3000 元','3000 元以上','价格不限']},
    {name:'耳机/外设', hint:'来酷 · 拯救者 · ThinkPlus', unit:'款', match:/耳机|外设|鼠标|键盘/, catalog:/配件|周边/, uses:['日常办公','用来玩游戏','影音娱乐'], budgets:['200 元以下','200 ~ 500 元','500 元以上','价格不限']}
  ];
  const useSynonyms = [
    /游戏|电竞/, /办公|商务|网课|学习|上课/, /设计|剪辑|ai创作|建模|渲染/,
    /编程|开发|写代码/, /学生/, /送人|送礼/
  ];
  const portability = ['平时经常带着外出，最好轻便一些','不常携带，配置更重要'];
  const cities = ['北京','上海','深圳'];
  const cityPattern = /北京|上海|深圳|广州|杭州|成都|南京|苏州|武汉|西安|重庆|天津|长沙|郑州|青岛|厦门|昆明|合肥|大连|沈阳|福州|宁波|济南|哈尔滨/;
  const faults = ['无法开机','屏幕异常','电池或充电问题','运行缓慢'];
  const visitGoals = ['体验笔记本','咨询购机','体验平板'];
  const value = raw => parseFloat(raw) * (/[万w]/i.test(raw)?10000:/[千k]/i.test(raw)?1000:1);
  function budget(text) {
    if (/价格不限|预算不限|不限预算|没有预算限制|预算不设限/.test(text)) return {label:'预算不限',min:0,max:Infinity};
    const n = '(\\d+(?:\\.\\d+)?[千k万w]?)';
    const range = text.match(new RegExp(n+'元?(?:至|到|[-~—–～])'+n+'元?'));
    if (range) {const a=value(range[1]), b=value(range[2]);return {label:range[0],min:Math.min(a,b),max:Math.max(a,b)};}
    const m = text.match(new RegExp('(?:预算(?:在|大概|大约|不超过|约|为|是|上限)?|不超过|上限为?|低于|至多|不低于|至少|高于)[:：]?'+n+'元?')) ||
      text.match(new RegExp(n+'(?:元|块|以内|以下|以上|左右|上下)')) || text.match(/(\d+(?:\.\d+)?[千k万w])/);
    if (!m) return null;
    const v=value(m[1]), i=m.index, upper=/以上|起步|起$/.test(text.slice(i,i+m[0].length+3)) || /不低于|至少|高于/.test(m[0]);
    return {label:m[0],min:upper?v:0,max:upper?Infinity:v};
  }
  function facts(raw) {
    const t=clean(raw);
    const repair=/维修|报修|修理|修电脑|无法开机|不开机|坏了|屏幕异常|充电问题|开不了机|黑屏|蓝屏|故障/.test(t);
    const store=repair || /门店|到店|体验店|服务中心|线下店|专卖店|附近.{0,6}店|^预约/.test(t);
    if(store){
      const service=repair?'repair':/预约|体验(?:笔记本|平板)|咨询购机/.test(t)?'visit':/查找|查询|查一下|找.{0,5}门店|地址|位置|营业时间|在哪里|在哪儿|附近/.test(t)?'find':null;
      const detail=service==='repair'?/无法开机|不开机|开不了机|屏幕|黑屏|蓝屏|花屏|电池|充电|运行缓慢|卡顿|进水|键盘|风扇|过热|死机|主板|硬盘|断网|没有声音/.test(t):service==='visit'?/体验(?:笔记本|平板|产品|电脑|真机)|购机咨询|咨询购机|选购|试用|试机/.test(t):false;
      return {kind:'store',service,detail,city:t.match(cityPattern)?.[0] || (/(?:城市|地址|地点)[:：][^,，。]{2,}|[\u4e00-\u9fff]{2,}市(?:的|区|门店|$)/.test(t)?'其他城市':'')};
    }
    if (/订单|物流|保修|发票|驱动|如何安装|怎么设置|如何设置|怎么连接|怎么清理|对比|怎么样|参数|测评|型号对比|评测/.test(t)) return {};
    const category = categories.find(item => item.match.test(t));
    if (!category) return {};
    let use = category.uses.find(label => t.includes(clean(label)));
    if (!use) {
      const implied = laptopUses[useSynonyms.findIndex(pattern => pattern.test(t))];
      use = category.uses.includes(implied) ? implied : undefined;
    }
    const portable = /轻便|轻薄|便携|常带|经常.{0,3}外出|出差/.test(t);
    const stationary = /不常携带|不带出门|固定使用|配置更重要|性能优先/.test(t);
    return {kind:'shopping',category,use,budget:budget(t),portable,stationary};
  }

  function purchaseIntent(text) {
    return /^(?:请|帮我|请帮我)?(?:推|推荐|求推荐|推荐一|推荐一款|推荐一下|想买|我想买|我想买一台|我想买点东西|想买点东西|买什么|买点什么)[?？。！!，,]?$/.test(text);
  }

  const prefixOptions = new Map([['笔','推荐一款笔记本电脑'],['笔记','推荐一款笔记本电脑'],['推荐笔','推荐一款笔记本电脑'],['门','查找附近的联想门店'],['附','查找附近的联想门店'],['预','预约设备维修'],['维','预约设备维修']]);

  function next(raw) {
    const t = clean(raw);
    if (window.LexiangFollowup.diagnosticIntent(t)) return null;
    if (purchaseIntent(t)) {
      return {title:'想买点什么？', options:categories.map(item => item.name), categoryPicker:true};
    }
    const f = facts(raw);
    if (f.kind === 'shopping') {
      if (!f.use) return {title:'主要用来做什么？', options:f.category.uses};
      if (!f.budget) return {title:'预算大概多少？', options:f.category.budgets || standardBudgets, budgetPicker:true};
      if (f.category === categories[0] && !f.portable && !f.stationary) {
        return {title:'经常带出门吗？', options:portability};
      }
    }
    if (f.kind === 'store') {
      if (!f.service) return {title:'想办理什么门店服务？',options:['到店预约','设备维修','查询地址']};
      if (!f.detail && f.service === 'repair') return {title:'设备遇到了什么问题？',options:faults};
      if (!f.detail && f.service === 'visit') return {title:'想预约什么到店服务？',options:visitGoals};
      if (!f.city) return {title:'想查询哪个城市？',options:cities};
    }
    const completion = prefixOptions.get(t);
    return completion ? {title:'你可能想问',options:[completion],prefix:true} : null;
  }

  const anchor = panel.parentElement;
  const confirmBar = panel.querySelector('.draft-confirm');
  const heading = panel.querySelector('.diagnosis-heading');
  const confirmButton = confirmBar.querySelector('[data-diagnosis="submit"]');
  const otherButton = confirmBar.querySelector('[data-diagnosis="other"]');
  function syncChecks(turn) {
    const checked = turn.decision.checked;
    for (const button of choices.querySelectorAll('[data-pick]')) {
      const label = turn.decision.options[Number(button.dataset.pick)];
      button.setAttribute('aria-pressed', String(checked.includes(label)));
    }
    const count = '多选 · 已选 ' + checked.length + ' 项';
    if (heading.lastElementChild.textContent !== count) heading.lastElementChild.textContent = count;
    confirmButton.disabled = !checked.length && !(turn.decision.otherOpen && prompt.value.trim());
    otherButton.setAttribute('aria-pressed', String(!!turn.decision.otherOpen));
  }
  confirmButton.addEventListener('click', () => P.confirmDiagnosis(current?.turn));
  otherButton.addEventListener('click', () => P.openDiagnosisNote(current?.turn));
  confirmBar.querySelector('[data-diagnosis="skip"]').addEventListener('click', () => P.confirmDiagnosis(current?.turn, true));

  let current = null;
  let dismissed = null;
  let composing = false;
  let shownDraft = null;

  function hide() {
    panel.hidden = true;
    anchor.style.removeProperty('--reserve');
    current = null;
    shownDraft = null;
    live.textContent = '';
  }

  function fitPanel() {
    if (panel.hidden) return;
    if (current?.turn) {
      const multiple = window.LexiangFollowup.isMulti(current.turn.decision);
      panel.style.maxHeight = Math.max(multiple ? 150 : 88, Math.floor((window.visualViewport?.height || innerHeight) * (multiple ? .46 : .34))) + 'px';
      return;
    }
    const viewTop = window.visualViewport?.offsetTop || 0;
    const container = anchor.closest('.assistant-side, #workspace');
    const top = Math.max(viewTop, container.getBoundingClientRect().top);
    const available = Math.floor(anchor.getBoundingClientRect().top - top - 10);
    // Reserve space in the scrolling home layout if the keyboard leaves little headroom.
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const composerHeight = prompt.form.getBoundingClientRect().height;
    const desiredHeight = Math.min(panel.scrollHeight + 2, Math.max(96, viewportHeight - composerHeight - 36));
    const reserve = anchor.closest('#workspace:not(.chatting)') ? Math.max(0, desiredHeight - Math.max(0, available)) : 0;
    anchor.style.setProperty('--reserve', reserve + 'px');
    panel.style.maxHeight = Math.max(72, available + reserve) + 'px';
  }

  function draw() {
    if (P.busy) return hide();
    const turn = P.pendingDiagnosis;
    if (turn) {
      if (current?.turn === turn && !panel.hidden) {
        if (window.LexiangFollowup.isMulti(turn.decision)) syncChecks(turn);
        return;
      }
      current = {turn, title:turn.decision.question, options:turn.decision.options};
    } else {
      if (composing || dismissed === prompt.value ||
          !(document.activeElement === prompt || panel.contains(document.activeElement))) return hide();
      if (!current?.turn && shownDraft === prompt.value && !panel.hidden) return;
      current = prompt.value.trim() ? next(prompt.value) : null;
      if (!current) return hide();
    }
    anchor.style.removeProperty('--reserve');
    panel.dataset.mode = turn ? 'diagnosis' : 'draft';
    const {title, options, categoryPicker} = current;
    const multiple = window.LexiangFollowup.isMulti(turn?.decision);
    confirmBar.hidden = !multiple;
    heading.hidden = !multiple;
    panel.querySelector('.draft-title').textContent = title;
    choices.replaceChildren(...options.map((label,index) => {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.pick = String(index);
      const number = document.createElement('span');
      number.className = 'draft-number';
      number.setAttribute('aria-hidden','true');
      number.textContent = (index + 1) + '.';
      const name = document.createElement('span');
      name.textContent = label;
      button.append(number, name);
      if (categoryPicker) {
        const hint = document.createElement('span');
        hint.className = 'draft-detail';
        hint.textContent = categories[index].hint;
        button.append(hint);
      }
      row.append(button);
      return row;
    }));
    if (multiple) syncChecks(turn);
    shownDraft = prompt.value;
    panel.hidden = false;
    fitPanel();
    panel.scrollTop = 0;
    let hint = '。按向下键选择，或直接发送。';
    if (turn) hint = multiple ? '。可多选、补充其他情况或跳过。完成后提交回答。' : '。选择后继续诊断。';
    live.textContent = title + options.join('、') + hint;
  }

  function pick(index) {
    if (!current) return;
    const step = current;
    if (step.turn) {
      P.selectDiagnosis(step.turn, index);
      return;
    }
    const option = step.options[index];
    let updated;
    if (step.categoryPicker) {
      const item = categories[index];
      updated = '我想买一' + item.unit + item.name;
    } else if (step.prefix) {
      updated = option;
    } else {
      let stem = prompt.value.trimEnd().replace(/[？?。！!，,；;]+$/, '');
      let addition = option;
      if (step.budgetPicker) {
        stem = stem.replace(/预算[:：为是]?$/, '').replace(/[，,]+$/, '');
        addition = option === '价格不限' ? option : '预算' + option.replace(/\s/g,'').replace('~','到');
      }
      if (step.options === cities) addition = '城市：' + option;
      updated = stem + '，' + addition;
    }
    if (next(updated)) updated += '，';
    if (updated.length > prompt.maxLength) { P.toast('问题已达字数上限，请先精简文字'); return; }
    prompt.focus({preventScroll:true});
    prompt.setRangeText(updated,0,prompt.value.length,'end');
    dismissed = null;
    prompt.dispatchEvent(new Event('input',{bubbles:true}));
    if (panel.hidden) live.textContent = '问题已补全，可编辑或发送。';
  }

  choices.addEventListener('click', e => {
    const button = e.target.closest('[data-pick]');
    if (button && choices.contains(button)) pick(Number(button.dataset.pick));
  });
  prompt.addEventListener('compositionstart', () => { composing = true; draw(); });
  prompt.addEventListener('compositionend', () => { composing = false; dismissed = null; draw(); });
  prompt.addEventListener('input', () => { dismissed = null; draw(); });
  prompt.addEventListener('focus', draw);
  document.addEventListener('poc:draft-change', draw);
  document.addEventListener('poc:chat', () => { dismissed = null; hide(); });
  document.addEventListener('click', e => {
    if (!P.pendingDiagnosis && !e.target.closest('#prompt,#draft-suggest,[data-pick]')) hide();
  });
  document.addEventListener('focusin', e => { if (!P.pendingDiagnosis && !anchor.contains(e.target)) hide(); });
  window.addEventListener('hashchange', () => { if (P.pendingDiagnosis) draw(); else hide(); });
  window.addEventListener('resize',fitPanel);
  window.visualViewport?.addEventListener('resize',fitPanel);
  document.addEventListener('scroll',e => { if (!panel.contains(e.target)) fitPanel(); },true);
  document.addEventListener('keydown', e => {
    if (panel.hidden || composing || e.isComposing || e.keyCode === 229 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target !== prompt && !panel.contains(e.target)) return;
    if (e.key === 'Escape') {
      if (current?.turn) return;
      e.preventDefault();
      dismissed = prompt.value;
      hide();
      prompt.focus({preventScroll:true});
      return;
    }
    if (!['ArrowDown','ArrowUp'].includes(e.key) || (e.target === prompt && (current?.turn?.decision.otherOpen || prompt.value.includes('\n')))) return;
    const buttons = Array.from(choices.querySelectorAll('button'));
    const i = buttons.indexOf(e.target);
    const forward = e.key === 'ArrowDown';
    const index = i < 0 ? (forward ? 0 : buttons.length-1) : (i + (forward ? 1 : -1) + buttons.length) % buttons.length;
    e.preventDefault();
    buttons[index].focus({preventScroll:true});
    const row = buttons[index].getBoundingClientRect();
    const scroller = confirmBar.hidden ? panel : choices;
    const bounds = scroller.getBoundingClientRect();
    if (row.top < bounds.top) scroller.scrollTop += row.top - bounds.top;
    if (row.bottom > bounds.bottom) scroller.scrollTop += row.bottom - bounds.bottom;
  });
  // Use the same parsed preferences in the local answer and in the store link.
  function reply(q) {
    const f=facts(q), esc=P.escape;
    if (f.kind === 'shopping' && (f.budget || f.use || q.startsWith('我想买一'))) {
      const range = f.budget || {min:0,max:Infinity};
      const seen = new Set();
      function score(product) {
        const description = [product.pName, product.use, product.summary].join(' ');
        const gaming = f.use === '用来玩游戏' && /rtx|拯救者|游戏/i.test(description);
        const creative = f.use === '设计/剪辑/AI创作' && /rtx|设计|创作/i.test(description);
        const portable = f.portable && /轻薄|轻便|便携|移动|thinkpad x|yoga/i.test(description);
        const performance = f.stationary && /rtx|高性能|ultra [79]/i.test(description);
        return Number(gaming || creative) * 2 + Number(portable || performance);
      }
      const items = P.products.filter(p => f.category.catalog.test(p.category || '') || (f.category === categories[0] && p.id < 3))
        .filter(p => p.price > 0 && p.price >= range.min && p.price <= range.max)
        .sort((a,b) => score(b) - score(a) || a.price - b.price)
        .filter(p => { if (seen.has(p.pName)) return false; seen.add(p.pName); return true; }).slice(0,3);
      const message = items.length ? '可以看看这几款' + f.category.name + '，点开即可比较配置和价格。' : '当前预算范围内暂无' + f.category.name + '，可以调整预算再试。';
      return '<p>' + esc(message) + '</p><div class="chat-products">' + items.map(p => P.productCard(p,true)).join('') + '</div><p class="fine-print">价格为演示数据。</p>';
    }
    if(f.kind==='store' && f.service && (f.city||f.detail)){
      const type=f.service==='repair'?'服务中心':f.service==='visit'?'体验店':'全部';
      const city=cities.includes(f.city)?f.city:'';
      const path='/stores?type='+encodeURIComponent(type)+(city?'&city='+encodeURIComponent(city):'');
      const verb=f.service==='repair'?'查询维修服务中心':f.service==='visit'?'选择门店并预约':'查看门店地址';
      const info=f.service==='repair'?'可查看服务中心的地址，并预约设备检测。':f.service==='visit'?'可查看体验店详情，选择到店时段。':'可查看地址、营业时间和路线。';
      return '<p>'+(f.city&&!city?'该城市暂无演示数据。':city?'已选择'+city+'。':'')+info+'</p><button class="primary-button" data-route="'+esc(path)+'">'+verb+'</button>';
    }
    return '';
  }
  window.LexiangSuggest={reply};
})();
