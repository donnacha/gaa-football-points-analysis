const TIER = {5:'var(--t5)',4:'var(--t4)',3:'var(--t3)',2:'var(--t2)',1:'var(--t1)',0:'var(--t0)'};
const TIER_LABEL = {5:'All-Ireland champion',4:'Runner-up',3:'Beaten semi-finalist',
  2:'Beaten quarter-finalist',1:'Provincial finalist / group stage',0:'—'};

let DATA;

fetch('data.json').then(r=>r.json()).then(d=>{DATA=d;init();})
  .catch(e=>{document.getElementById('standings-table').innerHTML='<p>Could not load data.json</p>';});

function init(){
  buildLegend(); buildStats(); buildStandings(); buildEras(); buildMatrix(); buildChart();
  buildHonour(); buildFinals(); buildLeague(); buildRecords();
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

function buildMatrix(){
  const yrs=DATA.years;
  let h='<div class="card"><table class="matrix"><thead><tr><th class="county l">County</th>';
  yrs.forEach(y=>h+=`<th>${String(y).slice(2)}</th>`);
  h+='</tr></thead><tbody>';
  DATA.standings.forEach(r=>{
    h+=`<tr><td class="county l">${r.county}</td>`;
    yrs.forEach(y=>{const v=r.by_year[y]||0;
      h+=`<td><span class="cell" style="background:${TIER[v]};color:${v>=3?'#fff':'#456'}">${v||''}</span></td>`;});
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  document.getElementById('matrix-table').innerHTML=h;
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

function buildFinals(){
  const wrap=document.getElementById('finals-table');
  const inp=document.getElementById('finals-filter');
  const rows=[...DATA.finals].sort((a,b)=>b.year-a.year);
  const render=(q='')=>{
    q=q.trim().toLowerCase();
    const f=rows.filter(r=>!q||[r.year,r.champion,r.runner_up,r.venue,r.captain,r.manager]
      .some(v=>v&&String(v).toLowerCase().includes(q)));
    let h='<div class="card"><table><thead><tr><th>Year</th><th class="l">Champion</th>'+
      '<th>Score</th><th class="l">Runner-up</th><th>Score</th><th>Margin</th>'+
      '<th class="l">Venue</th><th>Attend.</th><th class="l">Captain</th><th class="l">Manager</th>'+
      '</tr></thead><tbody>';
    f.forEach(r=>{
      const rep=r.replay?' <span class="rep" title="after a replay">R</span>':'';
      h+=`<tr><td class="total">${r.year}</td><td class="l county">${r.champion}</td>`+
         `<td>${r.champion_score||'—'}</td><td class="l">${r.runner_up||'—'}</td>`+
         `<td>${r.runner_up_score||'—'}</td><td>${r.margin==null?'—':r.margin}${rep}</td>`+
         `<td class="l">${r.venue||'—'}</td>`+
         `<td>${r.attendance?r.attendance.toLocaleString():'—'}</td>`+
         `<td class="l">${r.captain||'—'}</td><td class="l">${r.manager||'—'}</td></tr>`;
    });
    h+='</tbody></table></div>';
    if(!f.length)h='<p class="sub">No finals match that filter.</p>';
    wrap.innerHTML=h;
  };
  inp.oninput=()=>render(inp.value); render();
}

function buildLeague(){
  document.getElementById('league-stats').innerHTML=[
    [DATA.national_league.length,'counties with a Division 1 title or final'],
    [DATA.doubles.length,'league + championship doubles'],
  ].map(([n,k])=>`<div class="stat"><div class="n">${n}</div><div class="k">${k}</div></div>`).join('');

  let d='<div class="card"><table><thead><tr><th>Year</th><th class="l">County</th>'+
    '<th class="l">Achievement</th></tr></thead><tbody>';
  [...DATA.doubles].sort((a,b)=>b.year-a.year).forEach(r=>{
    d+=`<tr><td class="total">${r.year}</td><td class="l county">${r.county}</td>`+
       `<td class="l">National League + All-Ireland</td></tr>`;
  });
  d+='</tbody></table></div>';
  document.getElementById('doubles-table').innerHTML=d;

  let h='<div class="card"><table><thead><tr><th class="l">County</th>'+
    '<th>Div 1 titles</th><th>Div 1 runner-up</th></tr></thead><tbody>';
  DATA.national_league.forEach(r=>{
    h+=`<tr><td class="l county">${r.county}</td><td class="total">${r.nfl_titles}</td>`+
       `<td>${r.nfl_runner_ups}</td></tr>`;
  });
  h+='</tbody></table></div>';
  document.getElementById('league-table').innerHTML=h;
}

function buildRecords(){
  const R=DATA.records;
  const mk=(title,list,val,unit)=>{
    let h=`<div class="card rec"><h3>${title}</h3><table><tbody>`;
    list.forEach(f=>{
      const v=val(f);
      h+=`<tr><td class="total">${f.year}</td>`+
         `<td class="l">${f.champion} ${f.champion_score||''} v ${f.runner_up||'—'} ${f.runner_up_score||''}</td>`+
         `<td class="num">${v}${unit?' '+unit:''}</td></tr>`;
    });
    h+='</tbody></table></div>'; return h;
  };
  document.getElementById('records-wrap').innerHTML=
    '<div class="rec-grid">'+
    mk('Biggest winning margins', R.biggest_margins, f=>f.margin, 'pts')+
    mk('Tightest finals', R.tightest_finals, f=>f.margin, 'pt'+'s')+
    mk('Highest-scoring finals', R.highest_scoring, f=>f.combined, 'pts')+
    mk('Biggest attendances', R.biggest_crowds, f=>f.attendance.toLocaleString())+
    '</div>';
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
