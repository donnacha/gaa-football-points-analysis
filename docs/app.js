const TIER = {5:'var(--t5)',4:'var(--t4)',3:'var(--t3)',2:'var(--t2)',1:'var(--t1)',0:'var(--t0)'};
const TIER_LABEL = {5:'All-Ireland champion',4:'Runner-up',3:'Beaten semi-finalist',
  2:'Beaten quarter-finalist',1:'Provincial finalist / group stage',0:'—'};

let DATA;

fetch('data.json').then(r=>r.json()).then(d=>{DATA=d;init();})
  .catch(e=>{document.getElementById('standings-table').innerHTML='<p>Could not load data.json</p>';});

function init(){
  buildLegend(); buildStats(); buildStandings(); buildOverall(); buildEras(); buildMatrix(); buildChart();
  buildHonour();
  document.getElementById('updated').textContent = DATA.meta.updated;
  document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section.panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(b.dataset.t).classList.add('active');
    if(b.dataset.t==='chart' && window._chart) window._chart.resize();
  });
}

function buildLegend(){
  const el=document.getElementById('legend');
  [5,4,3,2,1].forEach(t=>{
    const c=document.createElement('span');c.className='chip';
    c.innerHTML=`<span class="dot" style="background:${TIER[t]}"></span><b>${t}</b>&nbsp;${TIER_LABEL[t]}`;
    el.appendChild(c);
  });
}

function buildStats(){
  const s=DATA.standings, top=s[0], mt=DATA.meta.most_titles;
  const cards=[
    [DATA.meta.n_years,`championships (${DATA.meta.span})`],
    [`${top.county} ${top.total}`,'all-time points leader'],
    [`${mt.county} ${mt.n}`,'most All-Ireland titles'],
    [DATA.meta.n_doubles,'league + championship doubles'],
  ];
  document.getElementById('stats').innerHTML=cards.map(([n,k])=>
    `<div class="stat"><div class="n">${n}</div><div class="k">${k}</div></div>`).join('');
}

let sortKey='total', sortDir=-1;
function buildStandings(){
  const cols=[
    ['rank','#','static'],['county','County','l'],['total','Points',''],
    ['years_scoring','Yrs scoring',''],['avg_all','Avg / yr',''],
    ['avg_scoring','Avg / scoring yr',''],['best','Best finish','']
  ];
  const wrap=document.getElementById('standings-table');
  const render=()=>{
    const rows=[...DATA.standings].sort((a,b)=>{
      const v=(a[sortKey]>b[sortKey]?1:a[sortKey]<b[sortKey]?-1:0); return v*sortDir;
    });
    let h='<div class="card"><table><thead><tr>';
    cols.forEach(([k,lab,cls])=>{
      const arr = (k===sortKey)?(sortDir<0?'▼':'▲'):'';
      h+=`<th class="${cls||''}" data-k="${k}">${lab} <span class="arr">${arr}</span></th>`;
    });
    h+='</tr></thead><tbody>';
    rows.forEach((r,i)=>{
      h+=`<tr><td class="rank">${i+1}</td><td class="l county">${r.county}</td>`+
         `<td class="total">${r.total}</td><td>${r.years_scoring}</td>`+
         `<td>${r.avg_all.toFixed(2)}</td><td>${r.avg_scoring.toFixed(2)}</td>`+
         `<td><span class="cell" style="background:${TIER[r.best]};max-width:30px">${r.best}</span></td></tr>`;
    });
    h+='</tbody></table></div>';
    wrap.innerHTML=h;
    wrap.querySelectorAll('th[data-k]').forEach(th=>{
      if(th.classList.contains('static'))return;
      th.onclick=()=>{const k=th.dataset.k;
        if(k===sortKey)sortDir*=-1;else{sortKey=k;sortDir=(k==='county')?1:-1;}
        render();};
    });
  };
  render();
}

let overKey='combined', overDir=-1;
function buildOverall(){
  if(DATA.league_points){
    const c=document.getElementById('lp-champ'), r=document.getElementById('lp-ru'),
          m=document.getElementById('lp-minor');
    if(c)c.textContent=DATA.league_points.champion;
    if(r)r.textContent=DATA.league_points.runner_up;
    if(m)m.textContent=DATA.league_points.semi_final;
  }
  const cols=[
    ['county','County','l'],['championship','Championship',''],['league','League',''],
    ['combined','Combined',''],['league_share','League %','']
  ];
  const wrap=document.getElementById('overall-table');
  const render=()=>{
    const rows=[...DATA.overall].sort((a,b)=>{
      const v=(a[overKey]>b[overKey]?1:a[overKey]<b[overKey]?-1:0); return v*overDir;
    });
    let h='<div class="card"><table><thead><tr><th class="static">#</th>';
    cols.forEach(([k,lab,cls])=>{
      const arr=(k===overKey)?(overDir<0?'▼':'▲'):'';
      h+=`<th class="${cls||''}" data-k="${k}">${lab} <span class="arr">${arr}</span></th>`;
    });
    h+='</tr></thead><tbody>';
    rows.forEach((r,i)=>{
      h+=`<tr><td class="rank">${i+1}</td><td class="l county">${r.county}</td>`+
         `<td>${r.championship}</td><td>${r.league}</td>`+
         `<td class="total">${r.combined}</td><td>${r.league_share}%</td></tr>`;
    });
    h+='</tbody></table></div>'; wrap.innerHTML=h;
    wrap.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{
      const k=th.dataset.k;
      if(k===overKey)overDir*=-1;else{overKey=k;overDir=(k==='county')?1:-1;}
      render();});
  };
  render();
}

