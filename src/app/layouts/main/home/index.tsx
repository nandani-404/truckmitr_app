import { ActivityIndicator, Animated, FlatList, ScrollView, Text, TouchableOpacity, View, Modal, Linking, PanResponder, Pressable, TouchableWithoutFeedback, LayoutAnimation, Platform, UIManager, RefreshControl } from 'react-native'

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MediaSwiper, Space } from '@truckmitr/src/app/components';
import { Image } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import { isIOS } from '@truckmitr/src/app/functions';
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { subscriptionDetailsAction, subscriptionModalAction, userAction, jobAddAction } from '@truckmitr/src/redux/actions/user.action';
import moment from 'moment';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeModal from '@truckmitr/src/app/components/welcome-modal';
import { getUserBadgeText } from '@truckmitr/src/utils/global';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface SubscriptionItem {
    payment_type: string;
    end_at: number;
    [key: string]: any;
}

const capitalizeFirst = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const Home = React.forwardRef((props, ref) => {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();

    const { shadow } = useShadow()


    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [showWelcome, setShowWelcome] = useState(false)

    const { user, isDriver, isTransporter, whatsapp_link, profileCompletion, subscriptionDetails, subscriptionModal, rank, star_rating } = useSelector((state: any) => { return state?.user }) || {};

    const IMAGES = [
        isDriver ? 'https://truckmitr.com/public/front/assets/images/BNR.jpg' : 'https://i.pinimg.com/736x/e7/bb/ea/e7bbea6ce9d1688158fde5d7160fcf5b.jpg'
        // 'https://i.pinimg.com/736x/af/81/c2/af81c27eee15cfa9de82f75611c8e1fb.jpg',
        // 'https://i.pinimg.com/736x/2f/0c/1f/2f0c1fd30f5a6d33e995b8acc21ecf68.jpg',
        // 'https://i.pinimg.com/736x/66/cd/dd/66cddd980a459f49ef5a88b4850fc24e.jpg'
    ]

    const progress = profileCompletion || 0; // Profile completion percentage
    const size = responsiveFontSize(8); // Size of the circle
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    const scrollValue = useRef(new Animated.Value(0)).current;
    const translateX = scrollValue.interpolate({
        inputRange: [0, responsiveWidth(100)],
        outputRange: [0, 20],
    });

    const bannerRef = useRef<FlatList>(null);
    const [bannerIndex, setBannerIndex] = useState(0);
    const [isBannerPaused, setIsBannerPaused] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [addDriverModal, setAddDriverModal] = useState(false);

    const [banners, setBanners] = useState<any[]>([
        {},
        {},
    ]);

    const fetchBanners = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS.MOBILE_BANNERS);
            if (response?.data?.status === 'success' && Array.isArray(response?.data?.data)) {
                const validBanners = response.data.data.filter((item: any) => {
                    // Filter based on user type if needed
                    if (item.user_type === 'driver' && !isDriver) return false;
                    if (item.user_type === 'transporter' && !isTransporter) return false;
                    return item.status === true; // Only show active banners
                });

                if (validBanners.length > 0) {
                    setBanners(validBanners);
                }
            }
        } catch (error) {
            console.log('Error fetching banners:', error);
        }
    };

    const handleBannerPress = (redirectLink: string | null) => {
        if (!redirectLink) return;

        switch (redirectLink.toLowerCase().replace(/\s/g, '')) {
            case 'profile':
                _navigateProfile();
                break;
            case 'appliedjobs':
                _navigateAppliedJobs();
                break;
            case 'availablejobs':
                _navigateAvailableJobs();
                break;
            case 'home':
                // Already on home
                break;
            case 'search':
                _navigateSearch();
                break;
            case 'dashboard':
                _navigateDashboard();
                break;
            case 'training':
                _navigateTraning();
                break;
            case 'suitsjobs':
                _navigateSuitsJobs();
                break;
            case 'healthhygiene':
                _navigateHealthHygiene();
                break;
            case 'quizresult':
                _navigateQuizResult();
                break;
            case 'transporterinvitation':
                _navigateTransporterInvitation();
                break;
            case 'invitedriver':
                _navigateInviteDriver();
                break;
            case 'transporterverification':
                _navigateTransporterVerification();
                break;
            case 'verification':
                _navigateVerifiedNow();
                break;
            case 'idcheck':
                _navigateIdCheck();
                break;
            case 'courtcheck':
                _navigateCourtCheck();
                break;
            case 'digitaladdresscheck':
                _navigateDigitalAddressCheck();
                break;
            case 'videointerview':
                _navigateVideoInterviewInfo();
                break;
            case 'calljobmanager':
                _navigateCallJobManager();
                break;
            case 'rccheck':
                _navigateRcCheck();
                break;
            case 'challancheck':
                _navigateChallanCheck();
                break;
            case 'driverkiawaz':
                _navigateDriverKiAwazInfo();
                break;
            case 'calljobmanagerlist':
                _navigateCallJobManagerList();
                break;
            case 'driverinvites':
                _navigateDriverInvites();
                break;
            case 'contactus':
                _navigateContactUs();
                break;
            case 'referral':
                _navigateReferral();
                break;
            case 'addjob':
                _navigateAddJob();
                break;
            case 'viewjobs':
                _navigateViewJobs();
                break;
            case 'adddriver':
                _navigateAddDriver();
                break;
            case 'transporterappliedjobs':
                _navigateAppliedJobsTransporter();
                break;
            case 'driverlist':
                _navigateDriverList();
                break;
            default:
                console.log('No navigation handler for:', redirectLink);
                break;
        }
    };

    useEffect(() => {
        if (isBannerPaused) return; // Pause auto-scroll if user is interacting
        const interval = setInterval(() => {
            setBannerIndex(prevIndex => {
                const nextIndex = (prevIndex + 1) % banners.length;
                bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [isBannerPaused, banners.length]);

    const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});
    const [recommendedJobsList, setrecommendedJobsList] = useState([])

    const [loadingApplyJob, setloadingApplyJob] = useState(-1)
    const [showLottie, setshowLottie] = useState(false)
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [jobId: number]: boolean }>({});
    const [errorsJobs, setErrorsJobs] = useState<{ [jobId: number]: { checkBox?: string } }>({});
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true); // Start muted by default
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false); // Start NOT minimized so video shows
    // Video carousel state
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [videoLoading, setVideoLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);

    // Pan Gesture for Mini Player & Fullscreen Swipe Down
    const pan = useRef(new Animated.ValueXY()).current;

    // Keep track of isFullScreen for PanResponder
    const isFullScreenRef = useRef(isFullScreen);
    useEffect(() => {
        isFullScreenRef.current = isFullScreen;
    }, [isFullScreen]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                if (isFullScreenRef.current) {
                    // Fullscreen: Swipe down (dy positive and significant)
                    return gestureState.dy > 10;
                }
                // Mini mode: Drag
                return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
            },
            onPanResponderGrant: () => {
                if (!isFullScreenRef.current) {
                    pan.setOffset({
                        x: (pan.x as any)._value,
                        y: (pan.y as any)._value
                    });
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                if (isFullScreenRef.current) {
                    // No visual drag yet, just tracking
                    return;
                }
                return Animated.event(
                    [null, { dx: pan.x, dy: pan.y }],
                    { useNativeDriver: false }
                )(evt, gestureState);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isFullScreenRef.current) {
                    // Swipe Down Detection
                    if (gestureState.dy > 50) {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        setIsFullScreen(false);
                    }
                } else {
                    pan.flattenOffset();
                }
            }
        })
    ).current;
    const [popupData, setPopupData] = useState<{
        id: any,
        title: string;
        message: string;
        user_type: string;
        start_date: string;
        end_date: string;
        status: boolean;
        image: null | string;
    }>({
        id: '',
        title: '',
        message: '',
        user_type: '',
        start_date: '',
        end_date: '',
        status: false,
        image: ''
    });

    const validateJobs = (jobId: number): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!checkBoxSelect[jobId]) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }
        setErrorsJobs(prev => ({ ...prev, [jobId]: newErrors }));
        return valid;
    };

    const _onpressCheckBox = (jobId: number) => {
        setCheckBoxSelect(prev => ({ ...prev, [jobId]: !prev[jobId] }));
        setErrorsJobs(prev => ({ ...prev, [jobId]: { checkBox: undefined } }));
    };

    // API call for popup message
    const fetchPopupMessage = async () => {
        try {
            const response: any = await axiosInstance.get(
                END_POINTS.POPUP_MESSAGE
            );
            if (response?.data?.data) {
                const popup = response.data.data;
                // get closed count for this popupId
                let closedCount = await AsyncStorage.getItem(`welcome_popup_closed_count_${popup.id}`);
                const closedCountNum = closedCount ? parseInt(closedCount) : 0;
                if (closedCountNum >= 3) return;
                const now = new Date();
                let isWithinRange = true;
                if (popup.start_date && popup.end_date) {
                    const startDate = new Date(popup.start_date);
                    const endDate = new Date(popup.end_date);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                    isWithinRange = today >= start && today <= end;
                }
                let shouldShowPopup = false;
                if (popup.user_type === 'both') {
                    shouldShowPopup = true;
                } else if (popup.user_type === 'driver' && isDriver) {
                    shouldShowPopup = true;
                } else if (popup.user_type === 'transporter' && isTransporter) {
                    shouldShowPopup = true;
                }
                setShowWelcome(popup.status && isWithinRange && shouldShowPopup);
                setPopupData({
                    id: popup.id,
                    title: popup.title,
                    message: popup.message,
                    user_type: popup.user_type,
                    start_date: popup.start_date,
                    end_date: popup.end_date,
                    status: popup.status,
                    image: popup.image
                });
            }
        } catch (error: any) {
            console.log('Error fetching popup message:', error);
        }
    };

    const _recommendedJobs = async () => {
        const recommendedJobs: any = await axiosInstance.get(END_POINTS?.RECOMMENDED_JOBS);
        if (recommendedJobs?.data?.status) {
            setrecommendedJobsList(recommendedJobs?.data?.data)
        }
    }

    useFocusEffect(
        useCallback(() => {
            const _fetchUser = async () => {
                const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                const res: any = await axiosInstance.get(END_POINTS.PAYMENT_DETAIL);
                if (profile?.data?.status) {
                    dispatch(userAction(profile?.data))
                    const subscriptionDetail: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS);
                    if (subscriptionDetail?.data?.status) {
                        dispatch(subscriptionDetailsAction(subscriptionDetail?.data?.data))
                    }
                    let subsClosedCount = await AsyncStorage.getItem('subscription_modal_closed_count');

                    // Check if any subscription is active (handles Array or Object)
                    let hasActiveSub = false;
                    const subData = subscriptionDetail?.data?.data;

                    if (Array.isArray(subData)) {
                        hasActiveSub = subData.some((item: any) => isSubscriptionActive(item));
                    } else if (subData && typeof subData === 'object') {
                        hasActiveSub = isSubscriptionActive(subData);
                    }

                    if (subsClosedCount !== '1' && !hasActiveSub) {
                        dispatch(subscriptionModalAction(true))
                        await AsyncStorage.setItem('subscription_modal_closed_count', '1');
                    }
                }
            }
            _fetchUser()
            _recommendedJobs()
            fetchPopupMessage()
            fetchVideoUrl()
            fetchBanners()
        }, [])
    );

    // Pull to refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Fetch user profile
            const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
            if (profile?.data?.status) {
                dispatch(userAction(profile?.data));
            }

            // Fetch subscription details
            const subscriptionDetail: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS);
            if (subscriptionDetail?.data?.status) {
                dispatch(subscriptionDetailsAction(subscriptionDetail?.data?.data));
            }

            // Fetch other data in parallel
            await Promise.all([
                _recommendedJobs(),
                fetchBanners(),
                fetchVideoUrl(),
            ]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Auto-hide controls in fullscreen
    useEffect(() => {
        let timeout: any;
        if (isFullScreen && isPlaying && showControls) {
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [isFullScreen, isPlaying, showControls]);

    // Fallback local video URL - using BASE_URL for environment compatibility
    const LOCAL_VIDEO_URL = `${BASE_URL}public/videos/intro-video.mp4`;

    // Get current video URL
    const videoUrl = videoUrls.length > 0 ? videoUrls[currentVideoIndex] : LOCAL_VIDEO_URL;

    // Navigate to next video
    const goToNextVideo = () => {
        if (videoUrls.length > 1) {
            setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
            setIsPlaying(true);
        }
    };

    // Navigate to previous video
    const goToPreviousVideo = () => {
        if (videoUrls.length > 1) {
            setCurrentVideoIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length);
            setIsPlaying(true);
        }
    };

    // Fetch video URLs from TRUCKMITRBANNERS API (same as MediaSwiper)
    const fetchVideoUrl = async () => {
        try {
            setVideoLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.TRUCKMITRBANNERS);
            console.log('Banners API Response:', JSON.stringify(response?.data));

            if (response?.data?.status && response?.data?.data) {
                // Get all video banners
                const videoBanners = response.data.data.filter((banner: any) => banner.media_type === 'video');

                if (videoBanners.length > 0) {
                    // Construct URLs for all videos
                    const urls = videoBanners.map((banner: any) => `${BASE_URL}public${banner.media_url}`);
                    console.log('Setting video URLs from banners:', urls);
                    setVideoUrls(urls);
                    setCurrentVideoIndex(0);
                } else {
                    console.log('No video banners found, using fallback');
                    setVideoUrls([LOCAL_VIDEO_URL]);
                }
            } else {
                console.log('No banners data, using fallback');
                setVideoUrls([LOCAL_VIDEO_URL]);
            }
        } catch (error: any) {
            console.log('Error fetching banners:', error);
            // Fallback to local/default video URL on error
            setVideoUrls([LOCAL_VIDEO_URL]);
        } finally {
            setVideoLoading(false);
        }
    };


    const isSubscriptionActive = (item: any) => {
        if (!item) return false;
        if (!item.end_at) return false;

        // Convert epoch seconds → milliseconds
        const endDate = new Date(item.end_at * 1000);
        const now = new Date();

        return endDate > now;
    };

    const getActivePlanName = () => {
        let activeSub = null;
        if (Array.isArray(subscriptionDetails)) {
            activeSub = subscriptionDetails.find((item: any) => isSubscriptionActive(item));
        } else if (subscriptionDetails && isSubscriptionActive(subscriptionDetails)) {
            activeSub = subscriptionDetails;
        }

        const role = capitalizeFirst(user?.role || 'Driver');

        if (activeSub) {
            let tier = '';
            // Try to deduce tier from payment_type or plan_name
            const type = (activeSub.payment_type || activeSub.plan_name || '').toUpperCase();
            const amt = activeSub.amount ? parseFloat(activeSub.amount) : 0;

            // Check for specific subscription tiers based on amount and role
            const floorAmt = Math.floor(amt);

            if (user?.role === 'transporter' && (floorAmt === 99 || floorAmt === 100)) {
                tier = 'Legacy';
            } else if (isDriver && floorAmt === 99) {
                tier = 'Job Ready';
            } else if (floorAmt === 49 || floorAmt === 100) {
                tier = 'Legacy';
            }
            else if (user?.role === 'transporter' && (amt === 499 || amt === 499.00)) {
                tier = 'Transporter Pro';
            }
            // Prioritize explicit name matching
            else if (type.includes('TRUSTED')) tier = 'Trusted';
            else if (type.includes('VERIFIED')) tier = 'Verified';
            else if (type.includes('JOB READY') || type.includes('JOBREADY')) tier = 'Job Ready';
            else if (type.includes('STANDARD')) tier = 'Standard';
            else if (type.includes('LEGACY')) tier = 'Legacy';

            // Fallback to amount-based detection if name didn't match
            if (!tier && activeSub.amount) {
                if (amt >= 499) tier = 'Trusted';
                else if (amt >= 199) tier = 'Verified';
                else if (amt >= 99) tier = 'Job Ready';
            }

            // Fallback to raw name
            if (!tier && type && type !== 'SUBSCRIPTION') {
                tier = capitalizeFirst(activeSub.payment_type || activeSub.plan_name);
            }

            if (tier) {
                if (tier === 'Transporter Pro') {
                    return 'Transporter Pro';
                }
                // Ensure we don't duplicate "Driver" e.g. "Trusted Driver Driver"
                if (tier.toLowerCase().endsWith(' driver')) {
                    tier = tier.substring(0, tier.length - 7);
                }
                return `${tier} ${role}`;
            }
        }

        return role;
    };

    const toggleExpand = (id: number) => {
        setExpandedJobs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const _navigateSearch = () => {
        navigation.navigate(STACKS.SEARCH)
    }

    const _navigateDashboard = () => {
        navigation.navigate(STACKS.DASHBOARD)
    }
    const _navigateTraning = () => {
        navigation.navigate(STACKS.BOTTOM_TAB, { screen: STACKS.TRAINING })
    }
    const _navigateProfile = () => {
        navigation.navigate(STACKS.BOTTOM_TAB, { screen: STACKS.PROFILE })
    }
    const _navigateAvailableJobs = () => {
        navigation.navigate(STACKS.BOTTOM_TAB, { screen: STACKS.JOB })
    }
    const _navigateSuitsJobs = () => {
        if (subscriptionDetails?.showSubscriptionModel && isDriver) {
            dispatch(subscriptionModalAction(true))
        } else {
            navigation.navigate(STACKS.SUITS_JOB)

        }
    }
    const _navigateAppliedJobs = () => {
        navigation.navigate(STACKS.APPLIED_JOB)
    }
    const _navigateHealthHygiene = () => {
        navigation.navigate(STACKS.HEALTH_HYGIENE)
    }
    const _navigateQuizResult = () => {
        navigation.navigate(STACKS.QUIZ_RESULT)
    }

    const _navigateTransporterInvitation = () => {
        navigation.navigate(STACKS.TRANSPORTER_INVITATION_INFO);
    }

    const _navigateInviteDriver = () => {
        navigation.navigate(STACKS.ALLDRIVER_LIST_WITH_TABS)
    }

    const _navigateTransporterVerification = () => {
        navigation.navigate(STACKS.TRANSPORTER_VERIFICATION)
    }

    const _navigateVerifiedNow = () => {
        navigation.navigate(STACKS.VERIFICATION);
    }
    const _navigateIdCheck = () => {
        navigation.navigate(STACKS.ID_CHECK_INFO);
    }
    const _navigateCourtCheck = () => {
        navigation.navigate(STACKS.COURT_CHECK_INFO);
    }
    const _navigateDigitalAddressCheck = () => {
        navigation.navigate(STACKS.DIGITAL_ADDRESS_CHECK_INFO);
    }
    const _navigateVideoInterviewInfo = () => {
        navigation.navigate(STACKS.VIDEO_INTERVIEW_INFO);
    }


    const _navigateCallJobManager = () => {
        navigation.navigate(STACKS.CALL_JOB_MANAGER_INFO);
    }
    const _navigateRcCheck = () => {
        navigation.navigate(STACKS.RC_CHECK_INFO);
    }
    const _navigateChallanCheck = () => {
        navigation.navigate(STACKS.CHALLAN_CHECK_INFO);
    }
    const _navigateDriverKiAwazInfo = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_INFO);
    }
    const _navigateCallJobManagerList = () => {
        navigation.navigate(STACKS.CALL_JOB_MANAGER_LIST);
    }
    const _navigateDriverInvites = () => {
        navigation.navigate(STACKS.DRIVERINVITES);
    }
    const _navigateContactUs = () => {
        navigation.navigate(STACKS.CONTACT_US);
    }

    const _navigateReferral = () => {
        navigation.navigate(STACKS.REFERRAL)
    }

    const _navigateTranspoerterVerification = () => {
        navigation.navigate(STACKS.VERIFICATIONDRIVERSBYTRANSPORTER)
    }

    const _navigateAddJob = () => {
        // Clear any existing job data from Redux
        dispatch(jobAddAction({}));

        if (subscriptionDetails?.showSubscriptionModel && isTransporter) {
            dispatch(subscriptionModalAction(true))
        } else {
            navigation.navigate(STACKS.ADD_JOB)
        }
    }
    const _navigateViewJobs = () => {
        dispatch(jobAddAction({}));
        
        if (subscriptionDetails?.showSubscriptionModel && isTransporter) {
            dispatch(subscriptionModalAction(true))
        } else {
            navigation.navigate(STACKS.VIEW_JOBS)
        }
    }
    const _navigateAddDriver = () => {
        navigation.navigate(STACKS.ADD_DRIVER);
    }
    const _navigateAppliedJobsTransporter = () => {
        let hasPremium = false;

        const checkAmt = (details: any) => {
            if (isSubscriptionActive(details)) {
                const amt = details.amount ? parseFloat(details.amount) : 0;
                const floorAmt = Math.floor(amt);
                if ([499, 99, 100, 1].includes(floorAmt)) {
                    return true;
                }
            }
            return false;
        }

        if (Array.isArray(subscriptionDetails)) {
            hasPremium = subscriptionDetails.some(checkAmt);
        } else if (subscriptionDetails && typeof subscriptionDetails === 'object') {
            hasPremium = checkAmt(subscriptionDetails);
        }

        if (subscriptionDetails?.showSubscriptionModel && isTransporter && !hasPremium) {
            !subscriptionModal && dispatch(subscriptionModalAction(true))
        } else {
            navigation.navigate(STACKS.TRANSPORTER_APPLIED_JOB)
        }
    }
    const _navigateDriverList = () => {
        navigation.navigate(STACKS.DRIVER_LIST)
    }
    const _navigateDriverTripWallet = () => {
        navigation.navigate(STACKS.DRIVER_TRIP_WALLET)
    }
    const _navigateDriverWelfare = () => {
        navigation.navigate(STACKS.DRIVER_WELFARE)
    }
    const _navigateDriverLoan = () => {
        navigation.navigate(STACKS.DRIVER_LOAN)
    }
    const _navigateTruckMitrDhaba = () => {
        navigation.navigate(STACKS.TRUCKMITR_DHABA)
    }
    const _navigateTruckMitrSuvidhaKendra = () => {
        navigation.navigate(STACKS.TRUCKMITR_SUVIDHA_KENDRA)
    }
    const _navigateJobInvitationsList = () => {
        navigation.navigate(STACKS.JOB_INVITATIONS_LIST)
    }
    const _navigateScheduledInterview = () => {
        navigation.navigate(STACKS.SCHEDULED_INTERVIEWS)
    }
    const _navigateTMLoadMandal = () => {
        navigation.navigate(STACKS.TM_LOAD_MANDAL)
    }
    const _navigateTransporterLoan = () => {
        navigation.navigate(STACKS.TRANSPORTER_LOAN)
    }
    const _navigateSecondHandTruckMarketplace = () => {
        navigation.navigate(STACKS.SECOND_HAND_TRUCK_MARKETPLACE)
    }
    const _navigateFleetManagementSolution = () => {
        navigation.navigate(STACKS.FLEET_MANAGEMENT_SOLUTION)
    }
    const _navigateFuelDiscount = () => {
        navigation.navigate(STACKS.FUEL_DISCOUNT)
    }
    const _navigateTruckInsurance = () => {
        navigation.navigate(STACKS.TRUCK_INSURANCE)
    }

    const _navigateConvoy = () => {
        navigation.navigate(STACKS.CONVOY)
    }
    // const _navigateRcCheckResult = () => {
    //     navigation.navigate(STACKS.RC_CHECK_RESULT, { rcNumber: '' }) // Needs params usually
    // }

    const closeWelcomePopup = async (Id: any) => {
        // get closed count for this popupId
        let closedCount = await AsyncStorage.getItem(`welcome_popup_closed_count_${Id}`);
        const closedCountNum = closedCount ? parseInt(closedCount) : 0;
        await AsyncStorage.setItem(
            `welcome_popup_closed_count_${Id}`,
            String(closedCountNum + 1)
        );
        setShowWelcome(false)
    }

    const _applyJob = async (id: any) => {
        if (!validateJobs(id)) return;
        if (subscriptionDetails?.showSubscriptionModel && isDriver) {
            !subscriptionModal && dispatch(subscriptionModalAction(true))
        } else {
            try {
                setloadingApplyJob(id)
                const FormData = require('form-data');
                let data = new FormData();
                // Set consent_visible_transporter to 1 if checked, 0 if unchecked
                data.append('consent_visible_transporter', checkBoxSelect[id] ? 1 : 0);

                const response: any = await axiosInstance.post(END_POINTS?.APPLY_JOB(id), data);
                if (response?.data?.status) {
                    setshowLottie(true)
                    setTimeout(() => {
                        setshowLottie(false)
                    }, 1200);
                } else {
                    showToast(response?.data?.message)
                }
                _recommendedJobs()
            } catch (error) {
                console.error("Error searching jobs:", error);
            } finally {
                setloadingApplyJob(-1)
            }
        }
    }

    // Can start at mount 🎉
    // you need to wait until everything is registered 😁
    const scrollViewRef = useRef<any>('');

    React.useImperativeHandle(ref, () => ({
        scrollToTop: (): Promise<void> => {
            return new Promise(async (resolve) => {
                if (isDriver) {
                    scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                    setTimeout(() => resolve(), 200); // Wait for scroll animation
                } else {
                    resolve();
                }
            });
        }
    }));
    const hasMoreThanFive = recommendedJobsList.length > 5;

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.royalBlue}
                        colors={[colors.royalBlue]}
                        progressBackgroundColor={colors.white}
                        progressViewOffset={120}
                    />
                }
            >
                <View style={{ height: responsiveHeight(isIOS() ? 48 : isDriver ? 47 : 42), width: responsiveWidth(100), borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }}>
                    {/* Banner Carousel as Background */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 60, borderBottomRightRadius: 60, overflow: 'hidden' }}>
                        <FlatList
                            ref={bannerRef}
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => index.toString()}
                            getItemLayout={(data, index) => ({
                                length: responsiveWidth(100),
                                offset: responsiveWidth(100) * index,
                                index,
                            })}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / responsiveWidth(100));
                                setBannerIndex(index);
                            }}
                            renderItem={({ item, index }) => (
                                <Pressable
                                    onPress={() => handleBannerPress(item.redirect_link)}
                                    // onPressIn={() => setIsBannerPaused(true)}
                                    // onPressOut={() => setIsBannerPaused(false)}
                                    style={{
                                        width: responsiveWidth(100),
                                        height: '100%'
                                    }}
                                >
                                    {/* Background Image */}
                                    <Image
                                        style={{
                                            width: '100%',
                                            height: '100%'
                                        }}
                                        source={item.bg ? item.bg : { uri: `${BASE_URL}public/${item.media_path}` }}
                                        resizeMode={(item.bgResize as any) || "cover"}
                                    />

                                    {/* Overlay Image (Centered/Lower) */}
                                    {item.overlay && (
                                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -responsiveHeight(5), justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <Image
                                                source={item.overlay}
                                                style={{ width: '90%', height: '80%' }}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    )}


                                </Pressable>
                            )}
                        />
                    </View>

                    {/* Content on top */}
                    <Space height={safeAreaInsets.top} />
                    <WelcomeModal
                        title={popupData.title}
                        visible={showWelcome}
                        onClose={() => closeWelcomePopup(popupData.id)}
                        welcomeMessage={popupData.message}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: responsiveWidth(3), marginTop: 0 }}>
                        <View style={{}}>
                            <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontFamily: 'Inter-Bold', fontWeight: 'bold', letterSpacing: 0.5 }}>{`${t(`hi`)}, ${user?.name || ''} 👋`}</Text>

                            <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), fontFamily: 'Inter-Bold', fontWeight: 'bold', marginTop: 0 }}>{`${user?.unique_id || ''}`}</Text>

                            <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontFamily: 'Inter-Bold', fontWeight: 'bold', marginTop: 0 }}>
                                {getUserBadgeText({ user, subscriptionDetails, isDriver })}
                            </Text>

                        </View>

                        <TouchableOpacity onPress={_navigateProfile} activeOpacity={.7} style={{ alignItems: 'center' }}>
                            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                                <Svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
                                    <Defs>
                                        <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                                            <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                                        </SvgGradient>
                                    </Defs>
                                    {/* Background Circle */}
                                    {/* <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={colors.whiteOpacity(.3)}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    /> */}
                                    {/* Progress Circle */}
                                    <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke="url(#grad)"
                                        strokeWidth={4}
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={progressOffset}
                                        strokeLinecap="round"
                                        rotation="90"
                                        origin={`${size / 2}, ${size / 2}`}
                                    />
                                </Svg>
                                <Image style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }} source={{ uri: user?.images ? `${BASE_URL}public/${user?.images}` : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png` }} />
                                <View style={{ backgroundColor: colors.whiteOpacity(1), paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${profileCompletion}%`}</Text>
                                </View>
                            </View>
                            {!isTransporter && (
                                <>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: responsiveFontSize(1.5), gap: 2 }}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <FontAwesome
                                                key={i}
                                                name={i < (star_rating || 0) ? 'star' : 'star-o'}
                                                size={responsiveFontSize(1.6)}
                                                color={i < (star_rating || 0) ? '#FFD700' : colors.blackOpacity(0.2)}
                                            />
                                        ))}
                                    </View>
                                    <View style={{ marginTop: 2, backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.royalBlue, fontFamily: 'Inter-Bold', textAlign: 'center' }}>{rank || 'N/A'} 🏆</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                    {/*  */}
                    {/* Search Bar at bottom */}
                    {(isDriver || isTransporter) && <TouchableOpacity onPress={_navigateSearch} activeOpacity={1} style={{ position: 'absolute', bottom: -responsiveHeight(1.5), width: responsiveWidth(92), flexDirection: 'row', height: responsiveHeight(6), alignSelf: 'center', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'space-between', borderColor: '#000', borderWidth: 1.5, borderRadius: 100, paddingHorizontal: responsiveWidth(3), ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.2) : colors.blackOpacity(.4), zIndex: 100, elevation: 10 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.blackOpacity(.9), fontWeight: '500' }}>{isTransporter ? t('searchDrivers') : t('searchJobs')}</Text>
                        <Feather name={'search'} size={18} color={colors.royalBlueOpacity(1)} />
                    </TouchableOpacity>}
                </View>

                {/* Floating Reel-Style Video Player - DISABLED */}
                {false && isDriver && <View style={{
                    position: 'absolute',
                    right: 15,
                    bottom: 80,
                    width: responsiveWidth(35),
                    height: responsiveHeight(35),
                    backgroundColor: colors.black,
                    borderRadius: 16,
                    ...shadow,
                    shadowColor: colors.blackOpacity(.4),
                    elevation: 10,
                    zIndex: 50,
                    overflow: 'hidden'
                }}>
                    {/* Video Thumbnail/Background */}
                    <Image
                        source={{ uri: 'https://via.placeholder.com/360x640/1a1a1a/FFFFFF?text=Training+Reel' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />

                    {/* Dark Overlay */}
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.blackOpacity(.3)
                    }} />

                    {/* Top Controls Bar */}
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        padding: 8
                    }}>
                        {/* Mute/Unmute Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: colors.blackOpacity(.6),
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Feather name="volume-x" size={16} color="#fff" />
                        </TouchableOpacity>

                        {/* Close Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: colors.blackOpacity(.6),
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Feather name="x" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Center Play Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: [{ translateX: -30 }, { translateY: -30 }],
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: colors.whiteOpacity(.9),
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: colors.white
                        }}
                    >
                        <Feather name="play" size={28} color={colors.royalBlue} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>

                    {/* Bottom Controls Bar */}
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: 10,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end'
                    }}>
                        {/* Video Title/Info */}
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{
                                color: colors.white,
                                fontSize: responsiveFontSize(1.2),
                                fontWeight: '600',
                                marginBottom: 2
                            }}>
                                Training Video
                            </Text>
                            <Text style={{
                                color: colors.whiteOpacity(.8),
                                fontSize: responsiveFontSize(1),
                            }}>
                                Tap to watch
                            </Text>
                        </View>

                        {/* Fullscreen Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: colors.blackOpacity(.6),
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Feather name="maximize" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>}

                {/* Dashboard and Join WhatsApp - Row */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 14, marginTop: responsiveHeight(3), gap: 10 }}>
                    {/* Dashboard Card */}
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            onPress={_navigateDashboard}
                            activeOpacity={.7}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 9,
                                paddingLeft: 12,
                                paddingRight: 12,
                                backgroundColor: colors.royalBlue,
                                borderRadius: 8,
                            }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Image style={{ height: 30, width: 30, borderRadius: 16 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/610/610106.png' }} />
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: responsiveFontSize(1.4), fontFamily: 'Inter-Bold' }}>{t('dashboard', 'Dashboard')}</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Join WhatsApp Button */}
                    {whatsapp_link && <TouchableOpacity
                        onPress={() => Linking.openURL(whatsapp_link)}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 9,
                            paddingLeft: 12,
                            paddingRight: 12,
                            backgroundColor: '#25D366',
                            borderRadius: 8,
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 16,
                                width: 30,
                                height: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FontAwesome name="whatsapp" size={20} color="#25D366" />
                            </View>
                            <Text style={{
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: responsiveFontSize(1.4),
                                fontFamily: 'Inter-Bold',
                            }}>
                                {t('joinWhatsApp', 'Join WhatsApp')}
                            </Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#fff" />
                    </TouchableOpacity>}
                </View>



                {isDriver ?
                    <Space height={responsiveFontSize(isIOS() ? 7 : 4.5)} /> : <Space height={responsiveFontSize(isIOS() ? 5 : 0)} />}


                {isDriver && <View>
                    {/* Group 1: Jobs */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5 }}>
                        <Ionicons name="briefcase-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Jos')}</Text>
                    </View>

                    {/* Jobs Row: Available Jobs, Applied Jobs, Jobs That Suit You */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateAvailableJobs} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3281/3281289.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('allAvailableJob', 'All Available Jobs')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateAppliedJobs} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11651/11651437.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('appliedJobs', 'Applied Jobs')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateSuitsJobs} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2966/2966773.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('jobsThatSuitYou', 'Job That Suits You')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Group 2: Training & Certificate */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="school-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Training&Certificate') || 'Training & Certificate'}</Text>
                    </View>
                    {/* Training Row: Training Videos, Health & Hygiene, Quiz Result */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateTraning} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11825/11825158.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('trainingVideo', 'Training Video')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateHealthHygiene} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2382/2382461.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('healthHygieneVideo', 'Health & Hygiene Video')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateQuizResult} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9913/9913576.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('quizResultCertificate', 'Quiz Result & Certificate')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Group 3: Get Verified */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('getVerified') || 'Get Verified'}</Text>
                    </View>
                    {/* Verified Row: ID Check, Court Check, Digital Address */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateIdCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('getIdCheck', 'Get ID Check')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateCourtCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('getCourtCheck', 'Get Court Check')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateDigitalAddressCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3649/3649460.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('getDigitalAddressCheck', 'Get Digital Address Check')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Group 4: Communication */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="chatbubbles-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Communication') || 'Communication'}</Text>
                    </View>
                    {/* Communication Row: Transporter Invitations, Video Interview */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateJobInvitationsList} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6003/6003724.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('jobInviteByTransporter', 'Job Invite by Transporter')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateVideoInterviewInfo} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1256/1256650.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('videoInterviewInvitation', 'Video Interview Invitation')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateCallJobManager} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/724/724664.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>
                                    {t('callJobManager', 'Call Job Manager')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Space height={responsiveFontSize(1.5)} />
                    {/* <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateCallJobManagerList} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('callJobManagerList', 'Call Job List')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateDriverInvites} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/747/747376.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('driverInvites', 'Driver Invites')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateContactUs} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1034/1034131.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('contactUs', 'Contact Us')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View> */}

                    {/* Group 5: Vehicle Verification */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="car-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Vehicle Verification') || 'Vehicle Verification'}</Text>
                    </View>
                    {/* Vehicle Row: RC Check, Challan Check */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateRcCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5, marginTop: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('rcCheck', 'RC Check')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateChallanCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1584/1584961.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('challanCheck', 'Challan Check')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={() => showToast('This feature is coming soon')} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28), position: 'relative' }}>
                                <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#FF6B00', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6 }}>
                                    <Text style={{ color: '#fff', fontSize: responsiveFontSize(0.7), fontWeight: '700' }}>{t('comingSoon', 'Coming Soon')}</Text>
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(4), marginBottom: 0 }}>🚛</Text>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('fastagCheck', 'Fastag Check')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Group 6: Coming Soon */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="time-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('comingSoon')}</Text>
                    </View>
                    {/* Coming Soon Row: Driver Ki Awaz, TruckMitr Driver Loan, TruckMitr Driver Welfare */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateDriverKiAwazInfo} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Text style={{ fontSize: responsiveFontSize(4) }}>🗣️</Text>
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('driverKiAwaz', 'Driver Ki Awaz')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateDriverLoan} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png' }} />
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('truckMitrDriverLoan', 'TruckMitr Driver Loan')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateDriverWelfare} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png' }} />
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('truckMitrDriverWelfare', 'TruckMitr Driver Welfare')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Coming Soon Row 2: Driver Trip Wallet, TruckMitr Dhabha, TruckMitr Suvidha Kendra */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingBottom: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateDriverTripWallet} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/855/855279.png' }} />
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('driverTripWallet', 'Driver Trip Wallet')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateTruckMitrDhaba} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }} />
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('truckMitrDhaba', 'TruckMitr Dhaba')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateTruckMitrSuvidhaKendra} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Text style={{ fontSize: responsiveFontSize(4) }}>🏢</Text>
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('truckMitrSuvidhaKendra', 'TruckMitr Suvidha Kendra')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Coming Soon Row: Convoy */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateConvoy} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'flex-start', paddingTop: responsiveFontSize(2), paddingHorizontal: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28), position: 'relative' }}>
                                <View style={{ height: responsiveFontSize(6), width: responsiveFontSize(6), justifyContent: 'center', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                                    <Text style={{ fontSize: responsiveFontSize(4) }}>🚛</Text>
                                </View>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('convoyTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }} />
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }} />
                    </View>

                    <Space height={responsiveFontSize(4)} />
                </View>}
                {isTransporter && <View>
                    {/* Jobs Management Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="briefcase-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Jobs Management') || 'Jobs Management'}</Text>
                    </View>
                    {/* Row: Add Jobs, View Jobs, View Applications */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateAddJob} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11231/11231532.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`addJobs`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateViewJobs} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2966/2966773.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`viewJobs`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateAppliedJobsTransporter} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11651/11651437.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`viewApplications`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Driver Management Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="people-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Driver Management') || 'Driver Management'}</Text>
                    </View>

                    {/* Row 1: Add Driver, Driver List, Verify Driver */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateAddDriver} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6008/6008817.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`addDriver`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateDriverList} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6012/6012282.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`driverList`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={_navigateTranspoerterVerification} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                                <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                    <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/837/837732.png' }} />
                                    <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t(`getYourDriverVerified`)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>


                    {/* Vehicle Verification Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="car-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Vehicle Verification') || 'Vehicle Verification'}</Text>
                    </View>
                    {/* Vehicle Row: RC Check, Challan Check */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateRcCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5, marginTop: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('rcCheck', 'RC Check')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateChallanCheck} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1584/1584961.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('challanCheck', 'Challan Check')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <View style={{ flex: 1 }} />
                    </View>

                    {/* Communication Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="chatbubbles-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('Communication') || 'Communication'}</Text>
                    </View>
                    {/* Communication Row: Invite Driver, Video Interview, Call Job Manager */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateInviteDriver} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6003/6003724.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('inviteDriverForJob', 'Invite Driver for a Job')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateVideoInterviewInfo} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1256/1256650.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('videoInterviewInvitation', 'Video Interview Invitation')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateCallJobManager} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/724/724664.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('callJobManager', 'Call Job Manager')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Coming Soon Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: responsiveWidth(4), marginBottom: 5, marginTop: 15 }}>
                        <Ionicons name="time-outline" size={20} color={colors.royalBlue} />
                        <Text style={{ marginLeft: 8, fontSize: responsiveFontSize(2), fontWeight: '700', color: colors.royalBlue }}>{t('comingSoon')}</Text>
                    </View>

                    {/* Row 1: TM Load Mandal, Fuel Discount, Transporter Tailored Loan */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateTMLoadMandal} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2271/2271113.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('tmLoadMandalTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateFuelDiscount} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Image style={{ height: responsiveFontSize(5), width: responsiveFontSize(5), marginBottom: 5 }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2311/2311324.png' }} />
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('fuelDiscountTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateTransporterLoan} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Text style={{ fontSize: responsiveFontSize(3), marginBottom: 5 }}>💰</Text>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('transporterLoanTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Row 2: Truck Insurance, Second Hand Truck, Fleet Management */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: responsiveWidth(4), paddingBottom: responsiveWidth(3) }}>
                        <TouchableOpacity onPress={_navigateTruckInsurance} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Text style={{ fontSize: responsiveFontSize(3), marginBottom: 5 }}>🛡️</Text>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('truckInsuranceTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateSecondHandTruckMarketplace} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Text style={{ fontSize: responsiveFontSize(3), marginBottom: 5 }}>🚛</Text>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('secondHandTruckTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                        <Space width={responsiveFontSize(1.5)} />
                        <TouchableOpacity onPress={_navigateFleetManagementSolution} activeOpacity={.7} style={{ flex: 1, backgroundColor: colors.white, ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.16) : colors.blackOpacity(.3), borderRadius: 10 }}>
                            <View style={{ flex: 1, width: '100%', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: responsiveFontSize(0.5), borderRadius: 10, borderColor: colors.blackOpacity(.1), borderWidth: 1, minHeight: responsiveWidth(28) }}>
                                <Text style={{ fontSize: responsiveFontSize(3), marginBottom: 5 }}>📊</Text>
                                <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.4), fontWeight: '600', textAlign: 'center' }}>{t('fleetManagementTitle')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>}
                {showLottie && <View style={{ height: responsiveHeight(100), width: responsiveWidth(100), alignItems: 'center', justifyContent: 'center', position: 'absolute', pointerEvents: 'none' }}>
                    <LottieView style={{ height: responsiveHeight(50), width: responsiveWidth(70) }} source={require('@truckmitr/res/lotties/boom.json')} autoPlay loop />
                </View>}
                {/* {isTransporter && <>
                    <Space height={responsiveHeight(2)} />
                    <View style={{ backgroundColor: colors.royalBlueOpacity(.9), padding: responsiveWidth(5) }}>
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.4), fontWeight: 'bold' }}>{t(`elevatingTheIndianTitle`)}</Text>
                        <Text style={{ color: colors.whiteOpacity(.8), fontSize: responsiveFontSize(1.6), fontWeight: '400' }}>{t(`elevatingTheIndianSubTitle`)}</Text>
                    </View>
                    <View style={{ width: responsiveWidth(100), backgroundColor: colors.royalBlueOpacity(.02) }}>
                        <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), textAlign: 'center', fontWeight: '500', margin: responsiveFontSize(1.5) }}>{`© 2025 TruckMitr Corporate Services Private Limited. \nAll Rights Reserved.`}</Text>
                    </View>
                </>} */}
            </ScrollView>

            {/* Draggable Floating Reel-Style Video Player */}
            {isDriver && !isMinimized && <Animated.View
                {...panResponder.panHandlers}
                style={isFullScreen ? {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.black,
                    zIndex: 9999,
                } : {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    position: 'absolute',
                    right: 15,
                    bottom: 80,
                    width: responsiveWidth(28),
                    height: responsiveHeight(25),
                    backgroundColor: colors.black,
                    borderRadius: 16,
                    ...shadow,
                    shadowColor: colors.blackOpacity(.4),
                    elevation: 10,
                    zIndex: 999,
                    overflow: 'hidden'
                }}>
                {/* Video Component - Loading from API */}
                <Video
                    source={{ uri: videoUrl }}
                    muted={isMuted}
                    style={{ width: '100%', height: '100%', backgroundColor: colors.black }}
                    resizeMode={isFullScreen ? "contain" : "cover"}
                    controls={false}
                    repeat={true}
                    paused={!isPlaying}
                    onError={(e: any) => console.log('Video Error:', e)}
                />

                {/* Custom Overlay - Always visible */}
                <TouchableWithoutFeedback onPress={() => {
                    if (isFullScreen) {
                        setShowControls(!showControls);
                    } else {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        setIsFullScreen(true);
                    }
                }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>

                        {/* Dark Overlay - visible when paused or controls shown */}
                        {(!isPlaying || (isFullScreen && showControls)) && <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: colors.blackOpacity(.3)
                        }} />}

                        {/* Top Controls Bar - Hide when controls hidden in fullscreen */}
                        {(!isFullScreen || showControls) && (
                            <View style={{
                                position: 'absolute',
                                top: isFullScreen ? responsiveHeight(4) : 0,
                                left: 0,
                                right: 0,
                                flexDirection: 'row',
                                justifyContent: isFullScreen ? 'space-between' : 'flex-end',
                                padding: 8,
                                zIndex: 30
                            }}>
                                {/* Mute/Unmute Button - Only in Fullscreen */}
                                {isFullScreen && (
                                    <TouchableOpacity
                                        onPress={() => setIsMuted(!isMuted)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                        style={{
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: 5,
                                            zIndex: 1000
                                        }}
                                    >
                                        <Feather name={isMuted ? "volume-x" : "volume-2"} size={24} color="#fff" />
                                    </TouchableOpacity>
                                )}
                                {/* Close/Stop Button - Simplified */}
                                <TouchableOpacity
                                    onPress={() => {
                                        if (isFullScreen) {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setIsFullScreen(false);
                                            // Keep playing when exiting fullscreen
                                        } else {
                                            setIsPlaying(false);
                                            setIsMinimized(true);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 5,
                                        zIndex: 1000
                                    }}
                                >
                                    <Feather name="x" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Center Play/Pause Button - Hide in mini mode, show in fullscreen when controls visible or paused */}
                        {isFullScreen && (showControls || !isPlaying) && (
                            <TouchableOpacity
                                onPress={() => setIsPlaying(!isPlaying)}
                                activeOpacity={0.8}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: [{ translateX: -20 }, { translateY: -20 }],
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: colors.whiteOpacity(.9),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 2,
                                    borderColor: colors.white,
                                    zIndex: 30
                                }}
                            >
                                <Feather name={isPlaying ? "pause" : "play"} size={18} color={colors.royalBlue} style={{ marginLeft: isPlaying ? 0 : 2 }} />
                            </TouchableOpacity>
                        )}

                        {/* Carousel Navigation - Arrows (Only in Fullscreen & when controls shown) */}
                        {isFullScreen && videoUrls.length > 1 && showControls && (
                            <>
                                {/* Previous Video Button */}
                                <TouchableOpacity
                                    onPress={goToPreviousVideo}
                                    style={{
                                        position: 'absolute',
                                        left: 20,
                                        top: '50%',
                                        marginTop: -20,
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: colors.blackOpacity(.5),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 30
                                    }}
                                >
                                    <Feather name="chevron-left" size={24} color={colors.white} />
                                </TouchableOpacity>

                                {/* Next Video Button */}
                                <TouchableOpacity
                                    onPress={goToNextVideo}
                                    style={{
                                        position: 'absolute',
                                        right: 20,
                                        top: '50%',
                                        marginTop: -20,
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: colors.blackOpacity(.5),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 30
                                    }}
                                >
                                    <Feather name="chevron-right" size={24} color={colors.white} />
                                </TouchableOpacity>

                                {/* Pagination Dots */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: 80,
                                    left: 0,
                                    right: 0,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 30
                                }}>
                                    {videoUrls.map((_, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: currentVideoIndex === index ? colors.white : colors.whiteOpacity(.4),
                                                marginHorizontal: 4
                                            }}
                                        />
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Empty view to satisfy flex justifyContent space-between if needed */}
                        <View />



                    </View>
                </TouchableWithoutFeedback>

            </Animated.View>}

            {/* Minimized Floating Icon */}
            {isDriver && isMinimized && (
                <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                        transform: [{ translateX: pan.x }, { translateY: pan.y }],
                        position: 'absolute',
                        right: 15,
                        bottom: 150, // Adjusted starting position slightly higher or as needed
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: colors.black,
                        zIndex: 999,
                        ...shadow,
                        shadowColor: colors.blackOpacity(.4),
                        elevation: 10,
                        overflow: 'hidden' // Ensure border radius clips content
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            setIsMinimized(false);
                            setIsPlaying(true);
                        }}
                        activeOpacity={0.8}
                        style={{
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: colors.white,
                            borderRadius: 25,
                            backgroundColor: colors.black // Ensure solid black
                        }}
                    >
                        <Feather name="play" size={20} color={colors.white} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Add Driver Options Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={addDriverModal}
                onRequestClose={() => setAddDriverModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setAddDriverModal(false)}
                >
                    <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 20, width: responsiveWidth(85), maxWidth: 350 }}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <FontAwesome6 name="user-plus" size={28} color={colors.royalBlue} />
                            </View>
                            <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>
                                {t('addDriver', 'Add Driver')}
                            </Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B', textAlign: 'center' }}>
                                {t('chooseHowToAddDriver', 'Choose how you want to add drivers')}
                            </Text>
                        </View>

                        {/* Add Single Driver Option */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: '#E2E8F0'
                            }}
                            onPress={() => {
                                setAddDriverModal(false);
                                navigation.navigate(STACKS.ADD_SINGLE_DRIVER_INFO);
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <FontAwesome6 name="user" size={20} color={colors.royalBlue} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B' }}>
                                    {t('addSingleDriver', 'Add Single Driver')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>
                                    {t('addOneDriverManually', 'Add one driver manually')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Add Multiple Drivers Option */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: '#E2E8F0'
                            }}
                            onPress={() => {
                                setAddDriverModal(false);
                                navigation.navigate(STACKS.ADD_DRIVER);
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <FontAwesome6 name="users" size={20} color="#16A34A" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B' }}>
                                    {t('addMultipleDrivers', 'Add Multiple Drivers')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>
                                    {t('bulkAddDrivers', 'Bulk add drivers via Excel')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={() => setAddDriverModal(false)}
                            style={{ padding: 14, alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontWeight: '500' }}>
                                {t('cancel', 'Cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View >
    )
})

export default Home