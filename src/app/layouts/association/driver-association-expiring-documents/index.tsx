import React from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';



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

// Sample data - drivers with expiring documents
const DRIVERS_WITH_EXPIRING_DOCS: DriverWithExpiringDocs[] = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        tmId: 'TM2503UDPR00001',
        mobile: '+91 98765 43210',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        documents: [
            { type: 'Driving License', daysLeft: 3 },
            { type: 'Vehicle Insurance', daysLeft: 10 },
        ],
    },
    {
        id: '2',
        name: 'Suresh Yadav',
        tmId: 'TM2503UDPR00002',
        mobile: '+91 87654 32109',
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        documents: [
            { type: 'RC Book', daysLeft: 5 },
        ],
    },
    {
        id: '4',
        name: 'Vikram Patel',
        tmId: 'TM2503UDPR00004',
        mobile: '+91 65432 10987',
        image: 'https://randomuser.me/api/portraits/men/4.jpg',
        documents: [
            { type: 'Driving License', daysLeft: 17 },
        ],
    },
    {
        id: '5',
        name: 'Manoj Sharma',
        tmId: 'TM2503UDPR00005',
        mobile: '+91 54321 09876',
        image: 'https://randomuser.me/api/portraits/men/5.jpg',
        documents: [
            { type: 'Vehicle Insurance', daysLeft: 15 },
            { type: 'Road Tax', daysLeft: 21 },
        ],
    },
];

const DriverCard = ({ driver }: { driver: DriverWithExpiringDocs }) => {
    const { t } = useTranslation();

    const handleShareWhatsApp = () => {
        const docsList = driver.documents.map(d => `• ${d.type} - ${d.daysLeft} days left`).join('\n');
        const msg = `Hi ${driver.name}, your following documents are expiring soon:\n\n${docsList}\n\nPlease update them on TruckMitr app.\n\nTM ID: ${driver.tmId}`;
        Share.share({ message: msg });
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
                        <Text style={[styles.statusBadgeText, { color: urgencyColor.text }]}>Documents Expiring</Text>
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
                                    {doc.daysLeft <= 7 ? `${doc.daysLeft}d left` : `${doc.daysLeft} days`}
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <ScreenHeader
                title={t('association_expiring_documents')}
                titleCount={DRIVERS_WITH_EXPIRING_DOCS.length > 0 ? DRIVERS_WITH_EXPIRING_DOCS.length : undefined}
            />

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {DRIVERS_WITH_EXPIRING_DOCS.map((driver) => (
                    <DriverCard key={driver.id} driver={driver} />
                ))}
                {DRIVERS_WITH_EXPIRING_DOCS.length === 0 && (
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
