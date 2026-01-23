import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Animated, BackHandler, Dimensions, Image } from 'react-native';
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
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>PMSBY Protection</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* 1. HERO BANNER */}
                    <LinearGradient
                        colors={['#059669', '#3B82F6']} // Green -> Blue
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.pmsbyHero}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={styles.pmsbyHeroPrice}>₹20 / Year</Text>
                                <Text style={styles.pmsbyHeroTitle}>₹2,00,000 Accident Cover</Text>
                                <Text style={styles.pmsbyHeroSubtitle}>Truck drivers ke parivaar ke liye suraksha</Text>
                            </View>
                            <View style={styles.pmsbyHeroBadge}>
                                <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.pmsbyHeroCta}>
                            <Text style={styles.pmsbyHeroCtaText}>✅ CHECK IF I’M COVERED</Text>
                        </TouchableOpacity>
                        <Text style={styles.pmsbyHeroTime}>2–3 seconds only</Text>

                        <View style={styles.pmsbyTrustRow}>
                            <View style={styles.pmsbyTrustItem}>
                                <Ionicons name="ellipse" size={8} color="#4ADE80" />
                                <Text style={styles.pmsbyTrustText}>Government of India Scheme</Text>
                            </View>
                            <View style={styles.pmsbyTrustItem}>
                                <Ionicons name="ellipse" size={8} color="#4ADE80" />
                                <Text style={styles.pmsbyTrustText}>Bank se direct linked</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* 2. QUICK ACTION BAR */}
                    <View style={styles.quickActionBar}>
                        <View style={styles.quickActionItem}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="shield-outline" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.quickActionText}>Coverage</Text>
                        </View>
                        <View style={styles.quickActionItem}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="call-outline" size={20} color="#16A34A" />
                            </View>
                            <Text style={styles.quickActionText}>Apply Help</Text>
                        </View>
                        <View style={styles.quickActionItem}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#FAF5FF' }]}>
                                <Ionicons name="headset-outline" size={20} color="#9333EA" />
                            </View>
                            <Text style={styles.quickActionText}>Voice</Text>
                        </View>
                        <View style={styles.quickActionItem}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#FFFBEB' }]}>
                                <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.quickActionText}>Reminder</Text>
                        </View>
                    </View>

                    {/* 3. FEATURE CARDS */}
                    <View style={styles.featureCardsContainer}>
                        {/* Am I Covered */}
                        <View style={styles.featureCard}>
                            <View style={styles.featureCardHeader}>
                                <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                                <Text style={styles.featureCardTitle}>Am I Covered?</Text>
                            </View>
                            <Text style={styles.featureCardDesc}>Instant insurance status</Text>
                            <View style={styles.featureCardResultRow}>
                                <View style={styles.featurePill}><Text style={styles.featurePillText}>Yes / No Result</Text></View>
                            </View>
                            <TouchableOpacity style={styles.featureBtn}>
                                <Text style={styles.featureBtnText}>CHECK NOW</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Apply with Help */}
                        <View style={styles.featureCard}>
                            <View style={styles.featureCardHeader}>
                                <Ionicons name="people-outline" size={22} color="#3B82F6" />
                                <Text style={styles.featureCardTitle}>Apply with Help</Text>
                            </View>
                            <Text style={styles.featureCardDesc}>We guide you step-by-step</Text>
                            <View style={styles.featureTags}>
                                <Text style={styles.featureTag}>📞 Call Support</Text>
                                <Text style={styles.featureTag}>📲 Callback</Text>
                            </View>
                            <TouchableOpacity style={[styles.featureBtn, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={[styles.featureBtnText, { color: '#3B82F6' }]}>GET HELP</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Voice Explanation */}
                        <LinearGradient colors={['#7E22CE', '#A855F7']} style={styles.voiceCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={styles.voiceTitle}>Voice Explanation</Text>
                                    <Text style={styles.voiceSub}>30 sec Hindi audio • Samjho bina padhe</Text>
                                </View>
                                <Ionicons name="mic-circle" size={40} color="#FFF" />
                            </View>
                            <TouchableOpacity style={styles.voiceBtn}>
                                <Ionicons name="play" size={16} color="#7E22CE" />
                                <Text style={styles.voiceBtnText}>PLAY AUDIO</Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Auto Reminder */}
                        <View style={[styles.featureCard, { borderColor: '#FCD34D', borderStyle: 'dashed', borderWidth: 1.5 }]}>
                            <View style={styles.featureCardHeader}>
                                <Ionicons name="alarm-outline" size={22} color="#F59E0B" />
                                <Text style={styles.featureCardTitle}>Auto Reminder</Text>
                            </View>
                            <Text style={styles.featureCardDesc}>Never miss renewal • ₹20 balance alert</Text>
                            <TouchableOpacity style={[styles.featureBtn, { backgroundColor: '#FFFBEB' }]}>
                                <Text style={[styles.featureBtnText, { color: '#B45309' }]}>ENABLE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Driver Safety Badge */}
                        <View style={styles.badgeCard}>
                            <View style={styles.badgeIcon}>
                                <Ionicons name="ribbon" size={28} color="#FFF" />
                            </View>
                            <View style={{ flex: 1, paddingLeft: 12 }}>
                                <Text style={styles.badgeTitle}>Driver Safety Badge</Text>
                                <Text style={styles.badgeSub}>“Surakshit Driver – PMSBY Enabled”</Text>
                                <Text style={styles.badgeSub}>Profile par show hota hai</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.badgeLink}>VIEW</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 4. WHY PMSBY STRIP */}
                    <View style={styles.highlightStrip}>
                        <Text style={styles.highlightStripText}>💡 ₹20 ka kharcha</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginHorizontal: 8 }} />
                        <Text style={[styles.highlightStripText, { fontWeight: '800' }]}>₹2,00,000 ki suraksha</Text>
                    </View>
                    <View style={styles.highlightPoints}>
                        <Text style={styles.hPoint}>✔ Accident ke baad family secure</Text>
                        <Text style={styles.hPoint}>✔ Highway drivers ke liye zaroori</Text>
                    </View>

                    {/* 5. QUICK INFO */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickInfoScroll}>
                        <View style={styles.quickInfoCard}>
                            <Text style={styles.qiLabel}>🛡️ Cover</Text>
                            <Text style={styles.qiValue}>₹2,00,000</Text>
                            <Text style={styles.qiSub}>Death / Disability</Text>
                        </View>
                        <View style={styles.quickInfoCard}>
                            <Text style={styles.qiLabel}>👤 Eligibility</Text>
                            <Text style={styles.qiValue}>18–70 yrs</Text>
                            <Text style={styles.qiSub}>Bank + Aadhaar</Text>
                        </View>
                        <View style={styles.quickInfoCard}>
                            <Text style={styles.qiLabel}>🏦 Payment</Text>
                            <Text style={styles.qiValue}>Auto-debit</Text>
                            <Text style={styles.qiSub}>Once per year</Text>
                        </View>
                    </ScrollView>

                    {/* 6. CLAIM FLOW */}
                    <View style={styles.cardSection}>
                        <SectionTitle title="Claim Flow" />
                        <View style={styles.claimFlowRow}>
                            <View style={styles.claimStep}>
                                <View style={[styles.claimIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="alert" size={16} color="#EF4444" />
                                </View>
                                <Text style={styles.claimText}>Accident</Text>
                            </View>
                            <View style={styles.claimArrow} />
                            <View style={styles.claimStep}>
                                <View style={[styles.claimIcon, { backgroundColor: '#FFEDD5' }]}>
                                    <Ionicons name="call" size={16} color="#F97316" />
                                </View>
                                <Text style={styles.claimText}>Inform Bank</Text>
                            </View>
                            <View style={styles.claimArrow} />
                            <View style={styles.claimStep}>
                                <View style={[styles.claimIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="document-text" size={16} color="#F59E0B" />
                                </View>
                                <Text style={styles.claimText}>Documents</Text>
                            </View>
                            <View style={styles.claimArrow} />
                            <View style={styles.claimStep}>
                                <View style={[styles.claimIcon, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="cash" size={16} color="#22C55E" />
                                </View>
                                <Text style={styles.claimText}>Credit</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.claimHelpBtn}>
                            <Text style={styles.claimHelpText}>GET CLAIM HELP</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 7. TRUST SECTION */}
                    <View style={styles.pmsbyTrustSection}>
                        <View style={styles.trustRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            <Text style={styles.trustRowText}>Government of India ki scheme</Text>
                        </View>
                        <View style={styles.trustRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            <Text style={styles.trustRowText}>Bank ke through operate hoti hai</Text>
                        </View>
                        <View style={styles.trustRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            <Text style={styles.trustRowText}>No agent, no middleman</Text>
                        </View>
                    </View>

                    {/* 8. FOOTER CTA */}
                    <View style={styles.pmsbyFooter}>
                        <Text style={styles.pmsbyFooterTitle}>TruckMitr Cares for Drivers</Text>
                        <Text style={styles.pmsbyFooterSub}>Sirf load nahi, driver ki zindagi bhi.</Text>
                        <TouchableOpacity style={styles.pmsbyFooterBtn}>
                            <Text style={styles.pmsbyFooterBtnText}>SECURE MY FAMILY</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
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

    // PMSBY Specific Styles
    pmsbyHero: { padding: 20, paddingBottom: 24, borderRadius: 0, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 20 },
    pmsbyHeroPrice: { fontSize: 14, color: '#FEF08A', fontWeight: '700', marginBottom: 4 },
    pmsbyHeroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    pmsbyHeroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 16 },
    pmsbyHeroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    pmsbyHeroCta: { backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 30, alignItems: 'center', width: '100%', marginBottom: 6 },
    pmsbyHeroCtaText: { fontSize: 15, fontWeight: '800', color: '#1E3A5F' },
    pmsbyHeroTime: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', marginBottom: 16 },
    pmsbyTrustRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    pmsbyTrustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pmsbyTrustText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    quickActionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
    quickActionItem: { alignItems: 'center' },
    quickActionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    quickActionText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },

    featureCardsContainer: { paddingHorizontal: 16, marginBottom: 24, gap: 16 },
    featureCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    featureCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    featureCardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginLeft: 8 },
    featureCardDesc: { fontSize: 13, color: '#6B7280', marginLeft: 30, marginBottom: 12 },
    featureCardResultRow: { marginLeft: 30, marginBottom: 12 },
    featurePill: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    featurePillText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
    featureBtn: { backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
    featureBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    featureTags: { flexDirection: 'row', marginLeft: 30, gap: 8, marginBottom: 12 },
    featureTag: { fontSize: 12, color: '#4B5563', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

    voiceCard: { borderRadius: 16, padding: 16, elevation: 4 },
    voiceTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 2 },
    voiceSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
    voiceBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
    voiceBtnText: { color: '#7E22CE', fontWeight: '700', fontSize: 12 },

    badgeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', padding: 16, borderRadius: 16 },
    badgeIcon: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    badgeTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    badgeSub: { fontSize: 11, color: '#94A3B8' },
    badgeLink: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },

    highlightStrip: { backgroundColor: '#1E3A5F', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginBottom: 12 },
    highlightStripText: { color: '#FFF', fontSize: 14 },
    highlightPoints: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 16, flexWrap: 'wrap' },
    hPoint: { fontSize: 12, color: '#4B5563', fontWeight: '500' },

    quickInfoScroll: { paddingLeft: 16, marginBottom: 24 },
    quickInfoCard: { width: 120, height: 90, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginRight: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    qiLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
    qiValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    qiSub: { fontSize: 10, color: '#94A3B8' },

    claimFlowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    claimStep: { alignItems: 'center', flex: 1 },
    claimIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    claimText: { fontSize: 10, color: '#4B5563', textAlign: 'center' },
    claimArrow: { width: 20, height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },
    claimHelpBtn: { alignItems: 'center' },
    claimHelpText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },

    pmsbyTrustSection: { backgroundColor: '#F0FDF4', margin: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#22C55E' },
    trustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    trustRowText: { fontSize: 13, color: '#166534', fontWeight: '500' },

    pmsbyFooter: { padding: 24, alignItems: 'center', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    pmsbyFooterTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    pmsbyFooterSub: { fontSize: 13, color: '#64748B', marginBottom: 16, fontStyle: 'italic' },
    pmsbyFooterBtn: { backgroundColor: '#DC2626', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, elevation: 4 },
    pmsbyFooterBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default DriverWelfare;
