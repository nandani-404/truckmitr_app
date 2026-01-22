import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking } from 'react-native';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
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
    const { user, isDriver, isTransporter } = useSelector((state: any) => state?.user || {});

    useEffect(() => {
        fetchPopup();
    }, []);

    const fetchPopup = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.MOBILE_POPUP);
            if (response.data && response.data.status && response.data.data) {
                const data = response.data.data;

                // Filter by user role if applicable
                let shouldShow = false;
                if (!data.user_type || data.user_type.length === 0) {
                    shouldShow = true;
                } else {
                    if (isDriver && data.user_type.includes('driver')) shouldShow = true;
                    if (isTransporter && data.user_type.includes('transporter')) shouldShow = true;
                    // If user type includes both or specific roles
                }

                if (shouldShow) {
                    setPopupData(data);
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.log('Error fetching mobile popup:', error);
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
    // Check if user provided base url in prompt "https://devtruckmitr.in/public"
    // The JSON sample shows "/mobile_popups/images/..."
    // If BASE_URL is https://devtruckmitr.in/, then https://devtruckmitr.in/mobile_popups... might be wrong if "public" is needed.
    // User said: "image base url https://devtruckmitr.in/public"
    // So distinct handling:
    const fullImageUrl = popupData.media_url ? `https://devtruckmitr.in/public${popupData.media_url.startsWith('/') ? '' : '/'}${popupData.media_url}` : null;


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
                    <LinearGradient
                        colors={[colors.white, '#F8F9FA']}
                        style={styles.gradientContainer}
                    >
                        {/* Image */}
                        {fullImageUrl && (
                            <FastImage
                                source={{ uri: fullImageUrl }}
                                style={styles.image}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}

                        {/* Content Overlay (if needed, but usually image has text) */}
                        {(!fullImageUrl) && (
                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { color: colors.text }]}>{popupData.title}</Text>
                                <Text style={[styles.description, { color: colors.text }]}>{popupData.description}</Text>
                            </View>
                        )}

                        {/* Call to Action Button Indicator if clickable */}

                    </LinearGradient>
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
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    gradientContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 0,
    },
    image: {
        width: '100%',
        height: width * 0.9 * 1.5, // Enlarge image
        backgroundColor: '#f0f0f0'
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
