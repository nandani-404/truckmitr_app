import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Colors
const COLORS = {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    background: '#F8FAFC',
    white: '#FFFFFF',
    textDark: '#0F172A',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    success: '#22C55E',
    successBg: '#F0FDF4',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#EF4444',
    errorBg: '#FEF2F2',
};

// Document type for expiring documents
interface ExpiringDocument {
    type: string;
    expiryDate: string;
    daysLeft: number;
    status: 'critical' | 'warning' | 'attention';
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
            { type: 'Driving License', expiryDate: '2026-01-18', daysLeft: 3, status: 'critical' },
            { type: 'Vehicle Insurance', expiryDate: '2026-01-25', daysLeft: 10, status: 'warning' },
        ],
    },
    {
        id: '2',
        name: 'Suresh Yadav',
        tmId: 'TM2503UDPR00002',
        mobile: '+91 87654 32109',
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        documents: [
            { type: 'RC Book', expiryDate: '2026-01-20', daysLeft: 5, status: 'critical' },
        ],
    },
    {
        id: '3',
        name: 'Amit Singh',
        tmId: 'TM2503UDPR00003',
        mobile: '+91 76543 21098',
        image: 'https://randomuser.me/api/portraits/men/3.jpg',
        documents: [
            { type: 'Pollution Certificate', expiryDate: '2026-01-22', daysLeft: 7, status: 'warning' },
            { type: 'Fitness Certificate', expiryDate: '2026-01-28', daysLeft: 13, status: 'warning' },
        ],
    },
    {
        id: '4',
        name: 'Vikram Patel',
        tmId: 'TM2503UDPR00004',
        mobile: '+91 65432 10987',
        image: 'https://randomuser.me/api/portraits/men/4.jpg',
        documents: [
            { type: 'Driving License', expiryDate: '2026-02-01', daysLeft: 17, status: 'attention' },
        ],
    },
    {
        id: '5',
        name: 'Manoj Sharma',
        tmId: 'TM2503UDPR00005',
        mobile: '+91 54321 09876',
        image: 'https://randomuser.me/api/portraits/men/5.jpg',
        documents: [
            { type: 'Vehicle Insurance', expiryDate: '2026-01-30', daysLeft: 15, status: 'warning' },
            { type: 'Road Tax', expiryDate: '2026-02-05', daysLeft: 21, status: 'attention' },
        ],
    },
];

// Filter type
type FilterType = 'All' | 'Critical' | 'Warning' | 'Attention';

export default function ForemanExpiringDocuments() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();

    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    const goBack = () => navigation.goBack();

    // Get status styling
    const getStatusStyle = (status: 'critical' | 'warning' | 'attention') => {
        switch (status) {
            case 'critical':
                return { bg: COLORS.errorBg, color: COLORS.error, borderColor: COLORS.error };
            case 'warning':
                return { bg: COLORS.warningBg, color: COLORS.warning, borderColor: COLORS.warning };
            case 'attention':
                return { bg: '#FFF7ED', color: '#EA580C', borderColor: '#FDBA74' };
            default:
                return { bg: COLORS.warningBg, color: COLORS.warning, borderColor: COLORS.warning };
        }
    };

    // Filter drivers
    const filteredDrivers = activeFilter === 'All'
        ? DRIVERS_WITH_EXPIRING_DOCS
        : DRIVERS_WITH_EXPIRING_DOCS.filter(driver =>
            driver.documents.some(doc => doc.status.toLowerCase() === activeFilter.toLowerCase())
        );

    // Filter counts
    const filterCounts = {
        All: DRIVERS_WITH_EXPIRING_DOCS.length,
        Critical: DRIVERS_WITH_EXPIRING_DOCS.filter(d => d.documents.some(doc => doc.status === 'critical')).length,
        Warning: DRIVERS_WITH_EXPIRING_DOCS.filter(d => d.documents.some(doc => doc.status === 'warning')).length,
        Attention: DRIVERS_WITH_EXPIRING_DOCS.filter(d => d.documents.some(doc => doc.status === 'attention')).length,
    };

    const filters: { key: FilterType; label: string; color: string }[] = [
        { key: 'All', label: 'All', color: COLORS.primary },
        { key: 'Critical', label: 'Critical', color: COLORS.error },
        { key: 'Warning', label: 'Warning', color: COLORS.warning },
        { key: 'Attention', label: 'Attention', color: '#EA580C' },
    ];

    const renderDriverCard = ({ item }: { item: DriverWithExpiringDocs }) => {
        const mostCriticalDoc = item.documents.reduce((prev, curr) =>
            prev.daysLeft < curr.daysLeft ? prev : curr
        );
        const statusStyle = getStatusStyle(mostCriticalDoc.status);

        return (
            <TouchableOpacity
                style={[styles.driverCard, { borderLeftColor: statusStyle.borderColor }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(STACKS.FOREMAN_DRIVER_DETAILS, { driver: item })}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <Image source={{ uri: item.image }} style={styles.avatar} />
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.driverId}>{item.tmId}</Text>
                    </View>
                    <View style={[styles.urgencyBadge, { backgroundColor: statusStyle.bg }]}>
                        <Ionicons
                            name={mostCriticalDoc.status === 'critical' ? 'alert-circle' : 'warning'}
                            size={12}
                            color={statusStyle.color}
                        />
                        <Text style={[styles.urgencyText, { color: statusStyle.color }]}>
                            {mostCriticalDoc.daysLeft} days
                        </Text>
                    </View>
                </View>

                {/* Expiring Documents */}
                <View style={styles.documentsContainer}>
                    <Text style={styles.documentsTitle}>Expiring Documents</Text>
                    {item.documents.map((doc, index) => {
                        const docStyle = getStatusStyle(doc.status);
                        return (
                            <View key={index} style={styles.documentRow}>
                                <View style={styles.documentInfo}>
                                    <MaterialCommunityIcons
                                        name="file-document-outline"
                                        size={16}
                                        color={docStyle.color}
                                    />
                                    <Text style={styles.documentType}>{doc.type}</Text>
                                </View>
                                <View style={[styles.expiryBadge, { backgroundColor: docStyle.bg }]}>
                                    <Text style={[styles.expiryText, { color: docStyle.color }]}>
                                        {doc.daysLeft <= 7 ? `${doc.daysLeft}d left` : `${doc.daysLeft} days`}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.notifyButton}>
                    <Ionicons name="notifications-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.notifyButtonText}>Notify Driver</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t('expiringDocuments', 'Expiring Documents')}</Text>
                    <Text style={styles.headerSubtitle}>{filteredDrivers.length} {t('driversNeedAction', 'drivers need action')}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterTab,
                            activeFilter === filter.key && { backgroundColor: filter.color }
                        ]}
                        onPress={() => setActiveFilter(filter.key)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            activeFilter === filter.key && styles.filterTabTextActive
                        ]}>
                            {filter.label} ({filterCounts[filter.key]})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Driver List */}
            <FlatList
                data={filteredDrivers}
                keyExtractor={(item) => item.id}
                renderItem={renderDriverCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="file-check" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Expiring Documents</Text>
                        <Text style={styles.emptySubtitle}>All driver documents are up to date</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.background,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    filterTabTextActive: {
        color: COLORS.white,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    driverCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    driverInfo: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    driverId: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    urgencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    urgencyText: {
        fontSize: 11,
        fontWeight: '700',
    },
    documentsContainer: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    documentsTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    documentType: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    expiryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    expiryText: {
        fontSize: 11,
        fontWeight: '700',
    },
    notifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        gap: 6,
    },
    notifyButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 8,
    },
});
