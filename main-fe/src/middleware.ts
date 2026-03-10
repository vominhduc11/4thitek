import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isAuthenticated = request.cookies.has('4thitek_auth') || request.cookies.has('4thitek_user');

    // Check authentication status

    // Các route yêu cầu xác thực
    const protectedRoutes = ['/warranty-management', '/account'];

    // Kiểm tra xem URL hiện tại có thuộc route được bảo vệ không
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

    // Nếu route được bảo vệ và người dùng chưa đăng nhập, chuyển hướng đến trang chủ.
    // Luồng mở modal đăng nhập được xử lý ở client khi cần.
    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route cụ thể
export const config = {
    matcher: ['/warranty-management/:path*', '/account/:path*']
};
