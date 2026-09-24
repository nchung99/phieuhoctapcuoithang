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
  $("#aiBtn").disabled=false;$("#printBtn").disabled=false;
  alert(`Đã nhập ${CLASSES.length} lớp • ${CLASSES.reduce((n,d)=>n+d.hocVien.length,0)} học viên.`);
 }catch(err){alert("Không đọc được JSON: "+err.message)}
};



function ef(label,name,value,full=false,area=false){const v=String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");return `<div class="ef ${full?"full":""}"><label>${label}</label>${area?`<textarea name="${name}">${v}</textarea>`:`<input name="${name}" value="${v}">`}</div>`}
function openEditor(){if(!DATA||!current)return;const a={...(AI[current]||{}),...(MANUAL[currentClassKey]?.[current]||{})},p=a.chuyenMon||[];let h='<div class="es">Thông tin chung</div>';h+=ef("Tên học viên","student",current)+ef("Lớp","class",DATA.tenLop)+ef("Giáo viên","teacher",selectedTeacher())+ef("Center","center",selectedCenter())+ef("Bộ môn","subject",subject())+ef("Tháng","month",DATA.thang);h+='<div class="es">Nội dung học trong tháng</div>';(DATA.noiDungThang||[]).forEach((x,i)=>{h+=ef(`Tuần ${i+1} - Ngày`,`date_${i}`,x.ngayHoc)+ef(`Tuần ${i+1} - Tên bài`,`title_${i}`,x.tenBaiHoc)+ef(`Tuần ${i+1} - Nội dung`,`content_${i}`,x.noiDungBaiHoc,true,true)});h+='<div class="es">Đánh giá chuyên môn</div>';["Tư duy Logic","Phân tích & xử lý vấn đề","Khả năng sáng tạo","Tiếp thu & ghi nhớ","Làm việc nhóm"].forEach((x,i)=>h+=ef(x,`pro_${i}`,p[i]||"",true,true));h+='<div class="es">Năng lực & sản phẩm</div>';h+=ef("Kiến thức - Lập trình","knowledge",a.kienThucLapTrinh||"",true,true)+ef("Kỹ năng bộ môn","skill",a.kyNangRobotics||"",true,true)+ef("Sản phẩm / Dự án","project",a.sanPhamDuAn||"",true,true);$("#editForm").innerHTML=h;$("#editModal").hidden=false}
function closeEditor(){$("#editModal").hidden=true}
function saveEditor(){const f=new FormData($("#editForm")),old=current,newName=String(f.get("student")||old).trim()||old,st=DATA.hocVien.find(x=>x.tenHocVien===old);if(newName!==old&&!DATA.hocVien.some(x=>x.tenHocVien===newName)){st.tenHocVien=newName;if(AI[old]){AI[newName]=AI[old];delete AI[old]}if(MANUAL[currentClassKey]?.[old]){MANUAL[currentClassKey][newName]=MANUAL[currentClassKey][old];delete MANUAL[currentClassKey][old]}current=newName}DATA.tenLop=String(f.get("class")||DATA.tenLop).trim();DATA.thang=String(f.get("month")||DATA.thang).trim();DATA.__manualSubject=String(f.get("subject")||"").trim();const teacher=String(f.get("teacher")||"").trim(),center=String(f.get("center")||"").trim();CLASS_META[currentClassKey]??={};CLASS_META[currentClassKey].teacher=teacher;CLASS_META[currentClassKey].center=center;addOption($("#teacher"),teacher);addOption($("#center"),center);$("#teacher").value=teacher;$("#center").value=center;localStorage.setItem(`oiec_teacher_${currentClassKey}`,teacher);localStorage.setItem(`oiec_center_${currentClassKey}`,center);(DATA.noiDungThang||[]).forEach((x,i)=>{x.ngayHoc=String(f.get(`date_${i}`)||"").trim();x.tenBaiHoc=String(f.get(`title_${i}`)||"").trim();x.noiDungBaiHoc=String(f.get(`content_${i}`)||"").trim()});MANUAL[currentClassKey]??={};const m=MANUAL[currentClassKey][current]??={};m.chuyenMon=[0,1,2,3,4].map(i=>String(f.get(`pro_${i}`)||"").trim());m.kienThucLapTrinh=String(f.get("knowledge")||"").trim();m.kyNangRobotics=String(f.get("skill")||"").trim();m.sanPhamDuAn=String(f.get("project")||"").trim();saveManual();localStorage.setItem(`oiec_ai_${currentClassKey}`,JSON.stringify(AI));$("#studentSelect").innerHTML=DATA.hocVien.map(x=>`<option>${esc(x.tenHocVien)}</option>`).join("");$("#studentSelect").value=current;closeEditor();renderStudent()}
$("#editBtn").onclick=openEditor;$("#editClose").onclick=closeEditor;$("#editCancel").onclick=closeEditor;$("#editSave").onclick=saveEditor;
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
 const f=FAILED_BATCHES[index];
 if(!f)return;
 const d=CLASSES.find(x=>classKey(x)===f.classKey);
 if(!d){alert("Không tìm thấy lớp của batch này.");return}
 const exactStudents=f.names.map(n=>d.hocVien.find(s=>s.tenHocVien===n)).filter(Boolean);
 if(!exactStudents.length){alert("Không tìm thấy học viên của batch lỗi.");return}

 const old=button.textContent;
 button.disabled=true;
 button.textContent="Đang retry...";
 try{
   // Chỉ gửi đúng học viên thuộc batch lỗi, không gửi lại các batch đã thành công.
   const retryData={...d,hocVien:exactStudents};
   const r=await fetch("/api/generate",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({data:retryData,subject:subjectOfData(d)})
   });
   const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){out={error:raw.slice(0,180)||`HTTP ${r.status}`,students:{},failed:[{batch:f.batch,names:f.names,error:raw.slice(0,180)||`HTTP ${r.status}`}]} };
   const k=f.classKey;
   if(out.students && Object.keys(out.students).length){
     CLASS_AI[k]={...(CLASS_AI[k]||{}),...out.students};
     localStorage.setItem(`oiec_ai_${k}`,JSON.stringify(CLASS_AI[k]));
   }
   if(!r.ok || out.failed?.length){
     const err=out.failed?.map(x=>x.error).join(" | ")||out.error||"Retry lỗi";
     throw Error(err);
   }
   FAILED_BATCHES.splice(index,1);
   renderFailedBatches();
   currentClassKey=$("#classSelect").value;
   syncCurrentClass();
   alert(`Retry thành công ${f.className} • Batch ${f.batch} • ${exactStudents.length} học viên.`);
 }catch(e){
   button.disabled=false;
   button.textContent=old;
   alert(`Retry batch lỗi: ${e.message}`);
 }
}

