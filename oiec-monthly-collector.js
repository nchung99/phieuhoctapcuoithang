(async () => {
    const SO_BUOI = 4;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    const fullClassName =
        document.querySelector('.moduleTitle h2 a')?.innerText.trim() || '';

    const tenLop = fullClassName
        .split('(')[0]
        .trim()
        .replace(/[\[\]]/g, '');

    const cacBuoi = [];

    function docBuoi() {
        const activityText =
            document.querySelector('.activity-name')?.innerText.trim() || '';

        const ngayHoc =
            document.getElementById('selected_date')?.innerText.trim() || '';

        const tenBaiHoc =
            document.querySelector(
                '#syllabus_info .ss-syllabus[data-type=topic]'
            )?.innerText.trim() || '';

        const noiDungBaiHoc =
            document.querySelector(
                '#syllabus_info .ss-syllabus[data-type=syllabus]'
            )?.innerText.trim() || '';

        const hocVien = [];

        document.querySelectorAll('table.list-student tbody tr').forEach(row => {
            const tenHocVien =
                row.querySelector('.student_name')?.innerText.trim() || '';
            if (!tenHocVien) return;

            const nickName = row.children[3]?.innerText.trim() || '';
            const attendance = row.querySelector('.attendance_type');
            const maDiemDanh = attendance?.value || '';
            const diemDanh =
                attendance?.options[attendance.selectedIndex]?.text.trim() || '';
            const score =
                row.querySelector('.homework_score')?.value.trim() || '';
            const nhanXetGiaoVien =
                row.children[8]?.querySelector('textarea')?.value.trim() || '';

            hocVien.push({
                tenHocVien,
                nickName,
                maDiemDanh,
                diemDanh,
                diem: score === '' ? null : Number(score),
                nhanXetGiaoVien
            });
        });

        return {
            ngayHoc,
            tenBuoiHoc: activityText,
            tenBaiHoc,
            noiDungBaiHoc,
            hocVien
        };
    }

    for (let i = 0; i < SO_BUOI; i++) {
        const buoi = docBuoi();
        cacBuoi.unshift(buoi);
        console.log('✅ Đã lấy ' + (i + 1) + '/' + SO_BUOI + ':', buoi.ngayHoc, buoi.tenBaiHoc);

        if (i < SO_BUOI - 1) {
            const prevBtn =
                document.querySelector('.switch-date[data-tooltip="Ngày hôm trước"]') ||
                document.querySelector('a[data-tooltip="Ngày hôm trước"]');

            if (!prevBtn) {
                alert('Không tìm thấy nút quay lại buổi trước.');
                return;
            }

            prevBtn.click();
            await wait(4000);
        }
    }

    const mapHocVien = new Map();

    cacBuoi.forEach(buoi => {
        buoi.hocVien.forEach(hv => {
            if (!mapHocVien.has(hv.tenHocVien)) {
                mapHocVien.set(hv.tenHocVien, {
                    tenHocVien: hv.tenHocVien,
                    nickName: hv.nickName,
                    cacBuoi: []
                });
            }

            mapHocVien.get(hv.tenHocVien).cacBuoi.push({
                ngayHoc: buoi.ngayHoc,
                tenBaiHoc: buoi.tenBaiHoc,
                diemDanh: hv.diemDanh,
                maDiemDanh: hv.maDiemDanh,
                diem: hv.diem,
                nhanXetGiaoVien: hv.nhanXetGiaoVien
            });
        });
    });

    const hocVien = [...mapHocVien.values()].map(hv => {
        const coMat = hv.cacBuoi.filter(
            b => b.maDiemDanh === 'P' || b.maDiemDanh === 'L'
        );

        const diem = coMat.map(b => b.diem).filter(Number.isFinite);

        return {
            ...hv,
            soBuoiThamGia: coMat.length,
            tongSoBuoi: cacBuoi.length,
            diemTrungBinh: diem.length
                ? Math.round((diem.reduce((a, b) => a + b, 0) / diem.length) * 100) / 100
                : null
        };
    }).filter(hv => hv.soBuoiThamGia > 0); // Vắng cả 4 buổi: không đưa vào báo cáo tháng.

    const ngayMoiNhat = cacBuoi[cacBuoi.length - 1]?.ngayHoc || '';
    const parts = ngayMoiNhat.split('/');
    const thang = parts[1] || '';
    const nam = parts[2] || '';

    const result = {
        loaiBaoCao: 'KAPLA_OIEC_MONTHLY',
        tenLop,
        thang: thang + '/' + nam,
        soBuoi: cacBuoi.length,
        noiDungThang: cacBuoi.map(b => ({
            ngayHoc: b.ngayHoc,
            tenBuoiHoc: b.tenBuoiHoc,
            tenBaiHoc: b.tenBaiHoc,
            noiDungBaiHoc: b.noiDungBaiHoc
        })),
        hocVien
    };

    console.clear();
    console.log('✅ DỮ LIỆU THÁNG:', result);
    console.log(JSON.stringify(result, null, 2));

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenLop + ' - thang-' + thang + '-' + nam + '.json';
    a.click();
    URL.revokeObjectURL(a.href);

    alert(
        '✅ Hoàn tất!\n\n' +
        'Lớp: ' + tenLop + '\n' +
        'Đã lấy: ' + cacBuoi.length + '/4 buổi\n' +
        'Học viên có tham gia trong tháng: ' + hocVien.length + '\n\n' +
        'JSON đã được tải xuống.'
    );
})();