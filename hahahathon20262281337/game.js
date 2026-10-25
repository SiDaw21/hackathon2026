"use strict";
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rnd = (a,b) => a + Math.random()*(b-a);

/* ================= ДАННЫЕ ================= */
const DIFFS = {
  intern:  { noise:.55, missing:0, mult:1,   label:"Стажёр",
    desc:"Все приборы в строю, подсказки Матвея подробные. Идеально для первой смены." },
  met:     { noise:1.0, missing:1, mult:1,   label:"Метеоролог",
    desc:"Один прибор ежедневно молчит. Придётся читать небо, а не только циферблаты." },
  storm:   { noise:1.7, missing:2, mult:1.5, label:"Штормовой дежурный",
    desc:"Два прибора молчат, приборы врут сильнее, ошибки стоят дороже." },
  pro:     { noise:2.3, missing:2, mult:1.5, label:"Синоптик",
    desc:"Минимум данных — максимум выводов. Для тех, кто уже чувствует барометр кожей." },
  keeper:  { noise:2.8, missing:3, mult:2,   label:"Хранитель маяка",
    desc:"Только барометр. Полная темнота данных, решения вдвое ответственнее. Хардкор." }
};

const NOTEBOOK = [
  "Главный прибор — барометр. Норма ~760 мм. Ниже 745 и продолжает падать — готовь штормовой сигнал.",
  "Перистые «барашки» в высоте — дождь придёт через полсуток. Ясное утро обманывает редко.",
  "Ветер крутанулся к северо-востоку и нарастает — лодку дальше бухты не отпускай.",
  "Влажность за 85% при падающем барометре — осадки почти верны.",
  "Не бойся сказать «не знаю точно». Скажи честно: «шестьдесят на сорок». Ошибку люди прощают, обман — нет.",
  "Шторм не наступает внезапно. Он наступает, когда все приметы сходятся, а ты ждал стопроцентной уверенности.",
  "Ты держал маяк неделю. Запомни: прогноз — не предсказание будущего. Это честная цена неизвестности."
];

const DAYS = [
  { title:"День 1. Смена", sky:"clear", pRain:.12, pWind:.10,
    story:"Первое утро на маяке. Море спокойное, приборы проснулись, а в компьютере уже ждёт сообщение смены и первые обращения жителей.",
    situations:[{ type:"drone", who:"Дрон «Чайка»", q:"Отправлять дрон с лекарствами на остров Гулкий сегодня вечером?",
      yesLabel:"Отменить рейс (перестраховаться)", noLabel:"Лететь" }] },
  { title:"День 2. Рыбацкий вопрос", sky:"partly", pRain:.30, pWind:.20,
    story:"Небо меняется быстрее, чем вчера. По рации и в компьютере — новые просьбы: каждый ждёт именно твоего слова, маячный.",
    situations:[{ type:"fish", who:"Марко и лодка «Чайка-младшая»", q:"Удержать рыбаков в бухте или разрешить вечерний выход?",
      yesLabel:"Удержать в бухте (штормовое предупреждение)", noLabel:"Разрешить выход" }] },
  { title:"День 3. Сенокос", sky:"partly", pRain:.45, pWind:.25,
    story:"Воздух тяжелеет, город заметно нервничает. Загляни в компьютер: там сообщение смены и все, кто сегодня просит твоего решения.",
    situations:[{ type:"farm", who:"Ника, фермерское хозяйство", q:"Советовать Нике срочно убирать сено (полдня работы впустую, если небо чистое)?",
      yesLabel:"Убирать сено сейчас", noLabel:"Оставить сушиться" }] },
  { title:"День 4. Нервный барограф", sky:"cloudy", pRain:.55, pWind:.45,
    story:"Барограф рисует яму, чайки ушли в город. Обращений сегодня больше — проверь монитор, прежде чем давать кому-то слово.",
    situations:[
      { type:"drone", who:"Дрон «Чайка»", q:"Вечерний рейс на остров — отменять или лететь?", yesLabel:"Отменить рейс", noLabel:"Лететь" },
      { type:"fish", who:"Марко", q:"Вечерний выход за камбалой — удержать в бухте?", yesLabel:"Удержать (предупреждение)", noLabel:"Разрешить выход" }] },
  { title:"День 5. Дальний рейс", sky:"cloudy", pRain:.60, pWind:.55,
    story:"Город готовится к важным выходам и делам. Твоё слово сегодня дороже обычного: смотри приборы, читай задания в компьютере.",
    situations:[{ type:"fish", who:"Артель, три лодки, дальний рейс", q:"Слово маяка: отпускать артель в дальний выход или удерживать в бухте?",
      yesLabel:"Удержать в бухте (штормовое предупреждение)", noLabel:"Отпустить в море" }] },
  { title:"День 6. Тишина", sky:"cloudy", pRain:.70, pWind:.60,
    story:"Слишком тихое утро перед непогодой. Просьб много, времени мало — сообщение смены и задания уже ждут на мониторе.",
    situations:[
      { type:"farm", who:"Ника, срочная уборка урожая", q:"Советовать укрывать урожай прямо сейчас (суетливо, но безопасно)?", yesLabel:"Укрывать урожай сейчас", noLabel:"Работать спокойно" },
      { type:"drone", who:"Дрон «Чайка»", q:"Рейс с лекарствами — последняя отсрочка. Летим вечером?", yesLabel:"Отменить рейс", noLabel:"Лететь" }] },
  { title:"День 7. Шторм", sky:"storm", pRain:.90, pWind:.85,
    story:"Финальный день смены. Небо цвета олова, город слушает маяк. Открой компьютер: там последнее сообщение и те, кому нужен твой ответ.",
    situations:[
      { type:"fish", who:"Артель у причала", q:"Финальное решение: удержать лодки в бухте?", yesLabel:"Удержать в бухте (штормовое предупреждение)", noLabel:"Отпустить в море" },
      { type:"drone", who:"Дрон «Чайка»", q:"Взлетать вечером с грузом?", yesLabel:"Отменить рейс", noLabel:"Лететь" }] }
];

/* ================= СОСТОЯНИЕ ================= */
const SAVE_KEY = "lighthouse_v2_save";
const REC_KEY  = "lighthouse_v2_records";
let S = null;

function save(){ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); scheduleDbSync(); }
function loadSave(){ try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; } }
function getRecords(){ try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch(e){ return []; } }
function setRecords(r){ localStorage.setItem(REC_KEY, JSON.stringify(r.slice(0,50))); }

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 2800);
}

function show(id){
  document.querySelectorAll(".screen").forEach(x => x.classList.remove("active"));
  $(id).classList.add("active");
}


/* ================= РЕЖИМ ВЫЖИВАНИЯ ================= */
const SURVIVAL_THEMES = ["Смена","Тихий берег","Нервное море","Город ждёт","Серое утро","Дальний горизонт","Ночной дозор","Переменный ветер"];
const SURVIVAL_STORIES = [
  "Очередное утро в дежурке. Море не обещает ничего конкретного, а город уже проснулся и ждёт твоего слова.",
  "Неделя давно кончилась, а смена всё продолжается. Матвей не вернулся — и маяк теперь твой, пока хватает топлива.",
  "Город привык к твоему голосу в рации. Сегодня снова: приборы, окно, бланк — и люди, которым нужен честный ответ.",
  "Море меняет настроение быстрее, чем газеты — погоду. Смотри на приборы внимательно: сегодня они — единственная правда.",
  "Ещё один рассвет над бухтой. Кто-то уже стучится в рацию, кто-то ждёт у компьютера. Смена продолжается."
];
function getDayConfig(idx){
  if (!S || S.mode !== "survival") return DAYS[Math.min(idx, DAYS.length - 1)];
  const pRain = clamp(.22 + Math.min(.5, idx * .025) + rnd(-.16, .2), .05, .92);
  const pWind = clamp(.18 + Math.min(.45, idx * .02) + rnd(-.12, .18), .05, .88);
  return {
    title: "День " + (idx + 1) + ". " + SURVIVAL_THEMES[idx % SURVIVAL_THEMES.length],
    sky: pRain < .3 ? "clear" : pRain < .5 ? "partly" : pRain < .72 ? "cloudy" : "storm",
    pRain, pWind,
    story: SURVIVAL_STORIES[idx % SURVIVAL_STORIES.length]
  };
}

