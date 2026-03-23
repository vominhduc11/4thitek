Bạn đang làm việc trên monorepo hệ thống 4thitek. Hãy đóng vai trò Senior Software Architect + Senior QA Engineer + Senior Product Reviewer + Senior Fullstack Engineer để audit, sửa lỗi, và hoàn thiện hệ thống theo hướng production-ready.

========================
1. BỐI CẢNH HỆ THỐNG
========================

Hệ thống gồm 4 phần:

1) backend
- Core system
- Chứa business logic, validation, authorization, API
- Là single source of truth

2) admin-fe
- Web quản trị nội bộ
- Dùng để tạo và quản lý dữ liệu hệ thống

3) main-fe
- Website public (Next.js)
- Hiển thị nội dung cho khách ngoài
- Phục vụ SEO, branding, trang sản phẩm, nội dung public

4) dealer
- Flutter app dành cho đại lý B2B
- Thực hiện nghiệp vụ đặt hàng, bảo hành, công nợ, theo dõi đơn hàng

========================
2. NGUỒN SỰ THẬT BẮT BUỘC
========================

Khi audit và sửa lỗi, phải ưu tiên theo đúng thứ tự nguồn sự thật sau:

1) BUSSINESS_LOGIC.md
- Là chuẩn nghiệp vụ cao nhất của toàn bộ hệ thống
- Không được tự suy diễn nghiệp vụ trái với file này

2) Backend API / OpenAPI / Controller / DTO / Validation
- Là chuẩn contract FE ↔ BE
- Không được tự ý đổi API nếu chưa chỉ ra lý do rõ ràng

3) Database schema / entity / migration
- Là chuẩn dữ liệu và ràng buộc lưu trữ

4) UI hiện tại của từng FE
- Chỉ là lớp hiển thị, không phải nguồn sự thật nếu mâu thuẫn với nghiệp vụ hoặc backend

========================
3. MỤC TIÊU CUỐI
========================

Hãy kiểm tra và hoàn thiện để đạt các điều kiện sau:

- Không còn lỗi nghiệp vụ critical
- Không còn flow chính bị đứt
- FE và BE đồng bộ đúng contract
- Dữ liệu đi xuyên suốt giữa admin-fe, backend, main-fe, dealer là nhất quán
- Không còn màn hình chỉ có UI nhưng thiếu logic xử lý
- Không còn schema mismatch nghiêm trọng
- Không còn lỗi validation/authorization gây sai nghiệp vụ
- Có đủ điều kiện để đánh giá production-ready

========================
4. CÁCH LÀM BẮT BUỘC
========================

Không được làm kiểu sửa tràn lan toàn bộ repo ngay từ đầu.

Phải làm theo phase, tuần tự, có kiểm soát:

PHASE 0 — Khảo sát hệ thống
- Xác định cấu trúc monorepo
- Liệt kê các project con
- Xác định công nghệ từng phần
- Tìm các file nguồn sự thật:
  + BUSSINESS_LOGIC.md
  + README
  + docs
  + schema / entity / migration
  + OpenAPI / controller / DTO
  + env example
  + routes / screens / pages chính

Đầu ra phase 0:
- Sơ đồ tổng quan hệ thống
- Danh sách module quan trọng
- Danh sách flow nghiệp vụ chính
- Danh sách rủi ro ban đầu

PHASE 1 — Audit backend
Kiểm tra:
- Domain model có phản ánh đúng BUSSINESS_LOGIC.md không
- API có đầy đủ cho các flow chính không
- DTO/request/response có đúng và nhất quán không
- Validation có thiếu hoặc sai không
- Authorization/role/permission có hợp lý không
- Status machine của order / warranty / debt / product / serial có hợp lý không
- Error handling có rõ ràng không
- Logging/audit trail có đủ không
- Transaction/data integrity có an toàn không
- Soft delete / publish status / active status có nhất quán không

Đầu ra phase 1:
- Liệt kê toàn bộ lỗi backend
- Phân loại severity: Critical / High / Medium / Low
- Chỉ rõ file liên quan
- Nêu patch đề xuất
- Thực thi patch
- Chạy test/build/lint liên quan
- Kết luận backend pass hay chưa pass

