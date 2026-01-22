import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import Bottom from './tabs/bottom';
import { AddDriver, AddJob, AddLoad, AppliedJob, AvailableJob, ContactUs, Dashboard, DriverDrivingDetailsByTransporter, DriverList, DriverProfileEditByTransporter, DriverUploadDocumentsByTransporter, DrivingDetails, DrivingDetailsTransporter, ExcelImport, HealthHygiene, JobStep2, JobStep3, LanguageMain, LocationSearch, LocationMap, Modules, Notification, PaymentSuccess, Player, PreferredColor, Privacy, ProfileEdit, ProfileEditNew, ProfileEditTransporter, Quiz, QuizResult, Rating, Search, Settings, SuitsJob, TransporterAppliedJob, TransporterVerificationScreen, UploadDocuments, UploadDocumentsTransporter, ViewJobs, DLVerification, DriverKiAwazInfo, CallJobManagerList, CallJobManagerInfo, ChallanCheckInfo, ChallanCheckResult, CourtCheckInfo, DigitalAddressCheckInfo, DriverInvites, RcCheckInfo, IdCheckInfo, Convoy, Training } from '@truckmitr/layouts/index';
import { setupFirebaseNotifications, initializeNotificationChannel } from '@truckmitr/src/utils/notification';
import { DocumentUploadScreen, JobSummary, VerificationStatusScreen, } from '../app/layouts/main';
import EditJob from '../app/layouts/main/edit-job';
import ProfileOverview from '../app/layouts/main/profile-overview';
// import DriverInvites from '@truckmitr/src/app/layouts/main/driver-invites/driver-invites';
import InviteDriver from '@truckmitr/src/app/layouts/main/all-driver-list/all-drivers-invitation-tab';
import { Referral } from '../app/layouts/main/home/referral-driver';
import TransporterConsent from '../app/layouts/main/add-job/transporter-consent';
import DriverConsent from '../app/layouts/main/add-job/driver-consent';
import SubscriptionConsent from '../app/layouts/main/subscription/subscription-consent';
import VerificationDriversByTransporter from '../app/layouts/main/transporter-verification/verification-driver';
import Verification from '../app/layouts/main/verification/verification-screen';
import DriverDocumentUploadScreen from '../app/layouts/main/transporter-verification/drivers-document-upload-screen';
import PaymentHistoryScreen from '../app/layouts/main/transporter-verification/payment-history-screen';
import MembershipCard from '../app/layouts/main/membership-card';
// import { ZegoUIKitPrebuiltCallInCallScreen, ZegoUIKitPrebuiltCallWaitingScreen } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { useSelector } from 'react-redux';
// import { initializeZeegoService } from '../utils/zegoService';
import DriverTripWallet from '../app/layouts/main/driver-trip-wallet';
import DriverWelfare from '../app/layouts/main/driver-welfare';
import DriverLoan from '../app/layouts/main/driver-loan';
import JobInvitationsList from '../app/layouts/main/job-invitations-list';
import RcCheckResult from '../app/layouts/main/rc-check-result';
import ScheduledInterview from '../app/layouts/main/scheduled-interview';
import TruckMitrDhaba from '../app/layouts/main/truckmitr-dhaba';
import TruckMitrSuvidhaKendra from '../app/layouts/main/truckmitr-suvidha-kendra';
import VideoInterviewInfo from '../app/layouts/main/video-interview-info';
import TMLoadMandal from '../app/layouts/main/tm-load-mandal';
import TransporterLoan from '../app/layouts/main/transporter-loan';
import SecondHandTruckMarketplace from '../app/layouts/main/second-hand-truck-marketplace';
import FleetManagementSolution from '../app/layouts/main/fleet-management-solution';
import FuelDiscount from '../app/layouts/main/fuel-discount';
import TruckInsurance from '../app/layouts/main/truck-insurance';
import AddSingleDriverInfo from '../app/layouts/main/add-single-driver-info';
import PurchaseInvoices from '../app/layouts/main/purchase-invoices';
import { AppState } from 'react-native';

const Stack = createNativeStackNavigator();

