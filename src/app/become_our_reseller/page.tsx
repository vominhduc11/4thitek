'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import {
    FiCheckCircle,
    FiMail
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { TIMEOUTS } from '@/constants/timeouts';
import debounce from 'lodash.debounce';
import { ultraWideSpacing } from '@/styles/typography';

interface FormData {
    name: string;
    address: string;
    district: string;
    city: string;
    phone: string;
    email: string;
}

// Vietnamese cities and districts mapping
const VIETNAMESE_LOCATIONS = {
    'Hà Nội': [
        'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Hai Bà Trưng', 'Quận Đống Đa', 'Quận Tây Hồ',
        'Quận Cầu Giấy', 'Quận Thanh Xuân', 'Quận Hoàng Mai', 'Quận Long Biên', 'Quận Nam Từ Liêm',
        'Quận Bắc Từ Liêm', 'Quận Hà Đông', 'Huyện Ba Vì', 'Huyện Chương Mỹ', 'Huyện Dan Phượng',
        'Huyện Đông Anh', 'Huyện Gia Lâm', 'Huyện Hoài Đức', 'Huyện Mê Linh', 'Huyện Mỹ Đức',
        'Huyện Phú Xuyên', 'Huyện Phúc Thọ', 'Huyện Quốc Oai', 'Huyện Sóc Sơn', 'Huyện Thạch Thất',
        'Huyện Thanh Oai', 'Huyện Thanh Trì', 'Huyện Thường Tín', 'Huyện Ứng Hòa', 'Thị xã Sơn Tây'
    ],
    'Hồ Chí Minh': [
        'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
        'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Thủ Đức', 'Quận Gò Vấp', 'Quận Tân Bình',
        'Quận Tân Phú', 'Quận Bình Thạnh', 'Quận Phú Nhuận', 'Quận Bình Tân', 'Huyện Bình Chánh',
        'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè'
    ],
    'Đà Nẵng': [
        'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu',
        'Quận Cẩm Lệ', 'Huyện Hòa Vang', 'Huyện Hoàng Sa'
    ],
    'Hải Phòng': [
        'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An',
        'Quận Đồ Sơn', 'Quận Dương Kinh', 'Huyện An Dương', 'Huyện An Lão', 'Huyện Kiến Thụy',
        'Huyện Tiên Lãng', 'Huyện Vĩnh Bảo', 'Huyện Cát Hải', 'Huyện Bạch Long Vĩ'
    ],
    'Cần Thơ': [
        'Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn', 'Quận Thốt Nốt',
        'Huyện Phong Điền', 'Huyện Cờ Đỏ', 'Huyện Vĩnh Thạnh', 'Huyện Thới Lai'
    ],
    'An Giang': [
        'Thành phố Long Xuyên', 'Thành phố Châu Đốc', 'Huyện An Phú', 'Huyện Châu Phú', 'Huyện Châu Thành',
        'Huyện Chợ Mới', 'Huyện Phú Tân', 'Huyện Tân Châu', 'Huyện Thoại Sơn', 'Huyện Tịnh Biên', 'Huyện Tri Tôn'
    ],
    'Bà Rịa - Vũng Tàu': [
        'Thành phố Vũng Tàu', 'Thành phố Bà Rịa', 'Thị xã Phú Mỹ', 'Huyện Châu Đức', 'Huyện Côn Đảo',
        'Huyện Đất Đỏ', 'Huyện Long Điền', 'Huyện Xuyên Mộc'
    ],
    'Bắc Giang': [
        'Thành phố Bắc Giang', 'Huyện Hiệp Hòa', 'Huyện Lang Chánh', 'Huyện Lạng Giang', 'Huyện Lục Nam',
        'Huyện Lục Ngạn', 'Huyện Sơn Động', 'Huyện Tân Yên', 'Huyện Việt Yên', 'Huyện Yên Dũng', 'Huyện Yên Thế'
    ],
    'Bắc Kạn': [
        'Thành phố Bắc Kạn', 'Huyện Ba Bể', 'Huyện Bạch Thông', 'Huyện Chợ Đồn', 'Huyện Chợ Mới',
        'Huyện Na Rì', 'Huyện Ngân Sơn', 'Huyện Pác Nặm'
    ],
    'Bạc Liêu': [
        'Thành phố Bạc Liêu', 'Huyện Đông Hải', 'Huyện Giá Rai', 'Huyện Hòa Bình', 'Huyện Hồng Dân',
        'Huyện Phước Long', 'Huyện Vĩnh Lợi'
    ],
    'Bắc Ninh': [
        'Thành phố Bắc Ninh', 'Thị xã Từ Sơn', 'Huyện Gia Bình', 'Huyện Lương Tài', 'Huyện Quế Võ',
        'Huyện Thuận Thành', 'Huyện Tiên Du', 'Huyện Yên Phong'
    ],
    'Bến Tre': [
        'Thành phố Bến Tre', 'Huyện Ba Tri', 'Huyện Bình Đại', 'Huyện Châu Thành', 'Huyện Chợ Lách',
        'Huyện Giồng Trôm', 'Huyện Mỏ Cày Bắc', 'Huyện Mỏ Cày Nam', 'Huyện Thạnh Phú'
    ],
    'Bình Định': [
        'Thành phố Quy Nhon', 'Thị xã An Nhơn', 'Thị xã Hoài Nhơn', 'Huyện An Lão', 'Huyện Hoài Ân',
        'Huyện Phù Cát', 'Huyện Phù Mỹ', 'Huyện Tây Sơn', 'Huyện Tuy Phước', 'Huyện Vân Canh', 'Huyện Vĩnh Thạnh'
    ],
    'Bình Dương': [
        'Thành phố Thủ Dầu Một', 'Thành phố Dĩ An', 'Thành phố Thuận An', 'Thị xã Bến Cát', 'Thị xã Tân Uyên',
        'Huyện Bàu Bàng', 'Huyện Bắc Tân Uyên', 'Huyện Dầu Tiếng', 'Huyện Phú Giáo'
    ],
    'Bình Phước': [
        'Thành phố Đồng Xoài', 'Thị xã Bình Long', 'Thị xã Phước Long', 'Huyện Bù Đăng', 'Huyện Bù Đốp',
        'Huyện Bù Gia Mập', 'Huyện Chơn Thành', 'Huyện Đồng Phú', 'Huyện Hớn Quản', 'Huyện Lộc Ninh', 'Huyện Phú Riềng'
    ],
    'Bình Thuận': [
        'Thành phố Phan Thiết', 'Thị xã La Gi', 'Huyện Bắc Bình', 'Huyện Đức Linh', 'Huyện Hàm Tân',
        'Huyện Hàm Thuận Bắc', 'Huyện Hàm Thuận Nam', 'Huyện Phú Quý', 'Huyện Tánh Linh', 'Huyện Tuy Phong'
    ],
    'Cà Mau': [
        'Thành phố Cà Mau', 'Huyện Cái Nước', 'Huyện Đầm Dơi', 'Huyện Ngọc Hiển', 'Huyện Phú Tân',
        'Huyện Thới Bình', 'Huyện Trần Văn Thời', 'Huyện U Minh'
    ],
    'Cao Bằng': [
        'Thành phố Cao Bằng', 'Huyện Bảo Lạc', 'Huyện Bảo Lâm', 'Huyện Hạ Lang', 'Huyện Hà Quảng',
        'Huyện Hòa An', 'Huyện Nguyên Bình', 'Huyện Phục Hòa', 'Huyện Quảng Uyên', 'Huyện Thạch An', 'Huyện Trà Lĩnh'
    ],
    'Đắk Lắk': [
        'Thành phố Buôn Ma Thuột', 'Thị xã Buôn Hồ', 'Huyện Buôn Đôn', 'Huyện Cư Kuin', 'Huyện Cư M\'gar',
        'Huyện Đắk Hà', 'Huyện Đắk Mil', 'Huyện Đắk R\'lấp', 'Huyện Ea H\'leo', 'Huyện Ea Kar', 'Huyện Ea Súp',
        'Huyện Krông Ana', 'Huyện Krông Bông', 'Huyện Krông Buk', 'Huyện Krông Năng', 'Huyện Krông Pắc', 'Huyện Lắk', 'Huyện M\'Đrắk'
    ],
    'Đắk Nông': [
        'Thành phố Gia Nghĩa', 'Huyện Cư Jút', 'Huyện Đắk Glong', 'Huyện Đắk Mil', 'Huyện Đắk R\'lấp',
        'Huyện Đắk Song', 'Huyện Krông Nô', 'Huyện Tuy Đức'
    ],
    'Điện Biên': [
        'Thành phố Điện Biên Phủ', 'Thị xã Mường Lay', 'Huyện Điện Biên', 'Huyện Điện Biên Đông',
        'Huyện Mường Ảng', 'Huyện Mường Chà', 'Huyện Mường Nhé', 'Huyện Nậm Pồ', 'Huyện Tủa Chùa', 'Huyện Tuần Giáo'
    ],
    'Đồng Nai': [
        'Thành phố Biên Hòa', 'Thành phố Long Khánh', 'Huyện Cẩm Mỹ', 'Huyện Định Quán', 'Huyện Long Thành',
        'Huyện Nhơn Trạch', 'Huyện Tân Phú', 'Huyện Thống Nhất', 'Huyện Trảng Bom', 'Huyện Vĩnh Cửu', 'Huyện Xuân Lộc'
    ],
    'Đồng Tháp': [
        'Thành phố Cao Lãnh', 'Thành phố Sa Đéc', 'Thành phố Hồng Ngự', 'Huyện Cao Lãnh', 'Huyện Châu Thành',
        'Huyện Hồng Ngự', 'Huyện Lai Vung', 'Huyện Lấp Vò', 'Huyện Tam Nông', 'Huyện Tân Hồng', 'Huyện Thanh Bình', 'Huyện Tháp Mười'
    ],
    'Gia Lai': [
        'Thành phố Pleiku', 'Thị xã An Khê', 'Thị xã Ayun Pa', 'Huyện Chư Păh', 'Huyện Chư Prông',
        'Huyện Chư Pưh', 'Huyện Chư Sê', 'Huyện Đắk Đoa', 'Huyện Đắk Pơ', 'Huyện Đức Cơ', 'Huyện Ia Grai',
        'Huyện Ia Pa', 'Huyện K\'Bang', 'Huyện Kông Chro', 'Huyện Krông Pa', 'Huyện Mang Yang', 'Huyện Phú Thiện'
    ],
    'Hà Giang': [
        'Thành phố Hà Giang', 'Huyện Bắc Mê', 'Huyện Bắc Quang', 'Huyện Đồng Văn', 'Huyện Hoàng Su Phì',
        'Huyện Mèo Vạc', 'Huyện Quản Bạ', 'Huyện Quang Bình', 'Huyện Vị Xuyên', 'Huyện Xín Mần', 'Huyện Yên Minh'
    ],
    'Hà Nam': [
        'Thành phố Phủ Lý', 'Thị xã Duy Tiên', 'Huyện Bình Lục', 'Huyện Kim Bảng', 'Huyện Lý Nhân', 'Huyện Thanh Liêm'
    ],
    'Hà Tĩnh': [
        'Thành phố Hà Tĩnh', 'Thị xã Hồng Lĩnh', 'Huyện Can Lộc', 'Huyện Cẩm Xuyên', 'Huyện Đức Thọ',
        'Huyện Hương Khê', 'Huyện Hương Sơn', 'Huyện Kỳ Anh', 'Huyện Lộc Hà', 'Huyện Nghi Xuân',
        'Huyện Thạch Hà', 'Huyện Vũ Quang'
    ],
    'Hải Dương': [
        'Thành phố Hải Dương', 'Thành phố Chí Linh', 'Thị xã Kinh Môn', 'Huyện Bình Giang', 'Huyện Cẩm Giàng',
        'Huyện Gia Lộc', 'Huyện Kim Thành', 'Huyện Nam Sách', 'Huyện Ninh Giang', 'Huyện Thanh Hà', 'Huyện Thanh Miện', 'Huyện Tứ Kỳ'
    ],
    'Hậu Giang': [
        'Thành phố Vị Thanh', 'Thành phố Ngã Bảy', 'Huyện Châu Thành', 'Huyện Châu Thành A', 'Huyện Long Mỹ',
        'Huyện Phụng Hiệp', 'Huyện Vị Thủy'
    ],
    'Hòa Bình': [
        'Thành phố Hòa Bình', 'Huyện Cao Phong', 'Huyện Đà Bắc', 'Huyện Kim Bôi', 'Huyện Lạc Sơn',
        'Huyện Lạc Thủy', 'Huyện Lương Sơn', 'Huyện Mai Châu', 'Huyện Tân Lạc', 'Huyện Yên Thủy'
    ],
    'Hưng Yên': [
        'Thành phố Hưng Yên', 'Thị xã Mỹ Hào', 'Huyện Ân Thi', 'Huyện Khoái Châu', 'Huyện Kim Động',
        'Huyện Phù Cừ', 'Huyện Tiên Lữ', 'Huyện Văn Giang', 'Huyện Văn Lâm', 'Huyện Yên Mỹ'
    ],
    'Khánh Hòa': [
        'Thành phố Nha Trang', 'Thành phố Cam Ranh', 'Thị xã Ninh Hòa', 'Huyện Cam Lâm', 'Huyện Diên Khánh',
        'Huyện Khánh Sơn', 'Huyện Khánh Vĩnh', 'Huyện Trường Sa', 'Huyện Vạn Ninh'
    ],
    'Kiên Giang': [
        'Thành phố Rạch Giá', 'Thành phố Hà Tiên', 'Thị xã Kiên Lương', 'Huyện An Biên', 'Huyện An Minh',
        'Huyện Châu Thành', 'Huyện Giang Thành', 'Huyện Giồng Riềng', 'Huyện Gò Quao', 'Huyện Hòn Đất',
        'Huyện Kiên Hải', 'Huyện Phú Quốc', 'Huyện Tân Hiệp', 'Huyện U Minh Thượng', 'Huyện Vĩnh Thuận'
    ],
    'Kon Tum': [
        'Thành phố Kon Tum', 'Huyện Đắk Glei', 'Huyện Đắk Hà', 'Huyện Đắk Tô', 'Huyện Ia H\'Drai',
        'Huyện Kon Plông', 'Huyện Kon Rẫy', 'Huyện Ngọc Hồi', 'Huyện Sa Thầy', 'Huyện Tu Mơ Rông'
    ],
    'Lai Châu': [
        'Thành phố Lai Châu', 'Huyện Mường Tè', 'Huyện Nậm Nhùn', 'Huyện Phong Thổ', 'Huyện Sìn Hồ',
        'Huyện Tam Đường', 'Huyện Tân Uyên', 'Huyện Than Uyên'
    ],
    'Lâm Đồng': [
        'Thành phố Đà Lạt', 'Thành phố Bảo Lộc', 'Huyện Bảo Lâm', 'Huyện Cát Tiên', 'Huyện Đạ Huoai',
        'Huyện Đạ Tẻh', 'Huyện Đam Rông', 'Huyện Di Linh', 'Huyện Đơn Dương', 'Huyện Đức Trọng', 'Huyện Lạc Dương', 'Huyện Lâm Hà'
    ],
    'Lạng Sơn': [
        'Thành phố Lạng Sơn', 'Huyện Bắc Sơn', 'Huyện Bình Gia', 'Huyện Cao Lộc', 'Huyện Chi Lăng',
        'Huyện Đình Lập', 'Huyện Hữu Lũng', 'Huyện Lộc Bình', 'Huyện Tràng Định', 'Huyện Văn Lãng', 'Huyện Văn Quan'
    ],
    'Lào Cai': [
        'Thành phố Lào Cai', 'Thị xã Sa Pa', 'Huyện Bắc Hà', 'Huyện Bảo Thắng', 'Huyện Bảo Yên',
        'Huyện Bát Xát', 'Huyện Mường Khương', 'Huyện Si Ma Cai', 'Huyện Văn Bàn'
    ],
    'Long An': [
        'Thành phố Tân An', 'Huyện Bến Lức', 'Huyện Cần Đước', 'Huyện Cần Giuộc', 'Huyện Châu Thành',
        'Huyện Đức Hòa', 'Huyện Đức Huệ', 'Huyện Mộc Hóa', 'Huyện Tân Hưng', 'Huyện Tân Thạnh', 'Huyện Tân Trụ',
        'Huyện Thạnh Hóa', 'Huyện Thủ Thừa', 'Huyện Vĩnh Hưng'
    ],
    'Nam Định': [
        'Thành phố Nam Định', 'Huyện Giao Thủy', 'Huyện Hải Hậu', 'Huyện Mỹ Lộc', 'Huyện Nam Trực',
        'Huyện Nghĩa Hưng', 'Huyện Trực Ninh', 'Huyện Vụ Bản', 'Huyện Xuân Trường', 'Huyện Ý Yên'
    ],
    'Nghệ An': [
        'Thành phố Vinh', 'Thành phố Cửa Lò', 'Thị xã Hoàng Mai', 'Thị xã Thái Hòa', 'Huyện Anh Sơn', 'Huyện Con Cuông',
        'Huyện Diễn Châu', 'Huyện Đô Lương', 'Huyện Hưng Nguyên', 'Huyện Kỳ Sơn', 'Huyện Nam Đàn', 'Huyện Nghi Lộc',
        'Huyện Nghĩa Đàn', 'Huyện Quế Phong', 'Huyện Quỳ Châu', 'Huyện Quỳ Hợp', 'Huyện Quỳnh Lưu', 'Huyện Tân Kỳ',
        'Huyện Thanh Chương', 'Huyện Tương Dương', 'Huyện Yên Thành'
    ],
    'Ninh Bình': [
        'Thành phố Ninh Bình', 'Thành phố Tam Điệp', 'Huyện Gia Viễn', 'Huyện Hoa Lư', 'Huyện Kim Sơn',
        'Huyện Nho Quan', 'Huyện Yên Khánh', 'Huyện Yên Mô'
    ],
    'Ninh Thuận': [
        'Thành phố Phan Rang - Tháp Chàm', 'Huyện Bác Ái', 'Huyện Ninh Hải', 'Huyện Ninh Phước', 'Huyện Ninh Sơn', 'Huyện Thuận Bắc', 'Huyện Thuận Nam'
    ],
    'Phú Thọ': [
        'Thành phố Việt Trì', 'Thị xã Phú Thọ', 'Huyện Cẩm Khê', 'Huyện Đoan Hùng', 'Huyện Hạ Hòa',
        'Huyện Lâm Thao', 'Huyện Phù Ninh', 'Huyện Sông Lô', 'Huyện Tam Nông', 'Huyện Tân Sơn', 'Huyện Thanh Ba',
        'Huyện Thanh Sơn', 'Huyện Thanh Thủy', 'Huyện Yên Lập'
    ],
    'Phú Yên': [
        'Thành phố Tuy Hòa', 'Thị xã Đông Hòa', 'Huyện Đồng Xuân', 'Huyện Phú Hòa', 'Huyện Sơn Hòa',
        'Huyện Sông Cầu', 'Huyện Sông Hinh', 'Huyện Tây Hòa', 'Huyện Tuy An'
    ],
    'Quảng Bình': [
        'Thành phố Đồng Hới', 'Thị xã Ba Đồn', 'Huyện Bố Trạch', 'Huyện Lệ Thủy', 'Huyện Minh Hóa',
        'Huyện Quảng Ninh', 'Huyện Quảng Trạch', 'Huyện Tuyên Hóa'
    ],
    'Quảng Nam': [
        'Thành phố Tam Kỳ', 'Thành phố Hội An', 'Huyện Bắc Trà My', 'Huyện Đại Lộc', 'Huyện Điện Bàn',
        'Huyện Đông Giang', 'Huyện Duy Xuyên', 'Huyện Hiệp Đức', 'Huyện Nam Giang', 'Huyện Nam Trà My',
        'Huyện Nông Sơn', 'Huyện Núi Thành', 'Huyện Phú Ninh', 'Huyện Phước Sơn', 'Huyện Quế Sơn',
        'Huyện Tây Giang', 'Huyện Thăng Bình', 'Huyện Tiên Phước'
    ],
    'Quảng Ngãi': [
        'Thành phố Quảng Ngãi', 'Huyện Ba Tơ', 'Huyện Bình Sơn', 'Huyện Đức Phổ', 'Huyện Lý Sơn',
        'Huyện Minh Long', 'Huyện Mộ Đức', 'Huyện Nghĩa Hành', 'Huyện Sơn Hà', 'Huyện Sơn Tây',
        'Huyện Sơn Tịnh', 'Huyện Tây Trà', 'Huyện Trà Bồng', 'Huyện Tư Nghĩa'
    ],
    'Quảng Ninh': [
        'Thành phố Hạ Long', 'Thành phố Cẩm Phả', 'Thành phố Móng Cái', 'Thành phố Uông Bí', 'Thị xã Đông Triều', 'Thị xã Quảng Yên',
        'Huyện Ba Chẽ', 'Huyện Bình Liêu', 'Huyện Cô Tô', 'Huyện Đầm Hà', 'Huyện Hải Hà', 'Huyện Hoành Bồ', 'Huyện Tiên Yên', 'Huyện Vân Đồn'
    ],
    'Quảng Trị': [
        'Thành phố Đông Hà', 'Thị xã Quảng Trị', 'Huyện Cam Lộ', 'Huyện Cồn Cỏ', 'Huyện Đa Krông',
        'Huyện Gio Linh', 'Huyện Hải Lăng', 'Huyện Hướng Hóa', 'Huyện Triệu Phong', 'Huyện Vĩnh Linh'
    ],
    'Sóc Trăng': [
        'Thành phố Sóc Trăng', 'Huyện Châu Thành', 'Huyện Cù Lao Dung', 'Huyện Kế Sách', 'Huyện Long Phú',
        'Huyện Mỹ Tú', 'Huyện Mỹ Xuyên', 'Huyện Ngã Năm', 'Huyện Thạnh Trị', 'Huyện Trần Đề', 'Huyện Vĩnh Châu'
    ],
    'Sơn La': [
        'Thành phố Sơn La', 'Huyện Bắc Yên', 'Huyện Mai Sơn', 'Huyện Mộc Châu', 'Huyện Mường La',
        'Huyện Phù Yên', 'Huyện Quỳnh Nhai', 'Huyện Sông Mã', 'Huyện Sốp Cộp', 'Huyện Thuận Châu', 'Huyện Yên Châu'
    ],
    'Tây Ninh': [
        'Thành phố Tây Ninh', 'Huyện Bến Cầu', 'Huyện Châu Thành', 'Huyện Dương Minh Châu', 'Huyện Gò Dầu',
        'Huyện Hòa Thành', 'Huyện Tân Biên', 'Huyện Tân Châu', 'Huyện Trảng Bàng'
    ],
    'Thái Bình': [
        'Thành phố Thái Bình', 'Huyện Đông Hưng', 'Huyện Hưng Hà', 'Huyện Kiến Xương', 'Huyện Quỳnh Phụ',
        'Huyện Thái Thụy', 'Huyện Tiền Hải', 'Huyện Vũ Thư'
    ],
    'Thái Nguyên': [
        'Thành phố Thái Nguyên', 'Thành phố Sông Công', 'Thị xã Phổ Yên', 'Huyện Đại Từ', 'Huyện Định Hóa',
        'Huyện Đồng Hỷ', 'Huyện Phú Bình', 'Huyện Phú Lương', 'Huyện Võ Nhai'
    ],
    'Thanh Hóa': [
        'Thành phố Thanh Hóa', 'Thành phố Sầm Sơn', 'Thị xã Bỉm Sơn', 'Thị xã Nghi Sơn', 'Huyện Bá Thước', 'Huyện Cẩm Thủy', 'Huyện Đông Sơn',
        'Huyện Hà Trung', 'Huyện Hậu Lộc', 'Huyện Hoằng Hóa', 'Huyện Lang Chánh', 'Huyện Mường Lát', 'Huyện Nga Sơn',
        'Huyện Ngọc Lặc', 'Huyện Như Thanh', 'Huyện Như Xuân', 'Huyện Nông Cống', 'Huyện Quan Hóa', 'Huyện Quan Sơn',
        'Huyện Quảng Xương', 'Huyện Thạch Thành', 'Huyện Thiệu Hóa', 'Huyện Thọ Xuân', 'Huyện Thường Xuân',
        'Huyện Tĩnh Gia', 'Huyện Triệu Sơn', 'Huyện Vĩnh Lộc', 'Huyện Yên Định'
    ],
    'Thừa Thiên Huế': [
        'Thành phố Huế', 'Thị xã Hương Thủy', 'Thị xã Hương Trà', 'Huyện A Lưới', 'Huyện Nam Đông',
        'Huyện Phong Điền', 'Huyện Phú Lộc', 'Huyện Phú Vang', 'Huyện Quảng Điền'
    ],
    'Tiền Giang': [
        'Thành phố Mỹ Tho', 'Thành phố Gò Công', 'Thị xã Cai Lậy', 'Huyện Cái Bè', 'Huyện Châu Thành',
        'Huyện Chợ Gạo', 'Huyện Gò Công Đông', 'Huyện Gò Công Tây', 'Huyện Tân Phú Đông', 'Huyện Tân Phước'
    ],
    'Trà Vinh': [
        'Thành phố Trà Vinh', 'Huyện Càng Long', 'Huyện Cầu Kè', 'Huyện Cầu Ngang', 'Huyện Châu Thành',
        'Huyện Duyên Hải', 'Huyện Tiểu Cần', 'Huyện Trà Cú'
    ],
    'Tuyên Quang': [
        'Thành phố Tuyên Quang', 'Huyện Chiêm Hóa', 'Huyện Hàm Yên', 'Huyện Lâm Bình', 'Huyện Na Hang',
        'Huyện Sơn Dương', 'Huyện Yên Sơn'
    ],
    'Vĩnh Long': [
        'Thành phố Vĩnh Long', 'Huyện Bình Minh', 'Huyện Bình Tân', 'Huyện Long Hồ', 'Huyện Mang Thít',
        'Huyện Tam Bình', 'Huyện Trà Ôn', 'Huyện Vũng Liêm'
    ],
    'Vĩnh Phúc': [
        'Thành phố Vĩnh Yên', 'Thành phố Phúc Yên', 'Huyện Bình Xuyên', 'Huyện Lập Thạch', 'Huyện Sông Lô',
        'Huyện Tam Đảo', 'Huyện Tam Dương', 'Huyện Vĩnh Tường', 'Huyện Yên Lạc'
    ],
    'Yên Bái': [
        'Thành phố Yên Bái', 'Thị xã Nghĩa Lộ', 'Huyện Lục Yên', 'Huyện Mù Cang Chải', 'Huyện Trạm Tấu',
        'Huyện Trấn Yên', 'Huyện Văn Chấn', 'Huyện Văn Yên', 'Huyện Yên Bình'
    ]
};

