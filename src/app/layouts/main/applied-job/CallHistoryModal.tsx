import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CallHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    data: any[];
    loading: boolean;
    jobTitle?: string;
}

const CallHistoryModal: React.FC<CallHistoryModalProps> = ({
    visible,
    onClose,
    data,
    loading,
    jobTitle
}) => {
    const colors = useColor();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const { t } = useTranslation();

    const getStatusConfig = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'connected':
                return { color: '#10B981', icon: 'phone-check', label: t('connected', 'Connected') };
            case 'not_connected':
                return { color: '#EF4444', icon: 'phone-missed', label: t('not_connected', 'Not Connected') };
            case 'callback_later':
                return { color: '#F59E0B', icon: 'phone-clock', label: t('callback_later', 'Callback Later') };
            default:
                return { color: colors.blackOpacity(0.5), icon: 'phone-outline', label: status || t('unknown', 'Unknown') };
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={{ flex: 1 }}
                />
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.white }
                    ]}
                >
                    <View style={styles.headerRow}>
                        <View style={styles.handle} />
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={responsiveFontSize(2.8)} color={colors.blackOpacity(0.4)} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.titleSection}>
                        <View style={[styles.iconWrap, { backgroundColor: colors.royalBlue + '15' }]}>
                            <MaterialCommunityIcons name="history" size={responsiveFontSize(2.5)} color={colors.royalBlue} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modalTitle, { color: colors.black, fontSize: responsiveFontSize(2.1) }]}>
                                {t('callHistory', 'Call History')}
                            </Text>
                            {jobTitle && (
                                <Text numberOfLines={1} style={[styles.jobTitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }]}>
                                    {jobTitle}
                                </Text>
                            )}
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.royalBlue} />
                        </View>
                    ) : (
                        <FlatList
                            data={data}
                            keyExtractor={(_, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            ListEmptyComponent={() => (
                                <View style={styles.centerContainer}>
                                    <MaterialCommunityIcons name="phone-off" size={40} color={colors.blackOpacity(0.15)} />
                                    <Text style={[styles.noHistoryText, { color: colors.blackOpacity(0.4) }]}>
                                        {t('noCallHistory', 'No call history found')}
                                    </Text>
                                </View>
                            )}
                            renderItem={({ item }) => {
                                const statusConfig = getStatusConfig(item.call_status);
                                return (
                                    <View style={[styles.historyCard, { borderColor: colors.blackOpacity(0.06) }]}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.callerInfo}>
                                                <View style={[styles.avatar, { backgroundColor: colors.royalBlue + '10' }]}>
                                                    <Ionicons name="person" size={14} color={colors.royalBlue} />
                                                </View>
                                                <View>
                                                    <Text style={[styles.adminName, { color: colors.black }]}>
                                                        {item.admin_name || t('telecaller', 'Telecaller')}
                                                    </Text>
                                                    <Text style={[styles.callDate, { color: colors.blackOpacity(0.4) }]}>
                                                        {moment(item.created_date).format('DD MMM YYYY, hh:mm A')}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                                                <MaterialCommunityIcons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                                    {statusConfig.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: SCREEN_HEIGHT * 0.8,
        minHeight: SCREEN_HEIGHT * 0.4,
        paddingBottom: 20,
    },
    headerRow: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        top: 10,
        padding: 4,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    modalTitle: {
        fontWeight: '700',
    },
    jobTitle: {
        fontWeight: '500',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 30,
    },
    centerContainer: {
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noHistoryText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    historyCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    callerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    adminName: {
        fontSize: 14,
        fontWeight: '700',
    },
    callDate: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
});

export default CallHistoryModal;
