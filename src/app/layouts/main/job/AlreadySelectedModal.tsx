import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';

interface AlreadySelectedModalProps {
    visible: boolean;
    onClose: () => void;
    jobId: string;
}

const AlreadySelectedModal: React.FC<AlreadySelectedModalProps> = ({ visible, onClose, jobId }) => {
    const { t } = useTranslation();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { 
                    width: responsiveWidth(85), 
                    backgroundColor: colors.white,
                    padding: responsiveFontSize(2.5),
                }, shadow]}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.royalBlueOpacity(0.1) }]}>
                        <Ionicons name="checkmark-circle" size={responsiveFontSize(6)} color={colors.royalBlue} />
                    </View>
                    
                    <Space height={responsiveHeight(2)} />
                    
                    <Text style={[styles.title, { color: colors.black, fontSize: responsiveFontSize(2.4) }]}>
                        {t('alreadySelectedTitle')}
                    </Text>
                    
                    <Space height={responsiveHeight(1.5)} />
                    
                    <Text style={[styles.content, { color: colors.blackOpacity(0.7), fontSize: responsiveFontSize(1.8) }]}>
                        {t('alreadySelectedContent', { jobId })}
                    </Text>
                    
                    <Space height={responsiveHeight(3)} />
                    
                    <TouchableOpacity 
                        onPress={onClose}
                        style={[styles.button, { backgroundColor: colors.royalBlue, height: responsiveHeight(6) }]}
                    >
                        <Text style={[styles.buttonText, { color: colors.white, fontSize: responsiveFontSize(2) }]}>
                            {t('ok')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        borderRadius: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    content: {
        textAlign: 'center',
        lineHeight: 22,
    },
    contentHindi: {
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    button: {
        width: '100%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '600',
    },
});

export default AlreadySelectedModal;