/* ================= ГЕНЕРАЦИЯ ДНЯ ================= */
function genDay(idx){
  const cfg = getDayConfig(idx), d = DIFFS[S.diff];
  const pRain = clamp(cfg.pRain + rnd(-1,1)*0.10*d.noise, .02, .98);
  const pWind = clamp(cfg.pWind + rnd(-1,1)*0.12*d.noise, .02, .98);
  const rain = Math.random() < pRain;
  const wind = Math.random() < (pWind + (rain ? .12 : 0));

  const pressure = Math.round(766 - 30*pRain + rnd(-1,1)*8*d.noise);
  const trendNum = -(pRain*10) + rnd(-1,1)*2.2*d.noise;
  const trend = trendNum <= -6 ? "стремительно падает" : trendNum <= -2.5 ? "падает" : trendNum < 2.5 ? "держится ровно" : "растёт";

  const c = pRain + rnd(-1,1)*0.25*d.noise;
  const clouds = c < .20 ? "ясное небо" : c < .40 ? "перистые «барашки»" : c < .60 ? "слоисто-кучевые" : c < .82 ? "кумулюсы темнеют" : "грозовые башни на горизонте";

  const windSpeed = Math.round(2 + 22*pWind + rnd(-1,1)*6*d.noise);
  const windDir = ["северный","северо-восточный","восточный","юго-западный","западный"][Math.floor(rnd(0,5))];
  const humidity = clamp(Math.round(40 + 55*pRain + rnd(-1,1)*10*d.noise), 15, 100);

  const opt = ["clouds","wind","humidity"].sort(() => Math.random()-.5);
  const missing = opt.slice(0, d.missing);
  if (typeof S !== "undefined" && S && S.instruments){
    ["pressure","clouds","wind","humidity"].forEach(k => {
      const c = S.instruments[k];
      if (c !== undefined && (c <= 0 || (c <= 30 && Math.random() < .5)) && !missing.includes(k)) missing.push(k);
    });
  }

  if (!S.usedTasks) S.usedTasks = [];
  const taskCount = idx === 0 ? 1 : 2 + Math.floor(Math.random() * 3);
  const tasks = pickTasks(taskCount);
  const dayEvent = DAY_EVENTS[Math.floor(Math.random() * DAY_EVENTS.length)];
  return { pRain, pWind, rain, wind, obs:{ pressure, trend, clouds, windSpeed, windDir, humidity }, missing, read:{}, tasks, event:dayEvent, cfg:{ title:cfg.title, sky:cfg.sky, story:cfg.story } };
}


/* ================= ЗАДАНИЯ ЖИТЕЛЕЙ ================= */
const TASK_POOL = [
  { id:"f1", type:"fish", who:"Марко и лодка «Чайка-младшая»", q:"Марко хочет выйти на вечерний лов у берега. Удержать его в бухте?", yesLabel:"Удержать в бухте", noLabel:"Разрешить выход" },
  { id:"f2", type:"fish", who:"Рыбацкая артель, три лодки", q:"Артель собирается в дальний выход на двое суток. Отпускать?", yesLabel:"Удержать в бухте", noLabel:"Отпустить в море" },
  { id:"f3", type:"fish", who:"Старый Томаш, ночной лов", q:"Томаш просит разрешения на ночной выход за кальмаром. Запретить?", yesLabel:"Запретить ночной выход", noLabel:"Разрешить" },
  { id:"f4", type:"fish", who:"Братья Ким, крабовые ловушки", q:"Братья хотят ставить ловушки за молом до утра. Остановить?", yesLabel:"Остановить выход", noLabel:"Разрешить ставить" },
  { id:"f5", type:"fish", who:"Лодка «Волна», сбор водорослей", q:"Экипаж «Волны» идёт собирать водоросли у скал. Отложить выход?", yesLabel:"Отложить выход", noLabel:"Разрешить" },
  { id:"f6", type:"fish", who:"Учебная лодка юнг", q:"Юнги просят короткий выход вдоль берега после обеда. Отменить занятие?", yesLabel:"Отменить выход", noLabel:"Разрешить занятие" },
  { id:"d1", type:"drone", who:"Дрон «Чайка» — лекарства", q:"На остров Гулкий срочно нужны лекарства. Отменять вечерний рейс?", yesLabel:"Отменить рейс", noLabel:"Лететь" },
  { id:"d2", type:"drone", who:"Дрон «Почтальон»", q:"Почтовый дрон везёт документы в посёлок за бухтой. Отложить до утра?", yesLabel:"Отложить рейс", noLabel:"Лететь" },
  { id:"d3", type:"drone", who:"Дрон с запчастями", q:"На маяк соседнего острова ждут запчасти для насоса. Отменять рейс?", yesLabel:"Отменить рейс", noLabel:"Лететь" },
  { id:"d4", type:"drone", who:"Дрон-фотограф", q:"Геодезисты просят съёмку береговой линии сегодня. Запретить полёт?", yesLabel:"Запретить полёт", noLabel:"Разрешить съёмку" },
  { id:"d5", type:"drone", who:"Дрон «Чайка» — продукты", q:"На Гулкий ждут хлеб и молоко, рейс только вечерний. Отменять?", yesLabel:"Отменить рейс", noLabel:"Лететь" },
  { id:"a1", type:"farm", who:"Ника, сенокос", q:"Ника разложила сено на лугах. Советовать срочно убирать под тент?", yesLabel:"Убирать сено сейчас", noLabel:"Оставить сушиться" },
  { id:"a2", type:"farm", who:"Ника, урожай тыкв", q:"Тыквы ещё в поле, Ника спрашивает: укрывать урожай прямо сейчас?", yesLabel:"Укрывать урожай сейчас", noLabel:"Работать спокойно" },
  { id:"a3", type:"farm", who:"Теплицы у дороги", q:"Хозяин теплиц спрашивает, опускать ли плёнку и ставни на ночь. Советовать закрыть?", yesLabel:"Закрыть теплицы", noLabel:"Оставить открытыми" },
  { id:"a4", type:"farm", who:"Пасека деда Прохора", q:"Прохор хочет перевезти ульи на дальний луг сегодня. Отложить перевозку?", yesLabel:"Отложить перевозку", noLabel:"Перевозить сегодня" },
  { id:"a5", type:"farm", who:"Виноградник на холме", q:"Сбор винограда назначен на вечер. Советовать собирать срочно до ночи?", yesLabel:"Собирать срочно", noLabel:"Ждать до утра" },
  { id:"b1", type:"boat", who:"Паром на остров Гулкий", q:"Паром с пассажирами готов к вечернему рейсу. Отменять рейс?", yesLabel:"Отменить рейс парома", noLabel:"Идти по расписанию" },
  { id:"b2", type:"boat", who:"Школьная экскурсия", q:"Класс едет на катере к скалам с учителем. Отменить экскурсию?", yesLabel:"Отменить экскурсию", noLabel:"Разрешить поездку" },
  { id:"b3", type:"boat", who:"Катер к тюленям", q:"Туристы просят катер к лежбищу тюленей после обеда. Отложить поездку?", yesLabel:"Отложить поездку", noLabel:"Разрешить поездку" },
  { id:"b4", type:"boat", who:"Переправа рабочих", q:"Бригаду нужно переправить на дальний причал к вечеру. Отменить переправу?", yesLabel:"Отменить переправу", noLabel:"Переправлять" },
  { id:"b5", type:"boat", who:"Свадебная лодка", q:"Молодожёны арендовали лодку для прогулки по бухте. Советовать перенести?", yesLabel:"Перенести прогулку", noLabel:"Разрешить прогулку" },
  { id:"e1", type:"event", who:"Ярмарка на набережной", q:"Ярмарка ставит шатры под открытым небом. Советовать сворачиваться заранее?", yesLabel:"Сворачиваться заранее", noLabel:"Торговать как обычно" },
  { id:"e2", type:"event", who:"Рыбный фестиваль", q:"Фестиваль готовит сцену и палатки у воды. Отменять вечернюю программу?", yesLabel:"Отменить программу", noLabel:"Проводить фестиваль" },
  { id:"e3", type:"event", who:"Регата юных яхтсменов", q:"Регата стартует после обеда у мола. Отменять гонку?", yesLabel:"Отменить регату", noLabel:"Проводить гонку" },
  { id:"e4", type:"event", who:"Концерт на набережной", q:"Музыканты ставят аппаратуру под открытым небом. Советовать перенос в зал?", yesLabel:"Переносить в зал", noLabel:"Играть на набережной" },
  { id:"w1", type:"work", who:"Портовый кран", q:"Кран поднимает тяжёлый контейнер до вечера. Остановить работы?", yesLabel:"Остановить кран", noLabel:"Продолжать работы" },
  { id:"w2", type:"work", who:"Ремонт крыши ратуши", q:"Кровельщики на крыше, листы жести уже подняты. Спускать бригаду?", yesLabel:"Спустить бригаду", noLabel:"Продолжать ремонт" },
  { id:"w3", type:"work", who:"Покраска судна в доке", q:"Судно красят на открытом стапеле. Советовать остановить покраску?", yesLabel:"Остановить покраску", noLabel:"Красить дальше" },
  { id:"w4", type:"work", who:"Подъём антенны связи", q:"Связисты поднимают антенну на мачту у порта. Отложить подъём?", yesLabel:"Отложить подъём", noLabel:"Поднимать сегодня" }
];
const USED_TASKS_KEY = "lighthouse_v2_used_tasks";
function getUsedTasksGlobal(){ try { return JSON.parse(localStorage.getItem(USED_TASKS_KEY)) || []; } catch(e){ return []; } }
function pickTasks(count){
  let globalUsed = getUsedTasksGlobal();
  const runUsed = new Set((S && S.usedTasks) || []);
  let avail = TASK_POOL.filter(t => !runUsed.has(t.id) && !globalUsed.includes(t.id));
  if (avail.length < count){
    globalUsed = [];
    avail = TASK_POOL.filter(t => !runUsed.has(t.id));
  }
  for (let i = avail.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [avail[i], avail[j]] = [avail[j], avail[i]]; }
  const chosen = avail.slice(0, count);
  chosen.forEach(t => { runUsed.add(t.id); if (!globalUsed.includes(t.id)) globalUsed.push(t.id); });
  if (S) S.usedTasks = [...runUsed];
  try { localStorage.setItem(USED_TASKS_KEY, JSON.stringify(globalUsed)); } catch(e){}
  return chosen;
}


