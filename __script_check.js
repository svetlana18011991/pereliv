(function(){const config=${safeConfig};const frame=document.getElementById('game'),loading=document.getElementById('loading');let finished=false,timer=0;function send(){if(finished)return;try{frame.contentWindow&&frame.contentWindow.postMessage({type:'PERELIV_CONFIG',config:config},'*')}catch(e){}}function ready(){if(finished)return;finished=true;clearInterval(timer);loading.style.display='none';document.documentElement.style.background='transparent';document.body.style.background='transparent';frame.style.opacity='1'}window.addEventListener('message',function(e){if(e.source!==frame.contentWindow||!e.data)return;if(e.data.type==='PERELIV_READY'){send();setTimeout(send,80);setTimeout(send,220)}if(e.data.type==='PERELIV_RENDERED')ready()});frame.addEventListener('load',function(){send();setTimeout(send,100);setTimeout(send,300)});timer=setInterval(send,220);setTimeout(()=>{if(!finished){send()}},7000);frame.src=${JSON.stringify(GENIALLY_GAME_URL)}+'?embed=1&v=60';})();${scriptEnd}</body></html>`;
  return buildIframeCode(loader,config)
}
function b64url(bytes){let s='';const step=0x8000;for(let i=0;i<bytes.length;i+=step)s+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function encodeConfig(config){const bytes=new TextEncoder().encode(JSON.stringify(config));if('CompressionStream'in window){const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));const gz=new Uint8Array(await new Response(stream).arrayBuffer());return'g.'+b64url(gz)}return'j.'+b64url(bytes)}
function notify(msg){$('saveStatus').textContent=msg;setTimeout(()=>$('saveStatus').textContent='Все изменения сохранены',1800)}
const LANGUAGE_NAMES={ru:'Русский',en:'English',fr:'Français',de:'Deutsch',zh:'中文',ko:'한국어'};
const DEFAULT_TITLES={ru:'Переливашки',en:'Water Sort',fr:'Tri des liquides',de:'Flüssigkeitssortierung',zh:'彩色液体分类',ko:'물약 정렬'};
const TRANSLATE_LANG={ru:'ru',en:'en',fr:'fr',de:'de',zh:'zh-CN',ko:'ko'};
const TRANSLATION_CACHE_KEY='pereliv_translation_cache_v3';
let translationCache={};
try{translationCache=JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY)||'{}')||{}}catch{translationCache={}}
function saveTranslationCache(){try{const keys=Object.keys(translationCache);if(keys.length>1200){for(const k of keys.slice(0,keys.length-900))delete translationCache[k]}localStorage.setItem(TRANSLATION_CACHE_KEY,JSON.stringify(translationCache))}catch{}}
function questionTextSnapshot(q){return{question:q.question||'',answers:[...(q.answers||[])],accepts:[...(q.accepts||[])],explanation:q.explanation||'',orderItems:[...(q.orderItems||[])],freeAnswer:q.freeAnswer||'',sortCategories:[...(q.sortCategories||[])],sortItems:(q.sortItems||[]).map(x=>({text:x.text||'',category:Number(x.category)||0})),matchPairs:(q.matchPairs||[]).map(x=>({left:x.left||'',right:x.right||''}))}}
function applyQuestionTextSnapshot(q,v){if(!v)return;q.question=v.question||'';q.answers=[...(v.answers||[])];q.accepts=[...(v.accepts||[])];q.explanation=v.explanation||'';q.orderItems=[...(v.orderItems||[])];q.freeAnswer=v.freeAnswer||'';q.sortCategories=[...(v.sortCategories||['',''])];q.sortItems=(v.sortItems||[]).map(x=>({text:x.text||'',category:Number(x.category)||0}));q.matchPairs=(v.matchPairs||[]).map(x=>({left:x.left||'',right:x.right||''}))}
function protectMath(text){const parts=[];let s=String(text||'');s=s.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g,m=>{const k=`__MATH_${parts.length}__`;parts.push(m);return k});return{s,parts}}
function restoreMath(out,parts){let text=String(out||'');parts.forEach((m,i)=>{text=text.replace(new RegExp(`__\\s*MATH[_\\s-]*${i}\\s*__`,'gi'),m)});return text}
function translationKey(text,from,to){return `${from}>${to}|${text}`}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchWithTimeout(url,opts={},timeout=9000){const c=new AbortController(),id=setTimeout(()=>c.abort(),timeout);try{return await fetch(url,{...opts,signal:c.signal})}finally{clearTimeout(id)}}
function hasCyrillic(text){return /[А-Яа-яЁё]/.test(String(text||''))}
function hasHan(text){return /[\u3400-\u9fff]/.test(String(text||''))}
function hasHangul(text){return /[\uac00-\ud7af]/.test(String(text||''))}
function hasLetters(text){try{return /\p{L}/u.test(String(text||''))}catch{return /[A-Za-zА-Яа-яЁё]/.test(String(text||''))}}
function isMathOnly(text){let x=String(text||'').replace(/__MATH_\d+__/g,'').trim();if(!x)return true;return !hasCyrillic(x)&&!/\b(?:the|a|an|is|are|find|solve|answer|true|false|yes|no|der|die|das|ist|trouve|résous|résolvez|vrai|faux)\b/i.test(x)&&/^[\s\d.,:;=+\-*/^()\[\]{}<>%°×÷√∞πxyabcmnptqrz_\\|]+$/i.test(x)}
function validTranslation(out,input,from,to){out=String(out||'').trim();input=String(input||'').trim();if(!out)return false;if(isMathOnly(input))return true;if(out===input){if(!hasLetters(input))return true;return false}if(from==='ru'&&['fr','en','de'].includes(to)&&hasCyrillic(out))return false;if(to==='zh'&&hasCyrillic(input)&&hasCyrillic(out)&&!hasHan(out))return false;if(to==='ko'&&hasCyrillic(input)&&hasCyrillic(out)&&!hasHangul(out))return false;return true}
async function translateViaNative(text,from,to){try{if(typeof Translator==='undefined'||!Translator?.create)return'';const sourceLanguage=TRANSLATE_LANG[from]||from,targetLanguage=TRANSLATE_LANG[to]||to;let availability='available';if(Translator.availability)availability=await Translator.availability({sourceLanguage,targetLanguage});if(availability==='unavailable')return'';const tr=await Translator.create({sourceLanguage,targetLanguage});const out=await tr.translate(text);try{tr.destroy?.()}catch{}return String(out||'').trim()}catch{return''}}
const LINGVA_INSTANCES=['https://lingva.ml','https://translate.dr460nf1r3.org','https://lingva.garudalinux.org','https://translate.jae.fi'];
function lingvaCode(lang){return lang==='zh'?'zh':(TRANSLATE_LANG[lang]||lang).toLowerCase().replace('-cn','')}
async function translateViaLingva(text,from,to){const src=lingvaCode(from),dst=lingvaCode(to);for(const base of LINGVA_INSTANCES){try{const url=`${base}/api/v1/${encodeURIComponent(src)}/${encodeURIComponent(dst)}/${encodeURIComponent(text)}`;const r=await fetchWithTimeout(url,{cache:'no-store',mode:'cors'},7500);if(!r.ok)continue;const data=await r.json();const out=String(data?.translation||'').trim();if(validTranslation(out,text,from,to))return out}catch{}}return''}
function googleTargetUrl(text,from,to){return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(TRANSLATE_LANG[from]||from)}&tl=${encodeURIComponent(TRANSLATE_LANG[to]||to)}&dt=t&q=${encodeURIComponent(text)}`}
function parseGooglePayload(data){return(data?.[0]||[]).map(x=>x?.[0]||'').join('').trim()}
async function translateViaGoogle(text,from,to){const r=await fetchWithTimeout(googleTargetUrl(text,from,to),{cache:'no-store',mode:'cors'},7500);if(!r.ok)throw new Error(`google ${r.status}`);return parseGooglePayload(await r.json())}
async function translateViaGoogleProxy(text,from,to){const target=googleTargetUrl(text,from,to);const urls=[`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`];for(const url of urls){try{const r=await fetchWithTimeout(url,{cache:'no-store',mode:'cors'},9000);if(!r.ok)continue;const raw=await r.text();const data=JSON.parse(raw);const out=parseGooglePayload(data);if(validTranslation(out,text,from,to))return out}catch{}}return''}
async function translateViaMyMemory(text,from,to){const src=TRANSLATE_LANG[from]||from,dst=TRANSLATE_LANG[to]||to;const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(src+'|'+dst)}&mt=1`;const r=await fetchWithTimeout(url,{cache:'no-store',mode:'cors'},5000);if(!r.ok)throw new Error(`mymemory ${r.status}`);const data=await r.json();const out=String(data?.responseData?.translatedText||'').trim();if(!out||/MYMEMORY WARNING/i.test(out))throw new Error('mymemory empty');return out}
const OFFLINE_EXACT={
 en:new Map(Object.entries({
  'Переливашки':'Water Sort','Осенний эликсир':'Autumn Elixir','Лунный кристалл':'Moon Crystal','Тайна волшебной оранжереи':'The Secret of the Magic Greenhouse',
  'Решите уравнение':'Solve the equation','Вычислите':'Calculate','Найдите':'Find','Найдите значение выражения':'Find the value of the expression','Упростите выражение':'Simplify the expression','Выберите правильный ответ':'Choose the correct answer','Верно ли утверждение?':'Is the statement true?','Верно':'True','Неверно':'False','Да':'Yes','Нет':'No','Нет решений':'No solutions','Бесконечно много решений':'Infinitely many solutions','Все числа':'All numbers','Найдите пару':'Find the pair','Сопоставьте пары':'Match the pairs','Расположите в правильном порядке':'Put in the correct order','Введите ответ':'Enter the answer'
 })),
 fr:new Map(Object.entries({
  'Переливашки':'Tri des liquides','Осенний эликсир':'Élixir d’automne','Лунный кристалл':'Cristal lunaire','Тайна волшебной оранжереи':'Le secret de la serre magique',
  'Решите уравнение':'Résolvez l’équation','Вычислите':'Calculez','Найдите':'Trouvez','Найдите значение выражения':'Calculez la valeur de l’expression','Упростите выражение':'Simplifiez l’expression','Выберите правильный ответ':'Choisissez la bonne réponse','Верно ли утверждение?':'Cette affirmation est-elle vraie ?','Верно':'Vrai','Неверно':'Faux','Да':'Oui','Нет':'Non','Нет решений':'Aucune solution','Бесконечно много решений':'Une infinité de solutions','Все числа':'Tous les nombres','Найдите пару':'Trouvez la paire','Сопоставьте пары':'Associez les paires','Расположите в правильном порядке':'Placez dans le bon ordre','Введите ответ':'Saisissez la réponse'
 })),
 de:new Map(Object.entries({
  'Переливашки':'Flüssigkeitssortierung','Осенний эликсир':'Herbstelixier','Лунный кристалл':'Mondkristall','Тайна волшебной оранжереи':'Das Geheimnis des Zaubergewächshauses',
  'Решите уравнение':'Löse die Gleichung','Вычислите':'Berechne','Найдите':'Finde','Найдите значение выражения':'Bestimme den Wert des Ausdrucks','Упростите выражение':'Vereinfache den Ausdruck','Выберите правильный ответ':'Wähle die richtige Antwort','Верно ли утверждение?':'Ist die Aussage richtig?','Верно':'Richtig','Неверно':'Falsch','Да':'Ja','Нет':'Nein','Нет решений':'Keine Lösung','Бесконечно много решений':'Unendlich viele Lösungen','Все числа':'Alle Zahlen','Найдите пару':'Finde das Paar','Сопоставьте пары':'Ordne die Paare zu','Расположите в правильном порядке':'Bringe in die richtige Reihenfolge','Введите ответ':'Gib die Antwort ein'
 })),
 zh:new Map(Object.entries({
  'Переливашки':'彩色液体分类','Осенний эликсир':'秋日魔药','Лунный кристалл':'月光水晶','Тайна волшебной оранжереи':'魔法温室的秘密',
  'Решите уравнение':'解方程','Вычислите':'计算','Найдите':'求','Найдите значение выражения':'求表达式的值','Упростите выражение':'化简表达式','Выберите правильный ответ':'选择正确答案','Верно ли утверждение?':'该说法正确吗？','Верно':'正确','Неверно':'错误','Да':'是','Нет':'否','Нет решений':'无解','Бесконечно много решений':'无穷多解','Все числа':'所有数','Найдите пару':'找出配对','Сопоставьте пары':'匹配配对','Расположите в правильном порядке':'按正确顺序排列','Введите ответ':'输入答案'
 })),
 ko:new Map(Object.entries({
  'Переливашки':'물약 정렬','Осенний эликсир':'가을의 엘릭서','Лунный кристалл':'달빛 수정','Тайна волшебной оранжереи':'마법 온실의 비밀',
  'Решите уравнение':'방정식을 푸세요','Вычислите':'계산하세요','Найдите':'구하세요','Найдите значение выражения':'식의 값을 구하세요','Упростите выражение':'식을 간단히 하세요','Выберите правильный ответ':'정답을 고르세요','Верно ли утверждение?':'이 문장이 맞습니까?','Верно':'맞음','Неверно':'틀림','Да':'예','Нет':'아니요','Нет решений':'해가 없음','Бесконечно много решений':'해가 무한히 많음','Все числа':'모든 수','Найдите пару':'짝을 찾으세요','Сопоставьте пары':'짝을 맞추세요','Расположите в правильном порядке':'올바른 순서로 배열하세요','Введите ответ':'답을 입력하세요'
 }))
};
const OFFLINE_PREFIX={
 en:[['Решите уравнение:','Solve the equation:'],['Решите уравнение','Solve the equation'],['Вычислите:','Calculate:'],['Вычислите','Calculate'],['Найдите значение выражения:','Find the value of the expression:'],['Найдите значение выражения','Find the value of the expression'],['Упростите выражение:','Simplify the expression:'],['Упростите выражение','Simplify the expression'],['Найдите:','Find:'],['Найдите','Find'],['Выберите правильный ответ:','Choose the correct answer:'],['Выберите правильный ответ','Choose the correct answer'],['Введите ответ:','Enter the answer:'],['Введите ответ','Enter the answer']],
 fr:[['Решите уравнение:','Résolvez l’équation :'],['Решите уравнение','Résolvez l’équation'],['Вычислите:','Calculez :'],['Вычислите','Calculez'],['Найдите значение выражения:','Calculez la valeur de l’expression :'],['Найдите значение выражения','Calculez la valeur de l’expression'],['Упростите выражение:','Simplifiez l’expression :'],['Упростите выражение','Simplifiez l’expression'],['Найдите:','Trouvez :'],['Найдите','Trouvez'],['Выберите правильный ответ:','Choisissez la bonne réponse :'],['Выберите правильный ответ','Choisissez la bonne réponse'],['Введите ответ:','Saisissez la réponse :'],['Введите ответ','Saisissez la réponse']],
 de:[['Решите уравнение:','Löse die Gleichung:'],['Решите уравнение','Löse die Gleichung'],['Вычислите:','Berechne:'],['Вычислите','Berechne'],['Найдите значение выражения:','Bestimme den Wert des Ausdrucks:'],['Найдите значение выражения','Bestimme den Wert des Ausdrucks'],['Упростите выражение:','Vereinfache den Ausdruck:'],['Упростите выражение','Vereinfache den Ausdruck'],['Найдите:','Finde:'],['Найдите','Finde'],['Выберите правильный ответ:','Wähle die richtige Antwort:'],['Выберите правильный ответ','Wähle die richtige Antwort'],['Введите ответ:','Gib die Antwort ein:'],['Введите ответ','Gib die Antwort ein']],
 zh:[['Решите уравнение:','解方程：'],['Решите уравнение','解方程'],['Вычислите:','计算：'],['Вычислите','计算'],['Найдите значение выражения:','求表达式的值：'],['Найдите значение выражения','求表达式的值'],['Упростите выражение:','化简表达式：'],['Упростите выражение','化简表达式'],['Найдите:','求：'],['Найдите','求'],['Выберите правильный ответ:','选择正确答案：'],['Выберите правильный ответ','选择正确答案'],['Введите ответ:','输入答案：'],['Введите ответ','输入答案']],
 ko:[['Решите уравнение:','방정식을 푸세요:'],['Решите уравнение','방정식을 푸세요'],['Вычислите:','계산하세요:'],['Вычислите','계산하세요'],['Найдите значение выражения:','식의 값을 구하세요:'],['Найдите значение выражения','식의 값을 구하세요'],['Упростите выражение:','식을 간단히 하세요:'],['Упростите выражение','식을 간단히 하세요'],['Найдите:','구하세요:'],['Найдите','구하세요'],['Выберите правильный ответ:','정답을 고르세요:'],['Выберите правильный ответ','정답을 고르세요'],['Введите ответ:','답을 입력하세요:'],['Введите ответ','답을 입력하세요']]
};
function offlineTranslateFallback(text,from,to){text=String(text||'');if(from!=='ru'||!OFFLINE_EXACT[to])return'';const trimmed=text.trim();const exact=OFFLINE_EXACT[to];if(exact.has(trimmed))return exact.get(trimmed);for(const [a,b] of OFFLINE_PREFIX[to]||[]){if(trimmed.startsWith(a)){const rest=trimmed.slice(a.length).trimStart();return rest?`${b} ${rest}`:b}}return''}
async function translateOne(text,from,to){text=String(text||'');if(!text.trim()||from===to||isMathOnly(text))return text;const key=translationKey(text,from,to);const cached=translationCache[key];if(cached&&validTranslation(cached,text,from,to))return cached;const local=offlineTranslateFallback(text,from,to);if(local&&validTranslation(local,text,from,to)){translationCache[key]=local;saveTranslationCache();return local}const p=protectMath(text);let out='';out=await translateViaNative(p.s,from,to);if(!validTranslation(out,p.s,from,to))out='';if(!out){try{const m=await translateViaMyMemory(p.s,from,to);if(validTranslation(m,p.s,from,to))out=m}catch{}}if(!out){try{const g=await translateViaGoogle(p.s,from,to);if(validTranslation(g,p.s,from,to))out=g}catch{}}if(!out)out=await translateViaGoogleProxy(p.s,from,to);if(!out)out=await translateViaLingva(p.s,from,to);if(!out)throw new Error('translation unavailable');out=restoreMath(out,p.parts)||text;if(!validTranslation(out,text,from,to)&&!isMathOnly(text))throw new Error('translation invalid');translationCache[key]=out;saveTranslationCache();await wait(25);return out}
function flatSnapshotText(v){if(!v)return[];return[String(v.question||''),...(v.answers||[]),...(v.accepts||[]),String(v.explanation||''),...(v.orderItems||[]),String(v.freeAnswer||''),...(v.sortCategories||[]),...(v.sortItems||[]).map(x=>x.text||''),...(v.matchPairs||[]).flatMap(x=>[x.left||'',x.right||''])].map(x=>String(x).trim())}
function snapshotsEquivalent(a,b){const aa=flatSnapshotText(a),bb=flatSnapshotText(b);return aa.length===bb.length&&aa.every((x,i)=>x===bb[i])}
function snapshotLooksRussian(v){return flatSnapshotText(v).some(x=>hasCyrillic(x))}
function snapshotNeedsTarget(v,targetLang,source){if(!v)return true;if(targetLang==='ru')return false;if(source&&snapshotsEquivalent(v,source))return true;const texts=flatSnapshotText(v).filter(Boolean);if(['fr','en','de'].includes(targetLang)&&texts.some(x=>hasCyrillic(x)))return true;if(targetLang==='zh'&&texts.some(x=>hasCyrillic(x))&&!texts.some(x=>hasHan(x)))return true;if(targetLang==='ko'&&texts.some(x=>hasCyrillic(x))&&!texts.some(x=>hasHangul(x)))return true;return false}
async function translateSnapshot(v,from,to,onProgress){const clone=structuredClone(v),refs=[];const add=(obj,key)=>{if(obj&&typeof obj[key]==='string'&&obj[key].trim())refs.push([obj,key])};add(clone,'question');add(clone,'explanation');add(clone,'freeAnswer');for(let i=0;i<clone.answers.length;i++)add(clone.answers,i);for(let i=0;i<clone.accepts.length;i++)add(clone.accepts,i);for(let i=0;i<clone.orderItems.length;i++)add(clone.orderItems,i);for(let i=0;i<clone.sortCategories.length;i++)add(clone.sortCategories,i);for(const x of clone.sortItems)add(x,'text');for(const x of clone.matchPairs){add(x,'left');add(x,'right')}let done=0,failed=0;for(const [obj,key] of refs){const original=obj[key];try{obj[key]=await translateOne(original,from,to)}catch{obj[key]=original;failed++}done++;onProgress?.(done,refs.length,failed)}return{snapshot:clone,failed}}
function bestSourceForQuestion(q,old){q.i18n=q.i18n||{};if(q.i18n.ru)return{lang:'ru',snap:q.i18n.ru};const active=questionTextSnapshot(q);if(snapshotLooksRussian(active))return{lang:'ru',snap:active};if(q.i18n[old])return{lang:old,snap:q.i18n[old]};const first=Object.keys(q.i18n).find(k=>q.i18n[k]);if(first)return{lang:first,snap:q.i18n[first]};return{lang:old,snap:active}}
function titleNeedsTarget(text,targetLang,source){text=String(text||'').trim();if(!text)return true;if(targetLang==='ru')return false;if(source&&text===String(source).trim())return true;if(['fr','en','de'].includes(targetLang)&&hasCyrillic(text))return true;if(targetLang==='zh'&&hasCyrillic(text)&&!hasHan(text))return true;if(targetLang==='ko'&&hasCyrillic(text)&&!hasHangul(text))return true;return false}
function captureCurrentLanguageState(old){Editor.config.titleI18n=Editor.config.titleI18n||{};const currentTitle=$('titleInput').value.trim()||Editor.config.title||DEFAULT_TITLES[old]||DEFAULT_TITLES.ru;if(old!=='ru'&&hasCyrillic(currentTitle))Editor.config.titleI18n.ru=currentTitle;else Editor.config.titleI18n[old]=currentTitle;for(const q of Editor.config.tasks){q.i18n=q.i18n||{};const snap=questionTextSnapshot(q);if(old!=='ru'&&snapshotLooksRussian(snap))q.i18n.ru=snap;else q.i18n[old]=snap}}
function activeLanguageNeedsRepair(lang){if(lang==='ru')return false;const ruTitle=Editor.config.titleI18n?.ru||'';if(titleNeedsTarget($('titleInput')?.value||Editor.config.title,lang,ruTitle))return true;for(const q of Editor.config.tasks){const src=q.i18n?.ru||null;if(snapshotNeedsTarget(questionTextSnapshot(q),lang,src))return true;if(!q.i18n?.[lang]&&src)return true}return false}
let languageChangeSeq=0;
async function changeGameLanguage(lang,{force=false,auto=false}={}){lang=['ru','en','fr','de','zh','ko'].includes(lang)?lang:'ru';const seq=++languageChangeSeq;const old=Editor.config.language||'ru';const select=$('language'),retry=$('retranslateLanguage'),hint=$('translationHint');if(select)select.value=lang;captureCurrentLanguageState(old);Editor.config.language=lang;if(retry)retry.disabled=true;if(hint){hint.textContent=lang==='ru'?'Русский язык выбран.':'Перевожу название и задания на '+LANGUAGE_NAMES[lang]+'…';hint.style.color='#9feaff'}let failedTotal=0;try{if(!auto)editorToast(`Перевожу на ${LANGUAGE_NAMES[lang]}…`);if(lang==='ru'){
    const ruTitle=Editor.config.titleI18n?.ru||DEFAULT_TITLES.ru;if(seq!==languageChangeSeq)return;Editor.config.title=ruTitle;$('titleInput').value=ruTitle;for(const q of Editor.config.tasks){if(seq!==languageChangeSeq)return;if(q.i18n?.ru)applyQuestionTextSnapshot(q,q.i18n.ru)}
  }else{
    let titleSourceLang='ru',titleSource=Editor.config.titleI18n?.ru||'';if(!titleSource){titleSourceLang=old;titleSource=Editor.config.titleI18n?.[old]||Editor.config.title||DEFAULT_TITLES[old]||DEFAULT_TITLES.ru}
    let newTitle=Editor.config.titleI18n?.[lang]||'';if(force||titleNeedsTarget(newTitle,lang,titleSource)){
      try{newTitle=Object.values(DEFAULT_TITLES).includes(titleSource)?DEFAULT_TITLES[lang]:await translateOne(titleSource,titleSourceLang,lang)}catch{newTitle=offlineTranslateFallback(titleSource,titleSourceLang,lang)||newTitle||titleSource;failedTotal++}
      Editor.config.titleI18n[lang]=newTitle
    }
    if(seq!==languageChangeSeq)return;Editor.config.title=newTitle||titleSource;$('titleInput').value=Editor.config.title;
    let qi=0;for(const q of Editor.config.tasks){if(seq!==languageChangeSeq)return;qi++;const src=bestSourceForQuestion(q,old);let target=q.i18n?.[lang];if(force||snapshotNeedsTarget(target,lang,src.snap)){
        if(!auto)editorToast(`Перевожу на ${LANGUAGE_NAMES[lang]}… ${qi}/${Editor.config.tasks.length}`);const r=await translateSnapshot(src.snap,src.lang,lang);target=r.snapshot;failedTotal+=r.failed;q.i18n[lang]=target
      }
      if(seq!==languageChangeSeq)return;if(target)applyQuestionTextSnapshot(q,target)
    }
  }
  if(seq!==languageChangeSeq)return;saveLocal();renderList();updatePreview(false);if(hint){hint.textContent=failedTotal?`${LANGUAGE_NAMES[lang]} выбран. Не переведено фрагментов: ${failedTotal}. Можно нажать «Перевести тексты заново».`:`✓ ${LANGUAGE_NAMES[lang]}: название и задания переведены`;hint.style.color=failedTotal?'#ffd48a':'#9ff0b9'}if(failedTotal){editorToast(`Язык применён. Не удалось перевести фрагментов: ${failedTotal}. Нажми «Перевести тексты заново».`)}else if(!auto)editorToast(`✓ Переведено: ${LANGUAGE_NAMES[lang]}`)
 }catch(err){console.error(err);if(seq!==languageChangeSeq)return;saveLocal();renderList();updatePreview(false);editorToast('Язык применён, но часть текста не переведена. Нажми «Перевести тексты заново».')}finally{if(seq===languageChangeSeq&&retry)retry.disabled=false}}
async function repairActiveLanguageIfNeeded(){const lang=Editor.config.language||'ru';if(lang==='ru'||!activeLanguageNeedsRepair(lang))return;await changeGameLanguage(lang,{force:true,auto:true})}

['titleInput','emptyTubes','capacity','questionOrder','backgroundMode','targetColor','tubeStyle','targetStyle','liquidStyle','lockStyle','difficulty','magicShimmerStyle','questionCardColor','questionCardBorderColor','questionCardNeon','answerButtonColor','answerButtonTextColor','answerButtonBorderColor','answerButtonNeon','answerButtonFontSize'].forEach(id=>$(id)?.addEventListener('change',saveLocal));$('language').addEventListener('change',e=>changeGameLanguage(e.target.value,{force:true}));$('retranslateLanguage')?.addEventListener('click',()=>changeGameLanguage($('language').value,{force:true}));$('magicShimmer').addEventListener('change',()=>{$('magicShimmerStyle').disabled=!$('magicShimmer').checked;saveLocal()});$('pourSound').addEventListener('change',()=>{refreshCustomSoundControls();saveLocal()});$('targetPourSound').addEventListener('change',()=>{refreshCustomSoundControls();saveLocal()});$('previewPourSound').onclick=()=>playEditorWaterSound('tube',$('pourSound').value);$('previewTargetPourSound').onclick=()=>playEditorWaterSound('target',$('targetPourSound').value);$('colorCount').addEventListener('change',()=>{renderTargetColorOptions();saveLocal()});$('titleInput').addEventListener('input',()=>{clearTimeout(Editor.titleTimer);Editor.titleTimer=setTimeout(saveLocal,300)});
applyEditorTheme(document.documentElement.dataset.editorTheme==='dark'?'dark':'peach',false);
$('editorThemeToggle').onclick=()=>applyEditorTheme(document.documentElement.dataset.editorTheme==='dark'?'peach':'dark');
$('openWelcome')?.addEventListener('click',openWelcome);$('closeWelcomeTop')?.addEventListener('click',closeWelcome);$('welcomeLater')?.addEventListener('click',closeWelcome);$('welcomeStart')?.addEventListener('click',closeWelcome);$('welcomeSkip')?.addEventListener('change',saveWelcomeSkip);
$('aiPromptText').value=AI_PROMPT_TEXT;
$('openAiPrompt').onclick=()=>{$('aiPromptText').value=AI_PROMPT_TEXT;$('aiPromptModal').classList.add('show')};
$('closeAiPrompt').onclick=()=>$('aiPromptModal').classList.remove('show');
$('copyAiPrompt').onclick=async()=>{const ok=await copyText($('aiPromptText').value);editorToast(ok?'Промпт скопирован':'Не удалось скопировать промпт');if(ok){const b=$('copyAiPrompt'),old=b.textContent;b.textContent='✓ Промпт скопирован';clearTimeout(b._copyTimer);b._copyTimer=setTimeout(()=>b.textContent=old,1800)}};
$('aiPromptToImport').onclick=()=>{$('aiPromptModal').classList.remove('show');$('importModal').classList.add('show');setTimeout(()=>$('importText')?.focus(),60)};
let contextHelperTimer=null;
function hideContextHelper(){const h=$('contextHelper');if(h)h.classList.remove('show');clearTimeout(contextHelperTimer)}
function showContextHelper(){const h=$('contextHelper');if(!h)return;h.style.left='';h.style.top='';h.classList.remove('show');void h.offsetWidth;h.classList.add('show');clearTimeout(contextHelperTimer);contextHelperTimer=setTimeout(hideContextHelper,3400)}
function editorContextGuard(e){e.preventDefault();e.stopPropagation();showContextHelper()}
window.addEventListener('contextmenu',editorContextGuard,{capture:true});


function editorBlockedDevShortcut(e){const k=String(e.key||'').toLowerCase();return e.key==='F12'||(e.ctrlKey&&k==='u')||(e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(k))||(e.metaKey&&e.altKey&&['i','j','c'].includes(k))}
window.addEventListener('keydown',e=>{if(e.key==='Escape'){hideContextHelper();return}if(!editorBlockedDevShortcut(e))return;e.preventDefault();e.stopPropagation();showContextHelper()},{capture:true});
document.addEventListener('pointerdown',e=>{if(e.button!==2)hideContextHelper()});window.addEventListener('scroll',hideContextHelper,true);
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$('uploadBg').onclick=()=>$('bgFile').click();
$('bgFile').onchange=async e=>{try{Editor.config.backgroundImage=await optimizeImage(e.target.files[0],1100,700,.52,22);Editor.config.backgroundMode='image';if($('backgroundMode'))$('backgroundMode').value='image';refreshMedia();saveLocal()}catch(err){await showError(err.message||'Не удалось загрузить фон')}e.target.value=''};
$('clearBg').onclick=()=>{Editor.config.backgroundImage='';Editor.config.backgroundMode='transparent';if($('backgroundMode'))$('backgroundMode').value='transparent';refreshMedia();saveLocal()};
$('backgroundMode')?.addEventListener('change',()=>{Editor.config.backgroundMode=$('backgroundMode').value==='image'?'image':'transparent';refreshMedia();saveLocal()});
$('backgroundBlur')?.addEventListener('change',()=>{Editor.config.backgroundBlur=!!$('backgroundBlur').checked;Editor.config.backgroundBlurMode=Editor.config.backgroundBlur?'on':'off';refreshMedia();saveLocal()});
$('uploadCustomPour').onclick=()=>$('customPourFile').click();
$('uploadCustomTargetPour').onclick=()=>$('customTargetPourFile').click();
$('customPourFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{editorToast('Сжимаю звук…');Editor.config.customPourAudio=await optimizeEffectAudio(f,38,2.5);$('pourSound').value='custom';refreshCustomSoundControls();saveLocal();notify(`Свой звук готов · ${formatBytes(dataUrlPayloadBytes(Editor.config.customPourAudio))}`)}catch(err){await showError(err.message||'Не удалось загрузить звук')}finally{e.target.value=''}};
$('customTargetPourFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{editorToast('Сжимаю звук…');Editor.config.customTargetPourAudio=await optimizeEffectAudio(f,38,2.5);$('targetPourSound').value='custom';refreshCustomSoundControls();saveLocal();notify(`Свой звук готов · ${formatBytes(dataUrlPayloadBytes(Editor.config.customTargetPourAudio))}`)}catch(err){await showError(err.message||'Не удалось загрузить звук')}finally{e.target.value=''}};
$('clearCustomPour').onclick=()=>{Editor.config.customPourAudio='';if($('pourSound').value==='custom')$('pourSound').value='none';refreshCustomSoundControls();saveLocal()};
$('clearCustomTargetPour').onclick=()=>{Editor.config.customTargetPourAudio='';if($('targetPourSound').value==='custom')$('targetPourSound').value='none';refreshCustomSoundControls();saveLocal()};
$('addQuestion').onclick=()=>openQuestion();
$('closeModal').onclick=closeQuestion;
$('qType').onchange=()=>syncType();
$('addChoice').onclick=()=>{const rows=[...$('choiceList').children],vals=rows.map(r=>r.querySelector('input[type=text]')?.value||''),checked=rows.map((r,index)=>r.querySelector('input[type=radio],input[type=checkbox]')?.checked?index:-1).filter(index=>index>=0);vals.push('');const multi=$('qType').value==='multi';renderChoice(vals,multi?checked:(checked[0]??0),multi);queueDraftPreview()};
$('addAccept').onclick=()=>{const vals=[...$('acceptList').querySelectorAll('input')].map(x=>x.value);vals.push('');renderAccept(vals);queueDraftPreview()};
$('questionModal').addEventListener('input',e=>{rememberMathTarget(e.target);queueDraftPreview()});$('questionModal').addEventListener('change',e=>{rememberMathTarget(e.target);queueDraftPreview()});$('questionModal').addEventListener('focusin',e=>rememberMathTarget(e.target));
$('previewDraft').onclick=()=>{getDraftFromModal();updatePreview(true);setDraftPreviewHint('shown');editorToast('Черновик показан в превью')};
$('saveQuestion').onclick=()=>{const q=getDraftFromModal(),err=validateQuestion(q);if(err)return editorToast(err);if(Editor.editingId){const i=Editor.config.tasks.findIndex(x=>x.id===Editor.editingId);q.id=Editor.editingId;if(i>=0)Editor.config.tasks[i]=structuredClone(q);else Editor.config.tasks.push(structuredClone(q))}else Editor.config.tasks.push(structuredClone(q));q.i18n=q.i18n||{};q.i18n[Editor.config.language||'ru']=questionTextSnapshot(q);const qi=Editor.config.tasks.findIndex(x=>x.id===q.id);if(qi>=0)Editor.config.tasks[qi]=structuredClone(q);saveLocal();renderList();closeQuestion();editorToast('Вопрос сохранён, предпросмотр обновлён')};
$('uploadImage').onclick=()=>$('imageFile').click();$('uploadAudio').onclick=()=>$('audioFile').click();
$('imageFile').onchange=async e=>{try{Editor.draft.image=await optimizeImage(e.target.files[0],520,390,.50,8);$('imageStatus').textContent=mediaSizeLabel('Картинка',Editor.draft.image);queueDraftPreview()}catch(err){editorToast(err.message)}e.target.value=''};
$('audioFile').onchange=async e=>{try{Editor.draft.audio=await optimizeAudio(e.target.files[0],150);$('audioStatus').textContent=mediaSizeLabel('Аудио',Editor.draft.audio);queueDraftPreview()}catch(err){editorToast(err.message)}e.target.value=''};
$('clearImage').onclick=()=>{Editor.draft.image='';$('imageStatus').textContent='Нет картинки';queueDraftPreview()};$('clearAudio').onclick=()=>{Editor.draft.audio='';$('audioStatus').textContent='Нет аудио';queueDraftPreview()};
$('btnMathHelper').onclick=()=>{if(!$('useLatex').checked)return editorToast('Сначала включи LaTeX в разделе вопросов');rememberMathTarget(document.activeElement);setMathPanel(!$('mathHelperPanel').classList.contains('open'))};$('btnMathSideClose').onclick=()=>setMathPanel(false);document.querySelectorAll('#mathHelperPanel .math-chip').forEach(btn=>{btn.addEventListener('mousedown',e=>e.preventDefault());btn.onclick=()=>insertMathAtCursor(getMathTarget(),btn.getAttribute('data-math')||'')});
$('useLatex').addEventListener('change',()=>{Editor.config.useLatex=$('useLatex').checked;updateMathHelperAvailability();saveLocal();updatePreview($('questionModal').classList.contains('show'))});
$('applyQuestionSettingsAll').onclick=async()=>{if(!Editor.config.tasks.length)return;if(!await askConfirm('Применить тип вопроса, шрифт, размер, цвет текста и баллы выбранного образца ко всем вопросам?'))return;const settings=selectedQuestionTemplateSettings();Editor.config.tasks.forEach(q=>applyTemplateSettingsToQuestion(q,settings));saveLocal();renderList();updatePreview(false);editorToast('Настройки применены ко всем вопросам')};
$('clearQuestions').onclick=async()=>{if(await askConfirm('Удалить все вопросы?',{okText:'Удалить'})){Editor.config.tasks=[];saveLocal();renderList();updatePreview(false)}};
$('importQuestions').onclick=()=>$('importModal').classList.add('show');$('closeImport').onclick=()=>$('importModal').classList.remove('show');
const IMPORT_TYPE_ALIASES={
 choice:'choice',single:'choice','выбор':'choice','выбор ответа':'choice','один':'choice','один ответ':'choice','одиночный':'choice','одиночный выбор':'choice',
 multi:'multi',multiple:'multi','множественный':'multi','множественный выбор':'multi','несколько':'multi','несколько ответов':'multi','несколько правильных':'multi',
 boolean:'boolean',bool:'boolean','верно/неверно':'boolean','верно-неверно':'boolean','да/нет':'boolean','верно неверно':'boolean',
 text:'text',input:'text','ввод':'text','ввод ответа':'text','текст':'text','текстовый ответ':'text',
 order:'order','порядок':'order','порядок слов':'order','порядок элементов':'order',
 free:'free','свободный':'free','свободный ответ':'free',
 sort:'sort','сортировка':'sort',
 match:'match','пары':'match','пара':'match','найди пару':'match','найти пару':'match','соответствие':'match','соответствия':'match'
};
function importedType(value){const key=String(value||'').trim().replace(/^\[|\]$/g,'').toLowerCase().replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');return IMPORT_TYPE_ALIASES[key]||''}
function splitImportLine(line){const source=String(line||''),useTabs=!source.includes('|')&&source.includes('\t');if(useTabs)return source.split('\t').map(x=>x.trim());const out=[];let cur='';for(let i=0;i<source.length;i++){const ch=source[i];if(ch==='\\'&&source[i+1]==='|'){cur+='|';i++;continue}if(ch==='|'){out.push(cur.trim());cur='';continue}cur+=ch}out.push(cur.trim());return out}
function importedBoolean(value){const v=String(value||'').trim().toLowerCase();if(['true','1','yes','да','верно','истина','правда'].includes(v))return true;if(['false','0','no','нет','неверно','ложь'].includes(v))return false;return null}
function splitPairToken(value){const s=String(value||'').trim();for(const sep of ['::','=>','->','→','=']){const pos=s.indexOf(sep);if(pos>0){const left=s.slice(0,pos).trim(),right=s.slice(pos+sep.length).trim();if(left&&right)return{left,right}}}return null}
function splitImportList(value){return String(value||'').split(/[,;]+/).map(x=>x.trim()).filter(Boolean)}
function parseSortCategoryToken(value){const s=String(value||'').trim(),m=s.match(/^(.+?)\s*:\s*(.+)$/);if(!m)return null;const name=m[1].trim(),items=splitImportList(m[2]);return name&&items.length?{name,items}:null}
function extractImportMeta(fields){const meta={};const data=[];for(const field of fields){let m=String(field||'').match(/^@?(points|баллы)\s*=\s*(.+)$/i);if(m){const n=Number(m[2]);if(Number.isFinite(n))meta.points=Math.max(0,Math.min(1000,Math.round(n)));continue}m=String(field||'').match(/^@?(explanation|пояснение)\s*=\s*(.*)$/i);if(m){meta.explanation=m[2].trim();continue}data.push(field)}return{data,meta}}
function importedQuestionBase(template,type,question,meta={}){return{id:uid(),type,question,answers:[],correct:0,accepts:[],explanation:meta.explanation||'',image:'',audio:'',font:template.font,fontSize:template.fontSize,textColor:template.textColor,points:meta.points??template.points,booleanCorrect:true,orderItems:[],freeAnswer:'',sortCategories:['',''],sortItems:[],matchPairs:[],i18n:{}}}
function parseImportedJson(raw,template){let data;try{data=JSON.parse(raw)}catch{return null}const list=Array.isArray(data)?data:(Array.isArray(data?.tasks)?data.tasks:(Array.isArray(data?.questions)?data.questions:(Array.isArray(data?.config?.tasks)?data.config.tasks:null)));if(!list)return null;const questions=[],skipped=[];list.forEach((item,index)=>{try{if(!item||typeof item!=='object'){skipped.push(index+1);return}const merged=Object.assign({},item,{id:uid()});if(!Object.prototype.hasOwnProperty.call(item,'font'))merged.font=template.font;if(!Object.prototype.hasOwnProperty.call(item,'fontSize'))merged.fontSize=template.fontSize;if(!Object.prototype.hasOwnProperty.call(item,'textColor'))merged.textColor=template.textColor;if(!Object.prototype.hasOwnProperty.call(item,'points'))merged.points=template.points;const q=normalizeQuestion(merged),err=validateQuestion(q);if(err){skipped.push(index+1);return}questions.push(q)}catch{skipped.push(index+1)}});return{questions,skipped,total:list.length,format:'json'}}
function parseImportedQuestions(raw){
 const text=String(raw||'').trim(),template=selectedQuestionTemplateSettings();
 if(!text)return{questions:[],skipped:[],total:0,format:'lines'};
 if(text.startsWith('[')||text.startsWith('{')){const jsonResult=parseImportedJson(text,template);if(jsonResult)return jsonResult}
 const entries=String(raw||'').split(/\r?\n/).map((text,index)=>({text:text.trim(),line:index+1})).filter(x=>x.text),questions=[],skipped=[];
 entries.forEach(({text:line,line:lineNumber})=>{
  try{
   const parts=splitImportLine(line);let type=importedType(parts[0]),question='',payload=[];
   if(type){question=parts[1]||'';payload=parts.slice(2)}else{question=parts[0]||'';payload=parts.slice(1)}
   if(!question){skipped.push(lineNumber);return}
   const {data,meta}=extractImportMeta(payload);let q;
   if(!type){
    if(!data.length){skipped.push(lineNumber);return}
    const marked=data.map((value,index)=>String(value).startsWith('*')?index:-1).filter(index=>index>=0);
    if(data.length>=2){if(!marked.length){skipped.push(lineNumber);return}type=marked.length>1?'multi':'choice';q=importedQuestionBase(template,type,question,meta);q.answers=data.map(x=>String(x).replace(/^\*/,''));q.correct=type==='multi'?marked:marked[0]}
    else{type='text';q=importedQuestionBase(template,type,question,meta);q.accepts=String(data[0]||'').split('/').map(x=>x.trim()).filter(Boolean)}
   }else{
    q=importedQuestionBase(template,type,question,meta);
    if(type==='choice'||type==='multi'){
     const marked=data.map((value,index)=>String(value).startsWith('*')?index:-1).filter(index=>index>=0);q.answers=data.map(x=>String(x).replace(/^\*/,''));
     if(type==='choice'){if(marked.length!==1){skipped.push(lineNumber);return}q.correct=marked[0]}else{if(!marked.length){skipped.push(lineNumber);return}q.correct=marked}
    }else if(type==='boolean'){
     const value=importedBoolean(data[0]);if(value===null){skipped.push(lineNumber);return}q.booleanCorrect=value;
    }else if(type==='text'){
     q.accepts=data.flatMap(x=>String(x).split('/')).map(x=>x.trim()).filter(Boolean);
    }else if(type==='order'){
     q.orderItems=data.map(String).map(x=>x.trim()).filter(Boolean);
    }else if(type==='free'){
     q.freeAnswer=data.join(' | ').trim();
    }else if(type==='sort'){
     const natural1=parseSortCategoryToken(data[0]),natural2=parseSortCategoryToken(data[1]);
     if(natural1&&natural2){q.sortCategories=[natural1.name,natural2.name];q.sortItems=[...natural1.items.map(text=>({text,category:0})),...natural2.items.map(text=>({text,category:1}))]}
     else{q.sortCategories=[String(data[0]||'').trim(),String(data[1]||'').trim()];q.sortItems=data.slice(2).map(value=>{const pair=splitPairToken(value);if(!pair)return null;const category=Number(pair.right);return category===1||category===2?{text:pair.left,category:category-1}:null}).filter(Boolean)}
    }else if(type==='match'){
     q.matchPairs=data.map(splitPairToken).filter(Boolean).map(x=>({left:x.left,right:x.right}));
    }
   }
   q=normalizeQuestion(q);const err=validateQuestion(q);if(err){skipped.push(lineNumber);return}questions.push(q);
  }catch{skipped.push(lineNumber)}
 });
 return{questions,skipped,total:entries.length,format:'lines'}
}
$('applyImport').addEventListener('click',()=>{
 const raw=$('importText').value;
 if(!raw.trim()){editorToast('Сначала вставьте вопросы');return}
 try{
  const result=parseImportedQuestions(raw);
  if(!result.questions.length){editorToast('Не удалось распознать вопросы. Проверьте формат.');return}
  Editor.config.tasks.push(...result.questions);
  $('importModal').classList.remove('show');
  $('importText').value='';
  renderList();
  const skippedLabel=result.format==='json'?'элементы':'строки';editorToast(result.skipped.length?`Добавлено: ${result.questions.length}. Пропущены ${skippedLabel}: ${result.skipped.join(', ')}`:`Добавлено вопросов: ${result.questions.length}`);
  setTimeout(()=>{try{saveLocal();updatePreview(false)}catch(err){console.error(err);editorToast('Вопросы добавлены, но предпросмотр не обновился')}} ,0);
 }catch(err){console.error(err);editorToast('Ошибка импорта: '+(err?.message||'не удалось добавить вопросы'))}
});
$('saveProject').onclick=()=>{saveLocal();const payload={kind:PROJECT_KIND,version:1,savedAt:new Date().toISOString(),config:Editor.config};downloadBlob(new Blob([JSON.stringify(payload)],{type:'application/json;charset=utf-8'}),safeName(Editor.config.title)+'.perelivashki')};
$('loadProject').onclick=()=>$('projectFile').click();$('projectFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>30*1024*1024)throw new Error('Файл больше 30 МБ');const data=JSON.parse(await f.text());const raw=data?.kind===PROJECT_KIND?data.config:data;if(!raw||!Array.isArray(raw.tasks))throw new Error('Это не файл проекта «Переливашек»');if(!await askConfirm('Заменить текущий проект данными из файла?'))return;Editor.config=normalizeConfig(raw);saveLocal();fillSettings();notify('Проект загружен')}catch(err){await showError(err.message||'Не удалось загрузить файл')}finally{e.target.value=''}};
$('downloadHtml').onclick=()=>{saveLocal();const html=buildStandaloneHtml();downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),safeName(Editor.config.title)+'.html');notify('HTML скачан')};
$('copyCodeFromModal').onclick=async()=>{const ok=await copyText($('codeText').value);notify(ok?'Код скопирован':'Не удалось скопировать');showCopyConfirm(ok?'✓ Код скопирован':'Не удалось скопировать код',ok);if(ok)editorToast('✓ Код скопирован')};
$('copyLink').onclick=async()=>{try{saveLocal();const compact=configForGeniallyImmediate(Editor.config);const iframe=buildUpdatingGeniallyCode(compact);const bytes=byteSize(iframe);$('codeText').value=iframe;$('codeInfo').textContent=`Обновляемый код для Genially: ${formatBytes(bytes)}. Настройки игры находятся внутри, а движок загружается с вашего домена.`;const btn=$('copyLink'),oldText=btn?.textContent;editorToast('Копирую код Genially…');const copyPromise=copyText(iframe);const ok=await copyPromise;if(ok){notify(`Обновляемый код Genially скопирован · ${formatBytes(bytes)}`);editorToast('✓ Код Genially скопирован');showCopyConfirm('✓ Код Genially скопирован',true);if(btn){btn.textContent='✓ Код скопирован';clearTimeout(btn._copyTimer);btn._copyTimer=setTimeout(()=>{btn.textContent=oldText||'📋 Genially — обновляемая'},2600)}}else{showCopyConfirm('Код готов, но браузер не разрешил автокопирование',false);editorToast('Автокопирование не сработало — открыл окно с кодом');$('codeModal').classList.add('show')}}catch(err){showCopyConfirm('Не удалось подготовить код Genially',false);await showError(err.message||'Не удалось создать код для Genially')}};
$('resetAll').onclick=async()=>{if(!await askConfirm('Сбросить настройки, оформление и все задания?',{okText:'Сбросить'}))return;localStorage.removeItem(STORAGE_KEY);await idbClearConfig();Editor.config=defaultConfig();fillSettings();saveLocal()};
window.addEventListener('beforeunload',()=>{if(Editor.previewUrl)URL.revokeObjectURL(Editor.previewUrl)});
fillSettings();
(async()=>{const full=await idbLoadConfig();if(full){Editor.config=normalizeConfig(full);fillSettings()}setTimeout(()=>repairActiveLanguageIfNeeded(),220);if(!getWelcomeSkip())setTimeout(openWelcome,180)})();
