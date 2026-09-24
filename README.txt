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

v5.0:
- AI chấm tiêu chí chung mềm và hợp lý hơn: học ổn định/tích cực thường ở mức 4;
  mức 3 chỉ khi có dấu hiệu trung bình/cần cải thiện, 1-2 cần bằng chứng rõ; 5 cần tín hiệu nổi bật.
- Không còn mặc định thiếu dữ liệu = 3.
- Thu gọn header, khoảng cách section, ô thông tin, 4 tuần, đánh giá chuyên môn,
  bảng năng lực và bảng tiêu chí để PDF vừa đúng 1 trang A4.
- API PDF dùng kích thước chính xác 210x297mm và printBackground.

v5.1 MULTI-CLASS
- Nhập nhiều file JSON cùng lúc.
- Có dropdown Lớp + Học viên.
- Generate AI toàn bộ các lớp; trong mỗi lớp chạy tối đa 4 học viên song song.
- Mỗi học viên lỗi được retry 1 lần.
- ZIP tách riêng từng lớp.
- Tên ZIP = mã lớp (ví dụ KP09.zip).
- PDF bên trong vẫn = họ tên học viên (ví dụ Nguyễn Công Hưng.pdf).

v5.1.1 BALANCED LAYOUT
- Giữ PDF đúng 1 trang A4.
- Nới lại line-height, chiều cao ô và khoảng cách section.
- Header lớn hơn v5.0 một chút nhưng vẫn gọn.
- Bảng tiêu chí không còn dồn sát.
- Footer neo xuống đáy, tổng thể phân bố đều hơn và giảm khoảng trắng lớn cuối trang.

v5.2
- Fix dòng cuối bảng tiêu chí bị cắt khỏi A4.
- AI ưu tiên mặt bằng 4-5 cho học viên học ổn định/tốt.
- Click vòng tròn 1-5 để sửa điểm sau AI.
- Click mức hoàn thiện để sửa Đạt tối thiểu / Đúng yêu cầu / Có sáng tạo.
- Chỉnh tay lưu theo lớp + học viên và dùng khi xuất PDF.

v5.2.1 FIX COMPLETION/PDF
- Fix mức độ hoàn thiện không tick: render dùng đúng AI + manual override.
- Fix radio tick bị mất khi xuất PDF: đồng bộ checked property thành checked attribute trước khi clone HTML.
- Khi ZIP nhiều học viên/lớp, mỗi học viên được render lại đúng AI + chỉnh tay riêng.
- Manual điểm và mức hoàn thiện được load đúng theo từng lớp khi export.
- Giữ mặt bằng điểm AI chủ yếu 4-5.

v5.3 TRUE BATCH AI
- 5 học viên dùng chung 1 Gemini request thay vì 1 request/học viên.
- Ví dụ 19 học viên chỉ khoảng 4 request cho một lớp.
- Mỗi học viên vẫn có dữ liệu riêng và kết quả riêng trong JSON response.
- Retry theo batch; nếu quota/rate-limit thì dừng để không đốt thêm request.
- Batch đã thành công được lưu ngay/merge vào localStorage, không mất kết quả cũ.
- Giữ fix completion tick/PDF, manual score/completion, Multi-Class và ZIP riêng từng lớp.

v5.3.1
- ZIP dùng đầy đủ mã lớp thay vì chỉ phần mã ngắn.
- Ví dụ:
  TC-KPRBT03-0029 (>= 7 tuổi) -> TC-KPRBT03-0029.zip
  TC-KPRBT03-0028 (5 - 6 tuổi) -> TC-KPRBT03-0028.zip
- PDF bên trong vẫn giữ tên học viên, ví dụ Nguyễn Công Hưng.pdf.

v5.4 BALANCED FINAL
- Phân bố lại chiều cao toàn phiếu để giảm khoảng trắng lớn cuối trang.
- Nới khoảng cách section, ô nội dung, nhận xét, năng lực và từng dòng tiêu chí.
- Vẫn khóa đúng 1 trang A4.
- Mức độ hoàn thiện chỉ còn: Đúng yêu cầu / Có sáng tạo.
- AI bị cấm trả về Đạt tối thiểu; lựa chọn này cũng được ẩn khỏi phiếu.

v5.4.1
- Mã lớp giữ nguyên chuỗi từ EMS; đổi riêng font mã lớp sang Arial để số 0 không bị nhìn giống chữ o.
- Tiêu chí chung chỉ dùng mức 4 hoặc 5.
- AI bị cấm trả 1/2/3.
- Điểm cũ 1/2/3 nếu còn cache sẽ hiển thị tối thiểu là 4.
- Chỉnh tay chỉ cho chọn 4 hoặc 5.

v5.4.2
- AI tự chấm tiêu chí: chỉ 4 hoặc 5.
- Giáo viên chỉnh tay: chọn tự do từ 1 đến 5.
- Điểm chỉnh tay được lưu theo học viên/lớp và dùng khi xuất PDF.
- Mã lớp vẫn dùng font dễ phân biệt số 0 và chữ O.

v5.5 MULTI-WORKER
- Generate AI nhiều lớp bằng worker pool tối đa 4 luồng song song.
- Mỗi luồng nhận nguyên một lớp; server của lớp đó tiếp tục chia 5 học viên/batch và chạy tuần tự.
- Không trộn học viên giữa các lớp.
- Tất cả request vẫn dùng cùng GEMINI_API_KEY và cùng model/fallback; đây là nhiều request song song, không phải nhiều tài khoản Gemini.
- Batch hoàn thành được lưu theo đúng classKey của lớp.

v5.6 MULTI-MODEL WORKER
- Giữ worker pool tối đa 4 lớp song song từ v5.5.
- Mỗi lớp vẫn tách batch 5 học viên; tuyệt đối không trộn dữ liệu giữa lớp.
- Mỗi batch phân phối round-robin qua 4 model stable:
  gemini-3.5-flash-lite
  gemini-3.1-flash-lite
  gemini-3.5-flash
  gemini-3.6-flash
- Nếu model được chọn lỗi/quota, chính batch đó thử lần lượt các model còn lại.
- Dùng chung GEMINI_API_KEY; không cần thêm key.

v5.7 RETRY FAILED BATCH
- Batch lỗi không chặn batch sau; các batch khác vẫn tiếp tục.
- Web hiện nút Retry riêng cho từng batch lỗi, có tên lớp + số batch.
- Retry chỉ gửi lại đúng danh sách học viên của batch lỗi (tối đa 5), không chạy lại batch đã thành công.
- Kết quả retry merge về đúng classKey và lưu localStorage.
- Multi-worker + multi-model của v5.6 giữ nguyên.

v5.8 EDIT PANEL (base v5.7)
- Phiếu giữ nguyên, không có contenteditable trực tiếp.
- Thêm nút "Chỉnh sửa" để mở panel khi cần.
- Panel sửa: học viên, lớp, giáo viên, center, bộ môn, tháng, thời lượng, 4 buổi học,
  5 dòng chuyên môn, 3 nội dung năng lực/sản phẩm.
- Lưu xong mới cập nhật preview/PDF.
- Điểm tiêu chí + mức độ hoàn thiện vẫn chỉnh theo UI cũ.
- Multi-worker, multi-model, retry đúng batch lỗi của v5.7 giữ nguyên.