// Get list of all cities (now all have district data)
const ALL_CITIES = Object.keys(VIETNAMESE_LOCATIONS).sort();

export default function BecomeOurReseller() {
    const { t } = useLanguage();

    // Get districts for selected city
    const getDistrictsForCity = useCallback((cityName: string): string[] => {
        return VIETNAMESE_LOCATIONS[cityName as keyof typeof VIETNAMESE_LOCATIONS] || [];
    }, []);

    // Memoized validation regexes for performance - matching backend validation
    const emailRegex = useMemo(() => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, []);
    const phoneRegex = useMemo(() => /^(0[0-9]{9})$/, []);

    // Centralized field validation - matching backend requirements
    const validateField = useCallback((name: string, value: string) => {
        let error = '';
        const trimmedValue = value.trim();
        
        switch (name) {
            case 'email':
                if (trimmedValue && !emailRegex.test(trimmedValue)) {
                    error = 'Email không hợp lệ';
                } else if (trimmedValue.length > 100) {
                    error = 'Email cannot exceed 100 characters';
                }
                break;
            case 'phone':
                if (trimmedValue && !phoneRegex.test(trimmedValue)) {
                    error = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và đủ 10 số)';
                }
                break;
            case 'name':
                if (trimmedValue.length > 0 && (trimmedValue.length < 2 || trimmedValue.length > 100)) {
                    error = 'Full name must be between 2 and 100 characters';
                }
                break;
            case 'address':
                if (trimmedValue.length > 255) {
                    error = 'Address cannot exceed 255 characters';
                }
                break;
            case 'district':
                if (trimmedValue.length > 100) {
                    error = 'District cannot exceed 100 characters';
                }
                break;
            case 'city':
                if (trimmedValue.length > 100) {
                    error = 'City cannot exceed 100 characters';
                }
                break;
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, [emailRegex, phoneRegex]);

    // Debounced validation for better UX
    const debouncedValidate = useMemo(
        () => debounce((name: string, value: string) => {
            validateField(name, value);
        }, 300),
        [validateField]
    );

    // Improved error mapping utility
    const mapBackendError = useCallback((message: string): { field?: string; message: string } => {
        const errorPatterns = [
            {
                field: 'email',
                patterns: ['email', 'Email', '@'],
                keywords: ['exists', 'taken', 'already', 'tồn tại', 'đã sử dụng']
            },
            {
                field: 'phone',
                patterns: ['phone', 'Phone', 'điện thoại', 'số'],
                keywords: ['exists', 'taken', 'already', 'tồn tại', 'đã sử dụng']
            },
        ];

        const lowerMessage = message.toLowerCase();
        
        for (const error of errorPatterns) {
            const hasPattern = error.patterns.some(p => 
                lowerMessage.includes(p.toLowerCase())
            );
            const hasKeyword = error.keywords.some(k => 
                lowerMessage.includes(k.toLowerCase())
            );
            
            if (hasPattern && hasKeyword) {
                return { field: error.field, message };
            }
        }
        
        return { message };
    }, []);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        address: '',
        district: '',
        city: '',
        phone: '',
        email: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [errorMessage, setErrorMessage] = useState<string>('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Update form data
        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: value
            };

            // Reset district when city changes
            if (name === 'city') {
                newData.district = '';
                // Clear district validation error when city changes
                setValidationErrors(prevErrors => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { district, ...rest } = prevErrors;
                    return rest;
                });
            }

            return newData;
        });

        // Clear general error message when user starts typing
        if (errorMessage) {
            setErrorMessage('');
            setSubmitStatus('idle');
        }

        // Debounced validation for better performance - will clear/set errors appropriately
        debouncedValidate(name, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prepare form data for validation and submission
        const formFields = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            district: formData.district.trim(),
            city: formData.city.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim()
        };

        // Clear previous validation errors
        setValidationErrors({});
        const newErrors: {[key: string]: string} = {};

        // Check if required fields are empty - all fields are now required
        const requiredFields = {
            name: 'Tên công ty không được để trống',
            email: 'Email không được để trống',
            address: 'Địa chỉ không được để trống',
            phone: 'Số điện thoại không được để trống',
            district: 'Quận không được để trống',
            city: 'Thành phố không được để trống'
        };
        
        Object.entries(requiredFields).forEach(([fieldName, errorMessage]) => {
            if (!formFields[fieldName as keyof typeof formFields]) {
                newErrors[fieldName] = errorMessage;
            }
        });

        // Validate all fields with values according to backend requirements
        Object.entries(formFields).forEach(([key, value]) => {
            if (!value) return; // Skip validation if already handled by required field check
            
            // Validate each field according to backend rules
            switch (key) {
                case 'email':
                    if (!emailRegex.test(value)) {
                        newErrors.email = 'Email không hợp lệ';
                    } else if (value.length > 100) {
                        newErrors.email = 'Email cannot exceed 100 characters';
                    }
                    break;
                case 'phone':
                    if (!phoneRegex.test(value)) {
                        newErrors.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và đủ 10 số)';
                    }
                    break;
                case 'name':
                    if (value.length < 2 || value.length > 100) {
                        newErrors.name = 'Full name must be between 2 and 100 characters';
                    }
                    break;
                case 'address':
                    if (value.length > 255) {
                        newErrors.address = 'Address cannot exceed 255 characters';
                    }
                    break;
                case 'district':
                    if (value.length > 100) {
                        newErrors.district = 'District cannot exceed 100 characters';
                    }
                    break;
                case 'city':
                    if (value.length > 100) {
                        newErrors.city = 'City cannot exceed 100 characters';
                    }
                    break;
            }
        });

        // If there are validation errors, set them and focus on first error field
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            const firstErrorField = Object.keys(newErrors)[0];
            const fieldElement = document.getElementById(firstErrorField);
            if (fieldElement) {
                fieldElement.focus();
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Don't submit if validation fails
        }

        setIsSubmitting(true);

        try {
            // Submit reseller application via API
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/dealer`;
            
            const response = await axios.post(apiUrl, {
                companyName: formFields.name,
                address: formFields.address,
                district: formFields.district,
                city: formFields.city,
                phone: formFields.phone,
                email: formFields.email
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: TIMEOUTS.API_REQUEST,
            });

            if (response.status === 200 || response.status === 201) {
                setSubmitStatus('success');
                setValidationErrors({});
                setErrorMessage('');
                setFormData({
                    name: '',
                    address: '',
                    district: '',
                    city: '',
                    phone: '',
                    email: ''
                });
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (error) {
            
            // Handle specific error responses from backend
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                
                // Debug: Log response to understand backend format
                console.log('Backend Error Response:', {
                    status: error.response.status,
                    data: responseData
                });
                
                // Check if error response has specific error messages
                if (responseData && typeof responseData === 'object') {
                    // Handle validation errors from backend
                    if (responseData.errors) {
                        const backendErrors: {[key: string]: string} = {};
                        
                        // Map backend field errors to frontend validation errors
                        if (responseData.errors.email) {
                            backendErrors.email = responseData.errors.email;
                        }
                        if (responseData.errors.phone) {
                            backendErrors.phone = responseData.errors.phone;
                        }
                        if (responseData.errors.name) {
                            backendErrors.name = responseData.errors.name;
                        }
                        
                        if (Object.keys(backendErrors).length > 0) {
                            setValidationErrors(backendErrors);
                            setSubmitStatus('idle'); // Keep form available for correction
                            return;
                        }
                    }
                    
                    // Handle specific validation error messages from backend  
                    if (responseData.message || (responseData.error && typeof responseData.error === 'string')) {
                        const message = responseData.message || responseData.error || '';
                        const backendErrors: {[key: string]: string} = {};
                        
                        // Use improved error mapping
                        const mappedError = mapBackendError(message);
                        if (mappedError.field) {
                            backendErrors[mappedError.field] = mappedError.message;
                        }
                        
                        // If we have field-specific errors, show them on the fields
                        if (Object.keys(backendErrors).length > 0) {
                            setValidationErrors(backendErrors);
                            setSubmitStatus('idle'); // Keep form available for correction
                            return;
                        }
                    }
                    
                    // Handle general error message
                    if (responseData.message) {
                        setErrorMessage(responseData.message);
                    } else if (responseData.error && typeof responseData.error === 'string') {
                        setErrorMessage(responseData.error);
                    } else if (responseData.detail) {
                        setErrorMessage(responseData.detail);
                    } else {
                        setErrorMessage(t('becomeReseller.form.errorMessage'));
                    }
                } else {
                    setErrorMessage(t('becomeReseller.form.errorMessage'));
                }
            } else {
                setErrorMessage(t('becomeReseller.form.errorMessage'));
            }
            
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('becomeReseller.title'), active: true }
    ];

    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <Hero breadcrumbItems={breadcrumbItems} />

            {/* Application Form Section */}
            <section className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('becomeReseller.form.title')}</h2>
                        <p className="text-xl text-gray-300">
                            {t('becomeReseller.form.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        viewport={{ once: true }}
                    >
                        <Card className="bg-gray-800/50 border-gray-700 shadow-2xl hover:shadow-3xl transition-all duration-300">
                            <CardContent className="p-8">
                                {submitStatus === 'success' && (
                                    <div className="mb-8 p-6 bg-green-900/50 border border-green-600 text-green-300 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FiCheckCircle className="w-6 h-6" />
                                            <div>
                                                <h3 className="font-semibold">
                                                    {t('becomeReseller.form.successTitle')}
                                                </h3>
                                                <p className="text-sm opacity-90">
                                                    {t('becomeReseller.form.successMessage')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="mb-8 p-6 bg-red-900/50 border border-red-600 text-red-300 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FiMail className="w-6 h-6" />
                                            <div>
                                                <h3 className="font-semibold">{t('becomeReseller.form.errorTitle')}</h3>
                                                <p className="text-sm opacity-90">
                                                    {errorMessage || t('becomeReseller.form.errorMessage')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                                    {/* Reseller Registration Form */}
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                            {t('becomeReseller.form.resellerRegistration')}
                                        </h3>
                                        
                                        <div className={`grid grid-cols-1 md:grid-cols-2 ${ultraWideSpacing['grid-gap-md']}`}>
                                            {/* Name */}
                                            <div className="md:col-span-2">
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.nameRequired')}
                                                </label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.namePlaceholder')}
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.name && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
                                                )}
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.phoneRequired')}
                                                </label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="0123456789"
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.phone && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.phone}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div className="md:col-span-2">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.emailRequired')}
                                                </label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.emailPlaceholder')}
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.email && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
                                                )}
                                            </div>

                                            {/* Address */}
                                            <div className="md:col-span-2">
                                                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.streetAddressRequired')}
                                                </label>
                                                <Input
                                                    id="address"
                                                    name="address"
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.streetAddressPlaceholder')}
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.address && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.address}</p>
                                                )}
                                            </div>

                                            {/* District */}
                                            <div>
                                                <label htmlFor="district" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.districtRequired')}
                                                </label>
                                                <select
                                                    id="district"
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.city}
                                                    className={`w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        validationErrors.district ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                >
                                                    <option value="" className="bg-gray-700">
                                                        {formData.city
                                                            ? (t('becomeReseller.form.districtPlaceholder') || 'Chọn quận/huyện')
                                                            : 'Vui lòng chọn thành phố trước'
                                                        }
                                                    </option>
                                                    {formData.city && getDistrictsForCity(formData.city).map((district) => (
                                                        <option key={district} value={district} className="bg-gray-700">
                                                            {district}
                                                        </option>
                                                    ))}
                                                </select>
                                                {validationErrors.district && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.district}</p>
                                                )}
                                            </div>

                                            {/* City */}
                                            <div>
                                                <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.cityRequired')}
                                                </label>
                                                <select
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] transition-colors ${
                                                        validationErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                >
                                                    <option value="" className="bg-gray-700">
                                                        {t('becomeReseller.form.cityPlaceholder') || 'Chọn thành phố'}
                                                    </option>
                                                    {ALL_CITIES.map((city) => (
                                                        <option key={city} value={city} className="bg-gray-700">
                                                            {city}
                                                        </option>
                                                    ))}
                                                </select>
                                                {validationErrors.city && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.city}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-[#4FC8FF] hover:bg-[#4FC8FF]/90 text-white px-12 py-3 text-lg font-semibold"
                                        >
                                            {isSubmitting ? t('becomeReseller.form.submittingButton') : t('becomeReseller.form.submitButton')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}