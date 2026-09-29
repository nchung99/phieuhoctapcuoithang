const MODELS=["gemini-3.5-flash-lite","gemini-3.5-flash","gemini-3.6-flash","gemini-3.8-flash"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function promptForBatch(common,students,subject){
 const names=students.map(s=>s.tenHocVien);
 return `Bạn là giáo viên KAPLA viết phiếu đánh giá học tập OIEC THEO THÁNG.
Đánh giá RIÊNG từng học viên từ dữ liệu thực tế; không trộn dữ liệu học viên. Buổi vắng không phải điểm thấp và không được dùng buổi vắng để bịa thành tích. Không bịa thông tin. Bộ môn: ${subject}.

QUAN TRỌNG VỀ MỨC NHẬN XÉT:
- Phải dựa mạnh vào diemTrungBinh và điểm từng buổi có mặt/đi trễ trong dữ liệu EMS.
- Điểm 9–10: ghi nhận tốt nhưng vẫn nêu một điểm nhỏ có thể phát triển thêm nếu dữ liệu phù hợp; không khen hoàn hảo đồng loạt.
- Điểm 8–<9: nhìn chung tốt, nêu rõ phần làm được và một điểm cần cải thiện.
- Điểm 7–<8: nhận xét cân bằng, dùng các cách nói như "đã nắm được", "cần luyện thêm", "chưa ổn định".
- Dưới 7: không khen quá mức; nói nhẹ nhàng nhưng đúng mức độ, chỉ rõ nội dung cần củng cố.
- Không dùng cùng một kiểu khen cho tất cả học viên.
- Mỗi câu chuyenMon khoảng 18–26 từ: đủ nội dung để phụ huynh hiểu học sinh làm được gì và còn cần cải thiện gì, nhưng không viết lan man.
- Văn phong tự nhiên, gần với cách giáo viên trực tiếp ghi nhận xét cho phụ huynh; câu rõ ý, không quá trang trọng.
- TUYỆT ĐỐI không dùng "con", "em", "bé", "học sinh" để gọi người học trong câu nhận xét.
- Khi cần gọi tên, dùng TÊN ĐỆM + TÊN lấy từ tenHocVien. Ví dụ "Nguyễn Công Hưng" phải gọi là "Công Hưng"; "Trần Minh Anh" gọi là "Minh Anh".
- Không cần câu nào cũng mở đầu bằng tên. Xen kẽ tên đệm + tên với cách viết trực tiếp như "Khi làm bài...", "Ở các hoạt động...", "Với nội dung này..." để 5 câu không bị lặp.
- Có thể viết tự nhiên như "Công Hưng đã nắm được...", "Công Hưng làm khá chắc...", "Khi làm bài, Công Hưng còn cần...", "Ở một số nội dung, Công Hưng...".
- Hạn chế các cụm sáo/khuôn mẫu như "thể hiện khả năng", "cho thấy sự", "phát huy tốt", "vận dụng linh hoạt", "có sự tiến bộ rõ rệt", "tích cực tham gia".
- Không ép câu nào cũng theo kiểu khen trước rồi mới góp ý. Điểm chưa ổn thì nói nhẹ nhưng thẳng.
- Tránh nối nhiều vế bằng "đồng thời", "bên cạnh đó", "qua đó"; mỗi câu chỉ 1 ý chính và tối đa 1 ý phụ.
- 5 tiêu chí không được mở đầu và kết câu theo cùng một khuôn. Tránh cảm giác copy mẫu.
mucDoHoanThien chỉ "Đúng yêu cầu" hoặc "Có sáng tạo".
diemTieuChi sẽ được hệ thống tính từ điểm EMS sau khi AI trả kết quả; AI không quyết định điểm tiêu chí cuối cùng.

BẮT BUỘC tạo chuyenMon đủ ĐÚNG 5 câu, không được để chuỗi rỗng, không được trả dấu "—".
Thứ tự 5 câu trong chuyenMon:
1. Tư duy Logic trong lập trình: nhận xét riêng về tư duy logic của học viên trong tháng.
2. Phân tích & xử lý vấn đề: nhận xét khả năng phân tích, thử cách làm và xử lý lỗi/vấn đề.
3. Khả năng sáng tạo: nhận xét cách học viên phát triển hoặc điều chỉnh sản phẩm/ý tưởng.
4. Tiếp thu kiến thức & ghi nhớ: nhận xét mức độ hiểu, nhớ và vận dụng nội dung đã học.
5. Khả năng làm việc nhóm: nhận xét việc phối hợp, trao đổi hoặc hỗ trợ trong quá trình học.
Mỗi phần tử chuyenMon chỉ chứa NỘI DUNG nhận xét, KHÔNG lặp lại tên tiêu chí ở đầu câu.
Không mặc định học viên "tốt", "tích cực", "nắm vững" nếu điểm EMS không hỗ trợ kết luận đó.
Riêng sáng tạo phải thận trọng hơn: điểm EMS cao không đồng nghĩa sáng tạo cao; nếu dữ liệu không thể hiện ý tưởng riêng thì ghi nhận ở mức vừa và gợi ý phát triển thêm.
Chỉ dựa trên dữ liệu thực tế của học viên. Nếu dữ liệu ít, viết nhận xét thận trọng từ phần có dữ liệu; tuyệt đối không để trống.

Nội dung bảng:
- KHÔNG tạo nội dung cho hàng 1 của cột Kiến thức - Lập trình và Kỹ năng bộ môn. Hai ô này được giao diện tự điền cố định theo Robotics/Coding.
- hocSinhCoThe: bắt đầu bằng "Học sinh có thể:" và đánh giá kiến thức/lập trình học viên thực sự nắm được trong tháng.
- coCheRobot: nếu Robotics bắt đầu bằng "Cơ chế/robot hoàn chỉnh:"; nếu Coding bắt đầu bằng "Kỹ năng hoàn chỉnh:". Nội dung phải cá nhân hóa theo dữ liệu 4 buổi.
- sanPhamDuAn: bắt đầu bằng "Tên sản phẩm/robot/dự án:" và chỉ dùng các bài/sản phẩm có trong dữ liệu tháng.
Mỗi ô viết gọn để vừa một trang A4.

Trả JSON THUẦN:
{"students":{"TÊN":{"chuyenMon":["","","","",""],"hocSinhCoThe":"","coCheRobot":"","sanPhamDuAn":"","mucDoHoanThien":"Đúng yêu cầu","diemTieuChi":{"Thái độ & tinh thần học tập":4,"Kỹ năng hợp tác & giao tiếp":4,"Kỹ năng thực hành & sáng tạo":4,"Tính kiên trì & tự giác":4,"Khả năng tiếp thu & vận dụng kiến thức":4,"Tiến bộ cá nhân & đạo đức":4}}}}
Phải đủ đúng key: ${JSON.stringify(names)}
THÔNG TIN THÁNG: ${JSON.stringify(common)}
DỮ LIỆU HỌC VIÊN: ${JSON.stringify(students)}
Nhắc lại: trong phần nhận xét, nếu nhắc tới học viên thì chỉ dùng 2 từ cuối của tenHocVien (tên đệm + tên), không dùng "con".`;
}
async function callModel(key,model,prompt,ms=10000){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),ms);
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,{
   method:"POST",headers:{"Content-Type":"application/json"},signal:c.signal,
   body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json"}})
  });
  const raw=await r.text();let j;try{j=JSON.parse(raw)}catch(_){const e=Error(`${model}: API trả non-JSON`);e.status=r.status;throw e}
  if(!r.ok){const msg=j?.error?.message||`HTTP ${r.status}`;const err=Error(`${model}: ${msg}`);err.status=r.status;throw err}
  let t=j?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";t=t.replace(/^```json\s*/i,"").replace(/```$/,"").trim();
  try{return JSON.parse(t)}catch(_){const e=Error(`${model}: AI trả non-JSON`);e.status=502;throw e}
 }catch(e){
  if(e?.name==="AbortError"){const x=Error(`${model}: timeout ${ms/1000}s`);x.status=504;throw x}
  throw e
 }finally{clearTimeout(timer)}
}
async function callWithRetry(key,model,prompt){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{return await callModel(key,model,prompt,16000)}
  catch(e){
   last=e;
   const status=Number(e?.status||0),k=kind(e?.message||"");
   const transient=status===408||status===429||status>=500||k==="busy"||k==="timeout";
   if(!transient||attempt===1)throw e;
   // 429 quota ngày thường không tự hết trong vài giây: chuyển model thay vì spam cùng model.
   if(status===429 && /quota exceeded|free_tier_requests/i.test(e?.message||""))throw e;
   await sleep(900+Math.floor(Math.random()*350));
  }
 }
 throw last;
}
function kind(msg=""){
 if(/quota exceeded|free_tier_requests|rate.?limit|429/i.test(msg))return "quota";
 if(/high demand|unavailable|overload|503/i.test(msg))return "busy";
 if(/timeout/i.test(msg))return "timeout";
 return "other";
}

