const TIER = {5:'var(--t5)',4:'var(--t4)',3:'var(--t3)',2:'var(--t2)',1:'var(--t1)',0:'var(--t0)'};

let DATA;
let VIEW;
let DEFAULT_PARAMS;
let CURRENT_PARAMS;

const CONTROL_GROUPS = [
  {
    title: 'Championship',
    fields: [
      ['All-Ireland champion', 'all_ireland_stage_points.champion'],
      ['Runner-up', 'all_ireland_stage_points.runner_up'],
      ['Beaten semi-finalist', 'all_ireland_stage_points.semi_final_loser'],
      ['Beaten quarter-finalist', 'all_ireland_stage_points.quarter_final_loser'],
      ['Super 8s group exit', 'all_ireland_stage_points.super8_group_exit'],
      ['Group / preliminary-QF exit', 'all_ireland_stage_points.prelim_qf_loser'],
      ['Round-robin group exit', 'all_ireland_stage_points.group_exit'],
    ],
  },
  {
    title: 'Provincial route',
    fields: [
      ['Provincial champion', 'provincial_points.champion'],
      ['Provincial runner-up', 'provincial_points.runner_up'],
      ['Use provincial bracket credit', 'provincial_bracket_credit.enabled', 'toggle'],
      ['Provincial finalist = QF', 'provincial_bracket_credit.count_provincial_final_as_qf', 'toggle'],
      ['Provincial semi-finalist = prelim', 'provincial_bracket_credit.count_provincial_semifinal_as_prelim', 'toggle'],
    ],
  },
  {
    title: 'National League',
    fields: [
      ['Division 1 champion', 'league_points.champion'],
      ['Division 1 runner-up', 'league_points.runner_up'],
      ['Division 1 semi-finalist', 'league_points.semi_final'],
      ['Lower-division title', 'league_points.lower_division'],
    ],
  },
];

fetch('data.json').then(r=>r.json()).then(d=>{DATA=d;init();})
  .catch(()=>{document.getElementById('standings-table').innerHTML='<p>Could not load data.json</p>';});

function init(){
  DEFAULT_PARAMS = clone(DATA.params);
  CURRENT_PARAMS = clone(DEFAULT_PARAMS);
  VIEW = recompute(CURRENT_PARAMS);
  buildPointControls();
  renderAll();
  document.getElementById('updated').textContent = DATA.meta.updated;
  document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section.panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(b.dataset.t).classList.add('active');
    if(b.dataset.t==='chart' && window._chart) window._chart.resize();
  });
}

function renderAll(){
  buildLegend();
  buildStats();
  buildModelSummary();
  buildStandings();
  buildMatrix();
  buildChart();
  buildEras();
  buildHonour();
}

function clone(obj){return JSON.parse(JSON.stringify(obj));}
function getPath(obj,path){return path.split('.').reduce((o,k)=>o&&o[k],obj);}
function setPath(obj,path,value){
  const parts=path.split('.');
  const last=parts.pop();
  const target=parts.reduce((o,k)=>o[k],obj);
  target[last]=value;
}
function fmtPts(v){
  const n=Number(v)||0;
  return Number.isInteger(n)?String(n):String(Math.round(n*10)/10);
}
function decadeOf(y){return Math.floor(y/10)*10;}
function uniqueValues(vals){return [...new Set(vals.map(fmtPts))].join(' / ');}

function maxChampPoint(){
  const ai=Object.values(CURRENT_PARAMS.all_ireland_stage_points||{}).map(Number);
  const prov=Object.values(CURRENT_PARAMS.provincial_points||{}).map(Number);
  return Math.max(1,...ai,...prov);
}
function maxCellPoint(){
  const league=mxLeague?Object.values(CURRENT_PARAMS.league_points||{}).map(Number):[0];
  return Math.max(1,maxChampPoint()+Math.max(...league));
}
function tierFor(value,max=maxChampPoint()){
  const n=Number(value)||0;
  if(n<=0)return 0;
  return Math.max(1,Math.min(5,Math.ceil((n/max)*5)));
}
function cellColor(value,max=maxChampPoint()){return TIER[tierFor(value,max)];}
function cellTextColor(value,max=maxChampPoint()){return Number(value)>=(max*.55)?'#fff':'#456';}

