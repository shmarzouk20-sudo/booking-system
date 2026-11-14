firebase.initializeApp(FIREBASE_CONFIG);
const auth=firebase.auth(),db=firebase.firestore(),TS=()=>firebase.firestore.FieldValue.serverTimestamp(),AU=firebase.firestore.FieldValue.arrayUnion;
const $=s=>document.querySelector(s);
const TY={maint:'صيانة',diagnose:'Diagnose',comeback:'Comeback',cpa:'CPA',ic:'IC'};
const ST={pending:'قيد المراجعة',approved:'موافق عليه',rejected:'مرفوض',info:'مطلوب معلومات',cancelled:'ملغي'};
const RL={engineer:'مهندس',manager:'مدير',coordinator:'كوردينيتور',security:'أمن',complaints:'مسؤول الشكاوى',admin:'أدمن'};
const PRESET=[...['نصار','اسماعيل','نانسي','زياد','طه','عبدالرحمن','فؤاد','سارة','عباس','رجب','مارجريت','عبدالعزيز','خالد','اسماعيل سيد'].map(n=>[n,'engineer']),
 ...['شعبان','كريم','بيشوي','اسلام'].map(n=>[n,'manager']),['ميرنا','coordinator'],['يسرا','coordinator'],['احمد','security'],['ياسر','security'],['محمد طه','complaints']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=n=>n.trim().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/\s+/g,' ').toLowerCase();
const mail=n=>{const s=norm(n);return(/^[a-z0-9]+$/.test(s)?s:'u'+[...s].map(c=>c.charCodeAt(0).toString(16)).join(''))+'@abu-rawash.app'};
const today=()=>new Date().toLocaleDateString('sv',{timeZone:'Africa/Cairo'});
const pk=p=>p.replace(/\s/g,'').toUpperCase();
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3500)};
const S={me:null,users:[],L:{maint:3,comeback:2,diagnose:1,cpa:3,ic:3,ct:5},date:today(),day:{},mine:[],cmp:[],appr:[],pend:[],nt:[],tab:'day',un:[],bell:false};
let sec;

// ---------- الدخول ----------
function loginView(){$('#app').innerHTML=`<div class="card login"><img src="logo.png"><h2>شانجان أبو رواش</h2><p>نظام حجز مركز الخدمة</p>
<form id="lf"><input id="ln" name="staff-name" placeholder="اسم المستخدم" autocomplete="off" autocapitalize="off" spellcheck="false" readonly onfocus="this.removeAttribute('readonly')"><input id="lp" type="password" placeholder="كلمة السر" autocomplete="current-password"><button style="width:100%">دخول</button></form></div>`;
 setTimeout(()=>{const l=$('#ln');if(l&&l.value.includes('@'))l.value=''},300);
 $('#lf').onsubmit=async e=>{e.preventDefault();try{await auth.signInWithEmailAndPassword(mail($('#ln').value),$('#lp').value)}catch(x){toast('اسم المستخدم أو كلمة السر غير صحيحة')}}}
auth.onAuthStateChanged(async u=>{S.un.forEach(f=>f());S.un=[];
 if(!u){S.me=null;return loginView()}
 try{const d=await db.doc('users/'+u.uid).get();if(!d.exists){toast('هذا الحساب غير مفعّل، تواصل مع الأدمن');return auth.signOut()}
 S.me={uid:u.uid,...d.data()};await loadUsers();S.date=today();S.tab='day';
 db.doc('settings/limits').onSnapshot(s=>{if(s.exists)S.L=s.data();draw()});
 S.un.push(db.collection('notifications').where('to','==',u.uid).onSnapshot(s=>{S.nt=s.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.at?.seconds||0)-(a.at?.seconds||0));draw()}));
 shell();listen()}catch(e){toast('خطأ في التحميل: '+e.message)}});
const loadUsers=async()=>{S.users=(await db.collection('users').get()).docs.map(x=>({uid:x.id,...x.data()}))};

// ---------- الاستماع للبيانات ----------
function listen(){S.un=S.un.slice(0,2);const r=S.me.role,d=S.date,q=db.collection('requests'),
 on=(x,k)=>S.un.push(x.onSnapshot(s=>{S[k]=s.docs.map(z=>({id:z.id,...z.data()}));draw()},e=>console.error(e)));
 S.un.push(db.doc('days/'+d).onSnapshot(s=>{S.day=s.data()||{};draw()}));
 if(r=='manager'||r=='admin'){on(q.where('date','==',d).where('status','==','approved'),'appr');on(q.where('status','==','pending'),'pend')}
 if(r=='coordinator'||r=='security')on(q.where('date','==',d).where('status','==','approved'),'appr');
 if(r=='engineer'){on(q.where('engUid','==',S.me.uid),'mine');on(q.where('date','==',d).where('status','==','approved').where('type','in',['cpa','ic']),'cmp')}
 if(r=='complaints')on(q.where('type','in',['cpa','ic']).where('date','==',d),'cmp')}

