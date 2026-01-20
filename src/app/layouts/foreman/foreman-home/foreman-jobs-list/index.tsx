import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '@truckmitr/stacks/stacks';
import { showToast } from '@truckmitr/src/app/hooks/toast';

// Mock Data for Jobs
const JOBS_DATA = [
    {
        id: '1',
        title: 'Heavy Truck Driver',
        company: 'Logistics India Pvt Ltd',
        location: 'Mumbai - Pune Route',
        salary: '₹25,000 - ₹35,000',
        type: 'Full Time',
        posted: '2 days ago',
    },
    {
        id: '2',
        title: 'Container Driver',
        company: 'Safe Move Transport',
        location: 'Delhi NCR',
        salary: '₹18,000 - ₹22,000',
        type: 'Contract',
        posted: '5 hrs ago',
    },
    {
        id: '3',
        title: 'Trailer Driver',
        company: 'Express Cargo',
        location: 'Bangalore - Chennai',
        salary: '₹30,000 - ₹45,000',
        type: 'Full Time',
        posted: '1 day ago',
    },
    {
        id: '4',
        title: 'Tanker Driver',
        company: 'Oil & Gas Carriers',
        location: 'Gujarat (Pan India)',
        salary: '₹40,000+',
        type: 'Contract',
        posted: '3 days ago',
    }
];

// Mock Data for Drivers (Pilots)
const DRIVERS_DATA = [
    { id: '1', name: 'Ramesh Kumar', tmId: 'TM2301DR0012', status: 'Trusted Driver', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: '2', name: 'Vikas Verma', tmId: 'TM2301DR0045', status: 'Verified Driver', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: '3', name: 'Suresh Singh', tmId: 'TM2301DR0089', status: 'Job Ready Driver', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
    { id: '4', name: 'Rajesh Yadav', tmId: 'TM2301DR0112', status: 'Verified Driver', image: 'https://randomuser.me/api/portraits/men/67.jpg' },
    { id: '5', name: 'Amit Sharma', tmId: 'TM2301DR0156', status: 'Job Ready Driver', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
];

const ForemanJobsList = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const handleSharePress = (jobId: string) => {
        setCurrentJobId(jobId);
        setSelectedDrivers([]); // Reset selection on new share
        setSearchQuery(''); // Reset search
        setModalVisible(true);
    };

    const filteredDrivers = DRIVERS_DATA.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedDrivers.length === filteredDrivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(filteredDrivers.map(d => d.id));
        }
    };

    const toggleDriverSelection = (driverId: string) => {
        if (selectedDrivers.includes(driverId)) {
            setSelectedDrivers(prev => prev.filter(id => id !== driverId));
        } else {
            setSelectedDrivers(prev => [...prev, driverId]);
        }
    };

    const handleShareConfirm = () => {
        if (selectedDrivers.length === 0) {
            showToast('Please select at least one driver');
            return;
        }
        setModalVisible(false);
        showToast(`Job shared with ${selectedDrivers.length} drivers successfully!`);
        // Logic to actually share would go here
    };

    const renderJobItem = ({ item }: { item: typeof JOBS_DATA[0] }) => (
        <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.jobCompany}>{item.company}</Text>
                </View>
                <TouchableOpacity onPress={() => handleSharePress(item.id)} style={styles.shareButton}>
                    <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <View style={styles.jobDetailsRow}>
                <View style={styles.detailBadge}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.location}</Text>
                </View>
                <View style={styles.detailBadge}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.type}</Text>
                </View>
            </View>

            <View style={styles.salaryRow}>
                <Text style={styles.salaryText}>{item.salary}</Text>
                <Text style={styles.postedText}>{item.posted}</Text>
            </View>

            <TouchableOpacity style={styles.viewDetailsButton} onPress={() => { /* Navigate to Job Details if needed */ }}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
        </View>
    );

    const renderDriverItem = (item: typeof DRIVERS_DATA[0]) => {
        const isSelected = selectedDrivers.includes(item.id);
        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.driverItem, isSelected && styles.driverItemSelected]}
                onPress={() => toggleDriverSelection(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.driverInfoLeft}>
                    <Image source={{ uri: item.image }} style={styles.driverImage} />
                    <View style={styles.driverTextContainer}>
                        <View style={styles.nameStatusRow}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: item.status === 'Trusted Driver' ? '#F3E8FF' :
                                    item.status === 'Verified Driver' ? '#DCFCE7' :
                                        item.status === 'Job Ready Driver' ? '#DBEAFE' : '#F1F5F9'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: item.status === 'Trusted Driver' ? '#7E22CE' :
                                        item.status === 'Verified Driver' ? '#166534' :
                                            item.status === 'Job Ready Driver' ? '#1E40AF' : '#64748B'
                                }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.driverTmId}>{item.tmId}</Text>
                    </View>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Available Jobs</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={JOBS_DATA}
                renderItem={renderJobItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Share Driver Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Share Job Details to Drivers</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Select drivers from your list to share this job.</Text>

                        {/* Search and Select All Row */}
                        <View style={styles.searchRow}>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color="#64748B" />
                                <TextInput
                                    placeholder="Search drivers..."
                                    style={styles.searchInput}
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
                                <Text style={styles.selectAllText}>
                                    {selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0 ? 'Deselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.driverListContainer}>
                            {filteredDrivers.map(renderDriverItem)}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.shareConfirmButton, selectedDrivers.length === 0 && styles.disabledButton]}
                                onPress={handleShareConfirm}
                                disabled={selectedDrivers.length === 0}
                            >
                                <Text style={styles.shareConfirmText}>Share ({selectedDrivers.length})</Text>
                                <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    listContent: {
        padding: 16,
    },
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#64748B', // Soft shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    jobCompany: {
        fontSize: 14,
        color: '#64748B',
    },
    shareButton: {
        padding: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    jobDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    detailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#475569',
    },
    salaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    salaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    postedText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        gap: 4,
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1E293B',
    },
    selectAllButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    selectAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    driverListContainer: {
        marginBottom: 20,
    },
    driverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    driverItemSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    driverInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    driverImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    driverTextContainer: {
        flex: 1,
    },
    nameStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    driverName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    driverTmId: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    modalFooter: {
        paddingTop: 10,
    },
    shareConfirmButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    shareConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ForemanJobsList;