export default function Main() {
  const hasSetupNotifications = React.useRef(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const hasInitZego = React.useRef(false);
  const { user, isAuthenticated } = useSelector((state: any) => state.user);

  console.log('user------------', user);
  console.log('isAuthenticated------------', isAuthenticated);



  // Mark component as mounted after a delay
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 1000); // Wait 1 second before considering component fully mounted

    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    // Only setup notifications after component is fully mounted
    if (!isMounted) {
      console.log('Main stack not fully mounted yet, waiting...');
      return;
    }

    // Prevent duplicate notification setup on component remount
    if (hasSetupNotifications.current) {
      console.log('Notifications already initialized, skipping...');
      return;
    }

    const initializeNotifications = async () => {
      try {
        console.log('Initializing notifications for authenticated user...');
        await initializeNotificationChannel();

        // Additional delay before requesting permission to avoid activity restart issues
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));

        const token = await setupFirebaseNotifications();
        if (token) {
          console.log('Firebase notifications initialized successfully with token:', token);
          hasSetupNotifications.current = true;
        }
      } catch (error) {
        console.error('Error initializing Firebase notifications:', error);
        // Don't mark as initialized if there was an error, allow retry
      }
    };

    // Longer delay to ensure app is fully stable before requesting permissions
    const timeoutId = setTimeout(() => {
      initializeNotifications();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [isMounted]);

  // useEffect(() => {
  //   if (!isAuthenticated || !user?.unique_id) return;

  //   if (hasInitZego.current) {
  //     return;
  //   }

  //   const initZego = async () => {
  //     try {
  //       console.log('🚀 Initializing Zego Call Service for:', user.unique_id);
  //       await initializeZeegoService({
  //         userID: user.unique_id,
  //         userName: user.name ?? 'User',
  //       });

  //       hasInitZego.current = true;
  //     } catch (e) {
  //       console.error('❌ Zego init error:', e);
  //     }
  //   };

  //   initZego();
  // }, [isAuthenticated, user?.unique_id]);


  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={STACKS.BOTTOM_TAB} component={Bottom} options={{}} />
      <Stack.Screen name={STACKS.DASHBOARD} component={Dashboard} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.MODULES} component={Modules} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name={STACKS.QUIZ} component={Quiz} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.QUIZ_RESULT} component={QuizResult} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PLAYER} component={Player} options={{ animation: 'fade', }} />
      <Stack.Screen name={STACKS.AVAILABLE_JOB} component={AvailableJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SUITS_JOB} component={SuitsJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.APPLIED_JOB} component={AppliedJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SEARCH} component={Search} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PROFILE_EDIT} component={ProfileEdit} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PROFILE_EDIT_NEW} component={ProfileEditNew} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVING_DETAILS} component={DrivingDetails} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.UPLOAD_DOCUMENTS} component={UploadDocuments} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SETTINGS} component={Settings} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.NOTIFICATION} component={Notification} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.RATING} component={Rating} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CONTACT_US} component={ContactUs} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRANSPORTER_CONSENT} component={TransporterConsent} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_CONSENT} component={DriverConsent} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SUBSCRIPTION_CONSENT} component={SubscriptionConsent} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.ADD_JOB} component={AddJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.JOB_STEP2} component={JobStep2} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.JOB_STEP3} component={JobStep3} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.VIEW_JOBS} component={ViewJobs} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PURCHASE_INVOICES} component={PurchaseInvoices} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRANSPORTER_APPLIED_JOB} component={TransporterAppliedJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.ADD_DRIVER} component={AddDriver} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_LIST} component={DriverList} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.PROFILE_EDIT_TRANSPORTER} component={ProfileEdit} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVING_DETAILS_TRANSPORTER} component={DrivingDetailsTransporter} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.UPLOAD_DOCUMENTS_TRANSPORTER} component={UploadDocumentsTransporter} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.DRIVER_PROFILE_EDIT_BY_TRANSPORTER} component={DriverProfileEditByTransporter} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_DRIVING_DETAILS_BY_TRANSPORTER} component={DriverDrivingDetailsByTransporter} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_UPLOAD_DOCUMENTS_BY_TRANSPORTER} component={DriverUploadDocumentsByTransporter} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.LANGUAGE_MAIN} component={LanguageMain} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PREFERRED_COLOR} component={PreferredColor} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.PAYMENT_SUCCESS} component={PaymentSuccess} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.DL_VERIFICATION} component={DLVerification} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.EXCEL_IMPORT} component={ExcelImport} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.ADD_LOAD} component={AddLoad} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.LOCATION_SEARCH} component={LocationSearch} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name={STACKS.MAP_VIEW} component={LocationMap} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DOCUMENTUPLOAD} component={DocumentUploadScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.VERIFICATIONSTATUS} component={VerificationStatusScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.VERIFICATIONDRIVERSBYTRANSPORTER} component={VerificationDriversByTransporter} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRANSPORTER_VERIFICATION} component={TransporterVerificationScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVERINVITES} component={DriverInvites} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.ALLDRIVER_LIST_WITH_TABS} component={InviteDriver} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.VERIFICATION} component={Verification} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.REFERRAL} component={Referral} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.VERIFIED_DRIVERS_DOCUMENTS_UPLOAD} component={DriverDocumentUploadScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PAYMENT_HISTORY_SCREEN} component={PaymentHistoryScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.MEMBERSHIP_CARD} component={MembershipCard} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name={STACKS.DRIVER_KI_AWAZ_INFO} component={DriverKiAwazInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CALL_JOB_MANAGER_LIST} component={CallJobManagerList} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CALL_JOB_MANAGER_INFO} component={CallJobManagerInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CHALLAN_CHECK_INFO} component={ChallanCheckInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CHALLAN_CHECK_RESULT} component={ChallanCheckResult} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.COURT_CHECK_INFO} component={CourtCheckInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DIGITAL_ADDRESS_CHECK_INFO} component={DigitalAddressCheckInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.RC_CHECK_INFO} component={RcCheckInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.ID_CHECK_INFO} component={IdCheckInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.RC_CHECK_RESULT} component={RcCheckResult} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.VIDEO_INTERVIEW_INFO} component={VideoInterviewInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SCHEDULED_INTERVIEWS} component={ScheduledInterview} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.JOB_INVITATIONS_LIST} component={JobInvitationsList} options={{ animation: 'fade' }} />

      <Stack.Screen name={STACKS.DRIVER_TRIP_WALLET} component={DriverTripWallet} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_WELFARE} component={DriverWelfare} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.DRIVER_LOAN} component={DriverLoan} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRUCKMITR_DHABA} component={TruckMitrDhaba} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRUCKMITR_SUVIDHA_KENDRA} component={TruckMitrSuvidhaKendra} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TM_LOAD_MANDAL} component={TMLoadMandal} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRANSPORTER_LOAN} component={TransporterLoan} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.SECOND_HAND_TRUCK_MARKETPLACE} component={SecondHandTruckMarketplace} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.FLEET_MANAGEMENT_SOLUTION} component={FleetManagementSolution} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.FUEL_DISCOUNT} component={FuelDiscount} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRUCK_INSURANCE} component={TruckInsurance} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.HEALTH_HYGIENE} component={HealthHygiene} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.CONVOY} component={Convoy} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.TRAINING} component={Training} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.ADD_SINGLE_DRIVER_INFO} component={AddSingleDriverInfo} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.JOB_SUMMARY} component={JobSummary} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.EDIT_JOB} component={EditJob} options={{ animation: 'fade' }} />
      <Stack.Screen name={STACKS.PROFILE_OVERVIEW} component={ProfileOverview} options={{ animation: 'fade' }} />

      {/* DriverInvites usually mapped to STACKS.DRIVERINVITES, but checking stacks definition: invites */}
      {/* already there at line 165 as invites? No line 165 is DriverInvites component from local import. */}
      {/* I will remove the specific DriverInvites import if I am importing from layouts index now, to avoid duplication or confusion, but keep using it if it works. NO, I should use the one from layouts/index for consistency. */}
      {/* <Stack.Screen
        options={{ headerShown: false }}
        // DO NOT change the name 
        name="ZegoUIKitPrebuiltCallWaitingScreen"
        component={ZegoUIKitPrebuiltCallWaitingScreen}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        // DO NOT change the name
        name="ZegoUIKitPrebuiltCallInCallScreen"
        component={ZegoUIKitPrebuiltCallInCallScreen}
      /> */}
    </Stack.Navigator>
  )
}
