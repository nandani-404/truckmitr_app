
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { userAction, userEditAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Association Profile Steps
const ASSOCIATION_STEPS = [
    {
        id: 'association_details',
        title: 'Association Information',
        subtitle: 'Enter your association basic details',
        progress: 40,
        required: true
    },
    {
        id: 'add_members',
        title: 'Add Association Members',
        subtitle: 'Add key members to your association',
        progress: 100,
        required: false
    },
];

// Association Types
const ASSOCIATION_TYPES = [
    { id: 'union', label: 'Union' },
    { id: 'society', label: 'Society' },
    { id: 'trust', label: 'Trust' },
    { id: 'informal', label: 'Informal' },
];

// Member Roles
const MEMBER_ROLES = [
    { id: 'secretary', label: 'Secretary', description: 'Driver onboarding, job tracking' },
    { id: 'treasurer', label: 'Treasurer', description: 'Earnings, commission, payout view' },
    { id: 'verification_officer', label: 'Verification Officer', description: 'Driver verification & document approval' },
    { id: 'coordinator', label: 'Coordinator', description: 'Limited driver addition' },
];

// Indian States
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

interface MemberData {
    id: string;
    role: string;
    name: string;
    mobile: string;
    email: string;
    state: string;
}

export default function ProfileCompletionAssociation() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { userEdit, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);

    const [finishing, setFinishing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Association Details State
    const [associationName, setAssociationName] = useState('');
    const [associationType, setAssociationType] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [officeAddress, setOfficeAddress] = useState('');
    const [operatingStates, setOperatingStates] = useState<string[]>([]);
    const [coverageArea, setCoverageArea] = useState('');

    // Member Management State
    const [members, setMembers] = useState<MemberData[]>([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMember, setNewMember] = useState<MemberData>({
        id: '',
        role: '',
        name: '',
        mobile: '',
        email: '',
        state: '',
    });

    // Commission Setup State
    const [subscriptionCommission, setSubscriptionCommission] = useState('');
    const [placementCommission, setPlacementCommission] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');

    // Verification State
    const [associationDocUploaded, setAssociationDocUploaded] = useState(false);
    const [addressVerified, setAddressVerified] = useState(false);
    const [presidentIdVerified, setPresidentIdVerified] = useState(false);

    // Modals
    const [statePickerOpen, setStatePickerOpen] = useState(false);
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [memberStatePickerOpen, setMemberStatePickerOpen] = useState(false);

    // Animations
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);

    const STEPS = ASSOCIATION_STEPS;
    const currentProgress = STEPS[currentStep].progress;
    const progressWidth = useSharedValue(currentProgress);

    useEffect(() => {
        progressWidth.value = withSpring(STEPS[currentStep].progress, { damping: 15, stiffness: 90 });
    }, [currentStep]);

    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 20;
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateX.value = withSpring(0, { damping: 12 });
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [currentStep]);

    // Keyboard Visibility Handling
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));
    const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

    const handleNext = async () => {
        const step = STEPS[currentStep];

        // Validation based on step
        if (step.id === 'association_details') {
            if (!associationName.trim()) {
                showToast('Please enter Association Name');
                return;
            }
            if (!associationType) {
                showToast('Please select Association Type');
                return;
            }
            if (!officeAddress.trim()) {
                showToast('Please enter Office Address');
                return;
            }
            if (operatingStates.length === 0) {
                showToast('Please select at least one Operating State');
                return;
            }
        }

        if (step.id === 'commission_setup') {
            if (!accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
                showToast('Please fill all bank details');
                return;
            }
        }

        if (currentStep < STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev + 1), 200);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev - 1), 200);
        }
    };

    const addMember = () => {
        if (!newMember.role || !newMember.name || !newMember.mobile || !newMember.state) {
            showToast('Please fill all required member details');
            return;
        }
        const memberWithId = { ...newMember, id: Date.now().toString() };
        setMembers([...members, memberWithId]);
        setNewMember({ id: '', role: '', name: '', mobile: '', email: '', state: '' });
        setShowAddMemberModal(false);
        showToast('Member added successfully! They will receive an invite.');
    };

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
    };

    const toggleState = (state: string) => {
        if (operatingStates.includes(state)) {
            setOperatingStates(operatingStates.filter(s => s !== state));
        } else {
            setOperatingStates([...operatingStates, state]);
        }
    };

    const submitProfile = async () => {
        setFinishing(true);
        try {
            const formData = new FormData();
            formData.append('association_name', associationName);
            formData.append('association_type', associationType);
            formData.append('registration_number', registrationNumber);
            formData.append('office_address', officeAddress);
            formData.append('operating_states', JSON.stringify(operatingStates));
            formData.append('coverage_area', coverageArea);
            formData.append('members', JSON.stringify(members));
            formData.append('subscription_commission', subscriptionCommission);
            formData.append('placement_commission', placementCommission);
            formData.append('account_holder_name', accountHolderName);
            formData.append('bank_name', bankName);
            formData.append('account_number', accountNumber);
            formData.append('ifsc_code', ifscCode);

            console.log('Association Profile Submission:', formData);

            // Simulating API call
            setTimeout(() => {
                setFinishing(false);
                showToast('Profile Submitted Successfully!');
                dispatch(userAuthenticatedAction(true));
            }, 1500);

        } catch (error: any) {
            setFinishing(false);
            showToast(error?.message || 'Failed to update profile');
        }
    };

    const renderAssociationDetails = () => (
        <View style={styles.stepContainer}>
            {/* Association Name */}
            <Text style={styles.classicLabel}>Association Name <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter Association Name"
                value={associationName}
                onChangeText={setAssociationName}
            />

            <Space height={20} />

            {/* Association Type */}
            <Text style={styles.classicLabel}>Association Type <Text style={styles.requiredStar}>*</Text></Text>
            <View style={styles.typeGrid}>
                {ASSOCIATION_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={[
                            styles.typeCard,
                            associationType === type.id && styles.typeCardSelected
                        ]}
                        onPress={() => setAssociationType(type.id)}
                    >
                        <Text style={[
                            styles.typeCardText,
                            associationType === type.id && styles.typeCardTextSelected
                        ]}>
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Space height={20} />

            {/* Registration Number */}
            <Text style={styles.classicLabel}>Registration Number (Optional)</Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter Registration Number"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
            />

            <Space height={20} />

            {/* Office Address */}
            <Text style={styles.classicLabel}>Office Address <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
                style={[styles.classicInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="Enter Complete Office Address"
                value={officeAddress}
                onChangeText={setOfficeAddress}
                multiline
            />

            <Space height={20} />

            {/* Operating States */}
            <Text style={styles.classicLabel}>Operating State(s) <Text style={styles.requiredStar}>*</Text></Text>
            <TouchableOpacity
                style={styles.classicBox}
                onPress={() => setStatePickerOpen(true)}
            >
                <Text style={{ color: operatingStates.length > 0 ? '#333' : '#999', flex: 1 }}>
                    {operatingStates.length > 0
                        ? `${operatingStates.length} state(s) selected`
                        : 'Select States'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.royalBlue} />
            </TouchableOpacity>
            {operatingStates.length > 0 && (
                <View style={styles.selectedStatesContainer}>
                    {operatingStates.map((state) => (
                        <View key={state} style={styles.stateTag}>
                            <Text style={styles.stateTagText}>{state}</Text>
                            <TouchableOpacity onPress={() => toggleState(state)}>
                                <Ionicons name="close-circle" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <Space height={20} />

            {/* Coverage Area */}
            <Text style={styles.classicLabel}>Coverage Area (Optional)</Text>
            <TextInput
                style={styles.classicInput}
                placeholder="e.g., Mumbai-Delhi Route, North India"
                value={coverageArea}
                onChangeText={setCoverageArea}
            />

            {/* State Picker Modal */}
            <Modal visible={statePickerOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Operating States</Text>
                            <TouchableOpacity onPress={() => setStatePickerOpen(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={INDIAN_STATES}
                            keyExtractor={(item) => item}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.stateItem}
                                    onPress={() => toggleState(item)}
                                >
                                    <Text style={styles.stateItemText}>{item}</Text>
                                    {operatingStates.includes(item) && (
                                        <Ionicons name="checkmark-circle" size={22} color="#246BFD" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalDoneButton}
                            onPress={() => setStatePickerOpen(false)}
                        >
                            <Text style={styles.modalDoneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );

    const renderAddMembers = () => (
        <View style={styles.stepContainer}>
            {/* Info Card */}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color="#246BFD" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.infoCardTitle}>Role-Based Access</Text>
                    <Text style={styles.infoCardText}>
                        Members you add will receive an SMS/App invite and can access the association account based on their role.
                    </Text>
                </View>
            </View>

            <Space height={20} />

            {/* Add Member Button */}
            <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setShowAddMemberModal(true)}
            >
                <Ionicons name="person-add" size={22} color="#246BFD" />
                <Text style={styles.addMemberButtonText}>Add Association Member</Text>
            </TouchableOpacity>

            <Space height={20} />

            {/* Members List */}
            {members.length > 0 && (
                <>
                    <Text style={styles.classicLabel}>Added Members ({members.length})</Text>
                    <Space height={10} />
                    {members.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberCardHeader}>
                                <View style={styles.memberAvatar}>
                                    <Ionicons name="person" size={20} color="#246BFD" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberRole}>
                                        {MEMBER_ROLES.find(r => r.id === member.role)?.label || member.role}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => removeMember(member.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.memberDetails}>
                                <Text style={styles.memberDetailText}>📱 {member.mobile}</Text>
                                {member.email && <Text style={styles.memberDetailText}>📧 {member.email}</Text>}
                                {member.state && <Text style={styles.memberDetailText}>📍 {member.state}</Text>}
                            </View>
                            <View style={styles.inviteStatusBadge}>
                                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                                <Text style={styles.inviteStatusText}>Invite Pending</Text>
                            </View>
                        </View>
                    ))}
                </>
            )}

            {members.length === 0 && (
                <View style={styles.emptyMembersContainer}>
                    <MaterialCommunityIcons name="account-group-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyMembersText}>No members added yet</Text>
                    <Text style={styles.emptyMembersSubtext}>Add members to manage your association</Text>
                </View>
            )}

            {/* Role Access Table */}
            <Space height={24} />
            <Text style={styles.classicLabel}>Role Access Rights</Text>
            <Space height={10} />
            <View style={styles.roleAccessTable}>
                {MEMBER_ROLES.map((role) => (
                    <View key={role.id} style={styles.roleAccessRow}>
                        <Text style={styles.roleAccessLabel}>{role.label}</Text>
                        <Text style={styles.roleAccessDesc}>{role.description}</Text>
                    </View>
                ))}
            </View>

            {/* Add Member Modal */}
            <Modal visible={showAddMemberModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Member</Text>
                            <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Role Selection */}
                            <Text style={styles.classicLabel}>Role <Text style={styles.requiredStar}>*</Text></Text>
                            <View style={styles.roleGrid}>
                                {MEMBER_ROLES.map((role) => (
                                    <TouchableOpacity
                                        key={role.id}
                                        style={[
                                            styles.roleCard,
                                            newMember.role === role.id && styles.roleCardSelected
                                        ]}
                                        onPress={() => setNewMember({ ...newMember, role: role.id })}
                                    >
                                        <Text style={[
                                            styles.roleCardText,
                                            newMember.role === role.id && styles.roleCardTextSelected
                                        ]}>
                                            {role.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Space height={16} />

                            {/* Full Name */}
                            <Text style={styles.classicLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                            <TextInput
                                style={styles.classicInput}
                                placeholder="Enter Full Name"
                                value={newMember.name}
                                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                            />

                            <Space height={16} />

                            {/* Mobile Number */}
                            <Text style={styles.classicLabel}>Mobile Number <Text style={styles.requiredStar}>*</Text></Text>
                            <TextInput
                                style={styles.classicInput}
                                placeholder="Enter Mobile Number"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={newMember.mobile}
                                onChangeText={(text) => setNewMember({ ...newMember, mobile: text })}
                            />

                            <Space height={16} />

                            {/* Email */}
                            <Text style={styles.classicLabel}>Email ID (Optional)</Text>
                            <TextInput
                                style={styles.classicInput}
                                placeholder="Enter Email Address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={newMember.email}
                                onChangeText={(text) => setNewMember({ ...newMember, email: text })}
                            />

                            <Space height={16} />

                            {/* State */}
                            <Text style={styles.classicLabel}>State <Text style={styles.requiredStar}>*</Text></Text>
                            <TouchableOpacity
                                style={styles.classicBox}
                                onPress={() => setMemberStatePickerOpen(true)}
                            >
                                <Text style={{ color: newMember.state ? '#333' : '#999' }}>
                                    {newMember.state || 'Select State'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.royalBlue} />
                            </TouchableOpacity>

                            <Space height={24} />

                            {/* Add Button */}
                            <TouchableOpacity style={styles.modalDoneButton} onPress={addMember}>
                                <Text style={styles.modalDoneButtonText}>Add Member</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                {/* Member State Picker */}
                <Modal visible={memberStatePickerOpen} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select State</Text>
                                <TouchableOpacity onPress={() => setMemberStatePickerOpen(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={INDIAN_STATES}
                                keyExtractor={(item) => item}
                                style={{ maxHeight: 400 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.stateItem}
                                        onPress={() => {
                                            setNewMember({ ...newMember, state: item });
                                            setMemberStatePickerOpen(false);
                                        }}
                                    >
                                        <Text style={styles.stateItemText}>{item}</Text>
                                        {newMember.state === item && (
                                            <Ionicons name="checkmark-circle" size={22} color="#246BFD" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </Modal>
        </View>
    );

    const renderCommissionSetup = () => (
        <View style={styles.stepContainer}>
            {/* Commission Info Card */}
            <View style={[styles.infoCard, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash" size={24} color="#D97706" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoCardTitle, { color: '#92400E' }]}>Commission Model</Text>
                    <Text style={[styles.infoCardText, { color: '#A16207' }]}>
                        All commissions are deposited to the Association account, not individual members.
                    </Text>
                </View>
            </View>

            <Space height={24} />

            {/* Commission Settings */}
            <Text style={styles.sectionTitle}>Commission Settings</Text>
            <Space height={12} />

            <Text style={styles.classicLabel}>Driver Subscription Commission (%)</Text>
            <TextInput
                style={styles.classicInput}
                placeholder="e.g., 10"
                keyboardType="numeric"
                value={subscriptionCommission}
                onChangeText={setSubscriptionCommission}
            />
            <Text style={styles.helperText}>Percentage earned on each driver subscription</Text>

            <Space height={16} />

            <Text style={styles.classicLabel}>Job Placement Commission (₹ or %)</Text>
            <TextInput
                style={styles.classicInput}
                placeholder="e.g., 500 or 5%"
                value={placementCommission}
                onChangeText={setPlacementCommission}
            />
            <Text style={styles.helperText}>Earned when drivers get placed in jobs</Text>

            <Space height={24} />

            {/* Bank Details */}
            <Text style={styles.sectionTitle}>Bank Details (Mandatory for Payouts)</Text>
            <Space height={12} />

            <Text style={styles.classicLabel}>Account Holder Name <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter Name as per Bank Account"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
            />

            <Space height={16} />

            <Text style={styles.classicLabel}>Bank Name</Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter Bank Name"
                value={bankName}
                onChangeText={setBankName}
            />

            <Space height={16} />

            <Text style={styles.classicLabel}>Account Number <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter Account Number"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
            />

            <Space height={16} />

            <Text style={styles.classicLabel}>IFSC Code <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Enter IFSC Code"
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={setIfscCode}
            />
        </View>
    );

    const renderVerification = () => (
        <View style={styles.stepContainer}>
            {/* Verification Info */}
            <View style={[styles.infoCard, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#059669" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoCardTitle, { color: '#065F46' }]}>Verification Benefits</Text>
                    <Text style={[styles.infoCardText, { color: '#047857' }]}>
                        Verified associations get higher trust, higher earning limits, and priority job access.
                    </Text>
                </View>
            </View>

            <Space height={24} />

            {/* Verification Items */}
            <Text style={styles.sectionTitle}>Verification Documents</Text>
            <Space height={16} />

            {/* Association Document */}
            <TouchableOpacity
                style={[styles.verificationCard, associationDocUploaded && styles.verificationCardComplete]}
                onPress={() => setAssociationDocUploaded(!associationDocUploaded)}
            >
                <View style={styles.verificationCardLeft}>
                    <View style={[styles.verificationIcon, associationDocUploaded && styles.verificationIconComplete]}>
                        <Ionicons
                            name={associationDocUploaded ? "checkmark" : "document-text-outline"}
                            size={24}
                            color={associationDocUploaded ? "#fff" : "#64748B"}
                        />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.verificationCardTitle}>Association Document</Text>
                        <Text style={styles.verificationCardSubtitle}>Upload registration certificate (if available)</Text>
                    </View>
                </View>
                <Ionicons
                    name={associationDocUploaded ? "checkmark-circle" : "add-circle-outline"}
                    size={28}
                    color={associationDocUploaded ? "#22C55E" : "#94A3B8"}
                />
            </TouchableOpacity>

            <Space height={12} />

            {/* Office Address Verification */}
            <TouchableOpacity
                style={[styles.verificationCard, addressVerified && styles.verificationCardComplete]}
                onPress={() => setAddressVerified(!addressVerified)}
            >
                <View style={styles.verificationCardLeft}>
                    <View style={[styles.verificationIcon, addressVerified && styles.verificationIconComplete]}>
                        <Ionicons
                            name={addressVerified ? "checkmark" : "location-outline"}
                            size={24}
                            color={addressVerified ? "#fff" : "#64748B"}
                        />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.verificationCardTitle}>Office Address Verification</Text>
                        <Text style={styles.verificationCardSubtitle}>Verify your association office location</Text>
                    </View>
                </View>
                <Ionicons
                    name={addressVerified ? "checkmark-circle" : "add-circle-outline"}
                    size={28}
                    color={addressVerified ? "#22C55E" : "#94A3B8"}
                />
            </TouchableOpacity>

            <Space height={12} />

            {/* President ID Verification */}
            <TouchableOpacity
                style={[styles.verificationCard, presidentIdVerified && styles.verificationCardComplete]}
                onPress={() => setPresidentIdVerified(!presidentIdVerified)}
            >
                <View style={styles.verificationCardLeft}>
                    <View style={[styles.verificationIcon, presidentIdVerified && styles.verificationIconComplete]}>
                        <Ionicons
                            name={presidentIdVerified ? "checkmark" : "id-card-outline"}
                            size={24}
                            color={presidentIdVerified ? "#fff" : "#64748B"}
                        />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.verificationCardTitle}>President ID Verification</Text>
                        <Text style={styles.verificationCardSubtitle}>Verify president/admin identity</Text>
                    </View>
                </View>
                <Ionicons
                    name={presidentIdVerified ? "checkmark-circle" : "add-circle-outline"}
                    size={28}
                    color={presidentIdVerified ? "#22C55E" : "#94A3B8"}
                />
            </TouchableOpacity>

            <Space height={24} />

            {/* Verification Status */}
            <View style={styles.verificationStatusCard}>
                <Text style={styles.verificationStatusTitle}>Profile Completion Status</Text>
                <View style={styles.verificationProgressBar}>
                    <View style={[styles.verificationProgressFill, { width: `${currentProgress}%` }]} />
                </View>
                <Text style={styles.verificationStatusText}>
                    {currentProgress}% Complete
                    {currentProgress === 100 && ' – Verified Association ✓'}
                </Text>
            </View>
        </View>
    );

    const renderStepContent = () => {
        const step = STEPS[currentStep];
        switch (step.id) {
            case 'association_details':
                return renderAssociationDetails();
            case 'add_members':
                return renderAddMembers();
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7FE" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                {currentStep > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                )}
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
                </View>
                <Text style={styles.stepCount}>{currentStep + 1} / {STEPS.length}</Text>
            </View>

            {/* Progress Percentage */}
            <View style={styles.progressPercentContainer}>
                <Text style={styles.progressPercentText}>Profile Completion: {STEPS[currentStep].progress}%</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{STEPS[currentStep].title}</Text>
                <Text style={styles.subtitle}>{STEPS[currentStep].subtitle}</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: isKeyboardVisible ? 200 : 120 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
                        {renderStepContent()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20 }]}>
                {currentStep === 1 && (
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[styles.skipButton]}
                    >
                        <Text style={styles.skipButtonText}>Skip for Now</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.nextButton, currentStep === 1 && { flex: 1, marginLeft: 12 }]}
                    disabled={finishing}
                >
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {currentStep === STEPS.length - 1 ? 'Submit Profile' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, height: 50 },
    backButton: { marginRight: 15 },
    progressContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#246BFD', borderRadius: 3 },
    stepCount: { marginLeft: 15, fontSize: 14, fontWeight: '600', color: '#666' },
    progressPercentContainer: { paddingHorizontal: 20, marginTop: 8 },
    progressPercentText: { fontSize: 13, fontWeight: '600', color: '#246BFD' },
    titleContainer: { paddingHorizontal: 20, marginTop: 15, marginBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
    contentContainer: { paddingBottom: 20 },
    stepContainer: { paddingHorizontal: 20, paddingTop: 10 },
    classicLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    requiredStar: { color: '#EF4444', fontWeight: '700' },
    classicInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 5
    },
    classicBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 5
    },
    helperText: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeCard: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    typeCardSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F5F9FF',
    },
    typeCardText: { fontSize: 14, color: '#666', fontWeight: '500' },
    typeCardTextSelected: { color: '#246BFD', fontWeight: '600' },
    selectedStatesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
    stateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF5FF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 4,
    },
    stateTagText: { fontSize: 12, color: '#246BFD', fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '90%', maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    modalDoneButton: {
        backgroundColor: '#246BFD',
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 16,
        alignItems: 'center'
    },
    modalDoneButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    stateItemText: { fontSize: 16, color: '#333' },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EDF5FF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'flex-start',
    },
    infoCardTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 4 },
    infoCardText: { fontSize: 13, color: '#3B82F6', lineHeight: 18 },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EDF5FF',
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#246BFD',
        borderStyle: 'dashed',
    },
    addMemberButtonText: { fontSize: 15, fontWeight: '600', color: '#246BFD', marginLeft: 8 },
    memberCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    memberCardHeader: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberName: { fontSize: 15, fontWeight: '600', color: '#333' },
    memberRole: { fontSize: 13, color: '#246BFD', marginTop: 2 },
    memberDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    memberDetailText: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    inviteStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 12,
        gap: 4,
    },
    inviteStatusText: { fontSize: 12, color: '#D97706', fontWeight: '500' },
    emptyMembersContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyMembersText: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 12 },
    emptyMembersSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleCard: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    roleCardSelected: { borderColor: '#246BFD', backgroundColor: '#EDF5FF' },
    roleCardText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    roleCardTextSelected: { color: '#246BFD', fontWeight: '600' },
    roleAccessTable: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
    roleAccessRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    roleAccessLabel: { fontSize: 13, fontWeight: '600', color: '#333', width: 100 },
    roleAccessDesc: { fontSize: 12, color: '#64748B', flex: 1 },
    verificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    verificationCardComplete: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    verificationCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    verificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verificationIconComplete: { backgroundColor: '#22C55E' },
    verificationCardTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
    verificationCardSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
    verificationStatusCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    verificationStatusTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
    verificationProgressBar: {
        width: '100%',
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        overflow: 'hidden'
    },
    verificationProgressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 5 },
    verificationStatusText: { fontSize: 14, fontWeight: '600', color: '#22C55E', marginTop: 10 },
    footer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10
    },
    skipButton: {
        backgroundColor: '#F1F5F9',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    skipButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
    nextButton: {
        flex: 1,
        backgroundColor: '#246BFD',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#246BFD',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5
    },
    nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
