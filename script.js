const $=s=>document.querySelector(s);
let DATA=null, AI={}, current=null;
let CLASSES=[], CLASS_AI={}, CLASS_META={}, currentClassKey=null;
const criteria=["Thái độ & tinh thần học tập","Kỹ năng hợp tác & giao tiếp","Kỹ năng thực hành & sáng tạo","Tính kiên trì & tự giác","Khả năng tiếp thu & vận dụng kiến thức","Tiến bộ cá nhân & đạo đức"];
const scoreState={};
function esc(s){return String(s??"").replace(/[&<>"\']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#039;"}[m]))}

function classKey(d){return `${d?.tenLop||"Lop"}__${d?.thang||""}`}
function classCode(name){
 const s=String(name||"LOP").trim();
 const m=s.match(/\b([A-Za-z]{1,6}\d{1,4})\b/);
 return safeFileName(m?m[1]:s.split(/\s*-\s*/)[0]||s);
}
function saveCurrentMeta(){
 if(!currentClassKey)return;
 CLASS_META[currentClassKey]={teacher:selectedTeacher(),center:selectedCenter()};
}
function loadClassMeta(){
 const m=CLASS_META[currentClassKey]||{};
 if(m.teacher){addOption($("#teacher"),m.teacher);$("#teacher").value=m.teacher}
 if(m.center){addOption($("#center"),m.center);$("#center").value=m.center}
}
function syncCurrentClass(){
 DATA=CLASSES.find(x=>classKey(x)===currentClassKey)||null;
 AI=CLASS_AI[currentClassKey]||{};
 if(!DATA)return;
 const sel=$("#studentSelect");
 sel.disabled=false;
 sel.innerHTML=DATA.hocVien.map(x=>`<option>${esc(x.tenHocVien)}</option>`).join("");
 current=DATA.hocVien[0]?.tenHocVien||null;
 sel.value=current;
 $("#classInfo").textContent=DATA.tenLop||"—";
 $("#monthInfo").textContent=DATA.thang||"—";
 $("#sessionsInfo").textContent=DATA.soBuoi||0;
 $("#subjectInfo").textContent=subject();
 $("#lessonList").classList.remove("empty");
 $("#lessonList").innerHTML=(DATA.noiDungThang||[]).map(x=>`<div class="lesson-item"><b>${esc(x.ngayHoc)} • ${esc(x.tenBaiHoc)}</b>${esc(x.noiDungBaiHoc)}</div>`).join("");
 loadClassMeta();
 renderStudent();
}
function subject(){
 const lessons=(DATA?.noiDungThang||[]);
 const activity=lessons.map(x=>x.tenBuoiHoc||"").join(" ");
 const content=lessons.map(x=>`${x.tenBaiHoc||""} ${x.noiDungBaiHoc||""}`).join(" ");

 // Ưu tiên bộ môn ghi trực tiếp trên EMS.
 if(/ROBOTIC/i.test(activity)) return "Robotics";
 if(/CODING/i.test(activity)) return "Coding";

 // Chỉ dùng nội dung bài học làm phương án dự phòng.
 if(/LEGO|Spike|robot|cảm biến|động cơ|lắp ráp/i.test(content)) return "Robotics";
 if(/Scratch|lập trình|tọa độ|khối lệnh|key pressed|nhân vật/i.test(content)) return "Coding";
 return "Coding / Robotics";
}
function selectedTeacher(){
 return $("#teacher").value==="__custom__" ? $("#teacherCustom").value.trim() : $("#teacher").value;
}
function selectedCenter(){
 return $("#center").value==="__custom__" ? $("#centerCustom").value.trim() : $("#center").value;
}
function addOption(select,value,beforeCustom=true){
 if(!value || [...select.options].some(o=>o.value===value)) return;
 const o=new Option(value,value);
 const custom=[...select.options].find(x=>x.value==="__custom__");
 if(beforeCustom && custom) select.insertBefore(o,custom); else select.add(o);
}

