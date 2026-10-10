(() => {
  'use strict';
  const KEY = 'daily-growth-records-v1';
  const $ = (id) => document.getElementById(id);
  let activeSmoking = 'na';
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const defaults = () => ({
    weight:'', breakfast:false, lunch:false, dinner:false, snack:false,
    activity:'rest', smoking:'na', craving:0, bedtime:'00:30', wakeTime:'09:00',
    mood:'ok', notes:''
  });
  function getRecords() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function putRecords(records) {
    localStorage.setItem(KEY, JSON.stringify(records));
  }
  function readForm() {
    return {
      weight:$('weight').value.trim(),
      breakfast:$('breakfast').checked, lunch:$('lunch').checked,
      dinner:$('dinner').checked, snack:$('snack').checked,
      activity:$('activity').value, smoking:activeSmoking,
      craving:Number($('craving').value), bedtime:$('bedtime').value,
      wakeTime:$('wakeTime').value, mood:$('mood').value,
      notes:$('notes').value.trim()
    };
  }
  function fillForm(f) {
    $('weight').value=f.weight || '';
    ['breakfast','lunch','dinner','snack'].forEach(k=>$(k).checked=!!f[k]);
    $('activity').value=f.activity || 'rest';
    activeSmoking=f.smoking || 'na';
    $('craving').value=Number(f.craving || 0);
    $('cravingValue').textContent=`${$('craving').value} / 5`;
    $('bedtime').value=f.bedtime || '00:30';
    $('wakeTime').value=f.wakeTime || '09:00';
    $('mood').value=f.mood || 'ok';
    $('notes').value=f.notes || '';
    renderSmoking();
    updateComputed();
  }
  function renderSmoking() {
    document.querySelectorAll('#smokingChoices .choice').forEach(b=>b.classList.toggle('active',b.dataset.value===activeSmoking));
  }
  function sleepText(bed,wake) {
    if(!bed||!wake) return '—';
    const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
    let diff=mins(wake)-mins(bed); if(diff<=0) diff+=1440;
    if(diff>=1440) return '—';
    return `${Math.floor(diff/60)}小时${diff%60}分`;
  }
  function completion(f) {
    const items=[
      !!(f.breakfast||f.lunch||f.dinner), !!f.weight,
      f.activity!=='rest', f.smoking!=='na',
      !!f.bedtime&&!!f.wakeTime, !!(f.notes||'').trim()
    ];
    return Math.round(items.filter(Boolean).length/items.length*100);
  }
  function updateComputed() {
    const f=readForm();
    $('sleepDuration').textContent=sleepText(f.bedtime,f.wakeTime);
    $('completion').textContent=`${completion(f)}%`;
    $('progressFill').style.width=`${completion(f)}%`;
  }
  function loadToday() {
    const key=todayKey(), d=new Date();
    $('dateLabel').textContent=`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · 把小事坚持下来`;
    fillForm({...defaults(),...(getRecords()[key]||{})});
    $('saveStatus').textContent=getRecords()[key]?'今天的记录已载入':'记录保存在当前设备的浏览器中';
  }
  function saveToday() {
    const records=getRecords();
    records[todayKey()]={...readForm(),updatedAt:new Date().toISOString()};
    try {
      putRecords(records);
      $('saveStatus').textContent=`已保存 · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`;
      toast('今日记录已保存');
      renderHistory();
    } catch(e) {
      alert('保存失败，可能是设备存储空间不足。请先导出备份或清理空间。');
    }
  }
  function toast(msg) {
    const el=$('saveStatus'); el.textContent=msg;
    setTimeout(()=>{ if(el.textContent===msg) el.textContent='记录保存在当前设备的浏览器中'; },2400);
  }
  function renderHistory() {
    const data=getRecords(), keys=Object.keys(data).sort((a,b)=>b.localeCompare(a));
    $('totalDays').textContent=keys.length;
    const weighted=keys.filter(k=>data[k].weight!==''&&data[k].weight!=null);
    $('latestWeight').textContent=weighted.length?data[weighted[0]].weight:'—';
    $('smokeFreeDays').textContent=keys.filter(k=>data[k].smoking==='no').length;
    if(weighted.length) {
      const list=weighted.slice(0,7).reverse();
      $('weightTrend').textContent='最近体重记录：'+list.map(k=>`${k.slice(5)} ${data[k].weight}kg`).join('　·　');
    } else $('weightTrend').textContent='记录几次体重后，这里会显示最近的体重记录。';
    const host=$('historyList');
    host.innerHTML='';
    if(!keys.length) {
      const empty=document.createElement('div'); empty.className='card empty'; empty.textContent='这里还空着。保存今天的打卡后，记录会显示在这里。';host.appendChild(empty);return;
    }
    const activity={rest:'休息',light:'轻活动',gentle:'温和训练'};
    const smoking={no:'未吸烟',yes:'有吸烟',na:'未记录吸烟'};
    const mood={low:'有点低落',ok:'一般',good:'状态不错'};
    keys.forEach(date=>{
      const f=data[date], item=document.createElement('article'); item.className='history-item';
      const head=document.createElement('div');head.className='record-head';
      const left=document.createElement('div');
      const dateEl=document.createElement('div');dateEl.className='record-date';dateEl.textContent=date;
      const sub=document.createElement('div');sub.className='record-sub';sub.textContent=`完成度 ${completion(f)}% · ${mood[f.mood]||'未记录状态'}`;
      left.append(dateEl,sub);
      const weight=document.createElement('div');weight.className='record-weight';weight.textContent=f.weight?`${f.weight} kg`:'未记体重';
      head.append(left,weight);item.appendChild(head);
      const tags=document.createElement('div');tags.className='tags';
      const meals=['breakfast','lunch','dinner','snack'].filter(k=>f[k]).length;
      [ `${meals}/4 项饮食`, activity[f.activity]||'未记录活动', smoking[f.smoking]||'未记录', `睡眠 ${sleepText(f.bedtime,f.wakeTime)}` ].forEach(t=>{const s=document.createElement('span');s.className='tag';s.textContent=t;tags.appendChild(s);});
      item.appendChild(tags);
      if(f.notes){const note=document.createElement('div');note.className='record-notes';note.textContent=f.notes;item.appendChild(note);}
      const row=document.createElement('div');row.className='delete-row';const del=document.createElement('button');del.className='delete';del.textContent='删除记录';del.addEventListener('click',()=>{
        if(confirm(`确定删除 ${date} 的记录吗？此操作无法撤销。`)){const all=getRecords();delete all[date];putRecords(all);renderHistory();if(date===todayKey())loadToday();}
      });row.appendChild(del);item.appendChild(row);host.appendChild(item);
    });
  }
  function showTab(tab) {
    $('todayView').hidden=tab!=='today';$('historyView').hidden=tab!=='history';
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='history')renderHistory();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function exportData() {
    const payload={app:'daily-growth-checkin',version:1,exportedAt:new Date().toISOString(),records:getRecords()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download=`daily-growth-backup-${todayKey()}.json`;
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    toast('已生成备份文件；请确认保存到“文件”App');
  }
  function importData(file) {
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const parsed=JSON.parse(reader.result);
        const incoming=parsed.records;
        if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw new Error('format');
        const current=getRecords();
        Object.keys(incoming).forEach(date=>{
          if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!incoming[date]||typeof incoming[date]!=='object')return;
          current[date]={...defaults(),...incoming[date]};
        });
        putRecords(current);loadToday();renderHistory();toast('备份导入成功，已有日期已合并');
        alert('导入完成。相同日期的记录已用备份文件覆盖。');
      }catch(e){alert('无法读取这个备份文件。请选择本工具导出的 JSON 文件。');}
      $('importFile').value='';
    };
    reader.onerror=()=>alert('读取文件失败，请重试。');
    reader.readAsText(file);
  }
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  document.querySelectorAll('#smokingChoices .choice').forEach(b=>b.addEventListener('click',()=>{activeSmoking=b.dataset.value;renderSmoking();updateComputed();}));
  ['weight','breakfast','lunch','dinner','snack','activity','craving','bedtime','wakeTime','mood','notes'].forEach(id=>$(id).addEventListener('input',updateComputed));
  $('craving').addEventListener('input',()=>$('cravingValue').textContent=`${$('craving').value} / 5`);
  $('saveBtn').addEventListener('click',saveToday);
  ['exportBtn','exportBtn2'].forEach(id=>$(id).addEventListener('click',exportData));
  ['importBtn','importBtn2'].forEach(id=>$(id).addEventListener('click',()=>$('importFile').click()));
  $('importFile').addEventListener('change',e=>importData(e.target.files[0]));
  loadToday();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();