/* ================= СОБЫТИЯ ДНЯ ================= */
const DAY_EVENTS = [
  { id:"calm", name:"Обычный день", desc:"Ничего особенного: море, приборы и твоё слово.", fuel:1 },
  { id:"heat", name:"Жара в дежурке", desc:"Топливо сегодня горит быстрее: расход +50%.", fuel:1.5 },
  { id:"quiet", name:"Тихая смена", desc:"Спокойный день: расход топлива ниже на 30%.", fuel:.7 },
  { id:"tailwind", name:"Резкий ветер с моря", desc:"Анемометр сегодня считает заметно быстрее.", measure:{ wind:.6 } },
  { id:"dust", name:"Пыль на смотровом стекле", desc:"Облака за окном читаются дольше обычного.", measure:{ clouds:1.6 } },
  { id:"sticky", name:"Липкая сырость", desc:"Колба влажности сегодня считает дольше.", measure:{ humidity:1.5 } },
  { id:"grant", name:"Городская премия", desc:"Город добавил +25 коинов к сегодняшнему вознаграждению.", rewardBonus:25 },
  { id:"rust", name:"Сырость в приборной", desc:"Приборы сегодня изнашиваются сильнее обычного.", wear:8 }
];

/* ================= РЕШЕНИЯ ================= */
function evalDecision(type, yes, rain, wind, mult){
  const m = mult;
  switch(type){
    case "fish":
      if (wind) return yes ? { d: Math.round(8*m),  t:"Ветер ударил, как ты и говорил. Лодки в бухте, все дома. Артель кивнула тебе с причала." }
                           : { d: Math.round(-12*m), t:"Шквал настиг лодки в открытом море. Спасательная шлюпка тащила «Чайку-младшую» до полуночи. Марко больше не здоровается." };
      return yes ? { d: Math.round(-3*m), t:"Море осталось спокойным. Рыбаки потеряли вечер и ворчат: «намудрил, синоптик»." }
                 : { d: Math.round(4*m),  t:"Море прощает, и Марко вернулся с полным трюмом. «Вот за это тебе, маячный»." };
    case "drone":
      if (rain || wind) return yes ? { d: Math.round(6*m),  t:"«Чайка» осталась в ангаре. Ночью метель била в стёкла — пилот прислал по рации одно слово: «Правильно»." }
                                   : { d: Math.round(-8*m), t:"Дрон ушёл в воду в трёх милях от острова. Груз — на дне. Пилот долго молчал, потом сказал: «Я доверился тебе»." };
      return yes ? { d: Math.round(-3*m), t:"Небо чистое, рейс отменён зря. На острове ждут лекарства уже третий день." }
                 : { d: Math.round(3*m),  t:"Ровное небо, «Чайка» села на Гулкий точно в срок. С острова передали спасибо." };
    case "farm":
      if (rain) return yes ? { d: Math.round(8*m),  t:"Ливень накрыл луга, но сено — под тентом. Ника привезла тебе яблок и записку: «Барометр твой — золото»." }
                           : { d: Math.round(-10*m), t:"Ночной ливень превратил сено в компост. Ника молчит, но весь город видит её молчание." };
      return yes ? { d: Math.round(-4*m), t:"Сено убрали впопыхах, а небо так и осталось чистым. Ника вздыхает: «Ну, лучше перебдеть... наверное»." }
                 : { d: Math.round(3*m),  t:"Сено досохло на солнце. Ника махнула тебе с телеги." };
    case "boat":
      if (rain || wind) return yes ? { d: Math.round(7*m), t:"Ты удержал судно у причала — и непогода подтвердила твоё слово. Пассажиры ворчат, но все дома и сухие." }
                                   : { d: Math.round(-10*m), t:"Судно застала непогода в пути. Причал встречал его молча, а капитан долго смотрел на маяк." };
      return yes ? { d: Math.round(-3*m), t:"Вода осталась ровной, рейс отменили зря. На берегу недовольно шумят." }
                 : { d: Math.round(4*m), t:"Ровная вода, спокойный рейс. С берега тебе машут рукой." };
    case "event":
      if (rain) return yes ? { d: Math.round(7*m), t:"Ты вовремя свернул праздник: ливень накрыл пустую набережную, а аппаратура и шатры целы." }
                           : { d: Math.round(-9*m), t:"Ливень разогнал праздник, шатры унесло к молу. Город долго вспоминал твой прогноз." };
      return yes ? { d: Math.round(-3*m), t:"Небо так и осталось чистым, а праздник отменили. Организаторы качают головами." }
                 : { d: Math.round(3*m), t:"Праздник прошёл под чистым небом. К вечеру на набережной пахло рыбой и праздником." };
    case "work":
      if (wind) return yes ? { d: Math.round(7*m), t:"Работы остановили вовремя: шквал рвал тенты и листы, но люди были внизу." }
                           : { d: Math.round(-11*m), t:"Шквал застал бригаду на высоте. Чудом обошлось без беды — но город это запомнил." };
      return yes ? { d: Math.round(-3*m), t:"Ветер так и не поднялся, а работы встали. Бригадир смотрит косо." }
                 : { d: Math.round(3*m), t:"Работы закончили в срок под ровным небом. Бригадир прислал благодарность по рации." };
  }
}

/* ================= HUD ================= */
const SKY_CLASS = { clear:"sk-clear", partly:"sk-partly", cloudy:"sk-cloudy", storm:"sk-storm" };
const DOT_ICON  = { clear:"[SN]", partly:"[PC]", cloudy:"[CL]", storm:"[ST]" };

function renderTrack(){
  if (S.mode === "survival"){
    $("#days-track").innerHTML = "<div class='dot now' title='Выживание: день " + (S.day+1) + "'>∞<small>Д" + (S.day+1) + "</small></div>";
    return;
  }
  $("#days-track").innerHTML = DAYS.map((d,i) =>
    "<div class='dot " + (i < S.day ? "done" : i === S.day ? "now" : "") + "' title='" + d.title + "'>" +
    DOT_ICON[d.sky] + "<small>Д" + (i+1) + "</small></div>").join("");
}
function updateTrust(){
  $("#trust-num").textContent = S.trust;
  $("#gauge-hole").textContent = S.trust;
  const col = S.trust < 35 ? "#c0574a" : S.trust < 70 ? "#d9a441" : "#5da065";
  $("#gauge").style.background = "conic-gradient(" + col + " 0 " + S.trust + "%, rgba(255,255,255,.14) " + S.trust + "% 100%)";
}

/* ================= ИЗМЕРЕНИЯ ПРИБОРАМИ ================= */
const MEASURE_MS = { pressure:1100, humidity:1700, wind:2100, clouds:2600 };
const measuringNow = new Set();

function renderObs(){
  if (!S || !S.cur) return;
  const o = S.cur.obs, m = S.cur.missing, r = S.cur.read || {};
  const NA = "<span class='v not-read'>— ещё не измерено —</span>";
  const rows = [
    ["Барометр", r.pressure ? (m.includes("pressure") ? "<span class='v missing'>— барометр сломан —</span>" : "<span class='v'>" + o.pressure + " мм</span>") : NA],
    ["Тренд (3 ч)", r.pressure ? "<span class='v'>" + o.trend + "</span>" : NA],
    ["Облака", r.clouds ? (m.includes("clouds") ? "<span class='v missing'>— горизонт в тумане —</span>" : "<span class='v'>" + o.clouds + "</span>") : NA],
    ["Ветер", r.wind ? (m.includes("wind") ? "<span class='v missing'>— анемометр заело —</span>" : "<span class='v'>" + o.windSpeed + " м/с, " + o.windDir + "</span>") : NA],
    ["Влажность", r.humidity ? (m.includes("humidity") ? "<span class='v missing'>— гигрометр врёт —</span>" : "<span class='v'>" + o.humidity + " %</span>") : NA]
  ];
  $("#obs-list").innerHTML = rows.map(x => "<li><span class='k'>" + x[0] + "</span>" + x[1] + "</li>").join("");
  // приборы, которые сегодня уже измерены, больше не подсвечиваются
  const hosts = { pressure:"#desk-barometer", clouds:"#stage .window-view", wind:"#desk-wind", humidity:"#desk-hygro" };
  Object.keys(hosts).forEach(k => { const el = $(hosts[k]); if (el) el.classList.toggle("measured", !!r[k]); });
}

