const $=s=>document.querySelector(s);
let DATA=null, AI={}, current=null;
let CLASSES=[], CLASS_AI={}, CLASS_META={}, currentClassKey=null;
let MANUAL={};
const criteria=["Thái độ & tinh thần học tập","Kỹ năng hợp tác & giao tiếp","Kỹ năng thực hành & sáng tạo","Tính kiên trì & tự giác","Khả năng tiếp thu & vận dụng kiến thức","Tiến bộ cá nhân & đạo đức"];
const scoreState={};
function esc(s){return String(s??"").replace(/[&<>"\']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#039;"}[m]))}

function classKey(d){return `${d?.tenLop||"Lop"}__${d?.thang||""}`}
function classCode(name){
 const s=String(name||"LOP").trim();
 // EMS có thể thêm nhóm tuổi sau mã lớp, ví dụ:
 // TC-KPRBT03-0029 (>= 7 tuổi) -> TC-KPRBT03-0029
 // TC-KPRBT03-0028 (5 - 6 tuổi) -> TC-KPRBT03-0028
 const withoutAge=s.replace(/\s*\([^)]*(?:tuổi|tuoi)[^)]*\)\s*$/i,"").trim();
 // Ưu tiên toàn bộ mã có dấu gạch nối, không chỉ phần KPRBT03.
 const m=withoutAge.match(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/);
 return safeFileName(m?m[0]:withoutAge);
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
 if(DATA?.__manualSubject)return DATA.__manualSubject;
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
 const sub=subject();
 const baseAI=AI[current]||{};
 const manual=MANUAL[currentClassKey]?.[current]||{};
 const a={...baseAI,...manual,diemTieuChi:{...(baseAI.diemTieuChi||{}),...(manual.diemTieuChi||{})}};
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
 document.querySelectorAll('input[name="completion"]').forEach(x=>{
   const yes=x.value===a.mucDoHoanThien;
   x.checked=yes;
   if(yes)x.setAttribute("checked","checked"); else x.removeAttribute("checked");
 });
 document.querySelectorAll('.completion label').forEach(lab=>{
   if(lab.textContent.trim()==="Đạt tối thiểu") lab.style.display="none";
 });
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

function saveManual(){
 if(!currentClassKey||!current)return;
 localStorage.setItem(`oiec_manual_${currentClassKey}`,JSON.stringify(MANUAL[currentClassKey]||{}));
}
function manualStudent(){
 MANUAL[currentClassKey]??={};
 MANUAL[currentClassKey][current]??={};
 return MANUAL[currentClassKey][current];
}
document.addEventListener("click",e=>{
 const circle=e.target.closest(".score-circle");
 if(circle && DATA && current){
   const row=circle.closest("tr");
   const criterion=row?.querySelector("td:first-child")?.textContent?.trim();
   const score=Number(circle.dataset.score);
   if(criterion && score>=1 && score<=5){
     const m=manualStudent();m.diemTieuChi??={};m.diemTieuChi[criterion]=score;
     saveManual();renderStudent();
   }
   return;
 }
 const lab=e.target.closest(".completion label");
 if(lab && DATA && current){
   const value=lab.textContent.trim();
   if(["Đúng yêu cầu","Có sáng tạo"].includes(value)){
     manualStudent().mucDoHoanThien=value;
     saveManual();renderStudent();
   }
 }
});

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
   try{MANUAL[k]=JSON.parse(localStorage.getItem(`oiec_manual_${k}`)||"{}")}catch(_){MANUAL[k]={}}
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
  $("#aiBtn").disabled=false;$("#editBtn").disabled=false;$("#printBtn").disabled=false;
  alert(`Đã nhập ${CLASSES.length} lớp • ${CLASSES.reduce((n,d)=>n+d.hocVien.length,0)} học viên.`);
 }catch(err){alert("Không đọc được JSON: "+err.message)}
};



function editHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function editField(label,name,value,full=false,area=false){const v=editHtml(value);return `<div class="edit-field ${full?"full":""}"><label>${label}</label>${area?`<textarea name="${name}">${v}</textarea>`:`<input name="${name}" value="${v}">`}</div>`}
function openEdit(){
 if(!DATA||!current)return;
 const a={...(AI[current]||{}),...(MANUAL[currentClassKey]?.[current]||{})},p=a.chuyenMon||[];
 let h='<div class="edit-section">Thông tin chung</div>';
 h+=editField("Tên học viên","student",current)+editField("Lớp","className",DATA.tenLop)+editField("Giáo viên","teacher",selectedTeacher())+editField("Center","center",selectedCenter())+editField("Bộ môn","subject",subject())+editField("Tháng","month",DATA.thang);
 h+='<div class="edit-section">Nội dung học trong tháng</div>';
 (DATA.noiDungThang||[]).forEach((x,i)=>{h+=editField(`Tuần ${i+1} - Ngày học`,`date_${i}`,x.ngayHoc)+editField(`Tuần ${i+1} - Tên bài`,`title_${i}`,x.tenBaiHoc)+editField(`Tuần ${i+1} - Nội dung`,`content_${i}`,x.noiDungBaiHoc,true,true)});
 h+='<div class="edit-section">Đánh giá chuyên môn</div>';
 ["Tư duy Logic","Phân tích & xử lý vấn đề","Khả năng sáng tạo","Tiếp thu & ghi nhớ","Làm việc nhóm"].forEach((x,i)=>h+=editField(x,`pro_${i}`,p[i]||"",true,true));
 h+='<div class="edit-section">Năng lực & sản phẩm</div>';
 h+=editField("Kiến thức - Lập trình","knowledge",a.kienThucLapTrinh||"",true,true)+editField("Kỹ năng bộ môn","skill",a.kyNangRobotics||"",true,true)+editField("Sản phẩm / Dự án","project",a.sanPhamDuAn||"",true,true);
 $("#editForm").innerHTML=h;$("#editModal").hidden=false;
}
function closeEdit(){$("#editModal").hidden=true}
function saveEdit(){
 try{
  const editBox=$("#editForm"),oldStudent=current,oldKey=currentClassKey;
  // Không dùng FormData: editForm là DIV. Đọc trực tiếp giá trị input/textarea đang hiển thị.
  const get=name=>{const el=editBox.querySelector(`[name="${name}"]`);return el?el.value:""};
  const newName=String(get("student")||oldStudent).trim()||oldStudent;
  const st=DATA.hocVien.find(x=>x.tenHocVien===oldStudent);if(!st)throw Error("Không tìm thấy học viên hiện tại.");

  // Lưu nội dung trước khi đổi key lớp/tháng.
  MANUAL[oldKey]??={};
  const oldManual=MANUAL[oldKey][oldStudent]??={};
  oldManual.chuyenMon=[0,1,2,3,4].map(i=>String(get(`pro_${i}`)||"").trim());
  oldManual.kienThucLapTrinh=String(get("knowledge")||"").trim();
  oldManual.kyNangRobotics=String(get("skill")||"").trim();
  oldManual.sanPhamDuAn=String(get("project")||"").trim();

  if(newName!==oldStudent){
   if(DATA.hocVien.some(x=>x!==st&&x.tenHocVien===newName))throw Error("Tên học viên đã tồn tại.");
   st.tenHocVien=newName;
   if(CLASS_AI[oldKey]?.[oldStudent]){CLASS_AI[oldKey][newName]=CLASS_AI[oldKey][oldStudent];delete CLASS_AI[oldKey][oldStudent]}
   MANUAL[oldKey][newName]=oldManual;delete MANUAL[oldKey][oldStudent];current=newName;
  }

  DATA.tenLop=String(get("className")||DATA.tenLop).trim();
  DATA.thang=String(get("month")||DATA.thang).trim();
  DATA.__manualSubject=String(get("subject")||"").trim();
  (DATA.noiDungThang||[]).forEach((x,i)=>{x.ngayHoc=String(get(`date_${i}`)||"").trim();x.tenBaiHoc=String(get(`title_${i}`)||"").trim();x.noiDungBaiHoc=String(get(`content_${i}`)||"").trim()});

  const teacher=String(get("teacher")||"").trim(),center=String(get("center")||"").trim();
  const newKey=classKey(DATA);

  // Nếu sửa lớp/tháng thì chuyển toàn bộ cache/meta/manual sang key mới.
  if(newKey!==oldKey){
   CLASS_AI[newKey]=CLASS_AI[oldKey]||{};delete CLASS_AI[oldKey];
   MANUAL[newKey]=MANUAL[oldKey]||{};delete MANUAL[oldKey];
   CLASS_META[newKey]=CLASS_META[oldKey]||{};delete CLASS_META[oldKey];
   localStorage.removeItem(`oiec_ai_${oldKey}`);localStorage.removeItem(`oiec_manual_${oldKey}`);localStorage.removeItem(`oiec_teacher_${oldKey}`);localStorage.removeItem(`oiec_center_${oldKey}`);
   currentClassKey=newKey;
  }
  CLASS_META[currentClassKey]??={};CLASS_META[currentClassKey].teacher=teacher;CLASS_META[currentClassKey].center=center;
  addOption($("#teacher"),teacher);addOption($("#center"),center);$("#teacher").value=teacher;$("#center").value=center;
  AI=CLASS_AI[currentClassKey]||{};
  localStorage.setItem(`oiec_ai_${currentClassKey}`,JSON.stringify(AI));
  localStorage.setItem(`oiec_manual_${currentClassKey}`,JSON.stringify(MANUAL[currentClassKey]||{}));
  localStorage.setItem(`oiec_teacher_${currentClassKey}`,teacher);localStorage.setItem(`oiec_center_${currentClassKey}`,center);

  // Rebuild dropdowns because class/month/name may have changed.
  $("#classSelect").innerHTML=CLASSES.map(d=>`<option value="${esc(classKey(d))}">${esc(d.tenLop)} • ${esc(d.thang)}</option>`).join("");
  $("#classSelect").value=currentClassKey;
  $("#studentSelect").innerHTML=DATA.hocVien.map(x=>`<option>${esc(x.tenHocVien)}</option>`).join("");$("#studentSelect").value=current;
  $("#classInfo").textContent=DATA.tenLop||"—";$("#monthInfo").textContent=DATA.thang||"—";$("#sessionsInfo").textContent=DATA.soBuoi||0;$("#subjectInfo").textContent=subject();
  $("#lessonList").innerHTML=(DATA.noiDungThang||[]).map(x=>`<div class="lesson-item"><b>${esc(x.ngayHoc)} • ${esc(x.tenBaiHoc)}</b>${esc(x.noiDungBaiHoc)}</div>`).join("");
  closeEdit();renderStudent();
 }catch(e){alert("Không lưu được: "+e.message)}
}
$("#editBtn").onclick=openEdit;$("#editClose").onclick=closeEdit;$("#editCancel").onclick=closeEdit;$("#editSave").onclick=saveEdit;
$("#editModal").addEventListener("click",e=>{if(e.target===$("#editModal"))closeEdit()});
let FAILED_BATCHES=[];

