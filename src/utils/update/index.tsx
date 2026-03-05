import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View, BackHandler } from 'react-native';
import VersionCheck from 'react-native-version-check';
import DeviceInfo from 'react-native-device-info';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { IMAGES } from '@truckmitr/src/res/images';
import { useTranslation } from 'react-i18next';

export default function InAppUpdatePopup() {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false);
    const [latestVersion, setLatestVersion] = useState('');
    const [loading, setLoading] = useState(false);

    const colors = useColor();
    const { responsiveWidth, responsiveHeight, responsiveFontSize } = useResponsiveScale();

    useEffect(() => {
        checkVersion();
    }, []);

    // Force update by preventing back button
    useEffect(() => {
        if (visible) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => backHandler.remove();
        }
    }, [visible]);

    const checkVersion = async () => {
        try {
            const currentVersion = DeviceInfo.getVersion();
            const fetchedLatestVersion = await VersionCheck.getLatestVersion({
                provider: 'playStore',
                packageName: 'com.truckmitr',
            });
            // console.log(`currentVersion----------------`, currentVersion);
            // console.log(`fetchedLatestVersion----------------`, fetchedLatestVersion);

            if (currentVersion < fetchedLatestVersion) {
                setLatestVersion(fetchedLatestVersion);
                setVisible(true);
            }
        } catch (error) {
            console.log('Error checking version:', error);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        const storeUrl = await VersionCheck.getStoreUrl({ packageName: 'com.truckmitr' });
        Linking.openURL(storeUrl)
            .finally(() => setLoading(false));
    };

    if (!visible) return null;

    return (
        <View style={[styles.overlay, { backgroundColor: colors.blackOpacity(0.7) }]}>
            <View style={[styles.container, { backgroundColor: colors.white, width: responsiveWidth(90) }]}>
                <Image
                    source={IMAGES.TRUCKMITR_HORIZONTAL}
                    style={{
                        height: responsiveFontSize(8),
                        width: responsiveWidth(32),
                        resizeMode: 'contain'
                    }}
                />
                <Space height={responsiveHeight(3)} />
                <Text style={[styles.title, { color: colors.black, fontSize: responsiveFontSize(3) }]}>
                    {t(`updateAvailable`)}
                </Text>
                <Space height={responsiveHeight(0.5)} />
                <Text style={[styles.subtitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(2.2) }]}>
                    {t(`aNewVersion`)} {latestVersion} {t(`isAvailable`)}
                </Text>
                <Space height={responsiveHeight(5)} />
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        onPress={handleUpdate}
                        activeOpacity={0.7}
                        style={[styles.button, { backgroundColor: colors.royalBlue }]}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.white }]}>{t(`updateNow`)}</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <Space height={responsiveHeight(1)} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        paddingVertical: 20,
    },
    title: {
        fontWeight: '500',
        textAlign: 'center',
    },
    subtitle: {
        paddingHorizontal: 12,
        fontWeight: '400',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 10
    },
    button: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderRadius: 8,
    },
    buttonText: {
        fontWeight: '500',
        fontSize: 16,
    },
});
