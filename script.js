const $=s=>document.querySelector(s);
let DATA=null, AI={}, current=null;
let CLASSES=[], CLASS_AI={}, CLASS_META={}, currentClassKey=null;
let MANUAL={};
const criteria=["Thái độ & tinh thần học tập","Kỹ năng hợp tác & giao tiếp","Kỹ năng thực hành & sáng tạo","Tính kiên trì & tự giác","Khả năng tiếp thu & vận dụng kiến thức","Tiến bộ cá nhân & đạo đức"];
const scoreState={};

function notify(message,type="info"){
 const text=String(message??"");
 if(window.Swal){
   const icon=type==="error"?"error":type==="success"?"success":"info";
   return Swal.fire({
     icon,
     title: icon==="error" ? "Có lỗi" : icon==="success" ? "Hoàn tất" : "Thông báo",
     text,
     confirmButtonText:"OK",
     confirmButtonColor:"#8f1738",
     width:430
   });
 }
 console[type==="error"?"error":"log"](text);
}
function esc(s){return String(s??"").replace(/[&<>"\']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#039;"}[m]))}

function classKey(d){return `${d?.tenLop||"Lop"}__${d?.thang||""}`}
function editedDataKey(k){return `oiec_edited_data_${k}`}
function saveEditedData(k,d){
 if(!k||!d)return;
 localStorage.setItem(editedDataKey(k),JSON.stringify({
   tenLop:d.tenLop,thang:d.thang,__manualSubject:d.__manualSubject||"",__manualProgram:d.__manualProgram||"",chuongTrinh:d.chuongTrinh||"",
   noiDungThang:d.noiDungThang||[],
   hocVien:(d.hocVien||[]).map(x=>({tenHocVien:x.tenHocVien}))
 }));
}
function applyEditedData(k,d){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(editedDataKey(k))||"null")}catch(_){}
 if(!saved)return d;
 if(saved.thang!=null)d.thang=saved.thang;
 if(saved.__manualSubject)d.__manualSubject=saved.__manualSubject;
 if(saved.__manualProgram)d.__manualProgram=saved.__manualProgram;
 if(saved.chuongTrinh)d.chuongTrinh=saved.chuongTrinh;
 if(Array.isArray(saved.noiDungThang))d.noiDungThang=saved.noiDungThang;
 if(Array.isArray(saved.hocVien)){
   saved.hocVien.forEach((x,i)=>{if(d.hocVien?.[i]&&x?.tenHocVien)d.hocVien[i].tenHocVien=x.tenHocVien});
 }
 return d;
}
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
const PROGRAM_MAP = [
 {re:/^RBT\.\s*STAGE\s*[12]$/i,subject:"Robotics",tool:"LEGO Duplo",top1:"Công cụ sử dụng: LEGO Duplo",top2:"Học sinh có thể lắp ráp: Các mô hình theo chủ đề đã học."},
 {re:/^TINY\s+CODER\s*[12]$/i,subject:"Coding",tool:"Scratch Jr",top1:"Phần mềm sử dụng: Scratch Jr",top2:"Học sinh có thể lập trình: Câu chuyện, hoạt cảnh và trò chơi đơn giản theo chủ đề đã học."},
 {re:/^ESSENTIAL\s*[1-4]$/i,subject:"Robotics",tool:"LEGO SPIKE Essential",top1:"Công cụ sử dụng: LEGO SPIKE Essential",top2:"Học sinh có thể lắp ráp và lập trình: Các mô hình robot theo chủ đề đã học."},
 {re:/^PRIME\s*[1-4]$/i,subject:"Robotics",tool:"LEGO SPIKE Prime",top1:"Công cụ sử dụng: LEGO SPIKE Prime",top2:"Học sinh có thể lắp ráp, lập trình và điều khiển: Các mô hình robot theo yêu cầu của bài học."},
 {re:/^JUNIOR\s+CODER\s*[1-3]$/i,subject:"Coding",tool:"Scratch 3.0",top1:"Phần mềm sử dụng: Scratch 3.0",top2:"Học sinh có thể lập trình: Hoạt cảnh, trò chơi và các sản phẩm theo chủ đề đã học."},
 {re:/^MINECRAFT\s*[12]$/i,subject:"Coding",tool:"Minecraft Education",top1:"Phần mềm sử dụng: Minecraft Education",top2:"Học sinh có thể lập trình: Xây dựng và hoàn thành các nhiệm vụ trong Minecraft."},
 {re:/^SENIOR\s+CODER\s*[1-3]$/i,subject:"Coding",tool:"Python",top1:"Ngôn ngữ sử dụng: Python",top2:"Học sinh có thể lập trình: Viết và chạy các chương trình Python theo nội dung đã học."}
];
function normalizeProgram(v){return String(v||"").trim().replace(/\s+/g," ")}
function programFromActivity(v){
 let x=String(v||"").trim();
 x=x.replace(/^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?\s*:\s*/i,"");
 x=x.replace(/\s*\([^)]*\)\s*$/i,"");
 const parts=x.split(/\s+-\s+/).map(t=>t.trim()).filter(Boolean);
 return normalizeProgram(parts.length>=3?parts.slice(2).join(" - "):(parts.length?parts[parts.length-1]:x));
}
function detectedProgram(d=DATA){
 if(d?.__manualProgram)return normalizeProgram(d.__manualProgram);
 if(d?.chuongTrinh)return normalizeProgram(d.chuongTrinh);
 for(const l of (d?.noiDungThang||[])){const p=programFromActivity(l.tenBuoiHoc);if(p)return p}
 return "";
}
function programConfig(d=DATA){
 const program=detectedProgram(d);
 const found=PROGRAM_MAP.find(x=>x.re.test(program));
 return found?{...found,program}:null;
}
function subject(){
 if(DATA?.__manualSubject)return DATA.__manualSubject;
 const mapped=programConfig(DATA);if(mapped)return mapped.subject;
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
 const manualRaw=MANUAL[currentClassKey]?.[current]||{};

 // Manual chỉ được đè AI khi thật sự có dữ liệu.
 // Tránh localStorage cũ chứa chuỗi/mảng rỗng làm mất kết quả AI.
 const hasManualValue=(v)=>{
   if(v===undefined||v===null)return false;
   if(typeof v==="string")return v.trim()!=="";
   if(Array.isArray(v))return v.some(x=>String(x??"").trim()!=="");
   return true;
 };
 const manual={};
 for(const [key,val] of Object.entries(manualRaw)){
   if(key==="diemTieuChi")continue;
   if(hasManualValue(val))manual[key]=val;
 }
 const manualScores={};
 for(const [key,val] of Object.entries(manualRaw.diemTieuChi||{})){
   const n=Number(val);
   if(Number.isFinite(n)&&n>=1&&n<=5)manualScores[key]=n;
 }
 const a={...baseAI,...manual,diemTieuChi:{...(baseAI.diemTieuChi||{}),...manualScores}};
 $("#rTeacher").textContent=selectedTeacher()||"—";
 $("#rCenter").textContent=selectedCenter()||"—";
 $("#rStudent").textContent=s.tenHocVien;
 $("#rClass").textContent=DATA.tenLop||"—";
 $("#rSubject").textContent=sub;
 const rr=$("#radioRobotics"), rc=$("#radioCoding");
 if(rr) rr.classList.toggle("checked",sub==="Robotics");
 if(rc) rc.classList.toggle("checked",sub==="Coding");
 $("#rMonth").textContent=DATA.thang||"—";
 $("#rDuration").textContent=`${DATA.soBuoi||4} buổi • 60 phút / buổi`;
 $("#skillHeading").textContent=sub==="Coding"?"Kỹ năng lập trình":sub==="Robotics"?"Kỹ năng Robotics":"Kỹ năng theo bộ môn";

 const lessons=DATA.noiDungThang||[];
 $("#monthlyLessons").innerHTML=lessons.map((x,i)=>`<div class="month-lesson"><b>Tuần ${i+1} • ${esc(x.ngayHoc)} — ${esc(x.tenBaiHoc)}</b><span>${esc((x.noiDungBaiHoc||"").replace(/\n+/g," ").slice(0,165))}${(x.noiDungBaiHoc||"").length>165?"…":""}</span></div>`).join("");

 const labels=["Tư duy Logic trong lập trình","Phân tích & xử lý vấn đề","Khả năng sáng tạo","Tiếp thu kiến thức & ghi nhớ","Khả năng làm việc nhóm"];
 const p=a.chuyenMon||[];
 $("#professionalList").innerHTML=labels.map((x,i)=>`<div class="pro-card"><b>${x}:</b> ${esc(p[i]||"—")}</div>`).join("");

 const splitLegacy=(value)=>{
   const raw=String(value||"").trim();
   if(!raw)return ["",""];
   const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
   return lines.length>=2?[lines[0],lines.slice(1).join("\n")]:[raw,""];
 };
 const [,legacyKBottom]=splitLegacy(a.kienThucLapTrinh);
 const [,legacyRBottom]=splitLegacy(a.kyNangRobotics);

 // Hàng 1 ưu tiên mapping Chương trình/Level -> Bộ môn + Công cụ.
 const cfg=programConfig(DATA);
 const isRobotics=sub==="Robotics";
 const kTop=cfg?.top1||(isRobotics
   ?"Ngôn ngữ/ phần mềm sử dụng: LEGO SPIKE Essential"
   :"Ngôn ngữ/ phần mềm sử dụng: Scratch");
 const rTop=cfg?.top2||(isRobotics
   ?"Học sinh có thể lắp ráp: Các mô hình robot theo chủ đề đã học."
   :"Học sinh có thể lập trình: Các sản phẩm/trò chơi theo chủ đề đã học.");

 // Hàng 2 vẫn cá nhân hóa theo từng học viên bằng AI / chỉnh tay.
 const kBottom=a.hocSinhCoThe||legacyKBottom||"—";
 const rBottom=a.coCheRobot||legacyRBottom||"—";

 $("#knowledgeTop").innerHTML=esc(kTop).replace(/\n/g,"<br>");
 $("#knowledgeBottom").innerHTML=esc(kBottom).replace(/\n/g,"<br>");
 $("#roboticsTop").innerHTML=esc(rTop).replace(/\n/g,"<br>");
 $("#roboticsBottom").innerHTML=esc(rBottom).replace(/\n/g,"<br>");
 $("#projectText").innerHTML=esc(a.sanPhamDuAn||"—").replace(/\n/g,"<br>");
 document.querySelectorAll('input[name="completion"]').forEach(x=>{
   const yes=x.value===a.mucDoHoanThien;
   x.checked=yes;
   if(yes)x.setAttribute("checked","checked"); else x.removeAttribute("checked");
 });
 document.querySelectorAll('.completion label').forEach(lab=>{ lab.style.display="inline-flex"; });
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
 if(!custom){
   const v=$("#center").value;
   localStorage.setItem("oiec_center",v);
   // Khi đang làm nhiều JSON/lớp, Center vừa chọn sẽ là mặc định cho các lớp còn lại.
   // Lớp nào sửa riêng bằng Edit sau đó vẫn giữ Center riêng của lớp đó.
   for(const d of CLASSES){
     const k=classKey(d);
     CLASS_META[k]??={};
     CLASS_META[k].center=v;
     localStorage.setItem(`oiec_center_${k}`,v);
   }
 }
 saveCurrentMeta(); renderStudent();
};
$("#centerCustom").oninput=()=>{
 const v=$("#centerCustom").value.trim();
 localStorage.setItem("oiec_center_custom",v);
 saveCurrentMeta(); renderStudent();
};
$("#centerCustom").onchange=()=>{
 const v=$("#centerCustom").value.trim();
 if(v){
   saveCustom("center",v);addOption($("#center"),v);$("#center").value=v;$("#centerCustom").style.display="none";localStorage.setItem("oiec_center",v);
   for(const d of CLASSES){
     const k=classKey(d);
     CLASS_META[k]??={};
     CLASS_META[k].center=v;
     localStorage.setItem(`oiec_center_${k}`,v);
   }
   saveCurrentMeta();renderStudent();
 }
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
  CLASSES=loaded.map(d=>applyEditedData(classKey(d),d));
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
  notify(`Đã nhập ${CLASSES.length} lớp • ${CLASSES.reduce((n,d)=>n+d.hocVien.length,0)} học viên.`,"success");
 }catch(err){notify("Không đọc được JSON: "+err.message,"error")}
};



function editHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function editField(label,name,value,full=false,area=false){const v=editHtml(value);return `<div class="edit-field ${full?"full":""}"><label>${label}</label>${area?`<textarea name="${name}">${v}</textarea>`:`<input name="${name}" value="${v}">`}</div>`}
function openEdit(){
 if(!DATA||!current)return;
 const a={...(AI[current]||{}),...(MANUAL[currentClassKey]?.[current]||{})},p=a.chuyenMon||[];
 let h='<div class="edit-section">Thông tin chung</div>';
 h+=editField("Tên học viên","student",current)+editField("Lớp","className",DATA.tenLop)+editField("Giáo viên","teacher",selectedTeacher())+editField("Center","center",selectedCenter());
 const currentSubject=subject();
 h+=`<div class="edit-field"><label>Bộ môn</label><select name="subject"><option value="Robotics" ${currentSubject==="Robotics"?"selected":""}>Robotics</option><option value="Coding" ${currentSubject==="Coding"?"selected":""}>Coding</option></select></div>`;
 h+=editField("Chương trình / Level","program",detectedProgram(DATA));
 h+=editField("Tháng","month",DATA.thang);
 h+='<div class="edit-section">Nội dung học trong tháng</div>';
 (DATA.noiDungThang||[]).forEach((x,i)=>{h+=editField(`Tuần ${i+1} - Ngày học`,`date_${i}`,x.ngayHoc)+editField(`Tuần ${i+1} - Tên bài`,`title_${i}`,x.tenBaiHoc)+editField(`Tuần ${i+1} - Nội dung`,`content_${i}`,x.noiDungBaiHoc,true,true)});
 h+='<div class="edit-section">Đánh giá chuyên môn</div>';
 ["Tư duy Logic","Phân tích & xử lý vấn đề","Khả năng sáng tạo","Tiếp thu & ghi nhớ","Làm việc nhóm"].forEach((x,i)=>h+=editField(x,`pro_${i}`,p[i]||"",true,true));
 h+='<div class="edit-section">Năng lực & sản phẩm</div>';
 const legacyK=String(a.kienThucLapTrinh||"").split(/\n+/);
 const legacyR=String(a.kyNangRobotics||"").split(/\n+/);
 h+=editField("Học sinh có thể","studentCan",a.hocSinhCoThe||legacyK.slice(1).join("\n")||"",true,true);
 h+=editField("Cơ chế / kỹ năng hoàn chỉnh","mechanism",a.coCheRobot||legacyR.slice(1).join("\n")||"",true,true);
 h+=editField("Sản phẩm / Dự án","project",a.sanPhamDuAn||"",true,true);
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
  oldManual.hocSinhCoThe=String(get("studentCan")||"").trim();
  oldManual.coCheRobot=String(get("mechanism")||"").trim();
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
  DATA.__manualProgram=String(get("program")||"").trim();
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
  // Lưu cả các mục Edit thuộc dữ liệu phiếu để reload/import lại vẫn giữ.
  if(newKey!==oldKey)localStorage.removeItem(editedDataKey(oldKey));
  saveEditedData(currentClassKey,DATA);

  // Rebuild dropdowns because class/month/name may have changed.
  $("#classSelect").innerHTML=CLASSES.map(d=>`<option value="${esc(classKey(d))}">${esc(d.tenLop)} • ${esc(d.thang)}</option>`).join("");
  $("#classSelect").value=currentClassKey;
  $("#studentSelect").innerHTML=DATA.hocVien.map(x=>`<option>${esc(x.tenHocVien)}</option>`).join("");$("#studentSelect").value=current;
  $("#classInfo").textContent=DATA.tenLop||"—";$("#monthInfo").textContent=DATA.thang||"—";$("#sessionsInfo").textContent=DATA.soBuoi||0;$("#subjectInfo").textContent=subject();
  $("#lessonList").innerHTML=(DATA.noiDungThang||[]).map(x=>`<div class="lesson-item"><b>${esc(x.ngayHoc)} • ${esc(x.tenBaiHoc)}</b>${esc(x.noiDungBaiHoc)}</div>`).join("");
  closeEdit();renderStudent();
 }catch(e){notify("Không lưu được: "+e.message,"error")}
}
$("#editBtn").onclick=openEdit;$("#editClose").onclick=closeEdit;$("#editCancel").onclick=closeEdit;$("#editSave").onclick=saveEdit;
$("#editModal").addEventListener("click",e=>{if(e.target===$("#editModal"))closeEdit()});
let FAILED_BATCHES=[];

