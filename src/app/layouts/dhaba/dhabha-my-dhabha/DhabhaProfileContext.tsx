import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export interface FacilityState {
    sitting_facility: boolean;
    clean_restrooms: boolean;
    drinking_water: boolean;
    parking_small: boolean;
    parking_large: boolean;
    sleeping_area: boolean;
    washing_area: boolean;
    electric_point: boolean;
    cctv: boolean;
    security_staff: boolean;
    wheel_alignment: boolean;
    mechanic: boolean;
}

export interface FoodTypeState {
    foodOption: 'veg' | 'non_veg' | 'both';
    mealAvailability: string[];
    specialDishes: string;
}

export interface ProfileData {
    businessName: string;
    ownerName: string;
    contactNumber: string;
    email: string;
    establishmentYear: string;
    dhabhaType: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    location: string;
    openingTime: string;
    closingTime: string;
    is24x7: boolean;
    peakHours: string;
    facilities: FacilityState;
    foodType: FoodTypeState;
    driver_offers: string[];
    offer_details: any;
    dhabaId: string;
}

interface DhabhaProfileContextType {
    profileData: ProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
    photos: { [key: string]: string[] };
    setPhotos: React.Dispatch<React.SetStateAction<{ [key: string]: string[] }>>;
}

const DhabhaProfileContext = createContext<DhabhaProfileContextType | undefined>(undefined);

export const DhabhaProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get userEdit from Redux
    const { userEdit } = useSelector((state: any) => state?.user);

    // Initialize profileData from Redux userEdit
    const getInitialProfileData = (): ProfileData => ({
        businessName: userEdit?.dhabha_name || '',
        ownerName: userEdit?.owner_name || '',
        contactNumber: userEdit?.mobile || '',
        email: userEdit?.email || '',
        establishmentYear: userEdit?.establishment_year || '',
        dhabhaType: userEdit?.dhabha_type || '',
        address: userEdit?.address || '',
        city: userEdit?.district || '',
        state: userEdit?.state || '',
        pincode: userEdit?.pincode || '',
        location: userEdit?.latitude && userEdit?.longitude
            ? `${userEdit.latitude}, ${userEdit.longitude}`
            : '',
        openingTime: userEdit?.opening_time || '',
        closingTime: userEdit?.closing_time || '',
        is24x7: userEdit?.is_24x7 || false,
        peakHours: userEdit?.peak_hours || '',
        driver_offers: userEdit?.driver_offers || [],
        offer_details: userEdit?.offer_details || {},
        facilities: {
            sitting_facility: userEdit?.sitting_facility || false,
            clean_restrooms: userEdit?.clean_restrooms || false,
            drinking_water: userEdit?.drinking_water || false,
            parking_small: userEdit?.parking_small || false,
            parking_large: userEdit?.parking_large || false,
            sleeping_area: userEdit?.sleeping_area || false,
            washing_area: userEdit?.washing_area || false,
            electric_point: userEdit?.electric_point || false,
            cctv: userEdit?.cctv || false,
            security_staff: userEdit?.security_staff || false,
            wheel_alignment: userEdit?.wheel_alignment || false,
            mechanic: userEdit?.mechanic || false,
        },
        foodType: {
            foodOption: userEdit?.food_type?.[0]?.includes('Both') ? 'both'
                : userEdit?.food_type?.[0]?.includes('Non') ? 'non_veg'
                    : 'veg',
            mealAvailability: userEdit?.meal_availability || [],
            specialDishes: userEdit?.special_dishes || ''
        },
        dhabaId: userEdit?.dhaba_id || ''
    });

    const [profileData, setProfileData] = useState<ProfileData>(getInitialProfileData());

    // Re-initialize when userEdit changes (e.g., after fetching profile from API)
    useEffect(() => {
        setProfileData(getInitialProfileData());
    }, [userEdit]);

    const [photos, setPhotos] = useState<{ [key: string]: string[] }>({
        dishes: userEdit?.shop_photos || [],
        menu: [],
        sitting: [],
        restroom: [],
        parking: [],
        sleeping: [],
        bath: [],
        water: [],
        electric: [],
        cctv: [],
        guard: [],
    });

    return (
        <DhabhaProfileContext.Provider value={{ profileData, setProfileData, photos, setPhotos }}>
            {children}
        </DhabhaProfileContext.Provider>
    );
};

export const useDhabhaProfile = () => {
    const context = useContext(DhabhaProfileContext);
    if (!context) throw new Error('useDhabhaProfile must be used within DhabhaProfileProvider');
    return context;
};
