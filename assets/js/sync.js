(function(){
'use strict';
var auth=null,db=null,user=null,timer=null,busy=false,initialSyncDone=false;
var configuredPrefix=(window.LEED_CONFIG&&window.LEED_CONFIG.storagePrefix)||'leed_ga_trainer_v75_';
var legacyPrefixes=[configuredPrefix,'leedga_v7523_','leed_ga_trainer_v75_'];
var tombstoneKey=configuredPrefix+'sync_deleted';
function el(id){return document.getElementById(id)}
function configured(){var c=window.LEED_FIREBASE_CONFIG||{};return !!(c.apiKey&&c.projectId&&c.appId&&c.apiKey.indexOf('PASTE_')!==0&&c.projectId.indexOf('PASTE_')!==0)}
function status(text,kind){var e=el('sync-status');if(!e)return;e.textContent=text;e.className='sync-status'+(kind?' '+kind:'')}
function parse(v,f){try{return JSON.parse(v||JSON.stringify(f))}catch(e){return f}}
function logicalKey(k){var i;for(i=0;i<legacyPrefixes.length;i++)if(k.indexOf(legacyPrefixes[i])===0)return k.slice(legacyPrefixes[i].length);return null}
function canonicalKey(k){return configuredPrefix+k}
function localLogicalSnapshot(){var d={},i,k,l;for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k===tombstoneKey)continue;l=logicalKey(k);if(l!==null)d[l]=localStorage.getItem(k)}return d}
function cloudLogicalSnapshot(d){var out={},k,l;if(!d)return out;for(k in d)if(Object.prototype.hasOwnProperty.call(d,k)){l=logicalKey(k);if(l===null)l=k;out[l]=d[k]}return out}
function canonicalCloudData(d){var out={},k;for(k in d)if(Object.prototype.hasOwnProperty.call(d,k))out[canonicalKey(k)]=d[k];return out}
function restore(d,deleted){var k;if(!d)return;for(k in d)if(Object.prototype.hasOwnProperty.call(d,k)&&!(deleted&&deleted[k]))localStorage.setItem(canonicalKey(k),d[k]);if(deleted)for(k in deleted)if(deleted[k])localStorage.removeItem(canonicalKey(k))}
function answered(v){var x=parse(v,{}),a=x.answers||[],n=0,i;for(i=0;i<a.length;i++)if(a[i]!==null&&a[i]!==undefined)n++;return n}
function progressRank(v){var x=parse(v,{});return {updatedAt:Number(x.updatedAt||x.startedAt||0),answered:answered(v)}}
function chooseProgress(a,b){var x=progressRank(a),y=progressRank(b);if(y.updatedAt!==x.updatedAt)return y.updatedAt>x.updatedAt?b:a;return y.answered>x.answered?b:a}
function attemptId(x){return String(x.id||[x.date,x.test,x.mode,x.pct,x.correct,x.wrong,x.blank].join('|'))}
function mergeHistory(a,b){var x=parse(a,[]),y=parse(b,[]),seen={},out=[],i,id;for(i=0;i<x.length;i++){id=attemptId(x[i]);if(!seen[id]){seen[id]=1;out.push(x[i])}}for(i=0;i<y.length;i++){id=attemptId(y[i]);if(!seen[id]){seen[id]=1;out.push(y[i])}}out.sort(function(m,n){return Number(n.date||0)-Number(m.date||0)});return JSON.stringify(out.slice(0,200))}
function mergeUsed(a,b){return JSON.stringify(Array.from(new Set(parse(a,[]).concat(parse(b,[])))))}
function mergeMaps(local,cloud,deleted){var out={},keys={},k,l,c;for(k in local)keys[k]=1;for(k in cloud)keys[k]=1;for(k in keys){if(deleted&&deleted[k])continue;l=local[k];c=cloud[k];if(l===undefined){out[k]=c;continue}if(c===undefined){out[k]=l;continue}if(k==='history')out[k]=mergeHistory(l,c);else if(/^progress_/.test(k))out[k]=chooseProgress(l,c);else if(k==='used_mix')out[k]=mergeUsed(l,c);else out[k]=c}return out}
function mergeDeleted(a,b){var out={},k;for(k in a)out[k]=Number(a[k]||0);for(k in b)out[k]=Math.max(Number(out[k]||0),Number(b[k]||0));return out}
function localDeleted(){return parse(localStorage.getItem(tombstoneKey),{})}
function saveDeleted(d){localStorage.setItem(tombstoneKey,JSON.stringify(d||{}))}
function ref(){return db.collection('users').doc(user.uid).collection('apps').doc('leed-ga-v5')}
function counts(d){var h=parse(d.history,[]),p=0,k;for(k in d)if(/^progress_/.test(k)&&d[k])p++;return {attempts:h.length,pending:p}}
async function syncNow(){if(!user||busy)return;busy=true;status('Đang đồng bộ...','busy');if(el('sync-btn'))el('sync-btn').disabled=true;try{var local=localLogicalSnapshot(),localDel=localDeleted(),finalData={},finalDeleted={};await db.runTransaction(async function(tx){var r=ref(),snap=await tx.get(r),raw=snap.exists?snap.data():{},cloud=cloudLogicalSnapshot(raw.data||{}),cloudDel=raw.deleted||{};finalDeleted=mergeDeleted(localDel,cloudDel);finalData=mergeMaps(local,cloud,finalDeleted);tx.set(r,{data:canonicalCloudData(finalData),deleted:finalDeleted,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),email:user.email||'',displayName:user.displayName||''},{merge:true})});restore(finalData,finalDeleted);saveDeleted(finalDeleted);var n=counts(finalData);status('Đã đồng bộ · '+n.attempts+' lần làm · '+n.pending+' bài đang chờ','online');if(window.LEED_APP&&typeof window.LEED_APP.refreshMenu==='function')window.LEED_APP.refreshMenu()}catch(e){console.error('LEED sync error',e);status('Lỗi đồng bộ: '+(e.code||e.message||'không xác định'),'error')}finally{busy=false;if(el('sync-btn')&&user)el('sync-btn').disabled=false}}
function scheduleUpload(){if(!user||busy)return;clearTimeout(timer);timer=setTimeout(syncNow,1200)}
function markDeleted(fullKey){var l=logicalKey(fullKey)||fullKey,d=localDeleted();d[l]=Date.now();saveDeleted(d);localStorage.removeItem(canonicalKey(l));scheduleUpload()}
async function login(){if(!configured())return;try{var p=new firebase.auth.GoogleAuthProvider();if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))await auth.signInWithRedirect(p);else await auth.signInWithPopup(p)}catch(e){console.error(e);status('Đăng nhập thất bại','error')}}
async function logout(){initialSyncDone=false;if(auth)await auth.signOut()}
function ui(u){user=u;var lb=el('login-btn'),lo=el('logout-btn'),sb=el('sync-btn'),ul=el('sync-user');if(u){lb.classList.add('hidden');lo.classList.remove('hidden');sb.disabled=false;var name=u.displayName&&u.displayName.trim()?u.displayName.trim():'Người dùng',email=u.email&&u.email.trim()?u.email.trim():'';if(ul){ul.textContent=email?name+' · '+email:name;ul.title=email;ul.classList.remove('hidden')}status('Đã đăng nhập','online')}else{lb.classList.remove('hidden');lo.classList.add('hidden');sb.disabled=true;if(ul){ul.textContent='';ul.title='';ul.classList.add('hidden')}status('Chưa đăng nhập','')}}
function init(){el('login-btn').onclick=login;el('logout-btn').onclick=logout;el('sync-btn').onclick=syncNow;if(!configured()||!window.firebase){var bar=el('sync-bar');if(bar)bar.classList.add('hidden');return}firebase.initializeApp(window.LEED_FIREBASE_CONFIG);auth=firebase.auth();db=firebase.firestore();auth.getRedirectResult().catch(function(e){console.error(e);status('Đăng nhập thất bại','error')});auth.onAuthStateChanged(async function(u){ui(u);if(u&&!initialSyncDone){initialSyncDone=true;await syncNow()}if(!u)initialSyncDone=false})}
window.LEED_SYNC={scheduleUpload:scheduleUpload,syncNow:syncNow,markDeleted:markDeleted,storagePrefix:configuredPrefix};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