function scorePlacement(row,params){
  const aiPts=params.all_ireland_stage_points||{};
  const provPts=params.provincial_points||{};
  const pbc=params.provincial_bracket_credit||{};
  const pbcOn=!!pbc.enabled && (pbc.eras||[]).includes(row.format);
  const pProv=row.prov_finish?Number(provPts[row.prov_finish]||0):0;
  const pAi=row.ai_finish?Number(aiPts[row.ai_finish]||0):0;
  let pBracket=0;
  if(pbcOn && row.prov_finish==='runner_up' && pbc.count_provincial_final_as_qf){
    pBracket=Number(aiPts[pbc.final_loser_tier]||0);
  }
  if(pbcOn && row.prov_finish==='semi_final' && pbc.count_provincial_semifinal_as_prelim){
    pBracket=Math.max(pBracket,Number(aiPts[pbc.semifinal_loser_tier]||0));
  }
  return Math.max(pProv,pAi,pBracket);
}

function recompute(params){
  const records=new Map();
  const ensure=county=>{
    if(!records.has(county)){
      records.set(county,{
        county,total:0,league:0,combined:0,years_scoring:0,avg_all:0,avg_scoring:0,
        by_era:{},by_year:{},lg_by_year:{},best:0,_scoringYears:new Set()
      });
    }
    return records.get(county);
  };
  DATA.standings.forEach(r=>ensure(r.county));

  const yearTotals={};
  const eraTotals={};
  DATA.years.forEach(y=>{yearTotals[y]=0;});
  DATA.eras.forEach(e=>{eraTotals[e.key]=0;});

  (DATA.placements||[]).forEach(row=>{
    const p=scorePlacement(row,params);
    const rec=ensure(row.county);
    rec.total+=p;
    rec.by_year[row.year]=p;
    rec.by_era[row.format]=(rec.by_era[row.format]||0)+p;
    rec.best=Math.max(rec.best,p);
    if(p>0)rec._scoringYears.add(row.year);
    yearTotals[row.year]=(yearTotals[row.year]||0)+p;
    eraTotals[row.format]=(eraTotals[row.format]||0)+p;
  });

  const lp=params.league_points||{};
  (DATA.league_results||[]).forEach(row=>{
    const p=Number(lp[row.finish]||0);
    if(!p)return;
    const rec=ensure(row.county);
    rec.lg_by_year[row.year]=Math.max(rec.lg_by_year[row.year]||0,p);
  });

  const standings=[...records.values()].map(rec=>{
    rec.years_scoring=rec._scoringYears.size;
    delete rec._scoringYears;
    rec.league=Object.values(rec.lg_by_year).reduce((s,v)=>s+v,0);
    rec.combined=rec.total+rec.league;
    rec.avg_all=Number((rec.total/DATA.meta.n_years).toFixed(2));
    rec.avg_scoring=rec.years_scoring?Number((rec.total/rec.years_scoring).toFixed(2)):0;
    return rec;
  }).sort((a,b)=>b.total-a.total||a.county.localeCompare(b.county));

  standings.forEach((r,i)=>{r.rank=i+1;});
  return {
    standings,
    year_totals:yearTotals,
    era_totals:eraTotals,
    meta:{grand_total:Object.values(yearTotals).reduce((s,v)=>s+v,0)}
  };
}

function buildPointControls(){
  const el=document.getElementById('point-controls');
  el.innerHTML=CONTROL_GROUPS.map(group=>{
    const fields=group.fields.map(([label,path,type])=>{
      const id='ctrl-'+path.replace(/\W/g,'-');
      if(type==='toggle'){
        return `<label class="toggle-field" for="${id}">
          <input id="${id}" type="checkbox" data-path="${path}" ${getPath(CURRENT_PARAMS,path)?'checked':''}>
          <span>${label}</span>
        </label>`;
      }
      return `<div class="score-field">
        <label for="${id}">${label}</label>
        <input id="${id}" type="number" min="0" step="0.5" inputmode="decimal"
          data-path="${path}" value="${getPath(CURRENT_PARAMS,path)}">
      </div>`;
    }).join('');
    return `<div class="control-group"><h3>${group.title}</h3>${fields}</div>`;
  }).join('');

  el.addEventListener('input',e=>{
    const target=e.target.closest('[data-path]');
    if(!target)return;
    if(target.type==='checkbox')return;
    if(target.type==='number' && target.value==='')return;
    const value=target.type==='checkbox'?target.checked:Number(target.value);
    if(target.type==='number' && !Number.isFinite(value))return;
    setPath(CURRENT_PARAMS,target.dataset.path,value);
    VIEW=recompute(CURRENT_PARAMS);
    renderAll();
  });
  el.addEventListener('change',e=>{
    const target=e.target.closest('input[type=checkbox][data-path]');
    if(!target)return;
    setPath(CURRENT_PARAMS,target.dataset.path,target.checked);
    VIEW=recompute(CURRENT_PARAMS);
    renderAll();
  });
  document.getElementById('reset-points').onclick=()=>{
    CURRENT_PARAMS=clone(DEFAULT_PARAMS);
    syncPointControls();
    VIEW=recompute(CURRENT_PARAMS);
    renderAll();
  };
}