// ---------- الواجهة ----------
function shell(){const R=S.me.role,t=[['day','حجوزات اليوم']];
 if(['engineer','manager','complaints'].includes(R))t.push(['new','طلب جديد']);
 if(R=='engineer')t.push(['mine','طلباتي']);
 if(R=='manager'||R=='admin'){t.push(['pend','طلبات المراجعة']);t.push(['exp','تصدير'])}
 if(R=='admin')t.push(['adm','الإدارة']);
 $('#app').innerHTML=`<header><img src="logo.png"><b>شانجان أبو رواش<small>${esc(S.me.name)} · ${RL[R]}</small></b>
 <button id="bell" onclick="S.bell=!S.bell;bellView()">🔔<span id="bc"></span></button><button class="s" onclick="auth.signOut()">خروج</button></header>
 <nav>${t.map(x=>`<button class="${S.tab==x[0]?'on':''}" onclick="S.tab='${x[0]}';shell()">${x[1]}${x[0]=='pend'&&S.pend.length?' ('+S.pend.length+')':''}</button>`).join('')}</nav>
 <main><div id="bp"></div><div id="body"></div></main>`;show();bellView()}
function draw(){if(!S.me)return;if(!['new','adm','exp'].includes(S.tab))show();bellView()}
function bellView(){const u=S.nt.filter(n=>!n.read),c=$('#bc');if(!c)return;c.textContent=u.length||'';c.style.display=u.length?'':'none';
 $('#bp').innerHTML=S.bell?`<div class="card"><b>الإشعارات</b>${S.nt.slice(0,15).map(n=>`<p style="${n.read?'opacity:.5':''}">${esc(n.text)}</p>`).join('')||'<p>لا توجد إشعارات</p>'}</div>`:'';
 if(S.bell)u.forEach(n=>db.doc('notifications/'+n.id).update({read:true}))}
function show(){const b=$('#body');if(!b)return;({day:dayView,new:newView,mine:mineView,pend:pendView,exp:expView,adm:admView}[S.tab])(b)}
const chip=k=>{const u=S.day[k]||0,m=S.L[k];return`<span class="chip ${u>=m?'full':''}">${TY[k]}: ${u}/${m}</span>`};
const full=(d,t)=>d.closed||(d[t]||0)>=S.L[t]||(['cpa','ic'].includes(t)&&(d.cpa||0)+(d.ic||0)>=S.L.ct);
function names(){const r=S.me.role;let a=[];
 if(r=='engineer')a=[...S.mine.filter(x=>x.date==S.date&&x.status=='approved'),...S.cmp];
 else if(r=='complaints')a=S.cmp.filter(x=>x.status=='approved');else a=S.appr;
 return[...new Map(a.map(x=>[x.id,x])).values()]}
function dayView(b){const R=S.me.role,ks=R=='complaints'?['cpa','ic']:Object.keys(TY),l=names(),cp=['cpa','ic'];
 b.innerHTML=`<div class="card">${R=='security'?`<h3>حجوزات اليوم ${S.date}</h3>`:`<label>اليوم</label><input type="date" value="${S.date}" onchange="S.date=this.value;listen()">`}
 ${S.day.closed?'<div class="warn">هذا اليوم مغلق</div>':''}<div>${ks.map(chip).join('')}${R=='complaints'||R!='security'?`<span class="chip">إجمالي الشكاوى: ${(S.day.cpa||0)+(S.day.ic||0)}/${S.L.ct}</span>`:''}</div></div>
 <div class="card"><b>العملاء المعتمدون (${l.length})</b><table><tr><th>العميل</th><th>اللوحة</th><th>النوع</th>${['manager','admin','engineer','complaints'].includes(R)?'<th>المسؤول</th><th></th>':''}</tr>
 ${l.map(x=>`<tr><td>${esc(x.customer)}</td><td>${esc(x.plate)}</td><td><span class="tag">${TY[x.type]}</span></td>${['manager','admin','engineer','complaints'].includes(R)?`<td>${esc(x.eng)}</td><td>${(x.engUid==S.me.uid||R=='manager'||R=='admin')?`<button class="r" onclick="act('cancel','${x.id}')">إلغاء</button>`:''}</td>`:''}</tr>`).join('')||'<tr><td>لا توجد حجوزات معتمدة لهذا اليوم</td></tr>'}</table></div>`}
