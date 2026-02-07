import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Share,
    Clipboard,
    ActivityIndicator,
    Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';



// Document type for expiring documents
interface ExpiringDocument {
    type: string;
    daysLeft: number;
}

// Driver data interface
interface DriverWithExpiringDocs {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    image: string;
    documents: ExpiringDocument[];
}


const DriverCard = ({ driver }: { driver: DriverWithExpiringDocs }) => {
    const { t } = useTranslation();

    const handleShareWhatsApp = () => {
        const docsList = driver.documents.map(d => t('whatsappDocLine', { type: d.type, daysLeft: d.daysLeft })).join('\n');
        const msg = `${t('whatsappGreeting', { name: driver.name })}${docsList}${t('whatsappFooter', { tmId: driver.tmId })}`;

        let phoneNumber = driver.mobile;
        // Basic cleaning to remove spaces or special chars
        phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        // Add 91 if missing for 10 digit numbers (assuming Indian context as per app)
        if (phoneNumber.length === 10) {
            phoneNumber = `91${phoneNumber}`;
        }

        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                showToast(t('whatsapp_not_installed', 'WhatsApp is not installed'));
            }
        }).catch(err => console.error('An error occurred', err));
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.tmId}\nMobile: ${driver.mobile}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    // Get urgency color based on minimum days left
    const minDays = Math.min(...driver.documents.map(d => d.daysLeft));
    const getUrgencyColor = () => {
        if (minDays <= 7) return { bg: '#FEE2E2', text: '#EF4444' };
        if (minDays <= 15) return { bg: '#FEF3C7', text: '#D97706' };
        return { bg: '#DBEAFE', text: '#2563EB' };
    };
    const urgencyColor = getUrgencyColor();

    return (
        <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Image source={{ uri: driver.image }} style={styles.avatar} />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.name}</Text>
                    <Text style={styles.tmId}>{driver.tmId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: urgencyColor.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: urgencyColor.text }]}>{t('expiringDocsTitle')}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    <Ionicons name="copy-outline" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Expiring Documents List */}
            <View style={styles.documentsContainer}>
                {driver.documents.map((doc, index) => {
                    const isLast = index === driver.documents.length - 1;
                    const docColor = doc.daysLeft <= 7 ? '#EF4444' : doc.daysLeft <= 15 ? '#D97706' : '#2563EB';

                    return (
                        <View key={index} style={[styles.documentRow, isLast && { borderBottomWidth: 0 }]}>
                            <View style={styles.documentInfo}>
                                <MaterialCommunityIcons
                                    name="file-document-outline"
                                    size={18}
                                    color={docColor}
                                />
                                <Text style={styles.documentType}>{doc.type}</Text>
                            </View>
                            <View style={[styles.expiryBadge, { backgroundColor: doc.daysLeft <= 7 ? '#FEE2E2' : doc.daysLeft <= 15 ? '#FEF3C7' : '#DBEAFE' }]}>
                                <Text style={[styles.expiryText, { color: docColor }]}>
                                    {doc.daysLeft <= 7 ? t('daysLeftShort', { count: doc.daysLeft }) : t('daysCount', { count: doc.daysLeft })}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* WhatsApp Share Button */}
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.whatsappBtnText}>{t('association_whatsapp_remind')}</Text>
            </TouchableOpacity>
        </View>
    );
};


export default function DriverAssociationExpiringDocuments() {
    const { t } = useTranslation();
    const { user } = useSelector((state: any) => state?.user) || {};
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<DriverWithExpiringDocs[]>([]);

    useEffect(() => {
        fetchExpiringDocuments();
    }, []);

    const fetchExpiringDocuments = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.ASSOCIATION_EXPIRING_DOCUMENTS(user?.id));
            if (response.data && response.data.success) {
                const apiDrivers = response.data.drivers.map((driver: any) => ({
                    id: driver.id,
                    name: driver.name,
                    tmId: driver.unique_id,
                    mobile: driver.mobile,
                    image: driver.images ? `${BASE_URL}${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                    documents: [
                        {
                            type: t('drivingLicense'),
                            daysLeft: parseInt(driver.remaining_days) || 0,
                        }
                    ]
                }));
                setDrivers(apiDrivers);
            }
        } catch (error) {
            console.error('Error fetching expiring documents:', error);
            showToast(t('failedToFetchDocs'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1E3A5F" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <ScreenHeader
                title={t('association_expiring_documents')}
                titleCount={drivers.length > 0 ? drivers.length : undefined}
            />

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {drivers.map((driver) => (
                    <DriverCard key={driver.id} driver={driver} />
                ))}
                {drivers.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="file-check" size={48} color="#22C55E" />
                        <Text style={styles.emptyText}>{t('association_no_expiring_documents')}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        backgroundColor: '#F3F4F6',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 1,
    },
    tmId: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentsContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    documentType: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1F2937',
    },
    expiryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    expiryText: {
        fontSize: 11,
        fontWeight: '700',
    },
    whatsappBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22C55E',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 6,
    },
    whatsappBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
});
