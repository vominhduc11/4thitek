'use client';

import Image from 'next/image';
import { sanitizeHtml } from '@/utils/sanitize';

// Unused interface - commented out to fix linting
// interface Feature {
//     title: string;
//     subtitle?: string;
//     description: string;
//     value?: string;
// }

interface ContentItem {
    type: 'title' | 'list_text' | 'image' | 'text' | 'video';
    content?: string;
    link?: string;
    videoUrl?: string;
    videoTitle?: string;
}

interface ProductDetailsProps {
    description: string;
    content?: ContentItem[];
    descriptions?: unknown[];
}

// Demo data structure:
// const demoContent = [
//     {
//         type: "title",
//         content: "TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9"
//     },
//     {
//         type: "list_text",
//         content: "Bạn sẽ cảm thấy thoã mãn túi tiền với thiết kế cứng cáp, sang trọng từ bên ngoài của S-9. Tinh tế và góc cạnh cùng với các cụm nút nhấn sắc xảo\nNút S9 đặc trưng cho các thao tác chạm nghe cuộc gọi rãnh tay nhanh chóng đến chuẩn xác\nNút âm lượng cùng dãy với các thao tác Next/ Back, Tăng/ Giảm âm thanh\nNút Intercom hình chiếc mũ bảo hiểm cho thao tác Nhận/ Ngưng cuộc gọi trong đoàn\nCổng Micro USB sạc và update hệ thống qua cáp USB\nCổng jack tai nghe 3.5mm trên đế S-9 kết nối micro và cổng AUX cho các kết nối âm thanh với các thiết bị khác qua cáp 2 đầu 3.5mm"
//     },
//     {
//         type: "image",
//         link: "/products/product1.png"
//     },
//     {
//         type: "text",
//         content: "Tai nghe mũ bảo hiểm Bluetooth Intercom SCS S-9 là thiết bị liên lạc không dây hiện đại, được thiết kế đặc biệt cho người đi xe máy, mô tô và những người yêu thích phượt. Với khả năng kết nối Bluetooth, thiết bị cho phép người dùng giao tiếp với nhau trong khoảng cách lên đến 1000m, nghe nhạc, nhận cuộc gọi và điều khiển bằng giọng nói."
//     }
// ];