const card=(x,a='')=>`<div class="card"><div class="row"><b>${esc(x.customer)} · ${esc(x.plate)}</b><span class="st ${x.status}">${ST[x.status]}</span></div>
 <p><span class="tag">${TY[x.type]}</span> ${x.date}${x.km?' · '+x.km.toLocaleString()+' كم':''}${x.lastVisit?' · آخر زيارة '+x.lastVisit:''}<br>المسؤول: ${esc(x.eng)}${x.autoApproved?' (موافقة تلقائية)':''}</p>
 ${x.notes?`<p>ملاحظات: ${esc(x.notes)}</p>`:''}${x.reason?`<p>السبب: ${esc(x.reason)}</p>`:''}${(x.thread||[]).map(t=>`<p><i>${esc(t.by)}: ${esc(t.text)}</i></p>`).join('')}<div class="acts">${a}</div></div>`;
function mineView(b){b.innerHTML=[...S.mine].sort((a,c)=>c.date.localeCompare(a.date)).map(x=>card(x,
 (x.status=='info'?`<button onclick="act('reply','${x.id}')">رد وتعديل</button>`:'')+(x.status=='approved'?`<button class="r" onclick="act('cancel','${x.id}')">إلغاء الحجز</button>`:''))).join('')||'<div class="card">لا توجد طلبات</div>'}
function pendView(b){b.innerHTML=[...S.pend].sort((a,c)=>a.date.localeCompare(c.date)).map(x=>card(x,
 `<button class="g" onclick="act('approve','${x.id}')">موافقة</button><button class="r" onclick="act('reject','${x.id}')">رفض</button><button class="s" onclick="act('info','${x.id}')">طلب معلومات</button>`)).join('')||'<div class="card">لا توجد طلبات معلقة</div>'}

// ---------- طلب جديد ----------
function newView(b){const R=S.me.role,ts=R=='complaints'?['cpa','ic']:['maint','diagnose','comeback'],kms=[1000,...Array.from({length:10},(_,i)=>(i+1)*10000)];
 b.innerHTML=`<form class="card" id="nf"><h3>طلب حجز جديد</h3><label>تاريخ الحجز</label><input type="date" name="date" min="${today()}" value="${S.date<today()?today():S.date}">
 <label>النوع</label><select name="type">${ts.map(t=>`<option value="${t}">${TY[t]}</option>`).join('')}</select>
 ${R=='complaints'?`<label>آخر زيارة كانت في:</label><select name="branch"><option value="abu">شانجان أبو رواش</option><option value="other">فرع آخر</option></select>`:''}
 <div id="kmw"><label>الصيانة (كم)</label><select name="km">${kms.map(k=>`<option value="${k}">${k.toLocaleString()}</option>`).join('')}</select></div>
 <div id="lvw" class="hid"><label>تاريخ آخر زيارة</label><input type="date" name="last"></div>
 <label>اسم العميل *</label><input name="customer"><label>رقم اللوحة *</label><input name="plate"><label>ملاحظات (اختياري)</label><textarea name="notes"></textarea><button style="width:100%">إرسال</button></form>`;
 const f=$('#nf'),sync=()=>{$('#kmw').classList.toggle('hid',f.type.value!='maint');$('#lvw').classList.toggle('hid',f.type.value!='comeback')};f.type.onchange=sync;sync();
 f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('button');btn.disabled=true;try{await submitReq(f);toast('تم إرسال الطلب');S.tab=R=='engineer'?'mine':'day';shell()}catch(x){toast(x.message)}btn.disabled=false}}
async function submitReq(f){const R=S.me.role,type=f.type.value,date=f.date.value,customer=f.customer.value.trim(),plate=f.plate.value.trim();
 if(!date||!customer||!plate)throw Error('أكمل الحقول الإجبارية (العميل، اللوحة، التاريخ)');
 if(date<today())throw Error('لا يمكن اختيار تاريخ قديم');
 if(type=='comeback'&&!f.last.value)throw Error('تاريخ آخر زيارة إجباري في Comeback');
 const dd=(await db.doc('days/'+date).get()).data()||{};if(full(dd,type))throw Error(dd.closed?'هذا اليوم مغلق، اختر يومًا آخر':'لا توجد أماكن متاحة لهذا اليوم، اختر يومًا آخر');
 let auto=false;if(R=='complaints'&&f.branch.value=='abu'){if(!confirm('تأكيد: آخر زيارة في شانجان أبو رواش؟\nسيتم اعتماد الحجز مباشرة'))return;auto=true}
 const ref=db.collection('requests').doc(),x={date,type,customer,plate,notes:f.notes.value.trim(),km:type=='maint'?+f.km.value:null,lastVisit:type=='comeback'?f.last.value:null,
  eng:S.me.name,engUid:S.me.uid,status:'pending',createdAt:TS(),thread:[]};
 if(R=='manager'||auto){x.status='approved';x.autoApproved=auto;if(R=='manager')x.by=S.me.name;await commit(ref,x);
  log(auto?'موافقة تلقائية (آخر زيارة في أبو رواش)':'إرسال واعتماد مباشر (مدير)',`${customer} - ${plate} - ${TY[type]} - ${date}`,ref.id)}
 else{await ref.set(x);log('إرسال طلب',`${customer} - ${plate} - ${TY[type]} - ${date}`,ref.id);
  S.users.filter(u=>u.role=='manager').forEach(u=>notify(u.uid,`طلب جديد من ${S.me.name}: ${customer} (${TY[type]}) يوم ${date}`))}}