function subjectOfData(d){
 if(d?.__manualSubject)return d.__manualSubject;
 const mapped=programConfig(d);if(mapped)return mapped.subject;
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
 const d=CLASSES.find(x=>classKey(x)===f.classKey);if(!d){notify("Không tìm thấy lớp của batch.","error");return}
 const exactStudents=f.names.map(n=>d.hocVien.find(s=>s.tenHocVien===n)).filter(Boolean);
 if(!exactStudents.length){notify("Không tìm thấy học viên của batch.","error");return}
 const old=button?.textContent||"Retry";if(button){button.disabled=true;button.textContent="Đang retry..."}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),58000);
 try{
  const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:{...d,hocVien:exactStudents},subject:subjectOfData(d),tool:programConfig(d)?.tool||"",batch:f.batch}),signal:controller.signal});
  const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){throw Error(raw.slice(0,180)||`HTTP ${r.status}`)}
  if(!r.ok||out.error)throw Error(out.error||`HTTP ${r.status}`);
  const got=out.students||{},missing=exactStudents.filter(s=>{
    const a=got[s.tenHocVien];
    return !a || !Array.isArray(a.chuyenMon) || a.chuyenMon.length!==5 ||
      a.chuyenMon.some(x=>!String(x||"").trim() || String(x).trim()==="—");
  }).map(s=>s.tenHocVien);
  if(missing.length)throw Error(`AI thiếu Đánh giá chuyên môn: ${missing.join(", ")}`);
  CLASS_AI[f.classKey]={...(CLASS_AI[f.classKey]||{}),...got};localStorage.setItem(`oiec_ai_${f.classKey}`,JSON.stringify(CLASS_AI[f.classKey]));
  FAILED_BATCHES.splice(index,1);renderFailedBatches();currentClassKey=$("#classSelect").value;syncCurrentClass();
 }catch(e){f.error=e?.name==="AbortError"?"Request quá 58 giây":e.message;renderFailedBatches();notify(`Retry batch lỗi: ${f.error}`,"error")}
 finally{clearTimeout(timer)}
}

