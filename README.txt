KAPLA OIEC Monthly v4.7

Cơ chế PDF mới:
- Không dùng canvas, html2canvas hoặc jsPDF.
- Mỗi học sinh được dựng thành HTML/CSS riêng.
- API /api/pdfzip dùng Chromium trên Vercel để in HTML/CSS thành PDF A4 với printBackground=true.
- Màu gradient, nền, badge và CSS được giữ khi xuất.
- Tên PDF: đúng tên học sinh, ví dụ Nguyễn Công Hưng.pdf.
- Tất cả PDF được gom thành một ZIP.

Lưu ý:
- Mở index.html bằng file:// vẫn dùng được để nhập JSON và kiểm tra giao diện.
- Nút Tải ZIP PDF cần deploy Vercel vì phần render PDF chạy server-side.

v4.8 OIEC CONCEPT:
- Bỏ hoàn toàn mục 06 - Nhận xét tháng.
- Bỏ phần Kiến thức trọng tâm trong mục 02.
- Đổi style phiếu sang concept form OIEC mẫu: khung đỏ, header đỏ nhạt, nền hồng kem,
  tiêu đề serif, đánh giá chuyên môn dạng khối, năng lực/sản phẩm dạng bảng 3 cột.
- Vẫn giữ nội dung báo cáo tháng và cơ chế HTML/CSS PDF ZIP của v4.7.

v4.9 AI
- Generate AI xử lý lần lượt từng học viên để giảm rate-limit.
- Mỗi học viên được gửi riêng lịch sử 4 tuần, điểm danh, điểm và nhận xét giáo viên.
- Buổi vắng không bị coi là điểm thấp.
- AI tự điền 5 đánh giá chuyên môn, 3 khối năng lực/sản phẩm, mức độ hoàn thiện và 6 điểm tiêu chí 1–5.
- Kết quả AI được lưu localStorage theo lớp + tháng.
- Generate AI cần deploy Vercel và có GEMINI_API_KEY.