// ---------- المعاملات ----------
async function commit(ref,x){return db.runTransaction(async t=>{
 const dr=db.doc('days/'+x.date),lr=db.doc('locks/'+x.date+'_'+pk(x.plate)),[ds,ls]=await Promise.all([t.get(dr),t.get(lr)]),d=ds.data()||{};
 if(d.closed)throw Error('هذا اليوم مغلق، اختر يومًا آخر');
 if(full(d,x.type))throw Error('لا توجد أماكن متاحة لهذا اليوم، اختر يومًا آخر');
 if(ls.exists)throw Error('هذه اللوحة محجوزة بالفعل في هذا اليوم');
 t.set(dr,{[x.type]:(d[x.type]||0)+1},{merge:true});t.set(lr,{uid:S.me.uid});t.set(ref,x,{merge:true})})}
async function act(a,id){const r=[...S.pend,...S.mine,...S.cmp,...S.appr].find(x=>x.id==id);if(!r)return;const ref=db.doc('requests/'+id),n=`${r.customer} (${r.date})`;
 try{
 if(a=='approve'){const{id:_,...x}=r;await commit(ref,{...x,status:'approved',by:S.me.name});log('موافقة',n,id);notify(r.engUid,`تمت الموافقة على حجز ${n}`)}
 if(a=='reject'){const why=prompt('سبب الرفض (اختياري)');if(why===null)return;await ref.update({status:'rejected',reason:why||''});log('رفض',n+(why?' - '+why:''),id);notify(r.engUid,`تم رفض حجز ${n}${why?': '+why:''}`)}
 if(a=='info'){const q=prompt('ما المعلومات المطلوبة؟');if(!q)return;await ref.update({status:'info',thread:AU({by:S.me.name,text:q})});log('طلب معلومات',n+' - '+q,id);notify(r.engUid,`طلب معلومات بخصوص ${n}: ${q}`)}
 if(a=='reply'){const t=prompt('ردك على طلب المعلومات');if(!t)return;const p=prompt('تعديل رقم اللوحة (اتركه كما هو أو عدّله)',r.plate)||r.plate,nt=prompt('تعديل الملاحظات',r.notes||'')??r.notes;
  await ref.update({status:'pending',plate:p,notes:nt,thread:AU({by:S.me.name,text:t})});log('رد وتعديل',n,id);S.users.filter(u=>u.role=='manager').forEach(u=>notify(u.uid,`${S.me.name} رد على طلب ${n}`))}
 if(a=='cancel'){if(!confirm('إلغاء هذا الحجز؟ سيتم إخلاء المكان فورًا'))return;
  await db.runTransaction(async t=>{const dr=db.doc('days/'+r.date),d=(await t.get(dr)).data()||{};t.set(dr,{[r.type]:Math.max(0,(d[r.type]||0)-1)},{merge:true});t.delete(db.doc('locks/'+r.date+'_'+pk(r.plate)));t.update(ref,{status:'cancelled'})});
  log('إلغاء حجز',n,id);if(r.engUid!=S.me.uid)notify(r.engUid,`تم إلغاء حجز ${n} بواسطة ${S.me.name}`)}
 toast('تم')}catch(e){toast(e.message)}}
const log=(action,detail,reqId='')=>db.collection('logs').add({at:TS(),by:S.me.name,action,detail,reqId}).catch(()=>{});
const notify=(to,text)=>db.collection('notifications').add({to,text,at:TS(),read:false}).catch(()=>{});

