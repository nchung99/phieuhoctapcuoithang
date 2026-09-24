const $=s=>document.querySelector(s);
let DATA=null, AI={}, current=null;
const criteria=["Thái độ & tinh thần học tập","Kỹ năng hợp tác & giao tiếp","Kỹ năng thực hành & sáng tạo","Tính kiên trì & tự giác","Khả năng tiếp thu & vận dụng kiến thức","Tiến bộ cá nhân & đạo đức"];
const scoreState={};
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
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
 renderStudent();
};
$("#teacherCustom").oninput=()=>{
 const v=$("#teacherCustom").value.trim();
 localStorage.setItem("oiec_teacher_custom",v);
 renderStudent();
};
$("#teacherCustom").onchange=()=>{
 const v=$("#teacherCustom").value.trim();
 if(v){saveCustom("teacher",v);addOption($("#teacher"),v);$("#teacher").value=v;$("#teacherCustom").style.display="none";localStorage.setItem("oiec_teacher",v);renderStudent()}
};

$("#center").onchange=()=>{
 const custom=$("#center").value==="__custom__";
 $("#centerCustom").style.display=custom?"block":"none";
 if(!custom)localStorage.setItem("oiec_center",$("#center").value);
 renderStudent();
};
$("#centerCustom").oninput=()=>{
 const v=$("#centerCustom").value.trim();
 localStorage.setItem("oiec_center_custom",v);
 renderStudent();
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
  DATA=JSON.parse(await e.target.files[0].text());
  if(DATA.loaiBaoCao!=="KAPLA_OIEC_MONTHLY")throw Error("Không đúng JSON OIEC Monthly.");
  $("#classInfo").textContent=DATA.tenLop||"—";$("#monthInfo").textContent=DATA.thang||"—";$("#sessionsInfo").textContent=DATA.soBuoi||0;$("#subjectInfo").textContent=subject();
  $("#lessonList").classList.remove("empty");$("#lessonList").innerHTML=(DATA.noiDungThang||[]).map(x=>`<div class="lesson-item"><b>${esc(x.ngayHoc)} • ${esc(x.tenBaiHoc)}</b>${esc(x.noiDungBaiHoc)}</div>`).join("");
  const sel=$("#studentSelect");sel.disabled=false;sel.innerHTML=DATA.hocVien.map(x=>`<option>${esc(x.tenHocVien)}</option>`).join("");current=DATA.hocVien[0]?.tenHocVien||null;sel.value=current;sel.onchange=()=>{current=sel.value;renderStudent()};
  $("#aiBtn").disabled=false;$("#printBtn").disabled=false;renderStudent();
 }catch(err){alert("Không đọc được JSON: "+err.message)}
};
$("#aiBtn").onclick=async()=>{
 if(!DATA?.hocVien?.length)return;
 if(location.protocol==="file:"){
   alert("Generate AI cần chạy bản deploy trên Vercel để gọi /api/generate. Mở file local vẫn dùng để kiểm tra giao diện/import JSON.");
   return;
 }
 const btn=$("#aiBtn");
 btn.disabled=true;
 const old=btn.textContent;
 try{
   btn.textContent=`AI đang xử lý ${DATA.hocVien.length} học viên...`;
   const r=await fetch("/api/generate",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({data:DATA,subject:subject()})
   });
   const out=await r.json();
   if(!r.ok)throw Error(out.error||"Không tạo được nhận xét AI.");
   AI=out.students||{};
   localStorage.setItem(`oiec_ai_${DATA.tenLop}_${DATA.thang}`,JSON.stringify(AI));
   renderStudent();
   alert(`Đã tạo đánh giá AI cho ${Object.keys(AI).length}/${DATA.hocVien.length} học viên.`);
 }catch(e){
   alert("Generate AI lỗi: "+e.message);
 }finally{
   btn.disabled=false;
   btn.textContent=old;
 }
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

$("#printBtn").onclick=async()=>{
 if(!DATA?.hocVien?.length)return;

 if(location.protocol==="file:"){
   alert("Xuất ZIP PDF HTML/CSS cần chạy bản đã deploy trên Vercel. Mở bằng file:// vẫn nhập JSON/test giao diện được, nhưng Chrome không cho trang local gọi API tạo PDF.");
   return;
 }

 const btn=$("#printBtn"),oldCurrent=current;
 btn.disabled=true;
 try{
   const reports=[];
   for(let i=0;i<DATA.hocVien.length;i++){
     const name=DATA.hocVien[i].tenHocVien;
     btn.textContent=`Chuẩn bị ${i+1}/${DATA.hocVien.length}...`;
     current=name;$("#studentSelect").value=name;renderStudent();
     await waitFrame();
     reports.push({name,html:reportHTML()});
   }

   btn.textContent="Đang tạo ZIP PDF...";
   const r=await fetch("/api/pdfzip",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({reports})
   });

   if(!r.ok){
     let msg="Không tạo được ZIP PDF.";
     try{const j=await r.json();msg=j.error||msg}catch(e){}
     throw Error(msg);
   }

   const blob=await r.blob();
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;
   a.download=`OIEC-${safeFileName(DATA.tenLop)}-${safeFileName(DATA.thang).replace("/","-")}.zip`;
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){
   alert(e.message);
 }finally{
   current=oldCurrent||DATA.hocVien[0]?.tenHocVien;
   $("#studentSelect").value=current;renderStudent();
   btn.disabled=false;btn.textContent="Tải ZIP PDF";
 }
};
renderCriteria();