import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from 'react-native'
import React, { useEffect, useRef } from 'react'
import { useColor, useResponsiveScale } from '../hooks';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

// Apple-style Confirmation Dialog Component
interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const AppleConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const colors = useColor();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <Animated.View
                style={[
                    styles.dialogOverlay,
                    { opacity: opacityValue }
                ]}
            >
                <Animated.View
                    style={[
                        styles.dialogContainer,
                        {
                            transform: [{ scale: scaleValue }],
                            backgroundColor: colors.white,
                            width: responsiveWidth(75),
                        }
                    ]}
                >
                    {/* Icon */}
                    <View style={[
                        styles.dialogIconContainer,
                        { backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(8, 68, 137, 0.1)' }
                    ]}>
                        {isDestructive ? (
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={32}
                                color="#FF3B30"
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name="logout"
                                size={32}
                                color={colors.royalBlue}
                            />
                        )}
                    </View>

                    {/* Title */}
                    <Text style={[
                        styles.dialogTitle,
                        {
                            color: colors.black,
                            fontSize: responsiveFontSize(2.2),
                        }
                    ]}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text style={[
                        styles.dialogMessage,
                        {
                            color: colors.blackOpacity(0.6),
                            fontSize: responsiveFontSize(1.7),
                        }
                    ]}>
                        {message}
                    </Text>

                    {/* Buttons */}
                    <View style={styles.dialogButtonContainer}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onCancel}
                            disabled={loading}
                            style={[
                                styles.dialogButton,
                                styles.dialogCancelButton,
                                { backgroundColor: colors.blackOpacity(0.05) }
                            ]}
                        >
                            <Text style={[
                                styles.dialogButtonText,
                                {
                                    color: colors.blackOpacity(0.8),
                                    fontSize: responsiveFontSize(1.8),
                                }
                            ]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onConfirm}
                            disabled={loading}
                            style={[
                                styles.dialogButton,
                                styles.dialogConfirmButton,
                                { backgroundColor: isDestructive ? '#FF3B30' : colors.royalBlue }
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={[
                                    styles.dialogButtonText,
                                    {
                                        color: colors.white,
                                        fontSize: responsiveFontSize(1.8),
                                    }
                                ]}>
                                    {confirmText}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogContainer: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    dialogIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    dialogTitle: {
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    dialogMessage: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    dialogButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    dialogButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    dialogCancelButton: {
        // Background set in component
    },
    dialogConfirmButton: {
        // Background set in component
    },
    dialogButtonText: {
        fontWeight: '600',
    },
});
