import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const SettingsIcon = () => (<Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><Circle cx="12" cy="12" r="3" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>);
const CheckAllIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M18 7l-8 8-4-4" /><Path d="M22 7l-8 8-1-1" /></Svg>);

interface Props { onBack?: () => void; onNotificationPress?: (id: string) => void; }

type NotificationType = 'load' | 'payment' | 'document' | 'system' | 'trip';

interface Notification {
    id: string; type: NotificationType; title: string; message: string; time: string; isRead: boolean; data?: any;
}

const TruckerNotificationsScreen: React.FC<Props> = ({ onBack, onNotificationPress }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', type: 'load', title: 'New Load Available', message: 'A new load Mumbai → Delhi is available matching your preferences.', time: '5 min ago', isRead: false },
        { id: '2', type: 'payment', title: 'Payment Received! 💰', message: 'Payment of ₹15,000 for Load #LM-34919 has been credited.', time: '2 hrs ago', isRead: false },
        { id: '3', type: 'trip', title: 'Trip Status Updated', message: 'Your trip #LM-34921 status changed to "In Transit".', time: '4 hrs ago', isRead: true },
        { id: '4', type: 'document', title: 'Document Expiring Soon', message: 'Your RC will expire in 15 days. Please renew it.', time: '1 day ago', isRead: true },
        { id: '5', type: 'load', title: 'Bid Accepted! 🎉', message: 'Your bid of ₹18,000 for Pune → Surat has been accepted.', time: '1 day ago', isRead: true },
        { id: '6', type: 'system', title: 'App Update Available', message: 'Update to v2.5 for new features and bug fixes.', time: '2 days ago', isRead: true },
        { id: '7', type: 'payment', title: 'Pending Payment', message: 'Payment for Load #LM-34915 is pending. Contact support.', time: '3 days ago', isRead: true },
    ]);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const typeConfig: Record<NotificationType, { icon: string; bg: string; color: string }> = {
        load: { icon: '📦', bg: '#DBEAFE', color: '#3B82F6' },
        payment: { icon: '💰', bg: '#D1FAE5', color: '#22C55E' },
        document: { icon: '📄', bg: '#FEF3C7', color: '#F59E0B' },
        system: { icon: '⚙️', bg: '#E5E7EB', color: '#6B7280' },
        trip: { icon: '🚚', bg: '#EDE9FE', color: '#8B5CF6' },
    };

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        onNotificationPress?.(id);
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const NotificationCard = ({ item, index }: { item: Notification; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }).start();
        }, []);

        const config = typeConfig[item.type];

        return (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateX: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }}>
                <TouchableOpacity style={[styles.notifCard, !item.isRead && styles.notifCardUnread]} activeOpacity={0.9} onPress={() => markAsRead(item.id)}>
                    <View style={[styles.notifIcon, { backgroundColor: config.bg }]}><Text style={styles.notifEmoji}>{config.icon}</Text></View>
                    <View style={styles.notifContent}>
                        <View style={styles.notifHeader}>
                            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>{item.title}</Text>
                            {!item.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const todayNotifs = notifications.filter(n => n.time.includes('min') || n.time.includes('hr'));
    const earlierNotifs = notifications.filter(n => n.time.includes('day'));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount}</Text></View>}
                </View>
                <TouchableOpacity style={styles.settingsBtn}><SettingsIcon /></TouchableOpacity>
            </View>

            {/* Mark All Read */}
            {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                    <CheckAllIcon /><Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
            )}

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}>

                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Today */}
                    {todayNotifs.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Today</Text>
                            {todayNotifs.map((n, i) => <NotificationCard key={n.id} item={n} index={i} />)}
                        </View>
                    )}

                    {/* Earlier */}
                    {earlierNotifs.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Earlier</Text>
                            {earlierNotifs.map((n, i) => <NotificationCard key={n.id} item={n} index={i + todayNotifs.length} />)}
                        </View>
                    )}

                    {notifications.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🔔</Text>
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptyText}>No notifications at the moment</Text>
                        </View>
                    )}
                </Animated.View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerBadge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    headerBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    settingsBtn: { padding: 8 },
    markAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 20, backgroundColor: '#EFF6FF', borderRadius: 12, gap: 8, marginBottom: 10 },
    markAllText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    notifCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderLeftWidth: 0 },
    notifCardUnread: { borderLeftWidth: 4, borderLeftColor: '#3B82F6', backgroundColor: '#FFFFFF' },
    notifIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    notifEmoji: { fontSize: 22 },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    notifTitle: { fontSize: 15, fontWeight: '600', color: '#374151', flex: 1 },
    notifTitleUnread: { fontWeight: '700', color: '#111827' },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
    notifMessage: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
    notifTime: { fontSize: 11, color: '#9CA3AF' },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6B7280' },
});

export default TruckerNotificationsScreen;
