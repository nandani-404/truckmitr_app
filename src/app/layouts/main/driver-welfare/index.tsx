import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Animated, BackHandler, Dimensions, Image, Linking, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// @ts-ignore
const DriverRestingImage = require('../../../../assets/images/driver_resting.jpg');
// @ts-ignore
const AyushmanFamilyImage = require('../../../../assets/images/ayushman_family.png');
// @ts-ignore
const PmsbyImage = require('../../../../assets/images/pmsby_accident.png');
// @ts-ignore
const PmjjbyImage = require('../../../../assets/images/pmjjby_life.png');
// @ts-ignore
const ShramYogiImage = require('../../../../assets/images/shram_yogi_senior.png');
// @ts-ignore
const AtalPensionImage = require('../../../../assets/images/atal_pension.png');

const COLORS = {
    primary: '#1E3A5F',
    primaryDark: '#0F2A44',
    accent: '#F5B942',
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
    textDark: '#1A1A2E',
    textMuted: '#6B7280',
    utilityBg: '#FEF7EC',
};

const SCHEMES = [
    {
        id: 'ayushman', title: 'Ayushman Bharat',
        benefit: '₹5 Lakh', benefitSuffix: ' Health Coverage',
        tagline: 'Cashless treatment for your family across India',
        heroHighlight: '₹5 Lakh Health Coverage',
        heroSubline: 'Cashless treatment across India',
        heroGradient: ['#059669', '#0891B2'], // Green → Teal
        about: 'Ayushman Bharat provides financial protection to families by covering major medical treatments at empanelled hospitals across India.',
        highlights: ['Cashless Treatment', 'Pan India Coverage', 'No Premium', 'Family Coverage'],
        benefits: [
            { icon: 'medical-outline', text: '₹5 lakh per family cover every year' },
            { icon: 'hospital-outline', text: 'Comprehensive hospitalisation cover' },
            { icon: 'shield-checkmark-outline', text: 'Pre & post-hospital expenses included' }
        ],
        eligibility: ['Eligible SECC listed families', 'No age limit for family members', 'Aadhaar-based identification'],
        steps: ['Check eligibility online or at CSC', 'Visit any empanelled hospital', 'Get cashless treatment easily'],
        icon: 'building', color: '#059669', iconLib: 'FontAwesome5', featured: true,
        image: AyushmanFamilyImage,
        ctaText: 'Check Eligibility',
        secondaryCta: 'Find Hospitals'
    },
    {
        id: 'pmsby', title: 'PMSBY', subtitle: 'Accident Insurance',
        benefit: '₹2 Lakh Cover',
        line1: 'Sirf ₹20 mein', line2: '2 Lakh ka Bima',
        heroHighlight: '₹2 Lakh Suraksha',
        heroSubline: 'Sirf ₹20 saalana premium par',
        heroGradient: ['#1E40AF', '#3B82F6'], // Dark Blue → Blue
        about: 'Truck driving ek high-risk profession hai. PMSBY sarkar ki taraf se ek accident insurance scheme hai. Agar road accident mein driver ki death ya disability hoti hai, toh parivaar ko ₹2 lakh tak ki madad milti hai.',
        highlights: ['Govt. of India Scheme', '₹2 Lakh Cover', 'Premium ₹20/Year'],
        benefits: [
            { icon: 'shield-outline', text: 'Accidental Death: ₹2,00,000' },
            { icon: 'accessibility-outline', text: 'Permanent Disability: ₹2,00,000' },
            { icon: 'medkit-outline', text: 'Partial Disability: ₹1,00,000' },
            { icon: 'wallet-outline', text: 'Premium: Sirf ₹20 har saal' }
        ],
        eligibility: ['Age: 18 se 70 saal', 'Active Bank Account hona chahiye', 'Aadhaar aur Mobile number linked ho'],
        steps: ['Apne bank branch mein form bharein', 'Auto-debit chalu karein (har saal ₹20 katenge)', 'Accident hone par nominee turant bank jaaye'],
        detailTrust: 'Yeh Bharat Sarkar (Govt. of India) ki scheme hai. Aapka paisa seedha bank se kat-ta hai, beech mein koi agent nahi hota.',
        detailFeatures: [
            'Policy Status Check (Yes/No)',
            'Application Help & Support',
            'Renewal Reminders',
            'Driver Safety Badge'
        ],
        detailPositioning: '“TruckMitr sirf loads nahi, driver ki suraksha bhi dekhta hai.”',
        icon: 'shield-check', color: '#1E40AF', iconLib: 'MaterialCommunityIcons', image: PmsbyImage,
        ctaText: 'Check Coverage Now'
    },
    {
        id: 'pmjjby', title: 'PMJJBY', subtitle: 'Life Insurance',
        benefit: '₹2 Lakh Cover',
        line1: <Text>Protect the future of your <Text style={{ fontWeight: '700', color: COLORS.textDark }}>loved ones</Text></Text>, line2: '',
        heroHighlight: '₹2 Lakh Life Cover',
        heroSubline: 'Family protection and peace of mind',
        heroGradient: ['#BE123C', '#FB7185'], // Rose → Pink
        about: 'PMJJBY ensures essential financial support for your family in the unfortunate event of the policyholder\'s untimely death.',
        highlights: ['Life Insurance', 'Affordable Premium', 'Family Security'],
        benefits: [
            { icon: 'heart-outline', text: '₹2 Lakh life insurance cover' },
            { icon: 'refresh-outline', text: 'Yearly renewable policy' },
            { icon: 'wallet-outline', text: 'Directly linked to bank account' }
        ],
        eligibility: ['Age group: 18 to 50 years', 'Active bank account holder', 'Consent for yearly renewal'],
        steps: ['Join through any participating bank', 'Annual premium automatically deducted', 'Family receives benefit after claim'],
        icon: 'heart-pulse', color: '#EF4444', iconLib: 'MaterialCommunityIcons', image: PmjjbyImage,
        ctaText: 'Protect Your Family'
    },
    {
        id: 'shramyogi', title: 'PM Shram\nYogi', subtitle: 'Pension Scheme',
        benefit: '₹3,000 / Month',
        line1: 'For unorganized sector', line2: 'workers',
        heroHighlight: '₹3,000 Monthly Pension',
        heroSubline: 'Dignity and security in old age',
        heroGradient: ['#6D28D9', '#A78BFA'], // Purple → Lavender
        about: 'PM Shram Yogi Maan-dhan provides an assured monthly pension to unorganised workers after they reach the age of 60.',
        highlights: ['Old-age Pension', 'Govt Contribution', 'Family Support'],
        benefits: [
            { icon: 'cash-outline', text: 'Guaranteed ₹3,000 monthly pension' },
            { icon: 'people-outline', text: 'Family pension on death of subscriber' },
            { icon: 'business-outline', text: 'Equal government contribution' }
        ],
        eligibility: ['Age group: 18 to 40 years', 'Unorganised workers category', 'Monthly income below ₹15,000'],
        steps: ['Register at the nearest CSC', 'Make monthly voluntary contributions', 'Receive pension regularly after 60'],
        icon: 'piggy-bank', color: '#F97316', iconLib: 'FontAwesome5', image: ShramYogiImage,
        ctaText: 'Start Pension Plan'
    },
    {
        id: 'atal', title: 'Atal Pension', subtitle: 'Pension Scheme',
        benefit: '₹1K-5K',
        line1: 'Receive a guaranteed',
        line2: <Text style={{ fontWeight: '700', color: COLORS.textDark }}>monthly pension</Text>,
        heroHighlight: '₹1,000–₹5,000 Pension',
        heroSubline: 'Planned, guaranteed retirement for all',
        heroGradient: ['#4338CA', '#818CF8'], // Indigo → Light Indigo
        about: 'Atal Pension Yojana helps Indian citizens plan a secure retirement with a guaranteed monthly income regularised by the government.',
        highlights: ['Guaranteed Pension', 'Long-term Savings', 'Govt-backed'],
        benefits: [
            { icon: 'lock-closed-outline', text: 'Fixed pension amount of choice' },
            { icon: 'umbrella-outline', text: 'Retirement security for spouse' },
            { icon: 'gift-outline', text: 'Nominee receives full corpus benefits' }
        ],
        eligibility: ['Age group: 18 to 40 years', 'Valid savings bank account', 'Not a beneficiary of other schemes'],
        steps: ['Choose your desired pension amount', 'Setup monthly contribution via bank', 'Get guaranteed pension after 60'],
        icon: 'coins', color: '#8B5CF6', iconLib: 'FontAwesome5', image: AtalPensionImage,
        ctaText: 'Plan Your Retirement'
    },
    {
        id: 'apnaghar', title: 'Apna Ghar', subtitle: 'Rest Facilities',
        benefit: 'Rest & Stay',
        line1: 'Comfortable and safe',
        line2: <Text style={{ fontWeight: '700', color: COLORS.textDark }}>resting facilities</Text>,
        heroHighlight: 'Safe & Comfortable Stay',
        heroSubline: 'Comfort, safety, and rest during journeys',
        heroGradient: ['#EA580C', '#FDBA74'], // Orange → Apricot
        about: 'Apna Ghar provides safe, clean, and comfortable resting facilities for truck drivers during their long and tiring journeys.',
        highlights: ['Clean Rest Houses', 'Hygiene Washrooms', 'Drinking Water'],
        benefits: [
            { icon: 'bed-outline', text: 'Clean sleeping beds and quilts' },
            { icon: 'water-outline', text: 'Access to washrooms & clean water' },
            { icon: 'shield-outline', text: 'Safe and secure parking environment' }
        ],
        eligibility: ['All active commercial truck drivers', 'Must carry a valid commercial driver ID', 'Applicable for long-haul routes'],
        steps: ['Find nearest Apna Ghar on the map', 'Check real-time bed availability', 'Check-in and rest safely'],
        icon: 'bed', color: '#EC4899', iconLib: 'FontAwesome5', isUtility: true,
        image: DriverRestingImage,
        ctaText: 'Find Nearby Apna Ghar'
    }
];

