import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Category Card Component
interface CategoryCardProps {
    title: string;
    subtitle: string;
    icon: any;
    iconType?: 'ionicons' | 'feather' | 'material' | 'image' | 'localImage';
    iconColor?: string;
    onPress: () => void;
    style?: any;
    iconSize?: number;
    titleStyle?: any;
    subtitleStyle?: any;
}

interface CategoryData {
    id: number;
    title: string;
    subtitle: string;
    icon: any;
    iconType: 'ionicons' | 'feather' | 'material' | 'image' | 'localImage';
    iconColor: string;
}

const CategoryCard = ({ title, subtitle, icon, iconType = 'ionicons', iconColor = '#6E7CF5', onPress, style, iconSize = 28, titleStyle, subtitleStyle }: CategoryCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const renderIcon = () => {
        switch (iconType) {
            case 'feather':
                return <Feather name={icon} size={iconSize} color={iconColor} />;
            case 'material':
                return <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />;
            case 'image':
                return <Image source={{ uri: icon }} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />;
            case 'localImage':
                return <Image source={icon} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />;
            default:
                return <Ionicons name={icon} size={iconSize} color={iconColor} />;
        }
    };

    return (
        <TouchableWithoutFeedback onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
            <Animated.View style={[styles.categoryCard, style, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.iconContainer, { width: iconSize * 1.5, height: iconSize * 1.5, borderRadius: iconSize / 2.5 }]}>
                    {renderIcon()}
                </View>
                <Text style={[styles.cardTitle, titleStyle]}>{title}</Text>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

// Bottom Tab Item Component
interface BottomTabItemProps {
    icon: string;
    label: string;
    isActive: boolean;
    onPress: () => void;
}

// const BottomTabItem = ({ icon, label, isActive, onPress, customIcon }: BottomTabItemProps & { customIcon?: React.ReactNode }) => {
//     return (
//         <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
//             <View style={[styles.tabIconContainer, isActive && styles.tabIconContainerActive]}>
//                 {customIcon ? customIcon : (
//                     <Ionicons
//                         name={isActive ? icon : `${icon}-outline`}
//                         size={22}
//                         color={isActive ? '#6E7CF5' : '#64748B'}
//                     />
//                 )}
//                 {isActive && <Text style={styles.tabLabel}>{label}</Text>}
//             </View>
//         </TouchableOpacity>
//     );
// };



const myPilotsIcon = require('../../../../assets/my_pilots.png');
const pendingTrainingIcon = require('../../../../assets/pending_training_icon.png');
const pendingSubscriptionIcon = require('../../../../assets/pending_subscription_icon.png');
const jobsIcon = require('../../../../assets/jobs.png');
const expiringDocumentsIcon = require('../../../../assets/expiring_documents.png');
const pendingProfileIcon = require('../../../../assets/pending_profile.png');
const thisMonthEarningIcon = require('../../../../assets/this_month_earning.png');
const todaysEarningIcon = require('../../../../assets/todays_earning.png');
const verifiedDriverIcon = require('../../../../assets/verified_driver.png');
const trustedDriverIcon = require('../../../../assets/trusted_driver.png');
const jobApplicationIcon = require('../../../../assets/job_application.png');

export default function ForemanHome() {
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const [activeTab, setActiveTab] = React.useState('categories');

    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    const { user, profileCompletion } = useSelector((state: RootState) => state.user);

    const foremanName = user?.name || 'User';
    const dynamicTMID = user?.unique_id || 'TMID';
    const dynamicProfileCompletion = Number(profileCompletion) || 0;
    const star_rating = user?.star_rating || 0;
    const rank = user?.rank || 'No Rank';

    // SVG circle calculations
    const size = responsiveFontSize(8);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (dynamicProfileCompletion / 100) * circumference;


    // Category data for Foreman
    const categories: CategoryData[] = [
        {
            id: 1,
            title: 'My\nPilots',
            subtitle: 'View all pilots',
            icon: myPilotsIcon,
            iconType: 'localImage',
            iconColor: '#4A90D9',
        },
        {
            id: 2,
            title: 'Verified\nDriver',
            subtitle: 'Verified drivers',
            icon: verifiedDriverIcon,
            iconType: 'localImage',
            iconColor: '#22C55E',
        },
        {
            id: 3,
            title: 'Trusted\nDriver',
            subtitle: 'Trusted drivers',
            icon: trustedDriverIcon,
            iconType: 'localImage',
            iconColor: '#3B82F6',
        },
        {
            id: 4,
            title: 'Jobs',
            subtitle: 'Available jobs',
            icon: jobsIcon,
            iconType: 'localImage',
            iconColor: '#27AE60',
        },
        {
            id: 5,
            title: 'Applications',
            subtitle: 'View applications',
            icon: jobApplicationIcon,
            iconType: 'localImage',
            iconColor: '#9B59B6',
        },
        {
            id: 6,
            title: 'Recruitments',
            subtitle: 'Hire new pilots',
            icon: 'https://cdn-icons-png.flaticon.com/512/3207/3207604.png',
            iconType: 'image',
            iconColor: '#9B59B6',
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ height: responsiveHeight(42), width: responsiveWidth(100), borderBottomLeftRadius: 60, borderBottomRightRadius: 60, marginBottom: responsiveHeight(1.5) }}>
                    {/* Banner Background */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 60, borderBottomRightRadius: 60, overflow: 'hidden' }}>
                        <Image
                            style={{ width: '100%', height: '100%' }}
                            source={require('../../../../assets/foreman_banner_1.jpeg')}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Header Content */}
                    <View style={{ paddingTop: safeAreaInsets.top, paddingHorizontal: responsiveWidth(3) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>{`Hello, ${foremanName} 👋`}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>{dynamicTMID}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(1.8) }}>{rank}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.2), fontStyle: 'italic', lineHeight: responsiveFontSize(1.6) }}>Certified TruckMitr Partner</Text>
                            </View>

                            <TouchableOpacity style={{ alignItems: 'center' }}
                            //  onPress={() => navigation.navigate(STACKS.PROFILE_EDIT_FOREMAN as any)}
                            >
                                <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                                    <Svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
                                        <Defs>
                                            <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                                                <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                                            </SvgGradient>
                                        </Defs>
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
                                    <Image
                                        style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }}
                                        source={{ uri: user?.images || user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                                    />
                                    <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${dynamicProfileCompletion}%`}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: responsiveFontSize(1.5), gap: 2 }}>
                                    {/* {Array.from({ length: 5 }).map((_, i) => (
                                    <FontAwesome
                                        key={i}
                                        name={i < star_rating ? 'star' : 'star-o'}
                                        size={responsiveFontSize(1.6)}
                                        color={i < star_rating ? '#FFD700' : 'rgba(0,0,0,0.2)'}
                                    />
                                ))} */}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', bottom: -responsiveHeight(1.5), width: responsiveWidth(92), flexDirection: 'row', height: responsiveHeight(6), alignSelf: 'center', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'space-between', borderColor: '#000', borderWidth: 1.5, borderRadius: 100, paddingHorizontal: responsiveWidth(3), ...shadow, zIndex: 100, elevation: 10 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: 'rgba(0,0,0,0.9)', fontWeight: '500' }}>Search Drivers</Text>
                        <Feather name={'search'} size={18} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View style={styles.contentContainer}>
                    {/* Quick Action Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 0 }}>
                        <Ionicons name="flash-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>Quick Action</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
                        {/* Dashboard Card */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(STACKS.FOREMAN_DASHBOARD as any)}
                            style={{
                                width: '48%',
                                backgroundColor: '#F5A623',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                elevation: 4,
                                shadowColor: '#F5A623',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                    <Svg width={18} height={18} viewBox="0 0 24 24">
                                        <Path d="M3 13h8V3H3v10z" fill="#4285F4" />
                                        <Path d="M3 21h8v-6H3v6z" fill="#34A853" />
                                        <Path d="M13 21h8V11h-8v10z" fill="#EA4335" />
                                        <Path d="M13 9h8V3h-8v6z" fill="#FBBC05" />
                                    </Svg>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Dashboard</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color="#fff" />
                        </TouchableOpacity>

                        {/* Add Driver Card */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as any)}
                            style={{
                                width: '48%',
                                backgroundColor: '#6E7CF5',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                elevation: 4,
                                shadowColor: '#6E7CF5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                    <Svg width={18} height={18} viewBox="0 0 24 24">
                                        {/* Head */}
                                        <Path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#6E7CF5" />
                                        {/* Body */}
                                        <Path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#6E7CF5" />
                                        {/* Plus Sign */}
                                        <Path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z" fill="#34A853" />
                                    </Svg>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Add Driver</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* My Earnings Section */}
                    <View style={{ marginBottom: 32 }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate(STACKS.FOREMAN_MY_EARNINGS as any)}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="wallet-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>My Earnings</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#64748B" />
                        </TouchableOpacity>

                        {/* Earnings Cards Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            {/* Today's Earning Card */}
                            <View style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={todaysEarningIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Today's</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Earning</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#22C55E' }}>₹ 2<Text style={{ fontFamily: 'serif', fontSize: 20 }}>,</Text>450</Text>
                            </View>

                            {/* This Month Earning Card */}
                            <View style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={thisMonthEarningIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>This Month</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Earning</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#3B82F6' }}>₹ 45<Text style={{ fontFamily: 'serif', fontSize: 20 }}>,</Text>800</Text>
                            </View>
                        </View>

                        {/* Progress Bar Section */}
                        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E' }}>Silver Foreman</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#B45309' }}>Gold Foreman</Text>
                            </View>
                            <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                                <View style={{ width: '91%', height: '100%', backgroundColor: '#F59E0B', borderRadius: 5 }} />
                            </View>
                            <Text style={{ fontSize: 11, color: '#92400E', marginTop: 8 }}>You are 9 drivers away from Gold Foreman</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#B45309', marginTop: 2 }}>Earn +5% extra commission</Text>
                        </View>
                    </View>

                    {/* Action Required Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="warning-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>Action Required</Text>
                        </View>

                        {/* Row 1 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            {/* Card 1: Pending Profile */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(STACKS.FOREMAN_PENDING_PROFILES as any)}
                                style={{ width: '48%', backgroundColor: '#FFF7ED', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingProfileIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Pending</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Profile</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#F59E0B" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>14 profiles need review</Text>
                            </TouchableOpacity>

                            {/* Card 2: Pending Subscription */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(STACKS.FOREMAN_PENDING_SUBSCRIPTION as any)}
                                style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingSubscriptionIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Pending</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Subscription</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#6366F1" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Renewal due soon</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 2 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {/* Card 3: Pending Training */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(STACKS.FOREMAN_PENDING_TRAINING as any)}
                                style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingTrainingIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Pending</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Training</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#6366F1" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>3 trainings in progress</Text>
                            </TouchableOpacity>

                            {/* Card 4: Expiring Documents */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(STACKS.FOREMAN_EXPIRING_DOCUMENTS as any)}
                                style={{ width: '48%', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={expiringDocumentsIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Expiring</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>Documents</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#EF4444" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>5 documents expiring soon</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Category Grid */}
                    {/* Account Status Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={colors.royalBlue} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>My Drivers</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {categories.slice(0, 3).map((item) => (
                                <CategoryCard
                                    key={item.id}
                                    {...item}
                                    style={{ width: '30%', padding: 8, height: 120, justifyContent: 'flex-start', paddingTop: 16 }}
                                    iconSize={36}
                                    titleStyle={{ fontSize: 10, textAlign: 'center', marginTop: 0, lineHeight: 14 }}
                                    onPress={() => {
                                        if (item.id === 1) {
                                            navigation.navigate(STACKS.FOREMAN_MY_PILOTS as any);
                                        } else if (item.id === 2) {
                                            navigation.navigate(STACKS.FOREMAN_VERIFIED_DRIVERS as any);
                                        } else if (item.id === 3) {
                                            navigation.navigate(STACKS.FOREMAN_TRUSTED_DRIVERS as any);
                                        } else {
                                            console.log(item.title);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Jobs Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="briefcase-outline" size={18} color={colors.royalBlue} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>Jobs & Recruitments</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {categories.slice(3, 6).map((item) => (
                                <CategoryCard
                                    key={item.id}
                                    {...item}
                                    style={{ width: '30%', padding: 8, height: 120, justifyContent: 'flex-start', paddingTop: 16 }}
                                    iconSize={36}
                                    titleStyle={{ fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 }}
                                    onPress={() => {
                                        if (item.id === 4) {
                                            navigation.navigate(STACKS.FOREMAN_JOBS_LIST as any);
                                        } else {
                                            console.log(item.title);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>


                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            {/* <View style={[styles.bottomNav, { paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 8 }]}>
                <BottomTabItem
                    icon="grid"
                    label="Categories"
                    isActive={activeTab === 'categories'}
                    onPress={() => setActiveTab('categories')}
                />
                <BottomTabItem
                    icon="person"
                    label="Profile"
                    isActive={activeTab === 'profile'}
                    onPress={() => setActiveTab('profile')}
                />
                <BottomTabItem
                    icon="person-add"
                    label="Add Driver"
                    isActive={activeTab === 'addDriver'}
                    onPress={() => {
                        setActiveTab('addDriver');
                        navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as any);
                    }}
                />
                <BottomTabItem
                    icon="wallet"
                    label="My Earning"
                    isActive={activeTab === 'earning'}
                    onPress={() => {
                        // setActiveTab('earning');
                        // navigation.navigate(STACKS.FOREMAN_EARNINGS as any);
                    }}
                />
                <BottomTabItem
                    icon="bookmark"
                    label="Saved"
                    isActive={activeTab === 'saved'}
                    onPress={() => setActiveTab('saved')}
                />
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Header Styles
    headerWrapper: {
        position: 'relative',
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    archContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        transform: [{ translateY: 39 }],
    },

    // Profile Section with Status
    profileSection: {
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    statusText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#fff',
    },

    // Profile with Progress Ring
    profileContainer: {
        position: 'relative',
        width: 58,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    percentageBadge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fff',
    },
    percentageText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#1E293B',
    },

    // Greeting Styles
    greetingContainer: {
        flex: 1,
    },
    greetingLine1: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '400',
    },
    greetingName: {
        fontWeight: '700',
    },
    greetingLine2: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },

    // Search Bar Styles
    searchWrapper: {
        paddingHorizontal: 20,
        marginTop: 20,
        zIndex: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 0,
    },

    // Curve Styles
    curveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        transform: [{ translateY: 29 }],
    },

    // Content Styles
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },

    // Category Grid Styles
    addDriverCard: {
        backgroundColor: '#6E7CF5',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#6E7CF5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    addDriverIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    addDriverTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    addDriverSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    categoryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F8FAFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
    },

    // Bottom Navigation Styles
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    tabIconContainerActive: {
        backgroundColor: 'rgba(110, 124, 245, 0.1)',
        paddingHorizontal: 16,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6E7CF5',
    },
});