function syncPointControls(){
  document.querySelectorAll('#point-controls [data-path]').forEach(input=>{
    const val=getPath(CURRENT_PARAMS,input.dataset.path);
    if(input.type==='checkbox')input.checked=!!val;
    else input.value=val;
  });
}

function modelChanged(){return JSON.stringify(CURRENT_PARAMS)!==JSON.stringify(DEFAULT_PARAMS);}

function buildModelSummary(){
  const el=document.getElementById('model-summary');
  const top=VIEW.standings[0];
  const delta=VIEW.meta.grand_total-DATA.meta.grand_total;
  const changed=modelChanged();
  el.innerHTML=[
    `<span class="model-pill ${changed?'changed':''}">${changed?'Custom model':'Default model'}</span>`,
    `<span class="model-pill">${fmtPts(VIEW.meta.grand_total)} championship points distributed</span>`,
    `<span class="model-pill">${top.county} leads on ${fmtPts(top.total)}</span>`,
    `<span class="model-pill">${delta===0?'No total change':`${delta>0?'+':''}${fmtPts(delta)} vs default`}</span>`,
  ].join('');
}

function buildLegend(){
  const el=document.getElementById('legend');
  const ai=CURRENT_PARAMS.all_ireland_stage_points||{};
  const lp=CURRENT_PARAMS.league_points||{};
  const tiers=[
    [5,fmtPts(ai.champion),'All-Ireland champion'],
    [4,fmtPts(ai.runner_up),'Runner-up'],
    [3,fmtPts(ai.semi_final_loser),'Beaten semi-finalist'],
    [2,uniqueValues([ai.quarter_final_loser,ai.super8_group_exit]),'QF / Super 8 exit'],
    [1,uniqueValues([ai.prelim_qf_loser,ai.group_exit]),'Group / prelim exit'],
  ];
  el.innerHTML=tiers.map(([t,v,lab])=>
    `<span class="chip"><span class="dot" style="background:${TIER[t]}"></span><b>${v}</b>&nbsp;${lab}</span>`
  ).join('');
  const lg=[[lp.champion,'League title'],[lp.runner_up,'League final'],
            [lp.semi_final,'League semi'],[lp.lower_division,'Lower div title']];
  el.insertAdjacentHTML('beforeend','<span class="chip sep">National League</span>');
  lg.forEach(([v,lab])=>{
    if(v==null)return;
    el.insertAdjacentHTML('beforeend',
      `<span class="chip lg"><span class="dot gold"></span><b>${fmtPts(v)}</b>&nbsp;${lab}</span>`);
  });
}

function buildStats(){
  const top=VIEW.standings[0], mt=DATA.meta.most_titles;
  const combined=[...VIEW.standings].sort((a,b)=>b.combined-a.combined||a.county.localeCompare(b.county))[0];
  const cards=[
    [DATA.meta.n_years,`championships (${DATA.meta.span})`],
    [`${top.county} ${fmtPts(top.total)}`,'championship points leader'],
    [`${combined.county} ${fmtPts(combined.combined)}`,'combined leader'],
    [`${mt.county} ${mt.n}`,'most All-Ireland titles'],
    [DATA.meta.n_doubles,'league + championship doubles'],
  ];
  document.getElementById('stats').innerHTML=cards.map(([n,k])=>
    `<div class="stat"><div class="n">${n}</div><div class="k">${k}</div></div>`).join('');
}

