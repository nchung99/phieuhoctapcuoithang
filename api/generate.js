const MODELS=["gemini-3.5-flash-lite","gemini-3.1-flash-lite","gemini-3.5-flash","gemini-3-flash-preview"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function promptForBatch(common,students,subject){
 const names=students.map(s=>s.tenHocVien);
 return `Bạn là giáo viên KAPLA viết phiếu đánh giá học tập OIEC THEO THÁNG.
Đánh giá RIÊNG từng học viên từ dữ liệu thực tế; không trộn dữ liệu học viên. Buổi vắng không phải điểm thấp. Không bịa thông tin. Câu ngắn, tự nhiên. Bộ môn: ${subject}.
diemTieuChi AI chỉ dùng 4 hoặc 5. mucDoHoanThien chỉ "Đúng yêu cầu" hoặc "Có sáng tạo".
Trả JSON THUẦN:
{"students":{"TÊN":{"chuyenMon":["","","","",""],"kienThucLapTrinh":"","kyNangRobotics":"","sanPhamDuAn":"","mucDoHoanThien":"Đúng yêu cầu","diemTieuChi":{"Thái độ & tinh thần học tập":4,"Kỹ năng hợp tác & giao tiếp":4,"Kỹ năng thực hành & sáng tạo":4,"Tính kiên trì & tự giác":4,"Khả năng tiếp thu & vận dụng kiến thức":4,"Tiến bộ cá nhân & đạo đức":4}}}}
Phải đủ đúng key: ${JSON.stringify(names)}
THÔNG TIN THÁNG: ${JSON.stringify(common)}
DỮ LIỆU HỌC VIÊN: ${JSON.stringify(students)}`;
}
async function callModel(key,model,prompt,ms=6500){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),ms);
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},signal:c.signal,body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:.45}})});
  const raw=await r.text();let j;try{j=JSON.parse(raw)}catch(_){throw Error(`${model}: API trả non-JSON`)}
  if(!r.ok){const msg=j?.error?.message||`HTTP ${r.status}`;const err=Error(`${model}: ${msg}`);err.status=r.status;throw err}
  let t=j?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";t=t.replace(/^```json\s*/i,"").replace(/```$/,"").trim();
  try{return JSON.parse(t)}catch(_){throw Error(`${model}: AI trả non-JSON`)}
 }catch(e){if(e?.name==="AbortError")throw Error(`${model}: timeout ${ms/1000}s`);throw e}finally{clearTimeout(timer)}
}
function kind(msg=""){
 if(/quota exceeded|free_tier_requests|rate.?limit|429/i.test(msg))return "quota";
 if(/high demand|unavailable|overload|503/i.test(msg))return "busy";
 if(/timeout/i.test(msg))return "timeout";
 return "other";
}
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(500).json({error:"Chưa cấu hình GEMINI_API_KEY."});
 const data=req.body?.data,subject=req.body?.subject||"Coding / Robotics";
 if(!data?.hocVien?.length)return res.status(400).json({error:"Không có dữ liệu học viên."});
 if(data.hocVien.length>5)return res.status(400).json({error:"Mỗi request tối đa 5 học viên."});
 const common={tenLop:data.tenLop,thang:data.thang,soBuoi:data.soBuoi,noiDungThang:data.noiDungThang},prompt=promptForBatch(common,data.hocVien,subject);
 const seed=Math.max(0,(Number(req.body?.batch)||1)-1);
 // Chỉ tối đa 2 model/request để không kéo dài Vercel invocation.
 const tries=[MODELS[seed%MODELS.length],MODELS[(seed+1)%MODELS.length]];
 let last="",lastKind="";
 for(let i=0;i<tries.length;i++){
  const model=tries[i];
  try{
   const out=await callModel(key,model,prompt,6500),students=out?.students||{};
   const missing=data.hocVien.filter(s=>!students[s.tenHocVien]).map(s=>s.tenHocVien);
   if(missing.length)throw Error(`${model}: thiếu ${missing.join(", ")}`);
   return res.status(200).json({students,model});
  }catch(e){
   last=e.message;lastKind=kind(last);
   // High demand thường tạm thời: nghỉ ngắn trước model kế tiếp.
   if(lastKind==="busy")await sleep(900);
   // Quota model này hết: chuyển model ngay, không retry spam cùng model.
  }
 }
 return res.status(502).json({error:last||"Gemini lỗi",errorType:lastKind,students:{}});
}