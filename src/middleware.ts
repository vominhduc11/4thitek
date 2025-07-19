import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isAuthenticated = request.cookies.has('4thitek_auth') || request.cookies.has('4thitek_user');

    // Log để kiểm tra trạng thái đăng nhập
    console.log('Middleware - isAuthenticated:', isAuthenticated);
    console.log('Middleware - cookies:', request.cookies.getAll());
    console.log('Middleware - path:', request.nextUrl.pathname);

    // Các route yêu cầu xác thực
    const protectedRoutes = ['/warranty-management'];

    // Kiểm tra xem URL hiện tại có thuộc route được bảo vệ không
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

    // Nếu route được bảo vệ và người dùng chưa đăng nhập, chuyển hướng đến trang chủ
    // Chúng ta sẽ xử lý việc hiển thị modal đăng nhập bằng AuthenticatedLink
    if (isProtectedRoute && !isAuthenticated) {
        console.log('Middleware - redirecting to home page');
        return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Middleware - allowing access');
    return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route cụ thể
export const config = {
    matcher: ['/warranty-management/:path*']
};
