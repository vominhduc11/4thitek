import Link from 'next/link';
import DealerNetworkSection from '@/components/reseller/DealerNetworkSection';

export default function DealerLocatorPage() {
    return (
        <main className="relative overflow-hidden pb-20">
            <section className="px-4 pt-14 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="brand-card rounded-[2rem] p-8 lg:p-10">
                        <p className="brand-eyebrow mb-3">Hệ thống đại lý</p>
                        <h1 className="font-serif text-4xl font-semibold text-[var(--brand-blue)] sm:text-5xl">
                            Tìm đại lý 4T HITEK gần bạn
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                            Tra cứu danh sách đại lý đang hoạt động bằng dữ liệu public runtime hiện tại. Bạn có thể
                            lọc theo tỉnh, quận huyện và địa chỉ để tìm điểm phân phối phù hợp nhanh hơn.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/become_our_reseller" className="brand-button-primary">
                                Trở thành đại lý
                            </Link>
                            <Link href="/contact" className="brand-button-secondary">
                                Liên hệ kinh doanh
                            </Link>
                        </div>
                    </div>

                    <div className="brand-card rounded-[2rem] p-8 lg:p-10">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                            Public runtime contract
                        </p>
                        <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
                            <li>Dữ liệu lấy trực tiếp từ public dealer API đang dùng ở production.</li>
                            <li>Danh sách chỉ hiển thị dealer đang hoạt động công khai.</li>
                            <li>Route cũ vẫn được giữ bằng redirect để tránh gãy liên kết đã phát hành.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <DealerNetworkSection />
                </div>
            </section>
        </main>
    );
}
