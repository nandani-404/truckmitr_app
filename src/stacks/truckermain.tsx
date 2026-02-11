/**
 * TruckerMain Stack Navigator
 * 
 * Completely independent navigation stack for Trucker Mode.
 * Does NOT share navigation state with the transporter stack.
 * Has its own bottom tabs, screen groups, and navigation history.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import TruckerBottomTabs from './tabs/trucker-bottom';

// Import Trucker screens
import LoadDetailScreen from '../app/layouts/Trucker/LoadDetail/index';
import ActiveTripScreen from '../app/layouts/Trucker/ActiveTrip/index';
import AddTruckScreen from '../app/layouts/Trucker/AddTruck/index';
import DocumentRenewalScreen from '../app/layouts/Trucker/DocumentRenewal/index';
import EarningsScreen from '../app/layouts/Trucker/Earnings/index';
import InvoiceDetailScreen from '../app/layouts/Trucker/InvoiceDetail/index';
import MyLoadsScreen from '../app/layouts/Trucker/MyLoads/index';
import NotificationsScreen from '../app/layouts/Trucker/Notifications/index';
import PaidHistoryScreen from '../app/layouts/Trucker/PaidHistory/index';
import PendingPaymentsScreen from '../app/layouts/Trucker/PendingPayments/index';
import PersonalRoutesScreen from '../app/layouts/Trucker/PersonalRoutes/index';
import VehicleManagementScreen from '../app/layouts/Trucker/VehicleManagement/index';
import VehicleDetailsScreen from '../app/layouts/Trucker/VehicleManagement/VehicleDetails';
import TruckerProfileScreen from '../app/layouts/Trucker/Profile/index';

// Import Trucker Auth screens (Profile Completion Flow)
import TruckerSignupScreen from '../app/layouts/Trucker/Trucker_auth/TruckerSignup/index';
import VehicleInfoScreen from '../app/layouts/Trucker/Trucker_auth/VehicleInfo/index';
import TruckerDocumentUploadScreen from '../app/layouts/Trucker/Trucker_auth/DocumentUpload/index';
import VerificationStatusScreen from '../app/layouts/Trucker/Trucker_auth/VerificationStatus/index';

// Trucker-specific screen names (independent namespace)
export const TRUCKER_STACKS = {
    TRUCKER_TABS: 'truckerTabs',
    LOAD_DETAIL: 'truckerLoadDetail',
    ACTIVE_TRIP: 'truckerActiveTrip',
    ADD_TRUCK: 'truckerAddTruck',
    DOCUMENT_RENEWAL: 'truckerDocumentRenewal',
    EARNINGS: 'truckerEarningsDetail',
    INVOICE_DETAIL: 'truckerInvoiceDetail',
    MY_LOADS: 'truckerMyLoadsDetail',
    NOTIFICATIONS: 'truckerNotifications',
    PAID_HISTORY: 'truckerPaidHistory',
    PENDING_PAYMENTS: 'truckerPendingPayments',
    PERSONAL_ROUTES: 'truckerPersonalRoutes',
    VEHICLE_MANAGEMENT: 'truckerVehicleManagement',
    VEHICLE_DETAILS: 'truckerVehicleDetails',
    PROFILE: 'truckerProfileDetail',
    // Profile Completion Flow
    PROFILE_SIGNUP: 'truckerProfileSignup',
    PROFILE_VEHICLE_INFO: 'truckerProfileVehicleInfo',
    PROFILE_DOCUMENT_UPLOAD: 'truckerProfileDocumentUpload',
    PROFILE_VERIFICATION_STATUS: 'truckerProfileVerificationStatus',
} as const;

const Stack = createNativeStackNavigator();

/**
 * Wrapper components for screens that require navigation-based props.
 * These screens were designed with explicit onBack/onNavigate props,
 * so we wire them up to the React Navigation goBack/navigate.
 */
const AddTruckWrapper = () => {
    const navigation = useNavigation();
    return (
        <AddTruckScreen
            onBack={() => navigation.goBack()}
            onSaveSuccess={() => navigation.goBack()}
        />
    );
};

const LoadDetailWrapper = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const loadData = route.params?.loadData;
    return <LoadDetailScreen onBack={() => navigation.goBack()} loadData={loadData} />;
};

const ActiveTripWrapper = () => {
    const navigation = useNavigation();
    return (
        <ActiveTripScreen
            onBack={() => navigation.goBack()}
            onComplete={() => navigation.goBack()}
        />
    );
};

const VehicleManagementWrapper = () => {
    const navigation = useNavigation();
    return (
        <VehicleManagementScreen
            onBack={() => navigation.goBack()}
        />
    );
};

const VehicleDetailsWrapper = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    return (
        <VehicleDetailsScreen
            route={route}
            navigation={navigation}
            onBack={() => navigation.goBack()}
        />
    );
};

const EarningsWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <EarningsScreen
            onBack={() => navigation.goBack()}
            onTransactionPress={(id: string) =>
                navigation.navigate(TRUCKER_STACKS.INVOICE_DETAIL, { invoiceId: id })
            }
        />
    );
};

const MyLoadsWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <MyLoadsScreen
            onBack={() => navigation.goBack()}
            onLoadPress={(loadId: string, loadData?: any) =>
                navigation.navigate(TRUCKER_STACKS.LOAD_DETAIL, { loadId, loadData })
            }
        />
    );
};

const NotificationsWrapper = () => {
    const navigation = useNavigation();
    return (
        <NotificationsScreen
            onBack={() => navigation.goBack()}
        />
    );
};

const PaidHistoryWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <PaidHistoryScreen
            onBack={() => navigation.goBack()}
            onInvoicePress={(id: string) =>
                navigation.navigate(TRUCKER_STACKS.INVOICE_DETAIL, { invoiceId: id })
            }
        />
    );
};

const PendingPaymentsWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <PendingPaymentsScreen
            onBack={() => navigation.goBack()}
            onPaymentPress={(id: string) =>
                navigation.navigate(TRUCKER_STACKS.INVOICE_DETAIL, { invoiceId: id })
            }
        />
    );
};

const PersonalRoutesWrapper = () => {
    const navigation = useNavigation();
    return (
        <PersonalRoutesScreen
            onBack={() => navigation.goBack()}
        />
    );
};

const DocumentRenewalWrapper = () => {
    const navigation = useNavigation();
    return (
        <DocumentRenewalScreen
            onBack={() => navigation.goBack()}
        />
    );
};

const InvoiceDetailWrapper = () => {
    const navigation = useNavigation();
    return (
        <InvoiceDetailScreen
            onBack={() => navigation.goBack()}
        />
    );
};

const ProfileWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <TruckerProfileScreen
            onBack={() => navigation.goBack()}
            onNavigate={(screen: string) => {
                // Map profile sub-navigations to trucker stacks
                const screenMap: Record<string, string> = {
                    'vehicleManagement': TRUCKER_STACKS.VEHICLE_MANAGEMENT,
                    'documentRenewal': TRUCKER_STACKS.DOCUMENT_RENEWAL,
                    'personalRoutes': TRUCKER_STACKS.PERSONAL_ROUTES,
                    'earnings': TRUCKER_STACKS.EARNINGS,
                    'notifications': TRUCKER_STACKS.NOTIFICATIONS,
                    'paidHistory': TRUCKER_STACKS.PAID_HISTORY,
                    'pendingPayments': TRUCKER_STACKS.PENDING_PAYMENTS,
                    'profileCompletion': TRUCKER_STACKS.PROFILE_SIGNUP,
                };
                const targetScreen = screenMap[screen];
                if (targetScreen) {
                    navigation.navigate(targetScreen);
                }
            }}
        />
    );
};

// --- Profile Completion Flow Wrappers ---
const ProfileSignupWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <TruckerSignupScreen
            onBack={() => navigation.goBack()}
            onNext={() => navigation.navigate(TRUCKER_STACKS.PROFILE_VEHICLE_INFO)}
        />
    );
};

const ProfileVehicleInfoWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <VehicleInfoScreen
            onBack={() => navigation.goBack()}
            onComplete={() => navigation.navigate(TRUCKER_STACKS.PROFILE_DOCUMENT_UPLOAD)}
        />
    );
};

const ProfileDocumentUploadWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <TruckerDocumentUploadScreen
            onBack={() => navigation.goBack()}
            onComplete={() => navigation.navigate(TRUCKER_STACKS.PROFILE_VERIFICATION_STATUS)}
        />
    );
};

const ProfileVerificationStatusWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <VerificationStatusScreen
            status="pending"
            onContinue={() => {
                // Navigate back to the profile (pop the entire completion flow)
                navigation.navigate(TRUCKER_STACKS.PROFILE);
            }}
            onRetry={() => navigation.goBack()}
        />
    );
};

export default function TruckerMain() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {/* Bottom Tabs as root screen */}
            <Stack.Screen
                name={TRUCKER_STACKS.TRUCKER_TABS}
                component={TruckerBottomTabs}
            />

            {/* Detail / Push Screens */}
            <Stack.Screen
                name={TRUCKER_STACKS.LOAD_DETAIL}
                component={LoadDetailWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.ACTIVE_TRIP}
                component={ActiveTripWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.ADD_TRUCK}
                component={AddTruckWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.DOCUMENT_RENEWAL}
                component={DocumentRenewalWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.EARNINGS}
                component={EarningsWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.INVOICE_DETAIL}
                component={InvoiceDetailWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.MY_LOADS}
                component={MyLoadsWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.NOTIFICATIONS}
                component={NotificationsWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PAID_HISTORY}
                component={PaidHistoryWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PENDING_PAYMENTS}
                component={PendingPaymentsWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PERSONAL_ROUTES}
                component={PersonalRoutesWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.VEHICLE_MANAGEMENT}
                component={VehicleManagementWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.VEHICLE_DETAILS}
                component={VehicleDetailsWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE}
                component={ProfileWrapper}
            />

            {/* Profile Completion Flow */}
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_SIGNUP}
                component={ProfileSignupWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_VEHICLE_INFO}
                component={ProfileVehicleInfoWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_DOCUMENT_UPLOAD}
                component={ProfileDocumentUploadWrapper}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_VERIFICATION_STATUS}
                component={ProfileVerificationStatusWrapper}
            />
        </Stack.Navigator>
    );
}