export default function ProductDetails({ description, content, descriptions }: ProductDetailsProps) {
    // Demo features data (unused but kept for future reference)
    // const demoFeatures = [
    //     {
    //         title: 'Quantum ANC',
    //         subtitle: 'Công nghệ khử tiếng ồn lượng tử',
    //         description:
    //             'Sử dụng thuật toán AI tiên tiến để phân tích và loại bỏ 99% tạp âm trong thời gian thực, tạo ra bong bóng âm thanh hoàn hảo cho trải nghiệm gaming đỉnh cao'
    //     },
    //     {
    //         title: 'HyperSonic 7.1',
    //         subtitle: 'Hệ thống âm thanh không gian 360°',
    //         description:
    //             'Công nghệ âm thanh vòm thế hệ mới với 8 driver ảo, cho phép cảm nhận từng chi tiết âm thanh từ mọi hướng với độ chính xác đến từng miligiây'
    //     },
    //     {
    //         title: 'Aurora RGB Pro',
    //         subtitle: 'Hệ sinh thái ánh sáng thông minh',
    //         description:
    //             'Hơn 50 triệu tổ hợp màu sắc với 25+ hiệu ứng động đồng bộ theo nhịp tim, nhạc và gameplay, tạo nên trải nghiệm thị giác choáng ngợp'
    //     }
    // ];

    // Demo data for testing
    const demoContent = [
        {
            type: 'title' as const,
            content: 'TAI NGHE GAMING CHUYÊN NGHIỆP - TRẢI NGHIỆM ÂM THANH ĐỈNH CAO'
        },
        {
            type: 'list_text' as const,
            content:
                'Công nghệ khử tiếng ồn chủ động ANC - Loại bỏ hoàn toàn tạp âm môi trường, mang đến không gian gaming tuyệt đối yên tĩnh\nÂm thanh vòm ảo 7.1 Surround - Định vị chính xác từng âm thanh trong game, nâng cao khả năng phản ứng và chiến thuật\nHệ thống đèn LED RGB Spectrum - 16.7 triệu màu sắc với hiệu ứng động đồng bộ, tùy chỉnh theo phong cách gaming cá nhân\nDriver Neodymium 50mm cao cấp - Tái tạo âm bass mạnh mẽ và treble trong trẻo, mang đến trải nghiệm âm thanh sống động\nTương thích đa nền tảng - Hỗ trợ PC, PlayStation, Xbox, Nintendo Switch và các thiết bị di động'
        },
        {
            type: 'image' as const,
            link: '/products/product1.png'
        },
        {
            type: 'text' as const,
            content:
                'Được thiết kế dành riêng cho game thủ chuyên nghiệp và những người đam mê âm thanh chất lượng cao. Tích hợp công nghệ Active Noise Cancelling tiên tiến cùng hệ thống âm thanh vòm ảo 7.1 được tinh chỉnh bởi các chuyên gia âm thanh, đảm bảo trải nghiệm gaming hoàn hảo với khả năng định vị âm thanh cực kỳ chính xác. Thiết kế RGB Spectrum đẳng cấp với khả năng tùy chỉnh không giới hạn, đồng bộ hoàn hảo với mọi setup gaming.'
        }
    ];
    const renderContent = (item: ContentItem, index: number) => {
        switch (item.type) {
            case 'title':
                return (
                    <div key={index} className="w-full">
                        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl font-bold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 5xl:mb-12">{item.content}</h3>
                    </div>
                );
            case 'list_text':
                return (
                    <div key={index} className="text-justify">
                        <ul className="space-y-3 2xl:space-y-4 3xl:space-y-5 4xl:space-y-6 5xl:space-y-8 list-disc list-inside text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl leading-relaxed">
                            {item.content
                                ?.split('\n')
                                .filter((line) => line.trim())
                                .map((line, lineIndex) => (
                                    <li key={lineIndex} className="pl-2 2xl:pl-3 3xl:pl-4 4xl:pl-5 5xl:pl-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl">
                                        {line.trim()}
                                    </li>
                                ))}
                        </ul>
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-[2/1] overflow-hidden">
                            <Image
                                src={item.link || '/products/product1.png'}
                                alt="Product image"
                                width={1200}
                                height={400}
                                className="w-full h-full object-cover rounded-lg"
                                priority
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 3200px) 1200px, 1500px"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbG1ldCBEZXRhaWw8L3RleHQ+PC9zdmc+';
                                }}
                            />
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div key={index} className="text-justify">
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">{item.content}</p>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-video overflow-hidden">
                            {item.videoUrl ? (
                                <iframe
                                    className="w-full h-full"
                                    src={item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be')
                                        ? `https://www.youtube.com/embed/${item.videoUrl.includes('watch?v=')
                                            ? item.videoUrl.split('watch?v=')[1].split('&')[0]
                                            : item.videoUrl.split('/').pop()}`
                                        : item.videoUrl}
                                    title={item.videoTitle || item.content || 'Product Video'}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <p className="text-gray-400 text-center">Video không khả dụng</p>
                                </div>
                            )}
                        </div>
                        {(item.videoTitle || item.content) && (
                            <div className="mt-4">
                                <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl font-semibold text-white mb-2">
                                    {item.videoTitle || item.content}
                                </h4>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    // Render descriptions from API
    const renderApiDescription = (item: unknown, index: number) => {
        const typedItem = item as { type: string; text?: string; [key: string]: unknown };
        switch (typedItem.type) {
            case 'title':
                return (
                    <div key={index} className="w-full">
                        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl font-bold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 5xl:mb-12">{typedItem.text}</h3>
                    </div>
                );
            case 'description':
                return (
                    <div key={index} className="text-justify">
                        <div
                            className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(typedItem.text || '') }}
                        />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-[2/1] overflow-hidden">
                            <Image
                                src={(typedItem.imageUrl as string) || (typedItem.link as string) || '/products/product1.png'}
                                alt="Product detail image"
                                width={1200}
                                height={400}
                                className="w-full h-full object-cover rounded-lg"
                                priority
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 3200px) 1200px, 1500px"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbG1ldCBEZXRhaWw8L3RleHQ+PC9zdmc+';
                                }}
                            />
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-video overflow-hidden">
                            {(typedItem.videoUrl as string) ? (
                                <iframe
                                    className="w-full h-full"
                                    src={(typedItem.videoUrl as string).includes('youtube.com') || (typedItem.videoUrl as string).includes('youtu.be')
                                        ? `https://www.youtube.com/embed/${(typedItem.videoUrl as string).includes('watch?v=')
                                            ? (typedItem.videoUrl as string).split('watch?v=')[1].split('&')[0]
                                            : (typedItem.videoUrl as string).split('/').pop()}`
                                        : (typedItem.videoUrl as string)}
                                    title={typedItem.text || 'Product Video'}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <p className="text-gray-400 text-center">Video không khả dụng</p>
                                </div>
                            )}
                        </div>
                        {typedItem.text && (
                            <div className="mt-4">
                                <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl font-semibold text-white mb-2">
                                    {typedItem.text}
                                </h4>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <section className="relative z-[150] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[200]">


                {/* Product Description */}
                <div className="mb-12 md:mb-16">
                    <div className="flex flex-col space-y-6">
                        {descriptions && descriptions.length > 0 ? (
                            descriptions.map((item, index) => renderApiDescription(item, index))
                        ) : content && content.length > 0 ? (
                            content.map((item, index) => renderContent(item, index))
                        ) : demoContent ? (
                            demoContent.map((item, index) => renderContent(item, index))
                        ) : (
                            <>
                                {/* Fallback to original content */}
                                <div className="w-full">
                                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-[2/1] overflow-hidden">
                                        <Image
                                            src="/products/product1.png"
                                            alt="Tai nghe Bluetooth intercom cho mũ bảo hiểm"
                                            width={1200}
                                            height={400}
                                            className="w-full h-full object-cover rounded-lg"
                                            priority
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 3200px) 1200px, 1500px"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src =
                                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbG1ldCBEZXRhaWw8L3RleHQ+PC9zdmc+';
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="w-full">
                                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4">
                                        TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9
                                    </h3>
                                </div>

                                <div className="space-y-6 text-justify">
                                    <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">{description}</p>
                                    <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">
                                        Tai nghe mũ bảo hiểm Bluetooth Intercom SCS S-9 là thiết bị liên lạc không dây
                                        hiện đại, được thiết kế đặc biệt cho người đi xe máy, mô tô và những người yêu
                                        thích phượt. Với khả năng kết nối Bluetooth, thiết bị cho phép người dùng giao
                                        tiếp với nhau trong khoảng cách lên đến 1000m, nghe nhạc, nhận cuộc gọi và điều
                                        khiển bằng giọng nói.
                                    </p>
                                    <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">
                                        Sản phẩm được trang bị công nghệ khử tiếng ồn tiên tiến, đảm bảo chất lượng âm
                                        thanh rõ ràng ngay cả khi di chuyển ở tốc độ cao. Pin lithium dung lượng cao cho
                                        thời gian sử dụng lên đến 12 giờ đàm thoại liên tục hoặc 8 giờ khi vừa đàm thoại
                                        vừa nghe nhạc.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
