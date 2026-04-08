# TKHITEK Core Commerce Design Skill

## Nguon chuan
- Brand guideline chinh: `D:\TKHITEK_BRANDGUIDELINE.pdf`
- Business/contract phai uu tien theo repo source of truth hien hanh, khong duoc tu y doi route, slug, SEO, API contract, hay business state.

## Rule bat buoc
- Khong duoc bi loi ma hoa tieng Viet.
- Khi sua file co noi dung tieng Viet, phai giu UTF-8, sua toi thieu, uu tien `apply_patch`, va kiem tra lai noi dung sau khi sua.
- Neu terminal hien thi mojibake, khong duoc tiep tuc ghi de mo quang; phai doc lai file an toan truoc khi sua tiep.

## Dinh huong thuong hieu
- Cam hung thuong hieu la cong nghe, vien tuong, tu do, chuyen dong, tre trung, va tinh than kham pha.
- Giao dien phai premium, ky thuat, gon, ro, co cau truc, khong duoc generic hoac qua trang tri.
- Noi dung phai uu tien ro gia tri san pham, do tin cay, va kha nang chuyen doi truoc cac hieu ung trang tri.

## Mau sac
- Mau nhan dien chinh: `#29ABE2`, `#0071BC`, `#3F4856`.
- Co the dung gradient giua `#29ABE2` va `#0071BC` lam diem nhan thuong hieu.
- Mau phu tro tu guideline: `#2BE086`, `#BDF919`, `#05A7AF`, `#0B5FF4`.
- Khong dung mau phu tro de thay mau logo chinh.
- Uu tien ty trong thi giac theo tinh than guideline: xanh/gradient la diem nhan chinh, mau toi va trung tinh chi dong vai tro nen, chu, va can bang.

## Typography
- Font chinh: `Source Sans Pro`.
- Font phu chi dung trong truong hop nhan manh hoac ngoai le: `Montserrat`.
- Khong dung qua 2 font trong cung mot bo cuc.
- Uu tien cap bac ro rang, de doc, do tuong phan cao, va nhat quan tren desktop/mobile.

## Logo va icon
- Logo TKHITEK duoc xay dung tu monogram `T` + `K`, goi tinh than canh chim, tu do, va chuyen dong.
- Phai ton trong cac bien the light/dark/positive/negative tuy theo nen.
- Trong cung mot bo giao tiep, cach dung mau va bien the logo phai nhat quan.
- O kich thuoc rat nho, duoc uu tien favicon/icon treatment va luoc bot chi tiet/slogan neu guideline yeu cau.
- Icon he thong chi nen dung cac mau nhan dien hoac bien the trang/den phu hop nen.

## Layout va grid
- Desktop uu tien bo cuc sach, can bang, de doc, co hierarchy ro.
- Su dung grid co ky luat; giu gutter trai/phai ro rang va noi dung nam trong mot he thong cot on dinh.
- Khong tao layout tax vo ly cho nguoi dung, nhat la tren desktop.
- Cac section phai thong nhat spacing, alignment, va rhythm; CTA hierarchy phai ro rang tren toan trang.

## Hinh anh va treatment
- Hinh anh nen dong nhat voi mau thuong hieu; co the dung lop mau hoac blend mode nhu `Darken`, `Multiply`, `Overlay` neu phu hop.
- Hieu ung chi la bo tro; khong duoc lam giam do doc, do tuong phan, hoac tinh chuyen nghiep.

## Social va content
- Chat giong hinh anh/noi dung phai truyen tai cong nghe, tre trung, phong cach, va kha nang ung dung thuc te.
- CTA phai co thu tu uu tien ro: mot huong chuyen doi chinh va mot vai huong phu, khong duoc canh tranh lan nhau.
- Empty state, loading state, trust signal, va editorial block phai dung ngu nghia; khong duoc dung copy sai trang thai.

## Nguyen tac thuc thi
- Uu tien refactor co trong tam, khong broad rewrite neu khong can thiet.
- Tai su dung token, component, va pattern san co truoc khi tao moi.
- Bao toan accessibility va progressive enhancement.
- Bat cu thay doi nao lien quan toi brand/UI phai duoc doi chieu voi `D:\TKHITEK_BRANDGUIDELINE.pdf` truoc khi chot.
