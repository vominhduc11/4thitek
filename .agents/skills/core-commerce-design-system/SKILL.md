# TKHITEK Core Commerce Design Skill

## Nguồn chuẩn
- Brand guideline chính: `D:\TKHITEK_BRANDGUIDELINE.pdf`
- Business/contract phải ưu tiên theo repo source of truth hiện hành, không được tự ý đổi route, slug, SEO, API contract, hay business state.

## Rule bắt buộc
- Không được bị lỗi mã hóa tiếng Việt.
- Mọi nội dung tiếng Việt phải được viết có dấu, không dùng tiếng Việt không dấu trừ khi là mã, tên file, biến, lệnh, hoặc chuỗi kỹ thuật bắt buộc phải giữ nguyên.
- Khi sửa file có nội dung tiếng Việt, phải giữ UTF-8, sửa tối thiểu, ưu tiên `apply_patch`, và kiểm tra lại nội dung sau khi sửa.
- Nếu terminal hiển thị mojibake, không được tiếp tục ghi đè mù quáng; phải đọc lại file an toàn trước khi sửa tiếp.

## Định hướng thương hiệu
- Cảm hứng thương hiệu là công nghệ, viễn tưởng, tự do, chuyển động, trẻ trung, và tinh thần khám phá.
- Giao diện phải premium, kỹ thuật, gọn, rõ, có cấu trúc, không được generic hoặc quá trang trí.
- Nội dung phải ưu tiên rõ giá trị sản phẩm, độ tin cậy, và khả năng chuyển đổi trước các hiệu ứng trang trí.

## Màu sắc
- Màu nhận diện chính: `#29ABE2`, `#0071BC`, `#3F4856`.
- Có thể dùng gradient giữa `#29ABE2` và `#0071BC` làm điểm nhấn thương hiệu.
- Màu phụ trợ từ guideline: `#2BE086`, `#BDF919`, `#05A7AF`, `#0B5FF4`.
- Không dùng màu phụ trợ để thay màu logo chính.
- Ưu tiên tỷ trọng thị giác theo tinh thần guideline: xanh/gradient là điểm nhấn chính, màu tối và trung tính chỉ đóng vai trò nền, chữ, và cân bằng.

## Typography
- Font chính: `Source Sans Pro`.
- Font phụ chỉ dùng trong trường hợp nhấn mạnh hoặc ngoại lệ: `Montserrat`.
- Không dùng quá 2 font trong cùng một bố cục.
- Ưu tiên cấp bậc rõ ràng, dễ đọc, độ tương phản cao, và nhất quán trên desktop/mobile.

## Logo và icon
- Logo TKHITEK được xây dựng từ monogram `T` + `K`, gợi tinh thần cánh chim, tự do, và chuyển động.
- Phải tôn trọng các biến thể light/dark/positive/negative tùy theo nền.
- Trong cùng một bộ giao tiếp, cách dùng màu và biến thể logo phải nhất quán.
- Ở kích thước rất nhỏ, được ưu tiên favicon/icon treatment và lược bớt chi tiết/slogan nếu guideline yêu cầu.
- Icon hệ thống chỉ nên dùng các màu nhận diện hoặc biến thể trắng/đen phù hợp nền.

## Layout và grid
- Desktop ưu tiên bố cục sạch, cân bằng, dễ đọc, có hierarchy rõ.
- Sử dụng grid có kỷ luật; giữ gutter trái/phải rõ ràng và nội dung nằm trong một hệ thống cột ổn định.
- Không tạo layout tắc vô lý cho người dùng, nhất là trên desktop.
- Các section phải thống nhất spacing, alignment, và rhythm; CTA hierarchy phải rõ ràng trên toàn trang.

## Hình ảnh và treatment
- Hình ảnh nên đồng nhất với màu thương hiệu; có thể dùng lớp màu hoặc blend mode như `Darken`, `Multiply`, `Overlay` nếu phù hợp.
- Hiệu ứng chỉ là bổ trợ; không được làm giảm độ đọc, độ tương phản, hoặc tính chuyên nghiệp.

## Social và content
- Chất giọng hình ảnh/nội dung phải truyền tải công nghệ, trẻ trung, phong cách, và khả năng ứng dụng thực tế.
- CTA phải có thứ tự ưu tiên rõ: một hướng chuyển đổi chính và một vài hướng phụ, không được cạnh tranh lẫn nhau.
- Empty state, loading state, trust signal, và editorial block phải đúng ngữ nghĩa; không được dùng copy sai trạng thái.

## Nguyên tắc thực thi
- Ưu tiên refactor có trọng tâm, không broad rewrite nếu không cần thiết.
- Tái sử dụng token, component, và pattern sẵn có trước khi tạo mới.
- Bảo toàn accessibility và progressive enhancement.
- Bất cứ thay đổi nào liên quan tới brand/UI phải được đối chiếu với `D:\TKHITEK_BRANDGUIDELINE.pdf` trước khi chốt.
