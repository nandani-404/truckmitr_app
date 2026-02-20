import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';

// --- Icons ---
const BellIcon = ({ size = 24, color = "#1f2937" }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
);

const TruckIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" />
        <Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

const CheckIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <Path d="M22 4L12 14.01l-3-3" />
    </Svg>
);

const FileTextIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Path d="M14 2v6h6" />
        <Path d="M16 13H8" />
        <Path d="M16 17H8" />
        <Path d="M10 9H8" />
    </Svg>
);

const CreditCardIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 4h22v16H1z" />
        <Path d="M1 10h22" />
    </Svg>
);

const ArrowLeftIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

// --- Types ---
type NotificationType = 'offer' | 'status' | 'pod' | 'payment' | 'system';

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    loadId?: string;
}

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        type: 'offer',
        title: 'New Offer Received',
        message: 'Raj Transport quoted ₹33,000 for Load LD-10245',
        time: '2 mins ago',
        read: false,
        loadId: 'LD-10245'
    },
    {
        id: '2',
        type: 'status',
        title: 'Truck Assigned',
        message: 'Truck MH12AB1234 assigned to Load LD-10245',
        time: '10 mins ago',
        read: false,
    },
    {
        id: '3',
        type: 'pod',
        title: 'POD Uploaded',
        message: 'POD uploaded for Load LD-10245',
        time: '1 hour ago',
        read: true,
    },
    {
        id: '4',
        type: 'payment',
        title: 'Payment Reminder',
        message: 'Payment pending for Load LD-10245',
        time: 'Yesterday',
        read: true,
    }
];

const ShipperNotifications = () => {
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handlePress = (item: NotificationItem) => {
        // Mark as read
        if (!item.read) {
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        }

        // Navigation logic (Deep linking)
        console.log(`Navigating for ${item.type}`);
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'offer': return <TruckIcon />;
            case 'status': return <CheckIcon />;
            case 'pod': return <FileTextIcon />;
            case 'payment': return <CreditCardIcon />;
            default: return <BellIcon size={20} color="#6b7280" />;
        }
    };

    const getIconBg = (type: NotificationType) => {
        switch (type) {
            case 'offer': return '#eff6ff';
            case 'status': return '#f0fdf4';
            case 'pod': return '#fffbeb';
            case 'payment': return '#fef2f2';
            default: return '#f3f4f6';
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                    {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeftIcon />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    onPress={markAllRead}
                    disabled={unreadCount === 0}
                    style={styles.markReadBtn}
                >
                    <Text style={[styles.markRead, unreadCount === 0 && styles.markReadDisabled]}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <BellIcon size={48} color="#e5e7eb" />
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptySub}>You'll see updates here.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        bottom: 14,
        padding: 4,
        zIndex: 1,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    markRead: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
    markReadBtn: {
        position: 'absolute',
        right: 16,
        bottom: 18,
        zIndex: 1,
    },
    markReadDisabled: { color: '#9ca3af' },
    listContent: { padding: 20 },
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    unreadCard: {
        backgroundColor: '#f8fafc',
        borderColor: '#e5e7eb',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    content: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    title: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
    unreadTitle: { fontWeight: '700', color: '#111827' },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 6 },
    message: { fontSize: 12, color: '#6b7280', marginBottom: 3, lineHeight: 16 },
    time: { fontSize: 11, color: '#9ca3af' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});

export default ShipperNotifications;