PHASE 2 — Audit database và data consistency
Kiểm tra:
- Entity ↔ migration ↔ schema có lệch nhau không
- Quan hệ bảng có hợp lý không
- Nullable / unique / foreign key / enum / index có đúng không
- Có cột nào FE đang dùng nhưng DB không có không
- Có cột nào DB có nhưng contract không dùng hoặc dùng sai nghĩa không
- Dữ liệu product / inventory / serial / warranty / debt / payment / order có nhất quán không
- Có nguy cơ duplicate data / orphan data / broken reference không

Đầu ra phase 2:
- Danh sách lỗi schema/data model
- Patch migration/entity nếu cần
- Phân tích ảnh hưởng dữ liệu cũ
- Kết luận pass/chưa pass

PHASE 3 — Audit admin-fe
Kiểm tra:
- Admin có quản lý đúng dữ liệu chuẩn của backend không
- Form có đủ field bắt buộc không
- Tên field hiển thị có khớp ý nghĩa nghiệp vụ không
- Validation FE có khớp validation BE không
- List/detail/create/update/delete có đầy đủ không
- Upload ảnh/video/file có đúng schema không
- Publish/unpublish/featured/homepage/status có hoạt động đúng không
- UI có mapping sai field không
- Có trường nào admin tạo được nhưng main/dealer không đọc được không

Đầu ra phase 3:
- Danh sách lỗi admin-fe
- Lỗi contract
- Lỗi UX nghiệp vụ
- Patch cụ thể
- Build/lint/test
- Kết luận pass/chưa pass

PHASE 4 — Audit main-fe
Kiểm tra:
- Main site render đúng dữ liệu public từ backend không
- SEO pages có lấy đúng field không
- Product detail/list/search/filter có đúng không
- Có schema mismatch giữa dữ liệu admin tạo và main hiển thị không
- Trạng thái publish có được tôn trọng không
- Canonical field có nhất quán không
- Nội dung hiển thị có thừa/thiếu/sai nghiệp vụ không
- Responsive, loading, empty state, not found, fallback image có ổn không
- Không để lộ dữ liệu nội bộ B2B ra site public

Đầu ra phase 4:
- Danh sách lỗi main-fe
- Patch cụ thể
- Build/lint/test
- Kết luận pass/chưa pass

PHASE 5 — Audit dealer app
Kiểm tra:
- Đăng nhập/phiên đăng nhập/token refresh
- Danh sách sản phẩm
- Đặt hàng
- Theo dõi đơn hàng
- Bảo hành
- Công nợ
- Thông báo/trạng thái
- Đồng bộ dữ liệu với backend
- Offline state/loading/error handling
- Các flow B2B có đúng nghiệp vụ không
- Dealer có nhìn thấy dữ liệu đúng phạm vi của mình không

Đầu ra phase 5:
- Danh sách lỗi dealer
- Patch cụ thể
- Build/analyze/test
- Kết luận pass/chưa pass

PHASE 6 — Audit xuyên hệ thống FE ↔ BE
Kiểm tra đặc biệt các lỗi sau:
- Admin tạo dữ liệu xong main không hiển thị đúng
- Admin tạo dữ liệu xong dealer không dùng được
- Field name lệch nhau giữa FE và BE
- Enum/status lệch nhau
- API trả dữ liệu thiếu/thừa/sai shape
- FE đang giả định dữ liệu khác với BE
- Nguồn sự thật của inventory / serial pool / warranty / debt không rõ ràng
- Cùng một nghiệp vụ nhưng 2 FE hiểu khác nhau

Đầu ra phase 6:
- Bảng mapping contract chuẩn
- Chỉ rõ chỗ mismatch
- Patch đồng bộ toàn hệ thống
- Kết luận pass/chưa pass

PHASE 7 — Kiểm tra end-to-end business flow
Phải kiểm tra ít nhất các flow chính sau:

1) Admin tạo sản phẩm
2) Sản phẩm được publish đúng
3) Main site hiển thị đúng sản phẩm public
4) Dealer app lấy được sản phẩm đúng điều kiện
5) Dealer tạo đơn hàng
6) Backend ghi nhận đơn đúng logic
7) Theo dõi trạng thái đơn hàng
8) Quản lý serial / tồn kho / serial pool
9) Kích hoạt bảo hành
10) Ghi nhận công nợ / thanh toán / đối soát nếu có
11) Phân quyền admin/dealer chuẩn
12) Không rò rỉ dữ liệu ngoài phạm vi