$("#aiBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){notify("Generate AI cần chạy bản deploy trên Vercel.","error");return}
 saveCurrentMeta();const btn=$("#aiBtn"),old=btn.textContent;btn.disabled=true;FAILED_BATCHES=[];renderFailedBatches();
 const jobs=[];for(const d of CLASSES){const k=classKey(d);for(let i=0;i<d.hocVien.length;i+=5)jobs.push({classKey:k,className:d.tenLop,data:d,batch:Math.floor(i/5)+1,students:d.hocVien.slice(i,i+5)})}
 const WORKERS=1;let next=0,done=0,finished=0;const total=CLASSES.reduce((n,d)=>n+d.hocVien.length,0);
 const update=()=>btn.textContent=`AI ${finished}/${jobs.length} batch • ${done}/${total} học viên • ${WORKERS} luồng`;
 function fail(job,error){FAILED_BATCHES.push({classKey:job.classKey,className:job.className,batch:job.batch,names:job.students.map(s=>s.tenHocVien),error:error||"lỗi AI"});renderFailedBatches()}
 async function run(job){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),58000);
  try{
   const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:{...job.data,hocVien:job.students},subject:subjectOfData(job.data),tool:programConfig(job.data)?.tool||"",batch:job.batch}),signal:controller.signal});
   const raw=await r.text();let out;try{out=JSON.parse(raw)}catch(_){throw Error(raw.slice(0,180)||`HTTP ${r.status}`)}
   if(!r.ok||out.error)throw Error(out.error||`HTTP ${r.status}`);
   const got=out.students||{},missing=job.students.filter(s=>{
     const a=got[s.tenHocVien];
     return !a || !Array.isArray(a.chuyenMon) || a.chuyenMon.length!==5 ||
       a.chuyenMon.some(x=>!String(x||"").trim() || String(x).trim()==="—");
   }).map(s=>s.tenHocVien);
   if(missing.length)throw Error(`AI thiếu Đánh giá chuyên môn: ${missing.join(", ")}`);
   CLASS_AI[job.classKey]={...(CLASS_AI[job.classKey]||{}),...got};localStorage.setItem(`oiec_ai_${job.classKey}`,JSON.stringify(CLASS_AI[job.classKey]));done+=Object.keys(got).length;
  }catch(e){fail(job,e?.name==="AbortError"?"Request quá 58 giây":e.message)}
  finally{clearTimeout(timer);finished++;update()}
 }
 async function worker(){while(true){const i=next++;if(i>=jobs.length)return;await run(jobs[i])}}
 try{
  update();
  await Promise.all(Array.from({length:WORKERS},()=>worker()));

  // Kiểm tra lại TỪNG học viên sau khi tất cả batch hoàn tất.
  // Không dùng số lượng key Gemini trả về để kết luận "đủ 8/8".
  const failedNames=new Set(FAILED_BATCHES.flatMap(x=>x.names||[]));
  for(const d of CLASSES){
   const k=classKey(d),ai=CLASS_AI[k]||{};
   const missing=[];
   for(const st of d.hocVien){
    const a=ai[st.tenHocVien];
    const ok=a && Array.isArray(a.chuyenMon) && a.chuyenMon.length===5 &&
      a.chuyenMon.every(x=>String(x||"").trim() && String(x).trim()!=="—");
    if(!ok && !failedNames.has(st.tenHocVien))missing.push(st.tenHocVien);
   }
   for(let i=0;i<missing.length;i+=5){
    FAILED_BATCHES.push({
     classKey:k,className:d.tenLop,batch:`thiếu-${Math.floor(i/5)+1}`,
     names:missing.slice(i,i+5),error:"Thiếu kết quả sau kiểm tra cuối"
    });
   }
  }

  // Tính lại số học viên thực sự có kết quả hợp lệ.
  done=0;
  for(const d of CLASSES){
   const ai=CLASS_AI[classKey(d)]||{};
   for(const st of d.hocVien){
    const a=ai[st.tenHocVien];
    if(a && Array.isArray(a.chuyenMon) && a.chuyenMon.length===5 &&
      a.chuyenMon.every(x=>String(x||"").trim() && String(x).trim()!=="—"))done++;
   }
  }

  currentClassKey=$("#classSelect").value;
  syncCurrentClass();
  renderFailedBatches();
  if(FAILED_BATCHES.length)notify(`Đã tạo AI ${done}/${total} học viên. Còn học viên bị thiếu — bấm Retry đúng batch.`,"info");
  else notify(`Đã tạo AI xong ${done}/${total} học viên.`,"success");
 }
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
 const logo=report.querySelector(".oiec-brand img");
 if(logo){
   const liveLogo=document.querySelector("#report .oiec-brand img");
   if(liveLogo?.src)logo.src=liveLogo.src;
 }
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

