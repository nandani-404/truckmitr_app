
export type NavigatorParams = {
    welcome: undefined;
    introVideo: undefined
    login: undefined;
    otp: undefined
    approval: undefined
    language: undefined
    languageMain: undefined
    preferredColor: undefined
    paymentSuccess: any
    signup: { preSelectedRole?: string } | undefined
    consentModalScreen: undefined
    moduleSelection: undefined
    congratulations: any
    profileCompletion: undefined
    phone: undefined;
    countries: undefined;
    name: undefined
    gender: any;
    birthday: any
    dashboard: undefined
    training: undefined
    job: undefined
    healthHygiene: undefined
    profile: undefined
    modules: undefined
    quiz: any
    quizResult: undefined
    player: any
    availableJob: any
    suitsJob: undefined
    appliedJob: undefined
    search: undefined
    profileEdit: undefined
    profileEditNew: { stepId?: string }
    drivingDetails: any
    uploadDocuments: any
    settings: undefined
    notification: undefined
    rating: undefined
    contactUs: undefined
    privacy: undefined
    terms: undefined
    transporterConsent: undefined,
    driverConsent: undefined,

    verification: undefined
    paymentScreen: undefined
    doucmentUploadScreen: undefined
    verificationStatusScreen: undefined
    subscriptionConsent: undefined
    dlVerification: any

    addJob: undefined
    jobStep2: undefined
    jobStep3: undefined
    viewJobs: undefined
    purchaseInvoices: undefined
    addDriver: undefined
    excelImport: undefined
    transporterAppliedJob: undefined
    driverList: undefined

    profileEditTransporter: undefined
    drivingDetailsTransporter: any
    uploadDocumentsTransporter: any

    driverProfileEditByTransporter: any
    driverDrivingDetailsByTransporter: any
    driverUploadDocumentsByTransporter: any

    addLoad: any
    locationSearch: any
    mapView: any

    stream: undefined
    chat: undefined
    join: any;
    shorts: undefined
    account: undefined
    discover: undefined
    friends: undefined
    nearby: undefined
    bottomTab: any
    main: undefined
    all: any
    moment: any
    play: any
    Exclusive: any

    // MODALS
    genderModal: any
    loadingModal: any
    VerificationDriversByTransporter: undefined
    invites: undefined
    "All Drivers": { job_id?: any; initialTab?: 'all' | 'myInvites' } | undefined
    Verification: undefined
    referral: undefined
    membershipCard: undefined
    idCheckInfo: undefined
    courtCheckInfo: undefined
    digitalAddressCheckInfo: undefined
    videoInterviewInfo: undefined
    scheduledInterviews: undefined
    transporterInvitationInfo: undefined
    jobInvitationsList: undefined
    callJobManagerInfo: undefined
    callJobManagerList: undefined
    rcCheckInfo: undefined
    rcCheckResult: { rcNumber: string }
    challanCheckInfo: undefined
    challanCheckResult: undefined
    driverKiAwazInfo: undefined
    driverTripWallet: undefined
    driverWelfare: undefined
    driverLoan: undefined
    truckMitrDhaba: undefined
    truckMitrSuvidhaKendra: undefined
    tmLoadMandal: undefined
    transporterLoan: undefined
    secondHandTruckMarketplace: undefined
    fleetManagementSolution: undefined
    fuelDiscount: undefined
    truckInsurance: undefined
    convoy: undefined
    paymentHistoryScreen: undefined
    verifyDriversDocumentUploadByTransporter: undefined
    addSingleDriverInfo: undefined
    jobSummary: undefined
    editJob: { stepId: string } | undefined
    profileOverview: undefined
    foremanPendingProfiles: undefined
    foremanPendingSubscription: undefined
    foremanPendingTraining: undefined
    foremanExpiringDocuments: undefined
    foremanVerifiedDrivers: undefined
    foremanTrustedDrivers: undefined
    foremanJobsList: undefined
    foremanDriverDetails: { driver: any }
    foremanApplications: undefined
    foremanRecruitments: undefined
    foremanBottomTab: any;
    foremanHome: undefined;
    foremanAddDriver: undefined;
    foremanMyPilots: undefined;
    foremanMyEarnings: undefined;
    foremanProfile: undefined;
    foremanProfileCompletion: { stepId?: string | number } | undefined;
    foremanProfileEdit: { stepId: string | number };
    foremanDriverKiAwaz: undefined;
    foremanBankDetails: undefined;
    foremanSearch: undefined;
    foremanEarningsInfo: undefined;
    foremanMembershipCard: undefined;

    // Association Tabs
    driverAssociationHome: undefined;
    driverAssociationAddDriver: undefined;
    driverAssociationEarnings: undefined;
    driverAssociationProfile: undefined;
    driverAssociationSearch: undefined;
    associationBankDetails: undefined;
    associationProfileEdit: undefined;
    driverAssociationEarningsInfo: undefined;

    // Dhaba Module
    dhabhaBottomTab: any;
    dhabhaHome: undefined;
    dhabhaProfile: undefined;
    dhabhaProfileCompletion: undefined;
    dhabhaMyReferrals: undefined;
    dhabhaEarnings: undefined;
    dhabhaAddDriver: undefined;
    dhabhaBankDetails: undefined;
    dhabhaMyDhabha: { initialTab?: string } | undefined;
    dhabhaMyDrivers: undefined;
    dhabhaNearby: undefined;
    dhabhaDriverSearch: undefined;
    dhabhaProfileEdit: undefined;
    dhabhaDriverKiAwaz: undefined;

    // Puncture Module
    punctureBottomTab: any;
    punctureHome: undefined;
    punctureProfile: undefined;
    punctureProfileCompletion: undefined;
    punctureMyReferrals: undefined;
    punctureWallet: undefined;
    punctureAddDriver: undefined;
    punctureBankDetails: undefined;
    punctureMyShop: { initialTab?: string } | undefined;
    punctureMyDrivers: undefined;
    punctureNearby: undefined;
    punctureDriverSearch: undefined;
    punctureProfileEdit: undefined;
    punctureDriverKiAwaz: undefined;

    // Shipper Module
    shipperBottomTab: any;
    shipperHome: undefined;
    shipperMyLoads: undefined;
    shipperPostLoad: undefined;
    shipperChat: undefined;
    shipperTrack: undefined;
    shipperProfile: undefined;
    shipperProfileCompletion: undefined;
    shipperProfileEdit: undefined;

    // Transporter Added Driver Module
    transporterDriverTracking: { jobId?: any; driverId?: string; loadId?: string } | undefined;

    shipperActiveLoads: undefined;
    shipperAcceptedLoads: undefined;
    shipperPodPending: undefined;
    shipperInProgressLoads: undefined;
    shipperTrackDetail: { load?: any } | undefined;
    shipperNotifications: undefined;
    shipperEditLoad: { editData: any };
};