function showBusy(host){
  const pop = host ? host.querySelector(".measure-pop") : null;
  if (!pop) return;
  pop.textContent = "ЗАНЯТО: ИДЁТ ИЗМЕРЕНИЕ ДРУГИМ ПРИБОРОМ";
  pop.classList.add("on");
  clearTimeout(pop._h);
  pop._h = setTimeout(() => pop.classList.remove("on"), 1300);
}

function measure(kind, host){
  if (!S || !S.cur || !host) return;
  if (S.cur.read && S.cur.read[kind]){ showMeasureResult(kind, host, 900); return; }
  // Пока один прибор измеряет, другие использовать нельзя:
  if (measuringNow.size > 0){ showBusy(host); toast("Подождите: сейчас измеряет другой прибор"); return; }
  measuringNow.add(kind);
  const cur = S.cur;
  const pop = host.querySelector(".measure-pop");
  // Чем сильнее изношен прибор, тем дольше он вычисляет: от x1 (новый) до x2.5 (убитый)
  const cond = (S.instruments && S.instruments[kind] !== undefined) ? S.instruments[kind] : 100;
  const evMult = (cur.event && cur.event.measure && cur.event.measure[kind]) || 1;
  const ms = Math.round((MEASURE_MS[kind] || 1500) * (1 + (100 - cond) / 100 * 1.5) * evMult);
  if (pop){
    pop.innerHTML = (cond < 60 ? "ИЗМЕРЯЮ · ПРИБОР ИЗНОШЕН, СЧИТАЕТ ДОЛГО" : "ИЗМЕРЯЮ") + "<span class='mp-track'><span class='mp-fill'></span></span>";
    pop.classList.add("on");
    const fill = pop.querySelector(".mp-fill");
    if (fill){ fill.style.transition = "none"; fill.style.width = "0%"; void fill.offsetWidth; fill.style.transition = "width " + ms + "ms linear"; fill.style.width = "100%"; }
  }
  setTimeout(() => {
    measuringNow.delete(kind);
    if (!S || S.cur !== cur){ if (pop) pop.classList.remove("on"); return; }
    cur.read = cur.read || {};
    cur.read[kind] = true;
    if (["pressure","clouds","wind","humidity"].every(k => cur.read[k])) unlockAch("allmeas");
    renderObs();
    save();
    showMeasureResult(kind, host, 1500);
  }, ms);
}

function showMeasureResult(kind, host, holdMs){
  const pop = host ? host.querySelector(".measure-pop") : null;
  if (!pop || !S || !S.cur) return;
  const o = S.cur.obs, m = S.cur.missing;
  const txt = kind === "pressure" ? (m.includes("pressure") ? "БАРОМЕТР СЛОМАН" : o.pressure + " мм · " + o.trend)
    : kind === "wind" ? (m.includes("wind") ? "АНЕМОМЕТР ЗАЕЛО" : o.windSpeed + " м/с · " + o.windDir)
    : kind === "humidity" ? (m.includes("humidity") ? "ГИГРОМЕТР ВРЁТ" : "ВЛАЖНОСТЬ " + o.humidity + "%")
    : (m.includes("clouds") ? "ЗА ОКНОМ ТУМАН" : o.clouds.toUpperCase());
  pop.textContent = txt + " — В БЛАНКЕ";
  pop.classList.add("on");
  clearTimeout(pop._h);
  pop._h = setTimeout(() => pop.classList.remove("on"), holdMs);
}

function closeFloaters(){
  const pc = $("#pc-overlay"); if (pc) pc.classList.remove("open");
  const ob = $("#obs-overlay"); if (ob) ob.classList.remove("open");
  const nb = $("#notebook"); if (nb) nb.classList.remove("open");
}



/* ================= БАЗА ДАННЫХ (PHP/MySQL, необязательно) ================= */
async function createPlayerOnline(nickname){
  try {
    const r = await fetch("api/player.php", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ nickname }) });
    if (!r.ok) return null;
    const data = await r.json();
    return data && data.player_id ? data.player_id : null;
  } catch(e){ return null; }
}
function scheduleDbSync(){
  if (!S || !S.playerId) return;
  clearTimeout(window._dbSyncT);
  window._dbSyncT = setTimeout(() => {
    try {
      fetch("api/sync.php", { method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ player_id:S.playerId, save:S, achievements:getAch(), stats:getStats() }) }).catch(() => {});
    } catch(e){}
  }, 700);
}
function submitOnlineRecord(rec){
  if (!S || !S.playerId) return;
  try {
    fetch("api/leaderboard.php", { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ player_id:S.playerId, trust:rec.trust, avg:rec.avg, diff:rec.diff, mode:S.mode || "campaign", days:(S.mode === "survival" ? S.day + 1 : 7) }) }).catch(() => {});
  } catch(e){}
}
async function loadOnlineRecords(){
  const box = $("#records-online"); if (!box) return;
  try {
    const r = await fetch("api/leaderboard.php");
    const data = await r.json();
    if (!data || !data.ok) throw 0;
    if (!data.records.length){ box.innerHTML = "<div class='glass records-panel'><b>Рекорды из базы</b><div class='rec-empty' style='margin-top:8px;'>В базе пока пусто.</div></div>"; return; }
    const rows = data.records.map((x,i) => "<tr><td>" + (i+1) + "</td><td><b>" + esc(x.name) + "</b></td><td>" + x.trust + "</td><td>" + x.avg + "</td><td>" + esc(x.diff) + (x.mode === "survival" ? " · выживание" : "") + "</td></tr>").join("");
    box.innerHTML = "<div class='glass records-panel'><b>Рекорды из базы (MySQL)</b><table class='rec-table' style='margin-top:8px;'><tr><th>#</th><th>Имя</th><th>Доверие</th><th>Калибр.</th><th>Сложность</th></tr>" + rows + "</table></div>";
  } catch(e){
    box.innerHTML = "<div class='glass records-panel'><b>Рекорды из базы</b><div class='rec-empty' style='margin-top:8px;'>База недоступна: игра работает на локальных сохранениях. Импортируйте sql/lighthouse_game.sql в phpMyAdmin и запустите игру через OpenServer.</div></div>";
  }
}

/* ================= АЧИВКИ ================= */
const ACH_KEY = "lighthouse_v2_achievements";
const STATS_KEY = "lighthouse_v2_stats";
const ACH = [
  { id:"first", name:"Первая смена", desc:"Отправить первый прогноз." },
  { id:"perfect", name:"Идеальная калибровка", desc:"Набрать 95+ очков калибровки за день." },
  { id:"honest", name:"Честные пятьдесят", desc:"Отправить прогноз 50% и 50% — честная неизвестность." },
  { id:"allmeas", name:"Полный обход", desc:"За один день измерить всё: давление, облака, ветер и влажность." },
  { id:"streak3", name:"Серия маяка", desc:"Три точных дня подряд (калибровка 70+)." },
  { id:"tasks20", name:"Голос города", desc:"Ответить на 20 заданий жителей за все игры." },
  { id:"repairs", name:"Механик", desc:"Починить прибор в накладной." },
  { id:"fulltank", name:"Полный бак", desc:"Заправить топливо до полного бака (120)." },
  { id:"rich", name:"Казначей", desc:"Держать на балансе 300 коинов." },
  { id:"broken", name:"До последнего винтика", desc:"Довести прибор до полной поломки (0%)." },
  { id:"trust", name:"Город верит", desc:"Закончить смену с доверием 75 и выше." },
  { id:"campaign", name:"Смена сдана", desc:"Пройти кампанию из 7 дней до конца." },
  { id:"surv7", name:"Неделя в выживании", desc:"Дожить до 8-го дня в режиме выживания." },
  { id:"surv14", name:"Две недели на маяке", desc:"Дожить до 15-го дня в режиме выживания." }
];
function getAch(){ try { return JSON.parse(localStorage.getItem(ACH_KEY)) || {}; } catch(e){ return {}; } }
function getStats(){ try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch(e){ return {}; } }
function bumpStat(k, n){
  const st = getStats(); st[k] = (st[k] || 0) + (n || 1);
  try { localStorage.setItem(STATS_KEY, JSON.stringify(st)); } catch(e){}
  if ((st.tasks || 0) >= 20) unlockAch("tasks20");
}
function unlockAch(id){
  const def = ACH.find(a => a.id === id); if (!def) return;
  const a = getAch(); if (a[id]) return;
  a[id] = new Date().toISOString().slice(0,10);
  try { localStorage.setItem(ACH_KEY, JSON.stringify(a)); } catch(e){}
  toast("Ачивка открыта: " + def.name);
  renderAchievements();
}
function renderAchievements(){
  const el = $("#achievements-main"); if (!el) return;
  const a = getAch();
  const unlocked = ACH.filter(x => a[x.id]).length;
  el.innerHTML = "<div class='ach-head'>АЧИВКИ · " + unlocked + " / " + ACH.length + "</div>" +
    "<div class='ach-grid'>" + ACH.map(x => {
      const open = !!a[x.id];
      return "<div class='ach-card " + (open ? "open" : "locked") + "'><div class='ach-name'>" + (open ? x.name : "???") + "</div>" +
        "<div class='ach-desc'>" + x.desc + "</div><div class='ach-state'>" + (open ? "ОТКРЫТО · " + a[x.id] : "ЗАКРЫТО") + "</div></div>";
    }).join("") + "</div>";
}