$("#aiBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){
   alert("Generate AI cần chạy bản deploy trên Vercel.");
   return;
 }
 saveCurrentMeta();
 const btn=$("#aiBtn"),old=btn.textContent;
 btn.disabled=true;

 // Worker pool theo LỚP:
 // Mỗi worker nhận trọn 1 lớp; API của lớp đó tự chạy nhiều batch 5 học viên.
 // Vì vậy dữ liệu học viên giữa các lớp không bị trộn.
 const WORKERS=Math.min(4,CLASSES.length);
 let nextClass=0,done=0,finishedClasses=0;
 const total=CLASSES.reduce((n,d)=>n+d.hocVien.length,0);
 const failed=[];
 FAILED_BATCHES=[];
 renderFailedBatches();

 const updateProgress=()=>{
   btn.textContent=`AI ${finishedClasses}/${CLASSES.length} lớp • ${done}/${total} học viên • ${WORKERS} luồng`;
 };

 async function worker(){
   while(true){
     const ci=nextClass++;
     if(ci>=CLASSES.length)return;
     const d=CLASSES[ci],k=classKey(d);
     try{
       const r=await fetch("/api/generate",{
         method:"POST",
         headers:{"Content-Type":"application/json"},
         body:JSON.stringify({data:d,subject:subjectOfData(d)})
       });
       const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){out={error:raw.slice(0,180)||`HTTP ${r.status}`,students:{},failed:[]}};
       if(!r.ok){
         if(!out.failed?.length){const bs=[];for(let bi=0;bi<d.hocVien.length;bi+=5)bs.push(d.hocVien.slice(bi,bi+5));out.failed=bs.map((b,bi)=>({batch:bi+1,names:b.map(s=>s.tenHocVien),error:out.error||`HTTP ${r.status}`}))}
         if(out.failed?.length){
           for(const fb of out.failed){
             FAILED_BATCHES.push({
               classKey:k,
               className:d.tenLop,
               batch:fb.batch,
               names:[...(fb.names||[])],
               error:fb.error||out.error||"lỗi AI"
             });
           }
           renderFailedBatches();
         }
         failed.push(`${d.tenLop}: ${out.error||"lỗi AI"}`);
       }else{
         CLASS_AI[k]={...(CLASS_AI[k]||{}),...(out.students||{})};
         localStorage.setItem(`oiec_ai_${k}`,JSON.stringify(CLASS_AI[k]));
         const newly=Object.keys(out.students||{}).length;
         done+=newly;
         if(out.failed?.length){
           for(const fb of out.failed){
             FAILED_BATCHES.push({
               classKey:k,
               className:d.tenLop,
               batch:fb.batch,
               names:[...(fb.names||[])],
               error:fb.error||"lỗi AI"
             });
           }
           renderFailedBatches();
           failed.push(`${d.tenLop}: ${newly}/${d.hocVien.length} học viên; ${out.failed.map(x=>x.error).join(" | ")}`);
         }
       }
     }catch(e){
       failed.push(`${d.tenLop}: ${e.message}`);
     }finally{
       finishedClasses++;
       updateProgress();
     }
   }
 }

 try{
   updateProgress();
   await Promise.all(Array.from({length:WORKERS},()=>worker()));
   currentClassKey=$("#classSelect").value;
   syncCurrentClass();
   if(failed.length)alert(`Đã tạo AI ${done}/${total} học viên.\n\nLớp/batch lỗi:\n${failed.join("\n")}`);
   else alert(`Đã tạo AI xong ${CLASSES.length} lớp • ${done}/${total} học viên • ${WORKERS} luồng.`);
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