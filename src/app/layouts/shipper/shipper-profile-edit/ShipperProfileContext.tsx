import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

export interface ShipperProfileData {
    // KYC Details
    companyRegistrationType: string;
    nameAsPerPan: string;
    dobAsPerPan: string;
    panNumber: string;
    panImage: string | null;
    gstApplicable: boolean;
    gstNumber: string;
    companyNameFromGst: string;
    gstImage: string | null;
    addressFromGst: string;

    // Basic Detail
    email: string;
    phone: string;
    pincode: string;
    city: string;
    state: string;

    // Business Detail
    companyName: string;
    yearInBusiness: string;
    monthlyLoads: string;

    // POC Detail
    secondContactName: string;
    secondMobile: string;
    noSecondPoc: boolean;

    // Profile Upload
    profileImage: string | null;

    // Status
    kycVerified: string; // '0' or '1'
    shipperKycStatus: string; // '0' or '1'
}

interface ShipperProfileContextType {
    profileData: ShipperProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<ShipperProfileData>>;
    saveProfile: (isKycOnly?: boolean) => Promise<boolean>;
    loading: boolean;
    fetching: boolean;
}

const ShipperProfileContext = createContext<ShipperProfileContextType | undefined>(undefined);

export const ShipperProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize with default or empty values. 
    // In a real app, this might come from an API or Redux store.
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const { user } = useSelector((state: any) => state.user);

    const [profileData, setProfileData] = useState<ShipperProfileData>({
        companyRegistrationType: '',
        nameAsPerPan: '',
        dobAsPerPan: '',
        panNumber: '',
        panImage: null,
        gstApplicable: false,
        gstNumber: '',
        companyNameFromGst: '',
        gstImage: null,
        addressFromGst: '',
        email: '',
        phone: '',
        pincode: '',
        city: '',
        state: '',
        companyName: '',
        yearInBusiness: '',
        monthlyLoads: '',
        secondContactName: '',
        secondMobile: '',
        noSecondPoc: false,
        profileImage: null,
        kycVerified: '0',
        shipperKycStatus: '1',
    });

    // Fetch profile data from API on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setFetching(true);
                const response: any = await axiosInstance.get(END_POINTS.SHIPPER_PROFILE_GET);
                if (response?.data?.success) {
                    const apiUser = response.data.data?.user;
                    const shipperProfile = response.data.data?.shipper_profile;

                    setProfileData({
                        // KYC Details - from shipper_profile
                        companyRegistrationType: shipperProfile?.company_registration_type || '',
                        nameAsPerPan: shipperProfile?.name_as_per_pan || '',
                        dobAsPerPan: shipperProfile?.dob_as_per_pan || '',
                        panNumber: shipperProfile?.pan_number || '',
                        panImage: shipperProfile?.pan_image ? `${BASE_URL}public/storage/${shipperProfile.pan_image}` : null,
                        gstApplicable: shipperProfile?.gst_not_applicable ? true : false,
                        gstNumber: shipperProfile?.gst_number || '',
                        companyNameFromGst: shipperProfile?.company_name || '',
                        gstImage: shipperProfile?.gst_certificate ? `${BASE_URL}public/storage/${shipperProfile.gst_certificate}` : null,
                        addressFromGst: shipperProfile?.address || '',

                        // Basic Detail - from user + shipper_profile
                        email: apiUser?.email || '',
                        phone: apiUser?.mobile || '',
                        pincode: shipperProfile?.pincode || '',
                        city: apiUser?.city || '',
                        state: apiUser?.states || '',

                        // Business Detail - from shipper_profile
                        companyName: shipperProfile?.company_name || '',
                        yearInBusiness: shipperProfile?.years_in_business || '',
                        monthlyLoads: shipperProfile?.shipper_expected_load || '',

                        // POC Detail - from shipper_profile
                        secondContactName: shipperProfile?.name_poc || '',
                        secondMobile: shipperProfile?.phone_poc || '',
                        noSecondPoc: shipperProfile?.no_second_poc || false,

                        // Profile Upload
                        profileImage: shipperProfile?.profile_image ? `${BASE_URL}public/${shipperProfile.profile_image}` : (apiUser?.images ? `${BASE_URL}public/${apiUser.images}` : null),

                        // Status
                        kycVerified: String(shipperProfile?.kyc_verified || '0'),
                        shipperKycStatus: String(response.data.data?.shipper_kyc_status || '1'),
                    });
                }
            } catch (error) {
                console.error('Error fetching shipper profile:', error);
            } finally {
                setFetching(false);
            }
        };

        fetchProfile();
    }, []);

    const convertToSnakeCase = (str: string) => {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    const validateProfile = (isKycOnly: boolean = false) => {
        if (!profileData.companyRegistrationType) {
            showToast('Please select Company Registration Type');
            return false;
        }
        // if (!profileData.nameAsPerPan) {
        //     showToast('Please enter Name as per PAN');
        //     return false;
        // }
        if (!profileData.panNumber) {
            showToast('Please enter PAN Number');
            return false;
        }
        // Basic PAN format check
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(profileData.panNumber)) {
            showToast('Invalid PAN Number format (e.g., ABCDE1234F)');
            return false;
        }

        if (profileData.gstApplicable) {
            if (!profileData.gstNumber) {
                showToast('Please enter GST Number');
                return false;
            }
            // Basic GST format check
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(profileData.gstNumber)) {
                showToast('Invalid GST Number format');
                return false;
            }
        }

        if (!isKycOnly) {
            if (!profileData.email) {
                showToast('Please enter Email');
                return false;
            }
        }

        if (profileData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profileData.email)) {
                showToast('Invalid Email format');
                return false;
            }
        }

        if (!profileData.phone) {
            showToast('Please enter Phone Number');
            return false;
        }
        if (profileData.phone.length !== 10) {
            showToast('Phone Number must be 10 digits');
            return false;
        }

        return true;
    };

    const saveProfile = async (isKycOnly: boolean = false) => {
        if (!validateProfile(isKycOnly)) return false;

        setLoading(true);
        try {
            const formData = new FormData();

            // Append Text Fields
            Object.keys(profileData).forEach(key => {
                const value = profileData[key as keyof ShipperProfileData];
                // Skip images and status fields handled separately
                if (key === 'panImage' || key === 'gstImage' || key === 'profileImage' || key === 'kycVerified') {
                    return;
                }

                // Skip companyName to avoid duplication with companyNameFromGst which both map to company_name
                if (key === 'companyName') {
                    return;
                }

                let apiKey = convertToSnakeCase(key);

                // Manual overrides based on user request
                if (key === 'gstApplicable') {
                    const gstVal = value ? '1' : '0';
                    console.log(`[SaveProfile] Appending: gst_not_applicable = ${gstVal}`);
                    formData.append('gst_not_applicable', gstVal);
                    return;
                }

                if (key === 'companyNameFromGst') {
                    // Use GST name if applicable, otherwise fallback to the manual companyName
                    const finalCompanyName = profileData.gstApplicable ? profileData.companyNameFromGst : profileData.companyName;
                    console.log(`[SaveProfile] Appending: company_name = ${finalCompanyName}`);
                    formData.append('company_name', finalCompanyName);
                    return;
                }

                if (key === 'addressFromGst') {
                    apiKey = 'address';
                }

                if (key === 'yearInBusiness') {
                    apiKey = 'years_in_business';
                }

                if (key === 'monthlyLoads') {
                    apiKey = 'shipper_expected_load';
                }

                if (key === 'secondContactName') {
                    apiKey = 'name_poc';
                }

                if (key === 'secondMobile') {
                    apiKey = 'phone_poc';
                }

                console.log(`[SaveProfile] Appending: ${apiKey} = ${value}`);
                formData.append(apiKey, value as string);
            });

            // Append Images
            if (profileData.panImage && !profileData.panImage.startsWith('http')) {
                console.log(`[SaveProfile] Appending image: pan_image`);
                formData.append('pan_image', {
                    uri: profileData.panImage,
                    type: 'image/jpeg',
                    name: 'pan_image.jpg',
                } as any);
            }
            if (profileData.gstImage && !profileData.gstImage.startsWith('http')) {
                console.log(`[SaveProfile] Appending image: gst_certificate`);
                formData.append('gst_certificate', {
                    uri: profileData.gstImage,
                    type: 'image/jpeg',
                    name: 'gst_certificate.jpg',
                } as any);
            }
            if (profileData.profileImage && !profileData.profileImage.startsWith('http')) {
                console.log(`[SaveProfile] Appending image: profile_image`);
                formData.append('profile_image', {
                    uri: profileData.profileImage,
                    type: 'image/jpeg',
                    name: 'profile_image.jpg',
                } as any);
            }

            console.log('[SaveProfile] Final Payload initialized, sending to API...');

            const response = await axiosInstance.post(END_POINTS.SHIPPER_PROFILE_UPDATE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status || response.data.success) {
                showToast('Profile updated successfully');
                // Optionally refresh user data
                return true;
            } else {
                showToast(response.data.message || 'Failed to update profile');
                return false;
            }
        } catch (error) {
            console.error('Save profile error:', error);
            showToast('An error occurred while saving profile');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ShipperProfileContext.Provider value={{ profileData, setProfileData, saveProfile, loading, fetching }}>
            {children}
        </ShipperProfileContext.Provider>
    );
};

export const useShipperProfile = () => {
    const context = useContext(ShipperProfileContext);
    if (!context) throw new Error('useShipperProfile must be used within ShipperProfileProvider');
    return context;
};
