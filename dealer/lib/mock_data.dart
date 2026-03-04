import 'models.dart';

class DistributorNotice {
  const DistributorNotice({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
}

const List<Product> mockProducts = [
  Product(
    id: '1',
    name: 'SCS SX Pro Elite',
    sku: 'SCS-SX-PRO-ELITE',
    shortDescription:
        'Tai nghe gaming flagship voi ANC chu dong, am thanh vong 7.1 va driver 50mm.',
    price: 4912000,
    stock: 120,
    warrantyMonths: 24,
    imageUrl: 'https://picsum.photos/seed/dealer-1/800/800',
    descriptions: [
      ProductDescriptionItem(
        type: ProductDescriptionType.title,
        text: 'Diem noi bat',
      ),
      ProductDescriptionItem(
        type: ProductDescriptionType.description,
        text:
            'SX Pro Elite toi uu cho gaming va stream voi ANC chu dong, do tre thap va do ben cao.',
      ),
      ProductDescriptionItem(
        type: ProductDescriptionType.image,
        url: 'https://picsum.photos/seed/dealer-1-detail/1280/720',
        caption: 'Thiet ke gon gang, trong luong nhe cho su dung lau dai.',
      ),
    ],
    videos: [
      ProductVideoItem(
        title: 'SX Pro Elite Overview',
        url:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        description: 'Tong quan tinh nang va huong dan ket noi nhanh.',
      ),
    ],
    specifications: [
      ProductSpecification(label: 'Driver', value: '50mm'),
      ProductSpecification(label: 'Ket noi', value: 'USB + 3.5mm'),
      ProductSpecification(label: 'Am thanh', value: '7.1 Virtual'),
    ],
  ),
  Product(
    id: '2',
    name: 'SCS SX Wireless Pro',
    sku: 'SCS-SX-WIRELESS-PRO',
    shortDescription: 'Khong day do tre thap, pin 30 gio, 2.4G + Bluetooth.',
    price: 3682000,
    stock: 64,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-2/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '40mm'),
      ProductSpecification(label: 'Pin', value: '30h'),
      ProductSpecification(label: 'Ket noi', value: '2.4G + BT 5.2'),
    ],
  ),
  Product(
    id: '3',
    name: 'SCS Professional Studio',
    sku: 'SCS-PRO-STUDIO',
    shortDescription:
        'Tai nghe kiem am can bang, trung thuc, phu hop phong thu.',
    price: 2698000,
    stock: 14,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-3/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '45mm'),
      ProductSpecification(label: 'Tro khang', value: '32Ohm'),
      ProductSpecification(label: 'Day', value: 'Detachable'),
    ],
  ),
  Product(
    id: '5',
    name: 'SCS Nova Air',
    sku: 'SCS-NOVA-AIR',
    shortDescription:
        'Lightweight wireless headset with 2.4G + BT and 45mm driver.',
    price: 3108000,
    stock: 80,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-5/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '45mm'),
      ProductSpecification(label: 'Connectivity', value: '2.4G + BT 5.2'),
      ProductSpecification(label: 'Battery', value: '28h'),
    ],
  ),
  Product(
    id: '6',
    name: 'SCS Nova Air Lite',
    sku: 'SCS-NOVA-AIR-LITE',
    shortDescription:
        'Compact wireless headset with 2.4G dongle and foldable design.',
    price: 2288000,
    stock: 32,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-6/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '40mm'),
      ProductSpecification(label: 'Latency', value: '< 30ms'),
      ProductSpecification(label: 'Weight', value: '230g'),
    ],
  ),
  Product(
    id: '7',
    name: 'SCS Bass Titan',
    sku: 'SCS-BASS-TITAN',
    shortDescription:
        'Deep bass gaming headset with reinforced frame and 7.1 mode.',
    price: 4338000,
    stock: 9,
    warrantyMonths: 24,
    imageUrl: 'https://picsum.photos/seed/dealer-7/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '50mm'),
      ProductSpecification(label: 'Surround', value: '7.1 Virtual'),
      ProductSpecification(label: 'Frame', value: 'Aluminum'),
    ],
  ),
  Product(
    id: '8',
    name: 'SCS Stream Pro Mic',
    sku: 'SCS-STREAM-PRO-MIC',
    shortDescription: 'USB condenser mic with cardioid mode and tap-to-mute.',
    price: 1796000,
    stock: 25,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-8/800/800',
    specifications: [
      ProductSpecification(label: 'Pattern', value: 'Cardioid'),
      ProductSpecification(label: 'Interface', value: 'USB-C'),
      ProductSpecification(label: 'Sample Rate', value: '96kHz'),
    ],
  ),
  Product(
    id: '10',
    name: 'SCS RGB Key Pro',
    sku: 'SCS-RGB-KEY-PRO',
    shortDescription: 'Full-size mechanical keyboard with hot-swap switches.',
    price: 1550000,
    stock: 140,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-10/800/800',
    specifications: [
      ProductSpecification(label: 'Layout', value: '104 keys'),
      ProductSpecification(label: 'Switch', value: 'Hot-swap'),
      ProductSpecification(label: 'Plate', value: 'Aluminum'),
    ],
  ),
  Product(
    id: '11',
    name: 'SCS RGB Key Lite',
    sku: 'SCS-RGB-KEY-LITE',
    shortDescription:
        'Tenkeyless keyboard with silent switches and simple lighting.',
    price: 976000,
    stock: 12,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-11/800/800',
    specifications: [
      ProductSpecification(label: 'Layout', value: '87 keys'),
      ProductSpecification(label: 'Switch', value: 'Silent linear'),
      ProductSpecification(label: 'Cable', value: 'Detachable'),
    ],
  ),
  Product(
    id: '12',
    name: 'SCS Control Mouse X1',
    sku: 'SCS-CONTROL-MOUSE-X1',
    shortDescription: 'Ergonomic wired mouse with 6 buttons and PTFE feet.',
    price: 812000,
    stock: 55,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-12/800/800',
    specifications: [
      ProductSpecification(label: 'Sensor', value: 'Pixart 3327'),
      ProductSpecification(label: 'Buttons', value: '6'),
      ProductSpecification(label: 'Weight', value: '72g'),
    ],
  ),
  Product(
    id: '13',
    name: 'SCS Control Mouse X1 Wireless',
    sku: 'SCS-CONTROL-MOUSE-X1-WL',
    shortDescription: 'Wireless mouse with 2.4G + BT and 90h battery.',
    price: 1222000,
    stock: 7,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-13/800/800',
    specifications: [
      ProductSpecification(label: 'Connectivity', value: '2.4G + BT'),
      ProductSpecification(label: 'Battery', value: '90h'),
      ProductSpecification(label: 'Weight', value: '78g'),
    ],
  ),
  Product(
    id: '14',
    name: 'SCS Pad XL',
    sku: 'SCS-PAD-XL',
    shortDescription: 'Large desk pad with stitched edges and smooth surface.',
    price: 320000,
    stock: 200,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-14/800/800',
    specifications: [
      ProductSpecification(label: 'Size', value: '900x400mm'),
      ProductSpecification(label: 'Surface', value: 'Micro-texture'),
      ProductSpecification(label: 'Base', value: 'Rubber'),
    ],
  ),
  Product(
    id: '16',
    name: 'SCS Speaker Orbit',
    sku: 'SCS-SPEAKER-ORBIT',
    shortDescription: 'Desktop speakers with angled drivers and warm mids.',
    price: 2452000,
    stock: 18,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-16/800/800',
    specifications: [
      ProductSpecification(label: 'Power', value: '30W RMS'),
      ProductSpecification(label: 'Inputs', value: '3.5mm + USB'),
      ProductSpecification(label: 'Drivers', value: '2.75in'),
    ],
  ),
  Product(
    id: '17',
    name: 'SCS Speaker Orbit Mini',
    sku: 'SCS-SPEAKER-ORBIT-MINI',
    shortDescription:
        'Compact desktop speakers with volume knob and USB power.',
    price: 1632000,
    stock: 0,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-17/800/800',
    specifications: [
      ProductSpecification(label: 'Power', value: '20W RMS'),
      ProductSpecification(label: 'Inputs', value: '3.5mm'),
      ProductSpecification(label: 'Power source', value: 'USB'),
    ],
  ),
  Product(
    id: '18',
    name: 'SCS Webcam Flow 4K',
    sku: 'SCS-WEBCAM-FLOW-4K',
    shortDescription: '4K webcam with HDR, auto focus, and privacy shutter.',
    price: 2124000,
    stock: 22,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-18/800/800',
    specifications: [
      ProductSpecification(label: 'Resolution', value: '4K'),
      ProductSpecification(label: 'HDR', value: 'Yes'),
      ProductSpecification(label: 'Focus', value: 'Auto'),
    ],
  ),
  Product(
    id: '19',
    name: 'SCS Phantom X60',
    sku: 'SCS-PHANTOM-X60',
    shortDescription:
        'Tai nghe cho game FPS voi do tre thap, driver 53mm va mic tach roi.',
    price: 4018000,
    stock: 47,
    warrantyMonths: 24,
    imageUrl: 'https://picsum.photos/seed/dealer-19/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '53mm'),
      ProductSpecification(label: 'Ket noi', value: 'USB + 3.5mm'),
      ProductSpecification(label: 'Mic', value: 'Detachable'),
    ],
  ),
  Product(
    id: '20',
    name: 'SCS Cyclone 7.1',
    sku: 'SCS-CYCLONE-7-1',
    shortDescription:
        'Tai nghe gaming surround 7.1, housing kim loai va den RGB tinh chinh.',
    price: 3436000,
    stock: 58,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-20/800/800',
    specifications: [
      ProductSpecification(label: 'Surround', value: '7.1 Virtual'),
      ProductSpecification(label: 'Frame', value: 'Aluminum'),
      ProductSpecification(label: 'Lighting', value: 'RGB'),
    ],
  ),
  Product(
    id: '21',
    name: 'SCS Echo Lite 2',
    sku: 'SCS-ECHO-LITE-2',
    shortDescription: 'Mau tai nghe gon nhe cho phong net, ben va de ve sinh.',
    price: 1558000,
    stock: 132,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-21/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '40mm'),
      ProductSpecification(label: 'Weight', value: '215g'),
      ProductSpecification(label: 'Mic', value: 'Flip-to-mute'),
    ],
  ),
  Product(
    id: '22',
    name: 'SCS Vanguard Max',
    sku: 'SCS-VANGUARD-MAX',
    shortDescription:
        'Tai nghe cao cap co ANC hybrid, am truong rong va dem tai memory foam.',
    price: 4666000,
    stock: 28,
    warrantyMonths: 24,
    imageUrl: 'https://picsum.photos/seed/dealer-22/800/800',
    specifications: [
      ProductSpecification(label: 'ANC', value: 'Hybrid'),
      ProductSpecification(label: 'Driver', value: '50mm'),
      ProductSpecification(label: 'Ear pads', value: 'Memory foam'),
    ],
  ),
  Product(
    id: '23',
    name: 'SCS Pulse ANC',
    sku: 'SCS-PULSE-ANC',
    shortDescription:
        'Tai nghe khong day 2.4G + BT, co chong on chu dong va sạc nhanh.',
    price: 3272000,
    stock: 39,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-23/800/800',
    specifications: [
      ProductSpecification(label: 'Connectivity', value: '2.4G + BT 5.3'),
      ProductSpecification(label: 'Battery', value: '34h'),
      ProductSpecification(label: 'Charge', value: 'USB-C fast charge'),
    ],
  ),
  Product(
    id: '24',
    name: 'SCS Titan Wireless X',
    sku: 'SCS-TITAN-WIRELESS-X',
    shortDescription:
        'Phien ban Titan khong day, pin lon va do ben cao cho van hanh lien tuc.',
    price: 3920000,
    stock: 18,
    warrantyMonths: 24,
    imageUrl: 'https://picsum.photos/seed/dealer-24/800/800',
    specifications: [
      ProductSpecification(label: 'Battery', value: '42h'),
      ProductSpecification(label: 'Frame', value: 'Steel + ABS'),
      ProductSpecification(label: 'Mic', value: 'Noise reduction'),
    ],
  ),
  Product(
    id: '25',
    name: 'SCS Aero 50',
    sku: 'SCS-AERO-50',
    shortDescription:
        'Tai nghe sieu nhe voi driver 50mm, dem vai thoang khi va do ep vua.',
    price: 2206000,
    stock: 73,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-25/800/800',
    specifications: [
      ProductSpecification(label: 'Driver', value: '50mm'),
      ProductSpecification(label: 'Weight', value: '205g'),
      ProductSpecification(label: 'Headband', value: 'Flexible'),
    ],
  ),
  Product(
    id: '26',
    name: 'SCS Quantum Studio',
    sku: 'SCS-QUANTUM-STUDIO',
    shortDescription:
        'Tai nghe monitor cho stream va thu am voi do chi tiet cao, am sach.',
    price: 2944000,
    stock: 11,
    warrantyMonths: 18,
    imageUrl: 'https://picsum.photos/seed/dealer-26/800/800',
    specifications: [
      ProductSpecification(label: 'Frequency', value: '20Hz-40kHz'),
      ProductSpecification(label: 'Impedance', value: '38Ohm'),
      ProductSpecification(label: 'Cable', value: 'Detachable dual jack'),
    ],
  ),
  Product(
    id: '27',
    name: 'SCS Orbit Chat Pro',
    sku: 'SCS-ORBIT-CHAT-PRO',
    shortDescription:
        'Mau tai nghe tap trung giao tiep doi nhom voi mic ro va den LED trang thai.',
    price: 1304000,
    stock: 96,
    warrantyMonths: 12,
    imageUrl: 'https://picsum.photos/seed/dealer-27/800/800',
    specifications: [
      ProductSpecification(label: 'Mic', value: 'ENC dual mic'),
      ProductSpecification(label: 'Connection', value: 'USB-A'),
      ProductSpecification(label: 'Mute', value: 'Inline control'),
    ],
  ),
];

final List<DistributorNotice> mockDistributorNotices = [
  DistributorNotice(
    id: 'notice-01',
    title: 'Cập nhật chính sách giao hàng',
    message: 'Đơn nội thành giao trong 24h. Đơn tỉnh xa giao từ 2-4 ngày.',
    createdAt: DateTime(2026, 2, 14),
  ),
  DistributorNotice(
    id: 'notice-02',
    title: 'Chương trình hỗ trợ quý I',
    message: 'Đơn từ 50 triệu được hỗ trợ POSM và tài liệu bán hàng.',
    createdAt: DateTime(2026, 2, 11),
  ),
  DistributorNotice(
    id: 'notice-03',
    title: 'Lịch bảo trì hệ thống',
    message: 'Hệ thống mock API bảo trì 23:00-23:30 Chủ Nhật.',
    createdAt: DateTime(2026, 2, 9),
  ),
];

const String distributorBankName = 'Vietcombank - CN Ha Noi';
const String distributorBankAccount = '0123456789';
const String distributorBankOwner = 'CONG TY TNHH 4THITEK';
const String distributorTransferTemplate = 'TT [MA_DAI_LY] [MA_DON_HANG]';
