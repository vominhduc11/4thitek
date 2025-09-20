'use client';

interface SpecificationItem {
    label: string;
    value: string;
}

interface ProductSpecificationsProps {
    specifications?: SpecificationItem[] | { general?: SpecificationItem[]; technical?: SpecificationItem[] };
}

export default function ProductSpecifications({ specifications = [] }: ProductSpecificationsProps) {
    // Handle both array and object formats
    const specsArray = Array.isArray(specifications) ? specifications : [];
    const specsObject = !Array.isArray(specifications) ? specifications : { general: [], technical: [] };

    // Use array format if available, otherwise use object format
    const displaySpecs = specsArray.length > 0 ? specsArray : [
        ...(specsObject.general || []),
        ...(specsObject.technical || [])
    ];

    // Default specs if no data available
    const defaultSpecs = [
        { label: "Model", value: "SCS S-9" },
        { label: "Bluetooth Version", value: "5.0" },
        { label: "Khoảng Cách Kết Nối", value: "1000m" },
        { label: "Số Người Kết Nối", value: "6 người" },
        { label: "Thời Gian Đàm Thoại", value: "12 giờ" },
        { label: "Thời Gian Chờ", value: "300 giờ" },
        { label: "Pin", value: "Li-ion 900mAh" },
        { label: "Thời Gian Sạc", value: "2.5 giờ" },
        { label: "Chống Nước", value: "IPX6" },
        { label: "Nhiệt Độ Hoạt Động", value: "-10°C ~ +55°C" },
        { label: "Trọng Lượng", value: "85g" },
        { label: "Kích Thước", value: "120 x 60 x 25mm" }
    ];

    const finalSpecs = displaySpecs.length > 0 ? displaySpecs : defaultSpecs;

    return (
        <section id="product-details" className="relative z-[60]">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl font-bold mb-4 md:mb-6 text-white">
                    THÔNG SỐ KỸ THUẬT
                </h2>

                {/* Main Specifications Table */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {finalSpecs.map((spec, index) => (
                            <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-600/40 transition-colors duration-200"
                            >
                                <span className="text-blue-300 font-semibold text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl mb-1 sm:mb-0">
                                    {spec.label}
                                </span>
                                <span className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                    {spec.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