// ---------- التصدير ----------
function expView(b){b.innerHTML=`<div class="card"><h3>تصدير الحجوزات (CSV)</h3><label>من</label><input type="date" id="ef" value="${today()}"><label>إلى</label><input type="date" id="et" value="${today()}"><button onclick="doExport()">تحميل</button></div>`}
async function doExport(){const s=await db.collection('requests').where('date','>=',$('#ef').value).where('date','<=',$('#et').value).get();
 const H=['التاريخ','العميل','اللوحة','النوع','كم','آخر زيارة','المسؤول','الحالة','ملاحظات','السبب'],c=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 const rows=s.docs.map(d=>d.data()).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.date,x.customer,x.plate,TY[x.type],x.km,x.lastVisit,x.eng,ST[x.status],x.notes,x.reason].map(c).join(','));
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+[H.join(','),...rows].join('\n')],{type:'text/csv'}));a.download=`حجوزات_${$('#ef').value}_${$('#et').value}.csv`;a.click()}

// ---------- الإدارة ----------
function admView(b){const L=S.L;b.innerHTML=`<div class="card"><h3>الحدود اليومية</h3><div class="row">${['maint','comeback','diagnose','cpa','ic','ct'].map(k=>`<div><label>${TY[k]||'إجمالي الشكاوى'}</label><input type="number" id="l_${k}" value="${L[k]}"></div>`).join('')}</div><button onclick="saveL()">حفظ</button></div>
 <div class="card"><h3>قفل / فتح يوم</h3><input type="date" id="cd" value="${today()}"><div class="row"><button class="r" onclick="closeDay(true)">قفل</button><button class="g" onclick="closeDay(false)">فتح</button></div></div>
 <div class="card"><h3>المستخدمون (${S.users.length})</h3><div class="row"><input id="un" placeholder="الاسم"><select id="ur">${Object.entries(RL).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input id="up" placeholder="كلمة السر (6+)"></div>
 <button onclick="addU()">إضافة</button> <button class="s" onclick="seed()">إضافة كل الأسماء الجاهزة</button>
 <table>${S.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${RL[u.role]}</td><td><button class="r" onclick="delU('${u.uid}')">حذف</button></td></tr>`).join('')}</table></div>
 <div class="card"><h3>سجل المراجعة</h3><button onclick="showLog()">عرض آخر 100 عملية</button><div id="lg"></div></div>`}
async function saveL(){const o={};['maint','comeback','diagnose','cpa','ic','ct'].forEach(k=>o[k]=+$('#l_'+k).value);await db.doc('settings/limits').set(o);log('تعديل الحدود',JSON.stringify(o));toast('تم الحفظ')}
async function closeDay(c){await db.doc('days/'+$('#cd').value).set({closed:c},{merge:true});log(c?'قفل يوم':'فتح يوم',$('#cd').value);toast('تم')}
async function mkUser(name,role,pw){sec=sec||firebase.initializeApp(FIREBASE_CONFIG,'sec');const c=await sec.auth().createUserWithEmailAndPassword(mail(name),pw);await db.doc('users/'+c.user.uid).set({name,role});await sec.auth().signOut()}
async function addU(){const n=$('#un').value.trim(),p=$('#up').value;if(!n||p.length<6)return toast('اكتب الاسم وكلمة سر 6 أحرف على الأقل');
 try{await mkUser(n,$('#ur').value,p);log('إضافة مستخدم',n);await loadUsers();admView($('#body'));toast('تمت الإضافة')}catch(e){toast(e.code=='auth/email-already-in-use'?'الاسم موجود بالفعل':e.message)}}
async function seed(){const p=prompt('كلمة السر الأولية لكل الحسابات الجاهزة (6+ أحرف)');if(!p||p.length<6)return;let n=0;
 for(const[name,role]of PRESET){try{await mkUser(name,role,p);n++}catch(e){}}await loadUsers();log('إضافة جماعية',n+' حساب');admView($('#body'));toast(`تمت إضافة ${n} حساب`)}
async function delU(id){if(id==S.me.uid)return toast('لا يمكنك حذف حسابك');if(!confirm('حذف المستخدم؟ لن يستطيع الدخول بعدها'))return;await db.doc('users/'+id).delete();await loadUsers();admView($('#body'))}
async function showLog(){const s=await db.collection('logs').orderBy('at','desc').limit(100).get();
 $('#lg').innerHTML='<table>'+s.docs.map(d=>d.data()).map(x=>`<tr><td>${x.at?x.at.toDate().toLocaleString('ar-EG',{timeZone:'Africa/Cairo'}):''}</td><td>${esc(x.by)}</td><td>${esc(x.action)}</td><td>${esc(x.detail)}</td></tr>`).join('')+'</table>'}
setInterval(()=>{if(S.me&&S.me.role=='security'&&S.date!=today()){S.date=today();listen()}},60000);
