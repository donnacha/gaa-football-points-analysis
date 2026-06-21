// Reference page: finals, records and the National League. Reads the same data.json.
let DATA;

fetch('data.json').then(r=>r.json()).then(d=>{DATA=d;init();})
  .catch(()=>{document.getElementById('finals-table').innerHTML='<p>Could not load data.json</p>';});

function init(){
  buildFinals(); buildRecords(); buildLeague();
  document.getElementById('updated').textContent = DATA.meta.updated;
  document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section.panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(b.dataset.t).classList.add('active');
  });
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
         `<td>${r.champion_score||'–'}</td><td class="l">${r.runner_up||'–'}</td>`+
         `<td>${r.runner_up_score||'–'}</td><td>${r.margin==null?'–':r.margin}${rep}</td>`+
         `<td class="l">${r.venue||'–'}</td>`+
         `<td>${r.attendance?r.attendance.toLocaleString():'–'}</td>`+
         `<td class="l">${r.captain||'–'}</td><td class="l">${r.manager||'–'}</td></tr>`;
    });
    h+='</tbody></table></div>';
    if(!f.length)h='<p class="sub">No finals match that filter.</p>';
    wrap.innerHTML=h;
  };
  inp.oninput=()=>render(inp.value); render();
}

function buildRecords(){
  const R=DATA.records;
  const mk=(title,list,val,unit)=>{
    let h=`<div class="card rec"><h3>${title}</h3><table><tbody>`;
    list.forEach(f=>{
      const v=val(f);
      h+=`<tr><td class="total">${f.year}</td>`+
         `<td class="l">${f.champion} ${f.champion_score||''} v ${f.runner_up||'–'} ${f.runner_up_score||''}</td>`+
         `<td class="num">${v}${unit?' '+unit:''}</td></tr>`;
    });
    h+='</tbody></table></div>'; return h;
  };
  document.getElementById('records-wrap').innerHTML=
    '<div class="rec-grid">'+
    mk('Biggest winning margins', R.biggest_margins, f=>f.margin, 'pts')+
    mk('Tightest finals', R.tightest_finals, f=>f.margin, 'pts')+
    mk('Highest-scoring finals', R.highest_scoring, f=>f.combined, 'pts')+
    mk('Biggest attendances', R.biggest_crowds, f=>f.attendance.toLocaleString())+
    '</div>';
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
