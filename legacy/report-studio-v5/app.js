(async function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const loadJson=(globalName,file)=>window[globalName]||fetch(file).then(r=>r.json());
  const [DB,TEMPLATES,REPORTS]=await Promise.all([
    loadJson('BNT_DATA','data.json'),
    loadJson('BNT_TEMPLATES','templates.json'),
    loadJson('BNT_REPORTS','report-data.json')
  ]);
  const embeddedMailings=document.body.dataset.page==='mailings';
  const embeddedData=document.body.dataset.page==='data';
  const embeddedReports=document.body.dataset.page==='reports';
  const embeddedBuilder=document.body.dataset.page==='builder';
  const embeddedTemplates=document.body.dataset.page==='templates';
  const embeddedSync=document.body.dataset.page==='sync';
  let builderPreview=false;
  let templatePreview=false, templateEditing=false, templateSaveTarget=null;
  let scheduleEditTarget=null;
  let syncLayoutCleanup=()=>{};
  let builderDrawerOpen=true, builderDrawerTab='library';
  let builderCatalogQuery='', builderCatalogDraft='', builderCatalogScope='all', builderCatalogSearching=false;
  const isReportView=()=>embeddedReports||embeddedBuilder&&builderPreview||embeddedTemplates&&templatePreview;
  const root=$(embeddedMailings||embeddedData||embeddedSync?'#page-content':'#app'), modal=$('#modal-root'), fileInput=$('#template-import');
  const MONTHS=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const MONTHS_FULL=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const KIND_NAMES={metrics:'Ключевые показатели',cf:'Денежные потоки (CF)',fi:'Финансовые показатели',ai:'Баланс',ci:'CAPEX',production:'Pelogas — производственные данные'};
  const latestCf2026={
    'Начальный остаток':[6374176.61,7031165.71,7358085.24,7086835.76,7258870.18,7078935.63,8381036.21,null,null,null,null,null],
    'Конечный остаток':[7031165.71,7358085.24,7086835.76,7258870.18,7078935.63,8381036.21,8843443.24,null,null,null,null,null],
    'Net cash flows':[656989.10,326919.53,-271249.48,172034.42,-179934.55,1302100.58,462407.03,null,null,null,null,null],
    '+ от опер.':[2387922.66,1483117.70,1207926.74,2273425.87,1789783.72,2495486.88,2177152.99,null,null,null,null,null],
    '- от опер.':[-1450927.07,-987190.91,-1420489.26,-1880756.25,-1954057.92,-1809254.19,-1955083.98,null,null,null,null,null],
    '+ от инвест.':[null,null,null,null,null,472536.20,475900.40,null,null,null,null,null],
    '- от инвест.':[-293527.21,-183859.16,-61102.45,-231301.89,-16217.80,-125277.84,-237896.68,null,null,null,null,null],
    '+ от фин.':[13520.72,14851.90,2415.49,10666.69,557.45,268609.53,2334.30,null,null,null,null,null],
    'CAPEX':[-293527.21,-183859.16,-61102.45,-231301.89,-16217.80,-125277.84,-237896.68,null,null,null,null,null],
    'Dividends':[null,null,null,null,null,472536.20,475900.40,null,null,null,null,null],
    'Доходы от %':[21505.10,20202.45,24977.60,21169.06,24296.19,23747.33,27894.13,null,null,null,null,null],
    'Доходы от аренды':[1160.28,9803.34,17785.63,8815.66,3012.22,16031.13,9330.60,null,null,null,null,null],
    'Доходы от неосн.':[14058.90,15962.56,2415.49,10868.27,2498.01,270504.76,3923.49,null,null,null,null,null],
    'Курсовая разница':[-248.96,-363.19,-12259.31,-187.17,-2.97,-0.03,0,null,null,null,null,null],
    'Пенсионный фонд':[-32196.48,-13988.88,-27158.60,-16337.20,-21888.28,-18505.98,-17071.96,null,null,null,null,null],
    'Платежи поставщикам':[-797798.67,-737875.36,-730072.35,-1008827.72,-1211948.59,-1125975.65,-1183198.99,null,null,null,null,null],
    'ФОТ':[-479577.68,-665215.10,-525336.34,-722844.31,-561751.45,-535583.55,-622405.64,null,null,null,null,null],
    'Платежи в бюджет':[-118432.65,-111911.07,-109805.64,-111263.58,-117625.89,-112841.35,-113851.99,null,null,null,null,null],
    'Прочие платежи':[-22672.63,542162.69,-15857.02,-21296.27,-40840.74,-16347.63,-18555.40,null,null,null,null,null]
  };

  const blockCatalog={
    transshipment:{title:'Поступления за перевалку',kind:'cf',type:'barTable',size:'half'},
    inflow:{title:'Структура поступлений',kind:'cf',type:'barTable',size:'half'},
    netflow:{title:'Динамика чистых денежных потоков',kind:'cf',type:'columnTable',size:'half'},
    outflow:{title:'Структура выбытий',kind:'cf',type:'barTable',size:'half'},
    waterfall:{title:'Отчет о движении денежных средств',kind:'cf',type:'waterfall',size:'full'},
    kpi:{title:'Ключевые показатели',kind:'metrics',type:'kpi',size:'full'},
    metricTrend:{title:'Динамика выручки и EBITDA',kind:'metrics',type:'line',size:'half'},
    planFact:{title:'План / факт — ключевые показатели',kind:'metrics',type:'planFact',size:'half'},
    finance:{title:'Финансовые показатели',kind:'fi',type:'genericTable',size:'full'},
    operations:{title:'Операционная аналитика',kind:'fi',type:'genericTable',size:'full'},
    balance:{title:'Баланс — ключевые статьи',kind:'ai',type:'genericTable',size:'full'},
    liquidity:{title:'Ликвидность и финансовые коэффициенты',kind:'metrics',type:'genericTable',size:'half'},
    capex:{title:'CAPEX — инвестиционная программа',kind:'ci',type:'capex',size:'full'},
    general_oil:{title:'Объем перевалки нефтеналивных грузов',kind:'production',type:'compare',size:'half',seed:'general.general_oil',catalogGroup:'forms'},
    general_oil_dry:{title:'Нефтеналивные и сухие грузы',kind:'production',type:'compare',size:'half',seed:'general.general_oil_dry',catalogGroup:'forms'},
    general_total_cargo:{title:'Общий объем перевалки',kind:'production',type:'compare',size:'full',seed:'general.general_total_cargo',catalogGroup:'forms'},
    general_net_profit:{title:'Чистая прибыль',kind:'metrics',type:'compare',size:'third',seed:'general.general_net_profit'},
    general_ebitda:{title:'EBITDA',kind:'metrics',type:'compare',size:'third',seed:'general.general_ebitda'},
    general_margin:{title:'EBITDA margin',kind:'metrics',type:'compare',size:'third',seed:'general.general_margin'},
    general_cogs:{title:'Себестоимость',kind:'fi',type:'compare',size:'third',seed:'general.general_cogs'},
    general_oar:{title:'ОАР',kind:'fi',type:'compare',size:'third',seed:'general.general_oar'},
    general_capex:{title:'Капитальные вложения',kind:'ci',type:'compare',size:'third',seed:'general.general_capex'},
    is_income:{title:'Доходы',kind:'fi',type:'compare',size:'half',seed:'is.is_income',catalogGroup:'forms'},
    is_core_income:{title:'Доходы от основной деятельности',kind:'fi',type:'compare',size:'half',seed:'is.is_core_income',catalogGroup:'forms'},
    is_transshipment:{title:'Доход от перевалки грузов',kind:'fi',type:'compare',size:'full',seed:'is.is_transshipment',catalogGroup:'forms'},
    is_expenses:{title:'Расходы',kind:'fi',type:'compare',size:'full',seed:'is.is_expenses',catalogGroup:'forms'},
    is_cogs:{title:'Себестоимость',kind:'fi',type:'compare',size:'half',seed:'is.is_cogs'},
    is_oar:{title:'ОАР',kind:'fi',type:'compare',size:'half',seed:'is.is_oar'},
    cons_production:{title:'Производственные показатели',kind:'production',type:'matrix',size:'full',seed:'consolidated.cons_production',catalogGroup:'forms'},
    cons_finance:{title:'Финансово-экономические показатели',kind:'fi',type:'matrix',size:'full',seed:'consolidated.cons_finance',catalogGroup:'forms'},
    cons_capex:{title:'Капитальные вложения',kind:'ci',type:'matrix',size:'half',seed:'consolidated.cons_capex',catalogGroup:'forms'},
    cons_payroll:{title:'Фонд оплаты труда и численность',kind:'metrics',type:'matrix',size:'half',seed:'consolidated.cons_payroll',catalogGroup:'forms'}
  };

  const state={
    view:'reports',activeTemplateId:'cf-main',source:1,year:2026,monthFrom:1,monthTo:7,currency:'USD',unit:'thousand',
    blocks:['transshipment','inflow','netflow','outflow','waterfall'],editLayout:false,showTables:true,showCodes:false,
    overrides:{},templateOverrides:{},seedOverrides:{},manualLog:[],customTemplates:[],customBlocks:{},schedules:[],dataKind:'metrics'
  };
  try{const s=JSON.parse(localStorage.getItem('bnt-studio-v5')||'null');if(s)Object.assign(state,s)}catch(e){}
  if(embeddedMailings)state.view='schedules';
  if(embeddedData)state.view='data';
  if(embeddedReports)state.view='reports';
  if(embeddedBuilder)state.view='builder';
  if(embeddedTemplates)state.view='templates';
  if(embeddedSync)state.view='sync';
  const persist=()=>localStorage.setItem('bnt-studio-v5',JSON.stringify(state));
  const allTemplates=()=>[...new Map(TEMPLATES.concat(state.customTemplates).map(template=>[template.id,template])).values()];
  const srcName=id=>({1:'БНТ',2:'БМП',3:'Консолидация'}[id]||id);
  const divider=()=>state.unit==='raw'?1:state.unit==='million'?1e6:1e3;
  const fx=()=>state.currency==='GEL'?2.68:1;
  const conv=v=>Number(v||0)*fx()/divider();
  const unitLabel=()=>state.unit==='raw'?(state.currency==='USD'?'$':'₾'):state.unit==='million'?(state.currency==='USD'?'млн $':'млн ₾'):(state.currency==='USD'?'тыс. $':'тыс. ₾');
  const hasNumber=v=>v!=null&&(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));
  const fmt=(v,d=state.unit==='raw'?0:0)=>!hasNumber(v)?'—':new Intl.NumberFormat('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d}).format(conv(v));
  const fmtSeed=(v,unit='')=>v==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:unit==='%'?1:0}).format(v)+(unit==='%'?'%':'');
  const fmtRaw=v=>v==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(v));
  const pct=v=>Number.isFinite(v)?`${v>=0?'+':''}${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(v)}%`:'—';
  const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  const activeTemplate=()=>{
    const all=allTemplates(),selected=all.find(t=>t.id===state.activeTemplateId);
    if(selected)return selected;
    if(!isReportView()||state.activeTemplateId!=='draft')return null;
    // Recover metadata lost by older filters without moving draft corrections.
    const matching=all.filter(t=>Array.isArray(t.blocks)&&t.blocks.length===state.blocks.length&&state.blocks.every(id=>t.blocks.includes(id)));
    return matching.length===1?matching[0]:null;
  };
  const reportTitle=()=>activeTemplate()?.reportTitle||activeTemplate()?.name||`Управленческий отчет — ${srcName(state.source)}`;
  const sourceLabel=()=>activeTemplate()?.sourceLabel||'1С / Управленческая отчетность';
  const currentTemplateKey=()=>state.activeTemplateId||'draft';

  const icon=(name,cls='')=>{const p={
    reports:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15V9M12 15v-3M16 15V7"/>',templates:'<path d="M6 4h9l3 3v13H6z"/><path d="M15 4v4h4M9 12h6M9 16h6"/>',builder:'<path d="M4 7h10M4 12h16M4 17h10"/><circle cx="18" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',data:'<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"/>',sync:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M7 9a7 7 0 0 1 11-2l2 4M17 15a7 7 0 0 1-11 2l-2-4"/>',schedule:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M12 12v4l3 1"/>',add:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4"/>',save:'<path d="M5 5h12l2 2v12H5zM8 5v5h7V5M8 17h8"/>',import:'<path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/>',export:'<path d="M12 20V9m-4 4 4-4 4 4M5 4h14"/>',print:'<path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z"/>',excel:'<path d="M5 4h10l4 4v12H5zM15 4v4h4M8 11l5 6M13 11l-5 6"/>',chart:'<path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',drag:'<circle cx="8" cy="7" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="7" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="17" r="1"/>',share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 11l8-5M8 13l8 5"/>',history:'<path d="M4 12a8 8 0 1 0 3-6M4 4v5h5M12 8v5l3 2"/>',check:'<path d="m5 12 4 4 10-10"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',chev:'<path d="m9 6 6 6-6 6"/>'};return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p[name]||''}</svg>`};

  function datasets(kind,basis='actual'){return DB.datasets.filter(d=>d.source===Number(state.source)&&d.year===Number(state.year)&&d.kind===kind&&d.basis===basis)}
  function dataset(kind,basis='actual'){return datasets(kind,basis)[0]||null}
  function rows(kind,basis='actual'){
    const d=dataset(kind,basis);if(!d)return[];
    if(basis==='plan'){const plans=[...new Set(d.rows.map(r=>r.plan_version).filter(Boolean))];const pv=plans[0];return d.rows.filter(r=>!r.plan_version||r.plan_version===pv)}
    return d.rows;
  }
  function findRow(kind,key,basis='actual'){const rr=rows(kind,basis);let r=rr.find(x=>norm(x.code)===norm(key))||rr.find(x=>norm(x.name)===norm(key));if(!r)r=rr.find(x=>norm(x.name).includes(norm(key))||norm(key).includes(norm(x.name)));return r||null}
  function sourceOverrideKey(d,row,m){return `${d.key}|${row.id}|${m}`}
  function rawMonth(kind,row,m,basis='actual'){
    if(!row)return null;const d=dataset(kind,basis);if(!d)return null;const k=sourceOverrideKey(d,row,m);if(k in state.overrides)return Number(state.overrides[k]);
    if(basis==='actual'&&Number(state.source)===1&&Number(state.year)===2026&&kind==='cf'){const v=latestCf2026[row.name];if(v&&v[m-1]!=null)return v[m-1]}
    return row.values?.[m-1]??null;
  }
  function aggregate(kind,row,basis='actual',preserveEmpty=false){
    if(!row)return preserveEmpty?null:0;
    const values=Array.from({length:state.monthTo-state.monthFrom+1},(_,i)=>rawMonth(kind,row,state.monthFrom+i,basis)).filter(hasNumber).map(Number);
    if(!values.length)return preserveEmpty?null:0;
    const n=norm(row.name);
    if(kind==='cf'&&n.includes('начальный остаток'))return values[0];
    if(kind==='cf'&&n.includes('конечный остаток'))return values.at(-1);
    return values.reduce((sum,value)=>sum+value,0);
  }
  const agg=(kind,key,basis='actual')=>aggregate(kind,findRow(kind,key,basis),basis);
  const plan=(kind,key)=>{const r=findRow(kind,key,'plan');return r?aggregate(kind,r,'plan'):null};
  function templateVal(blockId,key,base){const t=state.templateOverrides[currentTemplateKey()]?.[blockId];return t&&Object.prototype.hasOwnProperty.call(t,key)?Number(t[key]):base}
  function setTemplateVal(blockId,key,value){const tid=currentTemplateKey();state.templateOverrides[tid]??={};state.templateOverrides[tid][blockId]??={};state.templateOverrides[tid][blockId][key]=Number(value)}
  function seedBlock(blockId){const meta=blockCatalog[blockId]||state.customBlocks[blockId];if(!meta?.seed)return null;const [group,key]=meta.seed.split('.');return REPORTS[group]?.blocks?.[key]||null}
  function seedValue(blockId,r,s,base){const t=state.seedOverrides[currentTemplateKey()]?.[blockId];const key=`${r}:${s}`;return t&&Object.prototype.hasOwnProperty.call(t,key)?Number(t[key]):base}
  function setSeedValue(blockId,r,s,value){const tid=currentTemplateKey();state.seedOverrides[tid]??={};state.seedOverrides[tid][blockId]??={};state.seedOverrides[tid][blockId][`${r}:${s}`]=Number(value)}
  function getBlockMeta(id){return blockCatalog[id]||state.customBlocks[id]||{title:id,kind:'metrics',type:'unknown',size:'half'}}

  function shell(content,title){
    if(embeddedMailings||embeddedReports||embeddedBuilder||embeddedTemplates||embeddedSync)return content;
    const nav=[['reports','reports','Отчеты'],['templates','templates','Шаблоны'],['builder','builder','Конструктор'],['data','data','Данные'],['schedules','schedule','Рассылки'],['sync','sync','Синхронизация']];
    return `<div class="app"><aside class="sidebar"><div class="brand"><svg viewBox="0 0 114 29"><use href="#Logo"></use></svg></div><div class="nav-label">Управленческая отчетность</div><nav>${nav.map(([v,i,l])=>`<button class="nav-item ${state.view===v?'active':''}" data-nav="${v}">${icon(i)}<span>${l}</span></button>`).join('')}</nav><div class="nav-label">Система</div><nav><button class="nav-item" data-action="reset-demo">${icon('sync')}<span>Сбросить демо</span></button></nav><div class="sidebar-foot"><div class="avatar">ДБ</div><div><b>Демо-пользователь</b><small>Администратор отчетности</small></div></div></aside><main><header><div class="crumbs"><span>ITP Portal</span><span>/</span><span>Управленческая отчетность</span><span>/</span><b>${esc(title)}</b></div><div class="header-actions"><span class="sync-dot"></span><small>1С + Pelogas · данные доступны</small><button class="btn small" data-action="sync">${icon('sync')}Синхронизировать</button></div></header><div class="content">${content}</div></main></div>`;
  }
  function pageHead(title,desc,actions=''){return `<div class="page-head"><div><h1>${esc(title)}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`}
  function filters(){return `<div class="filterbar"><label>Компания<select data-filter="source"><option value="1" ${state.source===1?'selected':''}>БНТ</option><option value="2" ${state.source===2?'selected':''}>БМП</option><option value="3" ${state.source===3?'selected':''}>Консолидация</option></select></label><label>Год<select data-filter="year">${[2024,2025,2026].map(y=>`<option ${state.year===y?'selected':''}>${y}</option>`).join('')}</select></label><label>Период<div class="period"><select data-filter="monthFrom">${MONTHS_FULL.map((m,i)=>`<option value="${i+1}" ${state.monthFrom===i+1?'selected':''}>${m}</option>`).join('')}</select><span>—</span><select data-filter="monthTo">${MONTHS_FULL.map((m,i)=>`<option value="${i+1}" ${state.monthTo===i+1?'selected':''}>${m}</option>`).join('')}</select></div></label><label>Валюта<select data-filter="currency"><option ${state.currency==='USD'?'selected':''}>USD</option><option ${state.currency==='GEL'?'selected':''}>GEL</option></select></label><label>Единица<select data-filter="unit"><option value="raw" ${state.unit==='raw'?'selected':''}>ед.</option><option value="thousand" ${state.unit==='thousand'?'selected':''}>тыс.</option><option value="million" ${state.unit==='million'?'selected':''}>млн</option></select></label><div class="filter-source"><b>${esc(activeTemplate()?.name||'Черновик')}</b><span>${esc(sourceLabel())}</span></div></div>`}
  const empty=text=>window.BNTUI?.renderEmptyState(text,{size:'smallest'})||`<div class="empty">${esc(text)}</div>`;
  let reportChartSequence=0,reportChartOptions=[],reportChartControllers=[],collectReportCharts=false;
  function stackedReportChart(options){
    const config={id:'report-chart-'+(++reportChartSequence),showHeader:false,showTabs:false,showValues:true,formatValue:fmtRaw,minWidth:1,wrapCategories:true,unit:unitLabel(),categoryLabel:options.orientation==='horizontal'?'Показатель':'Период',...options};
    if(collectReportCharts)reportChartOptions.push({type:'bars',config});
    return window.BNTCharts.renderStackedBars(config);
  }
  function bindReportCharts(){
    reportChartOptions.forEach(({type,config})=>{
      if(type==='bars'){
        const card=root.querySelector(`[data-stacked-card="${config.id}"]`);
        if(card)reportChartControllers.push(window.BNTCharts.mountStackedBars({...config,card}));
      }else{
        const card=root.querySelector(`[data-report-line="${config.id}"]`);
        if(!card)return;
        const chart=card.querySelector('.financial-chart__line-chart'),legend=card.querySelector('.financial-chart__legend');
        let disposed=false;
        const draw=()=>{if(!disposed)window.BNTUI.renderFinancialLineChart(chart,{...config,legend})};
        draw();
        const observer=typeof ResizeObserver==='function'?new ResizeObserver(draw):null;
        observer?.observe(chart.parentElement);
        document.fonts?.ready?.then(draw);
        reportChartControllers.push({destroy(){disposed=true;observer?.disconnect()}});
      }
    });
  }
  function bindReportLayout(){
    const grid=root.querySelector('.report-grid');
    if(!grid)return;
    const blocks=[...grid.querySelectorAll(':scope > .analytics-layout__block')];
    const dividers=[...grid.querySelectorAll(':scope > .ui-divider')];
    const needsRow=block=>getBlockMeta(block.dataset.block).type==='kpi'||Boolean(block.querySelector('table'));
    let paired=false;
    blocks.forEach((block,index)=>{
      const wide=needsRow(block);
      const startsPair=!paired&&!wide&&index+1<blocks.length&&!needsRow(blocks[index+1]);
      if(wide||!paired&&!startsPair)block.setAttribute('data-report-wide','');
      else block.removeAttribute('data-report-wide');
      if(index>0)dividers[index-1]?.classList.toggle('ui-divider--vertical',paired);
      paired=startsPair;
    });
  }

  function reportContent(chart,table=''){
    if(!isReportView())return chart+table;
    return `<div class="${table?'chart-grid--two-column':'div-block'}"><div class="div-block">${chart}</div>${table}</div>`;
  }
  function reportTable(columns,body){
    const headings=columns.map(column=>`<th${column.type?` class="data-table__head-cell--${column.type}"`:''}><span class="data-table__column-heading"><span>${esc(column.label)}</span></span></th>`).join('');
    return `<section class="card table-block table-block--sticky-head"><div class="table-wrap ui-scrollbar"><table class="data-table"><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table></div></section>`;
  }
  function reportTextCell(value,code=''){
    return `<td><div class="table-cell-content"><strong>${esc(value)}</strong>${code?`<small>${esc(code)}</small>`:''}</div></td>`;
  }
  function reportNumberCell(value,attributes={}){
    if(embeddedTemplates&&(!templateEditing||!canEditTemplate()))attributes=Object.fromEntries(Object.entries(attributes).filter(([name])=>!['data-template-edit','data-seed-edit'].includes(name)));
    const editable=Object.hasOwn(attributes,'data-template-edit')||Object.hasOwn(attributes,'data-seed-edit');
    const interaction=editable?{tabindex:0,role:'button','aria-label':`Изменить ${attributes['data-value-label']}`} : {};
    return `<td class="data-table__numeric-cell table-number-cell"${window.BNTUI.attrs({...attributes,...interaction})}>${studioNumber(value)}</td>`;
  }
  function reportDeviationCell(value,negative=value<0){
    return `<td class="data-table__percent-cell table-number-cell"><div class="table-number-content"><span class="table-number-value${value==null?'':` data-table__risk-value is-${negative?'negative':'positive'}`}">${esc(value==null?'—':pct(value))}</span></div></td>`;
  }
  function templateCellAttributes(blockId,key,label,value){
    return {'data-template-edit':'','data-block-id':blockId,'data-value-key':key,'data-value-label':label,'data-base':Number(value)};
  }
  function reportBlock(id,wide=false){
    const editLayout=embeddedTemplates?templateEditing&&canEditTemplate():state.editLayout&&!builderPreview;
    const chartStart=reportChartOptions.length;
    const b=getBlockMeta(id);let body='';
    if(b.type==='compare')body=compareBlock(id);
    else if(b.type==='matrix')body=matrixBlock(id);
    else if(b.type==='indicatorLine'||b.type==='indicatorColumn')body=indicatorBlock(id,b);
    else if(b.type==='seedIndicator')body=seedIndicatorBlock(id,b);
    else if(id==='transshipment'){const d=cfTransshipment(id);body=reportContent(barChart(d,{label:b.title,seriesLabel:'Поступления'}),dataTable(id,d,'Всего',d.reduce((s,x)=>s+x.value,0)));}
    else if(id==='inflow'){const d=cfInflow(id);body=reportContent(barChart(d,{label:b.title,seriesLabel:'Поступления'}),dataTable(id,d,'Всего',d.reduce((s,x)=>s+x.value,0)));}
    else if(id==='netflow'){const d=monthlyNet(id);body=reportContent(barChart(d,{horizontal:false,label:b.title,seriesLabel:'Чистый денежный поток'}),dataTable(id,d,'Итого',d.reduce((s,x)=>s+x.value,0)));}
    else if(id==='outflow'){const d=cfOutflow(id);body=reportContent(barChart(d,{label:b.title,seriesLabel:'Выбытия'}),dataTable(id,d,'Всего',d.reduce((s,x)=>s+x.value,0)));}
    else if(id==='waterfall')body=waterfall(id);
    else if(id==='kpi')body=kpiBlock(id);
    else if(id==='metricTrend'){const s=['Выручка','EBITDA'].map(k=>{const r=findRow('metrics',k);return r?{name:r.name,values:Array.from({length:12},(_,i)=>templateVal(id,`${r.code}:${i+1}`,rawMonth('metrics',r,i+1)))}:null}).filter(Boolean);body=lineChart(s)}
    else if(id==='planFact')body=planFactBlock(id);
    else if(id==='finance')body=genericTable(id,'fi',['BIHL0574','BIHL0590','BIHL0577','BIHL0578','BIHL0575','BIHL0579']);
    else if(id==='operations')body=genericTable(id,'fi',['BIHL0590','BIHL1348','BIHL1344','BIHL1346','BIHL1350','BIHL1354']);
    else if(id==='balance')body=genericTable(id,'ai',['1','2','85','21','97','102']);
    else if(id==='liquidity')body=genericTable(id,'metrics',['КоэффициентТекущейЛиквидности','КоэффициентБыстройЛиквидности','КоэффициентДенежнойЛиквидности','СоотношениеДолгаККапиталу']);
    else if(id==='capex')body=capexBlock(id);else body=empty('Блок пока не настроен');
    if(isReportView()){
      if(collectReportCharts)reportChartOptions.slice(chartStart).forEach(chart=>{chart.blockId=id});
      const headingId=`report-block-title-${id}`;
      const buttonClass='button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest';
      const actions=`<button class="${buttonClass}" type="button" data-action="block-pdf" data-id="${esc(id)}" title="Печать" aria-label="Печать">${studioIcon('StrokePrint')}</button><button class="${buttonClass}" type="button" data-action="block-excel" data-id="${esc(id)}" title="Excel" aria-label="Excel">${studioIcon('StrokeExcel')}</button>${editLayout?`<button class="${buttonClass}" type="button" draggable="true" title="Переместить блок" aria-label="Переместить блок">${studioIcon('Drag')}</button><button class="${buttonClass}" type="button" data-action="remove-block" data-id="${esc(id)}" title="Удалить блок" aria-label="Удалить блок">${studioIcon('Cross')}</button>`:''}`;
      return `<section class="analytics-layout__block" draggable="${editLayout}" data-block="${esc(id)}"${wide===true?' data-report-wide':''} aria-labelledby="${esc(headingId)}"><div class="page-title-actions"><div class="page-title-actions__heading analytics-block-heading"><span class="typography-indicator-small">${esc(b.kind==='production'?'Pelogas':KIND_NAMES[b.kind]||'Отчет')} · ${esc(seedBlock(id)?.unit||unitLabel())}</span><h3 id="${esc(headingId)}" class="typography-label-smallest">${esc(b.title)}</h3></div><div class="page-title-actions__buttons">${actions}</div></div><div class="div-block">${body}</div></section>`;
    }
    return `<section class="report-block size-${b.size||'half'}" draggable="${state.editLayout}" data-block="${id}"><div class="block-head"><div class="block-title-wrap">${state.editLayout?`<span class="drag">${icon('drag')}</span>`:''}<div><h3>${esc(b.title)}</h3><span>${esc(b.kind==='production'?'Pelogas':KIND_NAMES[b.kind]||'Отчет')} · ${esc(seedBlock(id)?.unit||unitLabel())}</span></div></div><div class="block-actions"><button class="icon-btn" data-action="block-excel" data-id="${id}" title="Excel">${icon('excel')}</button><button class="icon-btn" data-action="block-pdf" data-id="${id}" title="PDF">${icon('print')}</button>${state.editLayout?`<button class="icon-btn" data-action="remove-block" data-id="${id}" title="Удалить">${icon('close')}</button>`:''}</div></div><div class="block-body">${body}</div></section>`;
  }

  function barChart(data,{horizontal=true,label='График показателя',seriesLabel='Значение'}={}){
    if(isReportView())data=data.filter(x=>hasNumber(x.value));
    if(!data.length)return empty('Нет данных для выбранного среза');
    if(isReportView()){
      const negative=data.some(x=>x.value<0),series=[{label:seriesLabel,className:'series-crude'}];
      if(negative)series.push({label:'Отрицательное значение',className:'series-negative'});
      const rows=data.map(x=>({label:x.name,values:negative?(x.value<0?[0,conv(x.value)]:[conv(x.value),0]):[conv(x.value)]}));
      return stackedReportChart({title:label,orientation:horizontal?'horizontal':'vertical',series,datasets:{default:rows}});
    }
    if(horizontal){const mx=Math.max(...data.map(x=>Math.abs(x.value)),1);return `<div class="hchart">${data.map(x=>`<div class="hrow"><div class="hname" title="${esc(x.name)}">${esc(x.name)}</div><div class="htrack"><span class="hbar ${x.value<0?'negative-bar':''}" style="width:${Math.max(1,Math.abs(x.value)/mx*100)}%"></span></div><div class="hval">${fmt(x.value)}</div></div>`).join('')}</div>`}
    const vals=data.map(x=>x.value??0),min=Math.min(0,...vals),max=Math.max(0,...vals),range=max-min||1;return `<div class="vchart">${data.map(x=>{const h=Math.max(3,Math.abs(x.value)/range*78);return `<div class="vcol"><div class="vvalue">${fmt(x.value)}</div><div class="vplot"><span class="vbar ${x.value<0?'neg':''}" style="height:${h}%"></span></div><div class="vname">${esc(x.name)}</div></div>`}).join('')}</div>`;
  }
  function lineChart(series){
    if(!series.length)return empty('Нет данных');const idx=[];for(let m=state.monthFrom;m<=state.monthTo;m++)idx.push(m-1);const vals=series.flatMap(s=>idx.map(i=>s.values[i]).filter(hasNumber));if(!vals.length)return empty('Нет данных');
    if(isReportView()){
      const tones=['primary','warning','positive','purple','secondary','negative'],id='report-chart-'+(++reportChartSequence);
      const config={id,autoAxisGutter:true,categories:idx.map(mi=>MONTHS[mi]),series:series.map((s,i)=>({label:s.name,className:tones[i%tones.length],values:idx.map(mi=>hasNumber(s.values[mi])?conv(s.values[mi]):null)})),formatTick:fmtRaw,makePointLabel:({category,seriesItem,value})=>`${seriesItem.label} · ${category}: ${fmtRaw(value)}`};
      if(collectReportCharts)reportChartOptions.push({type:'line',config});
      return `<article class="chart-card chart-card--wide" data-report-line="${id}" aria-label="${esc(series.map(s=>s.name).join(', '))}"><div class="financial-chart__viewport financial-chart__viewport--line"><svg class="financial-chart__line-chart" data-financial-line-chart-uid="${id}" role="img" aria-label="${esc(series.map(s=>s.name).join(', '))}"></svg></div><div class="chart-legend financial-chart__legend typography-body-smallest" aria-label="Легенда диаграммы"></div></article>`;
    }
    const W=760,H=260,p={l:50,r:18,t:16,b:36},min=Math.min(0,...vals),max=Math.max(0,...vals),range=max-min||1,x=i=>p.l+(i/Math.max(1,idx.length-1))*(W-p.l-p.r),y=v=>p.t+(max-v)/range*(H-p.t-p.b);
    const grids=[0,.25,.5,.75,1].map(t=>{const yy=p.t+t*(H-p.t-p.b);return `<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end">${fmt(max-t*range)}</text>`}).join('');
    const paths=series.map((s,si)=>{const pts=idx.map((mi,i)=>s.values[mi]==null?null:[x(i),y(s.values[mi])]).filter(Boolean);const d=pts.map((q,i)=>(i?'L':'M')+q[0]+','+q[1]).join(' ');return `<path d="${d}" class="line l${si}"/>${pts.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="3" class="point p${si}"/>`).join('')}`}).join('');
    return `<div class="svgchart"><svg viewBox="0 0 ${W} ${H}"><g class="grid">${grids}</g>${idx.map((mi,i)=>`<text class="xlabel" x="${x(i)}" y="${H-10}" text-anchor="middle">${MONTHS[mi]}</text>`).join('')}${paths}</svg><div class="legend">${series.map((s,i)=>`<span><i class="ldot l${i}"></i>${esc(s.name)}</span>`).join('')}</div></div>`;
  }
  function dataTable(blockId,data,totalLabel='Всего',total=null){
    if(!state.showTables||isReportView()&&!data.some(x=>hasNumber(x.value)))return'';
    if(isReportView()){
      const totalRow=total!=null?`<tr>${reportTextCell(totalLabel)}${reportNumberCell(fmt(total))}</tr>`:'';
      const body=data.map(x=>`<tr>${reportTextCell(x.name)}${reportNumberCell(fmt(x.value),templateCellAttributes(blockId,x.key||x.name,x.name,x.value))}</tr>`).join('');
      return reportTable([{label:'Показатель'},{label:unitLabel(),type:'numeric'}],totalRow+body);
    }
    return `<div class="mini-table"><table><thead><tr><th>Показатель</th><th>${unitLabel()}</th></tr></thead><tbody>${total!=null?`<tr class="total"><td>${esc(totalLabel)}</td><td>${fmt(total)}</td></tr>`:''}${data.map((x,i)=>`<tr><td>${esc(x.name)}</td><td class="num template-edit" data-template-edit data-block-id="${blockId}" data-value-key="${esc(x.key||x.name)}" data-value-label="${esc(x.name)}" data-base="${Number(x.value)}">${fmt(x.value)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  const cfAmount=key=>aggregate('cf',findRow('cf',key),'actual',isReportView());
  function cfTransshipment(blockId){
    const data=rows('cf').filter(r=>String(r.code).startsWith('Перевалка_')).map(r=>({name:r.name.replace(/^Перевалка[_\s-]*/i,''),key:r.code,value:templateVal(blockId,r.code,aggregate('cf',r,'actual',isReportView()))})).filter(x=>hasNumber(x.value));
    const nonzero=data.filter(x=>Math.abs(x.value)>0.0001);
    return (nonzero.length||!isReportView()?nonzero:data).sort((a,b)=>b.value-a.value);
  }
  function cfInflow(blockId){
    const transshipment=cfTransshipment(blockId),base=[{name:'Перевалка',value:isReportView()&&!transshipment.length?null:transshipment.reduce((s,x)=>s+x.value,0)},{name:'Дивиденды',value:cfAmount('Dividends')},{name:'Прочие доходы',value:cfAmount('Прочие доходы')},{name:'Доходы от неосн.',value:cfAmount('Доходы от неосн.')},{name:'Доходы от аренды',value:cfAmount('Доходы от аренды')},{name:'Доходы от %',value:cfAmount('Доходы от %')}];
    const data=base.map(x=>({...x,key:x.name,value:templateVal(blockId,x.name,x.value)})).filter(x=>hasNumber(x.value)),nonzero=data.filter(x=>Math.abs(x.value)>0.0001);
    return nonzero.length||!isReportView()?nonzero:data;
  }
  function cfOutflow(blockId){const base=['CAPEX','Платежи поставщикам','ФОТ','Платежи в бюджет','Курсовая разница','Пенсионный фонд','Прочие платежи'].map(name=>{const value=cfAmount(name);return {name,value:value==null?null:-value}});return base.map(x=>({...x,key:x.name,value:templateVal(blockId,x.name,x.value)}))}
  function monthlyNet(blockId){const r=findRow('cf','Net cash flows');return Array.from({length:state.monthTo-state.monthFrom+1},(_,i)=>{const m=state.monthFrom+i,base=rawMonth('cf',r,m);return {name:MONTHS[m-1],key:`m${m}`,value:templateVal(blockId,`m${m}`,base)}})}

  function compareBlock(blockId){
    const seed=seedBlock(blockId);if(!seed)return empty('Нет контрольных данных');const group=getBlockMeta(blockId).seed.split('.')[0];const series=REPORTS[group]?.series||seed.headers||[];
    const vals=seed.rows.map((r,ri)=>({name:r.name,values:r.values.map((v,si)=>seedValue(blockId,ri,si,v))}));
    return reportContent(compareChart(vals,series,seed.unit),compareTable(blockId,vals,series,seed.unit));
  }
  function compareChart(rowsData,series,unit){
    if(isReportView()){
      if(!rowsData.some(row=>row.values.some(hasNumber)))return empty('Нет данных');
      const colors=['series-crude','series-light','series-purple','series-gas','series-dark'];
      return stackedReportChart({title:'Сравнение показателей',unit,layout:'grouped',series:series.map((label,i)=>({label,className:colors[i%colors.length]})),datasets:{default:rowsData.map(row=>({label:row.name,values:row.values}))}});
    }
    if(!rowsData.length)return empty('Нет данных');const palette=['#72a9d7','#f39a56','#a9afb5','#63ad7a','#8f82c9'];const max=Math.max(...rowsData.flatMap(r=>r.values.map(v=>Math.max(0,Number(v)||0))),1);const n=rowsData.length,sc=series.length,W=Math.max(620,n*96),H=260,p={l:46,r:18,t:24,b:55},plotW=W-p.l-p.r,groupW=plotW/n,barW=Math.min(20,(groupW-12)/Math.max(1,sc));
    const y=v=>p.t+(1-(Math.max(0,v)/max))*(H-p.t-p.b);const grid=[0,.25,.5,.75,1].map(t=>{const yy=p.t+t*(H-p.t-p.b),v=max*(1-t);return `<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" class="cmp-grid"/><text x="${p.l-7}" y="${yy+3}" text-anchor="end" class="cmp-axis">${new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:1}).format(v)}</text>`}).join('');
    const bars=rowsData.map((r,ri)=>r.values.map((v,si)=>{const x=p.l+ri*groupW+(groupW-sc*barW)/2+si*barW,yv=y(v),h=Math.max(1,H-p.b-yv);return `<rect x="${x}" y="${yv}" width="${Math.max(5,barW-3)}" height="${h}" rx="1" fill="${palette[si%palette.length]}"><title>${esc(r.name)} · ${esc(series[si]||'')}: ${fmtSeed(v,unit)}</title></rect><text x="${x+(barW-3)/2}" y="${Math.max(10,yv-4)}" text-anchor="middle" class="cmp-value">${Math.abs(v)>=1000?new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:1}).format(v):fmtSeed(v,unit)}</text>`}).join('')+`<text x="${p.l+ri*groupW+groupW/2}" y="${H-31}" text-anchor="middle" class="cmp-label">${esc(r.name.length>18?r.name.slice(0,17)+'…':r.name)}</text>`).join('');
    return `<div class="compare-chart-scroll"><svg class="compare-chart" viewBox="0 0 ${W} ${H}" style="min-width:${W}px">${grid}${bars}</svg></div><div class="compare-legend">${series.map((s,i)=>`<span><i style="background:${palette[i%palette.length]}"></i>${esc(s)}</span>`).join('')}</div>`;
  }
  function reportSeedTable(blockId,rowsData,headers,unit){
    const body=rowsData.map((row,ri)=>`<tr>${reportTextCell(row.name)}${row.values.map((value,si)=>reportNumberCell(fmtSeed(value,unit),{'data-seed-edit':'','data-block-id':blockId,'data-row-index':ri,'data-series-index':si,'data-value-label':row.name+' · '+(headers[si]||''),'data-base':Number(value)})).join('')}</tr>`).join('');
    return reportTable([{label:'Показатель'},...headers.map(label=>({label,type:'numeric'}))],body);
  }
  function compareTable(blockId,rowsData,series,unit){
    if(!state.showTables||isReportView()&&!rowsData.some(row=>row.values.some(hasNumber)))return'';
    if(isReportView())return reportSeedTable(blockId,rowsData,series,unit);
    return `<div class="wide-table compare-table"><table><thead><tr><th>Показатель</th>${series.map(s=>`<th class="num">${esc(s)}</th>`).join('')}</tr></thead><tbody>${rowsData.map((r,ri)=>`<tr><td>${esc(r.name)}</td>${r.values.map((v,si)=>`<td class="num seed-edit" data-seed-edit data-block-id="${blockId}" data-row-index="${ri}" data-series-index="${si}" data-value-label="${esc(r.name+' · '+(series[si]||''))}" data-base="${Number(v)}">${fmtSeed(v,unit)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function matrixBlock(blockId){
    const seed=seedBlock(blockId);if(!seed)return empty('Нет данных');const headers=seed.headers||[];const vals=seed.rows.map((r,ri)=>({name:r.name,values:r.values.map((v,si)=>seedValue(blockId,ri,si,v))}));
    if(isReportView())return vals.some(row=>row.values.some(hasNumber))?reportSeedTable(blockId,vals,headers,seed.unit):empty('Нет данных');
    return `<div class="wide-table matrix-table"><table><thead><tr><th>Показатель</th>${headers.map(h=>`<th class="num">${esc(h)}</th>`).join('')}</tr></thead><tbody>${vals.map((r,ri)=>`<tr><td>${esc(r.name)}</td>${r.values.map((v,si)=>`<td class="num seed-edit" data-seed-edit data-block-id="${blockId}" data-row-index="${ri}" data-series-index="${si}" data-value-label="${esc(r.name+' · '+(headers[si]||''))}" data-base="${Number(v)}">${fmtSeed(v,seed.unit)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function indicatorBlock(id,b){
    const r=findRow(b.kind,b.rowKey);if(!r)return empty('Показатель не найден');
    const values=Array.from({length:12},(_,i)=>templateVal(id,`${r.code}:${i+1}`,rawMonth(b.kind,r,i+1))),ser=[{name:r.name,values}];
    const months=Array.from({length:state.monthTo-state.monthFrom+1},(_,i)=>state.monthFrom+i);
    const body=b.type==='indicatorColumn'?barChart(months.map(m=>({name:MONTHS[m-1],value:values[m-1]})),{horizontal:false,label:b.title,seriesLabel:r.name}):lineChart(ser);
    if(isReportView()){
      const table=state.showTables&&months.some(m=>hasNumber(values[m-1]))?reportTable([{label:'Месяц'},{label:unitLabel(),type:'numeric'}],months.map(m=>`<tr>${reportTextCell(MONTHS_FULL[m-1])}${reportNumberCell(fmt(values[m-1]),templateCellAttributes(id,r.code+':'+m,r.name+' · '+MONTHS_FULL[m-1],values[m-1]||0))}</tr>`).join('')):'';
      return reportContent(body,table);
    }
    const table=state.showTables?`<div class="mini-table"><table><thead><tr><th>Месяц</th><th>${unitLabel()}</th></tr></thead><tbody>${months.map(m=>{const v=values[m-1];return `<tr><td>${MONTHS_FULL[m-1]}</td><td class="num template-edit" data-template-edit data-block-id="${id}" data-value-key="${esc(r.code+':'+m)}" data-value-label="${esc(r.name+' · '+MONTHS_FULL[m-1])}" data-base="${Number(v||0)}">${fmt(v)}</td></tr>`}).join('')}</tbody></table></div>`:'';
    return body+table;
  }
  function seedIndicatorBlock(id,b){const source=seedBlock(b.sourceBlockId);if(!source)return empty('Нет данных');const row=source.rows[b.rowIndex];if(!row)return empty('Показатель не найден');const group=getBlockMeta(b.sourceBlockId).seed.split('.')[0],series=REPORTS[group]?.series||source.headers||[];const vals=row.values.map((v,si)=>seedValue(b.sourceBlockId,b.rowIndex,si,v));return reportContent(compareChart([{name:row.name,values:vals}],series,source.unit),compareTable(b.sourceBlockId,[{name:row.name,values:vals}],series,source.unit))}

  function kpiBlock(id){
    const keys=[['Выручка','Выручка'],['EBITDA','EBITDA'],['ЧистаяПрибыль','Чистая прибыль'],['ОперационнаяПрибыль','Операционная прибыль'],['ВаловыйДоход','Валовый доход']];
    if(isReportView()){
      const ui=window.BNTUI;
      const values=keys.map(([key,label])=>({key,label,actual:templateVal(id,key,aggregate('metrics',findRow('metrics',key),'actual',true)),planned:plan('metrics',key)}));
      if(!values.some(({actual})=>hasNumber(actual)))return empty('Нет данных для выбранного среза');
      return `<div class="kpi-grid kpi-grid--five ui-scrollbar" tabindex="0" role="region" aria-labelledby="report-block-title-${esc(id)}">${values.map(({key,label,actual,planned})=>{
        const deviation=hasNumber(actual)&&planned?Math.round((actual-planned)/Math.abs(planned)*100):null;
        const ring=deviation!=null&&Number.isFinite(deviation);
        const attributes={...templateCellAttributes(id,key,label,actual),role:'button',tabindex:0,'aria-label':`Скорректировать: ${label}`};
        const copy=`<div class="${ring?'payment-summary-card__copy':'kpi-card__body'}"><strong class="analytics-kpi__value typography-label-base">${fmt(actual)}</strong><p class="analytics-kpi__context typography-body-smallest">${esc(ring?'к плану':unitLabel())}</p></div>`;
        return `<article class="analytics-kpi${ring?` payment-summary-card payment-summary-card--${deviation<0?'error':'positive'}`:''}"${ui.attrs(attributes)}><header class="analytics-kpi__heading"><h3 class="analytics-kpi__label typography-body-smallest">${esc(label)}</h3></header>${ring?`<div class="payment-summary-card__content">${ui.progressRing({label,percent:deviation,display:pct(deviation),ariaLabel:`${label}: ${pct(deviation)} к плану`})}${copy}</div>`:copy}</article>`;
      }).join('')}</div>`;
    }
    return `<div class="kpi-grid">${keys.map(([k,l])=>{const base=agg('metrics',k),a=templateVal(id,k,base),p=plan('metrics',k),v=p?(a-p)/Math.abs(p)*100:null;return `<div class="kpi-card template-edit" data-template-edit data-block-id="${id}" data-value-key="${esc(k)}" data-value-label="${esc(l)}" data-base="${Number(a)}"><span>${l}</span><strong>${fmt(a)}</strong><small class="${v!=null&&v<0?'neg-txt':'pos-txt'}">${v==null?unitLabel():pct(v)+' к плану'}</small></div>`}).join('')}</div>`;
  }
  function planFactBlock(id){
    const keys=['Выручка','EBITDA','ЧистаяПрибыль','ОперационнаяПрибыль'];
    if(isReportView()&&!keys.some(k=>hasNumber(templateVal(id,k,aggregate('metrics',findRow('metrics',k),'actual',true)))||hasNumber(aggregate('metrics',findRow('metrics',k,'plan'),'plan',true))))return empty('Нет данных для выбранного среза');
    if(isReportView()){
      const body=keys.map(key=>{const row=findRow('metrics',key);if(!row)return'';const actual=templateVal(id,key,aggregate('metrics',row)),planned=plan('metrics',key),deviation=planned?(actual-planned)/Math.abs(planned)*100:null,execution=planned?Math.min(100,Math.abs(actual/planned)*100):0;
        return `<tr>${reportTextCell(row.name)}${reportNumberCell(fmt(actual),templateCellAttributes(id,key,row.name,actual))}${reportNumberCell(planned==null?'—':fmt(planned))}${reportDeviationCell(deviation)}<td class="data-table__numeric-cell data-table__progress-cell"><div class="table-cell-content table-cell-content--numeric"><strong>${Math.round(execution)}%</strong>${window.BNTUI.progress(execution)}</div></td></tr>`;
      }).join('');
      return reportTable([{label:'Показатель'},{label:'Факт',type:'numeric'},{label:'План',type:'numeric'},{label:'Отклонение',type:'percent'},{label:'Исполнение',type:'progress'}],body);
    }
    return `<div class="wide-table"><table><thead><tr><th>Показатель</th><th>Факт</th><th>План</th><th>Отклонение</th><th>Исполнение</th></tr></thead><tbody>${keys.map(k=>{const r=findRow('metrics',k);if(!r)return'';const a=templateVal(id,k,aggregate('metrics',r)),p=plan('metrics',k),v=p?(a-p)/Math.abs(p)*100:null,exec=p?Math.min(100,Math.abs(a/p)*100):0;return `<tr><td>${esc(r.name)}</td><td class="num template-edit" data-template-edit data-block-id="${id}" data-value-key="${esc(k)}" data-value-label="${esc(r.name)}" data-base="${Number(a)}">${fmt(a)}</td><td class="num">${p==null?'—':fmt(p)}</td><td class="num ${v<0?'neg-txt':'pos-txt'}">${v==null?'—':pct(v)}</td><td><div class="progress"><span style="width:${exec}%"></span></div></td></tr>`}).join('')}</tbody></table></div>`;
  }
  function genericTable(id,kind,keys){
    const rr=keys.map(k=>findRow(kind,k)).filter(Boolean);
    if(!rr.length||isReportView()&&!rr.some(r=>hasNumber(templateVal(id,r.code,aggregate(kind,r,'actual',true)))||hasNumber(aggregate(kind,findRow(kind,r.code,'plan'),'plan',true))))return empty('Нет данных для выбранного среза');
    if(isReportView()){
      const body=rr.map(row=>{const actual=templateVal(id,row.code,aggregate(kind,row)),month=rawMonth(kind,row,state.monthTo),planned=plan(kind,row.code),deviation=planned?(actual-planned)/Math.abs(planned)*100:null;
        return `<tr>${reportTextCell(row.name,state.showCodes?row.code:'')}${reportNumberCell(fmt(month))}${reportNumberCell(fmt(actual),templateCellAttributes(id,row.code,row.name,actual))}${reportNumberCell(planned==null?'—':fmt(planned))}${reportDeviationCell(deviation)}</tr>`;
      }).join('');
      return reportTable([{label:'Показатель'},{label:MONTHS[state.monthTo-1],type:'numeric'},{label:'Период',type:'numeric'},{label:'План',type:'numeric'},{label:'Δ',type:'percent'}],body);
    }
    return `<div class="wide-table"><table><thead><tr><th>Показатель</th><th>${MONTHS[state.monthTo-1]}</th><th>Период</th><th>План</th><th>Δ</th></tr></thead><tbody>${rr.map(r=>{const base=aggregate(kind,r),a=templateVal(id,r.code,base),m=rawMonth(kind,r,state.monthTo),p=plan(kind,r.code),v=p?(a-p)/Math.abs(p)*100:null;return `<tr><td>${esc(r.name)}${state.showCodes?`<small>${esc(r.code)}</small>`:''}</td><td class="num">${fmt(m)}</td><td class="num template-edit" data-template-edit data-block-id="${id}" data-value-key="${esc(r.code)}" data-value-label="${esc(r.name)}" data-base="${Number(a)}">${fmt(a)}</td><td class="num">${p==null?'—':fmt(p)}</td><td class="num ${v<0?'neg-txt':'pos-txt'}">${v==null?'—':pct(v)}</td></tr>`}).join('')}</tbody></table></div>`;
  }
  function capexBlock(id){
    const rr=rows('ci').map(r=>({r,a:aggregate('ci',r)})).filter(x=>Math.abs(x.a)>0).sort((a,b)=>Math.abs(b.a)-Math.abs(a.a)).slice(0,10);if(!rr.length)return empty('CAPEX недоступен');
    if(isReportView()){
      const body=rr.map(({r:row,a:base})=>{const actual=templateVal(id,row.code,base),planned=plan('ci',row.code),deviation=planned?(actual-planned)/Math.abs(planned)*100:null;
        return `<tr>${reportTextCell(row.name)}${reportTextCell(row.performer_name||row.performer||'—')}${reportNumberCell(fmt(actual),templateCellAttributes(id,row.code,row.name,actual))}${reportNumberCell(planned==null?'—':fmt(planned))}${reportDeviationCell(deviation,deviation>0)}</tr>`;
      }).join('');
      return reportTable([{label:'Проект / статья'},{label:'Исполнитель'},{label:'Факт',type:'numeric'},{label:'План',type:'numeric'},{label:'Δ',type:'percent'}],body);
    }
    return `<div class="wide-table capex"><table><thead><tr><th>Проект / статья</th><th>Исполнитель</th><th>Факт</th><th>План</th><th>Δ</th></tr></thead><tbody>${rr.map(({r,a:base})=>{const a=templateVal(id,r.code,base),p=plan('ci',r.code),v=p?(a-p)/Math.abs(p)*100:null;return `<tr><td>${esc(r.name)}</td><td>${esc(r.performer_name||r.performer||'—')}</td><td class="num template-edit" data-template-edit data-block-id="${id}" data-value-key="${esc(r.code)}" data-value-label="${esc(r.name)}" data-base="${Number(a)}">${fmt(a)}</td><td class="num">${p==null?'—':fmt(p)}</td><td class="num ${v!=null&&v>0?'neg-txt':'pos-txt'}">${v==null?'—':pct(v)}</td></tr>`}).join('')}</tbody></table></div>`;
  }
  function waterfall(id){
    const base=[{name:'Начальный остаток',value:cfAmount('Начальный остаток'),kind:'base'},{name:'+ от опер.',value:cfAmount('+ от опер.'),kind:'plus'},{name:'- от опер.',value:cfAmount('- от опер.'),kind:'minus'},{name:'+ от инвест.',value:cfAmount('+ от инвест.'),kind:'plus'},{name:'- от инвест.',value:cfAmount('- от инвест.'),kind:'minus'},{name:'+ от фин.',value:cfAmount('+ от фин.'),kind:'plus'},{name:'- от фин.',value:cfAmount('- от фин.'),kind:'minus'},{name:'Other',value:cfAmount('Other'),kind:'other'},{name:'Конечный остаток',value:cfAmount('Конечный остаток'),kind:'base'}];
    const d=base.map(x=>({...x,value:templateVal(id,x.name,x.value)}));
    if(isReportView()&&!d.some(x=>hasNumber(x.value)))return empty('Нет данных для выбранного среза');
    // Optional missing flows still contribute zero to a populated waterfall.
    if(isReportView())d.forEach(x=>{if(!hasNumber(x.value))x.value=0});
    let running=d[0].value,points=[{start:0,end:running,...d[0]}];
    for(let i=1;i<d.length-1;i++){const start=running;running+=d[i].value;points.push({start,end:running,...d[i]})}
    points.push({start:0,end:d[d.length-1].value,...d[d.length-1]});
    let chart;
    if(isReportView()){
      const kinds=['base','plus','minus','other'],series=[{label:'Остаток',className:'series-crude'},{label:'Поступления',className:'series-gas'},{label:'Выбытия',className:'series-negative'},{label:'Прочее',className:'series-purple'}];
      chart=stackedReportChart({title:getBlockMeta(id).title,layout:'waterfall',series,datasets:{default:points.filter(p=>hasNumber(p.value)).map(p=>({label:p.name,start:conv(p.start),end:conv(p.end),seriesIndex:kinds.indexOf(p.kind),values:kinds.map(kind=>kind===p.kind?conv(p.value):0)}))}});
    }else{
      const mx=Math.max(...points.flatMap(x=>[x.start,x.end]).map(Math.abs),1);
      chart=`<div class="waterfall"><div class="wfchart">${points.map(p=>{const top=Math.max(p.start,p.end),bottom=Math.min(p.start,p.end),height=Math.max(2,(top-bottom)/mx*82),offset=bottom/mx*82;return `<div class="wfcol"><div class="wfvalue">${fmt(p.value)}</div><div class="wfplot"><span class="wfbar ${p.kind}" style="height:${height}%;bottom:${offset}%"></span></div><div class="wfname">${esc(p.name)}</div></div>`}).join('')}</div></div>`;
    }
    return reportContent(chart,dataTable(id,d));
  }

  function reportPage(){if(embeddedReports)return corporateReportPage();const actions=`<button class="btn" data-action="toggle-tables">${state.showTables?'Скрыть таблицы':'Показать таблицы'}</button><button class="btn" data-action="toggle-layout">${icon('edit')}${state.editLayout?'Завершить редактирование':'Редактировать макет'}</button><button class="btn" data-action="add-block">${icon('add')}Добавить блок</button><button class="btn" data-action="report-excel">${icon('excel')}Excel</button><button class="btn" data-action="schedule-current">${icon('mail')}Автоотправка</button><button class="btn primary" data-action="print">${icon('print')}PDF / Печать</button>`;return shell(`${pageHead('Отчеты','Каждый шаблон открывает собственную форму, период и источник данных. Значения можно корректировать в рамках конкретного шаблона без изменения исходного набора.',actions)}${filters()}<div class="paper"><div class="paper-title"><div><h2>${esc(reportTitle())}</h2><small>${esc(activeTemplate()?.description||'')}</small></div><span>${esc(srcName(state.source))} · ${esc(sourceLabel())}</span></div><div class="report-grid">${state.blocks.map(reportBlock).join('')}</div><div class="paper-foot"><span>ООО «Батумский нефтяной терминал»</span><span>Powered by ITP Portal</span></div></div>`, 'Отчеты')}
  function templatesPage(){const all=allTemplates();return shell(`${pageHead('Шаблоны','Готовые формы открываются со своими реальными контрольными данными, периодом и источником. Их можно копировать, редактировать, выгружать и назначать на автоматическую рассылку.',`<button class="btn" data-action="import-template">${icon('import')}Принять JSON</button><button class="btn primary" data-action="save-template">${icon('save')}Сохранить текущий</button>`)}<div class="templates">${all.map((t,i)=>`<article class="template"><div class="template-top"><span class="tag">${esc(t.tag||'Личный')}</span><div><button class="icon-btn" data-action="schedule-template" data-index="${i}" title="Рассылка">${icon('mail')}</button><button class="icon-btn" data-action="share-template" data-index="${i}" title="JSON">${icon('share')}</button></div></div><h3>${esc(t.name)}</h3><p>${esc(t.description||'Пользовательский шаблон')}</p>${templateMetadata(t)}<div class="template-mock">${(t.blocks||[]).slice(0,8).map(b=>`<i class="${getBlockMeta(b).size==='full'?'wide':getBlockMeta(b).size==='third'?'third':''}"></i>`).join('')}</div><div class="template-bottom"><span>${(t.blocks||[]).length} блоков</span><button class="btn small" data-action="open-template" data-index="${i}">Открыть ${icon('chev')}</button></div></article>`).join('')}</div>`, 'Шаблоны')}
  function builderPage(){
    if(builderPreview){
      const body=corporateReportBody();
      return `<div class="content-block"><div class="page-title-actions"><button class="button-smallest-ghost typography-button-smallest" type="button" data-action="return-builder">${studioIcon('StrokeReturn')}<span>Конструктор</span></button></div>${templateHeading()}${body}</div>`;
    }
    const dynamic=Object.entries(blockCatalog).filter(([id,b])=>!b.seed);
    const heading=embeddedBuilder?corporateBuilderHeading():`${pageHead('Конструктор',builderDescription,`<button class="btn" data-action="create-chart">${icon('chart')}График по показателю</button><button class="btn" data-action="preview">Предпросмотр</button><button class="btn primary" data-action="save-template">${icon('save')}Сохранить шаблон</button>`)}${filters()}`;
    const workspace=`<div class="builder-layout"><aside class="catalog"><h3>Библиотека блоков</h3><p>Финансовые, производственные и контрольные представления.</p>${dynamic.map(([id,b])=>`<button class="catalog-item" data-action="catalog-add" data-id="${id}"><div><b>${esc(b.title)}</b><small>${esc(KIND_NAMES[b.kind]||'Отчет')} · ${esc(b.type)}</small></div>${icon('add')}</button>`).join('')}<h3 class="catalog-section-title">Готовые формы</h3>${['general_oil','general_oil_dry','general_total_cargo','is_income','is_expenses','cons_production','cons_finance'].map(id=>{const b=getBlockMeta(id);return `<button class="catalog-item" data-action="catalog-add" data-id="${id}"><div><b>${esc(b.title)}</b><small>${esc(b.kind==='production'?'Pelogas':KIND_NAMES[b.kind])}</small></div>${icon('add')}</button>`}).join('')}</aside><section class="canvas"><div class="canvas-head"><div><h3>Холст отчета</h3><p>Перетаскивайте блоки. Индивидуальные графики сохраняются вместе с шаблоном.</p></div><button class="btn" data-action="add-block">${icon('add')}Добавить блок</button></div><div class="canvas-grid">${state.blocks.map(id=>{const b=getBlockMeta(id);return `<div class="canvas-block" draggable="true" data-canvas-block="${id}"><span class="drag">${icon('drag')}</span><div><b>${esc(b.title)}</b><small>${esc(b.size==='full'?'На всю ширину':b.size==='third'?'1/3 страницы':'1/2 страницы')}</small></div><button class="icon-btn" data-action="remove-block" data-id="${id}">${icon('close')}</button></div>`}).join('')}</div></section></div>`;
    return shell(embeddedBuilder?`<div class="content-block">${heading}${builderWorkspace()}</div>`:`${heading}${workspace}`, 'Конструктор');
  }

  function builderCatalogGroup(block){return block.catalogGroup==='forms'?'forms':'library'}
  function builderCatalogMatches(block){
    const group=builderCatalogGroup(block);
    return (builderCatalogScope==='all'||builderCatalogScope===(group==='forms'?'forms':'blocks'))&&norm(`${block.title} ${KIND_NAMES[block.kind]||'Отчет'}`).includes(norm(builderCatalogQuery));
  }
  function builderCatalogItem(id,block,action='catalog-add'){
    const ui=window.BNTUI, ready=builderCatalogGroup(block)==='forms';
    return ui.renderWorkspaceItem({label:block.title,caption:ready?(block.kind==='production'?'Pelogas':KIND_NAMES[block.kind]):`${KIND_NAMES[block.kind]||'Отчет'} · ${block.type}`,icon:`<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/navigation.svg?v=3#${ready?'nav-builder-solid':'nav-management-solid'}"></use></svg>`,actionIcon:ui.icon('plus'),attributes:{'data-action':action,'data-id':id}});
  }
  function builderCatalogResults(action='catalog-add'){
    const found=Object.entries(blockCatalog).filter(([,block])=>builderCatalogMatches(block));
    return found.length?`<div class="layout-list">${found.map(([id,block])=>builderCatalogItem(id,block,action)).join('')}</div>`:window.BNTUI.renderEmptyState('Ничего не найдено',{size:'smallest'});
  }
  function updateBuilderCatalog(workspace){
    if(!workspace)return;
    workspace.querySelectorAll('[data-builder-catalog-tabs], [data-builder-catalog-default]').forEach(element=>{element.hidden=builderCatalogSearching});
    const results=workspace.querySelector('[data-builder-catalog-results]');
    if(results){
      results.hidden=!builderCatalogSearching;
      results.innerHTML=builderCatalogSearching?builderCatalogResults(workspace.dataset.catalogAction):'';
    }
    const body=workspace.querySelector('.layout-drawer-body');
    if(body)body.scrollTop=0;
    window.BNTUI.updateWorkspace(workspace);
  }
  function blockCatalogContent(prefix='builder',action='catalog-add'){
    const ui=window.BNTUI;
    const tabs=[{id:'library',label:'Блоки',info:'О блоках'},{id:'forms',label:'Формы',info:'О формах'}];
    const entries=Object.entries(blockCatalog);
    const catalog=tab=>{
      const blocks=entries.filter(([,block])=>builderCatalogGroup(block)===tab);
      return `<div class="layout-list">${blocks.map(([id,block])=>builderCatalogItem(id,block,action)).join('')}</div>`;
    };
    return `${ui.renderScopedSearch({id:`${prefix}-catalog-search`,label:'Поиск блоков и форм',placeholder:'Введите наименование',options:[{value:'all',label:'Все'},{value:'blocks',label:'Блоки'},{value:'forms',label:'Формы'}],scope:builderCatalogScope,query:builderCatalogDraft,active:builderCatalogSearching,appliedQuery:builderCatalogQuery})}
      <div class="layout-tabs layout-tabs--two" role="tablist" aria-label="Блоки и формы" data-builder-catalog-tabs${builderCatalogSearching?' hidden':''}>${tabs.map(tab=>`<div class="layout-tabs__item"><button id="${prefix}-${tab.id}-tab" class="layout-tabs__tab typography-label-small${builderDrawerTab===tab.id?' is-active':''}" type="button" role="tab" data-workspace-tab="${tab.id}" aria-selected="${builderDrawerTab===tab.id}" aria-controls="${prefix}-${tab.id}-panel" tabindex="${builderDrawerTab===tab.id?'0':'-1'}"><span>${tab.label}</span></button><button class="layout-tabs__info sign_BTN_smallest" type="button" data-action="builder-${tab.id}-info" aria-label="${tab.info}" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button></div>`).join('')}</div>
      <div class="layout-drawer-list-group layout-drawer-list-group--fill"><div class="layout-drawer-body dt-drawer-body ui-scrollbar"><div data-builder-catalog-default${builderCatalogSearching?' hidden':''}>${tabs.map(tab=>`<section id="${prefix}-${tab.id}-panel" role="tabpanel" aria-labelledby="${prefix}-${tab.id}-tab" data-workspace-panel="${tab.id}"${builderDrawerTab===tab.id?'':' hidden'}>${catalog(tab.id)}</section>`).join('')}</div><section data-builder-catalog-results aria-label="Результаты поиска" aria-live="polite"${builderCatalogSearching?'':' hidden'}>${builderCatalogSearching?builderCatalogResults(action):''}</section></div></div>`;
  }
  function builderWorkspace(){
    const ui=window.BNTUI, expanded=String(builderDrawerOpen), hidden=builderDrawerOpen?'':' hidden';
    const canvasHeading=()=>`<div class="layout-toolbar-heading"><h2 class="typography-caption-small">Холст отчета</h2><button class="sign_BTN_smallest" type="button" data-action="canvas-info" aria-label="О холсте отчета" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button></div>`;
    return `<section class="canvas layout-workspace${builderDrawerOpen?'':' is-drawer-collapsed'}" data-workspace data-workspace-fill data-workspace-dismiss data-workspace-tab="${builderDrawerTab}" aria-label="Холст отчета">
      <header class="layout-toolbar">
        <div class="layout-toolbar-group layout-toolbar-group--left">${canvasHeading()}</div>
        <div class="layout-toolbar-group layout-toolbar-group--right layout-drawer-controls">
          <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-workspace-toggle data-workspace-collapsed${builderDrawerOpen?' hidden':''} aria-controls="builder-blocks-drawer" aria-expanded="${expanded}">${studioIcon('More')}<span>Блоки и формы</span></button>
          <div class="layout-drawer-head" data-workspace-expanded${hidden}><h2 id="builder-blocks-title" class="typography-caption-small">Блоки и формы</h2><button class="layout-drawer-toggle button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest is-expanded" type="button" data-workspace-close aria-controls="builder-blocks-drawer" aria-expanded="${expanded}" aria-label="Закрыть блоки и формы">${ui.icon('close')}</button></div>
          <span class="ui-divider brand-divider" aria-hidden="true"></span>
        </div>
      </header>
      <div class="layout-body">
        <section class="layout-surface layout-surface--secondary ui-scrollbar" aria-label="Блоки отчета"><div class="canvas-grid">${state.blocks.map(id=>{const b=getBlockMeta(id),buttonClass='button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest';return `<div class="canvas-block" draggable="true" data-canvas-block="${esc(id)}"><button class="${buttonClass}" type="button" draggable="true" title="Переместить блок" aria-label="Переместить блок">${studioIcon('Drag')}</button><div class="layout-item-label"><strong>${esc(b.title)}</strong><small>${esc(b.size==='full'?'На всю ширину':b.size==='third'?'1/3 страницы':'1/2 страницы')}</small></div><button class="${buttonClass}" type="button" data-action="remove-block" data-id="${esc(id)}" title="Удалить блок" aria-label="Удалить блок">${studioIcon('Cross')}</button></div>`}).join('')}</div></section>
        <aside id="builder-blocks-drawer" class="layout-drawer" data-workspace-drawer aria-labelledby="builder-blocks-title"${hidden}${builderDrawerOpen?'':' inert'}>
          <div class="layout-drawer-content">
            ${blockCatalogContent()}
          </div>
        </aside>
      </div>
    </section>`;
  }

  function dataPage(){if(embeddedData)return corporateDataPage();const dbKinds=['metrics','cf','fi','ai','ci'].filter(k=>dataset(k));const kinds=['production',...dbKinds];const kind=state.dataKind&&kinds.includes(state.dataKind)?state.dataKind:kinds[0];state.dataKind=kind;if(kind==='production')return productionDataPage(kinds);const rr=rows(kind).slice(0,100);return shell(`${pageHead('Данные','Исходные значения из 1С. Для каждого показателя можно сразу построить отдельный график или изменить конкретный месяц с обязательным комментарием.',`<button class="btn" data-action="history">${icon('history')}История изменений</button>`)}${filters()}<div class="data-layout"><aside class="dataset-list">${kinds.map(k=>`<button class="dataset-item ${k===kind?'active':''}" data-action="select-kind" data-kind="${k}"><span>${esc(KIND_NAMES[k])}</span><em>${k==='production'?REPORTS.general.blocks.general_total_cargo.rows.length:rows(k).length}</em></button>`).join('')}</aside><div class="data-card"><div class="data-head"><h3>${esc(KIND_NAMES[kind])}</h3><span>${srcName(state.source)} · Факт · ${state.year}</span></div><div class="data-scroll"><table><thead><tr><th>Код / показатель</th><th>График</th>${MONTHS.map(m=>`<th>${m}</th>`).join('')}<th>Период</th></tr></thead><tbody>${rr.map(r=>`<tr><td>${esc(r.name)}${state.showCodes?`<small>${esc(r.code)}</small>`:''}</td><td><button class="icon-btn inline" data-action="chart-row" data-kind="${kind}" data-row="${esc(r.id)}" title="Создать график">${icon('chart')}</button></td>${MONTHS.map((m,i)=>`<td class="num editable" data-source-edit data-kind="${kind}" data-row="${esc(r.id)}" data-month="${i+1}">${fmt(rawMonth(kind,r,i+1))}</td>`).join('')}<td class="num total-cell">${fmt(aggregate(kind,r))}</td></tr>`).join('')}</tbody></table></div></div></div>`, 'Данные')}
  function productionDataPage(kinds){const seed=REPORTS.general.blocks.general_total_cargo,series=REPORTS.general.series;return shell(`${pageHead('Данные','Производственные данные представлены отдельным источником Pelogas. В демо используются реальные значения из предоставленной формы «Общие показатели».',`<button class="btn" data-action="create-chart">${icon('chart')}Новый график</button>`)}<div class="integration-strip"><div><span class="status ok">Подключено</span><b>Pelogas</b><small>Производственные объемы, виды грузов, тарифные показатели</small></div><div><b>Последняя синхронизация</b><small>28.08.2026 15:50</small></div></div><div class="data-layout"><aside class="dataset-list">${kinds.map(k=>`<button class="dataset-item ${k==='production'?'active':''}" data-action="select-kind" data-kind="${k}"><span>${esc(KIND_NAMES[k])}</span><em>${k==='production'?seed.rows.length:rows(k).length}</em></button>`).join('')}</aside><div class="data-card"><div class="data-head"><h3>Pelogas — производственные показатели</h3><span>Контрольный срез · 8 мес 2026</span></div><div class="data-scroll"><table class="production-table"><thead><tr><th>Показатель</th><th>График</th>${series.map(s=>`<th class="num">${esc(s)}</th>`).join('')}</tr></thead><tbody>${seed.rows.map((r,ri)=>`<tr><td>${esc(r.name)}</td><td><button class="icon-btn inline" data-action="chart-seed-row" data-source-block="general_total_cargo" data-row-index="${ri}" title="Создать график">${icon('chart')}</button></td>${r.values.map((v,si)=>`<td class="num seed-edit" data-seed-edit data-block-id="general_total_cargo" data-row-index="${ri}" data-series-index="${si}" data-value-label="${esc(r.name+' · '+series[si])}" data-base="${v}">${fmtSeed(seedValue('general_total_cargo',ri,si,v),seed.unit)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`, 'Данные')}

  const schedulesDescription='Настройте ежедневную, еженедельную или ежемесячную отправку выбранного шаблона на e-mail. В демо расписания сохраняются локально; на backend это подключается к SMTP/очереди задач.';
  function schedulesPage(){
    const all=allTemplates();
    const ui=window.BNTUI;
    const heading=embeddedMailings?`<section class="page-title-actions">
      <div class="page-title-actions__heading"><div class="page-title-actions__title-row">
        <h1 class="typography-h4">Автоматические рассылки</h1>
        <button class="sign_BTN_smallest info-icon-button" type="button" data-action="schedule-info" aria-expanded="false" aria-label="Информация об автоматических рассылках"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg></button>
      </div></div>
      <div class="page-title-actions__buttons"><button class="button-small button-small--primary typography-button-small" type="button" data-action="new-schedule"><svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><span>Новая рассылка</span></button></div>
    </section>`:pageHead('Автоматические рассылки',schedulesDescription,`<button class="btn primary" data-action="new-schedule">${icon('add')}Новая рассылка</button>`);
    const counts=[['активных',state.schedules.filter(s=>s.enabled).length],['всего правил',state.schedules.length],['получателей',new Set(state.schedules.flatMap(s=>s.recipients||[])).size]];
    const summary=`<div class="metrics-grid metrics-grid--paired" data-metrics-for="schedule-list" aria-label="Сводка рассылок">${counts.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${value}</strong></div>`).join('')}</div>`;
    const body=state.schedules.length?`<div class="schedule-list" id="schedule-list">${state.schedules.map((s,i)=>{
      const t=all.find(x=>x.id===s.templateId);
      const recipients=ui.renderFilterSummary([{key:`recipients-${i}`,label:'Получатели',values:(s.recipients||[]).map(value=>({value,label:value}))}],{rows:3});
      return `<article class="data-block scenario-panel" data-schedule-index="${i}" aria-labelledby="schedule-title-${i}">
        <div class="page-title-actions">${ui.renderToggle({label:s.enabled?'Деактивировать':'Активировать',pressed:s.enabled,attributes:{'data-action':'toggle-schedule','data-index':i,'data-schedule-toggle':true}})}${ui.badge(s.enabled?'Активна':'Пауза',s.enabled?'green':'orange')}</div>
        <div class="scenario-copy scenario-copy--compact"><h3 class="typography-caption-smallest" id="schedule-title-${i}">${esc(t?.name||s.templateId)}</h3>${t?.description?`<p class="typography-body-smallest">${esc(t.description)}</p>`:''}<p class="typography-body-smallest">${esc(s.frequencyLabel)} · ${esc(s.time)} · ${esc(s.format)}</p></div>
        ${recipients}
        <div class="logistics-action-list">
          <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-action="test-schedule" data-index="${i}"><span>Тестовая отправка</span></button>
          <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-action="toggle-schedule" data-index="${i}"><span>${s.enabled?'Приостановить':'Включить'}</span></button>
          <button class="button-smallest-primary-radius typography-button-smallest" type="button" data-action="edit-schedule" data-index="${i}" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Pencil')}<span>Редактировать рассылку</span></button>
        </div>
      </article>`;
    }).join('')}</div>`:embeddedMailings?`<section class="empty-state empty-state--illustrated" aria-labelledby="mailings-empty-title">
      <div class="div-block empty-state__content">
        <svg class="empty-state__illustration" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=2#EmptyStateBox"></use></svg>
        <h2 class="empty-state__title typography-label-base" id="mailings-empty-title">Рассылки еще не настроены</h2>
        <p class="empty-state__description typography-body-small">Настройте отправку выбранного шаблона на e-mail.</p>
        <button class="button-small button-small--secondary typography-button-small" type="button" data-action="new-schedule"><span>Создать рассылку</span></button>
      </div>
    </section>`:`<div class="schedule-list">${empty('Рассылки еще не настроены')}</div>`;
    const content=state.schedules.length?`<div class="content-block">${summary}${body}</div>`:`${summary}${body}`;
    return shell(`${heading}${content}`, 'Рассылки');
  }
  const syncDescription='Контролируемая загрузка финансовых данных из 1С и производственных данных из Pelogas. Ручные корректировки шаблонов сохраняются отдельно от исходных данных.';
  function syncPage(){
    const ui=window.BNTUI;
    const snaps=DB.datasets.filter(d=>d.source===Number(state.source)&&d.year===Number(state.year));
    const rowCount=snaps.reduce((sum,d)=>sum+d.rows.length,0);
    const productionCount=REPORTS.general.blocks.general_total_cargo.rows.length;
    const heading=`<section class="page-title-actions">
      <div class="page-title-actions__heading"><div class="page-title-actions__title-row">
        <h1 class="typography-h4">Синхронизация</h1>
        <button class="sign_BTN_smallest" type="button" data-action="sync-info" aria-label="О синхронизации" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Info')}</button>
      </div></div>
      <div class="page-title-actions__buttons">
        <button class="button-small button-small--primary typography-button-small" type="button" data-action="sync" aria-haspopup="dialog" aria-expanded="false">${ui.icon('sync')}<span>Запустить синхронизацию</span></button>
        <button class="button-small button-small--secondary typography-button-small" type="button" data-action="data-filter" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Filter')}<span>Фильтр</span></button>
      </div>
    </section>`;
    const content=`${heading}<div class="grid-3 grid-3--reference-height" data-sync-grid>
      <div class="div-block" data-sync-sources>
        <article class="chart-card" aria-labelledby="sync-financial-title">
          <div class="filter-summary__pills">${ui.badge('Подключено','green')}</div>
          <div class="card-with-image__body">
            <div class="card-with-image__heading"><span class="card-with-image__eyebrow typography-indicator-small">1С</span><h2 id="sync-financial-title" class="card-with-image__title typography-caption-smallest">Финансовые данные</h2></div>
            <p class="card-with-image__description typography-body-smallest">CF, IS, баланс, CAPEX, KPI, планы и фактические значения.</p>
            <div class="filter-summary__pills">${ui.badge(`${snaps.length} наборов`,'default')}${ui.badge(`${rowCount} строк`,'default')}</div>
          </div>
        </article>
        <article class="chart-card" aria-labelledby="sync-production-title">
          <div class="filter-summary__pills">${ui.badge('Подключено','green')}</div>
          <div class="card-with-image__body">
            <div class="card-with-image__heading"><span class="card-with-image__eyebrow typography-indicator-small">Pelogas</span><h2 id="sync-production-title" class="card-with-image__title typography-caption-smallest">Производственные данные</h2></div>
            <p class="card-with-image__description typography-body-smallest">Объем перевалки, типы грузов и производственные показатели.</p>
            <div class="filter-summary__pills">${ui.badge(`${productionCount} показателей`,'default')}${ui.badge('контроль 8 мес 2026','default')}</div>
          </div>
        </article>
      </div>
      <article class="chart-card payment-summary-card ui-scrollbar" aria-labelledby="sync-summary-title">
        <div class="filter-summary__pills">${ui.badge('Актуально','green')}</div>
        <div class="payment-summary-card__copy">
          <strong class="payment-summary-card__amount typography-indicator-base">${snaps.length+1}</strong>
          <span id="sync-summary-title" class="payment-summary-card__amount payment-summary-card__amount--multiline typography-label-base">источников и наборов</span>
          <p class="payment-summary-card__description typography-body-smallest">${esc(srcName(state.source))} · ${state.year} · ручных корректировок: ${state.manualLog.length}</p>
        </div>
        <div class="dt3-metrics scenario-impact">
          <div><span>строк 1С</span><strong>${rowCount}</strong></div>
          <div><span>Pelogas KPI</span><strong>${productionCount}</strong></div>
          <div><span>рассылки</span><strong>${state.schedules.filter(s=>s.enabled).length}</strong></div>
          <div><span>корректировки</span><strong>${state.manualLog.length}</strong></div>
        </div>
      </article>
      <article class="chart-card" aria-labelledby="sync-slices-title">
        <header class="analytics-block-heading"><h2 id="sync-slices-title" class="typography-caption-smallest">Последние срезы</h2></header>
        <div class="payment-risk-map__risk-column">
        <div class="logistics-alert-list payment-risk-map__scroller ui-scrollbar" tabindex="0" role="region" aria-labelledby="sync-slices-title">
          ${snaps.slice().sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp))).slice(0,6).map(d=>`<article class="logistics-alert logistics-alert--green"><span class="logistics-alert__marker" aria-hidden="true"></span><div class="table-cell-content"><strong class="typography-label-smallest">${esc(d.kindName)} · ${esc(d.basisName)}</strong><span class="typography-body-smallest">${esc(d.timestamp)} · ${d.rows.length} строк</span></div></article>`).join('')}
          <article class="logistics-alert logistics-alert--green"><span class="logistics-alert__marker" aria-hidden="true"></span><div class="table-cell-content"><strong class="typography-label-smallest">Pelogas · производственные данные</strong><span class="typography-body-smallest">28.08.2026 15:50 · контрольный срез</span></div></article>
        </div>
        </div>
      </article>
    </div>`;
    return shell(embeddedSync?content:`<div class="div-block">${content}</div>`, 'Синхронизация');
  }

  function bindSyncLayout(){
    const grid=root.querySelector('[data-sync-grid]'), sources=grid?.querySelector('[data-sync-sources]');
    if(!sources)return;
    let disposed=false;
    const update=()=>{
      if(disposed||!sources.isConnected)return;
      const height=sources.getBoundingClientRect().height;
      if(height>0)grid.style.setProperty('--grid-reference-height',`${height}px`);
    };
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);
    observer?.observe(sources);
    window.addEventListener('resize',update);
    document.fonts?.ready?.then(update);
    syncLayoutCleanup=()=>{disposed=true;observer?.disconnect();window.removeEventListener('resize',update)};
    update();
  }

  function applyTemplate(t){if(!t)return;state.activeTemplateId=t.id;state.blocks=[...(t.blocks||[])];if(t.filters)Object.assign(state,t.filters);if(t.customBlocks)Object.assign(state.customBlocks,t.customBlocks);state.view=embeddedTemplates?'templates':'reports';if(embeddedTemplates){templatePreview=true;templateEditing=false;}render();toast('Шаблон открыт',t.name)}
  function createTemplate(){
    Object.assign(state,{activeTemplateId:'draft',blocks:[],customBlocks:{},editLayout:false,view:'builder'});
    persist();
    window.location.assign('/builder.html');
  }
  function render(){
    if(embeddedMailings||embeddedData||embeddedReports||embeddedBuilder||embeddedTemplates||embeddedSync)window.BNTUI?.closeInfoPopover();
    if(state.monthFrom>state.monthTo)state.monthFrom=state.monthTo;
    syncLayoutCleanup();syncLayoutCleanup=()=>{};
    reportChartControllers.forEach(controller=>controller.destroy());
    reportChartControllers=[];reportChartOptions=[];reportChartSequence=0;collectReportCharts=isReportView();
    root.innerHTML=state.view==='reports'?reportPage():state.view==='templates'?(embeddedTemplates?(templatePreview?corporateTemplatePreview():corporateTemplatesPage()):templatesPage()):state.view==='builder'?builderPage():state.view==='data'?dataPage():state.view==='schedules'?schedulesPage():syncPage();
    collectReportCharts=false;
    if(isReportView()){bindReportLayout();bindReportCharts();}
    if(state.view==='sync')bindSyncLayout();
    if(embeddedBuilder)window.BNTShell?.setBreadcrumbs(builderPreview?[{label:'Конструктор',href:'/builder',onClick:returnToBuilder},{label:'Предпросмотр'}]:undefined);
    if(embeddedTemplates)window.BNTShell?.setBreadcrumbs(templatePreview?[{label:'Шаблоны',href:'/templates.html',onClick:returnToTemplates},{label:'Предпросмотр'}]:undefined);
    if(embeddedBuilder&&!builderPreview)window.BNTUI.updateWorkspace(root.querySelector('[data-workspace]'));
    bindDrag();persist();
  }
  function returnToBuilder(){
    builderPreview=false;
    render();
    root.querySelector('#builder-actions-trigger')?.focus();
  }
  function returnToTemplates(){
    templatePreview=false;templateEditing=false;
    state.view='templates';
    render();
    const index=allTemplates().findIndex(template=>template.id===state.activeTemplateId);
    root.querySelector(`[data-action="open-template"][data-index="${index}"]`)?.focus();
  }
  function toast(title,text='',tone='positive'){return window.BNTUI.toast(title,text,{tone});}

  function blockModal(){modal.innerHTML=`<div class="overlay" data-close><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><h3>Добавить блок</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><div class="block-picker">${Object.entries(blockCatalog).map(([id,b])=>`<button data-action="modal-add-block" data-id="${id}"><div class="block-icon">${icon(b.kind==='production'?'chart':b.kind==='cf'?'reports':b.kind==='ci'?'builder':'data')}</div><div><b>${esc(b.title)}</b><span>${esc(b.kind==='production'?'Pelogas':KIND_NAMES[b.kind]||'Отчет')} · ${b.size==='full'?'полная ширина':b.size==='third'?'1/3 страницы':'1/2 страницы'}</span></div></button>`).join('')}</div></div></div></div>`}
  function reportBlocksDrawer(trigger){
    builderDrawerTab='library';builderCatalogScope='all';builderCatalogQuery='';builderCatalogDraft='';builderCatalogSearching=false;
    const content=`<div class="layout-drawer-content" data-workspace data-workspace-tab="library" data-catalog-action="modal-add-block">${blockCatalogContent('report','modal-add-block')}</div>`;
    openStudioDrawer({id:'report-blocks-drawer',title:'Блоки и формы',content,form:false},trigger);
    window.BNTUI.updateWorkspace(modal.querySelector('[data-workspace]'));
  }
  function showBlockCatalogInfo(trigger){
    const forms=trigger.dataset.action==='builder-forms-info';
    window.BNTUI.showInfoPopover(trigger,{title:forms?'Формы':'Блоки',message:forms?'Здесь вы найдёте комплексные блоки и составные таблицы.':'Финансовые, производственные и контрольные представления.'});
  }
  function saveTemplateModal(trigger) {
    if (!window.BNTUI) { legacySaveTemplateModal(); return; }
    const template=activeTemplate(), editing=embeddedTemplates&&templatePreview&&templateEditing&&canEditTemplate();
    const description = editing?template.description||'':`${state.blocks.length} блоков · ${MONTHS[state.monthFrom-1]}–${MONTHS[state.monthTo-1]} ${state.year}`;
    const fields = studioText('tpl-name', 'Название', editing?template.name:`Копия — ${template?.name || 'Управленческий отчет'}`, 'text', {required: true})
      + `<label class="form-input"><span class="form-input__label typography-label-smallest">Описание</span><span class="form-input__text-field"><svg class="form-input__text-icon" width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=16#Pencil"></use></svg><textarea class="form-input__control form-input__control--text typography-body-smallest" id="tpl-desc" rows="5" required>${esc(description)}</textarea></span></label>`
      + studioSelect('tpl-tag', 'Форма доступа', Object.keys(templateAccessTones), templateAccess());
    openStudioDrawer({id: 'template-save-drawer', title: 'Сохранить шаблон', fields, footer: studioSubmit('confirm-save', 'Сохранить') + studioCancel(), formAttributes: {'data-template-save-form': true}}, trigger);
    templateSaveTarget=editing?template.id:null;
  }
  function legacySaveTemplateModal(){modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Сохранить шаблон</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><label class="field">Название<input id="tpl-name" value="Копия — ${esc(activeTemplate()?.name||'Управленческий отчет')}"></label><label class="field">Описание<textarea id="tpl-desc">${state.blocks.length} блоков · ${MONTHS[state.monthFrom-1]}–${MONTHS[state.monthTo-1]} ${state.year}</textarea></label><label class="field">Доступ<select id="tpl-tag"><option>Личный</option><option>ПЭО</option><option>Общий</option></select></label></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="confirm-save">Сохранить</button></div></div></div>`}
  function templateEditModal(blockId,key,label,base){modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Корректировка в шаблоне</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><h4>${esc(label)}</h4><div class="compare"><div><span>Расчетное значение</span><b>${fmtRaw(base)}</b></div><div><span>Область изменения</span><b>${esc(activeTemplate()?.name||'Черновик')}</b></div></div><label class="field">Новое значение<input id="tpl-edit-value" value="${Number(base)}"></label><label class="field">Причина<textarea id="tpl-edit-reason" placeholder="Уточнение / корректировка для конкретной формы"></textarea></label><p class="modal-note">Исходные данные 1С/Pelogas не изменяются. Корректировка действует только в текущем шаблоне и попадет в историю.</p></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="save-template-edit" data-block-id="${blockId}" data-value-key="${esc(key)}" data-value-label="${esc(label)}" data-base="${Number(base)}">Сохранить</button></div></div></div>`}
  function seedEditModal(blockId,ri,si,label,base){modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Корректировка в шаблоне</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><h4>${esc(label)}</h4><div class="compare"><div><span>Исходное значение формы</span><b>${fmtRaw(base)}</b></div><div><span>Шаблон</span><b>${esc(activeTemplate()?.name||'Черновик')}</b></div></div><label class="field">Новое значение<input id="seed-edit-value" value="${Number(base)}"></label><label class="field">Причина<textarea id="seed-edit-reason" placeholder="Комментарий к корректировке"></textarea></label><p class="modal-note">Изменение сохраняется только для данного шаблона и автоматически перестраивает график.</p></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="save-seed-edit" data-block-id="${blockId}" data-row-index="${ri}" data-series-index="${si}" data-value-label="${esc(label)}" data-base="${Number(base)}">Сохранить</button></div></div></div>`}
  function sourceEditModal(kind,rowId,m){const d=dataset(kind),r=d?.rows.find(x=>x.id===rowId);if(!r)return;const cur=rawMonth(kind,r,m),orig=r.values?.[m-1];modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Ручная корректировка исходных данных</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><h4>${esc(r.name)}</h4><div class="compare"><div><span>Исходное из 1С</span><b>${fmtRaw(orig)}</b></div><div><span>Действующее</span><b>${fmtRaw(cur)}</b></div></div><label class="field">Новое значение<input id="source-edit-value" value="${cur??''}"></label><label class="field">Причина<textarea id="source-edit-reason" placeholder="Уточнение после закрытия периода"></textarea></label></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="save-source-edit" data-kind="${kind}" data-row="${esc(rowId)}" data-month="${m}">Сохранить</button></div></div></div>`}
  function historyModal(trigger){if(!state.manualLog.length&&window.BNTUI){dataHistoryDrawer(trigger);return}modal.innerHTML=`<div class="overlay" data-close><div class="modal wide" onclick="event.stopPropagation()"><div class="modal-head"><h3>История изменений</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body">${state.manualLog.length?`<div class="wide-table"><table><thead><tr><th>Дата</th><th>Область</th><th>Показатель</th><th>Было</th><th>Стало</th><th>Причина</th></tr></thead><tbody>${state.manualLog.slice().reverse().map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.scope||'Данные')}</td><td>${esc(x.name)}</td><td>${esc(fmtRaw(x.old))}</td><td>${esc(fmtRaw(x.value))}</td><td>${esc(x.reason)}</td></tr>`).join('')}</tbody></table></div>`:empty('Изменений пока нет')}</div></div></div>`}
  function syncDrawer(trigger){
    const checks=[
      ['1С — срез прошел валидацию','Источник, период и структура проверены'],
      ['Pelogas — данные доступны','Производственные показатели готовы к обновлению'],
      ['Корректировки шаблонов защищены','Не перезаписываются синхронизацией']
    ];
    const content=`<div class="quality-detail-drawer__fields ui-scrollbar">${checks.map(([label,caption])=>`<div class="canvas-block canvas-block--static"><span class="layout-item-icon layout-item-icon--positive" aria-hidden="true">${window.BNTUI.icon('check')}</span><div class="layout-item-label"><strong>${esc(label)}</strong><small>${esc(caption)}</small></div></div>`).join('')}</div>`;
    openStudioDrawer({id:'sync-drawer',title:'Синхронизация источников',content,footer:studioSubmit('confirm-sync','Применить срезы')+studioCancel(),formAttributes:{'data-sync-form':true}},trigger);
  }
  function confirmSync(){
    closeScheduleDrawer();
    toast('Срезы применены','1С и Pelogas синхронизированы, шаблоны пересчитаны');
  }
  function chartModal(opts = {}, trigger = document.activeElement) {
    if (embeddedBuilder || embeddedReports) dataChartDrawer(opts, trigger);
    else legacyChartModal(opts);
  }
  function legacyChartModal(opts={}){const dbKinds=['metrics','cf','fi','ai','ci'].filter(k=>dataset(k));const kind=opts.kind||dbKinds[0]||'metrics';const rr=rows(kind).slice(0,150);modal.innerHTML=`<div class="overlay" data-close><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><h3>Создать график по показателю</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><div class="chart-form-grid"><label class="field">Набор данных<select id="chart-kind">${dbKinds.map(k=>`<option value="${k}" ${k===kind?'selected':''}>${esc(KIND_NAMES[k])}</option>`).join('')}</select></label><label class="field">Показатель<select id="chart-row">${rr.map(r=>`<option value="${esc(r.id)}" ${opts.rowId===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label><label class="field">Тип графика<select id="chart-type"><option value="indicatorLine">Линейный</option><option value="indicatorColumn">Столбчатый</option></select></label><label class="field">Ширина<select id="chart-size"><option value="half">1/2 страницы</option><option value="full">На всю ширину</option><option value="third">1/3 страницы</option></select></label></div><p class="modal-note">График будет добавлен в текущий шаблон и сохранится в JSON-конфигурации.</p></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="confirm-chart">${icon('chart')}Добавить график</button></div></div></div>`;$('#chart-kind')?.addEventListener('change',e=>legacyChartModal({kind:e.target.value}))}
  function seedChartModal(sourceBlockId,rowIndex){const seed=seedBlock(sourceBlockId),row=seed?.rows?.[rowIndex];if(!row)return;modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Добавить график</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><h4>${esc(row.name)}</h4><p class="modal-note">Будет создан отдельный график по реальным сравнительным значениям из производственной формы.</p><label class="field">Название<input id="seed-chart-title" value="${esc(row.name)}"></label><label class="field">Ширина<select id="seed-chart-size"><option value="half">1/2 страницы</option><option value="third">1/3 страницы</option><option value="full">На всю ширину</option></select></label></div><div class="modal-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" data-action="confirm-seed-chart" data-source-block="${sourceBlockId}" data-row-index="${rowIndex}">${icon('chart')}Добавить</button></div></div></div>`}
  const corporateDataDescriptions = {
    financial: 'Исходные значения из 1С. Для каждого показателя можно сразу построить отдельный график или изменить конкретный месяц с обязательным комментарием.',
    production: 'Производственные данные представлены отдельным источником Pelogas. В демо используются реальные значения из предоставленной формы «Общие показатели».'
  };
  const studioIcon = name => `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=16#${name}"></use></svg>`;
  const studioSelect = (id, label, options, value) => window.BNTUI.renderFormInput({name: id, label, options, value, mode: 'single'});
  const studioText = (id, label, value = '', type = 'text', attributes = {}) => `<label class="form-input"><span class="form-input__label typography-label-smallest">${esc(label)}</span><input class="form-input__control form-input__control--text typography-body-smallest" type="${type}"${type === 'number' ? ' step="any" required' : ''} id="${id}" value="${esc(value)}"${window.BNTUI.attrs(attributes)}></label>`;
  const studioNumber = value => `<div class="table-number-content"><strong>${esc(value)}</strong></div>`;
  const studioSubmit = (action, text) => `<button class="button-smallest-primary-radius typography-button-smallest" type="submit" data-action="${action}"><span>${esc(text)}</span></button>`;
  const studioCancel = () => window.BNTUI.renderDrawerCancel();
  const reportsDescription = 'Каждый шаблон открывает собственную форму, период и источник данных. Значения можно корректировать в рамках конкретного шаблона без изменения исходного набора.';
  const builderDescription = 'Соберите новую форму из готовых блоков или создайте отдельный график по любому показателю. Рабочая область остается широкой — настройки открываются отдельно.';
  const templateSaveDescription = 'Чтобы сохранить шаблон, введите название и описание, затем выберите форму доступа.';
  const templateAccessTones = {'Личный': 'neutral', 'ПЭО': 'mustard', 'Общий': 'purple'};
  const templateAccess = (template=activeTemplate()) => Object.hasOwn(templateAccessTones, template?.access||template?.tag) ? template.access||template.tag : 'Личный';
  const canEditTemplate = () => templateAccess()==='Личный';
  const saveTemplateButton = () => `<button class="button-small button-small--primary typography-button-small" type="button" data-action="save-template" aria-haspopup="dialog" aria-expanded="false">${studioIcon('StrokeSave')}<span>Сохранить шаблон</span></button>`;
  const templateMetadata = template => `<div class="template-meta">${window.BNTUI.badge(template.sourceLabel || '1С', 'default')}${window.BNTUI.badge(template.filters?.year || state.year, 'default')}</div>`;
  function corporateTemplatesPage() {
    const ui = window.BNTUI, all = allTemplates();
    const buttonClass = 'button-smallest-secondary-radius typography-button-smallest';
    const iconButtonClass = 'button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest';
    const openIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
    const plural = new Intl.PluralRules('ru');
    const cards = all.map((template, index) => {
      const blocks = template.blocks || [], count = blocks.length;
      const countLabel = `${count} ${{one:'блок',few:'блока',many:'блоков',other:'блока'}[plural.select(count)]}`;
      const preview = blocks.slice(0, 8).map(id => {
        const block = template.customBlocks?.[id] || getBlockMeta(id);
        const size = ['full', 'third'].includes(block.size) ? block.size : 'half';
        return `<i class="${size === 'full' ? 'wide' : size === 'third' ? 'third' : ''}"></i>`;
      }).join('');
      return `<article class="card-with-image card-with-image--template">
        <div class="card-with-image__media"><div class="card-with-image__preview">${templateMetadata(template)}<div class="template-mock" aria-hidden="true">${preview}</div></div></div>
        ${ui.badge(countLabel, 'neutral')}
        <div class="card-with-image__body">
          <div class="card-with-image__heading"><span class="card-with-image__eyebrow typography-indicator-small">${esc(template.tag || 'Личный')}</span><h2 class="card-with-image__title typography-caption-smallest" title="${esc(template.name)}">${esc(template.name)}</h2></div>
          <p class="card-with-image__description typography-body-smallest" title="${esc(template.description || 'Пользовательский шаблон')}">${esc(template.description || 'Пользовательский шаблон')}</p>
          <div class="card-with-image__actions">
            <button class="${buttonClass} card-with-image__open" type="button" data-action="open-template" data-index="${index}"><span>Открыть</span>${openIcon}</button>
            <button class="${iconButtonClass}" type="button" data-action="schedule-template" data-index="${index}" title="Рассылка" aria-label="Рассылка" aria-haspopup="dialog" aria-expanded="false">${studioIcon('StrokeMail')}</button>
            <button class="${iconButtonClass}" type="button" data-action="share-template" data-index="${index}" title="Поделиться шаблоном (JSON)" aria-label="Поделиться шаблоном (JSON)">${studioIcon('StrokeShare')}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    return `<div class="content-block"><section class="page-title-actions"><div class="page-title-actions__heading"><div class="page-title-actions__title-row"><h1 class="typography-h4">Шаблоны</h1><button class="sign_BTN_smallest" type="button" data-action="templates-info" aria-label="О шаблонах" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Info')}</button></div></div><div class="page-title-actions__buttons"><button class="button-small button-small--secondary typography-button-small" type="button" data-action="import-template">${studioIcon('Download')}<span>Принять JSON</span></button><button class="button-small button-small--primary typography-button-small" type="button" data-action="create-template">${ui.icon('plus')}<span>Создать шаблон</span></button></div></section><div class="templates-grid">${cards}</div></div>`;
  }
  function templateHeading(buttons=saveTemplateButton()) {
    const ui = window.BNTUI, access = templateAccess();
    const groups = [{key: 'forms', label: 'Формы', values: []}, {key: 'charts', label: 'Графики', values: []}];
    state.blocks.forEach(id => {
      const block = getBlockMeta(id);
      if(!['indicatorLine', 'indicatorColumn', 'seedIndicator'].includes(block.type))groups[0].values.push({value: id, label: block.title});
    });
    reportChartOptions.forEach(({blockId})=>groups[1].values.push({value:blockId,label:getBlockMeta(blockId).title}));
    return `<section class="page-title-actions" aria-label="Шаблон"><div class="page-title-actions__heading scenario-copy"><div class="scenario-copy__title-row"><h2 class="typography-caption-small">${esc(activeTemplate()?.name || 'Новый шаблон')}</h2><button class="sign_BTN_smallest" type="button" data-action="template-save-info" aria-label="О сохранении шаблона" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button></div><div class="filter-summary__pills">${ui.badge(access, templateAccessTones[access])}${ui.renderFilterSummary(groups, {counted: true, readonly: true})}</div></div><div class="page-title-actions__buttons">${buttons}</div></section>`;
  }
  function corporateTemplatePreview(){
    const body=corporateReportBody();
    const buttons=canEditTemplate()?`<button class="button-small button-small--secondary typography-button-small" type="button" data-action="toggle-template-edit" aria-pressed="${templateEditing}" aria-haspopup="dialog" aria-expanded="false">${studioIcon(templateEditing?'Cross':'Pencil')}<span>${templateEditing?'Закрыть редактирование':'Редактировать'}</span></button>`:'';
    return `<div class="content-block"><div class="page-title-actions"><button class="button-smallest-ghost typography-button-smallest" type="button" data-action="return-templates">${studioIcon('StrokeReturn')}<span>Шаблоны</span></button></div>${templateHeading(buttons)}${body}</div>`;
  }
  function corporateBuilderHeading() {
    const ui = window.BNTUI;
    const actions = ui.speedDialSecondary({size: 'small', label: 'Действия', ariaLabel: 'Действия с конструктором', triggerAttributes: {id: 'builder-actions-trigger'}, menuAttributes: {'aria-label': 'Действия с конструктором'}, items: [
      {label: 'График\nпо показателю', icon: studioIcon('ChartSolid'), attributes: {'data-action': 'create-chart'}},
      {label: 'Предпросмотр', icon: '<svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/navigation.svg?v=3#nav-reports-solid"></use></svg>', attributes: {'data-action': 'preview'}}
    ]});
    return `<section class="page-title-actions"><div class="page-title-actions__heading"><div class="page-title-actions__title-row"><h1 class="typography-h4">Конструктор</h1><button class="sign_BTN_smallest" type="button" data-action="builder-info" aria-label="О конструкторе" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=13#Info"></use></svg></button></div></div><div class="page-title-actions__buttons">${actions}${saveTemplateButton()}</div></section>`;
  }
  function corporateReportPage() {
    const ui = window.BNTUI;
    const actions = ui.speedDialSecondary({size: 'small', label: 'Действия', ariaLabel: 'Действия с отчётом', triggerAttributes: {id: 'report-actions-trigger'}, menuAttributes: {'aria-label': 'Действия с отчётом'}, items: [
      {label: state.showTables ? 'Скрыть таблицы' : 'Показать таблицы', icon: studioIcon('HideTables'), attributes: {'data-action': 'toggle-tables'}},
      {label: state.editLayout ? 'Завершить\nредактирование' : 'Редактировать\nмакет', icon: studioIcon('EditLayout'), attributes: {'data-action': 'toggle-layout'}},
      {label: 'Добавить блок', icon: ui.icon('plus'), attributes: {'data-action': 'add-block'}},
      {label: 'Excel', icon: studioIcon('Excel'), attributes: {'data-action': 'report-excel'}},
      {label: 'Автоотправка', icon: '<svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/navigation.svg?v=3#nav-mailings-solid"></use></svg>', attributes: {'data-action': 'schedule-current'}},
      {label: 'PDF / Печать', icon: studioIcon('Print'), attributes: {'data-action': 'print'}}
    ]});
    const title = `<section class="page-title-actions"><div class="page-title-actions__heading"><div class="page-title-actions__title-row"><h1 class="typography-h4">Отчёты</h1><button class="sign_BTN_smallest" type="button" data-action="report-info" aria-label="Об отчётах" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=4#Info"></use></svg></button></div></div><div class="page-title-actions__buttons">${actions}<button class="button-small button-small--secondary typography-button-small" type="button" data-action="report-filter" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Filter')}<span>Фильтр</span></button></div></section>`;
    return `<div class="div-block">${title}${corporateReportBody()}</div>`;
  }
  function corporateReportBody() {
    const heading = `<div class="page-title-actions"><div class="page-title-actions__heading"><h2 class="typography-caption-small">${esc(reportTitle())}</h2><p class="typography-body-small">${esc(activeTemplate()?.description || '')}</p></div><span class="typography-indicator-small">${esc(srcName(state.source))} · ${esc(sourceLabel())}</span></div>`;
    const needsRow=id=>state.showTables||getBlockMeta(id).type==='kpi';
    let halfRow=false;
    const blocks=state.blocks.map((id,index)=>{
      const wide=needsRow(id)||(!halfRow&&(index===state.blocks.length-1||needsRow(state.blocks[index+1])));
      const divider=index>0?`<span class="ui-divider brand-divider${halfRow&&!wide?' ui-divider--vertical':''}" aria-hidden="true"></span>`:'';
      halfRow=!wide&&!halfRow;
      return divider+reportBlock(id,wide);
    }).join('');
    return `<section class="data-block">${heading}<div class="report-grid chart-grid--two-column">${blocks}</div><span class="ui-divider brand-divider" aria-hidden="true"></span><footer class="page-title-actions"><span class="typography-indicator-small">ООО «Батумский нефтяной терминал»</span><span class="typography-indicator-small">Powered by ITP Portal</span></footer></section>`;
  }
  function dataKinds() { return ['production', 'metrics', 'cf', 'fi', 'ai', 'ci']; }
  let dataTableSort = {kind: null, column: null, direction: 'default'};
  function sortedDataRows(entries, kind) {
    if (dataTableSort.kind !== kind || dataTableSort.direction === 'default') return entries;
    const column = dataTableSort.column;
    const getValue = ({row, index}) => {
      const value = kind === 'production' ? seedValue('general_total_cargo', index, column, row.values[column]) : column < 12 ? rawMonth(kind, row, column + 1) : aggregate(kind, row);
      return value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    };
    const direction = dataTableSort.direction === 'descending' ? -1 : 1;
    return entries.slice().sort((a, b) => {
      const left = getValue(a), right = getValue(b);
      if (left === null || right === null) return left === right ? a.index - b.index : left === null ? 1 : -1;
      return (left - right) * direction || a.index - b.index;
    });
  }
  function sortDataColumn(column) {
    const wrapper = root.querySelector('.table-wrap');
    const scroll = {left: wrapper?.scrollLeft || 0, top: wrapper?.scrollTop || 0};
    const same = dataTableSort.kind === state.dataKind && dataTableSort.column === column;
    const direction = same && dataTableSort.direction === 'descending' ? 'ascending' : same && dataTableSort.direction === 'ascending' ? 'default' : 'descending';
    dataTableSort = {kind: state.dataKind, column, direction};
    render();
    const updated = root.querySelector('.table-wrap');
    if (updated) { updated.scrollLeft = scroll.left; updated.scrollTop = scroll.top; }
    root.querySelector(`[data-action="sort-data"][data-column="${column}"]`)?.focus();
  }
  function corporateDataPage() {
    const ui = window.BNTUI, kinds = dataKinds();
    if (!kinds.includes(state.dataKind)) state.dataKind = kinds[0];
    const kind = state.dataKind, production = kind === 'production';
    const seed = seedBlock('general_total_cargo'), series = REPORTS.general?.series || [];
    const dropdown = ui.renderDropdown({id: 'data-kind', label: 'Набор данных', size: 'small', value: kind, options: kinds.map(value => ({value, label: KIND_NAMES[value], count: value === 'production' ? seed?.rows?.length || 0 : rows(value).length}))});
    const graphButton = attributes => `<button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button"${ui.attrs(attributes)} title="Создать график" aria-label="Создать график">${studioIcon('NewChart')}</button>`;
    const title = `<section class="page-title-actions"><div class="page-title-actions__heading"><div class="page-title-actions__title-row"><h1 class="typography-h4">Данные</h1><button class="sign_BTN_smallest" type="button" data-action="data-info" aria-label="О данных" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#Info"></use></svg></button></div></div><div class="page-title-actions__buttons">${dropdown}</div></section>`;
    const heading = production ? 'Pelogas — производственные показатели' : KIND_NAMES[kind];
    const source = production ? 'Контрольный срез · 8 мес 2026' : `${srcName(state.source)} · Факт · ${state.year}`;
    const headers = production ? series : [...MONTHS, 'Период'];
    const connection = production ? '<div class="live-line"><i class="live-dot" aria-hidden="true"></i><span class="typography-body-smallest">Подключено</span></div>' : '';
    const tableHeading = `<header class="page-title-actions"><div class="page-title-actions__heading analytics-block-heading"><span class="typography-indicator-small">${esc(source)}</span><div class="analytics-block-title-row"><h2 class="typography-caption-small">${esc(heading)}</h2></div>${connection}</div><div class="page-title-actions__buttons"><button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-action="${production ? 'create-chart' : 'history'}" aria-haspopup="dialog" aria-expanded="false">${studioIcon(production ? 'NewChart' : 'History')}<span>${production ? 'Новый график' : 'История изменений'}</span></button><button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-action="data-filter" aria-haspopup="dialog" aria-expanded="false">${studioIcon('Filter')}<span>Фильтр</span></button></div></header>`;
    const entries = sortedDataRows((production ? seed?.rows || [] : rows(kind).slice(0, 100)).map((row, index) => ({row, index})), kind);
    const tableRows = production ? entries.map(({row, index: ri}) => `<tr><td><div class="table-cell-content"><strong>${esc(row.name)}</strong></div></td>${row.values.map((value, si) => `<td class="data-table__numeric-cell table-number-cell" data-seed-edit data-block-id="general_total_cargo" data-row-index="${ri}" data-series-index="${si}" data-value-label="${esc(row.name + ' · ' + series[si])}" data-base="${value}" tabindex="0" role="button" aria-label="Изменить ${esc(row.name + ' · ' + series[si])}">${studioNumber(fmtSeed(seedValue('general_total_cargo', ri, si, value), seed.unit))}</td>`).join('')}<td class="data-table__action-cell">${graphButton({'data-action': 'chart-seed-row', 'data-source-block': 'general_total_cargo', 'data-row-index': ri})}</td></tr>`).join('') : entries.map(({row}) => `<tr><td><div class="table-cell-content"><strong>${esc(row.name)}</strong>${state.showCodes ? `<small>${esc(row.code)}</small>` : ''}</div></td>${MONTHS.map((_month, index) => `<td class="data-table__numeric-cell table-number-cell" data-source-edit data-kind="${kind}" data-row="${esc(row.id)}" data-month="${index + 1}" tabindex="0" role="button" aria-label="Изменить ${esc(row.name + ' · ' + MONTHS_FULL[index])}">${studioNumber(fmt(rawMonth(kind, row, index + 1)))}</td>`).join('')}<td class="data-table__numeric-cell table-number-cell">${studioNumber(fmt(aggregate(kind, row)))}</td><td class="data-table__action-cell">${graphButton({'data-action': 'chart-row', 'data-kind': kind, 'data-row': row.id})}</td></tr>`).join('');
    const numericHeadings = headers.map((header, column) => {
      const direction = dataTableSort.kind === kind && dataTableSort.column === column ? dataTableSort.direction : 'default';
      const icon = direction === 'descending' ? 'SortDescending' : direction === 'ascending' ? 'SortAscending' : 'SortDefault';
      const next = direction === 'descending' ? 'от меньшего к большему' : direction === 'ascending' ? 'по умолчанию' : 'от большего к меньшему';
      return `<th class="data-table__head-cell--numeric" aria-sort="${direction === 'default' ? 'none' : direction}"><div class="data-table__column-heading"><span>${esc(header)}</span><button class="data-table__sort" type="button" data-action="sort-data" data-column="${column}" data-sort-direction="${direction}" aria-label="Сортировать ${esc(header)} ${next}" title="Сортировать ${esc(header)} ${next}"><svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#${icon}"></use></svg></button></div></th>`;
    }).join('');
    return `<div class="div-block">${title}${tableHeading}<section class="card table-block table-block--sticky-head" aria-label="${esc(heading)}"><div class="table-wrap ui-scrollbar"><table class="data-table"><thead><tr><th><div class="data-table__column-heading">${production ? 'Показатель' : 'Код / показатель'}</div></th>${numericHeadings}<th class="data-table__head-cell--action"><div class="data-table__column-heading">График</div></th></tr></thead><tbody>${tableRows || window.BNTUI.renderEmptyTableRow(headers.length + 2, 'Нет данных')}</tbody></table></div></section></div>`;
  }
  function openStudioDrawer(options, trigger = document.activeElement) {
    window.BNTUI.closeInfoPopover();
    window.BNTUI.closeDropdowns();
    window.BNTUI.closeSpeedDials();
    window.BNTUI.closeFilterSummaryMenus();
    closeScheduleDrawer(false);
    scheduleDrawerTrigger = trigger;
    if (!trigger?.closest('[data-speed-dial-secondary]')) trigger?.setAttribute('aria-expanded', 'true');
    modal.innerHTML = window.BNTUI.renderDrawer(options);
    requestAnimationFrame(() => modal.querySelector('.dt3-drawer-toggle')?.focus());
  }
  function dataPeriod(year = state.year) {
    const ui = window.BNTUI;
    // Source values are monthly; dates retain the range while totals use inclusive months.
    const matchesMonth = (value, month) => {
      const date = ui.parseDate(value);
      return date?.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month);
    };
    const from = matchesMonth(state.dataDateFrom, state.monthFrom) ? state.dataDateFrom : ui.isoDate(new Date(year, state.monthFrom - 1, 1));
    const to = matchesMonth(state.dataDateTo, state.monthTo) ? state.dataDateTo : ui.isoDate(new Date(year, state.monthTo, 0));
    return {from, to};
  }
  function dataFilterDrawer(trigger, {preview = false} = {}) {
    const ui = window.BNTUI, period = dataPeriod();
    const years = [...new Set([2024, 2025, 2026, state.year])].sort();
    const dates = `<div class="equipment-date-grid">${ui.renderDateField({name: 'data-date-from', label: 'Дата с', value: period.from, min: `${state.year}-01-01`, max: `${state.year}-12-31`})}${ui.renderDateField({name: 'data-date-to', label: 'Дата по', value: period.to, min: `${state.year}-01-01`, max: `${state.year}-12-31`})}</div>`;
    openStudioDrawer({id: preview ? 'builder-preview-drawer' : 'data-filter-drawer', title: preview ? 'Настройка данных для предпросмотра' : 'Фильтр', fields: studioSelect('data-source', 'Компания', [1, 2, 3].map(value => ({value, label: srcName(value)})), state.source) + studioSelect('data-year', 'Год', years, state.year) + dates + studioSelect('data-currency', 'Валюта', ['USD', 'GEL'], state.currency) + studioSelect('data-unit', 'Единица', [{value: 'raw', label: 'ед.'}, {value: 'thousand', label: 'тыс.'}, {value: 'million', label: 'млн'}], state.unit), footer: studioSubmit(preview ? 'apply-builder-preview' : 'apply-data-filter', 'Применить') + (preview ? studioCancel() : `<button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-action="reset-data-filter">${ui.icon('close')}<span>Сбросить всё</span></button>`), formAttributes: preview ? {'data-builder-preview-form': true} : {'data-data-filter-form': true}}, trigger);
  }
  function syncDataFilterYear() {
    const ui = window.BNTUI, year = Number($('#data-year')?.value);
    ['from', 'to'].forEach(part => {
      const root = modal.querySelector(`[data-bnt-date-root="data-date-${part}"]`);
      if (!root) return;
      const previous = ui.parseDate(root.querySelector('[data-bnt-date]')?.value);
      const month = previous?.getMonth() ?? (part === 'from' ? 0 : 11);
      const day = Math.min(previous?.getDate() || (part === 'from' ? 1 : 31), new Date(year, month + 1, 0).getDate());
      root.dataset.dateMin = `${year}-01-01`; root.dataset.dateMax = `${year}-12-31`;
      ui.syncDateField(root, ui.isoDate(new Date(year, month, day)));
    });
    ui.closeDatePickers();
  }
  function applyDataFilter(preview = false) {
    const ui = window.BNTUI, year = Number($('#data-year')?.value);
    const from = $('#data-date-from')?.value, to = $('#data-date-to')?.value;
    if (!ui.parseDate(from) || !ui.parseDate(to) || from > to || !from.startsWith(`${year}-`) || !to.startsWith(`${year}-`)) { toast('Проверьте период', 'Дата с должна быть не позже даты по в выбранном году','warning'); return; }
    Object.assign(state, {source: Number($('#data-source')?.value), year, monthFrom: ui.parseDate(from).getMonth() + 1, monthTo: ui.parseDate(to).getMonth() + 1, dataDateFrom: from, dataDateTo: to, currency: $('#data-currency')?.value, unit: $('#data-unit')?.value, activeTemplateId: embeddedReports || preview ? state.activeTemplateId : 'draft'});
    closeScheduleDrawer(false);
    if (preview) builderPreview=true;
    render();
    root.querySelector(preview ? '[data-action="return-builder"]' : `[data-action="${embeddedReports ? 'report-filter' : 'data-filter'}"]`)?.focus();
  }
  function dataHistoryDrawer(trigger) {
    if (!state.manualLog.length) {
      openStudioDrawer({id: 'data-history-drawer', title: 'История изменений', emptyMessage: 'Изменений пока нет'}, trigger);
      return;
    }
    const content = `<section class="card table-block"><div class="table-wrap ui-scrollbar"><table class="data-table"><thead><tr>${['Дата', 'Область', 'Показатель', 'Было', 'Стало', 'Причина'].map(label => `<th><div class="data-table__column-heading">${label}</div></th>`).join('')}</tr></thead><tbody>${state.manualLog.slice().reverse().map(item => `<tr><td>${esc(item.date)}</td><td>${esc(item.scope || 'Данные')}</td><td>${esc(item.name)}</td><td class="data-table__numeric-cell">${esc(fmtRaw(item.old))}</td><td class="data-table__numeric-cell">${esc(fmtRaw(item.value))}</td><td>${esc(item.reason)}</td></tr>`).join('')}</tbody></table></div></section>`;
    openStudioDrawer({id: 'data-history-drawer', title: 'История изменений', fields: content, footer: studioCancel()}, trigger);
  }
  function dataChartDrawer(opts = {}, trigger) {
    const kinds = embeddedData ? dataKinds() : ['metrics', 'cf', 'fi', 'ai', 'ci'].filter(kind => dataset(kind));
    const requested = opts.kind || state.dataKind;
    const kind = kinds.includes(requested) ? requested : kinds[0];
    const production = kind === 'production', seed = seedBlock('general_total_cargo');
    const touched = [...modal.querySelectorAll('.form-input.is-touched')].map(field => field.dataset.formInput).filter(Boolean);
    const availableRows = production ? (seed?.rows || []).map((row, index) => ({value: index, label: row.name})) : rows(kind).slice(0, 150).map(row => ({value: row.id, label: row.name}));
    const selected = availableRows.find(row => String(row.value) === String(opts.rowId ?? opts.rowIndex)) || availableRows[0];
    const fields = studioSelect('chart-kind', 'Набор данных', kinds.map(value => ({value, label: KIND_NAMES[value]})), kind) + studioSelect('chart-row', 'Показатель', availableRows, opts.rowId ?? opts.rowIndex ?? availableRows[0]?.value) + (production ? '' : studioSelect('chart-type', 'Тип графика', [{value: 'indicatorLine', label: 'Линейный'}, {value: 'indicatorColumn', label: 'Столбчатый'}], opts.type || 'indicatorLine')) + studioSelect('chart-size', 'Ширина', [{value: 'half', label: '1/2 страницы'}, {value: 'full', label: 'На всю ширину'}, {value: 'third', label: '1/3 страницы'}], opts.size || 'half');
    openStudioDrawer({id: 'data-chart-drawer', title: embeddedData ? 'Новый график' : 'Создать график по показателю', description: 'График будет добавлен в текущий шаблон и сохранится в JSON-конфигурации.', fields: fields + (production ? studioText('chart-title', 'Название', selected?.label || '') : ''), footer: studioSubmit('confirm-data-chart', 'Добавить график') + studioCancel(), formAttributes: {'data-data-chart-form': true}}, trigger);
    touched.filter(id => id !== 'chart-row').forEach(id => window.BNTUI.touchFormInput(modal.querySelector(`[data-form-input="${id}"]`)));
  }
  function saveDataChart() {
    const kind = $('#chart-kind')?.value, rowId = $('#chart-row')?.value, size = $('#chart-size')?.value || 'half';
    const production = kind === 'production', row = production ? seedBlock('general_total_cargo')?.rows?.[Number(rowId)] : dataset(kind)?.rows.find(item => String(item.id) === rowId);
    if (!row) { toast('Выберите показатель','','warning'); return; }
    const id = `${production ? 'seedchart' : 'chart'}-${Date.now()}`;
    state.customBlocks[id] = production ? {title: $('#chart-title')?.value.trim() || row.name, kind, type: 'seedIndicator', size, sourceBlockId: 'general_total_cargo', rowIndex: Number(rowId)} : {title: row.name, kind, type: $('#chart-type')?.value || 'indicatorLine', size, rowKey: row.code};
    state.blocks.push(id); state.view = embeddedBuilder ? 'builder' : 'reports'; persist(); closeScheduleDrawer(false);
    if (embeddedData) window.location.assign('/reports.html');
    else { render(); root.querySelector('#builder-actions-trigger, #report-actions-trigger')?.focus(); toast('График добавлен', row.name); }
  }
  function dataEditDrawer(cell) {
    const production = cell.hasAttribute('data-seed-edit');
    const template = cell.hasAttribute('data-template-edit');
    const kind = cell.dataset.kind, row = production ? null : dataset(kind)?.rows.find(item => String(item.id) === cell.dataset.row);
    if (!production && !template && !row) return;
    const id = production ? 'seed' : template ? 'tpl' : 'source';
    const original = production || template ? Number(cell.dataset.base) : row.values?.[Number(cell.dataset.month) - 1];
    const value = production ? seedValue(cell.dataset.blockId, Number(cell.dataset.rowIndex), Number(cell.dataset.seriesIndex), original) : template ? templateVal(cell.dataset.blockId, cell.dataset.valueKey, original) : rawMonth(kind, row, Number(cell.dataset.month));
    const label = production || template ? cell.dataset.valueLabel : row.name;
    const summary = studioText(`${id}-edit-original`, production ? 'Исходное значение формы' : template ? 'Расчетное значение' : 'Исходное из 1С', fmtRaw(original), 'text', {readonly: true, disabled: true, tabindex: -1}) + studioText(`${id}-edit-current`, 'Действующее', fmtRaw(value), 'text', {readonly: true, disabled: true, tabindex: -1});
    const fields = `${isReportView()?'':`<div class="analytics-block-heading"><h3 class="typography-caption-small">${esc(label)}</h3></div>`}${summary}${studioText(`${id}-edit-value`, 'Новое значение', value ?? '', 'number')}<label class="form-input"><span class="form-input__label typography-label-smallest">Обоснование</span><span class="form-input__text-field"><svg class="form-input__text-icon" width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=16#Pencil"></use></svg><textarea class="form-input__control form-input__control--text typography-body-smallest" id="${id}-edit-reason" name="reason" rows="5" required></textarea></span></label>`;
    const attributes = production ? {'data-block-id': cell.dataset.blockId, 'data-row-index': cell.dataset.rowIndex, 'data-series-index': cell.dataset.seriesIndex, 'data-value-label': label, 'data-base': value} : template ? {'data-block-id': cell.dataset.blockId, 'data-value-key': cell.dataset.valueKey, 'data-value-label': label, 'data-base': value} : {'data-kind': kind, 'data-row': row.id, 'data-month': cell.dataset.month};
    const footer = `<button class="button-smallest-primary-radius typography-button-smallest" type="submit" data-action="save-${template ? 'template' : id}-edit"${window.BNTUI.attrs(attributes)}><span>Сохранить</span></button>` + studioCancel();
    openStudioDrawer({id: 'data-edit-drawer', title: isReportView() ? `Корректировка для ${label}` : production ? 'Корректировка в шаблоне' : 'Ручная корректировка исходных данных', fields, footer, formAttributes: {'data-data-edit-form': true}}, cell);
  }
  let scheduleDrawerTrigger = null;
  function closeScheduleDrawer(restoreFocus = true) {
    window.BNTUI?.closeInfoPopover();
    window.BNTUI?.closeSingleFormInputs(modal);
    window.BNTUI?.closeTimeFields(modal);
    window.BNTUI?.closeDatePickers('bnt', null, modal);
    modal.innerHTML = '';
    templateSaveTarget=null;
    scheduleEditTarget=null;
    scheduleDrawerTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) scheduleDrawerTrigger?.focus?.();
    scheduleDrawerTrigger = null;
  }
  function finishDataEdit() {
    const trigger = embeddedData || isReportView() ? scheduleDrawerTrigger : null;
    const source = trigger?.hasAttribute('data-source-edit');
    const template = trigger?.hasAttribute('data-template-edit');
    const selector = source ? '[data-source-edit]' : template ? '[data-template-edit]' : '[data-seed-edit]';
    const keys = source ? ['kind', 'row', 'month'] : template ? ['blockId', 'valueKey'] : ['blockId', 'rowIndex', 'seriesIndex'];
    if (embeddedData || isReportView()) closeScheduleDrawer(false); else modal.innerHTML = '';
    render();
    if (trigger) [...root.querySelectorAll(selector)].find(cell => keys.every(key => cell.dataset[key] === trigger.dataset[key]))?.focus();
  }
  function scheduleModal(templateId = state.activeTemplateId, trigger = document.activeElement, editIndex = null) {
    const ui = window.BNTUI;
    if (!ui) { legacyScheduleModal(templateId); return; }
    const all = allTemplates();
    const schedule = editIndex == null ? null : state.schedules[editIndex];
    if (editIndex != null && !schedule) return;
    const select = (name, label, options, value) => ui.renderFormInput({name: `schedule-${name}`, label, options, value, mode: 'single'});
    const text = (name, label, value = '', placeholder = '') => `<label class="form-input"><span class="form-input__label typography-label-smallest">${esc(label)}</span><input class="form-input__control form-input__control--text typography-body-smallest" type="text" id="schedule-${name}" name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
    const fields = select('template', 'Шаблон', all.map(t => ({value: t.id, label: t.name})), schedule?.templateId || templateId)
      + text('recipients', 'Получатели', (schedule?.recipients||[]).join(', '), 'director@company.ge, peo@company.ge')
      + select('frequency', 'Периодичность', [{value: 'daily', label: 'Каждый день'}, {value: 'weekly', label: 'Каждую неделю'}, {value: 'monthly', label: 'Каждый месяц'}], schedule?.frequency || 'daily')
      + ui.renderTimeField({name: 'schedule-time', label: 'Время', value: schedule?.time || '08:00'})
      + select('format', 'Формат', ['PDF', 'Excel', 'PDF + Excel'], schedule?.format || 'PDF')
      + text('subject', 'Тема письма', schedule?.subject || 'Управленческий отчет');
    const secondary = schedule ? '<button class="button-smallest-secondary-radius button-smallest-secondary-radius--error typography-button-smallest" type="button" data-action="delete-schedule"><span>Удалить рассылку</span></button>' : studioCancel();
    openStudioDrawer({id: 'schedule-drawer', title: schedule ? 'Редактировать рассылку' : 'Автоматическая отправка отчета', fields, footer: studioSubmit('confirm-schedule', 'Сохранить рассылку') + secondary, formAttributes: {'data-schedule-form': true}}, trigger);
    scheduleEditTarget=editIndex;
  }
  function legacyScheduleModal(templateId=state.activeTemplateId){const all=allTemplates();modal.innerHTML=`<div class="overlay" data-close><div class="modal sm" onclick="event.stopPropagation()"><div class="modal-head"><h3>Автоматическая отправка отчета</h3><button class="icon-btn" data-close>${icon('close')}</button></div><div class="modal-body"><label class="field">Шаблон<select id="schedule-template">${all.map(t=>`<option value="${t.id}" ${t.id===templateId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label class="field">Получатели<input id="schedule-recipients" placeholder="director@company.ge, peo@company.ge"></label><div class="chart-form-grid"><label class="field">Периодичность<select id="schedule-frequency"><option value="daily">Каждый день</option><option value="weekly">Каждую неделю</option><option value="monthly">Каждый месяц</option></select></label><label class="field">Время<input id="schedule-time" type="time" value="08:00"></label><label class="field">Формат<select id="schedule-format"><option>PDF</option><option>Excel</option><option>PDF + Excel</option></select></label><label class="field">Тема письма<input id="schedule-subject" value="Управленческий отчет"></label></div></div><div class="modal-foot"><button class="btn primary" data-action="confirm-schedule">Сохранить рассылку</button><button class="btn" data-close>Отмена</button></div></div></div>`}

  function exportTemplate(t){const tid=t?.id||currentTemplateKey();const payload={version:5,id:tid,name:t?.name||activeTemplate()?.name||'BNT report template',description:t?.description||activeTemplate()?.description||'',tag:t?.tag||activeTemplate()?.tag||'Личный',access:templateAccess(t||activeTemplate()),reportTitle:t?.reportTitle||reportTitle(),sourceLabel:t?.sourceLabel||sourceLabel(),filters:t?.filters||{source:state.source,year:state.year,monthFrom:state.monthFrom,monthTo:state.monthTo,currency:state.currency,unit:state.unit},blocks:t?.blocks||state.blocks,customBlocks:t?.customBlocks||state.customBlocks,templateOverrides:state.templateOverrides[tid]||{},seedOverrides:state.seedOverrides[tid]||{}};downloadBlob(JSON.stringify(payload,null,2),'application/json','BNT_Report_Template.json')}
  function downloadBlob(content,type,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function excelHtmlFromElement(el,title){const tables=[...el.querySelectorAll('table')];if(!tables.length)return null;return `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:11pt}h2{font-size:16pt}table{border-collapse:collapse;margin:14px 0;width:100%}th,td{border:1px solid #d9e3ea;padding:6px}th{background:#eef5f8}td.num{text-align:right}</style></head><body><h2>${esc(title)}</h2>${tables.map(t=>t.outerHTML).join('<br>')}</body></html>`}
  function exportReportExcel(){const old=state.showTables;state.showTables=true;const holder=document.createElement('div');holder.innerHTML=`<div class="paper"><div class="report-grid">${state.blocks.map(reportBlock).join('')}</div></div>`;state.showTables=old;const html=excelHtmlFromElement(holder,reportTitle());if(!html){toast('Нет данных для Excel','','warning');return}downloadBlob('\ufeff'+html,'application/vnd.ms-excel',`${safeFileName(activeTemplate()?.name||'BNT_Report')}.xls`);toast('Excel сформирован')}
  function exportBlockExcel(id){const old=state.showTables;state.showTables=true;const holder=document.createElement('div');holder.innerHTML=reportBlock(id);state.showTables=old;const html=excelHtmlFromElement(holder,getBlockMeta(id).title);if(!html){toast('Нет таблицы для экспорта','','warning');return}downloadBlob('\ufeff'+html,'application/vnd.ms-excel',`${safeFileName(getBlockMeta(id).title)}.xls`)}
  function printBlock(id){
    const el=document.querySelector(`[data-block="${CSS.escape(id)}"]`);if(!el)return;
    const w=window.open('','_blank','width=1100,height=800');if(!w){toast('Разрешите всплывающие окна','','warning');return}
    const sharedStyles=isReportView()?['tokens.css','components.css'].map(file=>`<link rel="stylesheet" href="${esc(document.querySelector(`link[href*="/assets/css/${file}"]`)?.href||`/assets/css/${file}`)}">`).join(''):'';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(getBlockMeta(id).title)}</title><link rel="stylesheet" href="/legacy/report-studio-v5/styles.css">${sharedStyles}<style>body{background:#fff;padding:20px}.report-block{border:0}.block-actions{display:none}.block-body{padding:10px}</style></head><body>${el.outerHTML}<script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);w.document.close();
  }
  const safeFileName=s=>String(s).replace(/[\\/:*?"<>|]+/g,'_').slice(0,80);

  function bindBlockCatalog(host){
    const prefix=host===modal?'report':'builder';
    host.addEventListener('workspacechange',event=>{
      if(!(embeddedBuilder||embeddedReports)||!event.target.hasAttribute('data-workspace'))return;
      if(host===root&&embeddedBuilder)builderDrawerOpen=event.detail.open;
      if(event.detail.tab)builderDrawerTab=event.detail.tab;
      if(builderCatalogScope!=='all'){
        builderCatalogScope=builderDrawerTab==='forms'?'forms':'blocks';
        window.BNTUI.syncDropdown(event.target.querySelector(`[data-ui-dropdown="${prefix}-catalog-search-scope"]`),builderCatalogScope);
        updateBuilderCatalog(event.target);
      }
    });
    host.addEventListener('input',event=>{
      if(!(embeddedBuilder||embeddedReports)||event.target.id!==`${prefix}-catalog-search`)return;
      builderCatalogDraft=event.target.value;
    });
    host.addEventListener('scopedsearchchange',event=>{
      if(!(embeddedBuilder||embeddedReports)||event.target.dataset.scopedSearch!==`${prefix}-catalog-search`)return;
      builderCatalogScope=event.detail.scope;
      builderCatalogQuery=event.detail.query;
      builderCatalogSearching=event.detail.active;
      builderCatalogDraft=event.target.querySelector('input[type="search"]').value;
      const workspace=host.querySelector('[data-workspace]');
      if(builderCatalogScope!=='all')window.BNTUI.setWorkspaceTab(workspace,builderCatalogScope==='forms'?'forms':'library');
      updateBuilderCatalog(workspace);
    });
  }
  bindBlockCatalog(root);
  bindBlockCatalog(modal);
  root.addEventListener('click',e=>{
    const recipient=e.target.closest('[data-equipment-filter-remove-value^="recipients-"]');
    if(recipient){
      e.preventDefault();
      const index=Number(recipient.dataset.equipmentFilterRemoveValue.slice('recipients-'.length));
      const schedule=state.schedules[index];
      if(!schedule)return;
      const remaining=(schedule.recipients||[]).filter(value=>value!==recipient.dataset.equipmentFilterRemoveItem);
      if(!remaining.length){toast('Укажите хотя бы один e-mail','','warning');return;}
      schedule.recipients=remaining;
      window.BNTUI.closeFilterSummaryMenus();render();
      root.querySelector(`[data-action="edit-schedule"][data-index="${index}"]`)?.focus();
      return;
    }
    const nav=e.target.closest('[data-nav]');if(nav){state.view=nav.dataset.nav;render();return}
    const seedCell=e.target.closest('[data-seed-edit]');if(seedCell){if(embeddedData||isReportView())dataEditDrawer(seedCell);else seedEditModal(seedCell.dataset.blockId,Number(seedCell.dataset.rowIndex),Number(seedCell.dataset.seriesIndex),seedCell.dataset.valueLabel,Number(seedCell.dataset.base));return}
    const tplCell=e.target.closest('[data-template-edit]');if(tplCell){if(isReportView())dataEditDrawer(tplCell);else templateEditModal(tplCell.dataset.blockId,tplCell.dataset.valueKey,tplCell.dataset.valueLabel,Number(tplCell.dataset.base));return}
    const a=e.target.closest('[data-action]');if(!a)return;const ac=a.dataset.action;
    const actionMenu=a.closest('[data-speed-dial-secondary]');
    const actionTrigger=actionMenu?.querySelector('.speed-dial-secondary__trigger')||a;
    if(actionMenu)window.BNTUI.closeSpeedDials();
    if(ac==='toggle-layout'){state.editLayout=!state.editLayout;render();if(embeddedReports)root.querySelector('#report-actions-trigger')?.focus()}
    else if(ac==='toggle-tables'){state.showTables=!state.showTables;render();if(embeddedReports)root.querySelector('#report-actions-trigger')?.focus()}
    else if(ac==='add-block'){if(embeddedReports)reportBlocksDrawer(actionTrigger);else blockModal()}
    else if(ac==='remove-block'){state.blocks=state.blocks.filter(x=>x!==a.dataset.id);render()}
    else if(ac==='catalog-add'){if(!state.blocks.includes(a.dataset.id))state.blocks.push(a.dataset.id);toast('Блок добавлен');render()}
    else if(ac==='preview'){if(embeddedBuilder)dataFilterDrawer(actionTrigger,{preview:true});else{state.view='reports';render()}}
    else if(ac==='return-builder')returnToBuilder()
    else if(ac==='return-templates')returnToTemplates()
    else if(ac==='create-template')createTemplate()
    else if(ac==='toggle-template-edit'&&embeddedTemplates&&templatePreview&&canEditTemplate()){
      if(templateEditing)saveTemplateModal(a);
      else{templateEditing=true;render();root.querySelector('[data-action="toggle-template-edit"]')?.focus();}
    }
    else if(ac==='print')window.print()
    else if(ac==='report-excel')exportReportExcel()
    else if(ac==='block-excel')exportBlockExcel(a.dataset.id)
    else if(ac==='block-pdf')printBlock(a.dataset.id)
    else if(ac==='save-template')saveTemplateModal(a)
    else if(ac==='open-template'){const all=allTemplates();applyTemplate(all[Number(a.dataset.index)])}
    else if(ac==='share-template'){const all=allTemplates();exportTemplate(all[Number(a.dataset.index)])}
    else if(ac==='import-template')fileInput.click()
    else if(ac==='select-kind'){state.dataKind=a.dataset.kind;render()}
    else if(ac==='sort-data'&&embeddedData)sortDataColumn(Number(a.dataset.column))
    else if(ac==='history'){if(embeddedData)dataHistoryDrawer(a);else historyModal(a)}
    else if(ac==='data-info')window.BNTUI.showInfoPopover(a,{title:'Данные',message:corporateDataDescriptions[state.dataKind==='production'?'production':'financial']})
    else if(ac==='report-info')window.BNTUI.showInfoPopover(a,{title:'Отчёты',message:reportsDescription})
    else if(ac==='sync-info')window.BNTUI.showInfoPopover(a,{title:'Синхронизация',message:syncDescription})
    else if(ac==='templates-info')window.BNTUI.showInfoPopover(a,{title:'Шаблоны',message:'Готовые формы открываются со своими реальными контрольными данными, периодом и источником. Их можно копировать, редактировать, выгружать и назначать на автоматическую рассылку.'})
    else if(ac==='builder-info')window.BNTUI.showInfoPopover(a,{title:'Конструктор',message:builderDescription})
    else if(ac==='canvas-info')window.BNTUI.showInfoPopover(a,{title:'Холст отчета',message:'Перетаскивайте блоки. Индивидуальные графики сохраняются вместе с шаблоном.'})
    else if(ac==='builder-library-info'||ac==='builder-forms-info')showBlockCatalogInfo(a)
    else if(ac==='template-save-info')window.BNTUI.showInfoPopover(a,{title:'Сохранение шаблона',message:templateSaveDescription})
    else if(ac==='data-filter')dataFilterDrawer(a)
    else if(ac==='report-filter')dataFilterDrawer(a)
    else if(ac==='sync')syncDrawer(a)
    else if(ac==='create-chart'){if(embeddedData)dataChartDrawer({},a);else chartModal({},actionTrigger)}
    else if(ac==='chart-row'){if(embeddedData)dataChartDrawer({kind:a.dataset.kind,rowId:a.dataset.row},a);else chartModal({kind:a.dataset.kind,rowId:a.dataset.row},actionTrigger)}
    else if(ac==='chart-seed-row'){if(embeddedData)dataChartDrawer({kind:'production',rowIndex:Number(a.dataset.rowIndex)},a);else seedChartModal(a.dataset.sourceBlock,Number(a.dataset.rowIndex))}
    else if(ac==='schedule-current')scheduleModal(undefined,actionTrigger)
    else if(ac==='schedule-info')window.BNTUI?.showInfoPopover(a,{title:'Автоматические рассылки',message:schedulesDescription})
    else if(ac==='new-schedule')scheduleModal(undefined,a)
    else if(ac==='edit-schedule')scheduleModal(undefined,a,Number(a.dataset.index))
    else if(ac==='schedule-template'){const all=allTemplates();scheduleModal(all[Number(a.dataset.index)]?.id,a)}
    else if(ac==='test-schedule'){toast('Тестовое письмо сформировано','В промышленной версии будет отправлено через SMTP','neutral')}
    else if(ac==='toggle-schedule'){const s=state.schedules[Number(a.dataset.index)];if(s){s.enabled=!s.enabled;render();root.querySelector(`[data-action="toggle-schedule"][data-index="${a.dataset.index}"]${a.dataset.scheduleToggle!=null?'[data-schedule-toggle]':':not([data-schedule-toggle])'}`)?.focus()}}
    else if(ac==='reset-demo'){if(confirm('Сбросить демо и локальные настройки?')){localStorage.removeItem('bnt-studio-v5');location.reload()}}
  });
  root.addEventListener('change',e=>{const f=e.target.dataset.filter;if(f){state[f]=['source','year','monthFrom','monthTo'].includes(f)?Number(e.target.value):e.target.value;state.activeTemplateId='draft';render()}});
  root.addEventListener('change', event => {
    if (!embeddedData || !event.target.matches('[data-ui-dropdown="data-kind"]')) return;
    state.dataKind = event.target.dataset.value;
    dataTableSort = {kind: null, column: null, direction: 'default'};
    render(); root.querySelector('#data-kind')?.focus();
  });
  root.addEventListener('keydown', event => {
    if ((!embeddedData && !isReportView()) || !['Enter', ' '].includes(event.key)) return;
    const cell = event.target.closest(isReportView() ? '[data-template-edit], [data-seed-edit]' : '[data-source-edit], [data-seed-edit]');
    if (cell) { event.preventDefault(); cell.click(); }
  });
  root.addEventListener('click',e=>{const td=e.target.closest('[data-source-edit]');if(td&&state.view==='data'){if(embeddedData)dataEditDrawer(td);else sourceEditModal(td.dataset.kind,td.dataset.row,Number(td.dataset.month))}});

  function saveTemplate() {
    const name = $('#tpl-name')?.value.trim() || '', description = $('#tpl-desc')?.value.trim() || '', tag = $('#tpl-tag')?.value || 'Личный';
    if (window.BNTUI) {
      const missing = !name ? 'tpl-name' : !description ? 'tpl-desc' : !Object.hasOwn(templateAccessTones, tag) ? 'tpl-tag' : null;
      if (missing) { toast(missing === 'tpl-name' ? 'Введите название шаблона' : missing === 'tpl-desc' ? 'Введите описание шаблона' : 'Выберите форму доступа','','warning'); (missing === 'tpl-tag' ? modal.querySelector('[data-form-input="tpl-tag"] .form-input__control') : $(`#${missing}`))?.focus(); return; }
    }
    const existing=templateSaveTarget?allTemplates().find(template=>template.id===templateSaveTarget):null;
    if(templateSaveTarget&&!existing)return;
    const id = existing?.id || 'custom-' + Date.now(), from = currentTemplateKey();
    const template = {...existing, id, name: name || 'Новый шаблон', description, tag:existing?.tag&&!Object.hasOwn(templateAccessTones,existing.tag)?existing.tag:tag, access:tag, reportTitle: name || 'Новый шаблон', sourceLabel: sourceLabel(), filters: {source: state.source, year: state.year, monthFrom: state.monthFrom, monthTo: state.monthTo, currency: state.currency, unit: state.unit}, blocks: [...state.blocks], customBlocks: JSON.parse(JSON.stringify(state.customBlocks))};
    state.customTemplates=[...new Map(state.customTemplates.concat(template).map(item=>[item.id,item])).values()];
    state.templateOverrides[id] = JSON.parse(JSON.stringify(state.templateOverrides[from] || {}));
    state.seedOverrides[id] = JSON.parse(JSON.stringify(state.seedOverrides[from] || {}));
    state.activeTemplateId = id;
    if(existing)templateEditing=false;
    closeScheduleDrawer(false);
    render();
    root.querySelector(embeddedTemplates&&templatePreview?(canEditTemplate()?'[data-action="toggle-template-edit"]':'[data-action="return-templates"]'):'[data-action="save-template"]')?.focus();
    toast('Шаблон сохранен', template.name);
  }
  function saveSchedule() {
    const timeField = modal.querySelector('[data-time-input].is-open');
    if (timeField && !window.BNTUI.applyTimeField(timeField)) return;
    const recipients = String($('#schedule-recipients')?.value || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!recipients.length) { toast('Укажите хотя бы один e-mail','','warning'); $('#schedule-recipients')?.focus?.(); return; }
    const freq = $('#schedule-frequency')?.value || 'daily';
    const labels = {daily: 'Каждый день', weekly: 'Каждую неделю', monthly: 'Каждый месяц'};
    const index=scheduleEditTarget;
    if(index!=null && !state.schedules[index])return;
    const schedule={...(index==null?{enabled:true}:state.schedules[index]),templateId: $('#schedule-template')?.value, recipients, frequency: freq, frequencyLabel: labels[freq], time: $('#schedule-time')?.value || '08:00', format: $('#schedule-format')?.value || 'PDF', subject: $('#schedule-subject')?.value || 'Управленческий отчет'};
    if(index==null)state.schedules.push(schedule);else state.schedules[index]=schedule;
    closeScheduleDrawer(false);
    state.view = 'schedules';
    render();
    root.querySelector(index==null?'[data-action="new-schedule"]':`[data-action="edit-schedule"][data-index="${index}"]`)?.focus();
    toast(index==null?'Рассылка настроена':'Рассылка сохранена', `${labels[freq]} в ${schedule.time}`);
  }
  function deleteSchedule() {
    const index=scheduleEditTarget;
    if(index==null || !state.schedules[index])return;
    state.schedules.splice(index,1);
    closeScheduleDrawer(false);
    state.view='schedules';render();
    (root.querySelector(`[data-action="edit-schedule"][data-index="${Math.min(index,state.schedules.length-1)}"]`)||root.querySelector('[data-action="new-schedule"]'))?.focus();
    toast('Рассылка удалена');
  }
  modal.addEventListener('submit', event => {
    if (event.target.matches('[data-schedule-form]')) { event.preventDefault(); saveSchedule(); }
    else if (event.target.matches('[data-data-filter-form]')) { event.preventDefault(); applyDataFilter(); }
    else if (event.target.matches('[data-builder-preview-form]')) { event.preventDefault(); applyDataFilter(true); }
    else if (event.target.matches('[data-template-save-form]')) { event.preventDefault(); saveTemplate(); }
    else if (event.target.matches('[data-data-chart-form]')) { event.preventDefault(); saveDataChart(); }
    else if (event.target.matches('[data-data-edit-form]')) { event.preventDefault(); event.target.querySelector('[type="submit"]')?.click(); }
    else if (event.target.matches('[data-sync-form]')) { event.preventDefault(); confirmSync(); }
  });
  modal.addEventListener('change', event => {
    if (event.target.id === 'data-year' && (embeddedData || embeddedReports || embeddedBuilder)) { syncDataFilterYear(); return; }
    if (!embeddedData && !embeddedBuilder && !embeddedReports) return;
    if (event.target.id === 'chart-kind') dataChartDrawer({kind: event.target.value, size: $('#chart-size')?.value, type: $('#chart-type')?.value}, scheduleDrawerTrigger);
    else if (event.target.id === 'chart-row' && $('#chart-kind')?.value === 'production') {
      const input = $('#chart-title');
      if (input && !input.classList.contains('is-touched')) input.value = seedBlock('general_total_cargo')?.rows?.[Number(event.target.value)]?.name || '';
    }
  });
  document.addEventListener('keydown', event => {
    const drawer = modal.querySelector('#schedule-drawer') || modal.querySelector('[data-studio-drawer]');
    if (!drawer) return;
    if (event.key === 'Escape') { event.preventDefault(); closeScheduleDrawer(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...drawer.querySelectorAll('button, input:not([type="hidden"]), textarea, [tabindex="0"]')].filter(control => !control.disabled && !control.closest('[hidden]'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  modal.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){closeScheduleDrawer();return}
    const a=e.target.closest('[data-action]');if(!a)return;const ac=a.dataset.action;
    if(ac==='builder-library-info'||ac==='builder-forms-info'){showBlockCatalogInfo(a);return}
    if((embeddedData||isReportView()) && ['save-source-edit','save-template-edit','save-seed-edit'].includes(ac)){
      e.preventDefault();
      const input=$(`#${ac==='save-source-edit'?'source':ac==='save-template-edit'?'tpl':'seed'}-edit-value`);
      if(!input?.value.trim() || !input.reportValidity()){toast('Заполните значение и причину','','warning');return;}
    }
    if(ac==='apply-data-filter'){e.preventDefault();applyDataFilter();return}
    if(ac==='apply-builder-preview'){e.preventDefault();applyDataFilter(true);return}
    if(ac==='confirm-data-chart'){e.preventDefault();saveDataChart();return}
    if(ac==='confirm-save'){e.preventDefault();saveTemplate();return}
    if(ac==='reset-data-filter'){
      const ui=window.BNTUI;
      for(const [id,value] of [['data-source',1],['data-year',2026],['data-currency','USD'],['data-unit','thousand']])ui.syncSingleFormInput(modal.querySelector(`[data-form-input="${id}"]`),value);
      for(const [part,value] of [['from','2026-01-01'],['to','2026-12-31']]){
        const field=modal.querySelector(`[data-bnt-date-root="data-date-${part}"]`);
        field.dataset.dateMin='2026-01-01';field.dataset.dateMax='2026-12-31';ui.syncDateField(field,value);
      }
      ui.closeSingleFormInputs(modal);ui.closeDatePickers();return;
    }
    if(ac==='modal-add-block'){
      if(embeddedReports){closeScheduleDrawer();return;}
      if(!state.blocks.includes(a.dataset.id))state.blocks.push(a.dataset.id);
      modal.innerHTML='';render();
      toast('Блок добавлен');
    }
    else if(ac==='save-template-edit'){const value=Number(String($('#tpl-edit-value')?.value||'').replace(',','.')),reason=$('#tpl-edit-reason')?.value.trim();if(!Number.isFinite(value)||!reason){toast('Заполните значение и причину','','warning');return}setTemplateVal(a.dataset.blockId,a.dataset.valueKey,value);state.manualLog.push({date:new Date().toLocaleString('ru-RU'),scope:`Шаблон: ${activeTemplate()?.name||'Черновик'}`,name:a.dataset.valueLabel,old:Number(a.dataset.base),value,reason});finishDataEdit();toast('Значение изменено','Только в текущем шаблоне')}
    else if(ac==='save-seed-edit'){const value=Number(String($('#seed-edit-value')?.value||'').replace(',','.')),reason=$('#seed-edit-reason')?.value.trim();if(!Number.isFinite(value)||!reason){toast('Заполните значение и причину','','warning');return}setSeedValue(a.dataset.blockId,Number(a.dataset.rowIndex),Number(a.dataset.seriesIndex),value);state.manualLog.push({date:new Date().toLocaleString('ru-RU'),scope:`Шаблон: ${activeTemplate()?.name||'Черновик'}`,name:a.dataset.valueLabel,old:Number(a.dataset.base),value,reason});finishDataEdit();toast('Значение изменено','График пересчитан автоматически')}
    else if(ac==='save-source-edit'){const kind=a.dataset.kind,d=dataset(kind),r=d?.rows.find(x=>x.id===a.dataset.row),m=Number(a.dataset.month),value=Number(String($('#source-edit-value')?.value||'').replace(',','.')),reason=$('#source-edit-reason')?.value.trim();if(!r||!Number.isFinite(value)||!reason){toast('Заполните значение и причину','','warning');return}const key=sourceOverrideKey(d,r,m),old=rawMonth(kind,r,m);state.overrides[key]=value;state.manualLog.push({date:new Date().toLocaleString('ru-RU'),scope:'Исходные данные',name:`${r.name} · ${MONTHS_FULL[m-1]} ${state.year}`,old,value,reason});finishDataEdit();toast('Исходное значение изменено','Связанные отчеты пересчитаны')}
    else if(ac==='confirm-sync'){e.preventDefault();confirmSync()}
    else if(ac==='confirm-chart'){const kind=$('#chart-kind')?.value,rowId=$('#chart-row')?.value,type=$('#chart-type')?.value,size=$('#chart-size')?.value||'half',r=dataset(kind)?.rows.find(x=>x.id===rowId);if(!r)return;const id='chart-'+Date.now();state.customBlocks[id]={title:r.name,kind,type,size,rowKey:r.code};state.blocks.push(id);modal.innerHTML='';state.view='reports';render();toast('График добавлен',r.name)}
    else if(ac==='confirm-seed-chart'){const sourceBlockId=a.dataset.sourceBlock,rowIndex=Number(a.dataset.rowIndex),id='seedchart-'+Date.now();state.customBlocks[id]={title:$('#seed-chart-title')?.value||'Показатель',kind:'production',type:'seedIndicator',size:$('#seed-chart-size')?.value||'half',sourceBlockId,rowIndex};state.blocks.push(id);modal.innerHTML='';state.view='reports';render();toast('График добавлен')}
    else if(ac==='confirm-schedule'){e.preventDefault();saveSchedule()}
    else if(ac==='delete-schedule'){e.preventDefault();deleteSchedule()}
  });

  fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!Array.isArray(x.blocks))throw 0;const id=x.id||'import-'+Date.now(),t={id,name:x.name||'Импортированный шаблон',description:x.description||'Импортирован из JSON',tag:x.tag||'Импорт',access:x.access,reportTitle:x.reportTitle||x.name,sourceLabel:x.sourceLabel,filters:x.filters||{},blocks:x.blocks,customBlocks:x.customBlocks||{}};state.customTemplates.push(t);if(x.templateOverrides)state.templateOverrides[id]=x.templateOverrides;if(x.seedOverrides)state.seedOverrides[id]=x.seedOverrides;applyTemplate(t);toast('Шаблон принят')}catch(e){toast('Не удалось прочитать JSON','','error')}finally{fileInput.value=''}});

  let dragId = null;
  function bindDrag() {
    $$('[data-block][draggable="true"], [data-canvas-block]').forEach(block => {
      block.addEventListener('dragstart', event => {
        dragId = block.dataset.block || block.dataset.canvasBlock;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', dragId);
          const rect = block.getBoundingClientRect();
          event.dataTransfer.setDragImage(block, Math.max(0, (event.clientX ?? rect.left) - rect.left), Math.max(0, (event.clientY ?? rect.top) - rect.top));
        }
        event.stopPropagation?.();
      });
      block.addEventListener('dragover', event => {
        if (!dragId) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      });
      block.addEventListener('drop', event => {
        if (!dragId) return;
        event.preventDefault();
        event.stopPropagation?.();
        const from = state.blocks.indexOf(dragId), to = state.blocks.indexOf(block.dataset.block || block.dataset.canvasBlock);
        dragId = null;
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = state.blocks.splice(from, 1);
        state.blocks.splice(to, 0, moved);
        render();
      });
      block.addEventListener('dragend', () => { dragId = null; });
    });
  }
  render();
})();
