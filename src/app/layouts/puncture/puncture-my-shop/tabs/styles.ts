import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' }, // Clean white background
    stepContainer: { paddingHorizontal: 24, paddingTop: 24 }, // More breathing room
    contentContainer: { paddingBottom: 40 },

    classicLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' }, // Smaller, sharper labels
    optionalText: { fontSize: 12, fontWeight: '400', color: '#9CA3AF', textTransform: 'none' },
    helperText: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 20 },

    // Minimal Input: No shadow, soft border, light background
    classicInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        fontSize: 15,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56
    },
    cleanInput: { flex: 1, height: 50, fontSize: 15, color: '#111827' },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: '#F9FAFB',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    chipSelected: { backgroundColor: '#246BFD', borderColor: '#246BFD' }, // Blue selected
    chipText: { color: '#4B5563', fontWeight: '500', fontSize: 14 },
    chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },

    rowGap: { flexDirection: 'row', gap: 16 },

    // Modern GPS Button
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827', // Black primary
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8
    },
    gpsButtonText: { color: 'white', fontWeight: '500', marginLeft: 10, fontSize: 14 },
    gpsInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 14,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7'
    },
    gpsText: { fontSize: 13, color: '#15803D', marginLeft: 8, fontWeight: '500' },

    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6'
    },
    datetimeBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    datetimeText: { fontSize: 15, color: '#111827', fontWeight: '500' },

    // Grid (Facilities/Services)
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        // Minimal shadow
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    gridItemSelected: { borderColor: '#246BFD', backgroundColor: '#246BFD' }, // Blue background
    gridItemText: { marginLeft: 10, fontSize: 14, color: '#374151', flex: 1, fontWeight: '500' },
    gridItemTextSelected: { color: '#FFFFFF', fontWeight: '600' }, // White text
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    radioCircleSelected: { borderColor: '#FFFFFF' }, // White border
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }, // White dot

    // Photo Upload - Minimal Dashed Box
    photoUploadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    photoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    photoCatLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
    photoCatSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    // Modal - Bottom Sheet Style
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 24, textAlign: 'center' },
    modalBtn: { marginTop: 24, backgroundColor: '#246BFD', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100, width: '100%', alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },

    // Photo Source - Row Style Options
    photoSourceBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    photoSourceIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    photoSourceText: { fontSize: 16, fontWeight: '500', color: '#1F2937' },

    // Shop Type Grid - Minimal Cards
    shopTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
    shopTypeCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    shopTypeCardSelected: { borderColor: '#246BFD', backgroundColor: '#246BFD' }, // Blue
    shopTypeText: { color: '#4B5563', fontWeight: '500', fontSize: 13, textAlign: 'center' },
    shopTypeTextSelected: { color: '#FFFFFF', fontWeight: '700' }, // White


    yearPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    yearPickerContainer: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '85%', maxHeight: '60%' },

    // Missing Photo Styles
    removePhotoBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
        zIndex: 10,
        // Shadow
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        resizeMode: 'cover'
    },

    // Shimmer Styles
    shimmerLine: { width: 100, height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 12 },
    shimmerBox: { width: '100%', height: 56, backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 24 },

    // Internal Save Button (Aligned with Dhaba)
    saveButton: {
        backgroundColor: '#246BFD',
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 20,
        flexDirection: 'row',
        shadowColor: '#246BFD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

    // Modal Overrides/Additions
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
    modalHeader: { alignItems: 'center', marginBottom: 20 },
    modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modalDescription: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 32, lineHeight: 22, paddingHorizontal: 10 },
    modalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#246BFD', alignItems: 'center' },
    modalConfirmText: { fontSize: 16, fontWeight: '600', color: 'white' },
});
