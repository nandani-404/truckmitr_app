import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Alert, Modal, Image, PermissionsAndroid, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const CameraIcon = () => (<Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></Svg>);
const CheckCircleIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="#22C55E" stroke="#FFF" strokeWidth="2"><Circle cx="12" cy="12" r="10" fill="#22C55E" /><Path d="M9 12l2 2 4-4" /></Svg>);
const UploadCloudIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Svg>);
const ImageIcon = () => (<Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Path d="M21 15l-5-5L5 21" /></Svg>);

interface Props { onBack?: () => void; onComplete?: () => void; }

interface DocumentItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    required: boolean;
    uploaded: boolean;
    frontBack?: boolean;
    frontUploaded?: boolean;
    backUploaded?: boolean;
    imageUri?: string;
    frontImageUri?: string;
    backImageUri?: string;
}

const initialDocuments: DocumentItem[] = [
    { id: 'dl', name: 'Driving License', description: 'Front & back side clear photo', icon: '🪪', required: true, uploaded: false, frontBack: true, frontUploaded: false, backUploaded: false },
    { id: 'rc', name: 'Vehicle Registration (RC)', description: 'Vehicle registration certificate', icon: '📋', required: true, uploaded: false },
    { id: 'insurance', name: 'Vehicle Insurance', description: 'Valid insurance document', icon: '🛡️', required: true, uploaded: false },
    { id: 'permit', name: 'Transport Permits', description: 'State/National permits', icon: '📄', required: false, uploaded: false },
    { id: 'pan', name: 'PAN Card', description: 'For payment verification', icon: '💳', required: false, uploaded: false },
    { id: 'aadhaar', name: 'Aadhaar Card', description: 'Identity verification', icon: '🆔', required: false, uploaded: false },
];

