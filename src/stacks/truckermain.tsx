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
import AddDriver from '../app/layouts/main/add-driver/index';
import TruckerBankDetails from '../app/layouts/Trucker/BankDetails/index';
import DriverList from '../app/layouts/main/driver-list/index';

// Import shared screens (reused from transporter)
import ProfileOverview from '../app/layouts/main/profile-overview';
import ProfileEditNew from '../app/layouts/main/profile-edit-new';
import { TRUCKER_STACKS } from './stacks';

// Import Trucker Auth screens (Profile Completion Flow)


// Trucker-specific screen names (independent namespace)

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
    const route = useRoute<any>();
    return (
        <ActiveTripScreen
            loadId={route.params?.loadId || route.params?.tripId}
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
        <TruckerProfileScreen />
    );
};

// --- Profile Completion Flow Wrappers ---
// const ProfileSignupWrapper = () => {
//     const navigation = useNavigation<any>();
//     return (
//         <TruckerSignupScreen
//             onBack={() => navigation.goBack()}
//             onNext={() => navigation.navigate(TRUCKER_STACKS.PROFILE_VEHICLE_INFO)}
//         />
//     );
// };

// const ProfileVehicleInfoWrapper = () => {
//     const navigation = useNavigation<any>();
//     return (
//         <VehicleInfoScreen
//             onBack={() => navigation.goBack()}
//             onComplete={() => navigation.navigate(TRUCKER_STACKS.PROFILE_DOCUMENT_UPLOAD)}
//         />
//     );
// };

// const ProfileDocumentUploadWrapper = () => {
//     const navigation = useNavigation<any>();
//     return (
//         <TruckerDocumentUploadScreen
//             onBack={() => navigation.goBack()}
//             onComplete={() => navigation.navigate(TRUCKER_STACKS.PROFILE_VERIFICATION_STATUS)}
//         />
//     );
// };

// const ProfileVerificationStatusWrapper = () => {
//     const navigation = useNavigation<any>();
//     return (
//         <VerificationStatusScreen
//             status="pending"
//             onContinue={() => {
//                 // Navigate back to the profile (pop the entire completion flow)
//                 navigation.navigate(TRUCKER_STACKS.PROFILE);
//             }}
//             onRetry={() => navigation.goBack()}
//         />
//     );
// };

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
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_OVERVIEW}
                component={ProfileOverview}
                options={{ animation: 'fade' }}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_EDIT_NEW}
                component={ProfileEditNew}
                options={{ animation: 'fade' }}
            />
            {/* Map legacy edit routes to new edit screen for compatibility with ProfileOverview */}
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_EDIT}
                component={ProfileEditNew}
                options={{ animation: 'fade' }}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.PROFILE_EDIT_TRANSPORTER}
                component={ProfileEditNew}
                options={{ animation: 'fade' }}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.ADD_DRIVER}
                component={AddDriver}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.BANK_DETAILS}
                component={TruckerBankDetails}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name={TRUCKER_STACKS.DRIVER_LIST}
                component={DriverList}
                options={{ animation: 'slide_from_right' }}
            />

            {/* Profile Completion Flow */}
            {/* <Stack.Screen
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
            /> */}
        </Stack.Navigator>
    );
}