/* ================= КОИНЫ, ТОПЛИВО, РЕМОНТ ================= */
const FUEL_MAX = 120;
const INST_LABEL = { pressure:"Барометр", clouds:"Смотровое стекло (облака)", wind:"Анемометр (ветер)", humidity:"Гигрометр-колба" };

function ensureEconomy(){
  if (!S) return;
  if (S.coins === undefined) S.coins = 40;
  if (S.fuel === undefined) S.fuel = 60;
  if (!S.instruments) S.instruments = { pressure:100, clouds:100, wind:100, humidity:100 };
  updateResUI();
}
function updateResUI(){
  if (!S) return;
  if ((S.coins || 0) >= 300) unlockAch("rich");
  const f = $("#fuel-num"); if (f) f.textContent = Math.ceil(S.fuel || 0);
  const c = $("#coin-num"); if (c) c.textContent = S.coins || 0;
  const pill = $("#fuel-pill"); if (pill) pill.classList.toggle("low", (S.fuel || 0) <= 20);
}
function wearInstruments(){
  ensureEconomy();
  ["pressure","clouds","wind","humidity"].forEach(k => {
    let wear = 10 + Math.random() * 10 + ((S.cur && S.cur.event && S.cur.event.wear) || 0);
    if (S.cur && S.cur.read && S.cur.read[k]) wear += 7;
    S.instruments[k] = Math.max(0, Math.round(S.instruments[k] - wear));
    if (S.instruments[k] <= 0) unlockAch("broken");
  });
}
function renderInvoice(){
  ensureEconomy();
  $("#inv-reward").textContent = "+" + (S.lastReward || 0) + " коинов";
  $("#inv-coins").textContent = (S.coins || 0) + " коинов";
  $("#inv-fuel").textContent = Math.ceil(S.fuel || 0);
  $("#inv-fuel-fill").style.width = clamp((S.fuel || 0) / FUEL_MAX * 100, 0, 100) + "%";
  $("#repairs-list").innerHTML = Object.keys(INST_LABEL).map(k => {
    const cond = S.instruments[k];
    const cost = Math.ceil((100 - cond) * .6);
    const status = cond <= 0 ? "<b class='delta-bad'>СЛОМАН</b>" : cond <= 30 ? "<b class='delta-bad'>на грани поломки</b>" : cond < 100 ? "изношен" : "<b class='delta-good'>исправен</b>";
    return "<div class='repair-row'><span class='repair-name'>" + INST_LABEL[k] + "</span>" +
      "<span class='repair-bar'><span style='width:" + cond + "%'></span></span>" +
      "<span class='repair-cond'>" + cond + "% · " + status + "</span>" +
      (cond < 100 ? "<button class='btn ghost repair-btn' data-repair='" + k + "'>Починить: " + cost + "</button>" : "") +
      "</div>";
  }).join("");
  document.querySelectorAll("[data-repair]").forEach(b => b.onclick = () => {
    const k = b.dataset.repair, cond = S.instruments[k], cost = Math.ceil((100 - cond) * .6);
    if ((S.coins || 0) < cost){ toast("Не хватает коинов на ремонт"); return; }
    S.coins -= cost; S.instruments[k] = 100;
    save(); updateResUI(); renderInvoice();
    bumpStat("repairs"); unlockAch("repairs");
    toast(INST_LABEL[k] + " починен");
  });
}
function openInvoice(){
  closeFloaters();
  renderInvoice();
  $("#invoice-overlay").style.display = "grid";
  const card = $("#invoice-overlay .result-card"); if (card) card.scrollTop = 0;
}
function tickFuel(){
  if (!S || !S.cur) return;
  if (!$("#scr-game").classList.contains("active")) return;
  if (typeof tutActive !== "undefined" && tutActive) return;
  if ($("#resolve-overlay").style.display === "grid") return;
  if ($("#invoice-overlay").style.display === "grid") return;
  S.fuel = Math.max(0, (S.fuel || 0) - .35 * ((S.cur.event && S.cur.event.fuel) || 1));
  updateResUI();
  if (S.fuel <= 0 && !S._fuelOut){
    S._fuelOut = true; S.failedFuel = true;
    save();
    toast("Топливо кончилось — маяк гаснет");
    setTimeout(() => endGame(), 600);
  }
}
setInterval(tickFuel, 1000);

/* ================= ЭКРАН ДНЯ ================= */
function beginDay(){
  closeFloaters();
  ensureEconomy();
  if (!S.cur) { S.cur = genDay(S.day); save(); }
  const cfg = (S.cur && S.cur.cfg) || DAYS[Math.min(S.day, DAYS.length - 1)];

  $("#avatar").textContent = S.name.charAt(0).toUpperCase();
  $("#day-badge").textContent = S.mode === "survival" ? "День " + (S.day+1) + " · Выживание · " + DIFFS[S.diff].label : "День " + (S.day+1) + " / 7 · " + DIFFS[S.diff].label;
  renderTrack(); updateTrust();

  const sky = $("#sky");
  sky.className = "sky " + SKY_CLASS[cfg.sky];
  $("#stage").classList.remove("raining");
  $("#cl1").style.opacity = cfg.sky === "clear" ? ".55" : cfg.sky === "partly" ? ".75" : ".95";
  $("#cl2").style.opacity = cfg.sky === "storm" ? ".9" : ".65";

  $("#day-title").textContent = cfg.title;
  $("#day-story").textContent = cfg.story;
  const hn = $("#hud-name"); if (hn) hn.textContent = S.name + (S.playerId ? " · ID " + S.playerId : "");
  const de = $("#day-event");
  if (de) de.textContent = S.cur.event ? ("Событие дня: " + S.cur.event.name + " — " + S.cur.event.desc) : "";

  const o = S.cur.obs, m = S.cur.missing;
  if (!S.cur.read) S.cur.read = {};
  renderObs();

  // Погода за окном соответствует показателю "Облака":
  const cloudSky = o.clouds.includes("ясное") ? "sk-clear" : o.clouds.includes("кумулюсы") ? "sk-cloudy" : o.clouds.includes("грозовые") ? "sk-storm" : "sk-partly";
  const effSky = m.includes("clouds") ? "sk-cloudy" : cloudSky;
  sky.className = "sky " + effSky;
  $("#stage").classList.toggle("clouds-missing", m.includes("clouds"));
  const cop = effSky === "sk-clear" ? .15 : effSky === "sk-partly" ? .6 : .95;
  $("#cl1").style.opacity = cop;
  $("#cl2").style.opacity = Math.max(.1, cop - .2);
  const cl3 = $("#cl3"); if (cl3) cl3.style.opacity = effSky === "sk-clear" ? 0 : .5;

  let nb = "";
  for (let i = 0; i <= S.day && i < NOTEBOOK.length; i++)
    nb += "<div class='nb-page'>" + NOTEBOOK[i] + "</div>";
  $("#nb-pages").innerHTML = nb;

  const nd2 = $("#baro-needle"); if (nd2) nd2.setAttribute("transform", "rotate(" + clamp((o.pressure - 755) * 3, -55, 55) + " 50 52)");
  if (!m.includes("wind")){
    const dirs = { "северный":0, "северо-восточный":45, "восточный":90, "юго-восточный":135, "южный":180, "юго-западный":225, "западный":270, "северо-западный":315 };
    const vv = $("#wind-vane"); if (vv) vv.setAttribute("transform", "rotate(" + (dirs[o.windDir] ?? 0) + " 50 12)");
    const wc = $("#wind-cups"); if (wc) wc.style.animationDuration = Math.max(.25, 2.4 - o.windSpeed * .09) + "s";
  }
  const hl = $("#hygro-liquid");
  if (hl){
    if (m.includes("humidity")){ hl.setAttribute("y", 88); hl.setAttribute("height", 4); hl.setAttribute("fill", "#83769C"); }
    else { const ly = 90 - clamp(o.humidity,0,100) / 100 * 44; hl.setAttribute("y", ly); hl.setAttribute("height", 90 - ly); hl.setAttribute("fill", "#29ADFF"); }
  }
  const pc = $("#pc-lines");
  if (pc) pc.innerHTML = "ДЕНЬ " + (S.day+1) + " / 7 · " + DIFFS[S.diff].label.toUpperCase() + "<br>&gt; сообщение смены: нажмите на монитор" + (S.cur.event ? "<br>&gt; событие: " + S.cur.event.name : "") + "<br>&gt; прогноз не отправлен";

  if (!S.cur.tasks){ S.cur.tasks = pickTasks(S.day === 0 ? 1 : 2 + Math.floor(Math.random() * 3)); save(); }
  const dayTasks = S.cur.tasks;
  const tc = $("#tasks-count"); if (tc) tc.textContent = "· " + dayTasks.length;
  $("#dec-col").innerHTML = dayTasks.map((s,i) =>
    "<div class='glass decision'>" +
      "<div class='who'>[RD] " + s.who + "</div>" +
      "<div class='q'>" + s.q + "</div>" +
      "<button class='choice' data-i='" + i + "' data-v='yes'>[Y] " + s.yesLabel + "</button>" +
      "<button class='choice' data-i='" + i + "' data-v='no'>[N] " + s.noLabel + "</button>" +
    "</div>").join("");
  document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    document.querySelectorAll(".choice[data-i='" + b.dataset.i + "']").forEach(x => x.classList.remove("sel"));
    b.classList.add("sel");
    if (b.parentElement) b.parentElement.classList.remove("need-answer");
  });

  $("#resolve-overlay").style.display = "none";
  $("#sl-rain").value = 50; $("#sl-wind").value = 30;
  updateSliders();
  if (S.mode === "survival"){
    if (S.day >= 7) unlockAch("surv7");
    if (S.day >= 14) unlockAch("surv14");
  }
  show("#scr-game");
  if (!localStorage.getItem("lighthouse_v2_tut")) startTutorial();
}