let sortKey='total', sortDir=-1;
function buildStandings(){
  const lp=CURRENT_PARAMS.league_points||{};
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null)e.textContent=fmtPts(v);};
  set('lp-champ',lp.champion); set('lp-ru',lp.runner_up); set('lp-minor',lp.semi_final);
  const cols=[
    ['rank','#','static'],['county','County','l'],['total','Championship',''],
    ['league','League',''],['combined','Combined',''],
    ['years_scoring','Yrs',''],['avg_scoring','Avg / scoring yr',''],['best','Best','']
  ];
  const rows=[...VIEW.standings].sort((a,b)=>{
    const v=(a[sortKey]>b[sortKey]?1:a[sortKey]<b[sortKey]?-1:0);
    return v*sortDir||a.county.localeCompare(b.county);
  });
  let h='<div class="card"><table><thead><tr>';
  cols.forEach(([k,lab,cls])=>{
    const arr=(k===sortKey)?(sortDir<0?'v':'^'):'';
    h+=`<th class="${cls||''}" data-k="${k}">${lab} <span class="arr">${arr}</span></th>`;
  });
  h+='</tr></thead><tbody>';
  rows.forEach((r,i)=>{
    const hot=k=>k===sortKey?' style="font-weight:700;color:var(--green-dark)"':'';
    h+=`<tr><td class="rank">${i+1}</td><td class="l county">${r.county}</td>`+
       `<td${hot('total')}>${fmtPts(r.total)}</td><td${hot('league')}>${fmtPts(r.league)}</td>`+
       `<td class="total"${hot('combined')}>${fmtPts(r.combined)}</td>`+
       `<td${hot('years_scoring')}>${r.years_scoring}</td><td${hot('avg_scoring')}>${r.avg_scoring.toFixed(2)}</td>`+
       `<td><span class="cell" style="background:${cellColor(r.best)};color:${cellTextColor(r.best)};max-width:34px">${fmtPts(r.best)}</span></td></tr>`;
  });
  h+='</tbody></table></div>';
  const wrap=document.getElementById('standings-table');
  wrap.innerHTML=h;
  wrap.querySelectorAll('th[data-k]').forEach(th=>{
    if(th.classList.contains('static'))return;
    th.onclick=()=>{const k=th.dataset.k;
      if(k===sortKey)sortDir*=-1;else{sortKey=k;sortDir=(k==='county')?1:-1;}
      buildStandings();
    };
  });
}

function buildEras(){
  const eras=DATA.eras.map(e=>({...e,total:VIEW.era_totals[e.key]||0}));
  let h='<div class="card"><table><thead><tr><th class="l static">County</th>';
  eras.forEach(e=>h+=`<th class="static">${e.label}</th>`);
  h+='<th class="static">Total</th></tr></thead><tbody>';
  VIEW.standings.forEach(r=>{
    h+=`<tr><td class="l county">${r.county}</td>`;
    eras.forEach(e=>{const v=r.by_era[e.key]||0;
      h+=`<td>${v?fmtPts(v):'<span style="color:#bbb">.</span>'}</td>`;});
    h+=`<td class="total">${fmtPts(r.total)}</td></tr>`;
  });
  h+='</tbody><tfoot><tr><td class="l"><b>Era total</b></td>';
  eras.forEach(e=>h+=`<td><b>${fmtPts(e.total)}</b></td>`);
  h+=`<td><b>${fmtPts(VIEW.meta.grand_total)}</b></td></tr></tfoot></table></div>`;
  document.getElementById('eras-table').innerHTML=h;
}

function flip(container, mutate){
  const prefersReduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prev={};
  if(!prefersReduce)
    container.querySelectorAll('tr[data-county]').forEach(tr=>{prev[tr.dataset.county]=tr.getBoundingClientRect().top;});
  mutate();
  if(prefersReduce)return;
  container.querySelectorAll('tr[data-county]').forEach(tr=>{
    const old=prev[tr.dataset.county];
    if(old==null)return;
    const dy=old-tr.getBoundingClientRect().top;
    if(!dy)return;
    tr.style.transform=`translateY(${dy}px)`;
    tr.style.transition='none';
    requestAnimationFrame(()=>{
      tr.style.transition='transform .45s cubic-bezier(.2,.7,.2,1)';
      tr.style.transform='';
    });
  });
}