function subjectOfData(d){
 if(d?.__manualSubject)return d.__manualSubject;
 const lessons=(d?.noiDungThang||[]);
 const activity=lessons.map(x=>x.tenBuoiHoc||"").join(" ");
 const content=lessons.map(x=>`${x.tenBaiHoc||""} ${x.noiDungBaiHoc||""}`).join(" ");
 if(/ROBOTIC/i.test(activity))return "Robotics";
 if(/CODING/i.test(activity))return "Coding";
 if(/LEGO|Spike|robot|cảm biến|động cơ|lắp ráp/i.test(content))return "Robotics";
 if(/Scratch|lập trình|tọa độ|khối lệnh|key pressed|nhân vật/i.test(content))return "Coding";
 return "Coding / Robotics";
}

function renderFailedBatches(){
 const box=$("#failedBatchBox");
 if(!box)return;
 box.innerHTML="";
 if(!FAILED_BATCHES.length){box.hidden=true;return}
 box.hidden=false;
 FAILED_BATCHES.forEach((f,idx)=>{
   const b=document.createElement("button");
   b.className="retry-batch-btn";
   b.textContent=`Retry ${f.className} • Batch ${f.batch} (${f.names.length} bé)`;
   b.title=f.names.join(", ");
   b.onclick=()=>retryFailedBatch(idx,b);
   box.appendChild(b);
 });
}

