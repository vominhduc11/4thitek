export interface Reseller {
    id: string | number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}

export interface ResellerSearchFilters {
    city: string;
    district: string;
    address: string;
}