function updateSliders(){
  $("#out-rain").textContent = $("#sl-rain").value + "%";
  $("#out-wind").textContent = $("#sl-wind").value + "%";
  $("#hint-rain").textContent = probWords(+$("#sl-rain").value);
  $("#hint-wind").textContent = probWords(+$("#sl-wind").value);
}
function probWords(p){
  if (p === 0) return "«не бывает» — смело, но если ошибёшься...";
  if (p <= 20) return "«вряд ли, но возможно»";
  if (p <= 40) return "«скорее нет, чем да»";
  if (p <= 60) return "«пятьдесят на пятьдесят — честная неизвестность»";
  if (p <= 80) return "«скорее да, чем нет»";
  if (p < 100) return "«почти наверняка»";
  return "«стопроцентно» — Матвей бы нахмурился";
}

/* ================= ОТПРАВКА ================= */
function submitForecast(){
  if (!S || !S.cur) return; // защита от повторного клика
  const cfg = (S.cur && S.cur.cfg) || DAYS[Math.min(S.day, DAYS.length - 1)];
  const dayTasks = (S.cur && S.cur.tasks) || cfg.situations || [];
  const pr = +$("#sl-rain").value, pw = +$("#sl-wind").value;
  const dec = [];
  for (let i = 0; i < dayTasks.length; i++){
    const el = document.querySelector(".choice[data-i='" + i + "'].sel");
    if (!el){
      const card = document.querySelectorAll(".decision")[i];
      card.classList.add("need-answer");
      $("#pc-overlay").classList.add("open");
      setTimeout(() => card.scrollIntoView({ block:"center", behavior:"smooth" }), 80);
      toast("[RD] Рация ждёт: сначала ответьте — «" + dayTasks[i].who + "»");
      return;
    }
    dec.push(el.dataset.v === "yes");
  }

  const { rain, wind } = S.cur;
  const brier = (Math.pow(pr/100 - (rain?1:0), 2) + Math.pow(pw/100 - (wind?1:0), 2)) / 2;
  const points = Math.round((1 - brier) * 100);
  const trustDelta = Math.round((points - 55) / 5);
  const mult = DIFFS[S.diff].mult;

  let html = "", totalDelta = trustDelta;
  dayTasks.forEach((s,i) => {
    const r = evalDecision(s.type, dec[i], rain, wind, mult);
    totalDelta += r.d;
    html += "<div class='vignette'>" + r.t + " <b class='" + (r.d>=0?"delta-good":"delta-bad") + "'>" + (r.d>=0?"+":"") + r.d + "</b></div>";
  });

  let wtxt;
  if (rain && wind) wtxt = "К вечеру небо почернело. Ливень барабанил по стекляшке маяка, шквалный ветер срывал белые барашки с гребней волн. Барограф упал ещё на пять делений.";
  else if (rain) wtxt = "Без ветра, но сплошная серая вода из лужицы неба. Ливня не вышло — был ровный, упрямый дождь до самой темноты.";
  else if (wind) wtxt = "Капли так и не упало, но ветер бесновался: рвал вымпелы, валил вёсла у причала, вой в раме двери.";
  else wtxt = "Вечер вышел ровным — то самое спокойное море, ради которого маяки вообще держат людей.";
  $("#res-weather").textContent = wtxt;
  $("#res-vignettes").innerHTML = html;

  const rf = [];
  rf.push("Осадки: вы дали " + pr + " % — дождь " + (rain ? "был" : "не пришёл") + ".");
  rf.push("Ветер: вы дали " + pw + " % — шквал " + (wind ? "был" : "не случился") + ".");
  rf.push("Очки калибровки: <span class='score-big'>" + points + "</span> / 100");
  $("#res-forecast").innerHTML = rf.map(x => "<div class='calib-line'>" + x + "</div>").join("");

  const nd = totalDelta >= 0;
  $("#res-trust").innerHTML = "Доверие города: <b class='" + (nd?"delta-good":"delta-bad") + "'>" + (nd?"+":"") + totalDelta + "</b>" +
    " <span style='color:var(--ink-soft); font-size:13px;'>(прогноз " + (trustDelta>=0?"+":"") + trustDelta + " · решения " + (totalDelta-trustDelta>=0?"+":"") + (totalDelta-trustDelta) + ")</span>";

  ensureEconomy();
  S.lastReward = 30 + points + Math.max(0, totalDelta) * 2;
  // Штраф коинами за неверные прогнозы: мимо — 12, уверенно мимо (от 80% не в ту сторону) — 25
  const missRain = rain ? pr < 50 : pr >= 50;
  const missWind = wind ? pw < 50 : pw >= 50;
  const confRain = rain ? pr <= 20 : pr >= 80;
  const confWind = wind ? pw <= 20 : pw >= 80;
  S.lastPenalty = (missRain ? (confRain ? 25 : 12) : 0) + (missWind ? (confWind ? 25 : 12) : 0);
  // Серия точных дней: калибровка 70+ подряд даёт растущий бонус
  if (points >= 70) S.streak = (S.streak || 0) + 1; else S.streak = 0;
  const streakBonus = S.streak > 1 ? (S.streak - 1) * 10 : 0;
  const eventBonus = (S.cur.event && S.cur.event.rewardBonus) || 0;
  S.coins = Math.max(0, (S.coins || 0) + S.lastReward + streakBonus + eventBonus - S.lastPenalty);
  rf.push("Вознаграждение: <b class='delta-good'>+" + S.lastReward + " коинов</b> — баланс: " + S.coins);
  if (streakBonus > 0) rf.push("Серия точных прогнозов: " + S.streak + " дня подряд — бонус <b class='delta-good'>+" + streakBonus + " коинов</b>");
  if (eventBonus > 0) rf.push("Городская премия: <b class='delta-good'>+" + eventBonus + " коинов</b>");
  if (S.lastPenalty > 0) rf.push("Штраф за неверный прогноз: <b class='delta-bad'>-" + S.lastPenalty + " коинов</b>" + (confRain || confWind ? " (уверенный промах дороже)" : ""));
  $("#res-forecast").innerHTML = rf.map(x => "<div class='calib-line'>" + x + "</div>").join("");
  wearInstruments();
  updateResUI();

  S.trust = clamp(S.trust + totalDelta, 0, 100);
  S.history.push({ pr, rain, pw, wind, points });
  S.cur = null;
  bumpStat("forecasts"); bumpStat("tasks", dayTasks.length);
  unlockAch("first");
  if (points >= 95) unlockAch("perfect");
  if (pr === 50 && pw === 50) unlockAch("honest");
  if ((S.streak || 0) >= 3) unlockAch("streak3");

  save();
  updateTrust(); renderTrack();

  if (rain) $("#stage").classList.add("raining");
  const pc2 = $("#pc-lines"); if (pc2) pc2.innerHTML = "ПРОГНОЗ ОТПРАВЛЕН<br>&gt; осадки " + pr + "% · шквал " + pw + "%<br>&gt; ждём вечер...";
  $("#resolve-overlay").style.display = "grid";
  const rc = $("#resolve-overlay .result-card"); if (rc) rc.scrollTop = 0;
}

/* ================= ФИНАЛ ================= */
function plural(n,a,b,c){ const m10=n%10,m100=n%100;
  if(m10===1&&m100!==11)return a; if(m10>=2&&m10<=4&&(m100<12||m100>14))return b; return c; }

