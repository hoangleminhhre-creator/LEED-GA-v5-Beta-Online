(function(){
'use strict';
var auth=null,db=null,user=null,timer=null,busy=false,initialSyncDone=false,prefix='leedga_v7523_';
function el(id){return document.getElementById(id)}
function configured(){var c=window.LEED_FIREBASE_CONFIG||{};return !!(c.apiKey&&c.projectId&&c.appId&&c.apiKey.indexOf('PASTE_')!==0&&c.projectId.indexOf('PASTE_')!==0)}
function status(text,kind){var e=el('sync-status');if(!e)return;e.textContent=text;e.className='sync-status'+(kind?' '+kind:'')}
function snapshot(){var d={},i,k;for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&k.indexOf(prefix)===0)d[k]=localStorage.getItem(k)}return d}
function restore(d){var k;if(!d)return;for(k in d)if(Object.prototype.hasOwnProperty.call(d,k))localStorage.setItem(k,d[k])}
function parse(v,f){try{return JSON.parse(v||JSON.stringify(f))}catch(e){return f}}
function answered(v){var x=parse(v,{}),a=x.answers||[],n=0,i;for(i=0;i<a.length;i++)if(a[i]!==null&&a[i]!==undefined)n++;return n}
function merge(local,cloud){var out={},keys={},k,l,c,lh,ch,ids,x,i;for(k in local)keys[k]=1;for(k in cloud)keys[k]=1;for(k in keys){l=local[k];c=cloud[k];if(!l){out[k]=c;continue}if(!c){out[k]=l;continue}if(/history$/.test(k)){lh=parse(l,[]);ch=parse(c,[]);ids={};x=[];for(i=0;i<lh.length;i++){ids[String(lh[i].id||lh[i].date)]=1;x.push(lh[i])}for(i=0;i<ch.length;i++)if(!ids[String(ch[i].id||ch[i].date)])x.push(ch[i]);x.sort(function(a,b){return (b.date||0)-(a.date||0)});out[k]=JSON.stringify(x.slice(0,200))}else if(/progress_/.test(k)){out[k]=answered(c)>answered(l)?c:l}else if(/used_mix$/.test(k)){x=Array.from(new Set(parse(l,[]).concat(parse(c,[]))));out[k]=JSON.stringify(x)}else out[k]=c}return out}
function ref(){return db.collection('users').doc(user.uid).collection('apps').doc('leed-ga-v5')}
async function syncNow(){if(!user||busy)return;busy=true;status('Đang đồng bộ…','busy');el('sync-btn').disabled=true;try{var local=snapshot(),doc=await ref().get(),cloud=doc.exists?(doc.data().data||{}):{},combined=merge(local,cloud);restore(combined);await ref().set({data:combined,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),email:user.email||'',displayName:user.displayName||''},{merge:true});status('Đã đồng bộ','online')}catch(e){console.error(e);status('Lỗi đồng bộ','error')}finally{busy=false;if(el('sync-btn')&&user)el('sync-btn').disabled=false}}
function scheduleUpload(){if(!user||busy)return;clearTimeout(timer);timer=setTimeout(function(){syncNow()},1500)}
async function login(){if(!configured()){alert('Chưa cấu hình Firebase. Hãy điền assets/js/firebase-config.js theo hướng dẫn FIREBASE_SETUP.md.');return}try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())}catch(e){console.error(e);status('Đăng nhập thất bại','error')}}
async function logout(){initialSyncDone=false;if(auth)await auth.signOut()}
function ui(u){user=u;var login=el('login-btn'),logout=el('logout-btn'),sync=el('sync-btn'),userLabel=el('sync-user');if(u){login.classList.add('hidden');logout.classList.remove('hidden');sync.disabled=false;var displayName=u.displayName&&u.displayName.trim()?u.displayName.trim():'Người dùng';var email=u.email&&u.email.trim()?u.email.trim():'';userLabel.textContent=email?displayName+' · '+email:displayName;userLabel.title=email;userLabel.classList.remove('hidden');status('Đã đăng nhập','online')}else{login.classList.remove('hidden');logout.classList.add('hidden');sync.disabled=true;userLabel.textContent='';userLabel.title='';userLabel.classList.add('hidden');status('Chưa đăng nhập','')}}
function init(){el('login-btn').onclick=login;el('logout-btn').onclick=logout;el('sync-btn').onclick=function(){syncNow()};if(!configured()||!window.firebase){ui(null);return}firebase.initializeApp(window.LEED_FIREBASE_CONFIG);auth=firebase.auth();db=firebase.firestore();auth.onAuthStateChanged(async function(u){ui(u);if(u&&!initialSyncDone){initialSyncDone=true;await syncNow()}if(!u)initialSyncDone=false})}
window.LEED_SYNC={scheduleUpload:scheduleUpload,syncNow:syncNow};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