function renderCriteria(){
 const tbody=$("#criteriaBody");
 if(!tbody)return;
 tbody.innerHTML="";
 criteria.forEach(name=>{
   const tr=document.createElement("tr");
   tr.innerHTML=`<td>${esc(name)}</td>${[1,2,3,4,5].map(n=>`<td><span class="score-circle ${Number(scoreState[name])===n?"selected":""}" data-score="${n}" aria-label="${n}"></span></td>`).join("")}`;
   tbody.appendChild(tr);
 });
}
function renderStudent(){
 if(!DATA||!current)return;
 const s=DATA.hocVien.find(x=>x.tenHocVien===current); if(!s)return;
 const sub=subject(), a=AI[current]||{};
 $("#rTeacher").textContent=selectedTeacher()||"—";
 $("#rCenter").textContent=selectedCenter()||"—";
 $("#rStudent").textContent=s.tenHocVien;
 $("#rClass").textContent=DATA.tenLop||"—";
 $("#rSubject").textContent=sub;
 $("#rMonth").textContent=DATA.thang||"—";
 $("#rDuration").textContent=`${DATA.soBuoi||4} buổi • 60 phút / buổi`;
 $("#skillHeading").textContent=sub==="Coding"?"Kỹ năng lập trình":sub==="Robotics"?"Kỹ năng Robotics":"Kỹ năng theo bộ môn";

 const lessons=DATA.noiDungThang||[];
 $("#monthlyLessons").innerHTML=lessons.map((x,i)=>`<div class="month-lesson"><b>Tuần ${i+1} • ${esc(x.ngayHoc)} — ${esc(x.tenBaiHoc)}</b><span>${esc((x.noiDungBaiHoc||"").replace(/\n+/g," ").slice(0,165))}${(x.noiDungBaiHoc||"").length>165?"…":""}</span></div>`).join("");

 const labels=["Tư duy Logic trong lập trình","Phân tích & xử lý vấn đề","Khả năng sáng tạo","Tiếp thu kiến thức & ghi nhớ","Khả năng làm việc nhóm"];
 const p=a.chuyenMon||[];
 $("#professionalList").innerHTML=labels.map((x,i)=>`<div class="pro-card"><b>${x}:</b> ${esc(p[i]||"—")}</div>`).join("");

 $("#knowledgeText").innerHTML=esc(a.kienThucLapTrinh||"—").replace(/\n/g,"<br>");
 $("#roboticsText").innerHTML=esc(a.kyNangRobotics||"—").replace(/\n/g,"<br>");
 $("#projectText").innerHTML=esc(a.sanPhamDuAn||"—").replace(/\n/g,"<br>");
 document.querySelectorAll('input[name="completion"]').forEach(x=>x.checked=(x.value===a.mucDoHoanThien));
 Object.keys(scoreState).forEach(k=>delete scoreState[k]);
 if(a.diemTieuChi)Object.entries(a.diemTieuChi).forEach(([k,v])=>scoreState[k]=v);
 renderCriteria();
}
const DEFAULT_CENTERS = [
 "Bình Tân",
 "Hòa Bình",
 "Bàu Cát",
 "Phạm Hùng",
 "Dĩ An"
];
const savedTeachers=JSON.parse(localStorage.getItem("oiec_custom_teachers")||"[]");
const savedCenters=JSON.parse(localStorage.getItem("oiec_centers")||"[]");
savedTeachers.forEach(x=>addOption($("#teacher"),x));
[...DEFAULT_CENTERS,...savedCenters].forEach(x=>addOption($("#center"),x));

function saveCustom(kind,value){
 if(!value)return;
 const key=kind==="teacher"?"oiec_custom_teachers":"oiec_centers";
 const arr=JSON.parse(localStorage.getItem(key)||"[]");
 if(!arr.includes(value)){arr.push(value);localStorage.setItem(key,JSON.stringify(arr))}
}

$("#teacher").onchange=()=>{
 const custom=$("#teacher").value==="__custom__";
 $("#teacherCustom").style.display=custom?"block":"none";
 if(!custom)localStorage.setItem("oiec_teacher",$("#teacher").value);
 saveCurrentMeta(); renderStudent();
};
$("#teacherCustom").oninput=()=>{
 const v=$("#teacherCustom").value.trim();
 localStorage.setItem("oiec_teacher_custom",v);
 saveCurrentMeta(); renderStudent();
};
$("#teacherCustom").onchange=()=>{
 const v=$("#teacherCustom").value.trim();
 if(v){saveCustom("teacher",v);addOption($("#teacher"),v);$("#teacher").value=v;$("#teacherCustom").style.display="none";localStorage.setItem("oiec_teacher",v);renderStudent()}
};

