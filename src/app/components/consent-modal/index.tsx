import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColor } from '@truckmitr/src/app/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useDispatch } from 'react-redux';
import { userAction } from '@truckmitr/src/redux/actions/user.action';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';

interface ConsentModalProps {
    visible: boolean;
    onConsentSuccess?: () => void;
}

const { width, height } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const ConsentModal: React.FC<ConsentModalProps> = ({ visible, onConsentSuccess }) => {
    const { t } = useTranslation();
    const colors = useColor();
    const navigation = useNavigation<NavigatorProp>();
    // Removed responsive hooks to ensure fixed sizing logic
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const handleAgree = async () => {
        setLoading(true);
        try {
            // API call to update consent
            const payload = {
                consent: "1"
            };
            const response: any = await axiosInstance.post(END_POINTS.UPDATE_CONSENT, payload);

            if (response.data.status || response.data.success) {
                const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                if (profile?.data?.status) {
                    dispatch(userAction(profile?.data))
                }
                if (onConsentSuccess) onConsentSuccess();
            }

        } catch (error) {
            console.error('Error updating consent:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <MaterialIcons name="security" size={40} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t('consent_required') || "Consent Required"}
                </Text>

                <Text style={[styles.message, { color: colors.text }]}>
                    {t('consent_msg_start') || "To continue using the application, you must agree to our updated "}
                    <Text
                        style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: colors.primary }}
                        onPress={() => {
                            console.log('Navigating to Terms');
                            navigation.navigate(STACKS.TERMS);
                        }}
                    >
                        {t('terms_conditions') || "Terms and Conditions"}
                    </Text>
                    {t('and') || " and "}
                    <Text
                        style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: colors.primary }}
                        onPress={() => {
                            console.log('Navigating to Privacy');
                            navigation.navigate(STACKS.PRIVACY);
                        }}
                    >
                        {t('privacy_policy') || "Privacy Policy"}
                    </Text>
                    {t('consent_msg_end') || "."}
                </Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleAgree}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {t('i_agree') || "I Agree"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 9999,
    },
    card: {
        width: '100%',
        maxWidth: 340, // Max width for tablet/large screens
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 24,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        opacity: 0.8,
    },
    button: {
        width: '100%',
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default ConsentModal;
