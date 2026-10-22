export interface UserAddress {
    id: number;
    user_id?: number;
    label: string;
    recipient_name: string;
    recipient_phone: string;
    province_id: number | null;
    province_name: string | null;
    city_id: number | null;
    city_name: string;
    district_id: number | null;
    district_name: string;
    subdistrict_id: number | null;
    subdistrict_name: string;
    postal_code: string;
    address: string;
    is_primary: boolean;
    formatted_address?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ProvinceOption {
    id: number;
    name: string;
}

export interface CityOption {
    id: number;
    province_id: number;
    name: string;
    type?: string;
    postal_code?: string;
}

export interface DistrictOption {
    id: number;
    city_id: number;
    name: string;
    postal_code?: string;
}

export interface SubdistrictOption {
    id: number;
    district_id: number;
    name: string;
    postal_code?: string;
}