function endGame(){
  const t = S.trust;
  const avg = S.history.length ? Math.round(S.history.reduce((a,h)=>a+h.points,0) / S.history.length) : 0;
  let txt;
  if (S.failedFuel){
    txt = "Топливо кончилось посреди смены — и маяк погас. Город встретил вечер без твоего света и без прогноза. Матвей говорил: «Следи за баком, маячный. Свет — это время, а время на маяке покупают заранее». Смена окончена досрочно на дне " + (S.day+1) + ".";
    txt += "<br><br><i>В следующий раз оставляй коины на заправку и не тяни с прогнозом.</i>";
    $("#end-text").innerHTML = txt;
    $("#end-trust").textContent = t;
    const colF = "#c0574a";
    $("#end-gauge").style.background = "conic-gradient(" + colF + " 0 " + t + "%, rgba(0,0,0,.15) " + t + "% 100%)";
    $("#end-diff-label").textContent = S.mode === "survival" ? "Выживание прервано: топливо закончилось · продержался дней: " + (S.day+1) + " · средняя калибровка: " + avg + "/100" : "Смена прервана: топливо закончилось · день " + (S.day+1) + " из 7 · средняя калибровка: " + avg + "/100";
    $("#end-sky").className = "sky sk-night";
    const recF = { name:S.name, trust:t, avg, diff:DIFFS[S.diff].label, date:new Date().toISOString().slice(0,10) };
    let recsF = getRecords(); recsF.push(recF); recsF.sort((a,b) => b.trust - a.trust || b.avg - a.avg); setRecords(recsF);
    submitOnlineRecord(recF);
    $("#records-end").innerHTML = recordsHTML(recF);
    S.shareCode = btoa(unescape(encodeURIComponent(JSON.stringify(recF)))).replace(/=+$/,"");
    $("#end-calib").innerHTML = "";
    save(); show("#scr-end");
    return;
  }
  if (t >= 75) txt = "Матвей вернулся на два дня раньше и долго смотрел на ваши записи. Потом молча подписал прогнозы. В городе уже спрашивают, когда выйдет «молодой с маяка». Артель зовёт ужинать без повода. Метеоролог — это человек, которому верят деньгами, временем и иногда жизнью. Эту неделю вы этим доверием распорядились честно.";
  else if (t >= 45) txt = "Неделя выдалась жёсткой: кто-то ворчит, кто-то молчит, кто-то махнул рукой. Но маяк выстоял, лодки целы, и в тетради Матвея появилась новая страница — ваша. Метеорологом становятся не тогда, когда не ошибаются. А тогда, когда ошибку считают честно.";
  else txt = "Город недоволен. Марко обходит дежурку стороной, пилот «Чайки» просил нового синоптика. Но вы поняли главное: метеоролог не гадалка. Работа с неопределённостью означает, что иногда шестьдесят на сорок складываются против тебя. Вопрос в том, были ли честны эти шестьдесят.";
  txt += "<br><br><i>Метеоролог не предсказывает будущее. Он измеряет неопределённость — и позволяет другим принимать решения. Это и есть профессия.</i>";
  $("#end-text").innerHTML = txt;

  $("#end-trust").textContent = t;
  $("#end-diff-label").textContent = "Сложность: " + DIFFS[S.diff].label + " · средняя калибровка: " + avg + "/100";
  const col = t < 35 ? "#c0574a" : t < 70 ? "#d9a441" : "#5da065";
  $("#end-gauge").style.background = "conic-gradient(" + col + " 0 " + t + "%, rgba(0,0,0,.15) " + t + "% 100%)";
  $("#end-sky").className = "sky " + (t >= 60 ? "sk-clear" : t >= 40 ? "sk-partly" : "sk-night");
  $("#scr-end").classList.toggle("raining", S.history[6] && S.history[6].rain);

  const buckets = {};
  S.history.forEach(h => {
    const b = Math.round(h.pr/10)*10;
    if (!buckets[b]) buckets[b] = { n:0, hits:0 };
    buckets[b].n++; if (h.rain) buckets[b].hits++;
  });
  $("#end-calib").innerHTML = Object.keys(buckets).map(Number).sort((a,b)=>a-b).map(b => {
    const x = buckets[b], pct = Math.round(x.hits/x.n*100);
    return "<div class='calib-bar'><span style='width:86px;'>«~"+b+"%»</span>" +
      "<div class='bar'><div class='fill' style='width:"+pct+"%'></div></div>" +
      "<span style='width:110px;'>дождь: "+x.hits+"/"+x.n+"</span></div>";
  }).join("");

  // рекорд
  const rec = { name:S.name, trust:t, avg, diff:DIFFS[S.diff].label, date:new Date().toISOString().slice(0,10) };
  let recs = getRecords();
  recs = recs.filter(r => !(r.name === rec.name && r.trust === rec.trust && r.avg === rec.avg));
  recs.push(rec);
  recs.sort((a,b) => b.trust - a.trust || b.avg - a.avg);
  setRecords(recs);
  $("#records-end").innerHTML = recordsHTML(rec);

  // код для обмена
  submitOnlineRecord(rec);
  if (t >= 75) unlockAch("trust");
  unlockAch("campaign");
  S.shareCode = btoa(unescape(encodeURIComponent(JSON.stringify(rec)))).replace(/=+$/,"");
  save();
  show("#scr-end");
}

