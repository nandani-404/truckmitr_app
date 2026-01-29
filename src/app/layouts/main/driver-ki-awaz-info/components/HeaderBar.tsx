/**
 * Driver Ki Awaz - Header Bar Component
 * @format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

interface HeaderBarProps {
    title: string;
    showNotification?: boolean;
    showBack?: boolean;
    onNotificationPress?: () => void;
    backgroundColor?: string;
    titleColor?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
    title,
    showNotification = true,
    showBack = true,
    onNotificationPress,
    backgroundColor = '#FFFFFF',
    titleColor = '#1E3A8A',
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
            <View style={styles.content}>
                {showBack ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={titleColor} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                    {title}
                </Text>

                {showNotification ? (
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={onNotificationPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="notifications-outline" size={24} color={titleColor} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginHorizontal: 12,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
});

export default HeaderBar;
