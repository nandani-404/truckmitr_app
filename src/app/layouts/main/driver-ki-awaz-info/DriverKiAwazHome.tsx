/**
 * Driver Ki Awaz - Home Screen
 * Main entry point with Reels view and top navigation controls
 * @format
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Platform,
    Animated,
    Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ReelsScreen, FeedScreen } from './screens';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { BASE_URL } from '@truckmitr/src/utils/config';

const Tab = createMaterialTopTabNavigator();
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

const DriverKiAwazHome: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const isFocused = useIsFocused();
    const initialReelId = route?.params?.reelId;
    const themeAnim = React.useRef(new Animated.Value(0)).current;
    const headerTranslateY = React.useRef(new Animated.Value(0)).current;
    const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
    const { user } = useSelector((state: any) => state.user);

    const setHeaderVisible = React.useCallback((visible: boolean) => {
        if (isHeaderVisible === visible) return;

        setIsHeaderVisible(visible);
        Animated.timing(headerTranslateY, {
            toValue: visible ? 0 : -60,
            duration: 300, // Reverted to 300ms for smoother feel
            useNativeDriver: false,
        }).start();
    }, [isHeaderVisible]);

    // Use a separate index to trigger animations reliably
    const [currentIdx, setCurrentIdx] = React.useState(0);

    const handleCreatePost = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_CREATE_POST);
    };

    const handleOpenMyPosts = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_MY_POSTS);
    };

    return (
        <View style={styles.container}>
            {/* Top Tabs with Custom Header inside TabBar */}
            <Tab.Navigator
                tabBar={(props) => {
                    const { state } = props;
                    const activeIndex = state.index;

                    // Sync the local animation value whenever the index changes
                    React.useEffect(() => {
                        Animated.timing(themeAnim, {
                            toValue: activeIndex,
                            duration: 300,
                            useNativeDriver: false,
                        }).start();

                        // Reset header/tabs visibility whenever clicking or swiping between tabs
                        setHeaderVisible(true);
                    }, [activeIndex]);

                    // Interpolate background color with buffer zones
                    const backgroundColor = themeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'],
                        extrapolate: 'clamp',
                    });

                    // Interpolate title color: white to dark
                    const titleColor = themeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255, 255, 255, 1)', 'rgba(30, 41, 59, 1)'],
                        extrapolate: 'clamp',
                    });

                    // Interpolate theme color: white to blue
                    const themeColor = themeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#FFFFFF', '#056CE2'],
                        extrapolate: 'clamp',
                    });

                    // Interpolate shadows: visible on Video (0), invisible on Blogs (1)
                    const shadowOpacity = themeAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.35, 0, 0],
                        extrapolate: 'clamp',
                    });

                    const textShadowRadius = themeAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [3, 0, 0],
                        extrapolate: 'clamp',
                    });

                    const textShadowColor = themeAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: ['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'],
                        extrapolate: 'clamp',
                    });

                    // Dynamic Status Bar Style
                    const isVideo = activeIndex === 0;
                    const statusStyle = isVideo ? 'light-content' : 'dark-content';

                    return (
                        <View style={styles.headerContainer}>
                            <StatusBar
                                barStyle={statusStyle}
                                backgroundColor="transparent"
                                translucent={true}
                            />
                            {/* Unified Header - Title Row with its own background */}
                            <Animated.View style={[styles.header, {
                                paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 8),
                                backgroundColor
                            }]}>
                                <AnimatedText
                                    style={[
                                        styles.headerTitle,
                                        {
                                            color: titleColor,
                                            textShadowColor: textShadowColor,
                                            textShadowOffset: { width: 0, height: 1 },
                                            textShadowRadius: textShadowRadius,
                                        }
                                    ]}
                                >
                                    {t('driverKiAawaz')}
                                </AnimatedText>

                                <View style={styles.headerRight}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={handleOpenMyPosts}
                                        style={styles.headerIconButton}
                                    >
                                        <Animated.View style={[
                                            styles.avatarContainer,
                                            { borderColor: themeColor }
                                        ]}>
                                            {user?.images ? (
                                                <Image
                                                    source={{ uri: `${BASE_URL}public/${user.images}` }}
                                                    style={styles.avatar}
                                                />
                                            ) : (
                                                <AnimatedIonicons
                                                    name="person-circle-outline"
                                                    size={26}
                                                    style={{ color: themeColor }}
                                                />
                                            )}
                                        </Animated.View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={handleCreatePost}
                                        style={styles.headerIconButton}
                                    >
                                        <AnimatedIonicons
                                            name="add-circle"
                                            size={30}
                                            style={{
                                                color: themeColor,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: shadowOpacity,
                                                shadowRadius: 2,
                                            }}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* Tab Bar Row with its own background and translation */}
                            <Animated.View style={{
                                backgroundColor,
                                // Clip content within this height
                                height: headerTranslateY.interpolate({
                                    inputRange: [-60, 0],
                                    outputRange: [0, 48] // Approximate tab bar height
                                }),
                                overflow: 'hidden'
                            }}>
                                <Animated.View style={{
                                    transform: [{ translateY: headerTranslateY }],
                                    opacity: headerTranslateY.interpolate({
                                        inputRange: [-60, 0],
                                        outputRange: [0, 1]
                                    }),
                                }}>
                                    <MaterialTopTabBar {...props} />
                                </Animated.View>
                            </Animated.View>
                        </View>
                    );
                }}
                screenOptions={({ route }) => {
                    const isVideo = route.name === 'Video';
                    const activeColor = isVideo ? '#FFFFFF' : '#056CE2';
                    const inactiveColor = isVideo ? 'rgba(255, 255, 255, 0.6)' : '#64748B';

                    return {
                        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', textTransform: 'none' },
                        tabBarIndicatorStyle: { height: 3, borderRadius: 3, backgroundColor: activeColor },
                        tabBarStyle: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
                        tabBarActiveTintColor: activeColor,
                        tabBarInactiveTintColor: inactiveColor,
                        tabBarPressColor: isVideo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(5, 108, 226, 0.1)',
                        tabBarShowIcon: true,
                        tabBarItemStyle: { flexDirection: 'row' },
                    };
                }}
            >
                <Tab.Screen
                    name="Video"
                    options={{
                        title: t('videos') || 'Videos',
                        tabBarIcon: ({ color }) => <Ionicons name="videocam" size={20} color={color} />
                    }}
                >
                    {() => (
                        <ReelsScreen
                            initialReelId={initialReelId}
                            onHeaderVisibilityChange={setHeaderVisible}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen
                    name="Blogs"
                    options={{
                        title: t('blogs') || 'Blogs',
                        tabBarIcon: ({ color }) => <Ionicons name="newspaper" size={18} color={color} />
                    }}
                >
                    {() => (
                        <FeedScreen
                            onHeaderVisibilityChange={setHeaderVisible}
                        />
                    )}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 19, // Slightly increased
        fontWeight: '900', // Even bolder
        color: '#FFFFFF',
        letterSpacing: -0.2, // Tighter tracking for premium feel
    },
    headerIconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
});

export default DriverKiAwazHome;