$("#center").onchange=()=>{
 const custom=$("#center").value==="__custom__";
 $("#centerCustom").style.display=custom?"block":"none";
 if(!custom)localStorage.setItem("oiec_center",$("#center").value);
 saveCurrentMeta(); renderStudent();
};
$("#centerCustom").oninput=()=>{
 const v=$("#centerCustom").value.trim();
 localStorage.setItem("oiec_center_custom",v);
 saveCurrentMeta(); renderStudent();
};
$("#centerCustom").onchange=()=>{
 const v=$("#centerCustom").value.trim();
 if(v){saveCustom("center",v);addOption($("#center"),v);$("#center").value=v;$("#centerCustom").style.display="none";localStorage.setItem("oiec_center",v);renderStudent()}
};

const oldTeacher=localStorage.getItem("oiec_teacher")||"";
if(oldTeacher){addOption($("#teacher"),oldTeacher);$("#teacher").value=oldTeacher}
const oldCenter=localStorage.getItem("oiec_center")||"";
if(oldCenter){addOption($("#center"),oldCenter);$("#center").value=oldCenter}
$("#jsonFile").onchange=async e=>{
 try{
  const files=[...e.target.files];
  if(!files.length)return;
  const loaded=[];
  for(const f of files){
   const d=JSON.parse(await f.text());
   if(d.loaiBaoCao!=="KAPLA_OIEC_MONTHLY")throw Error(`${f.name}: không đúng JSON OIEC Monthly.`);
   if(!Array.isArray(d.hocVien)||!d.hocVien.length)throw Error(`${f.name}: không có học viên.`);
   loaded.push(d);
  }
  CLASSES=loaded;
  CLASS_AI={};
  CLASS_META={};
  for(const d of CLASSES){
   const k=classKey(d);
   try{CLASS_AI[k]=JSON.parse(localStorage.getItem(`oiec_ai_${k}`)||"{}")}catch(_){CLASS_AI[k]={}}
   CLASS_META[k]={
    teacher:localStorage.getItem(`oiec_teacher_${k}`)||selectedTeacher()||"",
    center:localStorage.getItem(`oiec_center_${k}`)||selectedCenter()||""
   };
  }
  const cs=$("#classSelect");
  cs.disabled=false;
  cs.innerHTML=CLASSES.map(d=>`<option value="${esc(classKey(d))}">${esc(d.tenLop)} • ${esc(d.thang)}</option>`).join("");
  currentClassKey=classKey(CLASSES[0]); cs.value=currentClassKey;
  cs.onchange=()=>{
   saveCurrentMeta();
   if(DATA){
    const oldk=classKey(DATA),m=CLASS_META[oldk]||{};
    localStorage.setItem(`oiec_teacher_${oldk}`,m.teacher||"");
    localStorage.setItem(`oiec_center_${oldk}`,m.center||"");
   }
   currentClassKey=cs.value; syncCurrentClass();
  };
  $("#studentSelect").onchange=()=>{current=$("#studentSelect").value;renderStudent()};
  syncCurrentClass();
  $("#aiBtn").disabled=false;$("#printBtn").disabled=false;
  alert(`Đã nhập ${CLASSES.length} lớp • ${CLASSES.reduce((n,d)=>n+d.hocVien.length,0)} học viên.`);
 }catch(err){alert("Không đọc được JSON: "+err.message)}
};