function centerCode(name){
 const code=classCode(name);
 const first=String(code||"").split("-")[0].trim().toUpperCase();
 return safeFileName(first||"CENTER");
}

function groupClassesByCenter(){
 const groups=new Map();
 for(const d of CLASSES){
   const code=centerCode(d.tenLop);
   if(!groups.has(code))groups.set(code,[]);
   groups.get(code).push(d);
 }
 return [...groups.entries()].map(([code,classes])=>({code,classes}));
}

async function buildClassZipBlob(d,classIndex,totalClasses,centerCodeValue){
 const k=classKey(d);
 DATA=d; AI=CLASS_AI[k]||{};
 currentClassKey=k;
 if(!MANUAL[k]){
   try{MANUAL[k]=JSON.parse(localStorage.getItem(`oiec_manual_${k}`)||"{}")}catch(_){MANUAL[k]={}}
 }
 const reports=[];
 for(let i=0;i<d.hocVien.length;i++){
   const name=d.hocVien[i].tenHocVien;
   $("#printBtn").textContent=`${centerCodeValue} • lớp ${classIndex}/${totalClasses} • PDF ${i+1}/${d.hocVien.length}`;
   current=name; renderStudent(); await waitFrame();
   reports.push({name,html:reportHTML()});
 }
 const zipName=classCode(d.tenLop);
 const r=await fetch("/api/pdfzip",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({reports,zipName})
 });
 if(!r.ok){
   let msg=`Không tạo được PDF lớp ${zipName}.`;
   try{const j=await r.json();msg=j.error||msg}catch(_){}
   throw Error(msg);
 }
 return {className:zipName,blob:await r.blob()};
}