let mxDecades=new Set();
let mxLeague=false;
function buildMatrix(){
  const allYrs=DATA.years;
  const decades=[...new Set(allYrs.map(decadeOf))].sort((a,b)=>a-b);
  const wrap=document.getElementById('matrix-table');
  const ctl=document.getElementById('matrix-decades');
  const cellVal=(r,y)=>(r.by_year[y]||0)+(mxLeague?((r.lg_by_year&&r.lg_by_year[y])||0):0);
  const toolbar=()=>{
    let h=`<div class="dec-row"><button class="dec${mxDecades.size===0?' active':''}" data-d="all">All years</button>`;
    decades.forEach(d=>{h+=`<button class="dec${mxDecades.has(d)?' active':''}" data-d="${d}">${d}s</button>`;});
    h+=`</div><div class="dec-row"><button class="dec toggle${mxLeague?' active':''}" data-toggle="1">`+
       `${mxLeague?'OK ':'+ '}Add league points</button>`+
       `<span class="hint">${mxLeague?'cells = championship + National League':'cells = championship finish'}</span></div>`;
    return h;
  };
  const render=()=>{
    const yrs=mxDecades.size===0?allYrs:allYrs.filter(y=>mxDecades.has(decadeOf(y)));
    const tot=r=>yrs.reduce((s,y)=>s+cellVal(r,y),0);
    const rows=VIEW.standings.map(r=>({r,t:tot(r)})).filter(o=>o.t>0)
      .sort((a,b)=>b.t-a.t||a.r.county.localeCompare(b.r.county));
    const single=yrs.length<=12;
    let h='<div class="card"><table class="matrix"><thead><tr>'+
      '<th class="county l">County</th><th class="seltot">Pts</th>';
    yrs.forEach(y=>h+=`<th>${single?y:String(y).slice(2)}</th>`);
    h+='</tr></thead><tbody>';
    const max=maxCellPoint();
    rows.forEach(({r,t})=>{
      h+=`<tr data-county="${r.county}"><td class="county l">${r.county}</td><td class="seltot">${fmtPts(t)}</td>`;
      yrs.forEach(y=>{const v=cellVal(r,y);
        h+=`<td><span class="cell" style="background:${cellColor(v,max)};color:${cellTextColor(v,max)}">${v?fmtPts(v):''}</span></td>`;});
      h+='</tr>';
    });
    h+='</tbody></table></div>';
    if(!rows.length)h='<p class="sub">No counties scored in the selected years.</p>';
    flip(wrap,()=>{wrap.innerHTML=h;});
  };
  ctl.innerHTML=toolbar();
  ctl.onclick=e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.toggle){mxLeague=!mxLeague;}
    else if(b.dataset.d==='all'){mxDecades.clear();}
    else{const d=+b.dataset.d; mxDecades.has(d)?mxDecades.delete(d):mxDecades.add(d);}
    ctl.innerHTML=toolbar(); render();
  };
  render();
}

let honourKey='ai_titles', honourDir=-1;
function buildHonour(){
  const cols=[
    ['county','County','l'],['ai_titles','Titles',''],['ai_runner_ups','Runners-up',''],
    ['ai_semi_finals','Semi-finals',''],['provincial_titles','Prov. titles',''],
    ['provincial_runner_ups','Prov. finals lost','']
  ];
  const wrap=document.getElementById('honour-table');
  const rows=[...DATA.roll_of_honour].sort((a,b)=>{
    const v=(a[honourKey]>b[honourKey]?1:a[honourKey]<b[honourKey]?-1:0);
    return v*honourDir||a.county.localeCompare(b.county);
  });
  let h='<div class="card"><table><thead><tr>';
  cols.forEach(([k,lab,cls])=>{
    const arr=(k===honourKey)?(honourDir<0?'v':'^'):'';
    h+=`<th class="${cls||''}" data-k="${k}">${lab} <span class="arr">${arr}</span></th>`;
  });
  h+='</tr></thead><tbody>';
  rows.forEach(r=>{
    h+=`<tr><td class="l county">${r.county}</td><td class="total">${r.ai_titles}</td>`+
       `<td>${r.ai_runner_ups}</td><td>${r.ai_semi_finals}</td>`+
       `<td>${r.provincial_titles}</td><td>${r.provincial_runner_ups}</td></tr>`;
  });
  h+='</tbody></table></div>';
  wrap.innerHTML=h;
  wrap.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{
    const k=th.dataset.k;
    if(k===honourKey)honourDir*=-1;else{honourKey=k;honourDir=(k==='county')?1:-1;}
    buildHonour();
  });
}

function buildChart(){
  const canvas=document.getElementById('raceChart');
  if(!canvas || typeof Chart==='undefined')return;
  if(window._chart && typeof window._chart.destroy==='function')window._chart.destroy();
  const yrs=DATA.years;
  const top=VIEW.standings.slice(0,8);
  const palette=['#0b6e4f','#1f6feb','#d1495b','#f2c14e','#6a4c93','#e07a5f','#3d9970','#8d99ae'];
  const datasets=top.map((r,i)=>{
    let cum=0; const pts=yrs.map(y=>{cum+=r.by_year[y]||0;return cum;});
    return {label:r.county,data:pts,borderColor:palette[i],backgroundColor:palette[i],
      tension:.25,borderWidth:2.5,pointRadius:0,pointHoverRadius:4};
  });
  window._chart=new Chart(canvas,{type:'line',data:{labels:yrs,datasets},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{position:'bottom'},title:{display:false}},
      scales:{y:{title:{display:true,text:'Cumulative points'},beginAtZero:true},
              x:{ticks:{maxTicksLimit:12}}}}});
}
