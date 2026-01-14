import { ActivityIndicator, Modal, Text, TouchableOpacity, View, Animated, Pressable, StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useColor, useImage, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, ScreenHeader } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import moment from 'moment';
import Feather from 'react-native-vector-icons/Feather'
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { useDispatch, useSelector } from 'react-redux';
import { Image } from 'react-native';
import { AnimatedFAB } from 'react-native-paper';
import JobFilter from './filter';
import LottieView from 'lottie-react-native';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import Subscription from '../subscription';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import LinearGradient from 'react-native-linear-gradient';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Premium Success Overlay Component
const SuccessOverlay = ({ colors, responsiveHeight, responsiveWidth, responsiveFontSize, t }: any) => {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Backdrop fade in
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Ring animation
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Checkmark animation
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Text animation
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Confetti particles animation
    particles.forEach((particle, index) => {
      const angle = (index / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      Animated.sequence([
        Animated.delay(300 + index * 30),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(particle.scale, {
            toValue: 1,
            tension: 100,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 360,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const particleColors = [
    colors.royalBlue,
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#A78BFA',
    '#F472B6',
  ];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: backdropOpacity,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        pointerEvents: 'none',
      }}
    >
      {/* Confetti Particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: index % 2 === 0 ? 6 : 2,
            backgroundColor: particleColors[index % particleColors.length],
            opacity: particle.opacity,
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
              {
                rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        />
      ))}

      {/* Animated Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: responsiveFontSize(18),
          height: responsiveFontSize(18),
          borderRadius: responsiveFontSize(9),
          borderWidth: 3,
          borderColor: colors.royalBlue + '30',
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />

      {/* Success Circle */}
      <Animated.View
        style={{
          width: responsiveFontSize(14),
          height: responsiveFontSize(14),
          borderRadius: responsiveFontSize(7),
          backgroundColor: colors.royalBlue,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: checkOpacity,
          transform: [{ scale: checkScale }],
          shadowColor: colors.royalBlue,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <Ionicons name="checkmark" size={responsiveFontSize(7)} color={colors.white} />
      </Animated.View>

      {/* Success Text */}
      <Animated.View
        style={{
          marginTop: responsiveFontSize(3),
          alignItems: 'center',
          opacity: textOpacity,
          transform: [{ translateY: textSlide }],
        }}
      >
        <Text
          style={{
            fontSize: responsiveFontSize(2.8),
            fontWeight: '700',
            color: colors.black,
            letterSpacing: -0.5,
            marginBottom: responsiveFontSize(0.8),
          }}
        >
          {t('applicationSubmitted') || 'Application Submitted!'}
        </Text>
        <Text
          style={{
            fontSize: responsiveFontSize(1.7),
            fontWeight: '500',
            color: colors.blackOpacity(0.6),
            textAlign: 'center',
            paddingHorizontal: responsiveFontSize(4),
          }}
        >
          {t('applicationSuccessMessage') || 'Your job application has been sent successfully'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// Animated Floating Button Component
const AnimatedFloatingButton = ({ colors, responsiveFontSize, responsiveWidth, t, onPress, isExtended }: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance bounce animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Continuous subtle pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: responsiveWidth(6),
        right: responsiveWidth(4),
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Main Button */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        }]}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: responsiveFontSize(6),
            paddingHorizontal: isExtended ? responsiveFontSize(2) : responsiveFontSize(1.5),
            backgroundColor: colors.royalBlue,
            borderRadius: responsiveFontSize(3),
            shadowColor: colors.royalBlue,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Image
            style={{
              height: responsiveFontSize(2.5),
              width: responsiveFontSize(2.5),
              tintColor: colors.white,
            }}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4121/4121106.png' }}
          />
          {isExtended && (
            <Text
              style={{
                color: colors.white,
                fontSize: responsiveFontSize(1.7),
                fontWeight: '600',
                marginLeft: responsiveFontSize(1),
                letterSpacing: 0.3,
              }}
              numberOfLines={1}
            >
              {t('appliedJobs')}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Premium Job Card Component with animations
const JobCard = ({
  item,
  index,
  expandedJobs,
  toggleExpand,
  checkBoxSelect,
  _onpressCheckBox,
  errors,
  loadingApplyJob,
  _applyJob,
  colors,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  t,
  navigation
}: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous shimmer animation - faster and looping
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    ).start();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isExpanded = expandedJobs[item.id] || false;
  const shortDescription = item?.Job_Description?.length > 150
    ? item?.Job_Description.slice(0, 150) + "..."
    : item?.Job_Description;

  let skills: string[] = [];
  try {
    const parsed = JSON.parse(item?.Preferred_Skills);
    skills = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    skills = [item?.Preferred_Skills];
  }

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: slideAnim }
        ],
        opacity: fadeAnim,
      }}
    >

      {/* Gradient Accent */}
      <LinearGradient
        colors={[colors.royalBlue + '12', colors.royalBlue + '04', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: responsiveHeight(12) }}
      />

      <View style={{ padding: responsiveFontSize(2.2) }}>
        {/* Subscription Badge */}
        {item?.subscription_plan_name === 'super_premium_job' ? (
          <View style={{
            alignSelf: 'flex-end',
            marginBottom: responsiveFontSize(1.5),
            shadowColor: '#B8860B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#d97706', '#b45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: responsiveFontSize(1.6),
                paddingVertical: responsiveFontSize(0.8),
                borderRadius: responsiveFontSize(2.5),
                overflow: 'hidden',
              }}>
              {/* Shimmer Effect */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -5,
                  bottom: -5,
                  width: responsiveFontSize(8),
                  backgroundColor: 'rgba(255, 255, 255, 0.45)',
                  transform: [{
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-responsiveFontSize(15), responsiveFontSize(25)]
                    })
                  }, {
                    skewX: '-25deg'
                  }]
                }}
              />
              <MaterialCommunityIcons name="crown" size={15} color="#fff" style={{ marginRight: responsiveFontSize(0.6) }} />
              <Text style={{
                fontSize: responsiveFontSize(1.35),
                fontWeight: '700',
                color: '#fff',
                letterSpacing: 0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                SUPER PREMIUM JOB
              </Text>
            </LinearGradient>
          </View>
        ) : item?.subscription_plan_name === 'premium_job' ? (
          <View style={{
            alignSelf: 'flex-end',
            marginBottom: responsiveFontSize(1.5),
            shadowColor: '#1e3a8a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: responsiveFontSize(1.6),
                paddingVertical: responsiveFontSize(0.8),
                borderRadius: responsiveFontSize(2.5),
                overflow: 'hidden',
              }}>
              {/* Shimmer Effect */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -5,
                  bottom: -5,
                  width: responsiveFontSize(8),
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  transform: [{
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-responsiveFontSize(15), responsiveFontSize(25)]
                    })
                  }, {
                    skewX: '-25deg'
                  }]
                }}
              />
              <MaterialCommunityIcons name="crown" size={15} color="#fbbf24" style={{ marginRight: responsiveFontSize(0.6) }} />
              <Text style={{
                fontSize: responsiveFontSize(1.35),
                fontWeight: '700',
                color: '#fff',
                letterSpacing: 0.5,
              }}>
                PREMIUM JOB
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={{
            alignSelf: 'flex-end',
            marginBottom: responsiveFontSize(1.5),
          }}>
            <View style={{
              backgroundColor: '#374151',
              paddingHorizontal: responsiveFontSize(1.6),
              paddingVertical: responsiveFontSize(0.7),
              borderRadius: responsiveFontSize(2.5),
            }}>
              <Text style={{
                fontSize: responsiveFontSize(1.3),
                fontWeight: '600',
                color: '#fff',
                letterSpacing: 0.4,
              }}>
                STANDARD JOB
              </Text>
            </View>
          </View>
        )}

        {/* Header: Title + Job ID Badge */}
        <View style={{ marginBottom: responsiveFontSize(1.5) }}>
          <Text style={{
            fontSize: responsiveFontSize(2.4),
            color: colors.black,
            fontWeight: '700',
            letterSpacing: -0.4,
            lineHeight: responsiveFontSize(3.2),
          }}>
            {item?.job_title}
          </Text>


          {/* Description */}
          <View style={{ marginBottom: responsiveFontSize(2) }}>
            <Text style={{
              fontSize: responsiveFontSize(1.75),
              color: colors.blackOpacity(0.6),
              fontWeight: '400',
              lineHeight: responsiveFontSize(2.6),
              letterSpacing: 0.1
            }}>
              {isExpanded ? item?.Job_Description : shortDescription}
            </Text>
            {item?.Job_Description?.length > 150 && (
              <Pressable
                onPress={() => toggleExpand(item.id)}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: responsiveFontSize(1),
                  opacity: pressed ? 0.6 : 1
                }]}
              >
                <Text style={{
                  fontSize: responsiveFontSize(1.6),
                  color: colors.royalBlue,
                  fontWeight: '600',
                }}>
                  {isExpanded ? t("showLess") : t("showMore")}
                </Text>
                <FontAwesome6
                  name={!isExpanded ? 'chevron-down' : 'chevron-up'}
                  size={11}
                  color={colors.royalBlue}
                  style={{ marginLeft: responsiveFontSize(0.5) }}
                />
              </Pressable>
            )}
          </View>

          {/* Info Grid - Premium Layout */}
          <View style={{
            backgroundColor: colors.blackOpacity(0.03),
            borderRadius: responsiveFontSize(1.5),
            padding: responsiveFontSize(2),
            marginBottom: responsiveFontSize(2),
          }}>
            {/* Job Details Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: responsiveFontSize(2),
            }}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.royalBlue} />
              <Text style={{
                fontSize: responsiveFontSize(2.1),
                fontWeight: '700',
                color: colors.royalBlue,
                marginLeft: responsiveFontSize(0.8),
              }}>
                {t('jobDetails') || 'Job Details'}
              </Text>
            </View>

            {/* Row 1: Job ID & Posted On */}
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={16} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('jobId') || 'Job ID'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.job_id}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="calendar" size={14} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('postedOn') || 'Posted On'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {moment(item?.Created_at).format("DD MMM YYYY")}
                </Text>
              </View>
            </View>

            {/* Row 2: Location & Open Positions */}
            <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.8) }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="location-dot" size={14} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('location') || 'Location'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.job_location}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="users" size={14} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('openPositions') || 'Open Positions'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.number_of_drivers_required || '-'}
                </Text>
              </View>
            </View>

            {/* Row 3: Experience Required & License Type */}
            <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.8) }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="star" size={14} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('experienceRequired') || 'Experience Required'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.Required_Experience} Years
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="license" size={16} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('licenseType') || 'License Type'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.Type_of_License}
                </Text>
              </View>
            </View>

            {/* Row 4: Vehicle Type & Application Deadline */}
            <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.8) }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="truck" size={16} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('vehicleType') || 'Vehicle Type'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.vehicle_type}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="calendar" size={14} color={colors.royalBlue} />
                  <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.royalBlue, fontWeight: '600', marginLeft: responsiveFontSize(0.5) }}>
                    {t('applicationDeadline') || 'Application Deadline'}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(2.5), marginTop: responsiveFontSize(0.3) }}>
                  {item?.Application_Deadline || '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Consent Checkbox - Premium Style */}
          <Pressable
            onPress={() => _onpressCheckBox(item.id)}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: checkBoxSelect[item.id]
                ? colors.royalBlue + '08'
                : colors.blackOpacity(0.02),
              borderRadius: responsiveFontSize(1.2),
              padding: responsiveFontSize(1.5),
              borderWidth: 1.5,
              borderColor: checkBoxSelect[item.id]
                ? colors.royalBlue + '25'
                : colors.blackOpacity(0.06),
              opacity: pressed ? 0.7 : 1,
              marginBottom: responsiveFontSize(1.5),
            }]}
          >
            <MaterialCommunityIcons
              name={checkBoxSelect[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={colors.royalBlue}
              style={{ marginRight: responsiveFontSize(1), marginTop: 2 }}
            />
            <Text style={{
              color: colors.blackOpacity(0.7),
              fontSize: responsiveFontSize(1.55),
              flex: 1,
              lineHeight: responsiveFontSize(2.2),
            }}>
              {t(`iAgreeToTruckMitr`)}
              <Text
                onPress={() => navigation.navigate(STACKS?.DRIVER_CONSENT)}
                style={{
                  color: colors.royalBlue,
                  fontWeight: '600',
                  textDecorationLine: 'underline'
                }}
              >
                {' '}{t(`driverConsent`)}
              </Text>
              {t(`applyJobPolicy`)}
            </Text>
          </Pressable>

          {/* Error Message */}
          {errors[item.id]?.checkBox && (
            <View style={{
              backgroundColor: colors.error + '12',
              padding: responsiveFontSize(1.2),
              borderRadius: responsiveFontSize(1),
              borderLeftWidth: 3,
              borderLeftColor: colors.error,
              marginBottom: responsiveFontSize(1.5),
            }}>
              <Text style={{
                color: colors.error,
                fontSize: responsiveFontSize(1.5),
                fontWeight: '500'
              }}>
                {errors[item.id]?.checkBox}
              </Text>
            </View>
          )}
        </View>

        {/* Apply Button - Full Width at Bottom */}
        <Pressable
          onPress={() => _applyJob(item?.id)}
          disabled={loadingApplyJob === item?.id}
          style={({ pressed }) => [{
            height: responsiveFontSize(6),
            width: '100%',
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.995 : 1 }],
          }]}
        >
          <LinearGradient
            colors={[colors.royalBlue, colors.royalBlue + 'E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loadingApplyJob === item?.id ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={{
                  color: colors.white,
                  fontSize: responsiveFontSize(2),
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}>
                  {t(`apply`)}
                </Text>
                <Ionicons
                  name='send'
                  size={16}
                  color={colors.white}
                  style={{ marginLeft: responsiveFontSize(1) }}
                />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
};