$("#aiBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){
   alert("Generate AI cần chạy bản deploy trên Vercel.");
   return;
 }
 saveCurrentMeta();
 const btn=$("#aiBtn"),old=btn.textContent;
 btn.disabled=true;
 let done=0,total=CLASSES.reduce((n,d)=>n+d.hocVien.length,0),failed=[];
 try{
  for(let ci=0;ci<CLASSES.length;ci++){
   const d=CLASSES[ci],k=classKey(d);
   DATA=d;
   btn.textContent=`AI ${ci+1}/${CLASSES.length} lớp • ${done}/${total} học viên...`;
   const r=await fetch("/api/generate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({data:d,subject:subject()})
   });
   const out=await r.json();
   if(!r.ok){failed.push(`${d.tenLop}: ${out.error||"lỗi AI"}`);continue}
   CLASS_AI[k]=out.students||{};
   localStorage.setItem(`oiec_ai_${k}`,JSON.stringify(CLASS_AI[k]));
   done+=Object.keys(CLASS_AI[k]).length;
  }
  currentClassKey=$("#classSelect").value;
  syncCurrentClass();
  if(failed.length) alert(`Đã tạo AI ${done}/${total} học viên.\n\nLớp lỗi:\n${failed.join("\n")}`);
  else alert(`Đã tạo AI xong ${CLASSES.length} lớp • ${done}/${total} học viên.`);
 }catch(e){alert("Generate AI lỗi: "+e.message)}
 finally{btn.disabled=false;btn.textContent=old}
};

function safeFileName(name){
 return String(name||"Hoc vien").replace(/[\\/:*?"<>|]/g,"").trim()||"Hoc vien";
}
function waitFrame(){return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}

function getAllCSS(){
 let css="";
 for(const sheet of [...document.styleSheets]){
   try{for(const rule of [...sheet.cssRules])css+=rule.cssText+"\n"}catch(e){}
 }
 return css;
}

function reportHTML(){
 const report=$("#report").cloneNode(true);
 report.classList.add("pdf-server");
 const css=getAllCSS();
 return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<style>
${css}
html,body{margin:0!important;padding:0!important;background:#fff!important}
body{display:block!important}
.report{width:210mm!important;min-height:297mm!important;margin:0!important;box-shadow:none!important;border-radius:0!important}
.topbar,.workspace>.side-panel{display:none!important}
@page{size:A4;margin:0}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
</style>
</head>
<body>${report.outerHTML}</body>
</html>`;
}

async function downloadClassZip(d,classIndex,totalClasses){
 const k=classKey(d);
 DATA=d; AI=CLASS_AI[k]||{};
 currentClassKey=k;
 const reports=[];
 for(let i=0;i<d.hocVien.length;i++){
   const name=d.hocVien[i].tenHocVien;
   $("#printBtn").textContent=`ZIP ${classIndex}/${totalClasses} • ${i+1}/${d.hocVien.length}`;
   current=name; renderStudent(); await waitFrame();
   reports.push({name,html:reportHTML()});
 }
 const zipName=classCode(d.tenLop);
 const r=await fetch("/api/pdfzip",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({reports,zipName})
 });
 if(!r.ok){
   let msg=`Không tạo được ZIP ${zipName}.`;
   try{const j=await r.json();msg=j.error||msg}catch(_){}
   throw Error(msg);
 }
 const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=`${zipName}.zip`;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
 await new Promise(r=>setTimeout(r,500));
}

$("#printBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){
   alert("Xuất ZIP PDF cần chạy bản đã deploy trên Vercel.");
   return;
 }
 saveCurrentMeta();
 const btn=$("#printBtn"),old=btn.textContent;
 const oldKey=currentClassKey,oldStudent=current;
 btn.disabled=true;
 try{
   for(let i=0;i<CLASSES.length;i++) await downloadClassZip(CLASSES[i],i+1,CLASSES.length);
   alert(`Đã tạo ${CLASSES.length} ZIP riêng theo từng lớp.`);
 }catch(e){alert(e.message)}
 finally{
   currentClassKey=oldKey;DATA=CLASSES.find(x=>classKey(x)===oldKey)||CLASSES[0];
   AI=CLASS_AI[currentClassKey]||{};current=oldStudent||DATA.hocVien[0]?.tenHocVien;
   $("#classSelect").value=currentClassKey;syncCurrentClass();
   if(DATA.hocVien.some(x=>x.tenHocVien===oldStudent)){current=oldStudent;$("#studentSelect").value=current;renderStudent()}
   btn.disabled=false;btn.textContent=old;
 }
};

renderCriteria();