function recordsHTML(highlight){
  const recs = getRecords().slice(0, 8);
  if (!recs.length) return "<div class='glass records-panel'><b>[ACH] Таблица рекордов</b><div class='rec-empty' style='margin-top:8px;'>Пока пусто. Сыграйте первую смену — станьте первой строкой таблицы.</div></div>";
  const rows = recs.map((r,i) =>
    "<tr class='" + (highlight && r.name===highlight.name && r.trust===highlight.trust ? "me" : "") + "'>" +
    "<td>" + (i+1) + "</td><td><b>" + esc(r.name) + "</b></td><td>" + r.trust + "</td><td>" + r.avg + "</td><td class='muted'>" + r.diff + "</td></tr>").join("");
  return "<div class='glass records-panel'><b>[ACH] Таблица рекордов</b> <span class='muted small'>(локально + коды друзей)</span>" +
    "<table class='rec-table' style='margin-top:8px;'><tr><th>#</th><th>Имя</th><th>Доверие</th><th>Калибр.</th><th>Сложность</th></tr>" + rows + "</table>" +
    "<div class='import-row'><input type='text' class='inp' style='margin:0;' id='import-code' placeholder='Вставьте код результата друга'>" +
    "<button class='btn ghost' id='btn-import'>+</button></div></div>";
}
function esc(s){ return String(s).replace(/[<>&"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c])); }

/* ================= ОБУЧЕНИЕ ================= */
const TUT = [
  { sel:null, h:"Добро пожаловать на маяк", p:"Семь рассветов. Каждое утро — наблюдения, каждый вечер — настоящая погода. Твоя задача: честные вероятности и правильные слова городу." },
  { sel:"#days-track", h:"Неделя шторма", p:"Семь дней, от ясного утра к большому шторму. Кружки показывают прогресс: золотой — сегодня, тёмные — впереди." },
  { sel:"#desk-blank", h:"Наблюдения", p:"На столе лежит бланк — жми на него, откроется окно утренних наблюдений: барометр, облака, ветер, влажность. На высоких сложностях часть приборов молчит — данных не хватает, и это нормально." },
  { sel:"#desk-book", h:"Тетрадь Матвея", p:"На столе лежит тетрадь Матвея — жми прямо на книгу, откроются записи наставника. Новые страницы появляются каждый день: эвристики о давлении, облаках и ветре." },
  { sel:".dock", h:"Прогноз — это вероятность", p:"Не «дождь/нет», а честный процент. Вечером игра покажет, что случилось, и оценит калибровку: насколько ваши проценты совпадают с реальностью." },
  { sel:"#desk-computer", h:"Задания в компьютере", p:"Жми на монитор — на весь экран откроются сообщение смены и задания жителей. В первый день задание одно, дальше — от двух до четырёх. Ответь каждому: перестраховка стоит денег, недооценка — иногда жизней." },
  { sel:"#btn-submit", h:"Отправка прогноза", p:"Когда готов — жми «Отправить прогноз» под рацией на столе. Шторм не ждёт. Удачи, маячный." }
];
let tutIdx = 0, tutActive = false;

function startTutorial(){ tutIdx = 0; tutActive = true; renderTut(); }
function renderTut(){
  const step = TUT[tutIdx];
  document.querySelectorAll(".tut-hl").forEach(e => e.classList.remove("tut-hl"));
  $("#tut-dim").classList.add("on");
  const tip = $("#tut-tip");
  tip.classList.add("on");
  $("#tut-h").textContent = (tutIdx+1) + "/" + TUT.length + " · " + step.h;
  $("#tut-p").textContent = step.p;
  $("#tut-prev").style.display = tutIdx > 0 ? "inline-block" : "none";
  $("#tut-next").textContent = tutIdx === TUT.length-1 ? "Понятно!" : "Далее →";

  // Подсказка всегда стоит на одном месте (CSS: сверху по центру) и не прыгает.
  // Только подсвечиваем нужный элемент — без прокрутки и пересчёта координат.
  tip.style.top = "";
  tip.style.left = "";
  if (step.sel){
    const el = document.querySelector(step.sel);
    if (el) el.classList.add("tut-hl");
  }
}
function closeTutorial(){
  tutActive = false;
  $("#tut-dim").classList.remove("on");
  $("#tut-tip").classList.remove("on");
  document.querySelectorAll(".tut-hl").forEach(e => e.classList.remove("tut-hl"));
  localStorage.setItem("lighthouse_v2_tut", "1");
}
$("#tut-next").onclick = () => { if (tutIdx < TUT.length-1){ tutIdx++; renderTut(); } else closeTutorial(); };
$("#tut-prev").onclick = () => { if (tutIdx > 0){ tutIdx--; renderTut(); } };
$("#tut-skip").onclick = closeTutorial;
$("#btn-tut").onclick = () => { if (tutActive) closeTutorial(); else startTutorial(); };

/* ================= СОБЫТИЯ ================= */
let chosenDiff = "intern";
(function initChips(){
  $("#diff-chips").innerHTML = Object.keys(DIFFS).map(k =>
    "<div class='chip " + (k==="intern"?"sel":"") + "' data-k='" + k + "'>" + DIFFS[k].label + "</div>").join("");
  document.querySelectorAll("#diff-chips .chip").forEach(c => c.onclick = () => {
    document.querySelectorAll("#diff-chips .chip").forEach(x => x.classList.remove("sel"));
    c.classList.add("sel");
    chosenDiff = c.dataset.k;
    $("#diff-desc").textContent = DIFFS[chosenDiff].desc;
  });
  $("#diff-desc").textContent = DIFFS.intern.desc;
})();

$("#btn-start").onclick = () => {
  show("#scr-diff");
};
$("#btn-leaderboard").onclick = () => { refreshRecords();
renderAchievements(); show("#scr-records"); };
$("#btn-records-back").onclick = () => show("#scr-title");
let chosenMode = "campaign";
(function initModes(){
  const modes = { campaign:"Классика Матвея: семь дней от ясного утра к большому шторму, с финалом смены.", survival:"Бесконечные дни: погода и задания генерируются каждый день, смена кончается только без топлива." };
  document.querySelectorAll("#mode-chips .chip").forEach(c => c.onclick = () => {
    document.querySelectorAll("#mode-chips .chip").forEach(x => x.classList.remove("sel"));
    c.classList.add("sel");
    chosenMode = c.dataset.m;
    $("#mode-desc").textContent = modes[chosenMode];
  });
  $("#mode-desc").textContent = modes.campaign;
})();
$("#btn-diff-back").onclick = () => show("#scr-title");
$("#btn-diff-start").onclick = async () => {
  const name = $("#inp-name").value.trim() || "Стажёр";
  S = { name, diff: chosenDiff, mode: chosenMode, day:0, trust:50, history:[], cur:null, coins:40, fuel:60, instruments:{ pressure:100, clouds:100, wind:100, humidity:100 }, usedTasks:[], streak:0 };
  localStorage.removeItem("lighthouse_v2_tut"); // обучение ждёт при каждой новой игре
  S.playerId = await createPlayerOnline(name); // ID игрока в базе по нику (если база доступна)
  if (S.playerId) { try { localStorage.setItem("lighthouse_player", JSON.stringify({ id:S.playerId, name })); } catch(e){} }
  save();
  show("#scr-intro");
};
$("#desk-barometer").onclick = () => measure("pressure", $("#desk-barometer"));
$("#desk-wind").onclick = () => measure("wind", $("#desk-wind"));
$("#desk-hygro").onclick = () => measure("humidity", $("#desk-hygro"));
const wf2 = $("#stage .window-frame"); if (wf2) wf2.onclick = () => measure("clouds", $("#stage .window-view"));
$("#desk-computer").onclick = () => $("#pc-overlay").classList.add("open");
$("#btn-pc-close").onclick = () => $("#pc-overlay").classList.remove("open");
$("#desk-radio").onclick = () => { $("#pc-overlay").classList.add("open"); toast("Рация передала все обращения в компьютер — задания ждут на мониторе"); };
$("#desk-bottle").onclick = () => toast("Талисман Матвея: кораблик в бутылке. «Пока он цел — и лодки целы»");
$("#wall-photo").onclick = () => toast("Старое фото: маяк в 1987 году. Матвей тогда только заступил на смену");
$("#wall-map").onclick = () => toast("Карта бухты: пунктир — путь на остров Гулкий, туда летает дрон «Чайка»");
$("#desk-compass").onclick = () => toast("Компас Матвея: север — там, где Гулкий. Стрелка никогда не врёт, в отличие от гигрометра");
$("#desk-keys").onclick = () => toast("Ключи от маяка: большой — от двери, малый — от приборного ящика. Не потерять");
$("#desk-blank").onclick = () => $("#obs-overlay").classList.add("open");
$("#btn-obs-close").onclick = () => $("#obs-overlay").classList.remove("open");
$("#btn-obs-done").onclick = () => $("#obs-overlay").classList.remove("open");
document.addEventListener("keydown", e => { if (e.key === "Escape"){ $("#pc-overlay").classList.remove("open"); $("#obs-overlay").classList.remove("open"); } });
$("#btn-intro-go").onclick = () => beginDay();
$("#btn-submit").onclick = submitForecast;
$("#sl-rain").oninput = updateSliders;
$("#sl-wind").oninput = updateSliders;
$("#desk-book").onclick = () => $("#notebook").classList.toggle("open");
$("#nb-close").onclick = () => $("#notebook").classList.remove("open");
$("#btn-next").onclick = () => {
  if (!S || S._moving) return;
  if (S.mode !== "survival" && S.day >= DAYS.length - 1) { endGame(); return; }
  $("#resolve-overlay").style.display = "none";
  openInvoice();
};
document.querySelectorAll("[data-fuelbuy]").forEach(b => b.onclick = () => {
  ensureEconomy();
  const want = b.dataset.fuelbuy === "max" ? FUEL_MAX : parseInt(b.dataset.fuelbuy, 10);
  const amount = Math.min(want, Math.floor(FUEL_MAX - (S.fuel || 0)), Math.floor(S.coins || 0));
  if (amount <= 0){ toast((S.fuel >= FUEL_MAX) ? "Бак уже полный" : "Не хватает коинов на топливо"); return; }
  S.coins -= amount; S.fuel = (S.fuel || 0) + amount;
  save(); updateResUI(); renderInvoice();
  if ((S.fuel || 0) >= FUEL_MAX) unlockAch("fulltank");
  toast("Заправлено +" + amount + " топлива");
});
$("#btn-invoice-next").onclick = () => {
  if (!S || S._moving) return;
  S._moving = true;
  try {
    $("#invoice-overlay").style.display = "none";
    closeFloaters();
    S.day++;
    if (S.mode !== "survival" && S.day >= DAYS.length) { endGame(); return; }
    save();
    beginDay();
  } catch(err) {
    console.error("Не удалось начать следующий день:", err);
    toast("Не удалось начать следующий день — попробуйте ещё раз");
  } finally {
    S._moving = false;
  }
};
$("#btn-menu-exit").onclick = () => {
  if (S) save();
  closeFloaters();
  const po = $("#pc-overlay"); if (po) po.classList.remove("open");
  const oo = $("#obs-overlay"); if (oo) oo.classList.remove("open");
  const ro = $("#resolve-overlay"); if (ro) ro.style.display = "none";
  const io = $("#invoice-overlay"); if (io) io.style.display = "none";
  const sv = loadSave();
  const b = $("#btn-continue");
  if (sv && typeof sv.day === "number"){
    b.style.display = "inline-block";
    b.onclick = () => {
      S = sv;
      if (S.mode !== "survival" && S.day >= DAYS.length) endGame();
      else beginDay();
    };
  }
  refreshRecords();
  show("#scr-title");
};
$("#btn-restart").onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
$("#btn-share").onclick = async () => {
  if (!S || !S.shareCode) return;
  try { await navigator.clipboard.writeText(S.shareCode); $("#btn-share").textContent = "Скопировано!"; }
  catch(e){ prompt("Ваш код результата:", S.shareCode); }
  setTimeout(() => $("#btn-share").textContent = "[CPY] Скопировать код результата", 2000);
};

// импорт рекорда по коду
document.addEventListener("click", e => {
  if (e.target && e.target.id === "btn-import"){
    const raw = ($("#import-code") ? $("#import-code").value : "").trim();
    if (!raw) return;
    try {
      const rec = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (typeof rec.trust !== "number") throw 0;
      let recs = getRecords().filter(r => !(r.name === rec.name && r.trust === rec.trust));
      recs.push(rec); recs.sort((a,b) => b.trust - a.trust || (b.avg||0) - (a.avg||0));
      setRecords(recs);
      refreshRecords();
    } catch(err) { alert("Код не распознан. Проверьте, что вставлен полностью."); }
  }
});

function refreshRecords(){
  renderAchievements();
  const slot = $("#records-slot");
  if (slot) slot.innerHTML = recordsHTML(null);
  const main = $("#records-main");
  if (main) main.innerHTML = recordsHTML(null);
  const re = $("#records-end");
  if (re && re.innerHTML) re.innerHTML = recordsHTML(null);
}
refreshRecords();

// продолжение
const savedGame = loadSave();
if (savedGame && typeof savedGame.day === "number"){
  const b = $("#btn-continue");
  b.style.display = "inline-block";
  b.onclick = () => {
    S = savedGame;
    if (S.mode !== "survival" && S.day >= DAYS.length) endGame();
    else beginDay();
  };
}