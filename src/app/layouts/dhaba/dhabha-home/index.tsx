import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';


type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Quick Action Card Component
interface QuickActionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    bgColor?: string;
    borderColor?: string;
    iconBgColor?: string; // New prop for icon background color
    onPress?: () => void;
}

const QuickActionCard = ({ icon, title, subtitle, bgColor = '#FFFFFF', borderColor = '#E5E7EB', iconBgColor = '#FFFFFF', onPress }: QuickActionCardProps) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={{
                backgroundColor: bgColor,
                borderRadius: 16,
                padding: 10,
                width: '48%',
                borderWidth: 1,
                borderColor: borderColor,
                minHeight: 80,
                justifyContent: 'space-between'
            }}
        >
            <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', flex: 1, marginRight: 2, alignItems: 'center' }}>
                        <View style={{ backgroundColor: iconBgColor, borderRadius: 8, padding: 6, justifyContent: 'center', alignItems: 'center' }}>
                            {icon}
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937', marginLeft: 8, flex: 1, lineHeight: 16 }}>
                            {title}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginTop: 2 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#6B7280', lineHeight: 12, fontWeight: '500' }}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
};

// Driver Item Component
interface DriverItemProps {
    name: string;
    distance: string;
    activeTime: string;
    avatarUrl: string;
}

const DriverItem = ({ name, distance, activeTime, avatarUrl }: DriverItemProps) => {
    return (
        <View style={styles.driverItem}>
            <Image
                source={{ uri: avatarUrl }}
                style={styles.driverAvatar}
            />
            <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                    <Text style={{ fontWeight: '700' }}>{name}</Text>
                    <Text style={{ color: '#64748B', fontWeight: '400' }}> - {distance} • Active {activeTime}</Text>
                </Text>
            </View>
        </View>
    );
};

// Bottom Tab Item Component
interface BottomTabItemProps {
    icon: string;
    iconType?: 'ionicons' | 'material' | 'feather';
    label: string;
    isActive: boolean;
    onPress?: () => void;
}