export const STACKS = {
    NAMASTE: 'namaste',
    INTRO_VIDEO: `introVideo`,
    WELCOME: 'welcome',
    LOGIN: 'login',
    OTP: 'otp',
    APPROVAL: 'approval',
    LANGUAGE: 'language',
    LANGUAGE_MAIN: 'languageMain',
    PREFERRED_COLOR: 'preferredColor',
    PAYMENT_SUCCESS: 'paymentSuccess',
    SIGNUP: 'signup',
    CONSENT_MODAL_SCREEN: 'consentModalScreen',
    MODULE_SELECTION: 'moduleSelection',
    CONGRATULATIONS: 'congratulations',
    PROFILE_COMPLETION: 'profileCompletion',
    PHONE: 'phone',
    COUNTRIES: 'countries',
    NAME: 'name',
    GENDER: 'gender',
    BIRTHDAY: 'birthday',
    HOME: 'home',
    DASHBOARD: 'dashboard',
    TRAINING: 'training',
    JOB: 'job',
    HEALTH_HYGIENE: 'healthHygiene',
    PROFILE: 'profile',
    MODULES: 'modules',
    QUIZ: 'quiz',
    QUIZ_RESULT: 'quizResult',
    PLAYER: 'player',
    AVAILABLE_JOB: 'availableJob',
    SUITS_JOB: 'suitsJob',
    APPLIED_JOB: 'appliedJob',
    SEARCH: 'search',
    PROFILE_EDIT: 'profileEdit',
    PROFILE_EDIT_NEW: 'profileEditNew',
    DRIVING_DETAILS: 'drivingDetails',
    UPLOAD_DOCUMENTS: 'uploadDocuments',
    SETTINGS: 'settings',
    NOTIFICATION: 'notification',
    RATING: 'rating',
    CONTACT_US: 'contactUs',
    PRIVACY: 'privacy',
    TERMS: 'terms',
    TRANSPORTER_CONSENT: 'transporterConsent',
    DRIVER_CONSENT: 'driverConsent',
    SUBSCRIPTION_CONSENT: 'subscriptionConsent',
    DL_VERIFICATION: 'dlVerification',
    MEMBERSHIP_CARD: 'membershipCard',
    VERIFICATION: 'verification',
    DOCUMENTUPLOAD: 'doucmentUploadScreen',
    VERIFICATIONSTATUS: 'verificationStatusScreen',
    DRIVERINVITES: 'invites',

    ADD_JOB: 'addJob',
    JOB_STEP2: 'jobStep2',
    JOB_STEP3: 'jobStep3',
    VIEW_JOBS: 'viewJobs',
    PURCHASE_INVOICES: 'purchaseInvoices',
    TRANSPORTER_APPLIED_JOB: 'transporterAppliedJob',
    ADD_DRIVER: 'addDriver',
    EXCEL_IMPORT: 'excelImport',
    DRIVER_LIST: 'driverList',
    VERIFICATIONDRIVER: 'Verification Driver',
    ALLDRIVERLIST: 'All Drivers List',
    ALLDRIVER_LIST_WITH_TABS: 'All Drivers',

    PROFILE_EDIT_TRANSPORTER: 'profileEditTransporter',
    DRIVING_DETAILS_TRANSPORTER: 'drivingDetailsTransporter',
    UPLOAD_DOCUMENTS_TRANSPORTER: 'uploadDocumentsTransporter',

    DRIVER_PROFILE_EDIT_BY_TRANSPORTER: 'driverProfileEditByTransporter',
    DRIVER_DRIVING_DETAILS_BY_TRANSPORTER: 'driverDrivingDetailsByTransporter',
    DRIVER_UPLOAD_DOCUMENTS_BY_TRANSPORTER: 'driverUploadDocumentsByTransporter',
    VERIFIED_DRIVERS_DOCUMENTS_UPLOAD: 'verifyDriversDocumentUploadByTransporter',
    PAYMENT_HISTORY_SCREEN: 'paymentHistoryScreen',

    TRANSPORTER_VERIFICATION: 'Verification',
    TRANSPORTER_VERIFICATION_STATUS: 'transporterVerificationStatus',
    VERIFICATIONDRIVERSBYTRANSPORTER: 'VerificationDriversByTransporter',

    REFERRAL: 'referral',

    ADD_LOAD: `addLoad`,
    LOCATION_SEARCH: `locationSearch`,
    MAP_VIEW: `mapView`,

    LIVE: 'live',
    STREAM: 'stream',
    CHAT: 'chat',

    JOIN: 'join',
    SHORTS: 'shorts',
    ACCOUNT: 'account',
    DISCOVER: 'discover',
    FRIENDS: 'friends',
    NEARBY: 'nearby',
    BOTTOM_TAB: 'bottomTab',
    MAIN: 'main',
    ALL: 'all',
    MOMENT: 'moment',
    PLAY: 'play',
    EXCLUSIVE: 'Exclusive',

    // MODALS
    GENDER_MODAL: 'genderModal',
    LOADING_MODAL: 'loadingModal',

    ID_CHECK_INFO: 'idCheckInfo',
    COURT_CHECK_INFO: 'courtCheckInfo',
    DIGITAL_ADDRESS_CHECK_INFO: 'digitalAddressCheckInfo',
    VIDEO_INTERVIEW_INFO: 'videoInterviewInfo',
    SCHEDULED_INTERVIEWS: 'scheduledInterviews',
    TRANSPORTER_INVITATION_INFO: 'transporterInvitationInfo',
    JOB_INVITATIONS_LIST: 'jobInvitationsList',
    CALL_JOB_MANAGER_INFO: 'callJobManagerInfo',
    CALL_JOB_MANAGER_LIST: 'callJobManagerList',
    RC_CHECK_INFO: 'rcCheckInfo',
    RC_CHECK_RESULT: 'rcCheckResult',
    CHALLAN_CHECK_INFO: 'challanCheckInfo',
    CHALLAN_CHECK_RESULT: 'challanCheckResult',
    DRIVER_KI_AWAZ_INFO: 'driverKiAwazInfo',
    DRIVER_TRIP_WALLET: 'driverTripWallet',
    DRIVER_WELFARE: 'driverWelfare',
    DRIVER_LOAN: 'driverLoan',
    TRUCKMITR_DHABA: 'truckMitrDhaba',
    TRUCKMITR_SUVIDHA_KENDRA: 'truckMitrSuvidhaKendra',
    TM_LOAD_MANDAL: 'tmLoadMandal',
    TRANSPORTER_LOAN: 'transporterLoan',
    SECOND_HAND_TRUCK_MARKETPLACE: 'secondHandTruckMarketplace',
    FLEET_MANAGEMENT_SOLUTION: 'fleetManagementSolution',
    FUEL_DISCOUNT: 'fuelDiscount',
    TRUCK_INSURANCE: 'truckInsurance',
    CONVOY: 'convoy',
    ADD_SINGLE_DRIVER_INFO: 'addSingleDriverInfo',
    JOB_SUMMARY: 'jobSummary',
    EDIT_JOB: 'editJob',
    PROFILE_OVERVIEW: 'profileOverview',

    // DRIVER KI AWAZ
    DRIVER_KI_AWAZ_POST_STATUS: 'driverKiAwazPostStatus',
    DRIVER_KI_AWAZ_RECORD_VOICE: 'driverKiAwazRecordVoice',
    DRIVER_KI_AWAZ_CREATE_POST: 'driverKiAwazCreatePost',
    DRIVER_KI_AWAZ_PROFILE_FEED: 'driverKiAwazProfileFeed',
    DRIVER_KI_AWAZ_MY_POSTS: 'driverKiAwazMyPosts',

    // FOREMAN MODULE
    FOREMAN_BOTTOM_TAB: 'foremanBottomTab',
    FOREMAN_HOME: 'foremanHome',
    FOREMAN_ADD_DRIVER: 'foremanAddDriver',
    FOREMAN_DRIVER_KI_AWAZ: 'foremanDriverKiAwaz',
    FOREMAN_MY_EARNINGS: 'foremanMyEarnings',
    FOREMAN_PROFILE: 'foremanProfile',
    FOREMAN_PROFILE_COMPLETION: 'foremanProfileCompletion',
    FOREMAN_PROFILE_EDIT: 'foremanProfileEdit',
    FOREMAN_DASHBOARD: 'foremanDashboard',
    FOREMAN_MY_PILOTS: 'foremanMyPilots',
    FOREMAN_PENDING_PROFILES: 'foremanPendingProfiles',
    FOREMAN_PENDING_SUBSCRIPTION: 'foremanPendingSubscription',
    FOREMAN_PENDING_TRAINING: 'foremanPendingTraining',
    FOREMAN_EXPIRING_DOCUMENTS: 'foremanExpiringDocuments',
    FOREMAN_VERIFIED_DRIVERS: 'foremanVerifiedDrivers',
    FOREMAN_TRUSTED_DRIVERS: 'foremanTrustedDrivers',
    FOREMAN_JOBS_LIST: 'foremanJobsList',
    FOREMAN_DRIVER_DETAILS: 'foremanDriverDetails',
    FOREMAN_APPLICATIONS: 'foremanApplications',
    FOREMAN_RECRUITMENTS: 'foremanRecruitments',
    FOREMAN_BANK_DETAILS: 'foremanBankDetails',
    FOREMAN_SEARCH: 'foremanSearch',
    FOREMAN_EARNINGS_INFO: 'foremanEarningsInfo',
    FOREMAN_MEMBERSHIP_CARD: 'foremanMembershipCard',

    // ASSOCIATE MODULE
    ASSOCIATE_BOTTOM_TAB: 'associateBottomTab',
    ASSOCIATE_DASHBOARD: 'associateDashboard',
    ASSOCIATE_REFERRALS: 'associateReferrals',
    ASSOCIATE_EARNINGS: 'associateEarnings',
    ASSOCIATE_PROFILE: 'associateProfile',
    ASSOCIATE_PROFILE_COMPLETION: 'associateProfileCompletion',
    ASSOCIATE_PROFILE_EDIT: 'associateProfileEdit',
    DRIVER_ASSOCIATION_MY_DRIVERS: 'driverAssociationMyDrivers',
    DRIVER_ASSOCIATION_PENDING_PROFILES: 'driverAssociationPendingProfiles',
    DRIVER_ASSOCIATION_PENDING_SUBSCRIPTION: 'driverAssociationPendingSubscription',
    DRIVER_ASSOCIATION_PENDING_TRAINING: 'driverAssociationPendingTraining',
    DRIVER_ASSOCIATION_EXPIRING_DOCUMENTS: 'driverAssociationExpiringDocuments',
    DRIVER_ASSOCIATION_VERIFIED_DRIVERS: 'driverAssociationVerifiedDrivers',
    DRIVER_ASSOCIATION_TRUSTED_DRIVERS: 'driverAssociationTrustedDrivers',
    DRIVER_ASSOCIATION_JOBS_LIST: 'driverAssociationJobsList',
    DRIVER_ASSOCIATION_DRIVER_DETAILS: 'driverAssociationDriverDetails',
    DRIVER_ASSOCIATION_APPLICATIONS: 'driverAssociationApplications',
    DRIVER_ASSOCIATION_RECRUITMENTS: 'driverAssociationRecruitments',
    DRIVER_ASSOCIATION_BANK_DETAILS: 'driverAssociationBankDetails',
    DRIVER_ASSOCIATION_SEARCH: 'driverAssociationSearch',
    DRIVER_ASSOCIATION_EARNINGS_INFO: 'driverAssociationEarningsInfo',
    DRIVER_ASSOCIATION_MEMBERSHIP_CARD: 'driverAssociationMembershipCard',
    ASSOCIATION_BANK_DETAILS: 'associationBankDetails',
    ASSOCIATION_PROFILE_EDIT: 'associationProfileEdit',

    // Association Tabs
    DRIVER_ASSOCIATION_HOME_TAB: 'driverAssociationHome',
    DRIVER_ASSOCIATION_ADD_DRIVER: 'driverAssociationAddDriver',
    DRIVER_ASSOCIATION_EARNINGS: 'driverAssociationEarnings',
    DRIVER_ASSOCIATION_PROFILE: 'driverAssociationProfile',
    DRIVER_ASSOCIATION_DASHBOARD: 'driverAssociationDashboard',

    // DHABA MODULE
    DHABHA_BOTTOM: 'dhabhaBottomTab',
    DHABHA_HOME: 'dhabhaHome',
    DHABHA_PROFILE: 'dhabhaProfile',
    DHABHA_PROFILE_COMPLETION: 'dhabhaProfileCompletion',
    DHABHA_MY_REFERRALS: 'dhabhaMyReferrals',
    DHABHA_EARNINGS: 'dhabhaEarnings',
    DHABHA_ADD_DRIVER: 'dhabhaAddDriver',
    DHABHA_BANK_DETAILS: 'dhabhaBankDetails',
    DHABHA_MY_DHABHA: 'dhabhaMyDhabha',
    DHABHA_MY_DRIVERS: 'dhabhaMyDrivers',
    DHABHA_DRIVER_SEARCH: 'dhabhaDriverSearch',
    DHABHA_PROFILE_EDIT: 'dhabhaProfileEdit',
    DHABHA_DRIVER_KI_AWAZ: 'dhabhaDriverKiAwaz',

    // PUNCTURE MODULE
    PUNCTURE_BOTTOM: 'punctureBottomTab',
    PUNCTURE_HOME: 'punctureHome',
    PUNCTURE_PROFILE: 'punctureProfile',
    PUNCTURE_PROFILE_COMPLETION: 'punctureProfileCompletion',
    PUNCTURE_MY_REFERRALS: 'punctureMyReferrals',
    PUNCTURE_WALLET: 'punctureWallet',
    PUNCTURE_ADD_DRIVER: 'punctureAddDriver',
    PUNCTURE_BANK_DETAILS: 'punctureBankDetails',
    PUNCTURE_MY_SHOP: 'punctureMyShop',
    PUNCTURE_MY_DRIVERS: 'punctureMyDrivers',
    PUNCTURE_NEARBY: 'punctureNearby',
    PUNCTURE_DRIVER_SEARCH: 'punctureDriverSearch',
    PUNCTURE_PROFILE_EDIT: 'punctureProfileEdit',
    PUNCTURE_DRIVER_KI_AWAZ: 'punctureDriverKiAwaz',
    PUNCTURE_PROFILE_OVERVIEW: 'punctureProfileOverview',

    // SHIPPER MODULE
    SHIPPER_BOTTOM_TAB: 'shipperBottomTab',
    SHIPPER_HOME: 'shipperHome',
    SHIPPER_MY_LOADS: 'shipperMyLoads',
    SHIPPER_POST_LOAD: 'shipperPostLoad',
    SHIPPER_CHAT: 'shipperChat',
    SHIPPER_TRACK: 'shipperTrack',
    SHIPPER_PROFILE: 'shipperProfile',
    SHIPPER_PROFILE_COMPLETION: 'shipperProfileCompletion',
    SHIPPER_PROFILE_EDIT: 'shipperProfileEdit',
    SHIPPER_ACTIVE_LOADS: 'shipperActiveLoads',
    SHIPPER_ACCEPTED_LOADS: 'shipperAcceptedLoads',
    SHIPPER_IN_TRANSIT_LOADS: 'shipperInTransitLoads',
    SHIPPER_POD_PENDING: 'shipperPodPending',
    SHIPPER_IN_PROGRESS_LOADS: 'shipperInProgressLoads',
    SHIPPER_TRACK_DETAIL: 'shipperTrackDetail',
    SHIPPER_NOTIFICATIONS: 'shipperNotifications',
    SHIPPER_EDIT_LOAD: 'shipperEditLoad',
    TRANSPORTER_DRIVER_TRACKING: 'transporterDriverTracking',

} as const;

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
    PROFILE_OVERVIEW: 'profileOverview',
    PROFILE_EDIT_NEW: 'profileEditNew',
    PROFILE_EDIT: 'profileEdit',
    PROFILE_EDIT_TRANSPORTER: 'profileEditTransporter',
    ADD_DRIVER: 'truckerAddDriver',
    BANK_DETAILS: 'truckerBankDetails',
    DRIVER_LIST: 'truckerDriverList',
    // Profile Completion Flow
    PROFILE_SIGNUP: 'truckerProfileSignup',
    PROFILE_VEHICLE_INFO: 'truckerProfileVehicleInfo',
    PROFILE_DOCUMENT_UPLOAD: 'truckerProfileDocumentUpload',
    PROFILE_VERIFICATION_STATUS: 'truckerProfileVerificationStatus',
} as const;
