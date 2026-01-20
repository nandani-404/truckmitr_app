import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

type SubscriptionStatus = 'All' | 'Expired' | 'Expiring' | 'New';

interface Driver {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    image: string;
    status: 'Expired' | 'Expiring' | 'New';
    info: string;
    subscriptionType?: 'Job Ready Driver' | 'Verified Driver' | 'Trusted Driver';
}

// Sample data
const DRIVERS: Driver[] = [
    { id: '1', name: 'Manoj Pandey', tmId: 'TM2503UDPR00020', mobile: '+91 98123 45678', image: 'https://randomuser.me/api/portraits/men/10.jpg', status: 'Expired', info: 'Expired 4 days ago', subscriptionType: 'Job Ready Driver' },
    { id: '2', name: 'Ravi Tiwari', tmId: 'TM2503UDPR00021', mobile: '+91 87123 45678', image: 'https://randomuser.me/api/portraits/men/11.jpg', status: 'Expiring', info: 'Expires in 3 days', subscriptionType: 'Verified Driver' },
    { id: '3', name: 'Sanjay Gupta', tmId: 'TM2503UDPR00022', mobile: '+91 76123 45678', image: 'https://randomuser.me/api/portraits/men/12.jpg', status: 'Expired', info: 'Expired 8 days ago', subscriptionType: 'Trusted Driver' },
    { id: '4', name: 'Prakash Singh', tmId: 'TM2503UDPR00023', mobile: '+91 65123 45678', image: 'https://randomuser.me/api/portraits/men/13.jpg', status: 'Expiring', info: 'Expires in 6 days', subscriptionType: 'Job Ready Driver' },
    { id: '5', name: 'Rajesh Yadav', tmId: 'TM2503UDPR00024', mobile: '+91 54123 45678', image: 'https://randomuser.me/api/portraits/men/14.jpg', status: 'New', info: 'Added 3 days ago' },
    { id: '6', name: 'Amit Kumar', tmId: 'TM2503UDPR00025', mobile: '+91 43123 45678', image: 'https://randomuser.me/api/portraits/men/15.jpg', status: 'New', info: 'Added 1 week ago' },
    { id: '7', name: 'Sunil Verma', tmId: 'TM2503UDPR00026', mobile: '+91 32123 45678', image: 'https://randomuser.me/api/portraits/men/16.jpg', status: 'New', info: 'Added 2 weeks ago' },
];

// Simple Driver Card
const DriverCard = ({ driver }: { driver: Driver }) => {
    const { t } = useTranslation();

    const getStatusStyle = () => {
        if (driver.status === 'Expired') return { bg: '#FEE2E2', color: '#DC2626', label: 'Expired' };
        if (driver.status === 'Expiring') return { bg: '#FEF3C7', color: '#D97706', label: 'Expiring Soon' };
        return { bg: '#DBEAFE', color: '#2563EB', label: 'No Subscription' };
    };
    const statusStyle = getStatusStyle();

    const getSubscriptionStyle = () => {
        if (driver.subscriptionType === 'Job Ready Driver') return { bg: '#DCFCE7', color: '#16A34A' };
        if (driver.subscriptionType === 'Verified Driver') return { bg: '#DBEAFE', color: '#2563EB' };
        if (driver.subscriptionType === 'Trusted Driver') return { bg: '#F3E8FF', color: '#9333EA' };
        return { bg: '#F3F4F6', color: '#6B7280' };
    };
    const subscriptionStyle = getSubscriptionStyle();

    const handleRemind = () => {
        const msg = driver.status === 'New'
            ? `Hi ${driver.name}, please subscribe to TruckMitr to get job opportunities!\n\nTM ID: ${driver.tmId}`
            : `Hi ${driver.name}, please renew your subscription!\n\nTM ID: ${driver.tmId}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.tmId}\nMobile: ${driver.mobile}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Image source={{ uri: driver.image }} style={styles.avatar} />
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{driver.name}</Text>
                        {driver.subscriptionType && (
                            <View style={[styles.subscriptionBadge, { backgroundColor: subscriptionStyle.bg }]}>
                                <Text style={[styles.subscriptionBadgeText, { color: subscriptionStyle.color }]}>{driver.subscriptionType}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.tmId}>{driver.tmId}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusTypeBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusTypeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                        </View>
                        <Text style={styles.statusInfo}>• {driver.info}</Text>
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.remindBtn} onPress={handleRemind}>
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function ForemanPendingSubscription() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const [filter, setFilter] = useState<SubscriptionStatus>('All');

    const counts = {
        All: DRIVERS.length,
        Expired: DRIVERS.filter(d => d.status === 'Expired').length,
        Expiring: DRIVERS.filter(d => d.status === 'Expiring').length,
        New: DRIVERS.filter(d => d.status === 'New').length,
    };

    const filteredDrivers = filter === 'All' ? DRIVERS : DRIVERS.filter(d => d.status === filter);

    const tabs: { key: SubscriptionStatus; label: string; color: string }[] = [
        { key: 'All', label: 'All', color: '#6366F1' },
        { key: 'Expired', label: 'Expired', color: '#DC2626' },
        { key: 'Expiring', label: 'Expiring', color: '#D97706' },
        { key: 'New', label: 'No Subscription', color: '#2563EB' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Status</Text>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
                contentContainerStyle={styles.tabsContainer}
            >
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            filter === tab.key && { backgroundColor: tab.color }
                        ]}
                        onPress={() => setFilter(tab.key)}
                    >
                        <Text style={[
                            styles.tabText,
                            filter === tab.key && styles.tabTextActive
                        ]}>
                            {tab.label}
                        </Text>
                        <View style={[
                            styles.tabCount,
                            filter === tab.key ? styles.tabCountActive : { backgroundColor: tab.color + '20' }
                        ]}>
                            <Text style={[
                                styles.tabCountText,
                                filter === tab.key ? styles.tabCountTextActive : { color: tab.color }
                            ]}>
                                {counts[tab.key]}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Driver List */}
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {filteredDrivers.map((driver) => (
                    <DriverCard key={driver.id} driver={driver} />
                ))}
                {filteredDrivers.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        <Text style={styles.emptyText}>No drivers in this category</Text>
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
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 12,
    },
    tabsScroll: {
        flexGrow: 0,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        gap: 5,
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    tabCount: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    tabCountActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    tabCountText: {
        fontSize: 10,
        fontWeight: '700',
    },
    tabCountTextActive: {
        color: '#FFFFFF',
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
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    tmId: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 3,
    },
    subscriptionBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
    subscriptionBadgeText: {
        fontSize: 8,
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    statusTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTypeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    statusInfo: {
        fontSize: 10,
        color: '#64748B',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    remindBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
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