// Info Item Component - Inline format (label: value on same line)
const InfoItem = ({ icon, label, value, colors, responsiveFontSize }: any) => (
  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: responsiveFontSize(0.8) }}>
    <View style={{ marginRight: responsiveFontSize(0.5) }}>{icon}</View>
    <Text style={{
      color: colors.royalBlue,
      fontSize: responsiveFontSize(1.45),
      fontWeight: '600',
    }}>
      {label}: <Text style={{ color: colors.black, fontWeight: '500' }}>{value || '-'}</Text>
    </Text>
  </View>
);

export default function AvailableJob() {
  const { t } = useTranslation();
  useStatusBarStyle('dark-content')
  const dispatch = useDispatch()
  const colors = useColor();
  const images = useImage()
  const route = useRoute<any>();
  const safeAreaInsets = useSafeAreaInsets();
  const { shadow } = useShadow()
  const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
  const navigation = useNavigation<NavigatorProp>();

  const { isDriver, subscriptionDetails, subscriptionModal } = useSelector((state: any) => { return state?.user })

  const [availableJobsList, setavailableJobsList] = useState<any>()
  const [filterModel, setfilterModel] = useState(false)
  const [loading, setloading] = useState(true)
  const [loadingApplyJob, setloadingApplyJob] = useState(-1)
  const [showLottie, setshowLottie] = useState(false)
  const [isExtended, setIsExtended] = useState(false);
  const [checkBoxSelect, setCheckBoxSelect] = useState<{ [jobId: number]: boolean }>({});
  const [errors, setErrors] = useState<{ [jobId: number]: { checkBox?: string } }>({});

  useEffect(() => {
    setTimeout(() => {
      setIsExtended(true)
    }, 500);
  }, [])

  // Auto-tick all checkboxes when jobs list loads
  useEffect(() => {
    if (availableJobsList?.length) {
      const initialState: { [jobId: number]: boolean } = {};
      availableJobsList.forEach((job: any) => {
        initialState[job.id] = true;
      });
      setCheckBoxSelect(initialState);
    }
  }, [availableJobsList]);

  const validate = (jobId: number): boolean => {
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!checkBoxSelect[jobId]) {
      newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
      valid = false;
    }
    setErrors(prev => ({ ...prev, [jobId]: newErrors }));
    return valid;
  };

  const _onpressCheckBox = (jobId: number) => {
    setCheckBoxSelect(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    setErrors(prev => ({ ...prev, [jobId]: { checkBox: undefined } }));
  };

  const _fetchAllAvailableJobs = async () => {
    try {
      const allAvailableJobs: any = await axiosInstance.get(END_POINTS?.ALL_JOBS_AND_SEARCH(''));
      console.log("allAvailableJobs", allAvailableJobs);
      if (allAvailableJobs?.data?.status) {
        setavailableJobsList(allAvailableJobs?.data?.data);
      }
    } catch (error) {
      console.error("Error fetching available jobs:", error);
    } finally {
      setloading(false)
    }
  };

  useFocusEffect(
    useCallback(() => {
      _fetchAllAvailableJobs();
    }, [])
  );

  const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});

  const toggleExpand = (id: number) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const _navigateSearch = () => {
    navigation.navigate(STACKS.SEARCH)
  }

  const _navigateAppliedJob = () => {
    navigation.navigate(STACKS.APPLIED_JOB)
  }

  const _applyJob = async (id: any) => {
    if (!validate(id)) return;
    if (subscriptionDetails?.showSubscriptionModel && isDriver) {
      !subscriptionModal && dispatch(subscriptionModalAction(true))
    } else {
      try {
        setloadingApplyJob(id)
        const FormData = require('form-data');
        let data = new FormData();
        data.append('consent_visible_transporter', checkBoxSelect[id] ? 1 : 0);

        const response: any = await axiosInstance.post(END_POINTS?.APPLY_JOB(id), data);
        if (response?.data?.status) {
          setshowLottie(true)
          setTimeout(() => {
            setshowLottie(false)
          }, 2000);
        } else {
          if (response?.data?.message === "You have reached your cumulative job application limit for your subscriptions.") {
            dispatch(subscriptionModalAction(true));
          }
          showToast(response?.data?.message)
        }
        _fetchAllAvailableJobs()
      } catch (error: any) {
        console.error("Error searching jobs:", error);
        if (error?.response?.status === 403 || error?.response?.data?.message === "You have reached your cumulative job application limit for your subscriptions.") {
          dispatch(subscriptionModalAction(true));
        }
      } finally {
        setloadingApplyJob(-1)
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Premium Header */}
      <ScreenHeader
        title={t('availableJobs', 'Available Jobs')}
        titleCount={availableJobsList?.length || 0}
        showFilterButton
        filterLabel={t('filter')}
        onFilterPress={() => setfilterModel(true)}
      />

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.royalBlue} />
          <Text style={{
            marginTop: responsiveHeight(2),
            color: colors.blackOpacity(0.5),
            fontSize: responsiveFontSize(1.6)
          }}>
            {t('loading')}...
          </Text>
        </View>
      ) : availableJobsList?.length ? (
        <View style={{ flex: 1 }}>
          <FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            data={availableJobsList}
            ListHeaderComponent={() => (
              <Pressable
                onPress={_navigateSearch}
                style={({ pressed }) => [{
                  width: responsiveWidth(92),
                  flexDirection: 'row',
                  height: responsiveHeight(5.5),
                  alignSelf: 'center',
                  backgroundColor: colors.white,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.blackOpacity(0.08),
                  borderRadius: responsiveFontSize(1.5),
                  paddingHorizontal: responsiveWidth(4),
                  marginBottom: responsiveHeight(2),
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={{
                  fontSize: responsiveFontSize(1.7),
                  color: colors.blackOpacity(0.5),
                  fontWeight: '500'
                }}>
                  {t(`searchJobs`)}
                </Text>
                <View style={{
                  backgroundColor: colors.royalBlue + '12',
                  padding: responsiveFontSize(0.8),
                  borderRadius: responsiveFontSize(0.8),
                }}>
                  <Feather name={'search'} size={16} color={colors.royalBlue} />
                </View>
              </Pressable>
            )}
            renderItem={({ item, index }: any) => (
              <JobCard
                item={item}
                index={index}
                expandedJobs={expandedJobs}
                toggleExpand={toggleExpand}
                checkBoxSelect={checkBoxSelect}
                _onpressCheckBox={_onpressCheckBox}
                errors={errors}
                loadingApplyJob={loadingApplyJob}
                _applyJob={_applyJob}
                colors={colors}
                responsiveFontSize={responsiveFontSize}
                responsiveHeight={responsiveHeight}
                responsiveWidth={responsiveWidth}
                t={t}
                navigation={navigation}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: responsiveWidth(4),
              paddingTop: responsiveHeight(2),
              paddingBottom: responsiveHeight(12)
            }}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: responsiveFontSize(2.5),
            padding: responsiveFontSize(4),
            alignItems: 'center',
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
            marginHorizontal: responsiveWidth(8)
          }}>
            <Image
              style={{
                height: responsiveHeight(12),
                width: responsiveWidth(50),
                tintColor: colors.blackOpacity(0.12),
                marginBottom: responsiveHeight(2)
              }}
              source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
            />
            <Text style={{
              color: colors.blackOpacity(0.6),
              fontSize: responsiveFontSize(1.8),
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {t(`currentlyThereAreNoJobsAvailable`)}
            </Text>
          </View>
        </View>
      )}

      {/* Premium Success Animation Overlay */}
      {showLottie && (
        <SuccessOverlay
          colors={colors}
          responsiveHeight={responsiveHeight}
          responsiveWidth={responsiveWidth}
          responsiveFontSize={responsiveFontSize}
          t={t}
        />
      )}

      {/* Animated Floating Action Button */}
      <AnimatedFloatingButton
        colors={colors}
        responsiveFontSize={responsiveFontSize}
        responsiveWidth={responsiveWidth}
        t={t}
        onPress={_navigateAppliedJob}
        isExtended={isExtended}
      />

      {/* Filter Modal */}
      <Modal
        animationType={'slide'}
        transparent={true}
        visible={filterModel}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.blackOpacity(0.6),
        }}>
          <View style={{ position: 'absolute', bottom: 0 }}>
            <Pressable
              onPress={() => setfilterModel(false)}
              hitSlop={hitSlop(20)}
              style={({ pressed }) => [{
                height: responsiveFontSize(5),
                width: responsiveFontSize(5),
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                borderRadius: responsiveFontSize(2.5),
                marginBottom: responsiveHeight(1.5),
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 5,
                opacity: pressed ? 0.8 : 1
              }]}
            >
              <Ionicons name={'close'} size={24} color={colors.blackOpacity(0.6)} />
            </Pressable>
            <View style={{
              backgroundColor: colors.white,
              alignItems: 'center',
              borderTopLeftRadius: responsiveFontSize(3),
              borderTopRightRadius: responsiveFontSize(3),
              overflow: 'hidden'
            }}>
              <JobFilter setfilterModel={setfilterModel} />
            </View>
          </View>
        </View>
      </Modal>

      <Subscription />
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});