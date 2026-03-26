import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Animated, BackHandler, Dimensions, Image, Linking, Switch, Alert, LayoutAnimation, Platform, UIManager, TextInput, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

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
// @ts-ignore
const DriverRestFacilitiesImage = require('../../../../assets/images/driver_rest_facilitiess.png');

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
            <Text style={styles.stepNumber}>{number}</Text>
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
    const { t } = useTranslation();
    const SCHEMES = [
        {
            id: 'ayushman', title: t('driverWelfare.ayushman.title'),
            benefit: t('driverWelfare.ayushman.benefit'), benefitSuffix: t('driverWelfare.ayushman.benefitSuffix'),
            tagline: t('driverWelfare.ayushman.tagline'),
            heroHighlight: t('driverWelfare.ayushman.benefit'),
            heroSubline: t('driverWelfare.ayushman.tagline'),
            heroGradient: ['#059669', '#0891B2'], // Green → Teal
            about: t('driverWelfare.ayushman.whatIsItDesc'),
            highlights: t('driverWelfare.ayushman.benefitsList', { returnObjects: true }), // Assuming translation returns array
            benefits: (t('driverWelfare.ayushman.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'checkmark-circle', text })),
            eligibility: t('driverWelfare.ayushman.whoCanTakeList', { returnObjects: true }),
            steps: [t('driverWelfare.ayushman.cta'), t('driverWelfare.ayushman.ctaSecondary')],
            icon: 'building', color: '#059669', iconLib: 'FontAwesome5', featured: true,
            image: AyushmanFamilyImage,
            ctaText: t('driverWelfare.ayushman.cta'),
            secondaryCta: t('driverWelfare.ayushman.ctaSecondary')
        },
        {
            id: 'pmsby', title: t('driverWelfare.pmsby.title'), subtitle: t('driverWelfare.pmsby.subtitle'),
            benefit: t('driverWelfare.pmsby.benefit'),
            line1: t('driverWelfare.pmsby.benefitSuffix').replace('| ', ''), line2: '',
            heroHighlight: t('driverWelfare.pmsby.benefit'),
            heroSubline: t('driverWelfare.pmsby.benefitSuffix'),
            heroGradient: ['#1E40AF', '#3B82F6'], // Dark Blue → Blue
            about: t('driverWelfare.pmsby.whatIsItDesc'),
            highlights: t('driverWelfare.pmsby.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.pmsby.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'shield-outline', text })),
            eligibility: [],
            steps: [],
            icon: 'shield-check', color: '#1E40AF', iconLib: 'MaterialCommunityIcons', image: PmsbyImage,
            ctaText: t('driverWelfare.pmsby.cta')
        },
        {
            id: 'pmjjby', title: t('driverWelfare.pmjjby.title'), subtitle: t('driverWelfare.pmjjby.subtitle'),
            benefit: t('driverWelfare.pmjjby.benefit'),
            line1: <Text>{t('driverWelfare.pmjjby.subtitle')}</Text>, line2: '',
            heroHighlight: t('driverWelfare.pmjjby.benefit'),
            heroSubline: t('driverWelfare.pmjjby.subtitle'),
            heroGradient: ['#BE123C', '#FB7185'], // Rose → Pink
            about: t('driverWelfare.pmjjby.whatIsItDesc'),
            highlights: t('driverWelfare.pmjjby.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.pmjjby.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'heart-outline', text })),
            eligibility: [],
            steps: [],
            icon: 'heart-pulse', color: '#EF4444', iconLib: 'MaterialCommunityIcons', image: PmjjbyImage,
            ctaText: t('driverWelfare.pmjjby.cta')
        },
        {
            id: 'shramyogi', title: t('driverWelfare.shramyogi.title'), subtitle: t('driverWelfare.shramyogi.subtitle'),
            benefit: t('driverWelfare.shramyogi.benefit'),
            line1: t('driverWelfare.shramyogi.subtitle'), line2: '',
            heroHighlight: t('driverWelfare.shramyogi.benefit'),
            heroSubline: t('driverWelfare.shramyogi.subtitle'),
            heroGradient: ['#6D28D9', '#A78BFA'], // Purple → Lavender
            about: t('driverWelfare.shramyogi.whatIsItDesc'),
            highlights: t('driverWelfare.shramyogi.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.shramyogi.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'cash-outline', text })),
            eligibility: [],
            steps: [],
            icon: 'piggy-bank', color: '#F97316', iconLib: 'FontAwesome5', image: ShramYogiImage,
            ctaText: t('driverWelfare.shramyogi.cta')
        },
        {
            id: 'atal', title: t('driverWelfare.atal.title'), subtitle: t('driverWelfare.atal.subtitle'),
            benefit: t('driverWelfare.atal.benefit'),
            line1: t('driverWelfare.atal.benefitSuffix'),
            line2: <Text style={{ fontWeight: '700', color: COLORS.textDark }}></Text>,
            heroHighlight: t('driverWelfare.atal.benefit'),
            heroSubline: t('driverWelfare.atal.subtitle'),
            heroGradient: ['#4338CA', '#818CF8'], // Indigo → Light Indigo
            about: t('driverWelfare.atal.whatIsItDesc'),
            highlights: t('driverWelfare.atal.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.atal.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'lock-closed-outline', text })),
            eligibility: [],
            steps: [],
            icon: 'coins', color: '#8B5CF6', iconLib: 'FontAwesome5', image: AtalPensionImage,
            ctaText: t('driverWelfare.atal.cta')
        },
        /* {
            id: 'apnaghar', title: t('driverWelfare.apnaghar.title'), subtitle: t('driverWelfare.apnaghar.subtitle'),
            benefit: t('driverWelfare.apnaghar.title'), // Using Title as benefit placeholder or specific short text if needed
            line1: t('driverWelfare.apnaghar.subtitle'),
            line2: <Text style={{ fontWeight: '700', color: COLORS.textDark }}></Text>,
            heroHighlight: t('driverWelfare.apnaghar.title'),
            heroSubline: t('driverWelfare.apnaghar.subtitle'),
            heroGradient: ['#EA580C', '#FDBA74'], // Orange → Apricot
            about: t('driverWelfare.apnaghar.whatIsItDesc'),
            highlights: t('driverWelfare.apnaghar.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.apnaghar.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'bed-outline', text })),
            eligibility: [],
            steps: [],
            icon: 'bed', color: '#EC4899', iconLib: 'FontAwesome5', isUtility: true,
            image: DriverRestingImage,
            ctaText: t('driverWelfare.apnaghar.cta')
        }, */
        {
            id: 'driver_rest', title: t('driverWelfare.driverRest.title'), subtitle: t('driverWelfare.driverRest.subtitle'),
            benefit: t('driverWelfare.driverRest.title'),
            line1: t('driverWelfare.driverRest.subtitle'),
            line2: <Text style={{ fontWeight: '700', color: COLORS.textDark }}></Text>,
            heroHighlight: t('driverWelfare.driverRest.title'),
            heroSubline: t('driverWelfare.driverRest.subtitle'),
            heroGradient: ['#059669', '#34D399'],
            about: t('driverWelfare.driverRest.whatIsItDesc'),
            highlights: t('driverWelfare.driverRest.benefitsList', { returnObjects: true }),
            benefits: (t('driverWelfare.driverRest.benefitsList', { returnObjects: true }) as string[]).map(text => ({ icon: 'utensils', text })),
            eligibility: [],
            steps: [],
            icon: 'hotel', color: '#059669', iconLib: 'FontAwesome5',
            image: DriverRestFacilitiesImage,
            ctaText: t('driverWelfare.driverRest.cta')
        }
    ];
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [currentScreen, setCurrentScreen] = useState<'list' | 'detail'>('list');
    const [selectedScheme, setSelectedScheme] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const soundRef = useRef<Sound | null>(null);
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
                    <Text style={styles.headerTitle}>{t('driverWelfare.headerTitle')}</Text>
                    <Text style={styles.headerSubtitle}>{t('driverWelfare.headerSubtitle')}</Text>
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
                        <Image source={scheme.image} style={styles.featuredImage} resizeMode="contain" />
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
                    <Text style={styles.featuredCtaText}>{scheme.id === 'ayushman' ? t('driverWelfare.ayushman.cta') : t('driverWelfare.exploreScheme')}</Text>
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
        else if (scheme.id === 'driver_rest') cardBg = '#ECFDF5';

        return (
            <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={[styles.wideCard, { backgroundColor: cardBg, borderColor: scheme.color + '30' }]}>
                <View style={styles.wideCardContainer}>
                    <View style={[styles.wideCardBgCircle, { backgroundColor: scheme.color + '05' }]} />

                    {img && (
                        <View style={[styles.utilityImageContainer, scheme.id === 'driver_rest' && { right: -5 }]}>
                            <Image source={img} style={styles.utilityImage} resizeMode="contain" />
                            <LinearGradient
                                colors={[cardBg, 'transparent']}
                                locations={[0, 0.7]}
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
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginRight: 4 }}>{t('driverWelfare.viewDetails')}</Text>
                            <Ionicons name="arrow-forward" size={12} color={COLORS.textDark} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const SchemesListScreen = () => {
        const healthSchemes = SCHEMES.filter(s => ['ayushman', 'pmsby', 'pmjjby'].includes(s.id));
        const pensionSchemes = SCHEMES.filter(s => ['shramyogi', 'atal'].includes(s.id));
        const facilitySchemes = SCHEMES.filter(s => ['apnaghar', 'driver_rest'].includes(s.id));

        return (
            <View style={styles.flex1}>
                <Header />
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={{ opacity: fadeAnim }}>

                        {/* Health & Insurance */}
                        <Text style={styles.categoryTitle}>{t('driverWelfare.categoryHealth')}</Text>
                        {healthSchemes.map((item) => (
                            item.id === 'ayushman' ?
                                <FeaturedCard key={item.id} scheme={item} onPress={() => { setSelectedScheme(item); setCurrentScreen('detail'); }} /> :
                                <WideCard key={item.id} scheme={item} onPress={() => { setSelectedScheme(item); setCurrentScreen('detail'); }} />
                        ))}

                        <View style={{ height: 24 }} />

                        {/* Pension & Savings */}
                        <Text style={styles.categoryTitle}>{t('driverWelfare.categoryPension')}</Text>
                        {pensionSchemes.map((item) => (
                            <WideCard key={item.id} scheme={item} onPress={() => { setSelectedScheme(item); setCurrentScreen('detail'); }} />
                        ))}

                        <View style={{ height: 24 }} />

                        {/* Facilities & Welfare */}
                        <Text style={styles.categoryTitle}>{t('driverWelfare.categoryFacility')}</Text>
                        {facilitySchemes.map((item) => (
                            <WideCard key={item.id} scheme={item} onPress={() => { setSelectedScheme(item); setCurrentScreen('detail'); }} />
                        ))}

                        <View style={{ alignItems: 'center', marginTop: 16, paddingHorizontal: 24 }}>
                            <Ionicons name="heart" size={16} color={COLORS.textMuted} />
                            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, fontWeight: '500' }}>
                                {t('driverWelfare.finalLine')}
                            </Text>
                        </View>
                        <View style={{ height: 20 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        );
    };



    // Ayushman Bharat Ticker Component
    const AyushmanTicker = () => {
        const scrollX = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            const startAnimation = () => {
                scrollX.setValue(0);
                Animated.timing(scrollX, {
                    toValue: -500,
                    duration: 30000,
                    useNativeDriver: true,
                }).start(() => startAnimation());
            };
            startAnimation();
        }, []);

        return (
            <View style={styles.tickerContainer}>
                <Animated.View style={[styles.tickerInner, { transform: [{ translateX: scrollX }] }]}>
                    <Text style={styles.tickerText}>
                        🏥 Cashless treatment at 25,000+ hospitals  •  👨‍👩‍👧‍👦 50 Crore+ beneficiaries  •  📞 Helpline: 1800-102-4558 (24×7)  •  ✅ No premium — completely free  •  🏥 Cashless treatment at 25,000+ hospitals  •  👨‍👩‍👧‍👦 50 Crore+ beneficiaries
                    </Text>
                </Animated.View>
            </View>
        );
    };

    // NEW: Ayushman Bharat Detail View (Premium HTML Conversion)
    const AyushmanDetailView = () => {
        const [showWebView, setShowWebView] = useState(false);
        const [webViewUrl, setWebViewUrl] = useState('');
        const [mobileNumber, setMobileNumber] = useState('');

        const openWebView = (url: string) => {
            setWebViewUrl(url);
            setShowWebView(true);
        };

        const steps = [
            { id: 1, title: 'Check Eligibility First', tag: 'Do This First', color: '#c2440e', bg: '#fff0e8', text: 'Call 14555 or visit pmjay.gov.in with your Aadhaar or mobile number.' },
            { id: 2, title: 'Visit Nearest CSC or Hospital', text: 'Go to a Common Service Centre or empanelled hospital with your documents.' },
            { id: 3, title: 'Complete eKYC', text: 'Biometric or OTP verification using Aadhaar and ration card.' },
            { id: 4, title: 'Download Your Card', tag: 'Instant & Free', color: '#16a34a', bg: '#f0fdf4', text: 'Get it instantly from the ABHA app or collect a printed copy from CSC.' },
            { id: 5, title: 'Use at Any Empanelled Hospital', text: 'Show your card at registration — 100% cashless, no payment needed!' },
        ];

        return (
            <View style={[styles.flex1, { backgroundColor: '#FFFFFF' }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} style={{ backgroundColor: '#FFFFFF' }}>


                    {/* HERO SECTION */}
                    <View style={styles.heroNew}>
                        <View style={styles.heroBlob} />
                        <View style={styles.heroBlob2} />

                        <View style={styles.topbarNew}>
                            <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                <Ionicons name="arrow-back" size={18} color="#0b1d3a" />
                            </TouchableOpacity>

                            <View style={styles.headerRightSide}>
                                <View style={styles.govChip}><Text style={styles.govChipText}>🇮🇳 Govt</Text></View>
                                <TouchableOpacity
                                    onPress={() => setIsMuted(!isMuted)}
                                    style={styles.voiceToggleBtn}
                                >
                                    <Ionicons
                                        name={isMuted ? "volume-mute" : "volume-high"}
                                        size={22}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.heroBodyNew}>
                            <View style={styles.schemeRowNew}>
                                <View style={styles.schemeIconNew}><Text style={{ fontSize: 26 }}>🏥</Text></View>
                                <View style={styles.schemeTitleNew}>
                                    <Text style={styles.schemeTitleH1}>Ayushman Bharat{'\n'}Yojana</Text>
                                    <Text style={styles.schemeTitleP}>Pradhan Mantri Jan Arogya Yojana</Text>
                                </View>
                            </View>

                            <View style={styles.coverPill}>
                                <Text style={styles.coverAmt}>₹5 Lakh</Text>
                                <Text style={styles.coverTxt}>Free Health{'\n'}Cover / Year</Text>
                            </View>

                            <View style={styles.heroBtnsNew}>
                                <TouchableOpacity style={styles.hbtnWhite} onPress={() => openWebView('https://beneficiary.nha.gov.in/')}>
                                    <Ionicons name="document-text-outline" size={18} color="white" />
                                    <Text style={styles.hbtnWhiteText}>Apply Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* TICKER */}
                    <AyushmanTicker />

                    <View style={styles.contentNew}>




                        {/* WHAT IS AYUSHMAN */}
                        <View style={styles.cardNew}>
                            <View style={styles.cardTopNew}>
                                <Text style={styles.cardTitleNew}>📖 What is Ayushman Bharat?</Text>
                                <View style={[styles.chipNew, { backgroundColor: '#F0FDFA' }]}><Text style={[styles.chipTextNew, { color: '#0F766E' }]}>INFO</Text></View>
                            </View>
                            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                                    Ayushman Bharat (PM-JAY) is the world's largest government-funded health insurance scheme. It provides free medical treatment up to <Text style={{ fontWeight: '700', color: '#0F172A' }}>₹5 Lakh per family per year</Text> for major surgeries and hospitalization. Enrolled citizens can get <Text style={{ fontWeight: '700', color: '#0F172A' }}>cashless treatment</Text> at any government or private empanelled hospital across India.
                                </Text>
                            </View>
                        </View>

                        {/* WHAT'S COVERED */}
                        <View style={styles.cardNew}>
                            <View style={styles.cardTopNew}>
                                <Text style={styles.cardTitleNew}>💊 What's Covered</Text>
                                <View style={[styles.chipNew, { backgroundColor: '#fff0e8' }]}><Text style={[styles.chipTextNew, { color: '#c2440e' }]}>FREE</Text></View>
                            </View>
                            <View style={styles.benGridNew}>
                                <View style={styles.benItemNew}>
                                    <Text style={styles.benIconNew}>💳</Text>
                                    <Text style={styles.benH4New}>Cashless Treatment</Text>
                                    <Text style={styles.benPNew}>Zero upfront payment</Text>
                                </View>
                                <View style={styles.benItemNew}>
                                    <Text style={styles.benIconNew}>🔬</Text>
                                    <Text style={styles.benH4New}>1,500+ Surgeries</Text>
                                    <Text style={styles.benPNew}>Major procedures</Text>
                                </View>
                                <View style={styles.benItemNew}>
                                    <Text style={styles.benIconNew}>🧪</Text>
                                    <Text style={styles.benH4New}>Pre & Post Care</Text>
                                    <Text style={styles.benPNew}>Medications included</Text>
                                </View>
                                <View style={styles.benItemNew}>
                                    <Text style={styles.benIconNew}>🚑</Text>
                                    <Text style={styles.benH4New}>ICU & Emergency</Text>
                                    <Text style={styles.benPNew}>Fully covered</Text>
                                </View>
                            </View>
                        </View>

                        {/* HOW TO APPLY (VIDEO + STEPS) */}
                        <View style={styles.cardNew}>
                            <View style={styles.cardTopNew}>
                                <Text style={styles.cardTitleNew}>🎬 How to Apply</Text>
                                <View style={[styles.chipNew, { backgroundColor: '#e8f4fd' }]}><Text style={[styles.chipTextNew, { color: '#1e5fa8' }]}>VIDEO + STEPS</Text></View>
                            </View>

                            <TouchableOpacity style={styles.vidThumbNew} onPress={() => openWebView('https://www.youtube.com/results?search_query=how+to+apply+for+ayushman+card')}>
                                <LinearGradient colors={['rgba(11,29,58,0.9)', 'rgba(244,98,42,0.4)']} style={styles.vidOverlayNew}>
                                    <View style={styles.playCircleNew}><Ionicons name="play" size={24} color="#0b1d3a" /></View>
                                    <Text style={styles.vidLabelNew}>Watch Full Tutorial</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.secHeadNew}>Steps to Apply</Text>
                                <View style={styles.stepsNew}>
                                    {steps.map((step, idx) => (
                                        <View key={idx} style={styles.stepNew}>
                                            <View style={styles.stepLeftNew}>
                                                <View style={styles.stepNumNew}><Text style={styles.stepNumTextNew}>{step.id}</Text></View>
                                                {idx !== steps.length - 1 && <View style={styles.stepLineNew} />}
                                            </View>
                                            <View style={styles.stepBodyNew}>
                                                <Text style={styles.stepH4New}>{step.title}</Text>
                                                <Text style={styles.stepPNew}>{step.text}</Text>
                                                {step.tag && (
                                                    <View style={[styles.stepChipNew, { backgroundColor: step.bg }]}><Text style={[styles.stepChipTextNew, { color: step.color }]}>{step.tag}</Text></View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* FIND HOSPITAL CARD */}
                        <View style={styles.eligCardNew}>
                            <Text style={styles.eligH3New}>🏥 Find Hospital Near You</Text>
                            <Text style={styles.eligPNew}>Locate the nearest private or govt. empanelled hospital instantly</Text>
                            <TouchableOpacity style={styles.eligBtnNew} onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=hospitals+near+me')}>
                                <Text style={styles.eligBtnTextNew}>🔍 Find Nearby Hospital</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CONTACT */}
                        <View style={styles.cardNew}>
                            <View style={styles.cardTopNew}>
                                <Text style={styles.cardTitleNew}>📞 Contact & Support</Text>
                            </View>
                            <View style={styles.contactListNew}>
                                <TouchableOpacity style={styles.contactRowNew} onPress={() => Linking.openURL('tel:18001024558')}>
                                    <View style={[styles.ciNew, { backgroundColor: '#fff0e8' }]}><Text>📞</Text></View>
                                    <View style={styles.cInfoNew}>
                                        <Text style={styles.cH4New}>TruckMitr Helpline</Text>
                                        <Text style={styles.cNumNew}>1800 102 4558</Text>
                                        <Text style={styles.cPNew}>Toll Free · Mon–Sat 9AM–6PM</Text>
                                    </View>
                                    <Text style={styles.cArrNew}>›</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </View>
                </ScrollView>

                {/* STICKY BOTTOM BAR */}
                <View style={styles.bottomBarNew}>
                    <TouchableOpacity style={styles.bbMainNew} onPress={() => openWebView('https://beneficiary.nha.gov.in/')}>
                        <Ionicons name="document-text-outline" size={18} color="white" />
                        <Text style={styles.bbMainTextNew}>Apply Now</Text>
                    </TouchableOpacity>
                </View>

                {/* WEBVIEW MODAL */}
                <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top }]}>
                            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.wvBarBackNew}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}>
                                <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrl.replace('https://', '')}</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView
                            source={{ uri: webViewUrl }}
                            style={styles.flex1}
                            startInLoadingState
                            renderLoading={() => <View style={styles.wvBodyNew}><Text style={{ color: '#0b1d3a' }}>Loading official portal...</Text></View>}
                        />
                    </View>
                </Modal>
            </View>
        );
    };

    // PMSBY Detail View (Get ID Check style)
    const PMSBYDetailView = () => {
        const [showWebView, setShowWebView] = useState(false);
        const [webViewUrl, setWebViewUrl] = useState('');
        const [activeFaq, setActiveFaq] = useState<number | null>(null);
        const [applyMethod, setApplyMethod] = useState<'online' | 'offline'>('offline');

        const openWebView = (url: string) => {
            setWebViewUrl(url);
            setShowWebView(true);
        };

        const faqs = [
            { q: 'Is this scheme only for drivers?', a: 'No, PMSBY is open to all Indian citizens aged 18–70 with a savings bank account. However, it is especially useful for drivers due to higher road accident risks.' },
            { q: 'What if I miss the premium payment?', a: 'If ₹20 is not debited by June 1st due to insufficient balance, the policy will lapse. You can re-enroll the next year. There is no penalty.' },
            { q: 'Can I have multiple PMSBY policies?', a: 'No, only one PMSBY policy is allowed per person regardless of how many bank accounts you hold. If enrolled in multiple accounts, only one claim will be entertained.' },
            { q: 'Does it cover natural death?', a: 'No. PMSBY only covers accidental death and permanent disability. It does not cover natural death, illness, or suicide. For life cover, enroll in PMJJBY instead.' },
        ];

        return (
            <View style={styles.flex1}>


                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} style={{ backgroundColor: '#FFFFFF' }}>

                    {/* HERO SECTION - DIRECT TEXT ON BACKGROUND */}
                    <View style={styles.pmsbyHeroSection}>
                        <LinearGradient colors={['#F0F9FF', '#E3F0FF']} style={styles.pmsbyHeroGradient}>
                            {/* Decorative Blobs */}
                            <View style={[styles.heroBlob, { backgroundColor: 'rgba(30,136,229,0.06)' }]} />
                            <View style={[styles.heroBlob2, { backgroundColor: 'rgba(30,136,229,0.04)' }]} />

                            <View style={[styles.flexRow, { justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 0, alignItems: 'flex-start' }]}>
                                <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                    <Ionicons name="arrow-back" size={20} color="#0A2463" />
                                </TouchableOpacity>
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                    <View style={[styles.pmsbyGovTagDirect, { marginTop: 0 }]}>
                                        <Text style={styles.pmsbyGovTagTextDirect}>GOVERNMENT OF INDIA SCHEME</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setIsMuted(!isMuted)}
                                        style={styles.voiceToggleBtn}
                                    >
                                        <Ionicons
                                            name={isMuted ? "volume-mute" : "volume-high"}
                                            size={22}
                                            color="white"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pmsbyHeroDirectBody}>


                                <View style={[styles.flexRow, { gap: 14, marginBottom: 8, marginTop: -20 }]}>
                                    <View style={[styles.pmsbyShieldBoxDirect, { width: 52, height: 52, borderRadius: 14 }]}>
                                        <Text style={{ fontSize: 32 }}>🛡️</Text>
                                    </View>
                                    <Text style={[styles.pmsbyHeroTitleDirect, { marginBottom: 0 }]}>PMSBY Accident{'\n'}Insurance Scheme</Text>
                                </View>
                                <Text style={styles.pmsbyHeroSubDirect}>Pradhan Mantri Suraksha Bima Yojana</Text>

                                <View style={styles.pmsbyHeroBenefitGrid}>
                                    <View style={styles.pmsbyHeroBenPill}>
                                        <Text style={styles.pmsbyHeroBenText}>💰 ₹2 Lakh Cover</Text>
                                    </View>
                                    <View style={[styles.pmsbyHeroBenPill, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                                        <Text style={[styles.pmsbyHeroBenText, { color: '#0369A1' }]}>⚡ Only ₹20/Year</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.pmsbyHeroApplyBtn} onPress={() => openWebView('https://jansuraksha.gov.in/Forms-PMSBY.aspx')}>
                                    <Ionicons name="document-text-outline" size={18} color="white" />
                                    <Text style={styles.pmsbyHeroApplyBtnText}>Apply Now</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* STATS ROW */}
                    <View style={styles.pmsbyStatsRow}>
                        <View style={styles.pmsbyStatCard}>
                            <Text style={{ fontSize: 24, marginBottom: 4 }}>👥</Text>
                            <Text style={styles.pmsbyStatVal}>34Cr+</Text>
                            <Text style={styles.pmsbyStatLabel}>ENROLLED</Text>
                        </View>
                        <View style={styles.pmsbyStatCard}>
                            <Text style={{ fontSize: 24, marginBottom: 4 }}>✅</Text>
                            <Text style={styles.pmsbyStatVal}>₹2L</Text>
                            <Text style={styles.pmsbyStatLabel}>MAX COVER</Text>
                        </View>
                        <View style={styles.pmsbyStatCard}>
                            <Text style={{ fontSize: 24, marginBottom: 4 }}>🏛️</Text>
                            <Text style={styles.pmsbyStatVal}>2015</Text>
                            <Text style={styles.pmsbyStatLabel}>SINCE</Text>
                        </View>
                    </View>

                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbyInfoCard}>
                            <View style={[styles.pmsbySecHead, { marginBottom: 12 }]}>
                                <View style={styles.pmsbySecIcon}><Text>📖</Text></View>
                                <View>
                                    <Text style={styles.pmsbySecTitle}>What is PMSBY?</Text>
                                    <Text style={styles.pmsbySecSub}>About the scheme</Text>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />
                            <Text style={styles.pmsbyInfoText}>PMSBY is a government-backed personal accident insurance scheme launched in 2015. It provides financial protection to the enrolled person's family in case of accidental death or permanent disability. The premium is automatically deducted from your bank account every year.</Text>
                        </View>
                    </View>

                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbyInfoCard}>
                            <View style={[styles.pmsbySecHead, { marginBottom: 12 }]}>
                                <View style={styles.pmsbySecIcon}><Text>🎁</Text></View>
                                <View>
                                    <Text style={styles.pmsbySecTitle}>Scheme Benefits</Text>
                                    <Text style={styles.pmsbySecSub}>What you get covered</Text>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 }} />
                            <View style={styles.pmsbyBenGrid}>
                                <View style={styles.pmsbyBenCard}>
                                    <View style={styles.pmsbyBenTop}>
                                        <Ionicons name="shield-checkmark" size={24} color="#1E88E5" />
                                        <View style={styles.pmsbyBenBadge}><Text style={styles.pmsbyBenBadgeText}>DEATH</Text></View>
                                    </View>
                                    <Text style={styles.pmsbyBenVal}>₹2 Lakh</Text>
                                    <Text style={styles.pmsbyBenDesc}>Paid to family on accidental death</Text>
                                </View>
                                <View style={styles.pmsbyBenCard}>
                                    <View style={styles.pmsbyBenTop}>
                                        <Ionicons name="accessibility" size={24} color="#1E88E5" />
                                        <View style={styles.pmsbyBenBadge}><Text style={styles.pmsbyBenBadgeText}>DISABILITY</Text></View>
                                    </View>
                                    <Text style={styles.pmsbyBenVal}>₹2 Lakh</Text>
                                    <Text style={styles.pmsbyBenDesc}>Total & permanent disability cover</Text>
                                </View>
                                <View style={styles.pmsbyBenCard}>
                                    <View style={styles.pmsbyBenTop}>
                                        <Ionicons name="bandage-outline" size={24} color="#1E88E5" />
                                        <View style={styles.pmsbyBenBadge}><Text style={styles.pmsbyBenBadgeText}>PARTIAL</Text></View>
                                    </View>
                                    <Text style={styles.pmsbyBenVal}>₹1 Lakh</Text>
                                    <Text style={styles.pmsbyBenDesc}>Partial permanent disability cover</Text>
                                </View>
                                <View style={styles.pmsbyBenCard}>
                                    <View style={styles.pmsbyBenTop}>
                                        <Ionicons name="cash-outline" size={24} color="#1E88E5" />
                                        <View style={styles.pmsbyBenBadge}><Text style={styles.pmsbyBenBadgeText}>PREMIUM</Text></View>
                                    </View>
                                    <Text style={styles.pmsbyBenVal}>₹20/yr</Text>
                                    <Text style={styles.pmsbyBenDesc}>Auto-debited from bank account</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbyInfoCard}>
                            <View style={[styles.pmsbySecHead, { marginBottom: 12 }]}>
                                <View style={styles.pmsbySecIcon}><Text>✅</Text></View>
                                <View>
                                    <Text style={styles.pmsbySecTitle}>Who Can Apply?</Text>
                                    <Text style={styles.pmsbySecSub}>Eligibility criteria</Text>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />
                            <View style={{ gap: 16 }}>
                                <View style={[styles.flexRow, { gap: 12 }]}>
                                    <View style={styles.pmsbyEligIcon}>
                                        <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pmsbyEligTitle}>Age: 18 to 70 Years</Text>
                                        <Text style={styles.pmsbyEligDesc}>All Indian citizens within this age group are eligible</Text>
                                    </View>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                                <View style={[styles.flexRow, { gap: 12 }]}>
                                    <View style={styles.pmsbyEligIcon}>
                                        <Ionicons name="business-outline" size={20} color="#1E88E5" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pmsbyEligTitle}>Active Savings Bank Account</Text>
                                        <Text style={styles.pmsbyEligDesc}>Must have auto-debit enabled for yearly premium of ₹20</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* HOW TO APPLY (VIDEO + STEPS) */}
                    <View style={styles.pmsbySection}>
                        <View style={[styles.pmsbyInfoCard, { padding: 0, overflow: 'hidden' }]}>
                            <View style={[styles.pmsbySecHead, { paddingHorizontal: 20, paddingTop: 20, marginBottom: 15 }]}>
                                <View style={styles.pmsbySecIcon}><Text>🎬</Text></View>
                                <View>
                                    <Text style={styles.pmsbySecTitle}>How to Apply</Text>
                                    <Text style={styles.pmsbySecSub}>Video + Step-by-step guide</Text>
                                </View>
                            </View>
                            {/* VIDEO FIRST */}
                            <TouchableOpacity style={[styles.pmsbyVideoCard, { borderWidth: 0, borderRadius: 0 }]} onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=PMSBY+apply+kaise+kare')}>
                                <View style={styles.pmsbyVideoThumb}>
                                    <LinearGradient colors={['rgba(0,198,255,0.1)', 'rgba(0,114,255,0.1)']} style={styles.pmsbyVideoThumbOverlay}>
                                        <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.pmsbyPlayBtn}>
                                            <Ionicons name="play" size={24} color="white" />
                                        </LinearGradient>
                                    </LinearGradient>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={styles.pmsbyVideoLabel}>📹 OFFICIAL GUIDE</Text>
                                    <Text style={styles.pmsbyVideoTitle}>PMSBY Apply Kaise Kare — Full Tutorial</Text>
                                    <Text style={styles.pmsbyVideoMeta}>Hindi • 8 min • Government of India</Text>
                                </View>
                            </TouchableOpacity>

                            <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

                            {/* METHOD SWITCHER */}
                            <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', margin: 16, borderRadius: 12, padding: 4 }}>
                                <TouchableOpacity
                                    style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'offline' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                    onPress={() => setApplyMethod('offline')}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'offline' ? '#1E88E5' : '#64748B' }}>In Bank (Offline)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'online' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                    onPress={() => setApplyMethod('online')}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'online' ? '#1E88E5' : '#64748B' }}>Online / App</Text>
                                </TouchableOpacity>
                            </View>

                            {/* STEPS BELOW */}
                            <View style={[styles.pmsbyStepsList, { padding: 16, paddingTop: 4 }]}>
                                {(applyMethod === 'offline' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5]).map((step) => (
                                    <View key={step} style={styles.pmsbyStepItem}>
                                        <View style={styles.pmsbyStepLeft}>
                                            <LinearGradient colors={['#1565C0', '#00C6FF']} style={styles.pmsbyStepNum}>
                                                <Text style={styles.pmsbyStepNumText}>{step}</Text>
                                            </LinearGradient>
                                            {step < 5 && <View style={styles.pmsbyStepLine} />}
                                        </View>
                                        <View style={styles.pmsbyStepContent}>
                                            <Text style={styles.pmsbyStepTitle}>
                                                {applyMethod === 'offline' ? (
                                                    step === 1 ? 'Download Apply Form' :
                                                        step === 2 ? 'Visit Your Bank' :
                                                            step === 3 ? 'Fill the Form' :
                                                                step === 4 ? 'Submit & Activate' : 'Get Your Policy'
                                                ) : (
                                                    step === 1 ? 'Log in to Bank App' :
                                                        step === 2 ? 'Go to Insurance' :
                                                            step === 3 ? 'Find PMSBY' :
                                                                step === 4 ? 'Confirm & Apply' : 'E-Receipt & Policy'
                                                )}
                                            </Text>
                                            <Text style={styles.pmsbyStepDesc}>
                                                {applyMethod === 'offline' ? (
                                                    step === 1 ? 'Download the PMSBY application form from the official Jan Suraksha portal.' :
                                                        step === 2 ? 'Go to your nearest bank branch where you have an active savings account.' :
                                                            step === 3 ? 'Fill out the form with your Aadhaar number, bank details, and nominee info.' :
                                                                step === 4 ? 'Submit the form. ₹20 will be auto-debited annually for renewal.' : 'Download your e-policy from the bank\'s website after 15 days.'
                                                ) : (
                                                    step === 1 ? 'Open your bank\'s mobile app or net-banking portal and log in.' :
                                                        step === 2 ? 'Navigate to the "Social Security Schemes" or "Insurance" section.' :
                                                            step === 3 ? 'Search for Pradhan Mantri Suraksha Bima Yojana (PMSBY).' :
                                                                step === 4 ? 'Select your bank account, enter nominee details, and confirm auto-debit.' : 'Download your e-receipt and policy certificate instantly.'
                                                )}
                                            </Text>
                                            {applyMethod === 'offline' && step === 1 && (
                                                <TouchableOpacity
                                                    style={{ marginTop: 10, backgroundColor: '#F0F9FF', borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E88E5', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                                    onPress={() => openWebView('https://jansuraksha.gov.in/Forms-PMSBY.aspx')}
                                                >
                                                    <Ionicons name="download-outline" size={16} color="#1E88E5" />
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E88E5' }}>Download PMSBY Form</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>


                        </View>
                    </View>

                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbyInfoCard}>
                            <View style={[styles.pmsbySecHead, { marginBottom: 16 }]}>
                                <View style={styles.pmsbySecIcon}><Ionicons name="document-text" size={20} color="#1E88E5" /></View>
                                <View>
                                    <Text style={styles.pmsbySecTitle}>How to Claim</Text>
                                    <Text style={styles.pmsbySecSub}>Steps to take after an accident</Text>
                                </View>
                            </View>

                            <View style={{ gap: 0 }}>
                                {[1, 2, 3, 4].map((step, idx) => (
                                    <View key={step} style={{ flexDirection: 'row', gap: 16 }}>
                                        <View style={{ alignItems: 'center' }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#BBDEFB' }}>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5' }}>{step}</Text>
                                            </View>
                                            {idx !== 3 && <View style={{ width: 1.5, flex: 1, backgroundColor: '#E3F2FD', marginVertical: 4 }} />}
                                        </View>
                                        <View style={{ flex: 1, paddingBottom: 20 }}>
                                            <Text style={styles.pmsbyClaimText}>
                                                {step === 1 ? 'Contact your bank branch within 30 days of the accident.' :
                                                    step === 2 ? 'Submit the claim form along with FIR, death/disability certificate.' :
                                                        step === 3 ? 'The bank will verify documents and forward to the insurance company.' : 'The claim amount will be credited directly to the bank account.'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* FIND BANK SEC */}
                    <View style={styles.pmsbySection}>
                        <TouchableOpacity
                            style={[styles.pmsbyInfoCard, { backgroundColor: '#F0F9FF', borderColor: '#BBDEFB', borderStyle: 'dashed' }]}
                            onPress={() => Linking.openURL('https://www.google.com/maps/search/bank+near+me')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={[styles.pmsbySecIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="location" size={20} color="#1E88E5" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pmsbySecTitle}>Find Bank Near You</Text>
                                    <Text style={{ fontSize: 13, color: '#1E88E5', fontWeight: '500' }}>Locate branches to apply offline ›</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* CONTACT CARD - SMALLER & FLAT */}
                    <View style={styles.pmsbySection}>
                        <View style={styles.cardTopNew}>
                            <Text style={styles.cardTitleNew}>📞 Contact & Support</Text>
                        </View>
                        <TouchableOpacity style={[styles.contactRowNew, { backgroundColor: '#F0F9FF' }]} onPress={() => Linking.openURL('tel:18001024558')}>
                            <View style={[styles.ciNew, { backgroundColor: '#E3F2FD' }]}><Ionicons name="call" size={20} color="#1E88E5" /></View>
                            <View style={styles.cInfoNew}>
                                <Text style={styles.cH4New}>TruckMitr Helpline</Text>
                                <Text style={styles.cNumNew}>1800 102 4558</Text>
                                <Text style={styles.cPNew}>Toll Free · Mon–Sat 9AM–6PM</Text>
                            </View>
                            <Text style={styles.cArrNew}>›</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>

                <View style={styles.pmsbyStickyCta}>
                    <TouchableOpacity style={styles.pmsbyStickyBtn} onPress={() => openWebView('https://jansuraksha.gov.in/Forms-PMSBY.aspx')}>
                        <Ionicons name="document-text-outline" size={18} color="white" />
                        <Text style={styles.pmsbyStickyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                </View>

                {/* WEBVIEW MODAL */}
                <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top }]}>
                            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.wvBarBackNew}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}>
                                <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrl.replace('https://', '')}</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView
                            source={{ uri: webViewUrl }}
                            style={styles.flex1}
                            startInLoadingState
                            renderLoading={() => <View style={styles.wvBodyNew}><Text style={{ color: '#0b1d3a' }}>Loading official portal...</Text></View>}
                        />
                    </View>
                </Modal>
            </View>
        );
    };

    // PMJJBY Detail View (Premium Update)
    const PMJJBYDetailView = () => {
        const [showWebView, setShowWebView] = useState(false);
        const [webViewUrl, setWebViewUrl] = useState('');
        const [activeFaq, setActiveFaq] = useState<number | null>(null);
        const [applyMethod, setApplyMethod] = useState<'offline' | 'online'>('offline');

        const openWebView = (url: string) => {
            setWebViewUrl(url);
            setShowWebView(true);
        };

        const toggleFaq = (index: number) => {
            setActiveFaq(activeFaq === index ? null : index);
        };

        const steps = [
            { id: 1, title: 'Visit Your Bank / Open App', desc: 'Go to your nearest bank branch or open banking app. Fill the application form for PMJJBY.' },
            { id: 2, title: 'Fill the PMJJBY Form', desc: 'Enter your name, Aadhaar, bank account details and nominee information clearly.' },
            { id: 3, title: 'Submit Documents', desc: 'Carry your Aadhaar card and bank passbook. No medical check-up required!' },
            { id: 4, title: 'Premium Deduction', desc: '₹436 will be auto-debited from your linked bank account each year in May/June.' },
            { id: 5, title: 'Get Your Certificate 🎉', desc: 'You\'re covered! The certificate will be sent to your registered mobile and email.' },
        ];

        const onlineSteps = [
            { id: 1, title: 'Login to Your Bank App / Net Banking', desc: 'Use Customer ID & password (HDFC, SBI, ICICI, PNB, etc.)' },
            { id: 2, title: 'Go to “Insurance” or “Government Schemes”', desc: 'Find social security schemes section' },
            { id: 3, title: 'Select “PMJJBY”', desc: 'Choose Pradhan Mantri Jeevan Jyoti Bima Yojana' },
            { id: 4, title: 'Fill Details & Add Nominee', desc: 'Enter your details and nominee information' },
            { id: 5, title: 'Confirm Auto-Debit', desc: 'Allow yearly premium deduction (~₹436)' },
            { id: 6, title: 'Submit Application', desc: 'Policy gets activated after payment' },
        ];

        const faqs = [
            { q: 'Can I apply if I\'m a driver?', a: 'Yes! Any Indian citizen between 18–50 years with a savings bank account can apply. Truck drivers and taxi drivers are highly encouraged to enroll.' },
            { q: 'What happens if I miss premium?', a: 'Coverage lapses if premium isn\'t paid. You can re-enroll later by paying the premium and submitting a self-declaration of good health.' },
            { q: 'How does nominee claim money?', a: 'The nominee must submit a death certificate and claim form at the bank. The ₹2 lakh is transferred within 30 days of approval.' },
            { q: 'Is medical test required?', a: 'No medical test is needed! You only need to provide a self-declaration of good health on the enrollment form.' },
        ];

        return (
            <View style={styles.flex1}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: '#FFFFFF' }}>

                    {/* HERO SECTION - LIGHT BLUE (Unique layout for PMJJBY) */}
                    <View style={styles.pmsbyHeroSection}>
                        <LinearGradient colors={['#F0F9FF', '#E3F0FF']} style={[styles.pmsbyHeroGradient, { paddingBottom: 20 }]}>
                            {/* Decorative Blobs */}
                            <View style={[styles.heroBlob, { backgroundColor: 'rgba(30,136,229,0.06)' }]} />
                            <View style={[styles.heroBlob2, { backgroundColor: 'rgba(30,136,229,0.04)' }]} />

                            <View style={[styles.flexRow, { justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 0, alignItems: 'flex-start' }]}>
                                <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                    <Ionicons name="arrow-back" size={20} color="#0A2463" />
                                </TouchableOpacity>
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                    <View style={[styles.pmsbyGovTagDirect, { marginTop: 0 }]}>
                                        <Text style={styles.pmsbyGovTagTextDirect}>GOVERNMENT OF INDIA SCHEME</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setIsMuted(!isMuted)}
                                        style={styles.voiceToggleBtn}
                                    >
                                        <Ionicons
                                            name={isMuted ? "volume-mute" : "volume-high"}
                                            size={22}
                                            color="white"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pmsbyHeroDirectBody}>

                                <View style={[styles.flexRow, { gap: 14, marginBottom: 8, marginTop: -20 }]}>
                                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
                                        <Text style={{ fontSize: 28 }}>🛡️</Text>
                                    </View>
                                    <Text style={[styles.pmsbyHeroTitleDirect, { marginBottom: 0 }]}>PM Jeevan Jyoti{'\n'}Bima Yojana</Text>
                                </View>
                                <Text style={styles.pmsbyHeroSubDirect}>Life Insurance for Every Indian Family</Text>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>₹2 Lakh</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Life Cover</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>₹436</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Per Year</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>18–50</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Age Group</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.pmsbyHeroApplyBtn} onPress={() => openWebView('https://netbanking.hdfcbank.com/netbanking/')}>
                                    <Ionicons name="document-text-outline" size={18} color="white" />
                                    <Text style={styles.pmsbyHeroApplyBtnText}>Apply Now</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* CONTENT PART using flat internal-header cards */}
                    <View style={{ paddingTop: 24, paddingBottom: 100 }}>

                        {/* WHAT IS PMJJBY? */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>📖</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>What is PMJJBY?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>A quick overview</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#4A5C82', lineHeight: 22 }}>
                                        PMJJBY is a <Text style={{ fontWeight: '800', color: '#0A2463' }}>government-backed life insurance scheme</Text> that provides ₹2 lakh coverage on death due to any cause — for only ₹436/year. It's designed specifically to protect families of drivers, workers, and low-income earners.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* KEY BENEFITS */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>⭐</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Key Benefits</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Why you need this</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                                        {[
                                            { t: '₹2 Lakh Life Cover', d: 'Full payout to nominee', i: '💰' },
                                            { t: 'Ultra Low Premium', d: 'Just ₹436 per year', i: '💎' },
                                            { t: 'Auto-Renewal', d: 'Renews via bank link', i: '🔄' },
                                            { t: 'Govt. Backed', d: '100% secure scheme', i: '🏛️' },
                                        ].map((item, idx) => (
                                            <View key={idx} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                                <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.i}</Text>
                                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>{item.t}</Text>
                                                <Text style={{ fontSize: 11, color: '#64748B' }}>{item.d}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* HOW TO APPLY & TUTORIAL (Unified Card) */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>📋</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>How to Apply & Tutorial</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Watch the video & follow steps</Text>
                                    </View>
                                </View>

                                {/* Video First inside the same card boundary */}
                                <TouchableOpacity onPress={() => openWebView('https://www.youtube.com/results?search_query=how+to+apply+for+pmjjby')}>
                                    <View style={{ height: 160, backgroundColor: '#0A2463' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' }}>
                                                <Ionicons name="play" size={24} color="white" style={{ marginLeft: 4 }} />
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ padding: 16, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#E11D48', marginBottom: 4 }}>TUTORIAL VIDEO</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>How to Apply for PMJJBY</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>3:25 · Step-by-Step Guide</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Steps Underneath */}
                                <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: 'white' }}>

                                    {/* METHOD SWITCHER */}
                                    <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', margin: 16, borderRadius: 12, padding: 4 }}>
                                        <TouchableOpacity
                                            style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'offline' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                            onPress={() => setApplyMethod('offline')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'offline' ? '#1E88E5' : '#64748B' }}>In Bank (Offline)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'online' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                            onPress={() => setApplyMethod('online')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'online' ? '#1E88E5' : '#64748B' }}>Online / App</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.pmsbyStepsList, { paddingHorizontal: 20, paddingBottom: 20 }]}>
                                        {(applyMethod === 'offline' ? steps : onlineSteps).map((step, idx, arr) => (
                                            <View key={step.id} style={styles.pmsbyStepItem}>
                                                <View style={styles.pmsbyStepLeft}>
                                                    <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.pmsbyStepNum}>
                                                        <Text style={styles.pmsbyStepNumText}>{step.id}</Text>
                                                    </LinearGradient>
                                                    {idx !== arr.length - 1 && <View style={styles.pmsbyStepLine} />}
                                                </View>
                                                <View style={styles.pmsbyStepContent}>
                                                    <Text style={styles.pmsbyStepTitle}>{step.title}</Text>
                                                    <Text style={styles.pmsbyStepDesc}>{step.desc}</Text>
                                                    {applyMethod === 'online' && step.id === 1 && (
                                                        <TouchableOpacity
                                                            style={{ marginTop: 10, backgroundColor: '#F0F9FF', borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E88E5', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                                            onPress={() => openWebView('https://netbanking.hdfcbank.com/netbanking/')}
                                                        >
                                                            <Ionicons name="desktop-outline" size={16} color="#1E88E5" />
                                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5' }}>Apply via HDFC Bank PMJJBY</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* DOCUMENTS REQUIRED */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>📄</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Documents Required</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Keep these ready</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16, gap: 12 }}>
                                    {[
                                        { t: 'Aadhaar Card', s: 'Original + photocopy', i: '🪪' },
                                        { t: 'Bank Passbook', s: 'Savings account details', i: '🏦' },
                                        { t: 'Mobile Number', s: 'Linked with Aadhaar', i: '📱' },
                                        { t: 'Nominee Details', s: 'Name & relation', i: '👤' },
                                    ].map((doc, idx) => (
                                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 }}>
                                                <Text style={{ fontSize: 18 }}>{doc.i}</Text>
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0A2463' }}>{doc.t}</Text>
                                                <Text style={{ fontSize: 12, color: '#64748B' }}>{doc.s}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* BANK LOCATOR CARD */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>🏦</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Need Help Applying?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Visit Nearby Bank</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 20 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 20 }}>
                                        Apply easily at your nearest bank branch.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#1E88E5', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onPress={() => Linking.openURL('https://www.google.com/maps/search/bank+near+me')}
                                    >
                                        <Ionicons name="location" size={18} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Find Nearby Bank</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* TRUCKMITR HELPLINE ALIGNED TO PMSBY */}
                        <View style={{ paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: '#F0F9FF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0F2FE' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0A2463' }}>📞 Contact & Support</Text>
                                </View>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }} onPress={() => Linking.openURL('tel:18001024558')}>
                                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name="call" size={20} color="#1E88E5" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>TruckMitr Helpline</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E88E5', marginBottom: 2 }}>1800 102 4558</Text>
                                        <Text style={{ fontSize: 11, color: '#64748B' }}>Toll Free · Mon–Sat 9AM–6PM</Text>
                                    </View>
                                    <Text style={{ fontSize: 24, color: '#94A3B8', fontWeight: '300', marginTop: -2 }}>›</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </ScrollView>

                {/* STICKY BOTTOM */}
                <View style={styles.pmsbyStickyCta}>
                    <TouchableOpacity style={styles.pmsbyStickyBtn} onPress={() => openWebView('https://netbanking.hdfcbank.com/netbanking/')}>
                        <Ionicons name="document-text-outline" size={18} color="white" />
                        <Text style={styles.pmsbyStickyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                </View>

                {/* WebView Modal */}
                <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top }]}>
                            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.wvBarBackNew}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}>
                                <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrl.replace('https://', '')}</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView
                            source={{ uri: webViewUrl }}
                            style={styles.flex1}
                            startInLoadingState
                            renderLoading={() => <View style={styles.wvBodyNew}><Text style={{ color: '#0b1d3a' }}>Loading official portal...</Text></View>}
                        />
                    </View>
                </Modal>
            </View>
        );
    };

    // PM Shram Yogi Detail View
    const PMShramYogiDetailView = () => {
        const [showWebView, setShowWebView] = useState(false);
        const [webViewUrl, setWebViewUrl] = useState('');
        const [activeFaq, setActiveFaq] = useState<number | null>(null);
        const [showApplyModal, setShowApplyModal] = useState(false);
        const [applyMethod, setApplyMethod] = useState<'offline' | 'online'>('offline');

        const openWebView = (url: string) => {
            setWebViewUrl(url);
            setShowWebView(true);
        };

        const toggleFaq = (idx: number) => {
            setActiveFaq(activeFaq === idx ? null : idx);
        };

        const faqs = [
            { q: 'Can truck drivers apply for PM-SYM?', a: 'Yes! Truck drivers, auto drivers, and all unorganised sector workers earning below ₹15,000/month and aged 18–40 are fully eligible.' },
            { q: 'What if I miss a monthly payment?', a: 'Your account is suspended if payment is missed. You can reactivate it by paying dues + penalty.' },
            { q: 'What does the govt contribute?', a: 'The government deposits an equal matching amount.' },
            { q: 'Is PMJJBY and PM-SYM different?', a: 'Yes. PMJJBY is life insurance. PM-SYM is a pension scheme.' },
        ];

        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                    {/* HERO SECTION - LIGHT BLUE */}
                    <View style={styles.pmsbyHeroSection}>
                        <LinearGradient colors={['#F0F9FF', '#E3F0FF']} style={[styles.pmsbyHeroGradient, { paddingBottom: 20 }]}>
                            {/* Decorative Blobs */}
                            <View style={[styles.heroBlob, { backgroundColor: 'rgba(30,136,229,0.06)' }]} />
                            <View style={[styles.heroBlob2, { backgroundColor: 'rgba(30,136,229,0.04)' }]} />

                            <View style={[styles.flexRow, { justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 0, alignItems: 'flex-start' }]}>
                                <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                    <Ionicons name="arrow-back" size={20} color="#0A2463" />
                                </TouchableOpacity>
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                    <View style={[styles.pmsbyGovTagDirect, { marginTop: 0 }]}>
                                        <Text style={styles.pmsbyGovTagTextDirect}>GOVERNMENT OF INDIA SCHEME</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setIsMuted(!isMuted)}
                                        style={styles.voiceToggleBtn}
                                    >
                                        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pmsbyHeroDirectBody}>
                                <View style={[styles.flexRow, { gap: 14, marginBottom: 8, marginTop: -20 }]}>
                                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
                                        <Text style={{ fontSize: 28 }}>💰</Text>
                                    </View>
                                    <Text style={[styles.pmsbyHeroTitleDirect, { marginBottom: 0 }]}>PM-SYM{'\n'}Pension Scheme</Text>
                                </View>
                                <Text style={styles.pmsbyHeroSubDirect}>Secure Your Old Age Income</Text>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>₹3,000</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Monthly</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>₹55</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Min/Month</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>18-40</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Age Limit</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={{ backgroundColor: '#1E88E5', padding: 14, borderRadius: 12, alignItems: 'center' }} onPress={() => openWebView('https://maandhan.in/')}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: 'white' }}>Apply Now</Text>
                                        <Ionicons name="arrow-forward" size={16} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* FLAT CARDS CONTENT */}
                    <View style={{ paddingTop: 24, paddingBottom: 100 }}>

                        {/* WHY PREFER PM-SYM */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>⭐</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Why Join PM-SYM?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Secure your future today</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                    {[
                                        { t: '₹3,000/Mo', d: 'Guaranteed post-60', i: '💰' },
                                        { t: 'Govt Match', d: 'Equal govt funding', i: '🤝' },
                                        { t: 'Starts ₹55', d: 'Affordable premiums', i: '💎' },
                                        { t: 'Family Safe', d: 'Spouse pensions', i: '💑' },
                                    ].map((item, idx) => (
                                        <View key={idx} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.i}</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>{item.t}</Text>
                                            <Text style={{ fontSize: 11, color: '#64748B' }}>{item.d}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* HOW TO APPLY & TUTORIAL (Unified Card) */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>📋</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>How to Apply & Tutorial</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Watch the video & follow steps</Text>
                                    </View>
                                </View>

                                {/* Video First inside the same card boundary */}
                                <TouchableOpacity onPress={() => openWebView('https://www.youtube.com/results?search_query=how+to+apply+for+pm+shram+yogi')}>
                                    <View style={{ height: 160, backgroundColor: '#0A2463' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' }}>
                                                <Ionicons name="play" size={24} color="white" style={{ marginLeft: 4 }} />
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ padding: 16, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#E11D48', marginBottom: 4 }}>TUTORIAL VIDEO</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>How to Apply for PM-SYM</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>4:12 · Step-by-Step Guide</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Steps Underneath */}
                                <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: 'white' }}>

                                    {/* METHOD SWITCHER */}
                                    <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', margin: 16, borderRadius: 12, padding: 4 }}>
                                        <TouchableOpacity
                                            style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'offline' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                            onPress={() => setApplyMethod('offline')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'offline' ? '#1E88E5' : '#64748B' }}>In CSC Center (Offline)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, applyMethod === 'online' && { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }]}
                                            onPress={() => setApplyMethod('online')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'online' ? '#1E88E5' : '#64748B' }}>Online / Portal</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.pmsbyStepsList, { paddingHorizontal: 20, paddingBottom: 20 }]}>
                                        {(applyMethod === 'offline' ? [
                                            { id: 1, title: 'Check Eligibility', desc: 'Age 18-40, income <₹15K.' },
                                            { id: 2, title: 'Visit CSC Center', desc: 'Find your nearest Common Service Centre.' },
                                            { id: 3, title: 'Fill Form', desc: 'Provide Aadhaar & bank details.' },
                                            { id: 4, title: 'Setup Auto-Debit', desc: 'Automatically deducts required monthly amount.' },
                                            { id: 5, title: 'Get PM-SYM Card', desc: 'Pension account created successfully!' }
                                        ] : [
                                            { id: 1, title: 'Click "Apply Now"', desc: 'Start application on Maandhan portal' },
                                            { id: 2, title: 'Select "Self Enrollment"', desc: 'Choose to apply by yourself' },
                                            { id: 3, title: 'Verify Mobile Number', desc: 'Enter OTP for verification' },
                                            { id: 4, title: 'Enter Aadhaar & Bank Details', desc: 'Details auto-fill + add bank account' },
                                            { id: 5, title: 'Choose Contribution & Consent', desc: 'Select monthly amount and allow auto-debit' },
                                            { id: 6, title: 'Submit Application', desc: 'Review details and download PM-SYM card' }
                                        ]).map((step, idx, arr) => (
                                            <View key={step.id} style={styles.pmsbyStepItem}>
                                                <View style={styles.pmsbyStepLeft}>
                                                    <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.pmsbyStepNum}>
                                                        <Text style={styles.pmsbyStepNumText}>{step.id}</Text>
                                                    </LinearGradient>
                                                    {idx !== arr.length - 1 && <View style={styles.pmsbyStepLine} />}
                                                </View>
                                                <View style={styles.pmsbyStepContent}>
                                                    <Text style={styles.pmsbyStepTitle}>{step.title}</Text>
                                                    <Text style={styles.pmsbyStepDesc}>{step.desc}</Text>
                                                    {applyMethod === 'online' && step.id === 1 && (
                                                        <TouchableOpacity
                                                            style={{ marginTop: 10, backgroundColor: '#F0F9FF', borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E88E5', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                                            onPress={() => openWebView('https://maandhan.in/')}
                                                        >
                                                            <Ionicons name="desktop-outline" size={16} color="#1E88E5" />
                                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5' }}>Open Maandhan Portal</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* NEED HELP APPLYING (CSC LOCATOR) */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18 }}>📱</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Need Help Applying?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Visit your nearest center</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 20 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 20 }}>
                                        Visit your nearest CSC center for easy setup and enrollment guidance.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#1E88E5', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onPress={() => Linking.openURL('https://www.google.com/maps/search/CSC+center+near+me')}
                                    >
                                        <Ionicons name="location" size={18} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Find Nearby CSC</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* TRUCKMITR HELPLINE ALIGNED TO PMSBY */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: '#F0F9FF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0F2FE' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0A2463' }}>📞 Contact & Support</Text>
                                </View>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }} onPress={() => Linking.openURL('tel:18001024558')}>
                                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name="call" size={20} color="#1E88E5" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463', marginBottom: 2 }}>TruckMitr Helpline</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E88E5', marginBottom: 2 }}>1800 102 4558</Text>
                                        <Text style={{ fontSize: 11, color: '#64748B' }}>Toll Free · Mon–Sat 9AM–6PM</Text>
                                    </View>
                                    <Text style={{ fontSize: 24, color: '#94A3B8', fontWeight: '300', marginTop: -2 }}>›</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </ScrollView>

                {/* STICKY BOTTOM */}
                <View style={styles.pmsbyStickyCta}>
                    <TouchableOpacity style={styles.pmsbyStickyBtn} onPress={() => openWebView('https://maandhan.in/')}>
                        <Ionicons name="document-text-outline" size={18} color="white" />
                        <Text style={styles.pmsbyStickyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                </View>

                {/* APPLY MODAL (Light version) */}
                <Modal visible={showApplyModal} transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 40, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 24, borderRadius: 2 }} />
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0A2463', marginBottom: 6 }}>Choose How to Apply</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Select the option that works best for you</Text>

                            <View style={{ gap: 12 }}>
                                <TouchableOpacity style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => { setShowApplyModal(false); openWebView('https://maandhan.in/'); }}>
                                    <View style={{ width: 46, height: 46, backgroundColor: '#FFF7ED', borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 20 }}>🌐</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463' }}>Official Maandhan Portal</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Government's official website</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                <TouchableOpacity style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => { setShowApplyModal(false); Linking.openURL('https://www.google.com/maps/search/CSC+center+near+me'); }}>
                                    <View style={{ width: 46, height: 46, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 20 }}>📍</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463' }}>Common Service Centre</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Find nearest CSC on Maps</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                <TouchableOpacity style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => setShowApplyModal(false)}>
                                    <View style={{ width: 46, height: 46, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 20 }}>🧑💼</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A2463' }}>TruckMitr Agent Help</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Free guided registration</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setShowApplyModal(false)} style={{ marginTop: 24, alignItems: 'center', padding: 12 }}>
                                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 15 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* WebView */}
                <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top }]}>
                            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.wvBarBackNew}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}>
                                <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrl.replace('https://', '')}</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView source={{ uri: webViewUrl }} style={styles.flex1} startInLoadingState />
                    </View>
                </Modal>
            </View>
        );
    };

    // Atal Pension Yojana Detail View (Premium Update)
    const AtalPensionDetailView = () => {
        const [showWebView, setShowWebView] = useState(false);
        const [webViewUrl, setWebViewUrl] = useState('');
        const [isMuted, setIsMuted] = useState(true);
        const [applyMethod, setApplyMethod] = useState<'online' | 'offline'>('online');
        const soundRef = useRef<Sound | null>(null);

        useEffect(() => {
            soundRef.current = new Sound('atal_pension_desc.mp3', Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log('failed to load sound', error);
                }
            });

            return () => {
                if (soundRef.current) {
                    soundRef.current.stop();
                    soundRef.current.release();
                }
            };
        }, []);

        useEffect(() => {
            if (!isMuted) {
                if (soundRef.current && soundRef.current.isLoaded()) {
                    soundRef.current.play((success) => {
                        if (success) setIsMuted(true);
                    });
                }
            } else {
                if (soundRef.current && soundRef.current.isLoaded()) {
                    soundRef.current.stop();
                }
            }
        }, [isMuted]);

        const openWebView = (url: string) => {
            setWebViewUrl(url);
            setShowWebView(true);
        };

        return (
            <View style={styles.flex1}>
                {/* Scroll Area */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: '#FFFFFF' }}>

                    {/* HERO SECTION */}
                    <View style={styles.pmsbyHeroSection}>
                        <LinearGradient colors={['#F0F9FF', '#E3F0FF']} style={[styles.pmsbyHeroGradient, { paddingBottom: 20 }]}>
                            <View style={[styles.heroBlob, { backgroundColor: 'rgba(30,136,229,0.06)' }]} />
                            <View style={[styles.heroBlob2, { backgroundColor: 'rgba(30,136,229,0.04)' }]} />

                            <View style={[styles.flexRow, { justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 0, alignItems: 'flex-start' }]}>
                                <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                    <Ionicons name="arrow-back" size={20} color="#0A2463" />
                                </TouchableOpacity>
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                    <View style={[styles.pmsbyGovTagDirect, { marginTop: 0 }]}>
                                        <Text style={styles.pmsbyGovTagTextDirect}>GOVERNMENT VERIFIED SCHEME</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.voiceToggleBtn}>
                                        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pmsbyHeroDirectBody}>
                                <View style={[styles.flexRow, { gap: 14, marginBottom: 8, marginTop: -20 }]}>
                                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
                                        <Text style={{ fontSize: 28 }}>👴</Text>
                                    </View>
                                    <Text style={[styles.pmsbyHeroTitleDirect, { marginBottom: 0 }]}>Atal Pension{'\n'}Yojana</Text>
                                </View>
                                <Text style={styles.pmsbyHeroSubDirect}>Guaranteed pension for your golden years</Text>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>₹1K–5K</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Monthly Pension</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>18–40</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Age Limit</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>60 Yrs</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Benefit Age</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.pmsbyHeroApplyBtn} onPress={() => openWebView('https://enps.nps-proteantech.in/eNPS/ApySubRegistration.html')}>
                                    <Ionicons name="rocket-outline" size={18} color="white" />
                                    <Text style={styles.pmsbyHeroApplyBtnText}>Apply Now</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* CONTENT PART */}
                    <View style={{ paddingTop: 24, paddingBottom: 60 }}>
                        {/* WHAT IS APY? */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>📖</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>What is APY?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>A quick overview</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                                        Atal Pension Yojana (APY) is a <Text style={{ fontWeight: '700' }}>government-backed pension scheme</Text> for Indian citizens. By saving small amounts monthly, you get a guaranteed pension of ₹1,000 to ₹5,000 per month after the age of 60.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* KEY BENEFITS */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>💎</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Key Benefits</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Why you need this</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                                    {[
                                        { t: 'Guaranteed Pension', i: '🛡️' },
                                        { t: 'Govt. Backed', i: '🏛️' },
                                        { t: 'Tax Benefits', i: '💰' },
                                        { t: 'Family Protection', i: '👨‍👩‍👧' },
                                    ].map((item, idx) => (
                                        <View key={idx} style={{ width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.i}</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0A2463' }}>{item.t}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* ELIGIBILITY */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#dcfce7', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>✅</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Are you eligible?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Minimum criteria</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    {[
                                        'Indian citizen aged 18–40 years',
                                        'Have a savings bank account',
                                        'Not an income tax payer',
                                        'Not a member of EPF/ESI/NPS'
                                    ].map((item, idx) => (
                                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                            <Text style={{ fontSize: 14, color: '#4A5C82', flex: 1 }}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* HOW TO APPLY & TUTORIALS */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>📋</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>How to Apply</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Tutorial & step-by-step guide</Text>
                                    </View>
                                </View>

                                {/* TUTORIAL VIDEO FIRST */}
                                <View style={{ padding: 16, paddingBottom: 0 }}>
                                    <TouchableOpacity style={{ width: '100%', backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 }} onPress={() => openWebView('https://www.youtube.com/results?search_query=how+to+apply+for+atal+pension+yojana')}>
                                        <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 36, position: 'absolute' }}>🎯</Text>
                                            <View style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
                                                <Ionicons name="play" size={20} color="#0A2463" style={{ marginLeft: 2 }} />
                                            </View>
                                        </LinearGradient>
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463', marginBottom: 4 }}>APY Explained properly</Text>
                                            <Text style={{ fontSize: 11, color: '#64748B' }}>5:32 min · Watch tutorial</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: 'white' }}>
                                    {/* Tabs */}
                                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: applyMethod === 'online' ? '#1E88E5' : 'transparent' }}
                                            onPress={() => setApplyMethod('online')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'online' ? '#1E88E5' : '#64748B' }}>💻 Apply Online</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: applyMethod === 'offline' ? '#1E88E5' : 'transparent' }}
                                            onPress={() => setApplyMethod('offline')}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: applyMethod === 'offline' ? '#1E88E5' : '#64748B' }}>🏦 Apply Offline</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Tab Content */}
                                    <View style={{ padding: 20 }}>
                                        {applyMethod === 'online' ? (
                                            <View style={styles.pmsbyStepsList}>
                                                {[
                                                    { id: 1, title: 'Login to your Bank App / Net Banking', desc: 'Use your account credentials.' },
                                                    { id: 2, title: 'Go to "Government Schemes" / "Social Security"', desc: 'Find pension section.' },
                                                    { id: 3, title: 'Select "Atal Pension Yojana (APY)"', desc: 'Open APY enrollment.' },
                                                    { id: 4, title: 'Enter Details', desc: 'Aadhaar, nominee, age, pension amount.' },
                                                    { id: 5, title: 'Choose Pension Plan', desc: '₹1000 / ₹2000 / ₹3000 / ₹4000 / ₹5000 per month.' },
                                                    { id: 6, title: 'Confirm Auto-Debit', desc: 'Monthly contribution will be deducted.' },
                                                    { id: 7, title: 'Submit Application', desc: 'APY account gets activated.' }
                                                ].map((step, idx, arr) => (
                                                    <View key={step.id} style={styles.pmsbyStepItem}>
                                                        <View style={styles.pmsbyStepLeft}>
                                                            <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.pmsbyStepNum}>
                                                                <Text style={styles.pmsbyStepNumText}>{step.id}</Text>
                                                            </LinearGradient>
                                                            {idx !== arr.length - 1 && <View style={styles.pmsbyStepLine} />}
                                                        </View>
                                                        <View style={styles.pmsbyStepContent}>
                                                            <Text style={styles.pmsbyStepTitle}>{step.title}</Text>
                                                            <Text style={styles.pmsbyStepDesc}>{step.desc}</Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <View style={styles.pmsbyStepsList}>
                                                {[
                                                    { id: 1, title: 'Visit Your Bank Branch', desc: 'Go to any bank where you have a savings account.' },
                                                    { id: 2, title: 'Fill APY Form', desc: 'Collect & complete the APY enrollment form.' },
                                                    { id: 3, title: 'Submit Documents', desc: 'Provide Aadhaar, mobile number & bank passbook.' },
                                                    { id: 4, title: 'Choose Pension', desc: 'Select ₹1,000 to ₹5,000 monthly target.' }
                                                ].map((step, idx, arr) => (
                                                    <View key={step.id} style={styles.pmsbyStepItem}>
                                                        <View style={styles.pmsbyStepLeft}>
                                                            <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.pmsbyStepNum}>
                                                                <Text style={styles.pmsbyStepNumText}>{step.id}</Text>
                                                            </LinearGradient>
                                                            {idx !== arr.length - 1 && <View style={styles.pmsbyStepLine} />}
                                                        </View>
                                                        <View style={styles.pmsbyStepContent}>
                                                            <Text style={styles.pmsbyStepTitle}>{step.title}</Text>
                                                            <Text style={styles.pmsbyStepDesc}>{step.desc}</Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* NEED HELP APPLYING? — NEARBY BANK */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#FEF3C7', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🏦</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Need Help Applying?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Visit nearest bank branch</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 }}>
                                        Apply easily at your nearest bank branch. Carry your <Text style={{ fontWeight: '700' }}>Aadhaar card</Text>, <Text style={{ fontWeight: '700' }}>bank passbook</Text>, and <Text style={{ fontWeight: '700' }}>mobile number</Text> for quick enrollment.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onPress={() => Linking.openURL('https://www.google.com/maps/search/bank+near+me')}
                                    >
                                        <Ionicons name="location" size={18} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Find Nearby Bank</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>Opens Google Maps · bank near me</Text>
                                </View>
                            </View>
                        </View>

                        {/* HELPLINE */}
                        <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F9FF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' }}
                                onPress={() => Linking.openURL('tel:18001024558')}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="call" size={18} color="#1E88E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463' }}>TruckMitr Helpline</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E88E5' }}>1800 102 4558</Text>
                                    <Text style={{ fontSize: 10, color: '#64748B' }}>Toll Free · Mon–Sat 9AM–6PM</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* BOTTOM FIX CTA */}
                <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <TouchableOpacity style={{ backgroundColor: '#2563eb', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }} onPress={() => openWebView('https://enps.nps-proteantech.in/eNPS/ApySubRegistration.html')}>
                        <Text style={{ fontSize: 16 }}>🚀</Text>
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Apply Now</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top, backgroundColor: '#0f2447' }]}>
                            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.wvBarBackNew}><Ionicons name="close" size={24} color="white" /></TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}><Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" /><Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrl.replace('https://', '')}</Text></View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView source={{ uri: webViewUrl }} style={styles.flex1} startInLoadingState renderLoading={() => <View style={styles.wvBodyNew}><Text>Loading...</Text></View>} />
                    </View>
                </Modal>
            </View>
        );
    };

    /* APNA GHAR — COMMENTED OUT
    const ApnaGharDetailView = () => {
        return (
            <View style={styles.flex1}>
                <View style={[styles.pmsbyNavBar, { paddingTop: insets.top, backgroundColor: '#EA580C' }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.pmsbyBackBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.pmsbyNavTitle}>{t('driverWelfare.apnaghar.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: '#FFF7ED' }}>
                    <LinearGradient colors={['#EA580C', '#F97316', '#FB923C']} style={styles.pmsbyHero}>
                        <View style={styles.pmsbyHeroCard}>
                            <View style={styles.pmsbyShieldWrap}><Text style={{ fontSize: 32 }}>🏠</Text></View>
                            <Text style={styles.pmsbyHeroTitle}>{t('driverWelfare.apnaghar.title')}</Text>
                            <Text style={styles.pmsbyHeroSub}>{t('driverWelfare.apnaghar.subtitle')}</Text>
                            <TouchableOpacity style={[styles.pmsbyHeroCta, { backgroundColor: '#FFFFFF' }]} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={[styles.pmsbyHeroCtaText, { color: '#EA580C' }]}>📞 {t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbySecHead}>
                            <View style={styles.pmsbySecIcon}><Text>📖</Text></View>
                            <Text style={styles.pmsbySecTitle}>{t('driverWelfare.apnaghar.whatIsItTitle')}</Text>
                        </View>
                        <View style={styles.pmsbyInfoCard}>
                            <Text style={styles.pmsbyInfoText}>{t('driverWelfare.apnaghar.whatIsItDesc')}</Text>
                        </View>
                    </View>
                    <View style={styles.pmsbySection}>
                        <View style={styles.pmsbySecHead}>
                            <View style={styles.pmsbySecIcon}><Text>🏠</Text></View>
                            <Text style={styles.pmsbySecTitle}>Facilities Provided</Text>
                        </View>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.apnaghar.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.pmsbyEligItem}>
                                    <Ionicons name="home" size={18} color="#F97316" />
                                    <Text style={[styles.pmsbyInfoText, { flex: 1, marginLeft: 10 }]}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.pmsbySection}>
                        <View style={[styles.pmsbyContactCard, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' }]}>
                            <Text style={[styles.pmsbyContactTitle, { color: '#9A3412' }]}>{t('driverWelfare.apnaghar.whyImportantTitle')}</Text>
                            <Text style={[styles.pmsbyContactDesc, { color: '#C2410C' }]}>{t('driverWelfare.apnaghar.whyImportantDesc')}</Text>
                        </View>
                    </View>
                </ScrollView>
                <View style={[styles.pmsbyStickyCta, { borderTopColor: '#FFEDD5' }]}>
                    <TouchableOpacity style={[styles.pmsbyStickyBtn, { backgroundColor: '#EA580C' }]} onPress={() => Linking.openURL('tel:18001024558')}>
                        <Text style={styles.pmsbyStickyBtnText}>📞 {t('driverWelfare.callTruckMitr')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
    END APNA GHAR COMMENT */

    // Driver Rest Facilities Detail View (Premium Redesign)
    const DriverRestFacilitiesDetailView = () => {
        const [showWebViewDR, setShowWebViewDR] = useState(false);
        const [webViewUrlDR, setWebViewUrlDR] = useState('');
        const [isMuted, setIsMuted] = useState(true);
        const soundRef = useRef<Sound | null>(null);

        useEffect(() => {
            soundRef.current = new Sound('driver_rest_facilities.mp3', Sound.MAIN_BUNDLE, (error) => {
                if (error) console.log('failed to load sound DR', error);
            });
            return () => {
                if (soundRef.current) {
                    soundRef.current.stop();
                    soundRef.current.release();
                }
            };
        }, []);

        useEffect(() => {
            if (!isMuted) {
                if (soundRef.current && soundRef.current.isLoaded()) {
                    soundRef.current.play((success) => {
                        if (success) setIsMuted(true);
                    });
                }
            } else {
                if (soundRef.current && soundRef.current.isLoaded()) {
                    soundRef.current.stop();
                }
            }
        }, [isMuted]);

        const openDRWebView = (url: string) => { setWebViewUrlDR(url); setShowWebViewDR(true); };

        const facilities = [
            { icon: '🛏️', label: 'Rest Rooms', tag: 'Available' },
            { icon: '💧', label: 'Clean Water', tag: 'Available' },
            { icon: '🚿', label: 'Shower & Toilet', tag: 'Available' },
            { icon: '🏥', label: 'Medical Help', tag: 'Available' },
            { icon: '🍽️', label: 'Canteen & Food', tag: 'Available' },
            { icon: '📶', label: 'Free Wi-Fi', tag: 'Available' },
            { icon: '🚛', label: 'Truck Parking', tag: 'Available' },
            { icon: '🆘', label: 'Emergency Support', tag: '24/7' },
        ];
        const howToSteps = [
            { id: 1, title: 'Find Nearest Center', desc: 'Use the map to locate available centers on your route.' },
            { id: 2, title: 'Register at Entry', desc: "Show your driver's licence & vehicle number at the gate." },
            { id: 3, title: 'Get Rest Token', desc: 'Receive a token for bed allocation & parking slot.' },
            { id: 4, title: 'Use Facilities', desc: 'Rest, shower, eat at canteen — all basic facilities free.' },
            { id: 5, title: 'Check Out & Continue', desc: 'Return token, collect vehicle & continue your journey safely.' },
        ];
        const safetyTips = [
            { icon: '😴', title: 'Rest every 4 hours', desc: 'Take at least 30 min rest after every 4 hours of driving.' },
            { icon: '💧', title: 'Stay Hydrated', desc: 'Drink 2–3 litres of water daily to maintain alertness.' },
            { icon: '🌙', title: 'Avoid Driving After Midnight', desc: 'Most accidents happen between 12 AM–4 AM.' },
            { icon: '🆘', title: 'Know Emergency Numbers', desc: 'Save highway helpline 1033 before your journey.' },
        ];
        const emergencyNumbers = [
            { icon: '🛣️', title: 'Highway Helpline', num: '1033' },
            { icon: '🚑', title: 'Ambulance', num: '108' },
            { icon: '👮', title: 'Police', num: '100' },
            { icon: '🚛', title: 'TruckMitr Help', num: '1800-102-4558' },
        ];

        return (
            <View style={styles.flex1}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: '#FFFFFF' }}>

                    {/* HERO — Light Blue like other screens */}
                    <View style={styles.pmsbyHeroSection}>
                        <LinearGradient colors={['#F0F9FF', '#E3F0FF']} style={[styles.pmsbyHeroGradient, { paddingBottom: 20 }]}>
                            <View style={[styles.heroBlob, { backgroundColor: 'rgba(30,136,229,0.06)' }]} />
                            <View style={[styles.heroBlob2, { backgroundColor: 'rgba(30,136,229,0.04)' }]} />

                            <View style={[styles.flexRow, { justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 0, alignItems: 'flex-start' }]}>
                                <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.backBtnNew}>
                                    <Ionicons name="arrow-back" size={20} color="#0A2463" />
                                </TouchableOpacity>
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                    <View style={[styles.pmsbyGovTagDirect, { marginTop: 0 }]}>
                                        <Text style={styles.pmsbyGovTagTextDirect}>GOVERNMENT INITIATIVE</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.voiceToggleBtn}>
                                        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.pmsbyHeroDirectBody, { marginTop: 16 }]}>
                                <View style={[styles.flexRow, { gap: 14, marginBottom: 8, marginTop: -10 }]}>
                                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
                                        <Text style={{ fontSize: 28 }}>🛏️</Text>
                                    </View>
                                    <Text style={[styles.pmsbyHeroTitleDirect, { marginBottom: 0 }]}>Driver Rest{'\n'}Facility</Text>
                                </View>
                                <Text style={styles.pmsbyHeroSubDirect}>Government-backed rest centers for truck drivers along national highways</Text>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>2,400+</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Centers</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>Free</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Basic Facilities</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E3F0FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                                        <Text style={{ color: '#0A2463', fontWeight: '800', fontSize: 16 }}>24/7</Text>
                                        <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>Open Always</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.pmsbyHeroApplyBtn} onPress={() => Linking.openURL('https://www.google.com/maps/search/truck+rest+area+near+me')}>
                                    <Ionicons name="location-outline" size={18} color="white" />
                                    <Text style={styles.pmsbyHeroApplyBtnText}>Find Rest Center Near Me</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* CONTENT */}
                    <View style={{ paddingTop: 24, paddingBottom: 60 }}>

                        {/* WHAT IS IT? */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#F0F9FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>📖</Text></View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>What is it?</Text>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>Driver Rest Facilities are <Text style={{ fontWeight: '700' }}>government-supported rest centers</Text> specially built for truck and commercial vehicle drivers. Located along national highways, these centers provide a safe place to rest, refresh, and recover during long-haul drives — reducing fatigue and road accidents across India.</Text>
                                </View>
                            </View>
                        </View>

                        {/* FACILITIES */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#F0F9FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🏨</Text></View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Available Facilities</Text>
                                </View>
                                <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                                    {facilities.map((f, idx) => (
                                        <View key={idx} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                            <Text style={{ fontSize: 24 }}>{f.icon}</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#0A2463', textAlign: 'center' }}>{f.label}</Text>
                                            <View style={{ backgroundColor: '#dcfce7', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#166534' }}>{f.tag}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* NEED REST DURING JOURNEY? — Nearby Card */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#FEF3C7', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🚛</Text></View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Need Rest During Journey?</Text>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>Driver Rest Facility</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 }}>
                                        Find safe places to rest, park, and refresh during your journey
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onPress={() => Linking.openURL('https://www.google.com/maps/search/truck+rest+area+near+me')}
                                    >
                                        <Ionicons name="location" size={18} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Find Nearby Rest Stops</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>Opens Google Maps · truck rest area near me</Text>
                                </View>
                            </View>
                        </View>

                        {/* HOW TO USE — Video + Steps */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#F0F9FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>📋</Text></View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>How to Use a Rest Center</Text>
                                </View>

                                {/* Video Tutorial */}
                                <TouchableOpacity style={{ margin: 12, borderRadius: 16, overflow: 'hidden' }} onPress={() => openDRWebView('https://www.youtube.com/results?search_query=driver+rest+facility+india')}>
                                    <LinearGradient colors={['#0A2463', '#1E40AF']} style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' }}>
                                            <Ionicons name="play" size={24} color="white" />
                                        </View>
                                    </LinearGradient>
                                    <View style={{ padding: 14 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463', marginBottom: 4 }}>Driver Rest Facilities Explained</Text>
                                        <Text style={{ fontSize: 11, color: '#64748B' }}>5:32 min · Watch tutorial</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Steps */}
                                <View style={{ padding: 20 }}>
                                    <View style={styles.pmsbyStepsList}>
                                        {howToSteps.map((step, idx, arr) => (
                                            <View key={step.id} style={styles.pmsbyStepItem}>
                                                <View style={styles.pmsbyStepLeft}>
                                                    <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.pmsbyStepNum}><Text style={styles.pmsbyStepNumText}>{step.id}</Text></LinearGradient>
                                                    {idx !== arr.length - 1 && <View style={styles.pmsbyStepLine} />}
                                                </View>
                                                <View style={styles.pmsbyStepContent}><Text style={styles.pmsbyStepTitle}>{step.title}</Text><Text style={styles.pmsbyStepDesc}>{step.desc}</Text></View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* SAFETY TIPS */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#F0F9FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🛡️</Text></View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Driver Safety Tips</Text>
                                </View>
                                <View style={{ padding: 12 }}>
                                    {safetyTips.map((tip, idx) => (
                                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 }}>
                                            <View style={{ width: 36, height: 36, backgroundColor: '#F0F9FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 17 }}>{tip.icon}</Text></View>
                                            <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: '600', color: '#0A2463' }}>{tip.title}</Text><Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{tip.desc}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* EMERGENCY NUMBERS */}
                        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🆘</Text></View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A2463' }}>Emergency Numbers</Text>
                                </View>
                                <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                                    {emergencyNumbers.map((e, idx) => (
                                        <TouchableOpacity key={idx} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }} onPress={() => Linking.openURL(`tel:${e.num.replace(/-/g, '')}`)}>
                                            <Text style={{ fontSize: 26, marginBottom: 6 }}>{e.icon}</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0A2463', textAlign: 'center' }}>{e.title}</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2563EB', marginTop: 2 }}>{e.num}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* HELPLINE — Compact row like other screens */}
                        <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' }}
                                onPress={() => Linking.openURL('tel:18001024558')}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="call" size={18} color="#1E88E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0A2463' }}>TruckMitr Helpline</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E88E5' }}>1800 102 4558</Text>
                                    <Text style={{ fontSize: 10, color: '#64748B' }}>Toll Free · Mon–Sat 9AM–6PM</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* BOTTOM CTA */}
                <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <TouchableOpacity style={{ backgroundColor: '#2563eb', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }} onPress={() => Linking.openURL('https://www.google.com/maps/search/truck+rest+area+near+me')}>
                        <Text style={{ fontSize: 16 }}>📍</Text>
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Find Rest Center Near Me</Text>
                    </TouchableOpacity>
                </View>

                {/* WEBVIEW */}
                <Modal visible={showWebViewDR} animationType="slide" onRequestClose={() => setShowWebViewDR(false)} presentationStyle="fullScreen" statusBarTranslucent={true} transparent={false}>
                    <View style={styles.flex1}>
                        <View style={[styles.webViewHeaderNew, { paddingTop: insets.top, backgroundColor: '#0f2447' }]}>
                            <TouchableOpacity onPress={() => setShowWebViewDR(false)} style={styles.wvBarBackNew}><Ionicons name="close" size={24} color="white" /></TouchableOpacity>
                            <View style={styles.wvUrlBoxNew}><Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.5)" /><Text style={styles.wvUrlTextNew} numberOfLines={1}>{webViewUrlDR.replace('https://', '')}</Text></View>
                            <View style={{ width: 44 }} />
                        </View>
                        <WebView source={{ uri: webViewUrlDR }} style={styles.flex1} startInLoadingState renderLoading={() => <View style={styles.wvBodyNew}><Text>Loading...</Text></View>} />
                    </View>
                </Modal>
            </View>
        );
    };

    const SchemeDetailScreen = () => {
        const AUDIO_MAP: { [key: string]: any } = {
            ayushman: require('../../../../assets/voice/driver_walefare/ayushman_bharat.mp3'),
            pmsby: require('../../../../assets/voice/driver_walefare/PMSBY.mp3'),
            pmjjby: require('../../../../assets/voice/driver_walefare/PMJJBY.mp3'),
            shramyogi: require('../../../../assets/voice/driver_walefare/tmsharam_yogi.mp3'),
            atal: require('../../../../assets/voice/driver_walefare/atal_pension.mp3'),
            apnaghar: require('../../../../assets/voice/driver_walefare/apna_ghar.mp3'),
            driver_rest: require('../../../../assets/voice/driver_walefare/driver_rest_facilities.mp3'),
        };

        useEffect(() => {
            if (selectedScheme && AUDIO_MAP[selectedScheme.id]) {
                const source = Image.resolveAssetSource(AUDIO_MAP[selectedScheme.id]);
                if (source && source.uri) {
                    const sound = new Sound(source.uri, undefined, (error: any) => {
                        if (error) {
                            console.log('Failed to load sound', error);
                            return;
                        }
                        soundRef.current = sound;
                        if (!isMuted) {
                            sound.play((success: boolean) => {
                                if (success) {
                                    console.log('successfully finished playing');
                                } else {
                                    console.log('playback failed due to audio decoding errors');
                                }
                            });
                        }
                    });
                }
            }

            return () => {
                if (soundRef.current) {
                    soundRef.current.stop();
                    soundRef.current.release();
                    soundRef.current = null;
                }
            };
        }, [selectedScheme]);

        useEffect(() => {
            if (soundRef.current) {
                if (isMuted) {
                    soundRef.current.stop();
                } else {
                    soundRef.current.play();
                }
            }
        }, [isMuted]);
        if (!selectedScheme) return null;

        if (selectedScheme.id === 'ayushman') return <AyushmanDetailView />;
        if (selectedScheme.id === 'pmsby') return <PMSBYDetailView />;
        if (selectedScheme.id === 'pmjjby') return <PMJJBYDetailView />;
        if (selectedScheme.id === 'shramyogi') return <PMShramYogiDetailView />;
        if (selectedScheme.id === 'atal') return <AtalPensionDetailView />;
        // if (selectedScheme.id === 'apnaghar') return <ApnaGharDetailView />; // COMMENTED OUT
        if (selectedScheme.id === 'driver_rest') return <DriverRestFacilitiesDetailView />;

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
                        <SectionTitle title={t('driverWelfare.detail.aboutScheme')} />
                        <Text style={styles.aboutText}>{selectedScheme.about}</Text>
                    </View>

                    {/* 4. What You Get */}
                    <View style={styles.cardSection}>
                        <SectionTitle title={t('driverWelfare.detail.whatYouGet')} />
                        {selectedScheme.benefits?.map((b: any, i: number) => (
                            <BenefitRow key={i} icon={b.icon} text={b.text} />
                        ))}
                    </View>

                    {/* 5. Who Can Apply */}
                    <View style={styles.cardSection}>
                        <SectionTitle title={t('driverWelfare.detail.whoCanApply')} />
                        {selectedScheme.eligibility?.map((e: string, i: number) => (
                            <EligibilityItem key={i} text={e} />
                        ))}
                    </View>

                    {/* 6. How It Works */}
                    <View style={styles.cardSection}>
                        <SectionTitle title={t('driverWelfare.detail.howItWorks')} />
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

    utilityImageContainer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '65%', zIndex: 0 },
    utilityImage: { width: '100%', height: '100%', opacity: 1, alignSelf: 'flex-end' },
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
    categoryTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A5F', marginBottom: 16, marginLeft: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 16 },
    aboutText: { fontSize: 14, color: '#444', lineHeight: 22 },

    benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    benefitIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    benefitRowText: { fontSize: 14, color: '#334155', flex: 1 },

    eligibilityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    eligibilityText: { fontSize: 14, color: '#334155', marginLeft: 10 },

    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    stepNumberCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    stepNumber: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
    stepRowText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 20 },

    ctaBottomContainer: { padding: 16, marginTop: 10 },
    mainCta: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    mainCtaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    secondaryCta: { height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    secondaryCtaText: { fontSize: 14, fontWeight: '600' },


    // SHARED PREMIUM COMPONENTS
    flexRow: { flexDirection: 'row', alignItems: 'center' },
    sectionContainer: { marginHorizontal: 16, marginBottom: 24 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    benefitsList: { gap: 12 },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    benefitText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    securityCard: { marginHorizontal: 16, marginBottom: 24, backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#D1FAE5' },
    securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    securityTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
    securityText: { fontSize: 13, color: '#064E3B', lineHeight: 20, marginBottom: 12 },
    stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -2 } },
    stickyPrimaryBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    stickyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // PMSBY PREMIUM DESIGN STYLES
    pmsbyNavBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, backgroundColor: '#0A2463' },
    pmsbyBackBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    pmsbyNavTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
    pmsbyShareBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    pmsbyHeroSection: { position: 'relative', overflow: 'hidden' },
    pmsbyHeroGradient: { paddingBottom: 40, paddingTop: 10 },
    pmsbyHeroDirectBody: { paddingHorizontal: 20 },
    pmsbyHeroDirectTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    pmsbyShieldBoxDirect: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    pmsbyGovTagDirect: { backgroundColor: '#1E40AF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    pmsbyGovTagTextDirect: { fontSize: 9, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
    pmsbyHeroTitleDirect: { fontSize: 28, fontWeight: '900', color: '#0A2463', lineHeight: 36, marginBottom: 8 },
    pmsbyHeroSubDirect: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 24, paddingRight: 40 },
    pmsbyHeroBenefitGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    pmsbyHeroBenPill: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    pmsbyHeroBenText: { fontSize: 13, fontWeight: '700', color: '#334155' },
    pmsbyHeroApplyBtn: { backgroundColor: '#2563EB', height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10 },
    pmsbyHeroApplyBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
    pmsbyHero: { paddingBottom: 30 },
    pmsbyHeroCard: { margin: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
    pmsbyShieldWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    pmsbyHeroTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
    pmsbyHeroTagText: { color: 'white', fontSize: 10, fontWeight: '800' },
    pmsbyHeroTitle: { color: 'white', fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 32, marginBottom: 8 },
    pmsbyHeroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 20 },
    pmsbyPricePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: '#BAE6FD' },
    pmsbyHeroCta: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 50, elevation: 6, shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 8, marginTop: 10 },
    pmsbyHeroCtaText: { color: 'white', fontWeight: '800', fontSize: 14 },
    pmsbyStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -30, marginBottom: 24 },
    pmsbyStatCard: { width: (width - 48) / 3, backgroundColor: 'white', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyStatVal: { fontSize: 18, fontWeight: '800', color: '#0A2463' },
    pmsbyStatLabel: { fontSize: 9, color: '#8FA3C5', fontWeight: '700', marginTop: 2 },
    pmsbySection: { marginHorizontal: 16, marginBottom: 24 },
    pmsbySecHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    pmsbySecIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbySecTitle: { fontSize: 18, fontWeight: '800', color: '#0A2463' },
    pmsbySecSub: { fontSize: 12, color: '#8FA3C5' },
    pmsbyInfoCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyInfoText: { fontSize: 14, color: '#4A5C82', lineHeight: 22 },
    pmsbyBenGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
    pmsbyBenCard: { width: '48%', backgroundColor: 'white', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
    pmsbyBenTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    pmsbyBenBadge: { backgroundColor: '#E3F0FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    pmsbyBenBadgeText: { fontSize: 8, fontWeight: '800', color: '#1E88E5' },
    pmsbyBenVal: { fontSize: 18, fontWeight: '800', color: '#0A2463', marginBottom: 4 },
    pmsbyBenDesc: { fontSize: 11, color: '#8FA3C5', lineHeight: 16 },
    pmsbyEligItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyEligIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F8FF', justifyContent: 'center', alignItems: 'center' },
    pmsbyEligTitle: { fontSize: 15, fontWeight: '700', color: '#0A2463' },
    pmsbyEligDesc: { fontSize: 12, color: '#8FA3C5' },
    pmsbyStepsList: { marginLeft: 8 },
    pmsbyStepItem: { flexDirection: 'row', gap: 16, marginBottom: 0 },
    pmsbyStepLeft: { alignItems: 'center', width: 32 },
    pmsbyStepNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    pmsbyStepNumText: { color: 'white', fontSize: 14, fontWeight: '800' },
    pmsbyStepLine: { width: 2, height: 40, backgroundColor: '#E3F0FF', marginVertical: 4 },
    pmsbyStepContent: { flex: 1, paddingBottom: 24 },
    pmsbyStepTitle: { fontSize: 16, fontWeight: '800', color: '#0A2463', marginBottom: 4 },
    pmsbyStepDesc: { fontSize: 13, color: '#8FA3C5', lineHeight: 20 },
    pmsbyVideoCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyVideoThumb: { height: 160, backgroundColor: '#0A2463' },
    pmsbyVideoThumbOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pmsbyPlayBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' },
    pmsbyVideoLabel: { fontSize: 10, fontWeight: '800', color: '#E11D48', marginTop: 16, marginHorizontal: 16 },
    pmsbyVideoTitle: { fontSize: 15, fontWeight: '800', color: '#0A2463', marginHorizontal: 16, marginTop: 4 },
    pmsbyVideoMeta: { fontSize: 12, color: '#8FA3C5', marginHorizontal: 16, marginVertical: 12 },
    pmsbyWebCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8FF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyWebLogo: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyWebName: { fontSize: 15, fontWeight: '800', color: '#0A2463', marginLeft: 16 },
    pmsbyWebUrl: { fontSize: 12, color: '#1E88E5', marginLeft: 16 },
    pmsbyWebArrow: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    pmsbyClaimCard: { padding: 20, borderRadius: 20 },
    pmsbyClaimDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853', marginTop: 6 },
    pmsbyClaimText: { flex: 1, fontSize: 13, color: '#0A2463', lineHeight: 20 },
    pmsbyFaqItem: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyFaqQ: { fontSize: 14, fontWeight: '700', color: '#0A2463', flex: 1, marginRight: 10 },
    pmsbyFaqA: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F8FF' },
    pmsbyFaqAText: { fontSize: 13, color: '#4A5C82', lineHeight: 20 },
    pmsbyContactCardSmall: { backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    pmsbyContactIconSmall: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
    pmsbyContactTitleSmall: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    pmsbyContactNumSmall: { fontSize: 16, fontWeight: '800', color: '#0A2463', marginTop: 2 },
    pmsbyContactCallBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    pmsbyContactCallBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
    pmsbyContactCard: { padding: 24, borderRadius: 24 },
    pmsbyContactLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    pmsbyContactTitle: { color: 'white', fontSize: 20, fontWeight: '800', marginTop: 4 },
    pmsbyContactDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, lineHeight: 20 },
    pmsbyContactNum: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16, alignSelf: 'flex-start', marginVertical: 20 },
    pmsbyContactBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', gap: 6 },
    pmsbyContactBtnText: { fontSize: 14, fontWeight: '800', color: '#0A2463' },
    pmsbyStickyCta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    pmsbyStickyBtn: { backgroundColor: '#2563EB', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    pmsbyStickyBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

    // AYUSHMAN & WEBVIEW COMPONENTS
    webViewHeaderNew: { backgroundColor: '#0b1d3a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 56 },
    wvBarBackNew: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    wvUrlBoxNew: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6 },
    wvUrlTextNew: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    wvBodyNew: { flex: 1, backgroundColor: '#fdf6ee', justifyContent: 'center', alignItems: 'center' },

    heroNew: { backgroundColor: '#F0F9FF', paddingBottom: 24, position: 'relative', overflow: 'hidden' },
    heroBlob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(37,99,235,0.05)', top: -50, right: -50 },
    heroBlob2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(37,99,235,0.03)', bottom: -40, left: -40 },
    topbarNew: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 25, gap: 12 },
    backBtnNew: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', justifyContent: 'center', alignItems: 'center' },
    topbarTitle: { color: '#0b1d3a', fontSize: 16, fontWeight: '700' },
    govChip: { backgroundColor: '#1E40AF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 8 },
    headerRightSide: { alignItems: 'flex-end', marginLeft: 'auto', gap: 6 },
    voiceToggleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    govChipText: { color: 'white', fontSize: 9, fontWeight: '800' },
    heroBodyNew: { paddingHorizontal: 18, marginTop: 10 },
    schemeRowNew: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    schemeIconNew: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'white', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    schemeTitleNew: { flex: 1 },
    schemeTitleH1: { color: '#0b1d3a', fontSize: 18, fontWeight: '800', lineHeight: 22 },
    schemeTitleP: { color: '#7a8fa6', fontSize: 11, marginTop: 2 },
    coverPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#BAE6FD' },
    coverAmt: { fontSize: 24, fontWeight: '800', color: '#0369A1' },
    coverTxt: { fontSize: 10, color: '#0369A1', fontWeight: '600', lineHeight: 13 },
    heroBtnsNew: { flexDirection: 'row', gap: 10 },
    hbtnWhite: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    hbtnWhiteText: { color: 'white', fontWeight: '700', fontSize: 13 },
    hbtnGhost: { width: 90, backgroundColor: '#F0F9FF', borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    hbtnGhostText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
    tickerContainer: { backgroundColor: '#2563EB', paddingVertical: 8, height: 32, overflow: 'hidden' },
    tickerInner: { flexDirection: 'row', width: 2000 },
    tickerText: { color: 'white', fontSize: 12, fontWeight: '600' },

    // PRE-EXISTING SHARED STYLES
    idCheckHero: { backgroundColor: '#EAF3FF', margin: 16, borderRadius: 20, padding: 24, alignItems: 'center' },
    idCheckHeroContent: { alignItems: 'center' },
    shieldIconContainer: { marginBottom: 16, backgroundColor: '#FFF', padding: 12, borderRadius: 30, elevation: 2 },
    idCheckHeroTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A5F', marginBottom: 8 },
    idCheckHeroSub: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    heroCtaBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center' },
    heroCtaText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    // Ayushman New Detail Styles
    contentNew: { padding: 16, gap: 16 },
    secHeadNew: { fontSize: 11, fontWeight: '800', color: '#7a8fa6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    qgridNew: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    qbtnNew: { width: (width - 56) / 4, backgroundColor: 'white', borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F1F5F9' },
    qiNew: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', fontSize: 18 },
    qbtnTextNew: { fontSize: 9, fontWeight: '700', color: '#0b1d3a', textAlign: 'center' },
    cardNew: { backgroundColor: 'white', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    cardTopNew: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitleNew: { fontSize: 15, fontWeight: '800', color: '#0b1d3a' },
    chipNew: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    chipTextNew: { fontSize: 9, fontWeight: '800' },
    portalLinkNew: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8 },
    plIconNew: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', fontSize: 18 },
    plTextNew: { flex: 1, marginLeft: 12 },
    plH4New: { fontSize: 13, fontWeight: '700', color: '#0b1d3a' },
    plPNew: { fontSize: 10, color: '#7a8fa6' },
    plArrNew: { fontSize: 18, color: '#2563EB', fontWeight: '800' },
    benGridNew: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    benItemNew: { width: '48%', backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
    benIconNew: { fontSize: 22, marginBottom: 4 },
    benH4New: { fontSize: 12, fontWeight: '700', color: '#0b1d3a' },
    benPNew: { fontSize: 10, color: '#7a8fa6', marginTop: 1 },
    vidThumbNew: { height: 180, borderRadius: 14, overflow: 'hidden', backgroundColor: '#142850' },
    vidOverlayNew: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    playCircleNew: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    vidLabelNew: { color: 'white', fontSize: 12, fontWeight: '700' },
    stepsNew: { marginTop: 8 },
    stepNew: { flexDirection: 'row', gap: 12 },
    stepLeftNew: { alignItems: 'center', width: 30 },
    stepNumNew: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#0b1d3a', justifyContent: 'center', alignItems: 'center' },
    stepNumTextNew: { color: 'white', fontSize: 13, fontWeight: '800' },
    stepLineNew: { width: 2, flex: 1, backgroundColor: '#e3eaf3', marginVertical: 4 },
    stepBodyNew: { flex: 1, paddingBottom: 20 },
    stepH4New: { fontSize: 14, fontWeight: '700', color: '#0b1d3a' },
    stepPNew: { fontSize: 11, color: '#7a8fa6', lineHeight: 16 },
    stepChipNew: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
    stepChipTextNew: { fontSize: 9, fontWeight: '800' },
    eligCardNew: { borderRadius: 18, padding: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' },
    eligH3New: { color: '#0b1d3a', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    eligPNew: { color: '#7a8fa6', fontSize: 12, marginBottom: 14 },
    eligInputNew: { backgroundColor: '#F0F9FF', borderRadius: 12, height: 48, paddingHorizontal: 16, color: '#0b1d3a', fontSize: 14, borderWidth: 1, borderColor: '#F1F5F9' },
    eligBtnNew: { backgroundColor: '#2563EB', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    eligBtnTextNew: { color: 'white', fontWeight: '700', fontSize: 14 },
    contactListNew: { gap: 8 },
    contactRowNew: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    ciNew: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', fontSize: 19 },
    cInfoNew: { flex: 1, marginLeft: 12 },
    cH4New: { fontSize: 13, fontWeight: '700', color: '#0b1d3a' },
    cNumNew: { fontSize: 15, fontWeight: '800', color: '#2563EB' },
    cPNew: { fontSize: 10, color: '#7a8fa6' },
    cArrNew: { fontSize: 18, color: '#7a8fa6' },
    bottomBarNew: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 12, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: '#F1F5F9' },
    bbCallNew: { backgroundColor: '#e8f4fd', borderRadius: 12, paddingHorizontal: 16, height: 50, flexDirection: 'row', alignItems: 'center', gap: 6 },
    bbCallTextNew: { color: '#0b1d3a', fontWeight: '700', fontSize: 13 },
    bbMainNew: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bbMainTextNew: { color: 'white', fontWeight: '700', fontSize: 13 },
});

export default DriverWelfare;