function buildEras(){
  const eras=DATA.eras;
  let h='<div class="card"><table><thead><tr><th class="l static">County</th>';
  eras.forEach(e=>h+=`<th class="static">${e.label}</th>`);
  h+='<th class="static">Total</th></tr></thead><tbody>';
  DATA.standings.forEach(r=>{
    h+=`<tr><td class="l county">${r.county}</td>`;
    eras.forEach(e=>{const v=r.by_era[e.key]||0;
      h+=`<td>${v||'<span style="color:#bbb">·</span>'}</td>`;});
    h+=`<td class="total">${r.total}</td></tr>`;
  });
  h+='</tbody><tfoot><tr><td class="l"><b>Era total</b></td>';
  eras.forEach(e=>h+=`<td><b>${e.total}</b></td>`);
  h+=`<td><b>${DATA.meta.grand_total}</b></td></tr></tfoot></table></div>`;
  document.getElementById('eras-table').innerHTML=h;
}

const decadeOf=y=>Math.floor(y/10)*10;
const fmtPts=v=>Number.isInteger(v)?v:Math.round(v*10)/10;
let mxDecades=new Set();   // empty = all years
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
       `${mxLeague?'✓ ':'+ '}Add league points</button>`+
       `<span class="hint">${mxLeague?'cells = championship + National League':'cells = championship finish'}</span></div>`;
    return h;
  };
  const render=()=>{
    const yrs = mxDecades.size===0 ? allYrs : allYrs.filter(y=>mxDecades.has(decadeOf(y)));
    const tot=r=>yrs.reduce((s,y)=>s+cellVal(r,y),0);
    const rows=DATA.standings.map(r=>({r,t:tot(r)})).filter(o=>o.t>0)
                 .sort((a,b)=>b.t-a.t||a.r.county.localeCompare(b.r.county));
    const single=yrs.length<=12;
    let h='<div class="card"><table class="matrix"><thead><tr>'+
      '<th class="county l">County</th><th class="seltot">Pts</th>';
    yrs.forEach(y=>h+=`<th>${single?y:String(y).slice(2)}</th>`);
    h+='</tr></thead><tbody>';
    rows.forEach(({r,t})=>{
      h+=`<tr><td class="county l">${r.county}</td><td class="seltot">${fmtPts(t)}</td>`;
      yrs.forEach(y=>{const v=cellVal(r,y);const tier=Math.min(5,Math.round(v));
        h+=`<td><span class="cell" style="background:${TIER[tier]};color:${tier>=3?'#fff':'#456'}">${v?fmtPts(v):''}</span></td>`;});
      h+='</tr>';
    });
    h+='</tbody></table></div>';
    if(!rows.length)h='<p class="sub">No counties scored in the selected years.</p>';
    wrap.innerHTML=h;
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
  const render=()=>{
    const rows=[...DATA.roll_of_honour].sort((a,b)=>{
      const v=(a[honourKey]>b[honourKey]?1:a[honourKey]<b[honourKey]?-1:0); return v*honourDir;
    });
    let h='<div class="card"><table><thead><tr>';
    cols.forEach(([k,lab,cls])=>{
      const arr=(k===honourKey)?(honourDir<0?'▼':'▲'):'';
      h+=`<th class="${cls||''}" data-k="${k}">${lab} <span class="arr">${arr}</span></th>`;
    });
    h+='</tr></thead><tbody>';
    rows.forEach(r=>{
      h+=`<tr><td class="l county">${r.county}</td><td class="total">${r.ai_titles}</td>`+
         `<td>${r.ai_runner_ups}</td><td>${r.ai_semi_finals}</td>`+
         `<td>${r.provincial_titles}</td><td>${r.provincial_runner_ups}</td></tr>`;
    });
    h+='</tbody></table></div>'; wrap.innerHTML=h;
    wrap.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{
      const k=th.dataset.k;
      if(k===honourKey)honourDir*=-1;else{honourKey=k;honourDir=(k==='county')?1:-1;}
      render();});
  };
  render();
}

function buildChart(){
  const yrs=DATA.years;
  const top=DATA.standings.slice(0,8);
  const palette=['#0b6e4f','#1f6feb','#d1495b','#f2c14e','#6a4c93','#e07a5f','#3d9970','#8d99ae'];
  const datasets=top.map((r,i)=>{
    let cum=0; const pts=yrs.map(y=>{cum+=r.by_year[y]||0;return cum;});
    return {label:r.county,data:pts,borderColor:palette[i],backgroundColor:palette[i],
      tension:.25,borderWidth:2.5,pointRadius:0,pointHoverRadius:4};
  });
  const ctx=document.getElementById('raceChart');
  window._chart=new Chart(ctx,{type:'line',data:{labels:yrs,datasets},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{position:'bottom'},title:{display:false}},
      scales:{y:{title:{display:true,text:'Cumulative points'},beginAtZero:true},
              x:{ticks:{maxTicksLimit:12}}}}});
}