const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const BenefitRow = ({ icon, text }: { icon: string, text: string }) => (
    <View style={styles.benefitRow}>
        <View style={styles.benefitIconCircle}>
            <Ionicons name={icon} size={18} color="#1E3A5F" />
        </View>
        <Text style={styles.benefitRowText}>{text}</Text>
    </View>
);

const StepRow = ({ number, text }: { number: number, text: string }) => (
    <View style={styles.stepRow}>
        <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <Text style={styles.stepRowText}>{text}</Text>
    </View>
);

const EligibilityItem = ({ text }: { text: string }) => (
    <View style={styles.eligibilityItem}>
        <Ionicons name="checkmark-circle" size={18} color="#059669" />
        <Text style={styles.eligibilityText}>{text}</Text>
    </View>
);

const DriverWelfare = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [currentScreen, setCurrentScreen] = useState<'list' | 'detail'>('list');
    const [selectedScheme, setSelectedScheme] = useState<any>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [currentScreen]);

    useEffect(() => {
        const backAction = () => {
            if (currentScreen === 'detail') { setCurrentScreen('list'); return true; }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [currentScreen]);

    const Header = () => (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Welfare Schemes</Text>
                    <Text style={styles.headerSubtitle}>Support that moves with you 🚛</Text>
                </View>
                <View style={[styles.headerIconBtn, { opacity: 0 }]} />
            </View>
        </View>
    );

    const FeaturedCard = ({ scheme, onPress }: any) => (
        <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.featuredCard}>
            <LinearGradient colors={['#2E4A6E', '#1E3A5F', '#0F2A44']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredGradient}>
                {/* Stars Background */}
                <View style={[styles.star, { top: 12, right: 20, width: 3, height: 3 }]} />
                <View style={[styles.star, { top: 28, right: 45, width: 4, height: 4 }]} />
                <View style={[styles.star, { top: 18, right: 80, width: 3, height: 3 }]} />
                <View style={[styles.star, { top: 40, right: 30, width: 5, height: 5 }]} />
                <View style={[styles.star, { top: 50, right: 70, width: 3, height: 3 }]} />
                <View style={[styles.star, { top: 8, right: 110, width: 2, height: 2 }]} />

                <View style={styles.featuredRow}>
                    <View style={styles.featuredImageWrap}>
                        <Image source={AyushmanFamilyImage} style={styles.featuredImage} resizeMode="cover" />
                    </View>
                    <View style={styles.featuredTextWrap}>
                        <Text style={styles.featuredTitle}>{scheme.title}</Text>
                        <Text style={styles.featuredBenefit}>
                            <Text style={styles.featuredBenefitGold}>{scheme.benefit}</Text>
                            <Text style={styles.featuredBenefitGold}>{scheme.benefitSuffix}</Text>
                        </Text>
                    </View>
                </View>
                <Text style={styles.featuredTagline}>{scheme.tagline}</Text>
                <View style={styles.featuredDivider} />
                <TouchableOpacity style={styles.featuredCta} onPress={onPress}>
                    <Text style={styles.featuredCtaText}>Explore Scheme</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
            </LinearGradient>
        </TouchableOpacity>
    );



    const WideCard = ({ scheme, onPress }: any) => {
        const IconComp = scheme.iconLib === 'FontAwesome5' ? FontAwesome5 : MaterialCommunityIcons;
        const sub = scheme.subtitle || scheme.detailSubtitle?.replace(' Scheme', '') || '';
        const img = scheme.image || (scheme.id === 'apnaghar' ? DriverRestingImage : null);

        // Use solid background colors instead of gradients to ensure the illustration blends perfectly without visible lines
        let cardBg = scheme.color + '05';
        if (scheme.id === 'ayushman' || scheme.id === 'pmsby') cardBg = '#EFF6FF';
        else if (scheme.id === 'pmjjby') cardBg = '#FEF2F2';
        else if (scheme.id === 'shramyogi') cardBg = '#FAF5FF';
        else if (scheme.id === 'atal') cardBg = '#EEF2FF';
        else if (scheme.id === 'apnaghar') cardBg = '#FDF2F8';

        return (
            <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={[styles.wideCard, { backgroundColor: cardBg, borderColor: scheme.color + '30' }]}>
                <View style={styles.wideCardContainer}>
                    <View style={[styles.wideCardBgCircle, { backgroundColor: scheme.color + '05' }]} />

                    {img && (
                        <View style={styles.utilityImageContainer}>
                            <Image source={img} style={styles.utilityImage} resizeMode="cover" />
                            <LinearGradient
                                colors={[cardBg, cardBg, 'transparent']}
                                locations={[0, 0.2, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.utilityImageFade}
                            />
                        </View>
                    )}

                    <View style={[styles.wideCardContent, { width: '65%', zIndex: 1 }]}>
                        <View style={styles.wideCardHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: scheme.color + '15' }]}>
                                {scheme.id === 'apnaghar' ?
                                    <FontAwesome5 name="home" size={16} color={scheme.color} /> :
                                    <IconComp name={scheme.icon} size={20} color={scheme.color} />
                                }
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.wideCardTitle}>{scheme.title.replace('\n', ' ')}</Text>
                                <Text style={styles.wideCardSubtitle}>{sub}</Text>
                            </View>
                        </View>

                        <View style={{ marginTop: 12 }}>
                            {scheme.benefit ? <Text style={[styles.wideCardBenefit, { color: scheme.color }]}>{scheme.benefit}</Text> : null}
                            <Text style={styles.wideCardLine1}>{scheme.line1} <Text style={{ fontWeight: '700', color: COLORS.textDark }}>{scheme.line2}</Text></Text>
                        </View>

                        <View style={styles.wideCardDivider} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginRight: 4 }}>View Details</Text>
                            <Ionicons name="arrow-forward" size={12} color={COLORS.textDark} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const SchemesListScreen = () => {
        const featured = SCHEMES[0];
        const listItems = SCHEMES.slice(1);

        return (
            <View style={styles.flex1}>
                <Header />
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <FeaturedCard scheme={featured} onPress={() => { setSelectedScheme(featured); setCurrentScreen('detail'); }} />

                        <View style={styles.listSpacer} />

                        {listItems.map((item) => (
                            <WideCard key={item.id} scheme={item} onPress={() => { setSelectedScheme(item); setCurrentScreen('detail'); }} />
                        ))}

                        <View style={styles.footer}>
                            <Ionicons name="shield-checkmark" size={14} color={COLORS.textMuted} />
                            <Text style={styles.footerText}>Backed by Government of India</Text>
                        </View>
                        <View style={{ height: 20 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        );
    };

    const PMSBYDetailView = ({ scheme }: { scheme: any }) => {
        const [isCovered, setIsCovered] = useState(false);
        const [showWhyExpanded, setShowWhyExpanded] = useState(true);

        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>PMSBY Insurance</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

                    {/* 1. HERO SECTION (Feature Style) */}
                    <View style={{ backgroundColor: '#EAF3FF', margin: 16, borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
                        <View style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                            <Ionicons name="shield-checkmark" size={120} color="#2563EB" />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="shield-checkmark" size={14} color="#2563EB" />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E40AF' }}>GOVT. SCHEME</Text>
                            </View>
                            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>₹2L COVER</Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E3A5F', marginBottom: 6, lineHeight: 28 }}>
                            PMSBY – Driver Accident Insurance
                        </Text>
                        <Text style={{ fontSize: 15, color: '#334155', lineHeight: 22, marginBottom: 16 }}>
                            Sirf <Text style={{ fontWeight: '700', color: '#2563EB' }}>₹20 mein</Text> parivaar ke liye ₹2 lakh ki suraksha.
                        </Text>

                        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(37,99,235,0.1)', paddingTop: 12, marginTop: 4 }}>
                            <Text style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                                Central Government ki accident insurance yojana specially useful for truck drivers.
                            </Text>
                        </View>
                    </View>

                    {/* 2. WHY PMSBY (Expandable) */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowWhyExpanded(!showWhyExpanded)}
                        style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="help-circle" size={20} color="#2563EB" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Why PMSBY?</Text>
                            </View>
                            <Ionicons name={showWhyExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                        </View>

                        {showWhyExpanded && (
                            <View style={{ padding: 16 }}>
                                <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 12 }}>
                                    Truck driving ek high-risk profession hai. Road accident mein death ya permanent disability hone par parivaar ko financial support milta hai.
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8 }}>
                                    <Ionicons name="bulb" size={16} color="#16A34A" />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D', flex: 1 }}>
                                        ₹20 ka kharcha, parivaar ke liye ₹2 lakh ki suraksha
                                    </Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 3. SCHEME DETAILS (2x2 Grid) */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeaderSmall}>Scheme Details</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {/* Card 1 */}
                            <View style={{ width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="shield-checkmark" size={18} color="#2563EB" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Insurance Cover</Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Accident death / disability</Text>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563EB', marginTop: 4 }}>₹2,00,000</Text>
                            </View>
                            {/* Card 2 */}
                            <View style={{ width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="cash" size={18} color="#16A34A" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Premium</Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Sirf ₹20 / year</Text>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#16A34A', marginTop: 4 }}>₹20 Only</Text>
                            </View>
                            {/* Card 3 */}
                            <View style={{ width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="person" size={18} color="#EA580C" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Age Limit</Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Eligibility criteria</Text>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#EA580C', marginTop: 4 }}>18 - 70 Years</Text>
                            </View>
                            {/* Card 4 */}
                            <View style={{ width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="business" size={18} color="#7C3AED" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Bank Linked</Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Auto-debit facility</Text>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#7C3AED', marginTop: 4 }}>Yearly Renewal</Text>
                            </View>
                        </View>
                    </View>

                    {/* 4. WHO CAN APPLY & WHY NEEDED (Tabs style) */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24, gap: 16 }}>
                        {/* Who Can Apply */}
                        <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Kaun apply kar sakta hai?</Text>
                            <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={{ fontSize: 13, color: '#334155' }}>Active bank account</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={{ fontSize: 13, color: '#334155' }}>Aadhaar bank se linked</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={{ fontSize: 13, color: '#334155' }}>Mobile number bank se linked</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={{ fontSize: 13, color: '#334155' }}>Age 18–70 saal</Text>
                                </View>
                            </View>
                        </View>

                        {/* Why Truck Drivers Needed */}
                        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFEDD5' }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#9A3412', marginBottom: 12 }}>Truck drivers ke liye kyun zaroori?</Text>
                            <View style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <Ionicons name="warning" size={16} color="#EA580C" style={{ marginTop: 2 }} />
                                    <Text style={{ fontSize: 13, color: '#7C2D12', flex: 1 }}>Roz highway par high risk profession</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <Ionicons name="alert-circle" size={16} color="#EA580C" style={{ marginTop: 2 }} />
                                    <Text style={{ fontSize: 13, color: '#7C2D12', flex: 1 }}>Accident ke baad family ki income ruk jaati hai</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <Ionicons name="shield" size={16} color="#EA580C" style={{ marginTop: 2 }} />
                                    <Text style={{ fontSize: 13, color: '#7C2D12', flex: 1 }}>Sirf ₹20 mein family ko financial security</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(234,88,12,0.2)' }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#C2410C', textAlign: 'center' }}>Aaj ka ₹20, kal ke liye suraksha.</Text>
                            </View>
                        </View>
                    </View>

                    {/* 5. CLAIM PROCESS */}
                    <View style={styles.claimSectionSimple}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={styles.sectionHeaderSmall}>Claim Process</Text>
                            <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '700' }}>3 STEPS</Text>
                            </View>
                        </View>

                        <View style={{ paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E2E8F0', marginLeft: 10 }}>
                            {/* Step 1 */}
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, marginLeft: -18 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#2563EB' }}>1</Text>
                                </View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Inform Bank</Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }}>Accident hone par family / nominee bank ko inform kare</Text>
                                </View>
                            </View>

                            {/* Step 2 */}
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, marginLeft: -18 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#64748B', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>2</Text>
                                </View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Submit Documents</Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }}>Required documents submit kare (Death cert, FIR, etc.)</Text>
                                </View>
                            </View>

                            {/* Step 3 */}
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: -18 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#16A34A', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark" size={20} color="#16A34A" />
                                </View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Claim Credited</Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }}>Claim amount directly bank account mein aata hai</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, gap: 10 }}>
                            <Ionicons name="information-circle" size={24} color="#2563EB" />
                            <Text style={{ fontSize: 12, color: '#475569', flex: 1 }}>TruckMitr app mein <Text style={{ fontWeight: '700', color: '#2563EB' }}>Claim Checklist + Help Call</Text> available hai.</Text>
                        </View>
                    </View>

                    {/* 6. SMART APP FEATURES */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeaderSmall}>TruckMitr Smart Features</Text>

                        {/* 6.1 Am I Covered? */}
                        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, elevation: 2 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name="shield-half" size={20} color="#2563EB" />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Am I Covered?</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => Alert.alert('Coming Soon', 'This feature is currently under development.')}
                                    style={{ backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
                                >
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Check Status</Text>
                                </TouchableOpacity>
                            </View>


                        </View>

                        {/* 6.2 Apply with Help */}
                        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Apply with Help</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                <TouchableOpacity style={{ flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}>
                                    <Ionicons name="call" size={20} color="#2563EB" style={{ marginBottom: 4 }} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF' }}>Call Support</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1, backgroundColor: '#F0FDF4', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' }}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#16A34A" style={{ marginBottom: 4 }} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D' }}>Callback</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
                                Telecaller step-by-step apply karne mein madad karega
                            </Text>
                        </View>

                        {/* 6.3 Voice & Auto Reminder (Row) */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* Voice */}
                            <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="mic" size={24} color="#9333EA" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>Voice Help</Text>
                                <Text style={{ fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 2 }}>Listen in Hindi</Text>
                            </TouchableOpacity>

                            {/* Reminder */}
                            <View style={{ flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="alarm" size={24} color="#EA580C" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>Auto-Remind</Text>
                                <Text style={{ fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 2 }}>For ₹20 renewal</Text>
                            </View>
                        </View>
                    </View>

                    {/* 7. GOVERNMENT TRUST */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#475569' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <Ionicons name="business" size={24} color="#475569" />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#334155' }}>Government Trust</Text>
                        </View>
                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="ellipse" size={8} color="#94A3B8" style={{ marginTop: 6 }} />
                                <Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>PMSBY Government of India ki yojana hai</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="ellipse" size={8} color="#94A3B8" style={{ marginTop: 6 }} />
                                <Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>Bank ke through operate hoti hai - No agent needed</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="shield-checkmark" size={14} color="#94A3B8" style={{ marginTop: 4 }} />
                                <Text style={{ fontSize: 13, color: '#475569', flex: 1, fontStyle: 'italic' }}>TruckMitr safe: Data safe, no spam calling</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer Positioning Line */}
                    <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 20 }}>
                        “TruckMitr sirf loads nahi,{'\n'}driver ki suraksha bhi dekhta hai.”
                    </Text>

                </ScrollView>

                {/* BOTTOM STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => Linking.openURL('tel:18001024558')}
                        style={styles.stickyCtaTouch}
                    >
                        <LinearGradient
                            colors={['#059669', '#047857']} // Deep Green (Standard for Call)
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.stickyCtaGradient}
                        >
                            <View style={styles.stickyTextContainer}>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', marginBottom: 2 }}>For more information</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '500' }}>Call our Toll Free number</Text>
                                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>1800 102 4558</Text>
                                </View>
                            </View>
                            <View style={styles.callIconBubble}>
                                <Ionicons name="call" size={20} color="#059669" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const SchemeDetailScreen = () => {
        if (!selectedScheme) return null;
        if (selectedScheme.id === 'pmsby') return <PMSBYDetailView scheme={selectedScheme} />;

        return (
            <View style={styles.flex1}>
                {/* Custom Navigation Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{selectedScheme.title.replace('\n', ' ')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.flex1} contentContainerStyle={styles.detailScrollContent}>
                    {/* 1. Hero Card */}
                    <LinearGradient
                        colors={selectedScheme.heroGradient || ['#1E3A5F', '#0F2A44']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>{selectedScheme.title}</Text>
                            <Text style={styles.heroHighlight}>{selectedScheme.heroHighlight}</Text>
                            <Text style={styles.heroSubline}>{selectedScheme.heroSubline}</Text>
                        </View>
                        {selectedScheme.image && (
                            <View style={styles.heroImageWrapper}>
                                <Image source={selectedScheme.image} style={styles.heroImage} resizeMode="contain" />
                            </View>
                        )}
                    </LinearGradient>

                    {/* 2. Key Highlights */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsContainer}>
                        {selectedScheme.highlights?.map((h: string, i: number) => (
                            <View key={i} style={styles.highlightChip}>
                                <Ionicons name="flash-outline" size={14} color="#1E3A5F" style={{ marginRight: 6 }} />
                                <Text style={styles.highlightText}>{h}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* 3. About the Scheme */}
                    <View style={styles.cardSection}>
                        <SectionTitle title="About the Scheme" />
                        <Text style={styles.aboutText}>{selectedScheme.about}</Text>
                    </View>

                    {/* 4. What You Get */}
                    <View style={styles.cardSection}>
                        <SectionTitle title="What You Get" />
                        {selectedScheme.benefits?.map((b: any, i: number) => (
                            <BenefitRow key={i} icon={b.icon} text={b.text} />
                        ))}
                    </View>

                    {/* 5. Who Can Apply */}
                    <View style={styles.cardSection}>
                        <SectionTitle title="Who Can Apply" />
                        {selectedScheme.eligibility?.map((e: string, i: number) => (
                            <EligibilityItem key={i} text={e} />
                        ))}
                    </View>

                    {/* 6. How It Works */}
                    <View style={styles.cardSection}>
                        <SectionTitle title="How It Works" />
                        {selectedScheme.steps?.map((s: string, i: number) => (
                            <StepRow key={i} number={i + 1} text={s} />
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {currentScreen === 'list' && (
                <View style={[styles.flex1, { paddingTop: insets.top }]}>
                    <SchemesListScreen />
                </View>
            )}
            {currentScreen === 'detail' && <SchemeDetailScreen />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flex1: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 30 },
    listSpacer: { height: 6 },

    header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: '#FFFFFF' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
    headerSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },

    featuredCard: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    featuredGradient: { padding: 14, position: 'relative' },
    star: { position: 'absolute', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)' },
    featuredRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    featuredImageWrap: { marginRight: 12, width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', padding: 2 },
    featuredImage: { width: '100%', height: '100%', borderRadius: 30 },
    featuredTextWrap: { flex: 1 },
    featuredTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    featuredBenefit: { flexDirection: 'row', flexWrap: 'wrap' },
    featuredBenefitGold: { fontSize: 15, fontWeight: '700', color: '#FCD34D' },
    featuredTagline: { fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 16, marginBottom: 8 },
    featuredDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: 30, marginBottom: 8 },
    featuredCta: { flexDirection: 'row', alignItems: 'center' },
    featuredCtaText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginRight: 6 },

    wideCard: { marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
    wideCardGradient: { flex: 1 },
    wideCardContainer: { padding: 16, position: 'relative', height: 160, justifyContent: 'center' },
    wideCardBgCircle: { position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: 60, zIndex: 0 },
    wideCardContent: { zIndex: 1, justifyContent: 'space-between' },
    wideCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    wideCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, lineHeight: 18 },
    wideCardSubtitle: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted, marginTop: 2 },
    wideCardBenefit: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
    wideCardLine1: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },
    wideCardDivider: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.06)', width: 40, marginTop: 12 },

    utilityImageContainer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '60%' },
    utilityImage: { width: '100%', height: '100%', opacity: 1.0 },
    utilityImageFade: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%' },

    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    footerText: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted, marginLeft: 6 },

    // Standardized Detail Styles
    detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8, backgroundColor: '#FFFFFF' },
    detailBackBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    detailHeaderTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
    detailScrollContent: { paddingBottom: 40 },

    heroCard: { margin: 16, padding: 24, borderRadius: 24, minHeight: 180, flexDirection: 'row', position: 'relative', overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    heroContent: { flex: 1, justifyContent: 'center', zIndex: 1 },
    heroTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    heroHighlight: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, lineHeight: 28 },
    heroSubline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
    heroImageWrapper: { position: 'absolute', right: -20, bottom: -10, width: '45%', height: '80%', opacity: 0.25 },
    heroImage: { width: '100%', height: '100%' },

    highlightsContainer: { paddingHorizontal: 16, marginBottom: 24 },
    highlightChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    highlightText: { fontSize: 12, fontWeight: '600', color: '#1E3A5F' },

    cardSection: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 16 },
    aboutText: { fontSize: 14, color: '#444', lineHeight: 22 },

    benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    benefitIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    benefitRowText: { fontSize: 14, color: '#334155', flex: 1 },

    eligibilityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    eligibilityText: { fontSize: 14, color: '#334155', marginLeft: 10 },

    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    stepNumberCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    stepNumberText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
    stepRowText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 20 },

    ctaBottomContainer: { padding: 16, marginTop: 10 },
    mainCta: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    mainCtaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    secondaryCta: { height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    secondaryCtaText: { fontSize: 14, fontWeight: '600' },

    // PMSBY Specific Styles (NEW & REDESIGNED - Compact)
    pmsbyNewHero: { margin: 16, padding: 20, borderRadius: 20, position: 'relative' },
    govtBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8, gap: 4 },
    govtBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
    pmsbyNewHeroAmount: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
    pmsbyNewHeroTitle: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
    pmsbyNewHeroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
    pmsbyNewMainCta: { backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    pmsbyNewMainCtaText: { color: '#0F766E', fontSize: 13, fontWeight: '700' },

    actionButtonsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
    actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
    actionIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    actionCardTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    actionCardSub: { fontSize: 11, color: '#64748B' },

    voiceActionCard: { marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
    voiceActionGradient: { padding: 16 },
    flexRow: { flexDirection: 'row', alignItems: 'center' },
    voiceActionTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    playIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    trustContainer: { marginHorizontal: 16, padding: 16, backgroundColor: '#F0FDF4', borderRadius: 16, gap: 12, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#059669' },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trustText: { fontSize: 13, color: '#064E3B', fontWeight: '500' },

    badgeGamifiedCard: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 8, shadowColor: '#F59E0B', shadowOpacity: 0.2, shadowRadius: 10 },
    badgeBackdrop: { padding: 3 },
    badgeGoldBorder: { borderRadius: 21, padding: 2, backgroundColor: '#FCD34D' },
    badgeGoldCard: { borderRadius: 19, padding: 16 },
    badgeInnerContent: { flexDirection: 'row', alignItems: 'center' },
    badgeMedalContainer: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    badgeMedalBg: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', opacity: 0.8 },
    starBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EA580C', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    badgeLevelText: { fontSize: 10, fontWeight: '800', color: '#B45309', letterSpacing: 0.5, marginBottom: 2 },
    badgeMainTitle: { fontSize: 18, fontWeight: '800', color: '#78350F', marginBottom: 4 },
    badgeTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.6)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeTagText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
    badgeActionBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badgeActionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    claimSectionSimple: { marginHorizontal: 16, padding: 20, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#E0E7FF', marginBottom: 16, elevation: 2, shadowColor: '#4F46E5', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionHeaderSmall: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
    claimTimelineBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingHorizontal: 12 },
    claimNode: { alignItems: 'center', gap: 8, zIndex: 1 },
    claimDotActive: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    claimDotInactive: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    claimLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginTop: 15, marginHorizontal: -4, zIndex: 0 },
    claimLabel: { fontSize: 12, color: '#475569', fontWeight: '600', textAlign: 'center' },
    claimHelpLink: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#EEF2FF', borderRadius: 20 },
    claimHelpLinkText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },

    stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -2 } },
    stickyCtaTouch: { borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#4F46E5', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    stickyCtaGradient: { paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stickyTextContainer: { flex: 1 },
    stickyLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, marginBottom: 0, fontWeight: '500' },
    stickyNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stickyNumber: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    callIconBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    enhancedReminderCard: { padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    eReminderTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    eReminderSub: { fontSize: 13, color: '#64748B' },
    eReminderFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', gap: 6, elevation: 1 },
    eReminderFooterText: { fontSize: 11, fontWeight: '700', color: '#C2410C' },
    recommendedBadge: { backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    recommendedText: { fontSize: 9, fontWeight: '800', color: '#EA580C' },

    pmsbyTrustSection: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    trustHeaderStripe: { paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trustHeaderTitle: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    trustContent: { padding: 16 },
    trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    trustRowTitle: { fontSize: 14, fontWeight: '700', color: '#450A0A' },
    trustRowSub: { fontSize: 12, color: '#7F1D1D', marginTop: 1 },
    trustDivider: { height: 1, backgroundColor: '#FEF2F2', marginVertical: 12 },
});

export default DriverWelfare;
