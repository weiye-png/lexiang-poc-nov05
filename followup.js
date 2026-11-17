// Branches that pause an answer until the user supplies the missing decision.
(() => {
  'use strict';

  const P = window.POC;
  const faults = [
    {name:'无法开机', firstCheck:'先检查插座和适配器的连接，再按一次电源键，观察指示灯、风扇和屏幕分别有什么反应。', match:/无法开机|不能开机|不开机|开不了机|开机不了|无法启动|开机没反应|开不了电脑/, question:'按下电源键后，设备有什么反应？',
      checks:[['指示灯也不亮','先确认插座有电，再检查适配器两端是否插紧。观察接上电源后充电指示灯是否亮起。'],['指示灯亮，屏幕没有画面','调高屏幕亮度并断开扩展坞和外接屏，再观察内置屏幕是否显示开机标志。']]},
    {name:'屏幕显示异常', firstCheck:'先调高亮度。如果有外接显示器，可对比内外屏画面，同时记录异常是从开机时还是进入系统后出现。', match:/黑屏|花屏|闪屏|屏幕异常|屏幕显示异常/, question:'屏幕具体出现了哪种现象？',
      checks:[['屏幕一直黑着','先确认设备指示灯是否亮起，再调高亮度。如有外接屏，可对比两块屏幕是否都有画面。'],['画面闪烁或有条纹','记录闪烁出现的时机。若有外接屏，可对比内外屏画面，确认异常是否只出现在其中一块屏幕上。']]},
    {name:'电池或充电问题', firstCheck:'接好设备支持的适配器，查看电池图标是否提示正在充电，并记录连接前后的电量变化。', match:/充不进电|不充电|无法充电|充不了电|电池异常|充电问题|掉电快/, question:'接上适配器后，你观察到了什么？',
      checks:[['没有充电提示','检查插座和适配器连接，确认使用设备支持的充电接口，再查看系统电池图标。'],['显示已接电，电量不涨','查看系统是否启用了充电阈值或养护模式，并记录当前电量和提示文字。']]},
    {name:'运行缓慢或卡顿', firstCheck:'先保存工作，观察卡顿是否只发生在某个应用。可查看任务管理器的 CPU、内存和磁盘占用，定位负载来源。', match:/运行缓慢|卡顿|运行很慢|电脑很卡|死机/, question:'卡顿主要在什么时候出现？',
      checks:[['只在某个应用里','保存工作后重新打开该应用，记录能够重现卡顿的操作，并对比其他应用是否正常。'],['整个系统都很慢','先保存手头工作，再查看任务管理器中的 CPU、内存和磁盘占用，记下持续占用较高的进程。']]}
  ];
  const unknown = '其他或不确定';
  const power = faults[0];
  const lampOn = '电源指示灯亮起';
  const lampOff = '电源指示灯不亮';
  const fan = '能听到风扇转动';
  const black = '屏幕没有画面';
  const beep = '能听到提示音';

  function powerQuestion() {
    return {kind:'diagnostic', symptom:power.name, stage:'power-signs', checked:[],
      intro:'先观察按下电源键后的表现。指示灯、风扇、屏幕和声音都可以一起记录。',
      question:power.question, options:[lampOn,lampOff,fan,black,beep]};
  }

  function isMulti(d) {
    return d?.stage === 'power-signs' || d?.stage === 'power-check';
  }

  function toggleChoice(d, choice) {
    const picked = new Set(d.checked);
    if (picked.has(choice)) picked.delete(choice);
    else picked.add(choice);
    d.checked = d.options.filter(option => picked.has(option));
  }

  const checks = {
    display: {
      advice:'请先断开扩展坞和外接显示器，调高内置屏幕亮度，再观察开机画面。',
      question:'检查后，内置屏幕显示了什么？',
      results:[['出现开机标志','记下开机标志出现的时间，以及画面随后是否发生变化。'],['屏幕背光亮起','从侧面观察屏幕是否有图像，记录背光亮起的时间。'],['依然没有画面','如果有可用的外接显示器，可连接后对比内外屏的画面，并记录哪块屏幕可以显示。'],['画面闪烁','记下闪烁是在出现开机标志前还是之后。'],['暂时无法检查','方便时记录屏幕是否发亮，以及是否出现过开机标志。']]
    },
    supply: {
      advice:'请检查插座与适配器两端是否接好，再观察充电指示灯。',
      question:'重新接好电源后，充电指示灯有什么变化？',
      results:[['现在亮了','记录指示灯亮起时屏幕是否出现开机标志。'],['仍然不亮','请核对适配器是否与设备匹配，记录接入电源前后的变化。'],['间歇闪烁','记下指示灯闪烁的颜色和节奏。'],['颜色有变化','记录充电灯前后两种颜色，以及变化时的操作。'],['不确定或没有充电灯','可以改为观察接入适配器前后的电源键灯和风扇反应。']]
    },
    sound: {
      advice:'请留意开机提示音的次数、长短和停顿。',
      question:'提示音是怎样响的？',
      results:[['按相同节奏重复','记下每组提示音的长短与次数，连同设备型号一起提供给技术支持。'],['只响一声','接着观察是否出现开机标志，并记录提示音与画面出现的先后。'],['听不清或不确定','可以在下次开机时录下声音，同时记录指示灯和屏幕的表现。']]
    },
    hardware: {
      advice:'请留意开机提示音，同时观察屏幕上的自检信息和机身指示灯。',
      question:'目前是否出现以下硬件异常信号？',
      results:[['内存或硬盘检测报错','拍下完整的自检提示，记下报错的设备和错误代码。'],['开机提示音重复','记下每组提示音的长短、次数和停顿。'],['机身指示灯闪烁','记录指示灯的位置、颜色和闪烁规律。'],['没有发现这些硬件异常','下次开机时，观察画面停留在哪一步。']]
    },
    startup: {
      advice:'请断开非必要外设，接好电源后再按一次电源键，留意屏幕的第一个变化。',
      question:'这次按下电源键后，启动到了哪一步？',
      results:[['进入了系统','先保存工作。可逐一接回外设，观察开机异常是否再次出现。'],['停在开机标志','记下标志停留的时间和屏幕提示，如再次出现，保留提示文字供进一步排查。'],['仍然没有画面','请记录指示灯和风扇是否有反应；如有外接屏，可对比两块屏幕的表现。']]
    },
    next: {
      advice:'可以再补一项观察，帮助判断问题出在哪个环节。',
      question:'你方便补充哪项信息？',
      results:[['屏幕上的文字或图案','请记下开机时最后看到的文字或图案，包括错误代码；如果全程黑屏，也请注明。'],['故障前的设备变化','请回想故障前是否接入新外设、更换电源或更新系统，记下最后一次成功启动的时间。'],['准备联系服务中心','准备设备型号、指示灯状态、风扇和屏幕的表现，以及已经试过的步骤，便于服务人员继续排查。']]
    }
  };

  function checkQuestion(branch, signs, lead) {
    const check = checks[branch];
    return {kind:'diagnostic', symptom:power.name, stage:'power-check', checked:[], branch, signs,
      intro:lead + check.advice, question:check.question, options:check.results.map(([label]) => label)};
  }

  function answerText(d) {
    const parts = Array.isArray(d.selected) ? d.selected : [d.selected];
    return [...parts, d.note].filter(Boolean).join('、');
  }

  function remainingAdvice(d) {
    const steps = {
      display:'如果内置屏仍然没有画面，可以接一台可用的外接显示器，对比两块屏幕是否能显示开机标志。',
      supply:'可以用其他设备确认插座能否供电，再核对适配器型号，观察重新接入电源时充电灯是否有变化。',
      sound:'下次开机时可以录下声音，记下每组长短和停顿，便于结合具体机型查找含义。',
      hardware:'下次启动时，若能看到自检信息，可拍下完整错误代码。若有提示音，可记录每组响声的次数和停顿。',
      startup:'如果能看到开机标志，请留意标志之后的第一条提示。如果一直黑屏，可观察屏幕背光和机身指示灯。',
      next:'如果问题持续出现，可记下设备型号、最后一次正常启动的时间和已试过的操作，供服务人员接着排查。'
    };
    if (d.stage === 'power-signs') return [
      '先断开扩展坞、U 盘等外设，将电脑原配的适配器直接插到可用的插座上，再接好电脑并按一次电源键。',
      '如果指示灯始终不亮，优先检查插座和适配器连接。如果灯亮或风扇转动但仍然黑屏，可以调高亮度，观察是否出现开机标志。'
    ];
    return [steps[d.branch] || steps.startup,
      '如果仍然无法启动，可以把最近一次开机时看到或听到的变化告诉我，我们接着排查。'];
  }

  function afterChoice(d) {
    if (d.stage === 'power-signs') {
      const signs = d.selected;
      let branch = 'startup';
      if (signs.includes(beep) || /自检|硬盘报错|内存报错|提示音|蜂鸣/.test(d.note || '')) branch = 'hardware';
      else if (signs.includes(black) && (signs.includes(lampOn) || signs.includes(fan))) branch = 'display';
      else if (signs.includes(lampOff)) branch = 'supply';
      return checkQuestion(branch, signs, '');
    }
    if (!d.symptom && d.selected === power.name) return powerQuestion();
    return null;
  }

  function repeatCheck(d) {
    return checkQuestion(d.branch, d.signs, '');
  }

  function restorePendingPower(d) {
    if (d?.kind !== 'diagnostic' || d.symptom !== power.name || d.selected || d.cancelled) return;
    if (!d.stage) Object.assign(d, powerQuestion());
    if (isMulti(d)) d.checked ??= [];
  }

  function diagnosticIntent(query) {
    if (/门店|预约|服务中心|报修|送修|维修点|维修地址|到店|附近/.test(query)) return false;
    return /故障|诊断|排查|电脑坏了|电脑出问题|设备坏了/.test(query) || faults.some(fault => fault.match.test(query));
  }

  function prepare(query, previous) {
    if ((previous?.stage === 'power-check' || previous?.stage === 'power-signs' && previous.skipped) &&
        previous.selected && previous.branch !== 'next' &&
        /^(?:还是不行|还是开不了机|还是无法开机|仍然无法开机|仍然不行|继续(?:排查|诊断)?|下一步(?:呢|怎么办)?|然后呢|还有什么办法)[啊呢吗？?。！!]*$/.test(query)) {
      const lead = previous.skipped ? '可以换个角度继续排查。' : '上一步记录了“' + answerText(previous) + '”。';
      return checkQuestion('next', previous.signs || [], lead);
    }
    if (!diagnosticIntent(query)) return null;
    const symptom = faults.find(fault => fault.match.test(query));
    if (symptom === power) return powerQuestion();
    if (symptom) return {kind:'diagnostic', symptom:symptom.name, intro:'先从你提到的“' + symptom.name + '”排查。下一步要根据设备的实际表现来判断。', question:symptom.question, options:[...symptom.checks.map(check => check[0]),unknown]};
    return {kind:'diagnostic', intro:'我们先从设备表现开始排查。供电、显示和系统运行问题需要检查的地方不同。', question:'你的设备出现了哪种故障现象？', options:[...faults.map(fault => fault.name),unknown]};
  }

  function continuation(d) {
    let advice;
    if (d.stage === 'power-check' && Array.isArray(d.selected)) {
      if (d.skipped) return '<p>可以暂时结束这项检查。如果仍然无法开机，告诉我“还是不行”，我们再从其他线索排查。</p>';
      const steps = checks[d.branch]?.results.filter(([label]) => d.selected.includes(label)) || [];
      const lead = d.note ? '<p>已记下你补充的情况：“' + P.escape(d.note) + '”。</p>' : '';
      if (steps.length > 1) return lead + '<p>可以按下面的顺序记录检查结果。</p><ol>' +
        steps.map(([,step]) => '<li>' + P.escape(step) + '</li>').join('') + '</ol>';
      return lead + '<p>' + P.escape(steps[0]?.[1] || '记录这个现象出现的时间，以及当时的指示灯、声音和画面。若仍无法开机，可以继续告诉我观察到的变化。') + '</p>';
    }
    if (d.stage === 'power-check') advice = checks[d.branch]?.results.find(([label]) => label === d.selected)?.[1];
    else if (d.symptom) advice = faults.find(fault => fault.name === d.symptom)?.checks.find(check => check[0] === d.selected)?.[1];
    else advice = faults.find(fault => fault.name === d.selected)?.firstCheck;
    return '<p>' + P.escape(advice || '先记录故障发生时的操作、屏幕提示和指示灯状态。如果能稳定复现，可以带上这些信息预约设备检测。') + '</p>';
  }

  function render(d, shown) {
    const lead = '<p>' + P.escape(d.intro) + '</p>';
    if (d.remainder) {
      const paragraphs = d.remainder.slice(0, shown).map(line => '<p>' + P.escape(line) + '</p>').join('');
      const typing = shown < d.remainder.length ? '<div class="typing" aria-label="正在继续回答"><span></span><span></span><span></span></div>' : '';
      return lead + paragraphs + typing + (d.cancelled ? '<p class="fine-print">本轮回答已中断。</p>' : '');
    }
    if (d.cancelled) return lead + '<p class="fine-print">本轮回答已中断。</p>';
    if (!d.selected) return lead;
    if (d.continued) return lead + '<p>' + P.escape(d.question) + '</p>';
    const selection = '<div class="turn-selection">' + P.escape(d.question) +
      '<strong>已选 · ' + P.escape(d.selected) + '</strong></div>';
    // Old choices stay readable in history, without restoring retired flows.
    return lead + selection + (d.kind === 'diagnostic' ? continuation(d) : '');
  }

  window.LexiangFollowup = {prepare, render, continuation, answerText, remainingAdvice, diagnosticIntent, isMulti, toggleChoice, afterChoice, repeatCheck, restorePendingPower};
})();
