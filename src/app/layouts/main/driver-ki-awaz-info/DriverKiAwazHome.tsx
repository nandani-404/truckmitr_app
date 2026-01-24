/**
 * Driver Ki Awaz - Home Screen
 * Main entry point with Reels view and top navigation controls
 * @format
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    BackHandler,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ReelsScreen, FeedScreen, CreatePostScreen } from './screens';
import { STACKS } from '@truckmitr/src/stacks/stacks';

type TabType = 'reels' | 'feed' | 'create';

const DriverKiAwazHome: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { t } = useTranslation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('reels');

    // Handle Hardware Back Button
    useEffect(() => {
        const onBackPress = () => {
            if (activeTab !== 'reels') {
                setActiveTab('reels');
                return true;
            }
            return false;
        };

        if (isFocused) {
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }
    }, [activeTab, isFocused]);

    // Note: Bottom Tab Bar is now kept visible since DriverKiAwazHome is a tab screen


    const handleGoBack = () => {
        if (activeTab !== 'reels') {
            setActiveTab('reels');
        } else {
            navigation.goBack();
        }
    };

    const handleCreatePost = () => {
        setActiveTab('create');
    };

    const handleOpenFeed = () => {
        setActiveTab('feed');
    };

    const handleOpenMyPosts = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_MY_POSTS);
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={activeTab === 'feed' ? 'dark-content' : 'light-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* Main Content Area */}
            <View style={styles.content}>
                {activeTab === 'create' ? (
                    <CreatePostScreen onClose={() => setActiveTab('reels')} />
                ) : activeTab === 'feed' ? (
                    <View style={styles.feedContainer}>
                        {/* Header for Feed */}
                        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: '#FFFFFF' }]}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setActiveTab('reels')}
                            >
                                <Ionicons name="arrow-back" size={24} color="#1E293B" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>{t('driverKiFeed')}</Text>
                            <View style={styles.placeholder} />
                        </View>
                        <FeedScreen />
                    </View>
                ) : (
                    <View style={styles.reelsContainer}>
                        {/* Reels Content */}
                        <ReelsScreen isScreenFocused={isFocused && activeTab === 'reels'} />

                        {/* Overlay Header for Reels */}
                        <View style={[styles.overlayHeader, { paddingTop: insets.top + 8 }]}>
                            {/* Feed Button (Top Left) */}
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleOpenFeed}
                            >
                                <Ionicons name="layers-outline" size={28} color="#FFFFFF" />
                                <Text style={styles.iconLabel}>{t('feed')}</Text>
                            </TouchableOpacity>

                            {/* Title (Center) */}
                            <Text style={styles.overlayTitle}>{t('driverKiAawaz')}</Text>

                            {/* Create Button (Top Right) */}
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleCreatePost}
                            >
                                <Ionicons name="add-circle-outline" size={30} color="#FFFFFF" />
                                <Text style={styles.iconLabel}>{t('create')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
    },
    reelsContainer: {
        flex: 1,
    },
    feedContainer: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
    },
    overlayHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align to top
        paddingHorizontal: 20,
        zIndex: 100,
        // Gradient background for visibility could be added here if needed, 
        // but simple icons work well for modern look
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    iconLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    overlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        marginTop: 4,
    },
    placeholder: {
        width: 40,
    }
});

export default DriverKiAwazHome;