async function retryFailedBatch(index,button){
 const f=FAILED_BATCHES[index];if(!f)return;
 const d=CLASSES.find(x=>classKey(x)===f.classKey);if(!d)return alert("Không tìm thấy lớp của batch.");
 const exactStudents=f.names.map(n=>d.hocVien.find(s=>s.tenHocVien===n)).filter(Boolean);
 if(!exactStudents.length)return alert("Không tìm thấy học viên của batch.");
 const old=button?.textContent||"Retry";if(button){button.disabled=true;button.textContent="Đang retry..."}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),24000);
 try{
  const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:{...d,hocVien:exactStudents},subject:subjectOfData(d),batch:f.batch}),signal:controller.signal});
  const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){throw Error(raw.slice(0,180)||`HTTP ${r.status}`)}
  if(!r.ok||out.error)throw Error(out.error||`HTTP ${r.status}`);
  const got=out.students||{},missing=exactStudents.filter(s=>!got[s.tenHocVien]).map(s=>s.tenHocVien);
  if(missing.length)throw Error(`AI thiếu kết quả: ${missing.join(", ")}`);
  CLASS_AI[f.classKey]={...(CLASS_AI[f.classKey]||{}),...got};localStorage.setItem(`oiec_ai_${f.classKey}`,JSON.stringify(CLASS_AI[f.classKey]));
  FAILED_BATCHES.splice(index,1);renderFailedBatches();currentClassKey=$("#classSelect").value;syncCurrentClass();
 }catch(e){f.error=e?.name==="AbortError"?"Request quá 24 giây":e.message;renderFailedBatches();alert(`Retry batch lỗi: ${f.error}`)}
 finally{clearTimeout(timer)}
}

$("#aiBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){alert("Generate AI cần chạy bản deploy trên Vercel.");return}
 saveCurrentMeta();const btn=$("#aiBtn"),old=btn.textContent;btn.disabled=true;FAILED_BATCHES=[];renderFailedBatches();
 const jobs=[];for(const d of CLASSES){const k=classKey(d);for(let i=0;i<d.hocVien.length;i+=5)jobs.push({classKey:k,className:d.tenLop,data:d,batch:Math.floor(i/5)+1,students:d.hocVien.slice(i,i+5)})}
 const WORKERS=Math.min(2,jobs.length);let next=0,done=0,finished=0;const total=CLASSES.reduce((n,d)=>n+d.hocVien.length,0);
 const update=()=>btn.textContent=`AI ${finished}/${jobs.length} batch • ${done}/${total} học viên • ${WORKERS} luồng`;
 function fail(job,error){FAILED_BATCHES.push({classKey:job.classKey,className:job.className,batch:job.batch,names:job.students.map(s=>s.tenHocVien),error:error||"lỗi AI"});renderFailedBatches()}
 async function run(job){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),24000);
  try{
   const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:{...job.data,hocVien:job.students},subject:subjectOfData(job.data),batch:job.batch}),signal:controller.signal});
   const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){throw Error(raw.slice(0,180)||`HTTP ${r.status}`)}
   if(!r.ok||out.error)throw Error(out.error||`HTTP ${r.status}`);
   const got=out.students||{},missing=job.students.filter(s=>!got[s.tenHocVien]).map(s=>s.tenHocVien);if(missing.length)throw Error(`AI thiếu kết quả: ${missing.join(", ")}`);
   CLASS_AI[job.classKey]={...(CLASS_AI[job.classKey]||{}),...got};localStorage.setItem(`oiec_ai_${job.classKey}`,JSON.stringify(CLASS_AI[job.classKey]));done+=Object.keys(got).length;
  }catch(e){fail(job,e?.name==="AbortError"?"Request quá 24 giây":e.message)}
  finally{clearTimeout(timer);finished++;update()}
 }
 async function worker(){while(true){const i=next++;if(i>=jobs.length)return;await run(jobs[i])}}
 try{update();await Promise.all(Array.from({length:WORKERS},()=>worker()));currentClassKey=$("#classSelect").value;syncCurrentClass();renderFailedBatches();if(FAILED_BATCHES.length)alert(`Đã tạo AI ${done}/${total} học viên.\nCó ${FAILED_BATCHES.length} batch lỗi — bấm Retry đúng batch.`);else alert(`Đã tạo AI xong ${done}/${total} học viên.`)}
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
 document.querySelectorAll('input[name="completion"]').forEach(x=>{
   if(x.checked)x.setAttribute("checked","checked"); else x.removeAttribute("checked");
 });
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
 if(!MANUAL[k]){
   try{MANUAL[k]=JSON.parse(localStorage.getItem(`oiec_manual_${k}`)||"{}")}catch(_){MANUAL[k]={}}
 }
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