function presentSessions(student){
 return (student?.cacBuoi||[]).filter(b=>b?.maDiemDanh==="P"||b?.maDiemDanh==="L");
}
function emsAverage(student){
 const present=presentSessions(student);
 const scores=present.map(b=>Number(b?.diem)).filter(Number.isFinite);
 if(scores.length)return scores.reduce((x,y)=>x+y,0)/scores.length;
 const avg=Number(student?.diemTrungBinh);
 return Number.isFinite(avg)?avg:null;
}
function weightedCriteria(student){
 const avg=emsAverage(student);

 // Không có điểm: giữ mức trung tính, riêng đạo đức luôn 5.
 if(avg===null)return {
  "Thái độ & tinh thần học tập":4,
  "Kỹ năng hợp tác & giao tiếp":4,
  "Kỹ năng thực hành & sáng tạo":4,
  "Tính kiên trì & tự giác":4,
  "Khả năng tiếp thu & vận dụng kiến thức":4,
  "Tiến bộ cá nhân & đạo đức":5
 };

 // Mặt bằng mới: không còn tụt xuống 2.
 // EMS 9–10 => chủ yếu 4–5; EMS 8 => quanh 4; EMS 7 => 3–4.
 const base=avg>=9.5?4.8:avg>=8.5?4.45:avg>=7.5?4.05:avg>=6.5?3.65:3.35;

 // Biến thiên ổn định theo từng học viên để các bé cùng lớp không ra y hệt nhau.
 // Không dùng random nên generate lại vẫn giữ profile điểm hợp lý.
 let seed=2166136261;
 for(const ch of String(student?.tenHocVien||"")){
  seed^=ch.codePointAt(0);
  seed=Math.imul(seed,16777619)>>>0;
 }
 const delta=i=>(((seed>>>(i*5))%3)-1)*0.38; // -0.38 / 0 / +0.38
 const clamp=n=>Math.max(3,Math.min(5,Math.round(n)));

 return {
  "Thái độ & tinh thần học tập":clamp(base+0.15+delta(0)),
  "Kỹ năng hợp tác & giao tiếp":clamp(base+delta(1)),
  "Kỹ năng thực hành & sáng tạo":clamp(base-0.20+delta(2)),
  "Tính kiên trì & tự giác":clamp(base+0.10+delta(3)),
  "Khả năng tiếp thu & vận dụng kiến thức":clamp(base+0.20+delta(4)),
  // Theo yêu cầu: đạo đức mặc định luôn 5.
  "Tiến bộ cá nhân & đạo đức":5
 };
}

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(500).json({error:"Chưa cấu hình GEMINI_API_KEY."});
 const data=req.body?.data,subject=req.body?.subject||"Coding / Robotics";
 if(!data?.hocVien?.length)return res.status(400).json({error:"Không có dữ liệu học viên."});
 if(data.hocVien.length>5)return res.status(400).json({error:"Mỗi request tối đa 5 học viên."});
 const common={tenLop:data.tenLop,thang:data.thang,soBuoi:data.soBuoi,noiDungThang:data.noiDungThang},prompt=promptForBatch(common,data.hocVien,subject);
 // Mọi batch dùng cùng thứ tự model. Batch 2/3 không được bắt đầu bằng model khác batch 1.
 // Nếu model đầu lỗi/quota/high-demand thì mới fallback sang model kế tiếp.
 const tries=[MODELS[0],MODELS[1],MODELS[2]];
 let last="",lastKind="";
 for(let i=0;i<tries.length;i++){
  const model=tries[i];
  try{
   const out=await callWithRetry(key,model,prompt),students=out?.students||{};
   const missing=data.hocVien.filter(s=>{
     const a=students[s.tenHocVien];
     return !a || !Array.isArray(a.chuyenMon) || a.chuyenMon.length!==5 ||
       a.chuyenMon.some(x=>!String(x||"").trim() || String(x).trim()==="—");
   }).map(s=>s.tenHocVien);
   if(missing.length)throw Error(`${model}: thiếu/blank chuyenMon: ${missing.join(", ")}`);
   // Điểm tiêu chí không giao cho AI tự khen/chấm nữa: tính trực tiếp từ điểm EMS.
   for(const st of data.hocVien){
     if(students[st.tenHocVien])students[st.tenHocVien].diemTieuChi=weightedCriteria(st);
   }
   return res.status(200).json({students,model});
  }catch(e){
   last=e.message;lastKind=kind(last);
   // High demand thường tạm thời: nghỉ ngắn trước model kế tiếp.
   if(lastKind==="busy"||lastKind==="timeout")await sleep(700+Math.floor(Math.random()*300));
   // Quota model này hết: chuyển model ngay, không retry spam cùng model.
  }
 }
 return res.status(502).json({error:last||"Gemini lỗi",errorType:lastKind,students:{}});
}