const BottomTabItem = ({ icon, iconType = 'ionicons', label, isActive, onPress }: BottomTabItemProps) => {
    const getIcon = () => {
        const color = isActive ? '#1E3A5F' : '#64748B';
        const size = 22;

        switch (iconType) {
            case 'material':
                return <MaterialCommunityIcons name={icon} size={size} color={color} />;
            case 'feather':
                return <Feather name={icon} size={size} color={color} />;
            default:
                return <Ionicons name={icon} size={size} color={color} />;
        }
    };

    return (
        <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
            {getIcon()}
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
};

export default function DhabhaHome() {
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();


    const [activeTab, setActiveTab] = React.useState('home');

    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    // Banner Data
    const profileCompletion = 85;
    const star_rating = 5;
    const size = responsiveFontSize(8);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (profileCompletion / 100) * circumference;

    // Mock data
    const dhabaName = 'Sharma Dhaba';
    const walletBalance = 240;
    const totalEarned = 320;
    const totalRedeemed = 80;

    // Nearby drivers data
    const nearbyDrivers = [
        { name: 'Rajesh', distance: '2.3 km', activeTime: '5 min ago', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { name: 'Amit', distance: '3.1 km', activeTime: '10 min ago', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ];

    // Field agent data
    const fieldAgent = {
        name: t('yourFieldAgent'),
        zone: 'Panipat Zone',
        avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Banner Section */}
                <View style={{ height: responsiveHeight(42), width: responsiveWidth(100), borderBottomLeftRadius: 60, borderBottomRightRadius: 60, marginBottom: responsiveHeight(1.5) }}>
                    {/* Banner Background */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 60, borderBottomRightRadius: 60, overflow: 'hidden' }}>
                        <Image
                            style={{ width: '100%', height: '100%' }}
                            source={require('../../../../assets/dhabha_banner.jpeg')}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Header Content */}
                    <View style={{ paddingTop: safeAreaInsets.top + 10, paddingHorizontal: responsiveWidth(3) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>{`${t('hello')}, ${dhabaName} 👋`}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>TM2503DB001</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(1.8) }}>{t('premiumDhaba')}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.2), fontStyle: 'italic', lineHeight: responsiveFontSize(1.6) }}>{t('verifiedPartner')}</Text>
                            </View>

                            <TouchableOpacity style={{ alignItems: 'center' }} activeOpacity={0.8}
                            //  onPress={() => navigation.navigate(STACKS.DHABHA_MY_PROFILE as any)}
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
                                    <Image style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }} source={{ uri: fieldAgent.avatar }} />
                                    <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${profileCompletion}%`}</Text>
                                    </View>
                                </View>

                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', bottom: -responsiveHeight(1.5), width: responsiveWidth(92), flexDirection: 'row', height: responsiveHeight(6), alignSelf: 'center', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'space-between', borderColor: '#000', borderWidth: 1.5, borderRadius: 100, paddingHorizontal: responsiveWidth(3), ...shadow, zIndex: 100, elevation: 10 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: 'rgba(0,0,0,0.9)', fontWeight: '500' }}>{t('searchDrivers')}</Text>
                        <Feather name={'search'} size={18} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>

                <View style={styles.scrollContent}>
                    {/* Welcome Text Removed */}

                    {/* Wallet Balance Card - Orange Theme (Pixel Perfect) */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        // onPress={() => navigation.navigate(STACKS.DHABHA_WALLET as any)}
                        style={{
                            marginBottom: 12,
                            marginTop: responsiveHeight(1),
                            borderRadius: 16,
                            overflow: 'hidden',
                            ...shadow,
                            shadowColor: '#F97316',
                            shadowOpacity: 0.25,
                            shadowOffset: { width: 0, height: 4 },
                            shadowRadius: 12,
                            elevation: 6
                        }}>
                        {/* Main Orange Section */}
                        <LinearGradient
                            colors={['#FB923C', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                paddingTop: responsiveHeight(1),
                                paddingHorizontal: 16,
                                paddingBottom: responsiveHeight(1.5),
                            }}
                        >
                            {/* Title - Left Aligned with Divider */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.6),
                                    fontWeight: '600',
                                    color: 'rgba(255,255,255,0.9)',
                                    marginRight: 12
                                }}>
                                    {t('walletBalance')}
                                </Text>
                                <View style={{
                                    height: 1,
                                    flex: 1,
                                    backgroundColor: 'rgba(255,255,255,0.3)'
                                }} />
                            </View>

                            {/* Balance Display - Center Aligned */}
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={{
                                        fontSize: responsiveFontSize(4.5),
                                        fontWeight: '900',
                                        color: '#FFFFFF',
                                        marginRight: 4
                                    }}>₹</Text>
                                    <Text style={{
                                        fontSize: responsiveFontSize(4.5),
                                        fontWeight: '900',
                                        color: '#FFFFFF',
                                        letterSpacing: -1.5
                                    }}>{walletBalance}</Text>
                                </View>
                                {/* Available Balance - Center */}
                                <Text style={{
                                    fontSize: responsiveFontSize(1.3),
                                    color: '#FFFFFF',
                                    fontWeight: '700',
                                    marginTop: responsiveHeight(0.3)
                                }}>
                                    {t('availableBalance')}
                                </Text>
                            </View>
                        </LinearGradient>

                        {/* Stats Section - Light Orange Background */}
                        <View style={{
                            backgroundColor: '#FED7AA',
                            paddingVertical: 1,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Total Earned */}
                            <Text style={{ fontSize: responsiveFontSize(1.3), color: '#9A3412', fontWeight: '500' }}>
                                {t('totalEarnedLabel')}: <Text style={{ fontWeight: '700' }}>₹{totalEarned}</Text>
                            </Text>

                            {/* Divider */}
                            <View style={{
                                width: 1,
                                height: 12,
                                backgroundColor: '#EA580C',
                                marginHorizontal: 12,
                                opacity: 0.5
                            }} />

                            {/* Total Redeemed */}
                            <Text style={{ fontSize: responsiveFontSize(1.3), color: '#9A3412', fontWeight: '500' }}>
                                {t('totalRedeemedLabel')}: <Text style={{ fontWeight: '700' }}>₹{totalRedeemed}</Text>
                            </Text>
                        </View>

                        {/* White Section with Button */}
                        <View style={{
                            backgroundColor: '#FFFFFF',
                            paddingVertical: 3,
                            paddingHorizontal: 16,
                            alignItems: 'center'
                        }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: '#F97316',
                                    borderRadius: 25,
                                    paddingVertical: 4,
                                    paddingHorizontal: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...shadow,
                                    shadowColor: '#EA580C',
                                    shadowOpacity: 0.3,
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowRadius: 6,
                                    elevation: 4
                                }}
                            >
                                <Text style={{
                                    color: '#FFFFFF',
                                    fontWeight: '700',
                                    fontSize: responsiveFontSize(1.6),
                                    marginRight: 6
                                }}>
                                    {t('redeemMoney')}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                    {/* Add Driver Card - Green Theme (Pixel Perfect) */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={{ marginBottom: 16 }}
                    // onPress={() => navigation.navigate(STACKS.DHABHA_ADD_DRIVER as any)}
                    >
                        <LinearGradient
                            colors={['#16A34A', '#15803D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 16,
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                alignItems: 'center',
                                ...shadow,
                                shadowColor: '#16A34A',
                                shadowOpacity: 0.3,
                                shadowOffset: { width: 0, height: 3 },
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            {/* Title with + and ₹10 */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(2.2),
                                    fontWeight: '800',
                                    color: '#FFFFFF'
                                }}>
                                    {t('addDriverAndEarn')}{' '}
                                </Text>
                                <Text style={{
                                    fontSize: responsiveFontSize(2.2),
                                    fontWeight: '800',
                                    color: '#FDE047'
                                }}>
                                    ₹10
                                </Text>
                            </View>

                            {/* Subtitle */}
                            <Text style={{
                                fontSize: responsiveFontSize(1.35),
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: '500',
                                textAlign: 'center'
                            }}>
                                {t('addDriversUsingReferral')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>



                    {/* Quick Actions Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
                        <LinearGradient
                            colors={['#FFF7ED', '#FFEDD5']}
                            style={{ padding: 8, borderRadius: 10, marginRight: 10 }}
                        >
                            <Ionicons name="apps-outline" size={20} color="#EA580C" />
                        </LinearGradient>
                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '700', color: '#1F2937', letterSpacing: 0.5 }}>{t('quickActions')}</Text>
                    </View>

                    {/* Quick Actions Grid */}
                    <View style={[styles.quickActionsGrid, { flexDirection: 'column' }]}>
                        {/* Row 1 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <QuickActionCard
                                icon={
                                    <Image
                                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                                        style={{ width: 28, height: 28 }}
                                        resizeMode="contain"
                                    />
                                }
                                title={t('myReferrals')}
                                subtitle={t('viewAddedDrivers')}
                                bgColor="#FFF7ED"
                                borderColor="#E5E7EB"
                                iconBgColor="#FED7AA" // Darker than card bg (#FFF7ED)
                            // onPress={() => navigation.navigate(STACKS.DHABHA_MY_REFERRALS as any)}
                            />
                            <QuickActionCard
                                icon={
                                    <Image
                                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2460/2460470.png' }}
                                        style={{ width: 28, height: 28 }}
                                        resizeMode="contain"
                                    />
                                }
                                title={t('wallet')}
                                subtitle={t('transactionsAndPayouts')}
                                bgColor="#F0F9FF"
                                borderColor="#E5E7EB"
                                iconBgColor="#BAE6FD" // Darker than card bg (#F0F9FF)
                            // onPress={() => navigation.navigate(STACKS.DHABHA_WALLET as any)}
                            />
                        </View>

                        {/* Row 2 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <QuickActionCard
                                icon={
                                    <Image
                                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/854/854878.png' }}
                                        style={{ width: 28, height: 28 }}
                                        resizeMode="contain"
                                    />
                                }
                                title={t('nearbyDriversRadius')}
                                subtitle={t('truckmitrDriversNearYou')}
                                bgColor="#FEF2F2"
                                borderColor="#E5E7EB"
                                iconBgColor="#FECACA" // Darker than card bg (#FEF2F2)
                            // onPress={() => navigation.navigate(STACKS.DHABHA_NEARBY as any)}
                            />
                            <QuickActionCard
                                icon={
                                    <Image
                                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }}
                                        style={{ width: 28, height: 28 }}
                                        resizeMode="contain"
                                    />
                                }
                                title={t('myDhaba')}
                                subtitle={t('photosAndFacilities')}
                                bgColor="#F0FDF4"
                                borderColor="#E5E7EB"
                                iconBgColor="#BBF7D0" // Darker than card bg (#F0FDF4)
                            // onPress={() => navigation.navigate(STACKS.DHABHA_MY_DHABHA as any)}
                            />
                        </View>
                    </View>

                    {/* Drivers Near Your Dhaba Section */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('driversNearYourDhaba')}</Text>
                            <TouchableOpacity
                            //  onPress={() => navigation.navigate(STACKS.DHABHA_NEARBY as any)}
                            >
                                <Text style={styles.viewAllText}>{t('viewAll')} {'>'}</Text>
                            </TouchableOpacity>
                        </View>
                        {nearbyDrivers.map((driver, index) => (
                            <DriverItem
                                key={index}
                                name={driver.name}
                                distance={driver.distance}
                                activeTime={driver.activeTime}
                                avatarUrl={driver.avatar}
                            />
                        ))}
                    </View>

                    {/* Field Agent Card */}
                    <View style={styles.fieldAgentCard}>
                        <View style={styles.fieldAgentLeft}>
                            <Image
                                source={{ uri: fieldAgent.avatar }}
                                style={styles.fieldAgentAvatar}
                            />
                            <View style={styles.fieldAgentInfo}>
                                <Text style={styles.fieldAgentTitle}>{fieldAgent.name}</Text>
                                <Text style={styles.fieldAgentZone}>{fieldAgent.zone}</Text>
                            </View>
                        </View>
                        <View style={styles.fieldAgentActions}>
                            <TouchableOpacity style={styles.callButton}>
                                <View style={styles.callIconBg}>
                                    <Ionicons name="call" size={18} color="#FFFFFF" />
                                </View>
                                <Text style={styles.actionButtonLabel}>{t('call')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.whatsappButton}>
                                <View style={styles.whatsappIconBg}>
                                    <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
                                </View>
                                <Text style={styles.actionButtonLabel}>{t('whatsapp')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Driver ki Awaz Banner */}
                    <View style={styles.driverAwazBanner}>
                        <View style={styles.awazLeft}>
                            <View style={styles.megaphoneIcon}>
                                <MaterialCommunityIcons name="bullhorn" size={24} color="#DC2626" />
                            </View>
                            <View style={styles.awazContent}>
                                <Text style={styles.awazTitle}>{t('driverKiAwaz')}</Text>
                                <Text style={styles.awazSubtitle}>{t('seeLatestUpdatesFrom')} <Text style={{ color: '#1E88E5' }}>TruckMitr</Text> {t('drivers')}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.openButton}>
                            <Text style={styles.openButtonText}>{t('open')}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView >


        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 8,
    },
    truckIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
    },
    truckMitrText: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dhabaSaathiText: {
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    notificationBtn: {
        position: 'relative',
        padding: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },

    // Welcome Text
    welcomeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 16,
    },

    // Wallet Card
    walletCard: {
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 0,
    },
    walletLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    walletAmountRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    rupeeSymbol: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 8,
        marginRight: 2,
    },
    walletAmount: {
        fontSize: 56,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 64,
    },
    availableBalance: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#E5E7EB',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    statLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
    },

    // Redeem Button
    redeemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E3A5F',
        borderRadius: 25,
        paddingVertical: 14,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    redeemButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 4,
    },

    // Add Driver Banner
    addDriverBannerContainer: {
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden', // Ensure gradient respects border radius
    },
    addDriverBanner: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    addDriverContent: {
        alignItems: 'center',
    },
    addDriverTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    addDriverSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Quick Actions Grid
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickActionCard: {
        width: (SCREEN_WIDTH - 48) / 4,
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionIconContainer: {
        marginBottom: 8,
    },
    actionIconBg: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1E88E5',
        textAlign: 'center',
        marginBottom: 2,
    },
    quickActionSubtitle: {
        fontSize: 9,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 12,
    },

    // Section Container
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },

    // Driver Item
    driverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    driverAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 13,
        color: '#1E293B',
    },

    // Field Agent Card
    fieldAgentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fieldAgentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldAgentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    fieldAgentInfo: {},
    fieldAgentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    fieldAgentZone: {
        fontSize: 12,
        color: '#64748B',
    },
    fieldAgentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    callButton: {
        alignItems: 'center',
    },
    callIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    whatsappButton: {
        alignItems: 'center',
    },
    whatsappIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#25D366',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    actionButtonLabel: {
        fontSize: 10,
        color: '#64748B',
    },

    // Driver ki Awaz Banner
    driverAwazBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    awazLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    megaphoneIcon: {
        marginRight: 12,
    },
    awazContent: {
        flex: 1,
    },
    awazTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    awazSubtitle: {
        fontSize: 11,
        color: '#64748B',
    },
    openButton: {
        backgroundColor: '#1E3A5F',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    openButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingTop: 10,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        minWidth: 60,
    },
    tabLabel: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 4,
    },
    tabLabelActive: {
        color: '#1E3A5F',
        fontWeight: '600',
    },
});
