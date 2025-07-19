'use client';

import { motion, AnimatePresence } from 'framer-motion';
import TableOfContents from './TableOfContents';
import PolicySection from './PolicySection';
import SectionContainer from './SectionContainer';

interface PolicyContentProps {
    selectedPolicy: string;
}

// Dữ liệu nội dung các section cho từng policy
const policyData = {
    warranty: {
        title: 'Chính sách bảo hành',
        sections: [
            {
                id: 'bao-hanh-tong-quat',
                title: 'Bảo hành tổng quát',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Tất cả sản phẩm được bán tại TuneZone đều được bảo hành theo chính sách của nhà sản xuất và
                            các quy định của chúng tôi. Thời gian bảo hành được tính từ ngày mua hàng.
                        </p>
                        <p className="mb-4 leading-normal">
                            <strong>Điều kiện bảo hành:</strong>
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-2 leading-normal">
                            <li>Sản phẩm còn trong thời hạn bảo hành</li>
                            <li>Có hóa đơn mua hàng hoặc phiếu bảo hành</li>
                            <li>Sản phẩm không bị hư hỏng do tác động bên ngoài</li>
                            <li>Không tự ý sửa chữa hoặc can thiệp vào sản phẩm</li>
                        </ul>
                        <p className="leading-normal">
                            Chúng tôi cam kết hỗ trợ khách hàng một cách tốt nhất trong quá trình bảo hành và sau bán
                            hàng.
                        </p>
                    </>
                )
            },
            {
                id: 'quy-trinh-bao-hanh',
                title: 'Quy trình bảo hành',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Khi sản phẩm gặp sự cố, khách hàng vui lòng liên hệ với chúng tôi qua hotline hoặc đến trực
                            tiếp cửa hàng để được hỗ trợ.
                        </p>
                        <p className="mb-4 leading-normal">
                            Thời gian xử lý bảo hành từ 3-7 ngày làm việc tùy thuộc vào tình trạng sản phẩm.
                        </p>
                        <p className="leading-normal">
                            Trong thời gian bảo hành, chúng tôi sẽ thông báo tiến độ xử lý cho khách hàng.
                        </p>
                    </>
                )
            }
        ]
    },
    return: {
        title: 'Chính sách đổi trả hàng',
        sections: [
            {
                id: 'dieu-kien-doi-tra',
                title: 'Điều kiện đổi trả',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Khách hàng có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày mua hàng với các điều kiện
                            sau:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-2 leading-normal">
                            <li>Sản phẩm còn nguyên vẹn, chưa qua sử dụng</li>
                            <li>Còn đầy đủ bao bì, phụ kiện đi kèm</li>
                            <li>Có hóa đơn mua hàng</li>
                            <li>Sản phẩm không thuộc danh mục không được đổi trả</li>
                        </ul>
                        <p className="leading-normal">
                            Phí vận chuyển đổi trả sẽ do khách hàng chịu trừ trường hợp sản phẩm bị lỗi từ nhà sản xuất.
                        </p>
                    </>
                )
            },
            {
                id: 'quy-trinh-doi-tra',
                title: 'Quy trình đổi trả',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Khách hàng liên hệ với bộ phận chăm sóc khách hàng để thông báo về việc đổi trả.
                        </p>
                        <p className="mb-4 leading-normal">
                            Gửi sản phẩm về địa chỉ của chúng tôi hoặc đến trực tiếp cửa hàng.
                        </p>
                        <p className="leading-normal">
                            Sau khi kiểm tra, chúng tôi sẽ xử lý đổi trả trong vòng 2-3 ngày làm việc.
                        </p>
                    </>
                )
            }
        ]
    },
    privacy: {
        title: 'Bảo mật thông tin',
        sections: [
            {
                id: 'thu-thap-thong-tin',
                title: 'Thu thập thông tin',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            TuneZone cam kết bảo vệ thông tin cá nhân của khách hàng theo các tiêu chuẩn bảo mật cao
                            nhất. Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba mà không có sự đồng ý của
                            bạn.
                        </p>
                        <p className="mb-4 leading-normal">
                            <strong>Thông tin chúng tôi thu thập:</strong>
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-2 leading-normal">
                            <li>Thông tin liên hệ (họ tên, email, số điện thoại)</li>
                            <li>Địa chỉ giao hàng</li>
                            <li>Thông tin thanh toán (được mã hóa an toàn)</li>
                            <li>Lịch sử mua hàng</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'su-dung-thong-tin',
                title: 'Sử dụng thông tin',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            <strong>Mục đích sử dụng thông tin:</strong>
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-2 leading-normal">
                            <li>Xử lý đơn hàng và giao hàng</li>
                            <li>Hỗ trợ khách hàng</li>
                            <li>Gửi thông tin khuyến mãi (nếu đồng ý)</li>
                            <li>Cải thiện dịch vụ</li>
                        </ul>
                        <p className="leading-normal">
                            Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào bằng
                            cách liên hệ với chúng tôi.
                        </p>
                    </>
                )
            }
        ]
    },
    terms: {
        title: 'Điều kiện, điều khoản',
        sections: [
            {
                id: 'dieu-kien',
                title: 'Các điều kiện và điều khoản',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Trang web này được điều hành bởi Cửa Hàng Shop BIGBIKE.VN. Xin vui lòng đọc kỹ các Điều kiện
                            & Điều khoản trước khi sử dụng hoặc đăng ký trên trang web này. Bạn phải hoàn toàn đồng ý
                            với các điều kiện và điều khoản này nếu muốn sử dụng trang web. Nếu bạn không đồng ý với bất
                            kỳ phần nào trong các điều kiện và điều khoản này, bạn sẽ không thể sử dụng trang web này
                            dưới bất kỳ hình thức nào.
                        </p>
                        <p className="mb-4 leading-normal">
                            Lưu ý rằng trang web này được xây dựng nhằm phục vụ truy cập trên phạm vi toàn cầu đối với
                            người sử dụng.
                        </p>
                        <p className="mb-4 leading-normal">
                            Những thông tin trên trang web này được áp dụng cho người sử dụng trên phạm vi toàn cầu.
                        </p>
                        <p className="leading-normal">
                            Chúng tôi có quyền từ chối truy cập vào trang web này bất cứ lúc nào mà không cần phải thông
                            báo trước.
                        </p>
                    </>
                )
            },
            {
                id: 'luat-dieu-chinh',
                title: 'Luật điều chỉnh',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            Các điều khoản và điều kiện này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát
                            sinh sẽ được giải quyết tại các tòa án có thẩm quyền tại Việt Nam.
                        </p>
                        <p className="mb-4 leading-normal">
                            Trong trường hợp có bất kỳ điều khoản nào trong thỏa thuận này được coi là không hợp lệ hoặc
                            không thể thực thi, các điều khoản còn lại vẫn có hiệu lực đầy đủ.
                        </p>
                        <p className="leading-normal">
                            Chúng tôi cam kết tuân thủ nghiêm túc các quy định pháp luật hiện hành và bảo vệ quyền lợi
                            hợp pháp của khách hàng.
                        </p>
                    </>
                )
            },
            {
                id: 'nhung-thay-doi',
                title: 'Những thay đổi',
                content: (
                    <>
                        <p className="mb-4 leading-normal">
                            TuneZone có quyền thay đổi, bổ sung hoặc xóa bỏ bất kỳ phần nào trong các điều khoản này vào
                            bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.
                        </p>
                        <p className="mb-4 leading-normal">
                            Chúng tôi khuyến khích bạn thường xuyên kiểm tra trang này để cập nhật những thay đổi mới
                            nhất. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận
                            các điều khoản mới.
                        </p>
                        <p className="leading-normal">
                            Trong trường hợp có thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc thông báo
                            trên website trước khi áp dụng.
                        </p>
                    </>
                )
            }
        ]
    }
};

export default function PolicyContent({ selectedPolicy }: PolicyContentProps) {
    const currentPolicy = policyData[selectedPolicy as keyof typeof policyData];

    if (!currentPolicy) {
        return null;
    }

    // Tạo table of contents entries dựa trên policy được chọn
    const currentTableOfContents = currentPolicy.sections.map((section) => ({
        label: section.title,
        anchorId: section.id
    }));

    return (
        <SectionContainer>
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedPolicy}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeInOut'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <TableOfContents entries={currentTableOfContents} />
                    </motion.div>

                    {currentPolicy.sections.map((section, index) => (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.3 + index * 0.1,
                                ease: 'easeOut'
                            }}
                        >
                            <PolicySection id={section.id} title={section.title} content={section.content} />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </SectionContainer>
    );
}
