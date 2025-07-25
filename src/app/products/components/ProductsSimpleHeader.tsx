'use client';

export default function ProductsSimpleHeader() {
    return (
        <section className="bg-[#0c131d] text-white pt-8 pb-6">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 max-w-6xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-mono text-white">
                        PRODUCT COLLECTION
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                    <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Khám phá bộ sưu tập Products của 4THITEK – nơi hội tụ công nghệ âm thanh đỉnh cao dành riêng cho
                        mọi nhu cầu sử dụng. Mỗi sản phẩm đều được thiết kế tỉ mỉ, mang đến âm thanh rõ ràng, kết nối ổn
                        định và độ bền vượt trội.
                    </p>
                    <div className="text-sm text-gray-400 mt-6">
                        <span className="text-[#4FC8FF] font-semibold">10</span> Featured Products
                    </div>
                </div>
            </div>
        </section>
    );
}