const TruckerDocumentUploadScreen: React.FC<Props> = ({ onBack, onComplete }) => {
    const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadSide, setUploadSide] = useState<'front' | 'back' | 'single'>('single');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    const handleUpload = useCallback((doc: DocumentItem, side?: 'front' | 'back') => {
        setSelectedDoc(doc);
        setUploadSide(side || 'single');
        setShowUploadModal(true);
    }, []);

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs access to your camera to take photos of documents',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleCameraLaunch = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos');
            return;
        }

        const options = {
            mediaType: 'photo' as const,
            quality: 0.8 as const,
            saveToPhotos: false,
            includeBase64: false,
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            handleImageResponse(response);
        });
    };

    const handleGalleryLaunch = () => {
        const options = {
            mediaType: 'photo' as const,
            quality: 0.8 as const,
            selectionLimit: 1,
            includeBase64: false,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            handleImageResponse(response);
        });
    };

    const handleImageResponse = (response: ImagePickerResponse) => {
        if (response.didCancel) {
            console.log('User cancelled image picker');
            return;
        }

        if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Failed to pick image');
            return;
        }

        if (response.assets && response.assets.length > 0) {
            const imageUri = response.assets[0].uri;
            if (imageUri && selectedDoc) {
                updateDocumentWithImage(imageUri);
            }
        }

        setShowUploadModal(false);
    };

    const updateDocumentWithImage = (imageUri: string) => {
        if (selectedDoc) {
            setDocuments(docs => docs.map(d => {
                if (d.id === selectedDoc.id) {
                    if (d.frontBack) {
                        if (uploadSide === 'front') {
                            return {
                                ...d,
                                frontUploaded: true,
                                frontImageUri: imageUri,
                                uploaded: true && (d.backUploaded || false)
                            };
                        } else if (uploadSide === 'back') {
                            return {
                                ...d,
                                backUploaded: true,
                                backImageUri: imageUri,
                                uploaded: (d.frontUploaded || false) && true
                            };
                        }
                    }
                    return { ...d, uploaded: true, imageUri };
                }
                return d;
            }));
        }
        setSelectedDoc(null);
    };

    const simulateUpload = useCallback(() => {
        if (selectedDoc) {
            setDocuments(docs => docs.map(d => {
                if (d.id === selectedDoc.id) {
                    if (d.frontBack) {
                        if (uploadSide === 'front') {
                            const newFront = true;
                            return { ...d, frontUploaded: newFront, uploaded: newFront && (d.backUploaded || false) };
                        } else if (uploadSide === 'back') {
                            const newBack = true;
                            return { ...d, backUploaded: newBack, uploaded: (d.frontUploaded || false) && newBack };
                        }
                    }
                    return { ...d, uploaded: true };
                }
                return d;
            }));
        }
        setShowUploadModal(false);
        setSelectedDoc(null);
    }, [selectedDoc, uploadSide]);

    const closeModal = useCallback(() => {
        setShowUploadModal(false);
        setSelectedDoc(null);
    }, []);

    const requiredDocs = documents.filter(d => d.required);
    const optionalDocs = documents.filter(d => !d.required);
    const uploadedRequired = requiredDocs.filter(d => d.uploaded).length;
    const allRequiredUploaded = uploadedRequired === requiredDocs.length;

    const handleSubmit = useCallback(() => {
        if (!allRequiredUploaded) {
            Alert.alert('Required Documents', 'Please upload all required documents to continue');
            return;
        }
        onComplete?.();
    }, [allRequiredUploaded, onComplete]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Complete Your Profile</Text>
                    <Text style={styles.headerSubtitle}>Step 2 of 2</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>



            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Progress Card */}
                <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
                    <LinearGradient colors={allRequiredUploaded ? ['#22C55E', '#16A34A'] : ['#F97316', '#EA580C']} style={styles.progressGradient}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressNum}>{uploadedRequired}/{requiredDocs.length}</Text>
                        </View>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressTitle}>
                                {allRequiredUploaded ? '🎉 All Required Documents Uploaded!' : 'Required Documents'}
                            </Text>
                            <Text style={styles.progressSubtitle}>
                                {allRequiredUploaded ? 'Ready for verification' : `${requiredDocs.length - uploadedRequired} more required`}
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Required Documents */}
                <Text style={styles.sectionTitle}>📋 Required Documents</Text>
                {requiredDocs.map((doc, index) => {
                    const isComplete = doc.frontBack ? (doc.frontUploaded && doc.backUploaded) : doc.uploaded;
                    return (
                        <Animated.View
                            key={doc.id}
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                            }}
                        >
                            <View style={[styles.docCard, isComplete && styles.docCardComplete]}>
                                <View style={[styles.docIconBox, isComplete && styles.docIconBoxComplete]}>
                                    <Text style={styles.docEmoji}>{doc.icon}</Text>
                                </View>
                                <View style={styles.docInfo}>
                                    <View style={styles.docHeader}>
                                        <Text style={styles.docName}>{doc.name}</Text>
                                        <View style={styles.requiredBadge}><Text style={styles.requiredText}>Required</Text></View>
                                    </View>
                                    <Text style={styles.docDesc}>{doc.description}</Text>

                                    {doc.frontBack ? (
                                        <View style={styles.frontBackRow}>
                                            <TouchableOpacity
                                                style={[styles.sideBtn, doc.frontUploaded && styles.sideBtnDone]}
                                                onPress={() => handleUpload(doc, 'front')}>
                                                {doc.frontUploaded ? <CheckCircleIcon /> : <CameraIcon />}
                                                <Text style={[styles.sideBtnText, doc.frontUploaded && styles.sideBtnTextDone]}>
                                                    {doc.frontUploaded ? 'Front ✓' : 'Front'}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.sideBtn, doc.backUploaded && styles.sideBtnDone]}
                                                onPress={() => handleUpload(doc, 'back')}>
                                                {doc.backUploaded ? <CheckCircleIcon /> : <CameraIcon />}
                                                <Text style={[styles.sideBtnText, doc.backUploaded && styles.sideBtnTextDone]}>
                                                    {doc.backUploaded ? 'Back ✓' : 'Back'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.uploadBtn, isComplete && styles.uploadBtnDone]}
                                            onPress={() => handleUpload(doc)}>
                                            {isComplete ? <CheckCircleIcon /> : <UploadCloudIcon />}
                                            <Text style={[styles.uploadBtnText, isComplete && styles.uploadBtnTextDone]}>
                                                {isComplete ? 'Uploaded ✓' : 'Upload'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </Animated.View>
                    );
                })}

                {/* Optional Documents */}
                <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>📎 Optional Documents</Text>
                {optionalDocs.map((doc) => {
                    const isComplete = doc.uploaded;
                    return (
                        <View key={doc.id} style={[styles.docCard, isComplete && styles.docCardComplete]}>
                            <View style={[styles.docIconBox, isComplete && styles.docIconBoxComplete]}>
                                <Text style={styles.docEmoji}>{doc.icon}</Text>
                            </View>
                            <View style={styles.docInfo}>
                                <View style={styles.docHeader}>
                                    <Text style={styles.docName}>{doc.name}</Text>
                                </View>
                                <Text style={styles.docDesc}>{doc.description}</Text>
                                <TouchableOpacity
                                    style={[styles.uploadBtn, isComplete && styles.uploadBtnDone]}
                                    onPress={() => handleUpload(doc)}>
                                    {isComplete ? <CheckCircleIcon /> : <UploadCloudIcon />}
                                    <Text style={[styles.uploadBtnText, isComplete && styles.uploadBtnTextDone]}>
                                        {isComplete ? 'Uploaded ✓' : 'Upload'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>📸 Tips for Clear Photos</Text>
                    <Text style={styles.tipItem}>• Place document on a flat surface</Text>
                    <Text style={styles.tipItem}>• Ensure good lighting</Text>
                    <Text style={styles.tipItem}>• All corners should be visible</Text>
                    <Text style={styles.tipItem}>• Avoid glare and shadows</Text>
                </View>
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.stickyFooter}>
                <TouchableOpacity
                    style={[styles.submitBtn, !allRequiredUploaded && styles.submitBtnDisabled]}
                    onPress={handleSubmit}>
                    <LinearGradient
                        colors={allRequiredUploaded ? ['#22C55E', '#16A34A'] : ['#F97316', '#EA580C']}
                        style={styles.submitBtnGradient}>
                        <Text style={styles.submitBtnText}>
                            {allRequiredUploaded ? 'Complete Registration' : `Upload ${requiredDocs.length - uploadedRequired} More`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Upload Modal */}
            <Modal visible={showUploadModal} animationType="slide" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Upload {selectedDoc?.name} {uploadSide !== 'single' && `(${uploadSide} side)`}
                        </Text>
                        <View style={styles.uploadOptions}>
                            <TouchableOpacity style={styles.uploadOption} onPress={handleCameraLaunch}>
                                <View style={styles.uploadOptionIcon}><CameraIcon /></View>
                                <Text style={styles.uploadOptionText}>Take Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadOption} onPress={handleGalleryLaunch}>
                                <View style={styles.uploadOptionIcon}><ImageIcon /></View>
                                <Text style={styles.uploadOptionText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { padding: 8, marginLeft: -8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    headerSpacer: { width: 40 },
    progressCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
    progressGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    progressCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    progressNum: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    progressInfo: { flex: 1 },
    progressTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    progressSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 120 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 14 },
    sectionTitleMargin: { marginTop: 10 },
    docCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
    docCardComplete: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    docIconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    docIconBoxComplete: { backgroundColor: '#DCFCE7' },
    docEmoji: { fontSize: 24 },
    docInfo: { flex: 1 },
    docHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    docName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginRight: 8 },
    requiredBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    requiredText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
    docDesc: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
    frontBackRow: { flexDirection: 'row', gap: 10 },
    sideBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', paddingVertical: 10, borderRadius: 10, gap: 6 },
    sideBtnDone: { backgroundColor: '#DCFCE7' },
    sideBtnText: { fontSize: 13, fontWeight: '600', color: '#F97316' },
    sideBtnTextDone: { color: '#15803D' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', paddingVertical: 10, borderRadius: 10, gap: 8 },
    uploadBtnDone: { backgroundColor: '#DCFCE7' },
    uploadBtnText: { fontSize: 13, fontWeight: '600', color: '#F97316' },
    uploadBtnTextDone: { color: '#15803D' },
    tipsCard: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#FDE68A', marginTop: 10 },
    tipsTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 12 },
    tipItem: { fontSize: 13, color: '#78350F', marginBottom: 6 },
    bottomSpacer: { height: 100 },
    stickyFooter: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    submitBtn: { borderRadius: 14, overflow: 'hidden' },
    submitBtnDisabled: { opacity: 0.9 },
    submitBtnGradient: { paddingVertical: 16, alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 24 },
    uploadOptions: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    uploadOption: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    uploadOptionIcon: { marginBottom: 12 },
    uploadOptionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    cancelBtn: { paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});

export default TruckerDocumentUploadScreen;
