import { STACKS, TRUCKER_STACKS } from '../../stacks/stacks';

/**
 * Validates and resolves a screen name based on the user's role and stack.
 * If the screen is valid for the role, it returns the screen name.
 * Otherwise, it returns the fallback home screen for that role.
 */
export const resolveTargetScreen = (screenName: string, role: string, selectedModule?: string | null) => {
    const normalizedRole = role?.toLowerCase();
    const normalizedModule = selectedModule?.toLowerCase();

    console.log(`[Resolver] Resolving: ${screenName} | Role: ${normalizedRole} | Module: ${normalizedModule}`);

    // 1. Define fallbacks for each role/module context
    const getFallback = () => {
        if (normalizedRole === 'foreman') return STACKS.FOREMAN_BOTTOM_TAB;
        if (normalizedRole === 'dhaba' || normalizedModule === 'dhaba') return STACKS.DHABHA_BOTTOM;
        if (normalizedRole === 'association' || normalizedModule === 'association') return STACKS.ASSOCIATE_BOTTOM_TAB;
        if (normalizedRole === 'puncture' || normalizedModule === 'puncture_shop') return STACKS.PUNCTURE_BOTTOM;
        if (normalizedRole === 'shipper' || normalizedModule === 'shipper') return STACKS.SHIPPER_BOTTOM_TAB;

        // Default to Driver/Transporter home
        return 'bottomTab';
    };

    // 2. Define Allowed Screens per Stack
    // This maps which screens are actually rendered in which Stack
    const roleScreens: Record<string, string[]> = {
        foreman: [
            STACKS.FOREMAN_BOTTOM_TAB,
            STACKS.FOREMAN_DASHBOARD,
            STACKS.FOREMAN_JOBS_LIST,
            STACKS.FOREMAN_PROFILE,
            STACKS.FOREMAN_MY_PILOTS,
            STACKS.FOREMAN_PENDING_PROFILES,
            STACKS.FOREMAN_PENDING_SUBSCRIPTION,
            STACKS.FOREMAN_PENDING_TRAINING,
            STACKS.FOREMAN_VERIFIED_DRIVERS,
            STACKS.FOREMAN_TRUSTED_DRIVERS,
            STACKS.FOREMAN_APPLICATIONS,
            STACKS.FOREMAN_RECRUITMENTS,
            STACKS.FOREMAN_BANK_DETAILS,
            STACKS.FOREMAN_PROFILE_EDIT,
            STACKS.FOREMAN_SEARCH,
            STACKS.FOREMAN_EARNINGS_INFO,
            STACKS.FOREMAN_MEMBERSHIP_CARD,
            STACKS.ADD_DRIVER,
            STACKS.FOREMAN_ADD_DRIVER,
            STACKS.PROFILE_OVERVIEW,
            // Shared
            STACKS.SETTINGS,
            STACKS.NOTIFICATION,
            STACKS.CONTACT_US,
            STACKS.PRIVACY,
            STACKS.LANGUAGE_MAIN,
            STACKS.PROFILE_OVERVIEW,
            // Driver Ki Awaz
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
        ],
        driver: [
            'bottomTab', // Main entry for Driver
            STACKS.HOME,
            STACKS.JOB,
            STACKS.PROFILE,
            STACKS.TRAINING,
            STACKS.HEALTH_HYGIENE,
            STACKS.DASHBOARD,
            STACKS.NOTIFICATION,
            STACKS.SETTINGS,
            STACKS.PROFILE_EDIT,
            STACKS.PROFILE_EDIT_NEW,
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
            STACKS.AVAILABLE_JOB,
            STACKS.APPLIED_JOB,
            // Shared
            STACKS.PRIVACY,
            STACKS.CONTACT_US,
            STACKS.RATING,
        ],
        transporter: [
            'bottomTab', // Main entry for Transporter
            STACKS.VIEW_JOBS,
            STACKS.ADD_JOB,
            STACKS.TRANSPORTER_APPLIED_JOB,
            STACKS.DRIVER_LIST,
            STACKS.ADD_DRIVER,
            STACKS.NOTIFICATION,
            STACKS.SETTINGS,
            STACKS.PROFILE_EDIT,
            // Driver Ki Awaz
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
            // Shared
            STACKS.PRIVACY,
            STACKS.CONTACT_US,
        ],
        dhaba: [
            STACKS.DHABHA_BOTTOM,
            STACKS.DHABHA_HOME,
            STACKS.DHABHA_ADD_DRIVER,
            STACKS.DHABHA_EARNINGS,
            STACKS.DHABHA_PROFILE,
            STACKS.DHABHA_PROFILE_EDIT,
            STACKS.DHABHA_BANK_DETAILS,
            STACKS.DHABHA_MY_DHABHA,
            STACKS.DHABHA_MY_DRIVERS,
            STACKS.DHABHA_MY_DRIVERS,
            STACKS.DHABHA_DRIVER_SEARCH,
            // Driver Ki Awaz
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
            // Shared
            STACKS.SETTINGS,
            STACKS.NOTIFICATION,
            STACKS.PRIVACY,
        ],
        association: [
            STACKS.ASSOCIATE_BOTTOM_TAB,
            STACKS.DRIVER_ASSOCIATION_DASHBOARD,
            STACKS.DRIVER_ASSOCIATION_JOBS_LIST,
            STACKS.DRIVER_ASSOCIATION_MY_DRIVERS,
            STACKS.DRIVER_ASSOCIATION_EARNINGS_INFO,
            STACKS.ASSOCIATION_PROFILE_EDIT,
            STACKS.ASSOCIATION_BANK_DETAILS,
            STACKS.DRIVER_ASSOCIATION_PENDING_PROFILES,
            STACKS.DRIVER_ASSOCIATION_PENDING_SUBSCRIPTION,
            STACKS.DRIVER_ASSOCIATION_PENDING_TRAINING,
            STACKS.DRIVER_ASSOCIATION_VERIFIED_DRIVERS,
            STACKS.DRIVER_ASSOCIATION_TRUSTED_DRIVERS,
            STACKS.DRIVER_ASSOCIATION_APPLICATIONS,
            STACKS.DRIVER_ASSOCIATION_RECRUITMENTS,
            STACKS.DRIVER_ASSOCIATION_DRIVER_DETAILS,
            STACKS.DRIVER_ASSOCIATION_SEARCH,
            // Driver Ki Awaz
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
            // Shared
            STACKS.SETTINGS,
            STACKS.NOTIFICATION,
            STACKS.PRIVACY,
            STACKS.LANGUAGE_MAIN,
        ],
        shipper: [
            STACKS.SHIPPER_BOTTOM_TAB,
            STACKS.SHIPPER_HOME,
            STACKS.SHIPPER_MY_LOADS,
            STACKS.SHIPPER_POST_LOAD,
            STACKS.SHIPPER_PROFILE,
            STACKS.SHIPPER_PROFILE_EDIT,
            STACKS.SHIPPER_ACTIVE_LOADS,
            STACKS.SHIPPER_ACCEPTED_LOADS,
            STACKS.SHIPPER_IN_TRANSIT_LOADS,
            STACKS.SHIPPER_POD_PENDING,
            STACKS.SHIPPER_IN_PROGRESS_LOADS,
            STACKS.SHIPPER_TRACK_DETAIL,
            STACKS.SHIPPER_NOTIFICATIONS,
            STACKS.SHIPPER_EDIT_LOAD,
            // Shared
            STACKS.SETTINGS,
            STACKS.NOTIFICATION,
            STACKS.PRIVACY,
        ],
        puncture: [
            STACKS.PUNCTURE_BOTTOM,
            STACKS.PUNCTURE_HOME,
            STACKS.PUNCTURE_ADD_DRIVER,
            STACKS.PUNCTURE_WALLET,
            STACKS.PUNCTURE_PROFILE,
            STACKS.PUNCTURE_PROFILE_OVERVIEW,
            STACKS.PUNCTURE_BANK_DETAILS,
            STACKS.PUNCTURE_PROFILE_EDIT,
            STACKS.PUNCTURE_MY_SHOP,
            STACKS.PUNCTURE_MY_REFERRALS,
            STACKS.PUNCTURE_MY_DRIVERS,
            STACKS.PUNCTURE_DRIVER_SEARCH,
            // Driver Ki Awaz
            STACKS.DRIVER_KI_AWAZ_INFO,
            STACKS.DRIVER_KI_AWAZ_CREATE_POST,
            STACKS.DRIVER_KI_AWAZ_MY_POSTS,
            STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
            STACKS.SINGLE_REEL_SCREEN,
            // Shared
            STACKS.SETTINGS,
            STACKS.NOTIFICATION,
            STACKS.PRIVACY,
            STACKS.LANGUAGE_MAIN,
        ]
    };

    // 3. Determine actual check list based on role/module
    let allowedScreens: string[] = [];
    if (normalizedRole === 'foreman') {
        allowedScreens = roleScreens.foreman;
    } else if (normalizedRole === 'dhaba' || normalizedModule === 'dhaba') {
        allowedScreens = roleScreens.dhaba;
    } else if (normalizedRole === 'association' || normalizedModule === 'association') {
        allowedScreens = roleScreens.association;
    } else if (normalizedRole === 'shipper' || normalizedModule === 'shipper') {
        allowedScreens = roleScreens.shipper;
    } else if (normalizedRole === 'puncture' || normalizedModule === 'puncture_shop') {
        allowedScreens = roleScreens.puncture || [];
    } else if (normalizedRole === 'driver') {
        allowedScreens = roleScreens.driver;
    } else if (normalizedRole === 'transporter') {
        allowedScreens = roleScreens.transporter;
    } else {
        // Broad default for any other authenticated role
        allowedScreens = [...roleScreens.driver, ...roleScreens.transporter];
    }

    // 4. Resolve Aliases (if any)
    // Sometimes backend sends 'jobs' but app uses 'job'
    const aliasMapping: Record<string, string> = {
        'jobs': STACKS.JOB,
        'job': STACKS.JOB,
        'profileEdit': STACKS.PROFILE_EDIT,
        'post': STACKS.DRIVER_KI_AWAZ_POST_DETAIL,
        'reel': STACKS.SINGLE_REEL_SCREEN,
    };

    const targetScreen = aliasMapping[screenName] || screenName;

    // 5. Final Validation
    const isAllowed = allowedScreens.some(s => s.toLowerCase() === targetScreen.toLowerCase());

    if (isAllowed) {
        console.log(`[Resolver] ✅ Access Granted: ${targetScreen}`);
        return targetScreen;
    } else {
        const fallback = getFallback();
        console.log(`[Resolver] ❌ Access Denied to ${targetScreen}. Redirecting to fallback: ${fallback}`);
        return fallback;
    }
};

