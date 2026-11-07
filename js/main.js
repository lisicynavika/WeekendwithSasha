/* Без библиотек и сервера: все данные и изображения поставляются вместе с сайтом. */
(() => {
 'use strict';
 const $ = s => document.querySelector(s);
 const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const storage = {read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}},write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}};
 const saved = storage.read('weekend-routes',{});
 const selected = {};
 for(const day of [14,15])if(PROGRAMS.some(p=>p.day===day&&p.id===saved?.[day]))selected[day]=saved[day];
 let day = storage.read('weekend-day',14)===15?15:14;
 const photos = [
  {id:'bridge',title:'Пантелеймоновский мост',description:'Мост через Фонтанку, на прогулочном маршруте воскресенья.'},
  {id:'austria',title:'У Австрийской площади',description:'Каменноостровский проспект, 15. Архитектура Петроградской стороны.'},
  {id:'karpovka',title:'Набережная Карповки',description:'Виды реки на Петроградской стороне.'},
  {id:'fontanka',title:'Фонтанка',description:'Городская набережная. Атмосферный вид реки, не точка входа в клуб.'},
  {id:'cathedral',title:'Преображенский собор',description:'Архитектура Преображенской площади, осмотр снаружи.'}
 ];
 let galleryIndex=0,returnFocus=null,touchStart=null,toastTimer;
 const photoById = id => photos.find(p=>p.id===id);
 const link = (url,label,cls='') => `<a class="${cls}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
 const mapSearch = address => 'https://yandex.ru/maps/2/saint-petersburg/?text='+encodeURIComponent('Санкт-Петербург, '+address);
 const mapRoute = p => 'https://yandex.ru/maps/2/saint-petersburg/?rtext='+encodeURIComponent(p.points.map(s=>'Санкт-Петербург, '+s).join('~'))+'&rtt='+(p.day===14?'mt':'pd');
 const photoButton = (id,cls='',caption=false) => {const p=photoById(id);return `<button class="photo-button ${cls}" data-photo="${id}" aria-label="Увеличить: ${p.title}"><img src="assets/images/${id}.jpg" alt="${p.title}" loading="lazy" width="1200" height="900">${caption?'<span>'+p.title+' <b aria-hidden="true">↗</b></span>':'<span class="zoom-mark" aria-hidden="true">↗</span>'}</button>`};
 const typeLabels={walk:'Прогулка',travel:'Дорога',food:'Перекус',event:'Активность',final:'Вечер'};
 function stepMarkup(s,index,p){
  return `<li class="step ${s.kind}"><details${s.kind==='event'||s.kind==='final'?' open':''}><summary><span class="time">${escape(s.time)}</span><span class="step-title">${escape(s.title)}</span></summary><div class="step-body"><p class="eyebrow" style="margin-bottom:8px;font-size:9px">${String(index+1).padStart(2,'0')} / ${typeLabels[s.kind]}</p>${s.description.map(t=>`<p>${escape(t)}</p>`).join('')}${s.kind==='final'?'<p>Время из нашего плана. Билеты и запись не подтверждены.</p>':''}${s.photo?photoButton(s.photo,'step-photo'):''}<div class="step-links">${s.link?link(s.link,p.id==='portrait'&&s.kind==='event'?'Афиша · время уточнить ↗':'Страница мероприятия ↗'):''}${s.address?link(mapSearch(s.address),'Адрес на карте ↗'):s.kind==='walk'?link(mapSearch(s.title),'Место на карте ↗'):''}</div></div></details></li>`;
 }
 function programMarkup(p,index){
  const isSelected=selected[p.day]===p.id;
  return `<article class="program${isSelected?' chosen':''}" id="${p.id}" aria-labelledby="title-${p.id}"><div class="program-head"><div class="route-number"><b>0${index+1}</b><span>Вариант программы</span></div><span class="tag">${p.tags}</span></div><div class="program-grid"><div class="program-visual">${photoButton(p.cover,'cover')}<p class="visual-caption">${photoById(p.cover).title} · фотография места прогулки</p><div class="mini-grid">${photoButton(p.secondary)}<button class="art" data-art="${p.id}" aria-label="Увеличить тематическую иллюстрацию: ${p.short}"><img src="assets/images/${p.id}.svg" alt="Авторская тематическая иллюстрация программы, не фотография площадки" loading="lazy" width="600" height="400"><span>Тематическая иллюстрация</span></button></div></div><div class="program-content"><p class="program-name">${p.title}</p><h3 id="title-${p.id}">${p.headline}</h3><p class="program-desc">${p.description}</p><div class="program-facts"><span>5 человек</span><span>11:00 → ${p.day===14?'17:00':'18:30'}</span><span>${p.day===14?'Финал: музлото':'Финал: стендап'}</span></div><p class="notice">${p.note}</p><div class="program-actions"><button class="pill primary select-route" data-select="${p.id}" aria-pressed="${isSelected}">${isSelected?'Выбрано ✓':'Выбрать этот маршрут ♡'}</button>${link(mapRoute(p),'Открыть маршрут ↗','pill')}</div><details class="schedule" open><summary>Подробный план · ${p.steps.length} остановок</summary><p class="legend">Коралл — активность · розовый — прогулка · серый — дорога<br>Нажмите на остановку, чтобы раскрыть детали.</p><ol class="timeline">${p.steps.map((s,i)=>stepMarkup(s,i,p)).join('')}</ol></details><p class="route-note">${p.day===14?'Между районами — общественный транспорт; небольшие прогулки — пешком.':'Пешеходный маршрут после активности. Время прогулок включает остановки на фотографии.'} Карты могут предложить свой порядок и длительность: проверьте точки перед стартом.</p></div></div></article>`;
 }
 function renderDay(){
  const programs=PROGRAMS.filter(p=>p.day===day);
  document.querySelectorAll('[data-day]').forEach(b=>{const active=Number(b.dataset.day)===day;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1});
  $('#day-panel').setAttribute('aria-labelledby','tab'+day);
  $('#day-panel').innerHTML=programs.map(programMarkup).join('');
  $('#day-panel').style.animation='none';void $('#day-panel').offsetWidth;$('#day-panel').style.animation='';
  $('#day-count').textContent=`0${programs.length} варианта / один прекрасный день`;
  $('#variant-nav').innerHTML=programs.map((p,i)=>`<a href="#${p.id}">0${i+1} ${p.short} ↘</a>`).join('');
  storage.write('weekend-day',day);
 }
 function renderChoice(){
  $('#chosen').innerHTML=[14,15].map(d=>{const p=PROGRAMS.find(x=>x.id===selected[d]);return `<div class="chosen-item"><span class="eyebrow">${d} ноября · ${d===14?'суббота':'воскресенье'}</span><p>${p?p.short:'Пока выбираем приключение'}</p><a href="#${p?p.id:'programs'}" data-jump-day="${d}">${p?'Вернуться к маршруту':'Посмотреть варианты'} ↗</a></div>`}).join('');
 }
 function notify(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
 function updateTheme(){const dark=document.documentElement.dataset.theme==='dark';$('#theme').setAttribute('aria-pressed',dark);$('#theme').setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему');$('#theme-label').textContent=dark?'Светлая тема':'Тёмная тема';document.querySelector('meta[name=theme-color]').content=dark?'#241b27':'#fff4e6'}
 $('#theme').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('weekend-theme',theme)}catch{notify('Тема изменена. Браузер не разрешил сохранить её.')}updateTheme()});
 document.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{day=Number(b.dataset.day);renderDay()}));
 $('.tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();day=e.key==='Home'?14:e.key==='End'?15:day===14?15:14;renderDay();$('#tab'+day).focus()}});
 document.addEventListener('click',e=>{
  const select=e.target.closest('[data-select]');if(select){const p=PROGRAMS.find(x=>x.id===select.dataset.select);selected[p.day]=p.id;const persisted=storage.write('weekend-routes',selected);document.querySelectorAll('.select-route').forEach(b=>{const active=b.dataset.select===p.id;b.setAttribute('aria-pressed',active);b.textContent=active?'Выбрано ✓':'Выбрать этот маршрут ♡';b.closest('.program').classList.toggle('chosen',active)});renderChoice();notify(persisted?`План на ${p.day} ноября сохранён ♡`:'Маршрут выбран. Сохранение в браузере недоступно.');return}
  const jump=e.target.closest('[data-jump-day]');if(jump){day=Number(jump.dataset.jumpDay);renderDay();return}
  const photo=e.target.closest('[data-photo]');if(photo){openGallery(photo.dataset.photo,photo);return}
  const art=e.target.closest('[data-art]');if(art){openArt(art.dataset.art,art)}
 });
 const dialog=$('#lightbox');
 function showPhoto(){const p=photos[galleryIndex];$('#lightbox-image').src=`assets/images/${p.id}.jpg`;$('#lightbox-image').alt=p.title;$('#lightbox-caption').textContent=p.title+' — '+p.description;$('#photo-count').textContent=`${galleryIndex+1} / ${photos.length}`;const credit=(window.PHOTO_CREDITS||[]).find(c=>c.id===p.id);$('#photo-credit').innerHTML=credit?`${escape(credit.author)} · ${link(credit.url,'Wikimedia Commons')} · ${link(credit.licenseUrl||credit.url,escape(credit.license))} · кадрирование в макете`:''}
 function openGallery(id,trigger){galleryIndex=photos.findIndex(p=>p.id===id);returnFocus=trigger;$('#previous-photo').hidden=false;$('#next-photo').hidden=false;showPhoto();dialog.showModal();document.body.classList.add('modal-open')}
 function openArt(id,trigger){returnFocus=trigger;$('#lightbox-image').src=`assets/images/${id}.svg`;$('#lightbox-image').alt='Тематическая иллюстрация программы';$('#lightbox-caption').textContent='Авторская тематическая иллюстрация. Не фотография площадки или мероприятия.';$('#photo-count').textContent='Иллюстрация';$('#photo-credit').textContent='Создано для этого проекта';$('#previous-photo').hidden=true;$('#next-photo').hidden=true;dialog.showModal();document.body.classList.add('modal-open')}
 function movePhoto(delta){if($('#next-photo').hidden)return;galleryIndex=(galleryIndex+delta+photos.length)%photos.length;showPhoto()}
 $('#previous-photo').addEventListener('click',()=>movePhoto(-1));$('#next-photo').addEventListener('click',()=>movePhoto(1));$('#close-gallery').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus({preventScroll:true})});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();movePhoto(-1)}if(e.key==='ArrowRight'){e.preventDefault();movePhoto(1)}});
 dialog.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX},{passive:true});dialog.addEventListener('touchend',e=>{if(touchStart!==null){const delta=e.changedTouches[0].clientX-touchStart;if(Math.abs(delta)>50)movePhoto(delta<0?1:-1);touchStart=null}},{passive:true});
 $('#photo-grid').innerHTML=photos.map(p=>photoButton(p.id,'gallery-tile',true)).join('');
 
storage.write('weekend-routes', selected); updateTheme();renderDay();renderChoice();
 const initial=PROGRAMS.find(p=>'#'+p.id===location.hash);if(initial){day=initial.day;renderDay();requestAnimationFrame(()=>document.getElementById(initial.id).scrollIntoView())}
})();
