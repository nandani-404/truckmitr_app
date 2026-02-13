import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const AlertTriangle = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><Path d="M12 9v4M12 17h.01" /></Svg>);
const CheckCircle = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="#22C55E" stroke="#FFF" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M9 12l2 2 4-4" /></Svg>);
const XCircle = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="#EF4444" stroke="#FFF" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M15 9l-6 6M9 9l6 6" /></Svg>);
const UploadIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Svg>);
const CalendarIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></Svg>);

interface Props { onBack?: () => void; }

interface Document { id: string; name: string; icon: string; status: 'valid' | 'expiring' | 'expired'; expiryDate: string; daysRemaining: number; }

const DocumentRenewalScreen: React.FC<Props> = ({ onBack }) => {
    const [documents, setDocuments] = useState<Document[]>([
        { id: 'dl', name: 'Driving License', icon: '🪪', status: 'valid', expiryDate: '15 Mar 2026', daysRemaining: 405 },
        { id: 'rc', name: 'Vehicle RC', icon: '📋', status: 'valid', expiryDate: '20 Aug 2025', daysRemaining: 198 },
        { id: 'insurance', name: 'Insurance', icon: '🛡️', status: 'expiring', expiryDate: '15 Feb 2024', daysRemaining: 10 },
        { id: 'permit', name: 'National Permit', icon: '📄', status: 'expired', expiryDate: '01 Feb 2024', daysRemaining: -4 },
        { id: 'fitness', name: 'Fitness Certificate', icon: '✅', status: 'valid', expiryDate: '10 Oct 2025', daysRemaining: 248 },
        { id: 'puc', name: 'PUC Certificate', icon: '🌿', status: 'expiring', expiryDate: '20 Feb 2024', daysRemaining: 15 },
    ]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const expiredDocs = documents.filter(d => d.status === 'expired');
    const expiringDocs = documents.filter(d => d.status === 'expiring');
    const validDocs = documents.filter(d => d.status === 'valid');

    const handleRenew = (doc: Document) => {
        setSelectedDoc(doc);
        setShowUploadModal(true);
    };

    const simulateUpload = () => {
        if (selectedDoc) {
            setDocuments(docs => docs.map(d => d.id === selectedDoc.id ? { ...d, status: 'valid' as const, expiryDate: '05 Feb 2025', daysRemaining: 365 } : d));
        }
        setShowUploadModal(false);
        setSelectedDoc(null);
        Alert.alert('Success', 'Document uploaded successfully! Under verification.');
    };

    const DocumentCard = ({ doc, index }: { doc: Document; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }).start();
        }, []);

        const statusConfig = {
            valid: { bg: '#DCFCE7', color: '#15803D', text: 'Valid', Icon: CheckCircle },
            expiring: { bg: '#FEF3C7', color: '#D97706', text: 'Expiring Soon', Icon: AlertTriangle },
            expired: { bg: '#FEE2E2', color: '#DC2626', text: 'Expired', Icon: XCircle },
        };
        const config = statusConfig[doc.status];

        return (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
                <View style={[styles.docCard, { borderLeftColor: config.color }]}>
                    <View style={styles.docLeft}>
                        <View style={styles.docIconBox}><Text style={styles.docEmoji}>{doc.icon}</Text></View>
                    </View>
                    <View style={styles.docCenter}>
                        <Text style={styles.docName}>{doc.name}</Text>
                        <View style={styles.docMeta}>
                            <CalendarIcon /><Text style={styles.docExpiry}>Expires: {doc.expiryDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <config.Icon /><Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                        </View>
                    </View>
                    {doc.status !== 'valid' && (
                        <TouchableOpacity style={styles.renewBtn} onPress={() => handleRenew(doc)}>
                            <LinearGradient colors={doc.status === 'expired' ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']} style={styles.renewBtnGradient}>
                                <Text style={styles.renewBtnText}>Renew</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>Document Renewal</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Alert Banner */}
            {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
                <Animated.View style={[styles.alertBanner, { opacity: fadeAnim }]}>
                    <AlertTriangle />
                    <Text style={styles.alertText}>
                        {expiredDocs.length > 0 ? `${expiredDocs.length} document(s) expired!` : `${expiringDocs.length} document(s) expiring soon`}
                    </Text>
                </Animated.View>
            )}

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Expired */}
                {expiredDocs.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>⚠️ Expired ({expiredDocs.length})</Text>
                        {expiredDocs.map((doc, index) => <DocumentCard key={doc.id} doc={doc} index={index} />)}
                    </>
                )}

                {/* Expiring Soon */}
                {expiringDocs.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: '#D97706' }]}>⏰ Expiring Soon ({expiringDocs.length})</Text>
                        {expiringDocs.map((doc, index) => <DocumentCard key={doc.id} doc={doc} index={index} />)}
                    </>
                )}

                {/* Valid */}
                <Text style={[styles.sectionTitle, { color: '#15803D' }]}>✅ Valid Documents ({validDocs.length})</Text>
                {validDocs.map((doc, index) => <DocumentCard key={doc.id} doc={doc} index={index} />)}
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Upload Modal */}
            <Modal visible={showUploadModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Renew {selectedDoc?.name}</Text>
                        <Text style={styles.modalSubtitle}>Upload new document to renew</Text>
                        <TouchableOpacity style={styles.uploadBtn} onPress={simulateUpload}>
                            <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.uploadBtnGradient}>
                                <UploadIcon /><Text style={styles.uploadBtnText}>Upload Document</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUploadModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 12, gap: 10 },
    alertText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 0 },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
    docLeft: { marginRight: 14 },
    docIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    docEmoji: { fontSize: 22 },
    docCenter: { flex: 1 },
    docName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    docMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    docExpiry: { fontSize: 12, color: '#6B7280' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
    renewBtn: { borderRadius: 10, overflow: 'hidden' },
    renewBtnGradient: { paddingHorizontal: 16, paddingVertical: 10 },
    renewBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    uploadBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
    uploadBtnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
    uploadBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    cancelBtn: { paddingVertical: 12 },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});

export default DocumentRenewalScreen;
