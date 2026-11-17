(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    chevron:'<path d="m6 9 6 6 6-6"/>', history:'<path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7"/><path d="M12 7v5l3 2"/>',
    cart:'<path d="M3 3h2l2.4 12h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    orders:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>',
    atom:'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/><circle cx="12" cy="12" r="1"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 6"/>',
    'arrow-up':'<path d="M12 19V5m-6 6 6-6 6 6"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',external:'<path d="M14 3h7v7m0-7-11 11M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',check:'<path d="m5 12 4 4L19 6"/>',
    laptop:'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="M2 20h20M9 16v4M15 16v4"/>',store:'<path d="M4 10v11h16V10M3 10l2-7h14l2 7Z"/><path d="M9 21v-7h6v7"/>',
    service:'<path d="m14 6 4-4a6 6 0 0 1-7 8L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 8-7l-4 4Z"/>',gift:'<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C4 9 5 1 9 4l3 5c8 0 7-8 3-5Z"/>'
  };
  const icon = name => `<i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.sparkle}</svg></i>`;
  $$('[data-icon]').forEach(el => el.outerHTML = icon(el.dataset.icon));
  const data = window.SITE_DATA;
  const products = data.products.map((p, i) => ({...p,id:i,price:[15999,12999,8999][i],use:['游戏 / 设计创作','商务 / 移动办公','游戏 / 学习'][i],summary:['Ultra 9 · 64GB · RTX 5070 Ti','Ultra 9 · 32GB · 2TB SSD','Ultra 7 · 16GB · RTX 5060'][i]})).concat((window.PORTAL_DATA?.catalog||[]).map((p,i)=>({...p,id:i+3})));
  const storageKey = 'lexiang-poc-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) {}
  let cart = Array.isArray(saved.cart) ? saved.cart.filter(x => Number.isInteger(x.id) && products[x.id] && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 99) : [];
  let orders = Array.isArray(saved.orders) ? saved.orders.filter(x => typeof x.id === 'string' && Array.isArray(x.items) && x.items.every(y => products[y.id] && Number.isInteger(y.qty) && y.qty > 0 && y.qty <= 99)).slice(0,50) : [];
  let history = Array.isArray(saved.history) ? saved.history.filter(x => typeof x.id === 'string' && typeof x.title === 'string' && Array.isArray(x.messages) && x.messages.every(m => ['user','assistant'].includes(m.role) && typeof m.text === 'string')).slice(0,30) : [];
  let category = '首页', activeTab = 'products', conversation = null, busy = false, generation = 0, attachment = null, toastTimer, previousFocus;
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify({cart,orders,history})); } catch (_) { toast('浏览器未允许保存，当前会话仍可继续体验'); } }
  function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3000); }
  function badge() { const count = cart.reduce((a,x)=>a+x.qty,0); $('#cart-count').textContent=count; $('#cart-count').hidden=!count; }
  function productCard(p, compact = false) {
    return `<button class="gallery-card" data-product="${p.id}" aria-label="查看 ${escape(p.pName)}"><div class="gallery-shot"><img src="${escape(p.image)}" alt="${escape(p.pName)}"></div><div class="gallery-meta"><span class="card-badge">${escape(p.tag[0])}</span><strong>${escape(p.pName)}</strong><span class="description">${escape(p.summary)}</span><div class="card-bottom"><span>${compact ? money(p.price)+' · 示例价' : '探索产品'}</span>${icon('arrow')}</div></div></button>`;
  }
  function renderGallery() {
    $$('[data-tab]').forEach(b => {b.classList.toggle('active',b.dataset.tab===activeTab);b.setAttribute('aria-selected',String(b.dataset.tab===activeTab));b.tabIndex=b.dataset.tab===activeTab?0:-1;});
    $('#gallery-grid').innerHTML = activeTab === 'products' ? products.slice(0,3).map(p=>productCard(p)).join('') : data[activeTab].map((p,i)=>`<button class="gallery-card" data-content="${activeTab}:${i}"><div class="gallery-shot"><img src="${escape(p.image)}" alt="${escape(p.title)}"></div><div class="gallery-meta"><span class="card-badge">${escape(Array.isArray(p.badge)?p.badge[0]:p.badge)}</span><strong>${escape(p.title)}</strong><span class="description">${escape(p.desc)}</span><div class="card-bottom"><span>${activeTab==='news'?'阅读动态':'了解活动'}</span>${icon('arrow')}</div></div></button>`).join('');
  }
  const suggestionSets = {
    '首页':['帮我挑一台办公笔记本','游戏本怎么选？','有哪些购机优惠？'],
    '个人及家庭':['适合大学生的笔记本','推荐一台游戏本','有哪些教育优惠？'],
    '中小企业':['为20人团队选办公电脑','中小企业IT解决方案','预约企业采购咨询'],
    '政教及大企业':['了解企业智能体解决方案','校园数字化建设方案','预约企业采购咨询'],
    '品牌':['了解联想的AI创新','查看联想最新动态','了解联想乐享']
  };
  function renderSuggestions() { $('#suggestions').innerHTML = suggestionSets[category].map((x,i)=>`<button type="button" data-ask="${escape(x)}">${icon(['laptop','sparkle','gift'][i])}${escape(x)}</button>`).join(''); }
  function closeModal() { $('#modal').close(); }
  function openModal(title, body, drawer = false) {
    const modal = $('#modal'); previousFocus = document.activeElement;
    modal.classList.toggle('drawer',drawer); $('#modal-title').textContent=title; $('#modal-body').innerHTML=body;
    if (!modal.open) modal.showModal(); modal.scrollTop=0;
  }
  $('#modal').addEventListener('close',()=>previousFocus?.focus?.());
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  function detail(id) {
    const p=products[id];if(!p)return;
    openModal('商品详情',`<img class="detail-image" src="${p.image}" alt="${escape(p.pName)}"><h3 class="detail-title">${escape(p.pName)}</h3><span class="card-badge">${escape(p.tag[0])}</span><p class="detail-description">${escape(p.specs)}</p><div class="price">${money(p.price)}<small>POC 示例价格</small></div><dl class="spec-list"><dt>适合场景</dt><dd>${p.use}</dd><dt>核心配置</dt><dd>${escape(p.summary)}</dd><dt>体验说明</dt><dd>可体验加入购物车、数量调整和模拟下单。</dd></dl><div class="modal-actions"><button class="primary-button" data-add="${id}">${icon('cart')} 加入购物车</button><button class="secondary-button" data-analyze="${id}">让乐享帮我分析</button></div><p class="fine-print">图片与名称参考原站。价格为演示数据，商品信息以官网为准。</p>`);
  }
  function contentDetail(group,index) {
    const p=data[group]?.[index];if(!p)return;
    openModal(group==='news'?'品牌动态':'精选活动',`<img class="detail-image" src="${escape(p.image)}" alt="${escape(p.title)}"><h3 class="detail-title">${escape(p.title)}</h3><p class="article-text">${escape(p.desc)}</p><p class="fine-print">内容摘自参考网站公开展示，活动详情以原站为准。</p><div class="modal-actions"><button class="primary-button" data-ask="${escape(p.query)}">和乐享聊聊 ${icon('arrow')}</button><a class="secondary-button" href="${escape(p.url || p.link || 'https://lexiang.lenovo.com.cn')}" target="_blank" rel="noopener noreferrer">查看原文</a></div>`);
  }
  function add(id) {const p=products[id];if(!p)return;const row=cart.find(x=>x.id===id);if(row&&row.qty>=99){toast('每件商品最多添加99件');return;}if(row)row.qty++;else cart.push({id,qty:1});persist();badge();toast('已加入演示购物车');}
  function cartView() {
    const rows=cart.map(x=>{const p=products[x.id];return `<div class="cart-row"><img src="${p.image}" alt="${escape(p.pName)}"><div class="cart-row-info"><strong>${escape(p.pName)}</strong><span class="unit-price">${money(x.price||p.price)}</span><div class="quantity"><button data-qty="${p.id}:-1" aria-label="减少 ${escape(p.pName)} 数量" ${x.qty<=1?'disabled':''}>−</button><span>${x.qty}</span><button data-qty="${p.id}:1" aria-label="增加 ${escape(p.pName)} 数量" ${x.qty>=99?'disabled':''}>+</button><button class="remove" data-remove="${p.id}">移除</button></div></div></div>`}).join('');
    openModal('我的购物车',cart.length?`<p class="fine-print">演示购物车 · 所有金额均为示例</p>${rows}<div class="cart-total"><span>合计</span><strong>${money(cart.reduce((s,x)=>s+(x.price||products[x.id].price)*x.qty,0))}</strong></div><button class="primary-button wide" data-action="checkout">模拟下单 ${icon('arrow')}</button><p class="fine-print">仅生成本地演示订单，无需支付。</p>`:`<div class="empty">${icon('cart')}<p>购物车还是空的<br>先去发现适合你的好物吧</p><button class="secondary-button" data-action="browse">浏览新品</button></div>`,true);
  }
  function checkout() {
    if(!cart.length)return;
    const order={id:'DEMO-'+Date.now().toString().slice(-8),date:new Date().toLocaleString('zh-CN'),items:cart.map(x=>({...x})),total:cart.reduce((s,x)=>s+(x.price||products[x.id].price)*x.qty,0)};
    orders.unshift(order);orders=orders.slice(0,50);cart=[];persist();badge();
    openModal('演示订单已生成',`<div class="success"><div class="success-icon">${icon('check')}</div><h3>模拟下单成功</h3><p>订单号 ${order.id}<br>共 ${order.items.reduce((a,x)=>a+x.qty,0)} 件商品 · ${money(order.total)}</p><p class="fine-print">这是本地演示订单，未产生真实交易或扣款。</p><div class="modal-actions" style="justify-content:center"><button class="primary-button" data-action="orders">查看我的订单</button><button class="secondary-button" data-action="close">继续体验</button></div></div>`);
  }
  function ordersView() {
    openModal('我的订单',orders.length?orders.map(o=>`<article class="order"><div class="order-head"><span>${escape(o.id)}</span><span>演示订单</span></div>${o.items.map(x=>`<strong>${escape(products[x.id].pName)} × ${x.qty}</strong>`).join('')}<p>${escape(o.date)}</p><div class="cart-total"><span>示例总额</span><strong>${money(o.items.reduce((s,x)=>s+(x.price||products[x.id].price)*x.qty,0))}</strong></div></article>`).join(''):`<div class="empty">${icon('orders')}<p>还没有演示订单<br>添加商品后，即可体验模拟下单</p><button class="secondary-button" data-action="cart">前往购物车</button></div>`,true);
  }
  function historyView() {openModal('历史对话',`<input class="search-field" id="history-search" placeholder="搜索历史对话" aria-label="搜索历史对话"><div id="history-list"></div>`);renderHistory('');}
  function renderHistory(q) {
    const items=history.filter(h=>h.title.toLowerCase().includes(q.toLowerCase()));
    $('#history-list').innerHTML=items.length?items.map(h=>`<div class="history-item"><button class="history-open" data-history="${escape(h.id)}">${escape(h.title)}</button><small>${escape(h.date || '')}</small><button class="icon-button" data-delete-history="${escape(h.id)}" aria-label="删除对话 ${escape(h.title)}">${icon('trash')}</button></div>`).join(''):'<div class="empty"><p>暂无匹配的历史对话</p></div>';
  }
  function profileView() {openModal('个人中心',`<div class="profile-hero"><div class="avatar">${icon('user')}</div><h3>乐享体验官</h3><p>欢迎体验 POC · 无需注册或登录</p></div><div class="profile-options"><button data-action="history">${icon('history')}历史对话</button><button data-action="orders">${icon('orders')}我的订单</button><button data-action="cart">${icon('cart')}购物车</button><button data-action="appointment">${icon('service')}服务预约</button></div><p class="fine-print">对话、购物车和演示订单仅保存在当前浏览器中。</p>`);}
  function appointmentView() {openModal('服务预约 · 演示',`<p class="detail-description">选择想体验的服务，生成一张演示预约单。</p><form id="appointment-form"><div class="form-row"><label for="service-type">服务类型</label><select class="field" id="service-type"><option>电脑检测与维护</option><option>企业采购咨询</option><option>AI 解决方案咨询</option></select></div><div class="form-row"><label for="service-date">期望日期</label><input class="field" type="date" id="service-date" min="${localDate()}" value="${localDate()}" required></div><button class="primary-button wide" type="submit">生成演示预约单</button></form><p class="fine-print">此操作不会向联想提交真实预约。</p>`);}
  function localDate() {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  let introducing = null;
  let resuming = null;
  const defaultPlaceholder = $('#prompt').placeholder;
  function pendingTurn() {
    const last = conversation?.messages.at(-1);
    return last?.decision?.kind === 'diagnostic' && !last.decision.selected && !last.decision.cancelled ? last : null;
  }
  function decisionFor(message) {
    if (message?.replyToDiagnosis !== undefined) return conversation.messages[message.replyToDiagnosis]?.decision;
    return message?.decision;
  }
  function assistantHtml(message) {
    if (message.replyToDiagnosis !== undefined && decisionFor(message)) {
      return window.LexiangFollowup.continuation(decisionFor(message));
    }
    const shown = resuming?.turn === message ? resuming.shown : undefined;
    return message.decision ? window.LexiangFollowup.render(message.decision, shown) : answerHtml(message.text, message.thinking);
  }
  function renderMessages() {
    $('#thread').innerHTML=(conversation?.messages || []).map((m,index)=>m.role==='user'?`<div class="message user"><div class="user-bubble">${escape(m.text)}${m.image&&/^data:image\/(png|jpeg|webp);base64,/.test(m.image)?`<img class="message-image" src="${m.image}" alt="用户上传的演示图片">`:''}</div></div>`:`<div class="message assistant" data-message-index="${index}"><div class="assistant-label">${icon('sparkle')}联想乐享 <small>· 演示回答</small></div><div class="assistant-content">${assistantHtml(m)}</div></div>`).join('');
    $('#thread').scrollTop=$('#thread').scrollHeight;document.dispatchEvent(new CustomEvent('poc:messages'));
  }
  function answerHtml(q, thinking) {
    const extended=window.POC_EXT_ANSWER?.(q);if(extended)return extended;
    const thought=thinking?'<div class="reasoning">已梳理你的需求 · 以下为预设场景演示回答</div>':'';
    let body='';
    const productMatch=products.find(p=>q.toLowerCase().includes(p.pName.toLowerCase())) || products.slice(0,3).find(p=>q.toLowerCase().includes(['y9000','thinkpad','y7000'][p.id]));
    const news=data.news.find(x=>q===x.query);
    const activity=data.activities.find(x=>q===x.query);
    if(news) body=`<h3>${escape(news.title)}</h3><p>${escape(news.desc)}</p><button class="secondary-button" data-content="news:${data.news.indexOf(news)}">查看新闻详情</button>`;
    else if(activity) body=`<h3>${escape(activity.title)}</h3><p>${escape(activity.desc)}。本 POC 展示活动咨询入口；具体资格、权益和有效期请前往原站确认。</p><button class="secondary-button" data-content="activities:${data.activities.indexOf(activity)}">查看活动详情</button>`;
    else if(/预约|维修|检测|维护/.test(q)) body='<p>可以帮你体验服务预约。选择服务类型与日期后，会生成一张演示预约单。</p><button class="primary-button" data-action="appointment">预约服务</button>';
    else if(/门店|附近|地址/.test(q)) body='<p>门店查询可以按城市、距离和服务类型筛选。本 POC 未连接实时门店数据，你可以先体验预约流程。</p><h3>选择你需要的服务</h3><p>产品体验与选购咨询 · 设备检测与维护 · 企业采购咨询</p><button class="secondary-button" data-action="appointment">体验服务预约</button>';
    else if(/解决方案|智能体|数字化|企业|团队/.test(q)) body='<p>我们可以从人员规模、业务场景和现有设备三个方面梳理需求。</p><h3>建议分三步展开</h3><p>① 明确场景：办公协作、知识问答或设备管理。<br>② 小范围验证：选择一个团队，验证效率与使用体验。<br>③ 逐步扩展：结合实际反馈完善部署与服务方案。</p><div class="followups"><button data-action="appointment">预约方案咨询</button><button data-ask="推荐适合办公的电脑">看看办公设备</button></div>';
    else if(/优惠|教育|职场|权益|智享金|活动/.test(q)) body='<p>你可以了解职场与教育购机权益、会员活动等入口。POC 不校验真实资格或余额。</p><div class="followups"><button data-content="activities:0">精选购机活动</button><button data-content="activities:1">职场教育权益</button></div>';
    else if(/新闻|动态|创新|品牌|联想乐享/.test(q)) body='<p>联想乐享围绕智能问答、商品导购和服务连接，提供统一的交互入口。你可以在这里体验提问、查看推荐和模拟下单。</p><div class="followups"><button data-content="news:0">查看品牌动态</button><button data-ask="推荐适合办公的电脑">体验商品导购</button></div>';
    else if(productMatch) body=`<h3>${escape(productMatch.pName)}</h3><p>这款产品适合 ${escape(productMatch.use)} 场景。核心配置为 ${escape(productMatch.summary)}。</p><p>建议结合使用软件、便携需求和预算做选择。以下详情可继续体验加入购物车。</p><div class="chat-products">${productCard(productMatch,true)}</div>`;
    else if(/电脑|笔记本|游戏|商品|办公|学生|对比|预算|推荐/.test(q)) {
      let selected=/游戏/.test(q)?[products[0],products[2]]:/办公|商务|轻薄/.test(q)?[products[1],products[2]]:products.slice(0,3);
      body=`<p>可以。${/办公|商务/.test(q)?'办公场景可以优先关注便携性、内存容量和存储空间。':/游戏/.test(q)?'游戏场景可以优先比较显卡、内存与散热设计。':'选电脑时，建议先确定主要用途、预算和便携需求。'}下面是可进一步了解的机型：</p><div class="chat-products">${selected.map(p=>productCard(p,true)).join('')}</div><p class="fine-print">推荐为固定场景演示，价格为示例。</p><div class="followups"><button data-ask="帮我对比这三款电脑">对比这三款</button><button data-ask="有哪些购机优惠？">看看购机优惠</button></div>`;
      if(/对比/.test(q))body=`<h3>三款机型怎么选？</h3><dl class="spec-list">${products.slice(0,3).map(p=>`<dt>${escape(p.pName.replace('联想',''))}</dt><dd>${escape(p.use)}<br>${escape(p.summary)}<br>${money(p.price)}（示例价格）</dd>`).join('')}</dl><p>重视商务办公可先看 ThinkPad；侧重游戏与创作，可进一步了解拯救者系列。</p><div class="chat-products">${products.slice(0,3).map(p=>productCard(p,true)).join('')}</div>`;
    } else if(q.startsWith('【图片')) body='<p>图片已在本地接收。本 POC 支持图片预览，暂未连接图片识别服务。你可以用文字描述想了解的产品或问题。</p>';
    else body='<p>收到你的问题。这是一个交互 POC，我可以演示商品推荐、购机优惠、企业方案与服务预约。请选择一个场景继续体验：</p><div class="followups"><button data-ask="推荐适合办公的电脑">帮我选电脑</button><button data-ask="了解企业智能体解决方案">了解企业方案</button><button data-action="appointment">预约服务</button></div>';
    return thought+body;
  }
  function setChat(on) {$('#workspace').classList.toggle('chatting',on);$('#welcome').hidden=on;$('#gallery').hidden=on;$('#suggestions').hidden=on;$('#thread').hidden=!on;$('#conversation-bar').hidden=!on;document.dispatchEvent(new CustomEvent('poc:chat',{detail:{on}}));}
  function clearAttachment() {if(attachment?.url)URL.revokeObjectURL(attachment.url);attachment=null;$('#attachment').hidden=true;$('#attachment').innerHTML='';$('#file-input').value='';}
  function home() {generation++;introducing=null;resuming=null;busy=false;conversation=null;setChat(false);$('#thread').innerHTML='';$('#prompt').value='';clearAttachment();updateSend();$('#nav-label').textContent=category+' · 新对话';}
  function updateSend() {
    const d = pendingTurn()?.decision;
    const prompt = $('#prompt');
    const multi = window.LexiangFollowup?.isMulti(d);
    const addingNote = multi && d.otherOpen && !busy;
    prompt.readOnly = !!d && !addingNote;
    prompt.form.classList.toggle('diagnosis-composer', !!multi);
    prompt.form.querySelector('.composer-toolbar').inert = !!d && !addingNote;
    prompt.placeholder = defaultPlaceholder;
    if (d) prompt.placeholder = multi
      ? (addingNote ? '补充其他情况…' : '可多选，也可以补充其他情况')
      : '请在上方选择一项，继续诊断';
    const canSubmit = d ? addingNote && (d.checked.length || prompt.value.trim()) : prompt.value.trim() || attachment;
    $('#send-button').disabled = busy || !canSubmit;
    prompt.style.height = '';
    prompt.style.height = Math.min(150, Math.max(multi ? 36 : 57, prompt.scrollHeight)) + 'px';
    document.dispatchEvent(new Event('poc:draft-change'));
  }
  async function ask(text, repeatCheck) {
    text=String(text||'').trim();if(!text&&attachment)text='【图片】请帮我看看这张图片';if (pendingTurn()) {
      $('#draft-suggest:not([hidden]) button')?.focus();
      return;
    }
    if(!text||busy)return;
    closeModal();setChat(true);busy=true;const stamp=++generation;
    if(!conversation){conversation={id:'chat-'+Date.now(),title:text.slice(0,60),date:new Date().toLocaleDateString('zh-CN'),messages:[]};history.unshift(conversation);history=history.slice(0,30);}
    const previous = decisionFor(conversation.messages.at(-1));
    conversation.messages.push({role:'user',text,...attachment?.data?{image:attachment.data}:{}});$('#nav-label').textContent=conversation.title.slice(0,14);$('#prompt').value='';clearAttachment();updateSend();renderMessages();
    const decision = repeatCheck?.stage === 'power-check' ? window.LexiangFollowup.repeatCheck(repeatCheck) :
      window.LexiangFollowup.prepare(text, previous);
    if (decision) return presentDiagnosis(text, decision, stamp);
    const loading=document.createElement('div');loading.className='message';loading.innerHTML=`<div class="assistant-label">${icon('sparkle')}联想乐享</div><div class="assistant-content"><div class="typing" aria-label="正在生成演示回复"><span></span><span></span><span></span></div></div>`;$('#thread').append(loading);$('#thread').scrollTop=$('#thread').scrollHeight;
    persist();await new Promise(r=>setTimeout(r,$('#thinking').getAttribute('aria-pressed')==='true'?850:350));if(stamp!==generation)return;
    conversation.messages.push({role:'assistant',text,thinking:$('#thinking').getAttribute('aria-pressed')==='true'});busy=false;renderMessages();persist();updateSend();$('#prompt').focus();
  }
  async function presentDiagnosis(text, decision, stamp) {
    const message = {role:'assistant', text, decision};
    conversation.messages.push(message);
    introducing = message;
    persist();
    renderMessages();
    updateSend();
    await new Promise(resolve => setTimeout(resolve, 650));
    if (stamp !== generation) return;
    introducing = null;
    busy = false;
    renderMessages();
    updateSend();
    if (!$('#modal').open && [document.body, $('#prompt'), $('#send-button')].includes(document.activeElement))
      $('#draft-suggest:not([hidden]) [data-pick]')?.focus({preventScroll:true});
  }
  function finishChoice(turn, choice) {
    const d = turn.decision;
    d.selected = choice;
    const next = window.LexiangFollowup.afterChoice(d);
    if (next) {
      d.continued = true;
      conversation.messages.push({role:'user', text:choice});
      busy = true;
      presentDiagnosis(choice, next, ++generation);
      return;
    }
    persist();
    renderMessages();
    updateSend();
    $('#prompt').focus();
  }
  function openDiagnosisNote(turn) {
    if (!turn || turn !== pendingTurn() || busy || !window.LexiangFollowup.isMulti(turn.decision)) return;
    turn.decision.otherOpen = true;
    persist();
    updateSend();
    $('#prompt').focus();
  }
  async function resumeDiagnosis(turn) {
    const stamp = ++generation;
    const d = turn.decision;
    d.remainder = window.LexiangFollowup.remainingAdvice(d);
    resuming = {turn, shown:0};
    busy = true;
    persist();
    updateSend();
    const thread = $('#thread');
    const content = thread.lastElementChild.querySelector('.assistant-content');
    function appendStep() {
      content.innerHTML = assistantHtml(turn);
      thread.scrollTop = thread.scrollHeight;
      document.dispatchEvent(new Event('poc:messages'));
    }
    appendStep();
    for (let i = 1; i <= d.remainder.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 340));
      if (stamp !== generation) return;
      resuming.shown = i;
      appendStep();
    }
    resuming = null;
    busy = false;
    updateSend();
    if (!$('#modal').open && !$('#prompt').value) $('#prompt').focus();
  }
  function confirmDiagnosis(turn, skip = false) {
    if (!turn || turn !== pendingTurn() || busy) return;
    const d = turn.decision;
    const followup = window.LexiangFollowup;
    if (!followup.isMulti(d)) return;
    const note = d.otherOpen ? $('#prompt').value.trim() : '';
    if (!skip && !d.checked.length && !note) return;
    d.selected = skip ? [] : [...d.checked];
    d.note = skip ? '' : note;
    d.skipped = skip;
    delete d.checked;
    delete d.otherOpen;
    delete d.noteDraft;
    $('#prompt').value = '';
    if (skip) {
      resumeDiagnosis(turn);
      return;
    }
    d.continued = true;
    const report = followup.answerText(d);
    const questionIndex = conversation.messages.length - 1;
    conversation.messages.push({role:'user', text:report});
    const next = followup.afterChoice(d);
    if (next) {
      busy = true;
      presentDiagnosis(report, next, ++generation);
      return;
    }
    conversation.messages.push({role:'assistant', text:report, replyToDiagnosis:questionIndex});
    persist();
    renderMessages();
    updateSend();
    $('#prompt').focus();
  }
  function selectDiagnosis(turn, index) {
    if (!turn || turn !== pendingTurn() || busy || !Number.isInteger(index)) return;
    const choice = turn.decision.options[index];
    if (typeof choice !== 'string') return;
    if (window.LexiangFollowup.isMulti(turn.decision)) {
      window.LexiangFollowup.toggleChoice(turn.decision, choice);
      updateSend();
      persist();
      return;
    }
    finishChoice(turn, choice);
  }
  function stop() {
    generation++;
    if (resuming) {
      const d = resuming.turn.decision;
      d.remainder = d.remainder.slice(0, resuming.shown);
      d.cancelled = true;
      resuming = null;
    }
    if (introducing) {
      introducing.decision.cancelled = true;
      introducing = null;
    }
    busy = false;
    persist();
    updateSend();
    renderMessages();
    toast('已停止生成');
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.dataset.action){const actions={home,history:historyView,cart:cartView,orders:ordersView,profile:profileView,close:closeModal,checkout,appointment:appointmentView,browse:()=>{closeModal();home();activeTab='products';renderGallery();$('#gallery').scrollIntoView({behavior:'smooth'});}};actions[b.dataset.action]?.();}
    if(b.dataset.product!==undefined)detail(Number(b.dataset.product));
    if(b.dataset.content){const[g,i]=b.dataset.content.split(':');contentDetail(g,Number(i));}
    if(b.dataset.add!==undefined)add(Number(b.dataset.add));
    if(b.dataset.analyze!==undefined)ask('帮我分析'+products[Number(b.dataset.analyze)].pName+'怎么样');
    if(b.dataset.ask)ask(b.dataset.ask);
    if(b.dataset.tab){activeTab=b.dataset.tab;renderGallery();}
    if(b.dataset.category){category=b.dataset.category;$('#nav-menu').hidden=true;$('#nav-toggle').setAttribute('aria-expanded','false');home();renderSuggestions();$('#welcome-subtitle').textContent=category==='首页'?'从灵感到选择，让每一个需求，都有更好的答案。':`为${category}，发现合适的产品、服务与解决方案。`;}
    if(b.dataset.scope){const map={'商品导购':'推荐一款适合我的笔记本电脑','解决方案':'了解企业智能体解决方案','门店查询':'帮我查询附近的联想门店'};if(b.dataset.scope==='服务预约')appointmentView();else{$('#prompt').value=map[b.dataset.scope];$('#prompt').focus();updateSend();}}
    if(b.dataset.qty){const[id,delta]=b.dataset.qty.split(':').map(Number);const row=cart.find(x=>x.id===id);if(row){row.qty=Math.min(99,Math.max(1,row.qty+delta));persist();badge();cartView();}}
    if(b.dataset.remove!==undefined){cart=cart.filter(x=>x.id!==Number(b.dataset.remove));persist();badge();cartView();}
    if(b.dataset.history){generation++;introducing=null;resuming=null;busy=false;conversation=history.find(x=>x.id===b.dataset.history);if(conversation){window.LexiangFollowup.restorePendingPower(conversation.messages.at(-1)?.decision);closeModal();setChat(true);renderMessages();$('#nav-label').textContent=conversation.title.slice(0,14);$('#prompt').value=pendingTurn()?.decision.noteDraft || '';clearAttachment();updateSend();}}
    if(b.dataset.deleteHistory){history=history.filter(x=>x.id!==b.dataset.deleteHistory);if(conversation?.id===b.dataset.deleteHistory)home();persist();renderHistory($('#history-search').value);}
  });
  document.addEventListener('input',e=>{if(e.target.id==='history-search')renderHistory(e.target.value);});
  function submitComposer() {
    const turn = pendingTurn();
    if (turn?.decision.otherOpen) confirmDiagnosis(turn);
    else ask($('#prompt').value);
  }
  $('#composer').addEventListener('submit',e=>{e.preventDefault();submitComposer();});
  $('#prompt').addEventListener('input',()=>{
    const d = pendingTurn()?.decision;
    if (d?.otherOpen) {
      d.noteDraft = $('#prompt').value;
      persist();
    }
    updateSend();
  });
  $('#prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();submitComposer();}});
  $('#thinking').addEventListener('click',()=>{const on=$('#thinking').getAttribute('aria-pressed')!=='true';$('#thinking').setAttribute('aria-pressed',String(on));$('#thinking').classList.toggle('active',on);});
  $('#nav-toggle').addEventListener('click',()=>{const open=$('#nav-menu').hidden;$('#nav-menu').hidden=!open;$('#nav-toggle').setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',e=>{if(!e.target.closest('.navigation')){$('#nav-menu').hidden=true;$('#nav-toggle').setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#nav-menu').hidden=true;$('#nav-toggle').setAttribute('aria-expanded','false');}if(e.target.matches('[data-tab]')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=$$('[data-tab]');let index=tabs.indexOf(e.target);index=(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activeTab=tabs[index].dataset.tab;renderGallery();tabs[index].focus();}});
  $('#attach-button').addEventListener('click',()=>$('#file-input').click());
  $('#file-input').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){toast('请选择5MB以内的 PNG、JPG 或 WebP 图片');e.target.value='';return;}clearAttachment();attachment={url:URL.createObjectURL(file),name:file.name,file};$('#attachment').innerHTML=`<img src="${attachment.url}" alt="本地图片预览"><span>${escape(file.name)} · 仅本地预览</span><button type="button" id="remove-attachment" aria-label="移除图片">${icon('close')}</button>`;$('#attachment').hidden=false;$('#remove-attachment').onclick=()=>{clearAttachment();updateSend();};updateSend();});
  document.addEventListener('submit',e=>{if(e.target.id==='appointment-form'){e.preventDefault();const service=$('#service-type').value,date=$('#service-date').value;if(!date||date<localDate()){toast('请选择今天或之后的日期');return;}openModal('演示预约单',`<div class="success"><div class="success-icon">${icon('check')}</div><h3>预约信息已准备好</h3><p>${escape(service)}<br>期望日期：${escape(date)}</p><p class="fine-print">此预约单仅供演示，未提交到真实服务系统。</p><button class="primary-button" data-action="close">完成体验</button></div>`);}});
  const words=['找商品','找门店','找服务','找解决方案'];let wordIndex=0;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(document.hidden||$('#welcome').hidden)return;const el=$('#rotating-word');el.classList.add('changing');setTimeout(()=>{el.textContent=words[++wordIndex%words.length];el.classList.remove('changing');},250);},4000);
  window.POC={icon,escape,$,$$,products,productCard,data,ask,home,openModal,closeModal,toast,add,cartView,ordersView,historyView,profileView,appointmentView,renderMessages,persist,badge,updateSend,localDate,detail,contentDetail,get attachment(){return attachment;},get busy(){return busy;},selectDiagnosis,confirmDiagnosis,openDiagnosisNote,decisionFor,get pendingDiagnosis(){return pendingTurn();},get orders(){return orders;},get cart(){return cart;},get conversation(){return conversation;},get history(){return history;},setCategory(value){category=value;home();renderSuggestions();},get category(){return category;},stop};
  badge();renderSuggestions();renderGallery();updateSend();
})();
