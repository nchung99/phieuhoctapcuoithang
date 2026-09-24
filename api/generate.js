const MODELS=["gemini-3.5-flash","gemini-3.5-flash-lite"];

async function gemini(key,prompt){
 let last="";
 for(const model of MODELS){
  try{
   const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
   const r=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     contents:[{parts:[{text:prompt}]}],
     generationConfig:{
      responseMimeType:"application/json",
      temperature:0.55
     }
    })
   });
   const j=await r.json();
   if(!r.ok)throw Error(j?.error?.message||`${model} lỗi`);
   let t=j?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";
   t=t.replace(/^```json\s*/i,"").replace(/```$/,"").trim();
   return JSON.parse(t);
  }catch(e){last=e.message}
 }
 throw Error(last||"Gemini lỗi");
}

function promptForBatch(common,students,subject){
 const names=students.map(s=>s.tenHocVien);
 return `Bạn là giáo viên KAPLA viết phiếu đánh giá học tập OIEC THEO THÁNG.

Hãy đánh giá RIÊNG TỪNG học viên trong batch dưới đây dựa trên dữ liệu thực tế 4 tuần.
Mỗi học viên phải được xử lý độc lập; tuyệt đối không sao chép cùng một nhận xét rồi chỉ thay tên.

NGUYÊN TẮC:
- Chỉ dùng dữ liệu có thật: bài học, điểm danh, điểm số, nhận xét giáo viên.
- Buổi vắng KHÔNG phải điểm thấp. Đánh giá trên các buổi học viên thực sự tham gia.
- Xem chuỗi điểm/nhận xét theo thời gian để nhận biết tiến bộ.
- Không tự bịa hành vi, làm việc nhóm, đạo đức, sáng tạo, lắp ráp... nếu dữ liệu không hỗ trợ.
- Câu chữ ngắn, tự nhiên như giáo viên viết.
- Bộ môn: ${subject}.
- Điểm tiêu chí chung nên chủ yếu 4-5 khi học viên học bình thường/tốt:
  + 5: kết quả/nhận xét tích cực rõ, thể hiện tốt hoặc có tiến bộ.
  + 4: học ổn định, không có dấu hiệu tiêu cực; đây là mức thông thường.
  + 3: chỉ khi có căn cứ rõ là cần cải thiện.
  + 1-2: chỉ khi có bằng chứng rất rõ về khó khăn/hạn chế đáng kể.
- Không hạ xuống 3 chỉ vì nhận xét không nhắc trực tiếp tiêu chí.
- mucDoHoanThien bắt buộc CHÍNH XÁC một trong hai giá trị: "Đúng yêu cầu", "Có sáng tạo". Không được trả về "Đạt tối thiểu".

Trả về JSON THUẦN, không markdown, đúng dạng:
{
 "students":{
   "TÊN HỌC VIÊN":{
     "chuyenMon":[
       "nhận xét tư duy Logic trong lập trình",
       "nhận xét kỹ năng phân tích và xử lý vấn đề",
       "nhận xét khả năng sáng tạo",
       "nhận xét tiếp thu kiến thức và ghi nhớ",
       "nhận xét khả năng làm việc nhóm"
     ],
     "kienThucLapTrinh":"2-3 câu",
     "kyNangRobotics":"2-3 câu theo bộ môn thực tế",
     "sanPhamDuAn":"2-3 câu",
     "mucDoHoanThien":"Đúng yêu cầu",
     "diemTieuChi":{
       "Thái độ & tinh thần học tập":4,
       "Kỹ năng hợp tác & giao tiếp":4,
       "Kỹ năng thực hành & sáng tạo":4,
       "Tính kiên trì & tự giác":4,
       "Khả năng tiếp thu & vận dụng kiến thức":4,
       "Tiến bộ cá nhân & đạo đức":4
     }
   }
 }
}

Phải có ĐỦ và ĐÚNG các key tên sau: ${JSON.stringify(names)}

THÔNG TIN THÁNG:
${JSON.stringify(common)}

DỮ LIỆU CÁC HỌC VIÊN:
${JSON.stringify(students)}`;
}

function chunks(arr,size){
 const out=[];
 for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));
 return out;
}

async function generateBatch(key,common,students,subject){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const result=await gemini(key,promptForBatch(common,students,subject));
   const map=result?.students||{};
   for(const s of students){
    if(!map[s.tenHocVien]) throw Error(`AI thiếu kết quả của ${s.tenHocVien}`);
   }
   return map;
  }catch(e){
   last=e;
   if(attempt===0)await new Promise(r=>setTimeout(r,900));
  }
 }
 throw last;
}

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(500).json({error:"Chưa cấu hình GEMINI_API_KEY trên Vercel."});

 const data=req.body?.data;
 const subject=req.body?.subject||"Coding / Robotics";
 if(!data?.hocVien?.length)return res.status(400).json({error:"Không có dữ liệu học viên."});

 const common={
  tenLop:data.tenLop,
  thang:data.thang,
  soBuoi:data.soBuoi,
  noiDungThang:data.noiDungThang
 };

 // 5 học viên / 1 Gemini request:
 // 19 học viên ~= 4 request thay vì 19 request.
 const BATCH_SIZE=5;
 const batches=chunks(data.hocVien,BATCH_SIZE);
 const students={};
 const failed=[];

 for(let i=0;i<batches.length;i++){
  try{
   Object.assign(students,await generateBatch(key,common,batches[i],subject));
  }catch(e){
   failed.push({
    batch:i+1,
    names:batches[i].map(s=>s.tenHocVien),
    error:e.message
   });
   // Nếu quota đã hết thì dừng ngay để không đốt thêm request.
   if(/quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(e.message||""))break;
  }
 }

 const completed=Object.keys(students).length;
 if(!completed){
  const msg=failed[0]?.error||"Không tạo được đánh giá AI.";
  return res.status(429).json({error:msg,students:{},failed});
 }

 // Trả partial success để client lưu được các batch đã xong.
 return res.status(200).json({
  students,
  completed,
  total:data.hocVien.length,
  failed
 });
}