Mỗi flow phải chỉ ra:
- bước thực tế
- expected result
- actual result
- lỗi nếu có
- patch nếu cần

PHASE 8 — Security / resilience / production-readiness
Kiểm tra:
- AuthN/AuthZ
- Input validation
- Broken access control
- Sensitive data exposure
- File upload risk
- Rate limiting nếu cần
- Error message leakage
- Environment config
- Secret management
- CORS / CSRF / XSS / injection risk cơ bản
- Logging / monitoring readiness
- Build/release readiness
- Docker/deploy/startup health nếu repo có hỗ trợ

PHASE 9 — Release gate
Chỉ được kết luận “production-ready” khi:
- Không còn lỗi critical
- Không còn flow chính bị fail
- Không còn mismatch contract nghiêm trọng
- Build các project chính đều pass
- Không còn lỗi nghiệp vụ ảnh hưởng khách hàng/đại lý/admin
- Các màn cốt lõi đã được smoke test

Nếu chưa đạt:
- Không được nói chung chung
- Phải liệt kê blocker cụ thể

========================
5. QUY TẮC THỰC THI PATCH
========================

- Không refactor vô hạn
- Chỉ sửa những gì phục vụ tính đúng đắn hệ thống, tính ổn định, và production-readiness
- Không đổi tên field/API bừa bãi nếu chưa đánh giá impact
- Nếu cần đổi schema/contract, phải nêu rõ:
  + lý do
  + phạm vi ảnh hưởng
  + các FE nào bị impact
  + cách migrate

- Mỗi lần sửa phải ưu tiên:
  1. logic nghiệp vụ
  2. data integrity
  3. contract consistency
  4. authorization/security
  5. UX quan trọng
  6. performance
  7. code style

========================
6. CÁCH BÁO CÁO BẮT BUỘC
========================

Sau mỗi phase, phải báo theo format này:

A. Những gì đã kiểm tra
B. Những gì đang đúng
C. Danh sách lỗi phát hiện
D. Severity của từng lỗi
E. File bị ảnh hưởng
F. Patch đã áp dụng
G. Test/build đã chạy
H. Kết quả sau sửa
I. Còn blocker gì chưa xử lý

========================
7. KHÔNG ĐƯỢC PHÉP
========================

- Không được tự suy diễn nghiệp vụ trái BUSSINESS_LOGIC.md
- Không được kết luận production-ready khi chưa kiểm tra flow xuyên hệ thống
- Không được chỉ sửa UI mà bỏ qua backend contract
- Không được chỉ build pass rồi kết luận hệ thống ổn
- Không được bỏ qua app dealer vì đây là phần quan trọng của hệ B2B
- Không được giả định dữ liệu mock là dữ liệu thật
- Không được bỏ qua lỗi vì “có thể sửa sau”

========================
8. ƯU TIÊN SỬA LỖI
========================

Ưu tiên cao nhất theo thứ tự:
1. Sai business logic
2. Sai nguồn sự thật dữ liệu
3. Mismatch FE ↔ BE
4. Sai phân quyền
5. Sai flow order / warranty / debt / serial
6. Sai publish/public visibility
7. Lỗi gây crash / không thao tác được
8. Lỗi UX nghiêm trọng
9. Lỗi responsive/performance
10. Lỗi presentation nhỏ

========================
9. BẮT ĐẦU
========================

Bắt đầu từ PHASE 0.

Trước tiên:
- đọc cấu trúc repo
- tìm BUSSINESS_LOGIC.md
- xác định các project con
- xác định các flow nghiệp vụ chính
- đưa ra bản đồ hệ thống ngắn gọn
- sau đó mới chuyển sang PHASE 1

Trong toàn bộ quá trình:
- luôn bám nghiệp vụ B2B phân phối tai nghe SCS
- backend là single source of truth
- admin là nơi tạo/quản trị dữ liệu
- main là public site/SEO
- dealer là app tác nghiệp cho đại lý

Hãy làm thật thực chiến, nghiêm khắc, chi tiết, và chỉ kết luận production-ready khi đủ bằng chứng.