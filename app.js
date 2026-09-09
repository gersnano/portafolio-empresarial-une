'use strict';
const D=window.PORTFOLIO;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const byNeed=Object.fromEntries(D.needs.map(x=>[x.id,x.name]));
const byMech=Object.fromEntries(D.mechanisms.map(x=>[x.id,x.name]));
const state={need:'',agency:'',mechanism:'',challenge:'',search:'',view:'instruments'};
let chartUnit='instruments';
const lineCount=xs=>xs.reduce((n,x)=>n+x.lines.length,0);
function matches(x,ignoreNeed=false,ignoreKey=''){
 return (ignoreNeed||ignoreKey==='need'||!state.need||x.need===state.need)&&(ignoreKey==='agency'||!state.agency||x.agency===state.agency)&&(ignoreKey==='mechanism'||!state.mechanism||x.mechanism===state.mechanism)&&(!state.challenge||x.challenge===state.challenge)&&(!state.search||norm([x.name,x.agency,x.description,x.capacities,x.supports,byNeed[x.need],...x.lines.map(l=>l.name+' '+l.audience+' '+l.support)].join(' ')).includes(norm(state.search).trim()));
}
const filtered=()=>D.instruments.filter(x=>matches(x));
function option(value,label){return `<option value="${esc(value)}">${esc(label)}</option>`;}
$('agency').insertAdjacentHTML('beforeend',D.agencies.map(x=>option(x.id,x.id)).join(''));
$('mechanism').insertAdjacentHTML('beforeend',D.mechanisms.map(x=>option(x.id,x.name)).join(''));
$('challenge').insertAdjacentHTML('beforeend',[...new Set(D.instruments.map(x=>x.challenge))].sort((a,b)=>a.localeCompare(b,'es')).map(x=>option(x,x)).join(''));
function card(x){return `<article class="card"><div class="card-top"><button class="agency-link" data-agency="${esc(x.agency)}">${esc(x.agency)}</button><span>${x.lines.length} ${x.lines.length===1?'línea':'líneas'}</span></div><h3><button class="title-button" data-instrument="${esc(x.id)}">${esc(x.name)}</button></h3><p>${esc(x.description)}</p><div class="card-bottom"><span class="tag">${esc(byNeed[x.need])}</span><span class="tag secondary">${esc(byMech[x.mechanism])}</span><button class="open-link" data-instrument="${esc(x.id)}" aria-label="Ver ficha de ${esc(x.name)}">Ver ficha ↗</button></div></article>`;}
function render(){
 const list=filtered();const nAgencies=new Set(list.map(x=>x.agency)).size;
 renderCharts(list);
 const contextual=D.instruments.filter(x=>matches(x,true));
 const needButton=(id,name,n)=>`<button class="need ${state.need===id?'active-need':''}" data-need="${id}" aria-pressed="${state.need===id}"><span>${esc(name)}</span><b>${n}</b>${id?`<span class="bar" aria-hidden="true"><i style="width:${n/14*100}%"></i></span>`:''}</button>`;
 $('needs').innerHTML=needButton('','Todas las necesidades',contextual.length)+D.needs.map(n=>needButton(n.id,n.name,contextual.filter(x=>x.need===n.id).length)).join('');
 document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===state.view;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 $('results').setAttribute('aria-labelledby',state.view==='instruments'?'instruments-tab':'agencies-tab');
 $('result-title').textContent=state.need?byNeed[state.need]:(state.view==='instruments'?'Todos los instrumentos':'Agencias del ecosistema');
 $('summary').textContent=`${list.length} de 76 instrumentos · ${lineCount(list)} líneas activas · ${nAgencies} ${nAgencies===1?'agencia':'agencias'}`;
 if(!list.length){$('results').innerHTML='<div class="empty"><h3>No hay instrumentos con esta combinación</h3><p>Prueba otra necesidad o elimina alguno de los filtros.</p><button data-reset>Limpiar filtros</button></div>';return;}
 if(state.view==='instruments'){$('results').innerHTML=list.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(card).join('');return;}
 $('results').innerHTML=D.agencies.filter(a=>list.some(x=>x.agency===a.id)).map(a=>{const relevant=list.filter(x=>x.agency===a.id);return `<article class="card agency-card"><div class="card-top"><span class="agency-link">${esc(a.id)}</span><span>AGENCIA</span></div><h3><button class="title-button" data-agency="${esc(a.id)}">${esc(a.name)}</button></h3><p>${esc(a.role)}</p><div class="agency-stats"><span><b>${relevant.length}</b>instrumentos</span><span><b>${lineCount(relevant)}</b>líneas</span></div><div class="card-bottom"><span class="tag secondary">En la selección actual</span><button class="open-link" data-agency="${esc(a.id)}">Ficha y portafolio ↗</button></div></article>`;}).join('');
}
function reset(){for(const key of ['need','agency','mechanism','challenge','search'])state[key]='';for(const key of ['agency','mechanism','challenge','search'])$(key).value='';render();}
for(const key of ['agency','mechanism','challenge'])$(key).addEventListener('change',e=>{state[key]=e.target.value;render();});
$('search').addEventListener('input',e=>{state.search=e.target.value;render();});
$('reset').addEventListener('click',reset);
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();state.view=e.key==='Home'?'instruments':e.key==='End'?'agencies':state.view==='instruments'?'agencies':'instruments';render();$(state.view==='instruments'?'instruments-tab':'agencies-tab').focus();});
document.addEventListener('click',e=>{
 const t=e.target.closest('button');if(!t)return;
 if(t.hasAttribute('data-need')){state.need=t.dataset.need;render();document.querySelector(`[data-need="${state.need}"]`)?.focus();}
 if(t.dataset.view){state.view=t.dataset.view;render();}
 if(t.hasAttribute('data-reset'))reset();
 if(t.dataset.instrument)navigate('instrumento',t.dataset.instrument);
 if(t.dataset.agency)navigate('agencia',t.dataset.agency);
 if(t.dataset.unit){chartUnit=t.dataset.unit;renderCharts(filtered());document.querySelector(`[data-unit="${chartUnit}"]`)?.focus();}
 if(t.dataset.chartKey){setChartFilter(t.dataset.chartKey,t.dataset.chartValue);document.querySelector(`[data-chart-key="${t.dataset.chartKey}"][data-chart-value="${t.dataset.chartValue}"]`)?.focus();}
 if(t.dataset.clearKey){const key=t.dataset.clearKey;state[key]='';if(key!=='need')$(key).value='';render();$('reset').focus();}
});
function setChartFilter(key,value){if(!['need','agency','mechanism'].includes(key))return;state[key]=state[key]===value?'':value;if(key!=='need')$(key).value=state[key];render();}
function chartData(key,options){const base=D.instruments.filter(x=>matches(x,false,key));return options.map(o=>({id:o.id,name:o.name,value:base.filter(x=>x[key]===o.id).reduce((n,x)=>n+(chartUnit==='lines'?x.lines.length:1),0)})).sort((a,b)=>b.value-a.value);}
function renderBars(key,rows){const max=Math.max(1,...rows.map(x=>x.value));return rows.map(x=>`<button class="chart-bar ${state[key]===x.id?'selected-bar':''}" data-chart-key="${key}" data-chart-value="${esc(x.id)}" aria-pressed="${state[key]===x.id}" aria-label="${esc(x.name)}: ${x.value} ${chartUnit==='lines'?'líneas':'instrumentos'}. Filtrar"><span class="bar-label">${esc(x.name)}</span><span class="bar-track"><span style="width:${100*x.value/max}%"></span></span><b>${x.value}</b></button>`).join('');}
function renderCharts(list){
 $('metric-instruments').textContent=list.length;$('metric-lines').textContent=lineCount(list);$('metric-agencies').textContent=new Set(list.map(x=>x.agency)).size;$('metric-needs').textContent=new Set(list.map(x=>x.need)).size;
 document.querySelectorAll('[data-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===chartUnit)));
 const needs=chartData('need',D.needs),agencies=chartData('agency',D.agencies.map(x=>({id:x.id,name:x.id}))),mechanisms=chartData('mechanism',D.mechanisms);
 $('chart-needs').innerHTML=renderBars('need',needs);$('chart-agencies').innerHTML=renderBars('agency',agencies);
 const colors={M1:'#25408d',M6:'#168681',MIX:'#ef9950',M2:'#598bc2',M8:'#846aab',M9:'#bd685c',M4:'#596879',M3:'#559f74',M5:'#af8626',M7:'#aa7f91',M10:'#737373'};
 const total=mechanisms.reduce((n,x)=>n+x.value,0);let start=0;
 const stops=mechanisms.filter(x=>x.value).map(x=>{const end=start+x.value/total*100;const stop=`${colors[x.id]} ${start}% ${end}%`;start=end;return stop;});
 $('chart-mechanisms').innerHTML=`<div class="donut-wrap"><div class="donut" aria-hidden="true" style="background:${total?'conic-gradient('+stops.join(',')+')':'#e6eaf0'}"><div><strong>${total}</strong><span>${chartUnit==='lines'?'líneas':'instrumentos'}</span></div></div><span class="donut-note">Distribución por<br>mecanismo principal</span></div><div class="chart-legend">${mechanisms.map(x=>`<button class="legend-row ${state.mechanism===x.id?'selected-legend':''}" data-chart-key="mechanism" data-chart-value="${x.id}" aria-pressed="${state.mechanism===x.id}"><i style="background:${colors[x.id]}" aria-hidden="true"></i><span>${esc(x.name)}</span><b>${x.value}</b><small>${total?Math.round(x.value/total*100):0}%</small></button>`).join('')}</div>`;
 const count=list.length,share=Math.round(count/76*100),anr=list.filter(x=>x.mechanism==='M1'||x.mechanism==='M6').length;
 $('chart-reading').innerHTML=count?`<span class="reading-icon" aria-hidden="true">↗</span><p><b>${count===76?'La oferta combina instrumentos financieros y servicios.':`Tu selección reúne ${count} instrumentos (${share}% del portafolio).`}</b> ${anr} ${anr===1?'se basa':'se basan'} principalmente en subsidios o servicios${count?` (${Math.round(anr/count*100)}% de la selección)`:''}. Otros instrumentos pueden combinar mecanismos.</p>`:'<p><b>No hay coincidencias.</b> Elimina un filtro para ampliar la selección.</p>';
 const labels={need:byNeed[state.need],agency:state.agency,mechanism:byMech[state.mechanism],challenge:state.challenge,search:state.search?'Búsqueda: '+state.search:''};
 $('filter-chips').innerHTML=Object.entries(labels).filter(([k,v])=>v).map(([key,label])=>`<button data-clear-key="${key}" aria-label="Quitar filtro ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('');
}
function sourceLinks(urls){return [...new Set(urls)].filter(u=>/^https?:\/\//i.test(u)).map((u,i)=>{let host;try{host=new URL(u).hostname.replace(/^www\./,'');}catch{return '';}return `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${urls.length>1?i+1+'. ':''}${esc(host)} ↗</a>`;}).join('')||'<span>Sin enlace registrado.</span>';}
let trigger=null;
function navigate(type,id){if(!$('detail').open)trigger=document.activeElement;location.hash=type+'/'+encodeURIComponent(id);}
function closeDetail(){if($('detail').open)$('detail').close();history.replaceState(null,'',location.pathname+location.search);if(trigger?.isConnected)trigger.focus();else $('results').focus();}
function showRoute(){
 const match=location.hash.match(/^#(instrumento|agencia)\/(.+)$/);if(!match){if($('detail').open)$('detail').close();return;}
 let id;try{id=decodeURIComponent(match[2]);}catch{return;}
 const instrument=match[1]==='instrumento';const record=instrument?D.instruments.find(x=>x.id===id):D.agencies.find(x=>x.id===id);
 if(!record){$('detail-type').textContent='FICHA NO ENCONTRADA';$('detail-content').innerHTML='<h2 id="detail-title">No encontramos esta ficha</h2><p>Cierra esta ventana y selecciona un instrumento o agencia del portafolio.</p>';}
 else if(instrument){const x=record;
  $('detail-type').textContent='FICHA DE INSTRUMENTO';
  $('detail-content').innerHTML=`<button class="agency-link" data-agency="${esc(x.agency)}">${esc(x.agency)} · Ver agencia ↗</button><h2 id="detail-title">${esc(x.name)}</h2><div class="detail-meta"><span class="tag">${esc(byNeed[x.need])}</span><span class="tag secondary">${esc(byMech[x.mechanism])}</span><span class="tag secondary">${x.lines.length} ${x.lines.length===1?'línea activa':'líneas activas'}</span></div><p>${esc(x.description)}</p><div class="detail-grid"><div><small>Momento o desafío principal</small><span>${esc(x.challenge)}</span></div><div><small>Qué puede recibir la empresa</small><span>${esc(x.supports)}</span></div><div style="grid-column:1/-1"><small>Capacidades que fortalece</small><span>${esc(x.capacities)}</span></div></div><h3>Líneas de apoyo</h3><p>Consulta el público, la prestación y las fuentes de cada línea.</p>${x.lines.map((l,i)=>`<details class="line-detail" ${i===0?'open':''}><summary>${esc(l.name)}</summary><p>${esc(l.support)}</p><dl><dt>Dirigido a</dt><dd>${esc(l.audience)}</dd><dt>Finalidad de la línea</dt><dd>${esc(l.purpose)}</dd><dt>Mecanismo</dt><dd>${esc(l.mechanism)}</dd><dt>Modalidad temporal registrada</dt><dd>${esc(l.availability||'Sin dato')}</dd></dl><div class="sources">${sourceLinks(l.sources)}</div></details>`).join('')}<h3>Fuentes del instrumento</h3><div class="sources">${sourceLinks(x.sources)}</div><p class="footnote">Base B20 · Septiembre de 2026. Todas las líneas se consideran activas en el relevamiento. Consulta requisitos y apertura en los enlaces de la fuente. Las conexiones con otros apoyos están sujetas a elegibilidad y disponibilidad.</p>`;
 }else{const a=record;const all=D.instruments.filter(x=>x.agency===a.id).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  $('detail-type').textContent='FICHA DE AGENCIA';
  const clean=t=>t.replace(/\s*\[\d+\]/g,'');
  $('detail-content').innerHTML=`<span class="agency-link">${esc(a.id)}</span><h2 id="detail-title">${esc(a.name)}</h2><div class="detail-meta"><span class="tag">${all.length} instrumentos</span><span class="tag secondary">${lineCount(all)} líneas activas</span></div><h3>${esc(a.role)}</h3><p>${esc(clean(a.description))}</p><h3>Contribución al ecosistema</h3><p>${esc(clean(a.contribution))}</p><h3>Portafolio completo de la agencia</h3><p>Este listado incluye todos sus instrumentos en la base B20, independientemente de los filtros del tablero.</p><div class="agency-list">${all.map(x=>`<button class="agency-item" data-instrument="${esc(x.id)}"><span><b>${esc(x.name)}</b><small>${esc(byNeed[x.need])} · ${x.lines.length} ${x.lines.length===1?'línea':'líneas'}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div><p class="footnote">La ficha describe el subconjunto empresarial relevado. No representa la totalidad del mandato ni de la actividad institucional. Fuente: base B20 e informe de trabajo UNE.</p>`;
 }
 if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;$('close').focus();
}
$('close').addEventListener('click',closeDetail);
$('detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
window.addEventListener('hashchange',showRoute);
render();showRoute();
function configureFilters(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Se requiere un objeto de filtros.');
 const allowed=['need','agency','mechanism','challenge','search'];
 for(const k of Object.keys(input))if(!allowed.includes(k)||typeof input[k]!=='string')throw new Error('Filtro inválido: '+k);
 const choices={need:D.needs.map(x=>x.id),agency:D.agencies.map(x=>x.id),mechanism:D.mechanisms.map(x=>x.id),challenge:[...new Set(D.instruments.map(x=>x.challenge))]};
 for(const k of Object.keys(choices))if(input[k]&&!choices[k].includes(input[k]))throw new Error('Valor no reconocido: '+k);
 for(const k of allowed){state[k]=input[k]||'';if(k!=='need')$(k).value=state[k];}
 state.view='instruments';render();return {instruments:filtered().map(x=>({id:x.id,name:x.name,agency:x.agency})),lines:lineCount(filtered())};
}
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tool={name:'filter_portfolio',title:'Filtrar el portafolio empresarial',description:'Reemplaza los filtros visibles y devuelve los instrumentos coincidentes. Los filtros omitidos se limpian.',inputSchema:{type:'object',properties:{need:{type:'string',enum:['',...D.needs.map(x=>x.id)]},agency:{type:'string',enum:['',...D.agencies.map(x=>x.id)]},mechanism:{type:'string',enum:['',...D.mechanisms.map(x=>x.id)]},challenge:{type:'string',enum:['',...new Set(D.instruments.map(x=>x.challenge))]},search:{type:'string'}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:configureFilters};
 try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
