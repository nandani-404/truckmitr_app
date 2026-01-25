import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Animated, BackHandler, Dimensions, Image, Linking, Switch, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
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
        {
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
        },
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
                        <View style={[styles.utilityImageContainer, scheme.id === 'driver_rest' && { right: -10 }]}>
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



    // NEW: Ayushman Bharat Detail View
    const AyushmanDetailView = () => {
        const [showWhyExpanded, setShowWhyExpanded] = useState(false);

        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.ayushman.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#E0F2FE' }]}>
                                <Text style={{ fontSize: 24 }}>🏥</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.ayushman.title')}</Text>
                            <Text style={styles.idCheckHeroSub}>
                                {t('driverWelfare.ayushman.subtitle')}
                            </Text>
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                                    {t('driverWelfare.ayushman.whatIsItDesc')}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHY AYUSHMAN BHARAT */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowWhyExpanded(!showWhyExpanded)}
                        style={styles.expandableCard}
                    >
                        <View style={styles.expandableHeader}>
                            <Text style={styles.expandableTitle}>{t('driverWelfare.ayushman.whatIsItTitle')}</Text>
                            <Ionicons name={showWhyExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                        </View>
                        {!showWhyExpanded && (
                            <Text style={styles.expandablePreview}>
                                {t('driverWelfare.ayushman.tagline')}
                            </Text>
                        )}
                        {showWhyExpanded && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={styles.expandableText}>
                                    {t('driverWelfare.ayushman.whatIsItDesc')}
                                </Text>
                                <TouchableOpacity style={{ marginTop: 8 }}>
                                    <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>{t('driverWelfare.viewDetails')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 3. WHAT IT COVERS */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.ayushman.benefitsTitle')}</Text>
                        <View style={styles.docGrid}>
                            <View style={styles.docCard}>
                                <View style={[styles.docIconCircle, { backgroundColor: '#DBEAFE' }]}>
                                    <Ionicons name="card-outline" size={24} color="#2563EB" />
                                </View>
                                <Text style={styles.docTitle}>{t('driverWelfare.ayushman.grid.cashless')}</Text>
                                <Text style={styles.docSub}>{t('driverWelfare.ayushman.grid.cashlessSub')}</Text>
                            </View>
                            <View style={styles.docCard}>
                                <View style={[styles.docIconCircle, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="medkit-outline" size={24} color="#16A34A" />
                                </View>
                                <Text style={styles.docTitle}>{t('driverWelfare.ayushman.grid.major')}</Text>
                                <Text style={styles.docSub}>{t('driverWelfare.ayushman.grid.majorSub')}</Text>
                            </View>
                            <View style={styles.docCard}>
                                <View style={[styles.docIconCircle, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="globe-outline" size={24} color="#D97706" />
                                </View>
                                <Text style={styles.docTitle}>{t('driverWelfare.ayushman.grid.allIndia')}</Text>
                                <Text style={styles.docSub}>{t('driverWelfare.ayushman.grid.allIndiaSub')}</Text>
                            </View>
                            <View style={styles.docCard}>
                                <View style={[styles.docIconCircle, { backgroundColor: '#F3E8FF' }]}>
                                    <Ionicons name="people-outline" size={24} color="#9333EA" />
                                </View>
                                <Text style={styles.docTitle}>{t('driverWelfare.ayushman.grid.family')}</Text>
                                <Text style={styles.docSub}>{t('driverWelfare.ayushman.grid.familySub')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 4. WHO CAN BENEFIT */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.ayushman.whoCanTakeTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.ayushman.whoCanTakeList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 5. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.ayushman.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7' }}>
                            <View style={{ gap: 10 }}>
                                <Text style={{ fontSize: 13, color: '#334155' }}>
                                    {t('driverWelfare.ayushman.whyImportantDesc')}
                                </Text>
                            </View>
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(234,88,12,0.2)' }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534', textAlign: 'center' }}>{t('driverWelfare.ayushman.tagline')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 6. GOVERNMENT TRUST */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="business" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>{t('driverWelfare.ayushman.needHelpTitle')}</Text>
                        </View>
                        <Text style={styles.securityText}>
                            {t('driverWelfare.ayushman.needHelpDesc')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <Ionicons name="lock-closed-outline" size={14} color="#059669" />
                            <Text style={{ fontSize: 12, color: '#064E3B' }}>{t('driverWelfare.ayushman.trustBadge')}</Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: '#D1FAE5', marginVertical: 12 }} />

                        <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                            <Ionicons name="call-outline" size={16} color="#475569" />
                            <View>
                                <Text style={styles.supportText}>{t('driverWelfare.ayushman.supportBtnTitle')}</Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>{t('driverWelfare.ayushman.supportBtnSub')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>{t('driverWelfare.callTruckMitr')}</Text>
                    </TouchableOpacity>
                </View>
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
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.pmsby.title')} Insurance</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#E0F2FE' }]}>
                                <Text style={{ fontSize: 24 }}>🛡️</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.pmsby.title')}</Text>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.pmsby.subtitle')}</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2563EB', marginBottom: 16 }}>{t('driverWelfare.pmsby.benefit')} {t('driverWelfare.pmsby.benefitSuffix')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmsby.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.pmsby.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmsby.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.pmsby.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmsby.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5' }}>
                            <Text style={{ fontSize: 14, color: '#9A3412', lineHeight: 22, marginBottom: 8 }}>
                                {t('driverWelfare.pmsby.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>{t('driverWelfare.callTruckMitr')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                {t('driverWelfare.tollFree')}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            {t('driverWelfare.ayushman.needHelpSub')}
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>{t('driverWelfare.callTruckMitr')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // PMJJBY Detail View (Get ID Check style)
    const PMJJBYDetailView = () => {
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.pmjjby.title')} Insurance</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#FEE2E2' }]}>
                                <Text style={{ fontSize: 24 }}>❤️</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.pmjjby.title')}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 4 }}>{t('driverWelfare.pmjjby.subtitle')}</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626', marginBottom: 16 }}>{t('driverWelfare.pmjjby.benefit')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmjjby.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.pmjjby.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmjjby.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.pmjjby.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.pmjjby.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' }}>
                            <Text style={{ fontSize: 14, color: '#991B1B', lineHeight: 22, marginBottom: 8 }}>
                                {t('driverWelfare.pmjjby.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>{t('driverWelfare.callTruckMitr')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                {t('driverWelfare.tollFree')}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            {t('driverWelfare.ayushman.needHelpSub')}
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>{t('driverWelfare.callTruckMitr')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // PM Shram Yogi Detail View (Get ID Check style)
    const PMShramYogiDetailView = () => {
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.shramyogi.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={{ fontSize: 24 }}>💰</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.shramyogi.title')}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 4 }}>{t('driverWelfare.shramyogi.subtitle')}</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#D97706', marginBottom: 16 }}>{t('driverWelfare.shramyogi.benefit')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.shramyogi.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.shramyogi.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.shramyogi.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.shramyogi.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.shramyogi.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A' }}>
                            <Text style={{ fontSize: 14, color: '#92400E', lineHeight: 22, marginBottom: 8 }}>
                                {t('driverWelfare.shramyogi.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>{t('driverWelfare.callTruckMitr')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                {t('driverWelfare.tollFree')}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            {t('driverWelfare.ayushman.needHelpSub')}
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>{t('driverWelfare.callTruckMitr')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Atal Pension Yojana Detail View (Get ID Check style)
    const AtalPensionDetailView = () => {
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.atal.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#E0E7FF' }]}>
                                <Text style={{ fontSize: 24 }}>💵</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.atal.title')}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 4 }}>{t('driverWelfare.atal.subtitle')}</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#6366F1', marginBottom: 16 }}>{t('driverWelfare.atal.benefit')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.atal.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.atal.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.atal.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.atal.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.atal.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#EEF2FF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#C7D2FE' }}>
                            <Text style={{ fontSize: 14, color: '#3730A3', lineHeight: 22, marginBottom: 8 }}>
                                {t('driverWelfare.atal.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>{t('driverWelfare.callTruckMitr')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                {t('driverWelfare.tollFree')}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            {t('driverWelfare.ayushman.needHelpSub')}
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>Call TruckMitr for Help</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Apna Ghar Detail View (Get ID Check style)
    const ApnaGharDetailView = () => {
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.apnaghar.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#FCE7F3' }]}>
                                <Text style={{ fontSize: 24 }}>🏠</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.apnaghar.title')}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 16 }}>{t('driverWelfare.apnaghar.subtitle')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.apnaghar.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.apnaghar.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.apnaghar.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.apnaghar.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.apnaghar.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#FDF2F8', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FBCFE8' }}>
                            <Text style={{ fontSize: 14, color: '#9D174D', lineHeight: 22 }}>
                                {t('driverWelfare.apnaghar.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>Need Help?</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                Call TruckMitr Toll Free: 1800 102 4558
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            Our team will help you understand the facilities and access options.
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>Call TruckMitr for Help</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Driver Rest Facilities Detail View (Get ID Check style)
    const DriverRestFacilitiesDetailView = () => {
        return (
            <View style={styles.flex1}>
                {/* Header */}
                <View style={[styles.detailHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => setCurrentScreen('list')} style={styles.detailBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t('driverWelfare.driverRest.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 1. HERO SECTION */}
                    <View style={styles.idCheckHero}>
                        <View style={styles.idCheckHeroContent}>
                            <View style={[styles.shieldIconContainer, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={{ fontSize: 24 }}>🛌</Text>
                            </View>
                            <Text style={styles.idCheckHeroTitle}>{t('driverWelfare.driverRest.title')}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 16 }}>{t('driverWelfare.driverRest.subtitle')}</Text>
                            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => Linking.openURL('tel:18001024558')}>
                                <Text style={styles.heroCtaText}>{t('driverWelfare.callTruckMitr')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. WHAT IS IT? */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.driverRest.whatIsItTitle')}</Text>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                                {t('driverWelfare.driverRest.whatIsItDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 3. HOW IT HELPS YOU */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.driverRest.benefitsTitle')}</Text>
                        <View style={styles.benefitsList}>
                            {(t('driverWelfare.driverRest.benefitsList', { returnObjects: true }) as string[]).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 4. WHY IMPORTANT FOR DRIVERS */}
                    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                        <Text style={styles.sectionHeader}>{t('driverWelfare.driverRest.whyImportantTitle')}</Text>
                        <View style={{ backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0' }}>
                            <Text style={{ fontSize: 14, color: '#065F46', lineHeight: 22, marginBottom: 8 }}>
                                {t('driverWelfare.driverRest.whyImportantDesc')}
                            </Text>
                        </View>
                    </View>

                    {/* 5. NEED HELP? */}
                    <View style={styles.securityCard}>
                        <View style={styles.securityHeader}>
                            <Ionicons name="call" size={20} color="#059669" />
                            <Text style={styles.securityTitle}>Need Help?</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('tel:18001024558')}
                            style={{ marginBottom: 12 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563EB' }}>
                                Call TruckMitr Toll Free: 1800 102 4558
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.securityText}>
                            Our team will help you understand the support services and access options.
                        </Text>
                    </View>

                </ScrollView>

                {/* STICKY CTA */}
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={styles.stickyPrimaryBtn}
                        onPress={() => Linking.openURL('tel:18001024558')}
                    >
                        <Text style={styles.stickyBtnText}>Call TruckMitr for Help</Text>
                    </TouchableOpacity>
                </View>
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
            let sound: Sound | null = null;

            if (selectedScheme && AUDIO_MAP[selectedScheme.id]) {
                const source = Image.resolveAssetSource(AUDIO_MAP[selectedScheme.id]);
                if (source && source.uri) {
                    sound = new Sound(source.uri, undefined, (error: any) => {
                        if (error) {
                            console.log('Failed to load sound', error);
                            return;
                        }
                        sound?.play((success: boolean) => {
                            if (success) {
                                console.log('successfully finished playing');
                            } else {
                                console.log('playback failed due to audio decoding errors');
                            }
                        });
                    });
                }
            }

            return () => {
                if (sound) {
                    sound.stop();
                    sound.release();
                }
            };
        }, [selectedScheme]);
        if (!selectedScheme) return null;

        if (selectedScheme.id === 'ayushman') return <AyushmanDetailView />;
        if (selectedScheme.id === 'pmsby') return <PMSBYDetailView scheme={selectedScheme} />;
        if (selectedScheme.id === 'pmjjby') return <PMJJBYDetailView />;
        if (selectedScheme.id === 'shramyogi') return <PMShramYogiDetailView />;
        if (selectedScheme.id === 'atal') return <AtalPensionDetailView />;
        if (selectedScheme.id === 'apnaghar') return <ApnaGharDetailView />;
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

    // ID Check Styles
    idCheckHero: { backgroundColor: '#EAF3FF', margin: 16, borderRadius: 20, padding: 24, alignItems: 'center' },
    idCheckHeroContent: { alignItems: 'center' },
    shieldIconContainer: { marginBottom: 16, backgroundColor: '#FFF', padding: 12, borderRadius: 30, elevation: 2 },
    idCheckHeroTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A5F', marginBottom: 8 },
    idCheckHeroSub: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    heroCtaBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center' },
    heroCtaText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    expandableCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    expandableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expandableTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    expandablePreview: { fontSize: 13, color: '#64748B', marginTop: 4 },
    expandableText: { fontSize: 13, color: '#334155', lineHeight: 20 },

    sectionContainer: { marginHorizontal: 16, marginBottom: 24 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

    docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    docCard: { width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
    docIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    docTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
    docSub: { fontSize: 11, color: '#64748B', textAlign: 'center' },

    stepperContainer: { marginLeft: 16, marginTop: 4 },
    stepItem: { flexDirection: 'row', marginBottom: 24, position: 'relative' },
    stepIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginRight: 12, zIndex: 1 },
    stepNumber: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
    stepText: { fontSize: 14, color: '#1E293B', fontWeight: '500', flex: 1, marginTop: 4 },
    stepLine: { position: 'absolute', left: 13, top: 28, bottom: -20, width: 2, backgroundColor: '#E2E8F0', zIndex: 0 },

    benefitsList: { gap: 12 },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    benefitText: { fontSize: 14, color: '#334155', fontWeight: '500' },

    securityCard: { marginHorizontal: 16, marginBottom: 24, backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#D1FAE5' },
    securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    securityTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
    securityText: { fontSize: 13, color: '#064E3B', lineHeight: 20, marginBottom: 12 },
    supportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    supportText: { fontSize: 13, color: '#475569', fontWeight: '600' },

    stickyPrimaryBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    stickyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default DriverWelfare;
