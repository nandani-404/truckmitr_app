import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video';
import axiosInstance from '../config/axiosInstance';
import { END_POINTS, BASE_URL } from '../config';
import { useColor, useResponsiveScale } from '../../app/hooks';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const TopClassPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [popupData, setPopupData] = useState<any>(null);
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { user, isDriver, isTransporter, popupData: reduxPopupData } = useSelector((state: any) => state?.user || {});
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        if (reduxPopupData) {
            checkAndShowPopup(reduxPopupData);
        } else {
            // Fallback: fetch locally if not in Redux (e.g. hot reload or init failed)
            fetchPopup();
        }
    }, [reduxPopupData]);

    const fetchPopup = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.MOBILE_POPUP);
            if (response.data && response.data.status && response.data.data) {
                checkAndShowPopup(response.data.data);
            }
        } catch (error) {
            console.log('Error fetching mobile popup locally:', error);
        }
    };

    const checkAndShowPopup = (data: any) => {
        // Filter by user role if applicable
        let shouldShow = false;
        const userRole = user?.role || user?.data?.role;

        if (!data.user_type || data.user_type.length === 0) {
            shouldShow = true;
        } else {
            if (isDriver && data.user_type.includes('driver')) shouldShow = true;
            if (isTransporter && data.user_type.includes('transporter')) shouldShow = true;

            // Foreman check
            if (userRole === 'foreman' && data.user_type.includes('foreman')) shouldShow = true;

            // Association/Associate check
            if ((userRole === 'associate' || userRole === 'association') &&
                (data.user_type.includes('associate') || data.user_type.includes('association'))) {
                shouldShow = true;
            }
        }

        if (shouldShow) {
            setPopupData(data);
            setVideoLoaded(false);
            setIsVisible(true);
        }
    };



    const handleClose = () => {
        setIsVisible(false);
    };

    const handlePress = () => {
        if (popupData?.redirect_link) {
            setIsVisible(false);
            // Check if it's a URL or a screen name
            if (popupData.redirect_link.startsWith('http')) {
                Linking.openURL(popupData.redirect_link);
            } else {
                // Try to navigate to screen
                try {
                    navigation.navigate(popupData.redirect_link);
                } catch (e) {
                    console.log('Navigation error:', e);
                }
            }
        }
    };

    if (!popupData) return null;

    const imageUrl = popupData.media_url ? `${BASE_URL.replace(/\/$/, '')}${popupData.media_url.startsWith('/') ? '' : '/'}${popupData.media_url}` : null;
    const fullImageUrl = popupData.media_url ? `${BASE_URL}${popupData.media_url.startsWith('/') ? '' : '/'}${popupData.media_url}` : null;
    const isVideo = popupData.media_type === 'video';

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={handleClose}
            onBackButtonPress={handleClose}
            animationIn="zoomIn"
            animationOut="zoomOut"
            useNativeDriver
            hideModalContentWhileAnimating
            style={styles.modal}
            backdropOpacity={0.6}
        >
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: colors.white }]}
                    onPress={handleClose}
                    activeOpacity={0.8}
                >
                    <Icon name="close" size={20} color={colors.black} />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handlePress}
                    style={styles.card}
                >
                    <View style={[styles.gradientContainer, { backgroundColor: fullImageUrl ? 'transparent' : colors.white }]}>
                        {/* Media Content (Image/GIF or Video) */}
                        {fullImageUrl ? (
                            <View style={styles.mediaContainer}>
                                {isVideo ? (
                                    <>
                                        <Video
                                            source={{ uri: fullImageUrl }}
                                            style={[styles.image, { opacity: videoLoaded ? 1 : 0 }]}
                                            resizeMode="contain"
                                            repeat={true}
                                            controls={false}
                                            paused={false}
                                            muted={true}
                                            playInBackground={false}
                                            playWhenInactive={false}
                                            onLoad={() => setVideoLoaded(true)}
                                        />
                                        {!videoLoaded && (
                                            <View style={[styles.image, styles.loaderContainer]}>
                                                <ActivityIndicator size="large" color="#2E5BFF" />
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <FastImage
                                        source={{ uri: fullImageUrl }}
                                        style={styles.image}
                                        resizeMode={FastImage.resizeMode.contain}
                                    />
                                )}
                            </View>
                        ) : (
                            <LinearGradient
                                colors={[colors.white, '#F8F9FA']}
                                style={styles.gradientContainer}
                            >
                                <View style={styles.textContainer}>
                                    <Text style={[styles.title, { color: colors.text }]}>{popupData.title}</Text>
                                    <Text style={[styles.description, { color: colors.text }]}>{popupData.description}</Text>
                                </View>
                            </LinearGradient>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        alignItems: 'center',
    },
    card: {
        width: '100%',

        backgroundColor: 'transparent',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 0, // Remove shadow from card container to avoid box shadow around transparent image

    },
    gradientContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 0,
    },
    image: {
        width: '100%',
        height: height * 0.65, // User nearly 65% of screen height
        backgroundColor: 'transparent',
        borderRadius: 20,
        overflow: 'hidden',
    },
    mediaContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    loaderContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 1
    },
    closeButton: {
        position: 'absolute',
        top: -15,
        right: -10,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#EEEEEE'
    },
    textContainer: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: 22,
    },
    ctaButton: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: "#2E5BFF",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    ctaText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 6,
    }
});

export default TopClassPopup;