async function downloadCenterZip(group,groupIndex,totalGroups){
 if(!window.JSZip)throw Error("Không tải được thư viện ZIP. Hãy refresh trang rồi thử lại.");
 const outer=new JSZip();

 for(let i=0;i<group.classes.length;i++){
   const result=await buildClassZipBlob(group.classes[i],i+1,group.classes.length,group.code);
   const classZip=await JSZip.loadAsync(result.blob);

   const entries=Object.values(classZip.files);
   for(const entry of entries){
     if(entry.dir)continue;
     const pdf=await entry.async("blob");
     let fileName=entry.name;
     if(outer.file(fileName)){
       const isPdf=fileName.toLowerCase().endsWith(".pdf");
       const base=isPdf?fileName.slice(0,-4):fileName;
       fileName=`${base} - ${result.className}${isPdf?".pdf":""}`;
     }
     outer.file(fileName,pdf);
   }
 }

 $("#printBtn").textContent=`Đóng gói ${group.code} • ${groupIndex}/${totalGroups}`;
 const blob=await outer.generateAsync({type:"blob",compression:"DEFLATE"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;
 a.download=`${safeFileName(group.code)}.zip`;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
 await new Promise(r=>setTimeout(r,500));
}

$("#printBtn").onclick=async()=>{
 if(!CLASSES.length)return;
 if(location.protocol==="file:"){
   notify("Xuất ZIP PDF cần chạy bản đã deploy trên Vercel.","error");
   return;
 }
 saveCurrentMeta();
 const btn=$("#printBtn"),old=btn.textContent;
 const oldKey=currentClassKey,oldStudent=current;
 btn.disabled=true;
 try{
   const groups=groupClassesByCenter();
   for(let i=0;i<groups.length;i++) await downloadCenterZip(groups[i],i+1,groups.length);
   notify(`Đã tạo ${groups.length} ZIP theo mã Center.`,"success");
 }catch(e){notify(e.message,"error")}
 finally{
   currentClassKey=oldKey;DATA=CLASSES.find(x=>classKey(x)===oldKey)||CLASSES[0];
   AI=CLASS_AI[currentClassKey]||{};current=oldStudent||DATA.hocVien[0]?.tenHocVien;
   $("#classSelect").value=currentClassKey;syncCurrentClass();
   if(DATA.hocVien.some(x=>x.tenHocVien===oldStudent)){current=oldStudent;$("#studentSelect").value=current;renderStudent()}
   btn.disabled=false;btn.textContent=old;
 }
};

renderCriteria();