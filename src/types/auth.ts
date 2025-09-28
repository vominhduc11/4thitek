export interface LoginRequest {
    username: string;
    password: string;
    userType?: 'ADMIN' | 'DEALER' | 'CUSTOMER';
}

export interface LoginResponse {
    message: string;
    data: {
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        refreshExpiresIn: number;
        username: string;
        roles: string[];
        accountId: number;
    };
}

export interface LogoutResponse {
    message: string;
    data: {
        message: string;
        logoutAt: string;
    };
}

export interface CustomerDetails {
    accountId: number;
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface WarrantyItem {
    id: number;
    idProductSerial: number;
    idCustomer: number;
    warrantyCode: string;
    status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
    purchaseDate: string;
    createdAt: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    productSerial: {
        id: number;
        serialNumber: string;
        productName: string;
        productSku: string;
        status: string;
        image: string;
    };
}

export interface User {
    id: string;
    username: string;
    roles: string[];
    accountId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
}