/**
 * Resolves the full navigation structure (stack + screen) for a given target.
 * This handles role-specific bottom tab names and nested stacks.
 */
export const resolveTargetNavigation = (screenName: string, role: string, selectedModule?: string | null) => {
    const normalizedRole = role?.toLowerCase();
    const normalizedModule = selectedModule?.toLowerCase();
    
    const validatedScreen = resolveTargetScreen(screenName, role, selectedModule);

    // 1. Determine the root stack based on role
    let rootStack = 'bottomTab';
    if (normalizedRole === 'foreman') rootStack = STACKS.FOREMAN_BOTTOM_TAB;
    else if (normalizedRole === 'dhaba' || normalizedModule === 'dhaba') rootStack = STACKS.DHABHA_BOTTOM;
    else if (normalizedRole === 'association' || normalizedModule === 'association') rootStack = STACKS.ASSOCIATE_BOTTOM_TAB;
    else if (normalizedRole === 'puncture' || normalizedModule === 'puncture_shop') rootStack = STACKS.PUNCTURE_BOTTOM;
    else if (normalizedRole === 'shipper' || normalizedModule === 'shipper') rootStack = STACKS.SHIPPER_BOTTOM_TAB;

    // 2. Map generic screen names to role-specific tab names
    const tabMap: Record<string, Record<string, string>> = {
        foreman: {
            [STACKS.DRIVER_KI_AWAZ_INFO]: STACKS.FOREMAN_DRIVER_KI_AWAZ,
            [STACKS.HOME]: STACKS.FOREMAN_HOME,
            [STACKS.PROFILE]: STACKS.FOREMAN_PROFILE,
            [STACKS.JOB]: STACKS.FOREMAN_JOBS_LIST,
        },
        dhaba: {
            [STACKS.DRIVER_KI_AWAZ_INFO]: STACKS.DHABHA_DRIVER_KI_AWAZ,
            [STACKS.HOME]: STACKS.DHABHA_HOME,
            [STACKS.PROFILE]: STACKS.DHABHA_PROFILE,
        },
        puncture: {
            [STACKS.DRIVER_KI_AWAZ_INFO]: STACKS.PUNCTURE_DRIVER_KI_AWAZ,
            [STACKS.HOME]: STACKS.PUNCTURE_HOME,
            [STACKS.PROFILE]: STACKS.PUNCTURE_PROFILE,
        },
        // Add others as needed
    };

    const roleSpecificTab = tabMap[normalizedRole]?.[validatedScreen];

    if (roleSpecificTab) {
        return { stack: rootStack, screen: roleSpecificTab };
    }

    // Default: Check if the screen is one of the "root-level" screens that should be in a bottom tab
    const genericTabs: string[] = [STACKS.HOME, STACKS.JOB, STACKS.PROFILE, STACKS.TRAINING, STACKS.DRIVER_KI_AWAZ_INFO];
    if (genericTabs.includes(validatedScreen)) {
        return { stack: rootStack, screen: validatedScreen };
    }

    // If it's not a tab but an allowed screen in the main stack
    return { stack: undefined, screen: validatedScreen };
};
