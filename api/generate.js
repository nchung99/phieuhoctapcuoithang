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

function promptFor(common,student,subject){
 return `Bạn là giáo viên KAPLA viết phiếu đánh giá học tập OIEC THEO THÁNG.

Hãy đánh giá RIÊNG học viên dưới đây dựa trên dữ liệu thực tế của 4 tuần. Không dùng nhận xét chung cho cả lớp.

NGUYÊN TẮC:
- Chỉ dùng thông tin có trong dữ liệu: bài học, điểm danh, điểm số, nhận xét giáo viên.
- Buổi vắng không được tính như điểm thấp. Nếu tham gia 3/4 buổi thì đánh giá trên 3 buổi đã học và hiểu rằng học viên tham gia 3/4.
- So sánh chuỗi điểm và nhận xét theo thời gian để nhận biết tiến bộ.
- Không tự bịa việc lắp ráp robot, làm việc nhóm, thái độ, sáng tạo... nếu dữ liệu không cho thấy điều đó.
- Thang điểm tiêu chí chung cần phù hợp với phiếu đánh giá gửi phụ huynh:
  + 5: thể hiện tốt/nổi bật hoặc duy trì kết quả rất tốt, có bằng chứng tích cực rõ.
  + 4: đạt tốt/ổn định; đây là mức phù hợp khi học viên học đều, điểm số tốt và không có dấu hiệu tiêu cực.
  + 3: chỉ dùng khi dữ liệu cho thấy tiêu chí ở mức trung bình hoặc có điểm cần cải thiện rõ.
  + 1-2: chỉ dùng khi dữ liệu thực sự có bằng chứng về khó khăn/hạn chế đáng kể.
- Không được tự động cho 3 chỉ vì nhận xét giáo viên không nhắc trực tiếp một tiêu chí. Hãy kết hợp điểm số, mức độ ổn định, sự tham gia và nhận xét của các buổi; nếu kết quả học tập ổn định/tích cực và không có dấu hiệu tiêu cực thì có thể dùng mức 4.
- Điểm 5 vẫn cần tín hiệu tích cực rõ ràng; không chấm tất cả học viên giống nhau.
- Câu chữ tự nhiên như giáo viên viết, ngắn gọn, tránh văn phong AI/sáo rỗng.
- Các học viên có dữ liệu khác nhau phải có nội dung khác nhau; không chỉ thay tên trong cùng một mẫu.
- Bộ môn của báo cáo: ${subject}.

Trả về JSON THUẦN đúng cấu trúc:
{
 "chuyenMon":[
  "nhận xét tư duy Logic trong lập trình",
  "nhận xét kỹ năng phân tích và xử lý vấn đề",
  "nhận xét khả năng sáng tạo",
  "nhận xét tiếp thu kiến thức và ghi nhớ",
  "nhận xét khả năng làm việc nhóm"
 ],
 "kienThucLapTrinh":"2-3 câu về kiến thức/lập trình thực tế trong tháng",
 "kyNangRobotics":"2-3 câu về kỹ năng theo bộ môn thực tế",
 "sanPhamDuAn":"2-3 câu về sản phẩm/dự án thực tế",
 "mucDoHoanThien":"Đạt tối thiểu hoặc Đúng yêu cầu hoặc Có sáng tạo",
 "diemTieuChi":{
  "Thái độ & tinh thần học tập":1,
  "Kỹ năng hợp tác & giao tiếp":1,
  "Kỹ năng thực hành & sáng tạo":1,
  "Tính kiên trì & tự giác":1,
  "Khả năng tiếp thu & vận dụng kiến thức":1,
  "Tiến bộ cá nhân & đạo đức":1
 }
}

Điểm tiêu chí là số nguyên 1-5. Không thêm field khác.

THÔNG TIN THÁNG:
${JSON.stringify(common)}

DỮ LIỆU RIÊNG HỌC VIÊN:
${JSON.stringify(student)}`;
}

async function runWithConcurrency(items,limit,worker){
 const results=new Array(items.length);
 let next=0;
 async function runner(){
  while(true){
   const i=next++;
   if(i>=items.length)return;
   results[i]=await worker(items[i],i);
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,items.length)},runner));
 return results;
}

async function generateStudent(key,common,student,subject){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{return await gemini(key,promptFor(common,student,subject))}
  catch(e){last=e;if(attempt===0)await new Promise(r=>setTimeout(r,700))}
 }
 throw last;
}

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(500).json({error:"Chưa cấu hình GEMINI_API_KEY trên Vercel."});
 const data=req.body?.data,subject=req.body?.subject||"Coding / Robotics";
 if(!data?.hocVien?.length)return res.status(400).json({error:"Không có dữ liệu học viên."});
 const common={tenLop:data.tenLop,thang:data.thang,soBuoi:data.soBuoi,noiDungThang:data.noiDungThang};
 try{
  const pairs=await runWithConcurrency(data.hocVien,4,async student=>{
   const result=await generateStudent(key,common,student,subject);
   return [student.tenHocVien,result];
  });
  return res.status(200).json({students:Object.fromEntries(pairs)});
 }catch(e){
  return res.status(500).json({error:e.message});
 }
}