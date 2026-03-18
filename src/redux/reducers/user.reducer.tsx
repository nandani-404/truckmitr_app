import * as TYPES from '@truckmitr/redux/actions/types'

const initialState = {
    user: null,
    userEdit: null,
    isAuthenticated: false,
    isDriver: undefined,
    isTransporter: undefined,
    profileCompletion: null,
    profileRequiredFieldsStatus: true, // Default to true to prevent flickering before data is loaded
    missingFields: [],
    rank: null,
    star_rating: null,
    dashboard: null,
    subscriptionDetails: null,
    subscriptionModal: false,
    subscriptionModalOptions: {
        upgradeOnly: false,
        minPrice: 0,
    },
    paymentVerificationModal: false,
    referral: null,
    whatsapp_link: null,
    popupData: null,
    consent_check: true, // Default to true to prevent blocking before data load
    shipperKycStatus: null,
    referEarnData: null
}

const userReducer = (state = initialState, action: any) => {
    const { type, payload } = action
    switch (type) {
        case TYPES['USER_AUTHENTICATED']:
            return {
                ...state,
                isAuthenticated: Boolean(payload)
            }
        case TYPES['FETCH_USER']:
            let editData = payload?.user;
            if (typeof editData?.Operational_Segment === 'string') {
                console.log('=== USER REDUCER OPERATIONAL_SEGMENT DEBUG ===');
                console.log('Original Operational_Segment:', editData.Operational_Segment);
                console.log('Operational_Segment type:', typeof editData.Operational_Segment);
                console.log('Starts with [ or {?', editData.Operational_Segment.trim().startsWith('[') || editData.Operational_Segment.trim().startsWith('{'));

                try {
                    // Only try to parse if it looks like JSON (starts with [ or {)
                    if (editData.Operational_Segment.trim().startsWith('[') || editData.Operational_Segment.trim().startsWith('{')) {
                        console.log('Attempting JSON parse...');
                        editData.Operational_Segment = JSON.parse(editData.Operational_Segment);
                        console.log('JSON parse successful:', editData.Operational_Segment);
                    } else {
                        console.log('Keeping as plain string (not JSON format)');
                    }
                    // If it's a plain string like "ecommerce,white_goods", leave it as is
                } catch (e) {
                    console.error("Invalid JSON string in Operational_Segment", e);
                    console.log('Keeping original string value due to parse error');
                    // Keep the original string value if JSON parsing fails
                }
            }

            // Preserve local edits (like profilePath) when refreshing user data
            const preservedUserEdit = (state.userEdit as any)?.profilePath
                ? { ...payload?.user, profilePath: (state.userEdit as any).profilePath }
                : payload?.user;

            return {
                ...state,
                user: payload?.user,
                userEdit: preservedUserEdit,
                isDriver: payload?.user?.role === 'driver',
                isTransporter: payload?.user?.role === 'transporter',
                isForeman: payload?.user?.role === 'foreman',
                isAssociation: payload?.user?.role === 'association',
                isDhaba: payload?.user?.role === 'dhaba',
                isPuncture: payload?.user?.role === 'puncture',
                isShipper: payload?.user?.role === 'shipper',
                profileCompletion: payload?.profile_completion,
                // Use role-specific required fields status from API
                // foreman: foreman_required_fields_status (true = complete, false/null = incomplete)
                // associate: associate_required_fields_status (true = complete, false/null = incomplete)
                // dhaba: dhaba_required_fields_status (true = complete, false/null = incomplete)
                // transporter: transporter_required_fields_status
                // driver: profile_required_fields_status
                profileRequiredFieldsStatus:
                    payload?.user?.role === 'foreman'
                        ? (payload?.foreman_required_fields_status ?? state.profileRequiredFieldsStatus ?? true)
                        : (payload?.user?.role === 'associate' || payload?.user?.role === 'association')
                            ? (payload?.associate_required_fields_status ?? payload?.association_required_fields_status ?? state.profileRequiredFieldsStatus ?? true)
                            : payload?.user?.role === 'dhaba'
                                ? (payload?.dhaba_required_fields_status ?? state.profileRequiredFieldsStatus ?? true)
                                : payload?.user?.role === 'puncture'
                                    ? (payload?.puncture_required_fields_status ?? state.profileRequiredFieldsStatus ?? true)
                                    : payload?.user?.role === 'transporter'
                                        ? (payload?.transporter_required_fields_status ?? true)
                                        : payload?.user?.role === 'shipper'
                                            ? (payload?.shipper_required_fields_status ?? state.profileRequiredFieldsStatus ?? true)
                                            : (payload?.profile_required_fields_status ?? true),
                missingFields:
                    payload?.user?.role === 'foreman'
                        ? (payload?.foreman_missing_fields || [])
                        : (payload?.user?.role === 'associate' || payload?.user?.role === 'association')
                            ? (payload?.associate_missing_fields || payload?.association_missing_fields || [])
                            : payload?.user?.role === 'dhaba'
                                ? (payload?.dhaba_missing_fields || [])
                                : payload?.user?.role === 'puncture'
                                    ? (payload?.puncture_missing_fields || [])
                                    : payload?.user?.role === 'transporter'
                                        ? (payload?.transporter_missing_fields || [])
                                        : payload?.user?.role === 'shipper'
                                            ? (payload?.shipper_missing_fields || [])
                                            : (payload?.missing_required_fields || []),
                dashboard: payload?.dashboard_status,
                rank: payload?.rank,
                star_rating: payload?.star_rating,
                referral: { referral_remains: payload?.referral_remains, referral_sent: payload?.referral_sent, referral_success: payload?.referral_success, referral_bonus: payload?.referral_bonus, total_referrals: payload?.total_referrals },
                whatsapp_link: payload?.whatsapp_link,
                consent_check: payload?.consent_check ?? true, // Use payload value or default to true
                shipperKycStatus: payload?.shipper_kyc_status
            }
        case TYPES['USER_PROFILE_EDIT']:
            return {
                ...state,
                userEdit: payload
            }
        case TYPES['SUBSCRIPTION_DETAILS']:
            // If payload is empty or not an array, clear subscription data
            if (!payload || !Array.isArray(payload) || payload.length === 0) {
                return {
                    ...state,
                    subscriptionDetails: {
                        showSubscriptionModel: true, // No subscription at all
                        hasActiveSubscription: false
                    }
                };
            }

            // Valid subscription payment types - includes all plan names
            const validPaymentTypes = [
                'subscription',
                'Standard',
                'Verified',
                'Trusted',
                'Job Ready',
                'JOB READY',
                'VERIFIED',
                'TRUSTED',
                'trusted',
                'foreman_pro'
            ];

            // Helper function to map 'trusted' to 'foreman_pro' in logs/logic if role is foreman
            // Note: The payload comes from API, so we don't mutate it directly unless needed for UI consistency
            // but we ensure 'foreman_pro' is considered valid.

            // Helper function to convert item to sortable timestamp
            const getItemTimestamp = (item: any) => {
                if (item.created_at) return new Date(item.created_at).getTime();
                if (item.start_at) return item.start_at * 1000; // start_at is usually unix in seconds
                return item.id || 0;
            }

            // FILTER AND SORT: 
            // 1. Filter relevant items (match valid types OR have IDs)
            // 2. Sort by latest created/started first to prioritize most recent
            const sortedRecords = payload
                .filter((item: any) =>
                    validPaymentTypes.includes(item.payment_type) ||
                    !!item.subscription_id ||
                    !!item.payment_id
                )
                .sort((a: any, b: any) => getItemTimestamp(b) - getItemTimestamp(a));

            // Find the first active subscription
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);

            // Helper to safely parse end_at timestamp (handles both string and number)
            const getEndAtTimestamp = (item: any): number => {
                if (!item?.end_at) return 0;
                return typeof item.end_at === 'string' ? parseInt(item.end_at, 10) : item.end_at;
            };

            // Helper function to check if a subscription is a legacy driver (Rs 1, Rs 49 or Rs 100 payment for DRIVERS)
            const isLegacyDriverSubscription = (item: any): boolean => {
                const amount = parseFloat(item.amount) || 0;
                // Legacy driver: Rs 1, Rs 49 or Rs 100 payment
                const isLegacyAmount = amount === 1 || amount === 1.00 || amount === 49 || amount === 49.00 || amount === 100 || amount === 100.00;
                const isPaymentCaptured = item.payment_status === 'captured';
                const endAt = getEndAtTimestamp(item);
                const isNotExpired = currentTimeInSeconds < endAt;
                return isLegacyAmount && isPaymentCaptured && isNotExpired;
            };

            // Helper function to check if a transporter has legacy subscription (Rs 1 or Rs 99 payment for TRANSPORTERS)
            const isLegacyTransporterSubscription = (item: any): boolean => {
                const amount = parseFloat(item.amount) || 0;
                // Legacy transporter: Rs 1 or Rs 99 payment
                const isLegacyAmount = amount === 1 || amount === 1.00 || amount === 99 || amount === 99.00;
                const isPaymentCaptured = item.payment_status === 'captured';
                const endAt = getEndAtTimestamp(item);
                const isNotExpired = currentTimeInSeconds < endAt;
                return isLegacyAmount && isPaymentCaptured && isNotExpired;
            };

            // Helper function to check if this is an association pro subscription
            const isAssociationProSubscription = (item: any): boolean => {
                const isAssociationPro = item.payment_type === 'association_pro' || item.subscription_plan_id === '12' || item.subscription_plan_id === 12;
                const isPaymentCaptured = item.payment_status === 'captured';
                const endAt = getEndAtTimestamp(item);
                const isNotExpired = currentTimeInSeconds < endAt;
                console.log('[userReducer] isAssociationProSubscription check:', {
                    payment_type: item.payment_type,
                    subscription_plan_id: item.subscription_plan_id,
                    payment_status: item.payment_status,
                    end_at: item.end_at,
                    endAt,
                    currentTimeInSeconds,
                    isAssociationPro,
                    isPaymentCaptured,
                    isNotExpired
                });
                return isAssociationPro && isPaymentCaptured && isNotExpired;
            };

            // Helper function to check if this is a transporter pro subscription
            const isTransporterProSubscription = (item: any): boolean => {
                const isTransporterPro = item.payment_type === 'transporter_pro';
                const isPaymentCaptured = item.payment_status === 'captured';
                const endAt = getEndAtTimestamp(item);
                const isNotExpired = currentTimeInSeconds < endAt;
                return isTransporterPro && isPaymentCaptured && isNotExpired;
            };

            // Helper function to check if this is a foreman pro subscription
            const isForemanProSubscription = (item: any): boolean => {
                const isForemanPro = item.payment_type === 'foreman_pro';
                const isPaymentCaptured = item.payment_status === 'captured';
                const endAt = getEndAtTimestamp(item);
                const isNotExpired = currentTimeInSeconds < endAt;
                return isForemanPro && isPaymentCaptured && isNotExpired;
            };

            // Helper function to check if a subscription is active
            const isActiveSubscription = (item: any): boolean => {
                // Check for legacy driver (Rs 1, Rs 49 or Rs 100 payment)
                if (isLegacyDriverSubscription(item)) {
                    console.log('[userReducer] Legacy driver detected (Rs 1/49/100 subscription)');
                    return true;
                }
                // Check for legacy transporter subscription (Rs 1 or Rs 99 payment)
                if (isLegacyTransporterSubscription(item)) {
                    console.log('[userReducer] Legacy transporter detected (Rs 1/99 subscription)');
                    return true;
                }

                // Check for foreman_pro subscription specifically
                if (item.payment_type === 'foreman_pro' && item.payment_status === 'captured') {
                    const isNotExpired = currentTimeInSeconds < item.end_at;
                    if (isNotExpired) {
                        console.log('[userReducer] Foreman Pro subscription detected');
                        return true;
                    }
                }

                // Standard subscription check - ALLOW payment_id based subscriptions
                // Updated logic: Needs either subscription_id OR payment_id
                const hasId = !!item.subscription_id || !!item.payment_id;
                const isPaymentCaptured = item.payment_status === 'captured';
                const isNotExpired = currentTimeInSeconds < item.end_at;
                return hasId && isPaymentCaptured && isNotExpired;
            };

            // Since we sorted by latest first, the first active one we find is the CORRECT current plan
            let activeSubscription = sortedRecords.find((item: any) => isActiveSubscription(item));

            // If no active subscription found in filtered records, check ALL payload items (sorted)
            if (!activeSubscription && payload.length > 0) {
                // Sort payload too just in case
                const sortedPayload = [...payload].sort((a: any, b: any) => getItemTimestamp(b) - getItemTimestamp(a));
                activeSubscription = sortedPayload.find((item: any) => isActiveSubscription(item));
            }

            // If no active subscription found, use the first sorted record for details (most recent attempt)
            let payloadSubscriptionDetails = activeSubscription || sortedRecords[0] || payload[0];

            // If still no valid subscription details, return empty state
            if (!payloadSubscriptionDetails || !payloadSubscriptionDetails.id) {
                return {
                    ...state,
                    subscriptionDetails: {
                        showSubscriptionModel: true,
                        hasActiveSubscription: false
                    }
                };
            }

            if (payloadSubscriptionDetails && typeof payloadSubscriptionDetails?.payment_details === 'string') {
                try {
                    payloadSubscriptionDetails = {
                        ...payloadSubscriptionDetails,
                        payment_details: JSON.parse(payloadSubscriptionDetails.payment_details)
                    };
                } catch (e) {
                    console.error("Invalid JSON string in payment_details", e);
                }
            }

            // Determine if user has an active subscription
            const hasActiveSubscription = !!activeSubscription;
            const endAtForExpiry = payloadSubscriptionDetails?.end_at
                ? (typeof payloadSubscriptionDetails.end_at === 'string'
                    ? parseInt(payloadSubscriptionDetails.end_at, 10)
                    : payloadSubscriptionDetails.end_at)
                : 0;
            const subscriptionExpiry = endAtForExpiry ? currentTimeInSeconds > endAtForExpiry : true;

            // showSubscriptionModel is true when user does NOT have an active subscription
            const shouldShowSubscriptionModal = !hasActiveSubscription;

            console.log('[userReducer] Final subscription state:', {
                hasActiveSubscription,
                shouldShowSubscriptionModal,
                subscriptionExpiry,
                payment_type: payloadSubscriptionDetails?.payment_type,
                subscription_plan_id: payloadSubscriptionDetails?.subscription_plan_id,
                payment_status: payloadSubscriptionDetails?.payment_status,
                end_at: payloadSubscriptionDetails?.end_at,
                currentTimeInSeconds
            });

            return {
                ...state,
                subscriptionDetails: {
                    ...payloadSubscriptionDetails,
                    subscriptionExpiry,
                    showSubscriptionModel: shouldShowSubscriptionModal,
                    hasActiveSubscription: hasActiveSubscription
                }
            }
        case TYPES['SUBSCRIPTION_MODAL']:
            // Handle both boolean and object payloads
            // Object payload: { visible: true, upgradeOnly: true } - shows only ₹199 and ₹499 plans
            // Boolean payload: true/false - shows all plans
            if (typeof payload === 'object' && payload !== null) {
                return {
                    ...state,
                    subscriptionModal: payload.visible || false,
                    subscriptionModalOptions: {
                        upgradeOnly: payload.upgradeOnly || false,
                        minPrice: payload.minPrice,
                    }
                }
            }
            return {
                ...state,
                subscriptionModal: payload,
                subscriptionModalOptions: {
                    upgradeOnly: false,
                }
            }
        case TYPES['PAYMENTVERIFICATION_MODAL']:
            return {
                ...state,
                paymentVerificationModal: payload
            }
        case TYPES['SET_POPUP_DATA']:
            return {
                ...state,
                popupData: payload
            }
        case TYPES['REFER_EARN_DATA']:
            return {
                ...state,
                referEarnData: payload
            }
        default: return { ...state }
    }

}

export default userReducer