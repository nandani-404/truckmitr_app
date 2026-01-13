import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import React, { useCallback, useState, useEffect } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Space } from '@truckmitr/src/app/components'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Feather from 'react-native-vector-icons/Feather'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config'
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance'
import { userAction } from '@truckmitr/src/redux/actions/user.action'
import moment from 'moment'

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>

// State ID to Name Mapping (same as profile screen)
const STATE_ID_MAP: Record<string, string> = {
  '1': 'Andaman and Nicobar Islands',
  '2': 'Andhra Pradesh',
  '3': 'Arunachal Pradesh',
  '4': 'Assam',
  '5': 'Bihar',
  '6': 'Chandigarh',
  '7': 'Chhattisgarh',
  '8': 'Dadra and Nagar Haveli',
  '9': 'Delhi',
  '10': 'Goa',
  '11': 'Gujarat',
  '12': 'Haryana',
  '13': 'Himachal Pradesh',
  '14': 'Jammu and Kashmir',
  '15': 'Jharkhand',
  '16': 'Karnataka',
  '17': 'Kerala',
  '18': 'Ladakh',
  '19': 'Lakshadweep',
  '20': 'Madhya Pradesh',
  '21': 'Maharashtra',
  '22': 'Manipur',
  '23': 'Meghalaya',
  '24': 'Mizoram',
  '25': 'Nagaland',
  '26': 'Odisha',
  '27': 'Puducherry',
  '28': 'Punjab',
  '29': 'Rajasthan',
  '30': 'Sikkim',
  '31': 'Tamil Nadu',
  '32': 'Telangana',
  '33': 'Tripura',
  '34': 'Uttar Pradesh',
  '35': 'Uttarakhand',
  '36': 'West Bengal',
}

// Vehicle Type ID to Name Mapping (from database vehicle_type table)
const VEHICLE_TYPE_MAP: Record<string, string> = {
  '1': 'Container Trucks',
  '2': 'Heavy Commercial Vehicles',
  '3': 'Heavy Open Body Trucks',
  '4': 'Light Commercial Vehicles',
  '5': 'Light Open Body Trucks',
  '6': 'Medium Commercial Vehicles',
  '7': 'Multi-Axle Trucks',
  '8': 'Refrigerated Trucks',
  '9': 'Special Purpose Trucks',
  '10': 'Tankers',
  '11': 'Tippers',
  '13': 'Crane Mounted Lorries',
  '14': 'Curtainsiders',
  '15': 'Flatbeds',
  '16': 'Light Commercial Vehicles (LCVs)',
  '17': 'Medium and Heavy Commercial Vehicles (MHCVs)',
  '18': 'Mini Trucks',
  '19': 'Moffett Lorries',
  '20': 'Pickups',
  '21': 'Three-Wheelers',
  '22': 'Trailer Trucks',
  '23': 'Transporters',
  '24': 'Trucks',
  '25': 'Walking Floor Lorries',
  '26': 'Car Carrier',
}

// License Endorsement ID to Name Mapping
const LICENSE_ENDORSEMENT_MAP: Record<string, string> = {
  'hill': 'Hill Driving',
  'hazardous': 'Hazardous Goods',
  'roller': 'Road Roller',
  'tractor': 'Tractor-Trailer (Commercial)',
}

// Driving Experience Mapping
const getDrivingExperienceLabel = (value: string | undefined): string => {
  if (!value) return 'Not Provided'
  if (value === 'less_than_1') return 'Less than 1 year'
  const numValue = parseInt(value)
  if (isNaN(numValue)) return value
  return `${numValue} ${numValue === 1 ? 'year' : 'years'}`
}

// Helper function to get license endorsement names from IDs
const getLicenseEndorsementNames = (endorsementValue: any): string => {
  if (!endorsementValue) return 'Not Provided'

  // Remove surrounding quotes if present
  let cleanValue = endorsementValue
  if (typeof endorsementValue === 'string') {
    cleanValue = endorsementValue.replace(/^["']|["']$/g, '').trim()
  }

  let endorsementIds: string[] = []

  // Handle different formats
  if (Array.isArray(cleanValue)) {
    endorsementIds = cleanValue.map(e => String(e).trim().toLowerCase()).filter(e => e && e !== '')
  } else if (typeof cleanValue === 'string') {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(cleanValue)
      if (Array.isArray(parsed)) {
        endorsementIds = parsed.map(e => String(e).trim().toLowerCase()).filter(e => e && e !== '')
      } else {
        endorsementIds = cleanValue.split(',').map(e => e.trim().toLowerCase()).filter(e => e && e !== '')
      }
    } catch {
      // If JSON parsing fails, treat as comma-separated string
      endorsementIds = cleanValue.split(',').map(e => e.trim().toLowerCase()).filter(e => e && e !== '')
    }
  } else {
    const trimmed = String(cleanValue).trim().toLowerCase()
    if (trimmed && trimmed !== '') {
      endorsementIds = [trimmed]
    }
  }

  // Filter out empty strings and map IDs to names
  const endorsementNames = endorsementIds
    .filter(id => id && id !== '') // Remove empty strings
    .map(id => {
      return LICENSE_ENDORSEMENT_MAP[id] || id // Return mapped name or original ID if not found
    })
    .filter(name => name && name !== '') // Remove any resulting empty names

  return endorsementNames.length > 0 ? endorsementNames.join(', ') : 'Not Provided'
}

// Helper function to get state name from ID
const getStateName = (stateValue: string | number | undefined): string => {
  if (!stateValue) return ''
  const stateStr = String(stateValue).trim()
  if (STATE_ID_MAP[stateStr]) {
    return STATE_ID_MAP[stateStr]
  }
  return stateStr
}

// Helper function to get vehicle type names from IDs
const getVehicleTypeNames = (vehicleTypeValue: any): string => {
  if (!vehicleTypeValue) return 'Not Provided'

  // Remove surrounding quotes if present
  let cleanValue = vehicleTypeValue
  if (typeof vehicleTypeValue === 'string') {
    cleanValue = vehicleTypeValue.replace(/^["']|["']$/g, '').trim()
  }

  let vehicleIds: string[] = []

  // Handle different formats
  if (Array.isArray(cleanValue)) {
    vehicleIds = cleanValue.map(v => String(v).trim()).filter(v => v && v !== '')
  } else if (typeof cleanValue === 'string') {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(cleanValue)
      if (Array.isArray(parsed)) {
        vehicleIds = parsed.map(v => String(v).trim()).filter(v => v && v !== '')
      } else {
        vehicleIds = cleanValue.split(',').map(v => v.trim()).filter(v => v && v !== '')
      }
    } catch {
      // If JSON parsing fails, treat as comma-separated string
      vehicleIds = cleanValue.split(',').map(v => v.trim()).filter(v => v && v !== '')
    }
  } else {
    const trimmed = String(cleanValue).trim()
    if (trimmed && trimmed !== '') {
      vehicleIds = [trimmed]
    }
  }

  // Map IDs to names
  const vehicleNames = vehicleIds
    .filter(id => id && id !== '') // Remove empty strings
    .map(id => {
      return VEHICLE_TYPE_MAP[id] || id // Return mapped name or original ID if not found
    })
    .filter(name => name && name !== '') // Remove any resulting empty names

  return vehicleNames.length > 0 ? vehicleNames.join(', ') : 'Not Provided'
}

// Helper function to get preferred location name from ID using API data
const getPreferredLocationName = (locationValue: string | undefined, locationsData: any[]): string => {
  if (!locationValue) return 'Not Provided'

  // Find location by ID in API data
  const location = locationsData.find(loc => String(loc.id) === String(locationValue))
  if (location) {
    return location.name
  }

  // Fallback to hardcoded mapping if API data not available
  return getStateName(locationValue)
}

// Field Group Card Component - for multiple fields in one container
interface FieldGroupCardProps {
  title: string
  icon?: string
  iconLibrary?: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather'
  fields: Array<{
    label: string
    value: string | undefined
    isImage?: boolean
    imageUri?: string
  }>
  onEdit?: (stepId?: string) => void
  stepId?: string
}

const FieldGroupCard: React.FC<FieldGroupCardProps> = ({
  title,
  icon,
  iconLibrary = 'Ionicons',
  fields,
  onEdit,
  stepId,
}) => {
  const colors = useColor()
  const { responsiveFontSize } = useResponsiveScale()
  const { shadow } = useShadow()

  const renderIcon = () => {
    if (!icon) return null
    const iconProps = { name: icon, size: 22, color: colors.royalBlue }

    switch (iconLibrary) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...iconProps} />
      case 'Feather':
        return <Feather {...iconProps} />
      default:
        return <Ionicons {...iconProps} />
    }
  }

  return (
    <View style={[
      styles.fieldCard,
      {
        backgroundColor: colors.white,
        ...shadow,
        shadowColor: colors.blackOpacity(0.12),
        marginHorizontal: responsiveFontSize(2),
        marginBottom: responsiveFontSize(2),
      }
    ]}>
      {/* Beautiful gradient header */}
      <View style={[
        styles.cardHeader,
        {
          backgroundColor: colors.royalBlue + '08',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={[
            styles.iconContainer,
            {
              backgroundColor: colors.royalBlue + '15',
            }
          ]}>
            {renderIcon()}
          </View>
          <Text style={[
            styles.groupTitle,
            {
              color: colors.royalBlue,
              fontSize: responsiveFontSize(1.9),
              fontWeight: '700',
            }
          ]}>
            {title}
          </Text>
        </View>
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(stepId)}
            style={[
              styles.editButton,
              {
                backgroundColor: colors.royalBlue + '12',
              }
            ]}
          >
            <Feather name="edit-2" size={18} color={colors.royalBlue} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fieldCardContent}>
        {/* Fields */}
        <View style={styles.fieldsContainer}>
          {fields.map((field, index) => (
            <View key={index} style={[
              styles.fieldRow,
              index < fields.length - 1 && {
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.blackOpacity(0.06),
              }
            ]}>
              <Text style={[
                styles.fieldLabel,
                {
                  color: colors.blackOpacity(0.7),
                  fontSize: responsiveFontSize(1.4),
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }
              ]}>
                {field.label}
              </Text>

              <View style={styles.fieldValueContainer}>
                {field.isImage && field.imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: field.imageUri }} style={styles.fieldImage} />
                    <View style={[
                      styles.imageOverlay,
                      {
                        backgroundColor: colors.blackOpacity(0.05),
                      }
                    ]} />
                  </View>
                ) : (
                  <Text style={[
                    styles.fieldValue,
                    {
                      color: field.value ? colors.black : colors.blackOpacity(0.5),
                      fontSize: responsiveFontSize(1.7),
                      fontWeight: field.value ? '500' : '400',
                      lineHeight: responsiveFontSize(2.4),
                    }
                  ]}>
                    {field.value || 'Not Provided'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default function ProfileOverview() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  useStatusBarStyle('dark-content')
  const { user, isDriver, isTransporter } = useSelector((state: any) => state?.user) || {}
  const colors = useColor()
  const safeAreaInsets = useSafeAreaInsets()
  const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale()
  const navigation = useNavigation<NavigatorProp>()

  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<any[]>([])

  // Fetch locations data on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locRes = await axiosInstance.get(END_POINTS.GETSTATES)
        if (locRes?.data?.status) {
          setLocations(locRes.data.data)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }
    fetchLocations()
  }, [])

  // Fetch latest user data on focus
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        setLoading(true)
        try {
          console.log('=== PROFILE OVERVIEW REFRESH ===');
          const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE)
          if (profile?.data?.status) {
            console.log('=== PROFILE OVERVIEW DATA ===');
            console.log('Operational_Segment:', profile?.data?.data?.Operational_Segment);
            console.log('operational_segment:', profile?.data?.data?.operational_segment);
            console.log('Industry_Segment:', profile?.data?.data?.Industry_Segment);
            console.log('industry_segment:', profile?.data?.data?.industry_segment);
            console.log('Full user data:', JSON.stringify(profile?.data?.data, null, 2));

            dispatch(userAction(profile?.data))
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchUserData()
    }, [])
  )

  const navigateToEdit = (stepId?: string) => {
    if (stepId) {
      // Navigate to the new ProfileEditNew screen with specific step
      navigation.navigate(STACKS.PROFILE_EDIT_NEW, { stepId });
    } else {
      // Navigate to regular profile edit
      if (isDriver) {
        navigation.navigate(STACKS.PROFILE_EDIT)
      } else if (isTransporter) {
        navigation.navigate(STACKS.PROFILE_EDIT_TRANSPORTER)
      }
    }
  }

  const formatVehicleTypes = (vehicleType: any): string => {
    return getVehicleTypeNames(vehicleType)
  }

  const formatDrivingExperience = (experience: any): string => {
    return getDrivingExperienceLabel(experience)
  }

  const formatOperationalSegment = (segment: any): string => {
    console.log('=== FORMAT OPERATIONAL SEGMENT ===');
    console.log('Input segment value:', segment);
    console.log('Input segment type:', typeof segment);

    if (!segment) {
      console.log('No segment value, returning "Not Provided"');
      return 'Not Provided'
    }

    // Handle comma-separated values
    if (typeof segment === 'string') {
      const segments = segment.split(',').map(s => s.trim()).filter(Boolean)
      console.log('Parsed segments array:', segments);

      // Map internal values to display names
      const segmentMap: Record<string, string> = {
        'ecommerce': 'E-commerce',
        'white_goods': 'White Goods',
        'livestock': 'Livestock',
        'perishable': 'Perishable',
        'oversized': 'Oversized',
        'fuel_tanker': 'Fuel Tanker',
        'automobile_carrier': 'Automobile Carrier',
        'construction': 'Construction',
        'refrigerator': 'Refrigerator',
        'others': 'Others'
      }

      const displayNames = segments.map(seg => {
        const mapped = segmentMap[seg] || seg;
        console.log(`Mapping "${seg}" -> "${mapped}"`);
        return mapped;
      });

      const result = displayNames.join(', ');
      console.log('Final formatted result:', result);
      return result;
    }

    console.log('Non-string segment, returning as string:', String(segment));
    return String(segment)
  }

  const formatRoutes = (routes: any): string => {
    console.log('=== FORMAT ROUTES ===');
    console.log('Input routes value:', routes);
    console.log('Input routes type:', typeof routes);

    if (!routes) {
      console.log('No routes value, returning "Not Provided"');
      return 'Not Provided'
    }

    // Handle comma-separated values
    if (typeof routes === 'string') {
      const routesList = routes.split(',').map(r => r.trim()).filter(Boolean)
      console.log('Parsed routes array:', routesList);

      // Map internal values to display names
      const routesMap: Record<string, string> = {
        'local': 'Local',
        'intracity': 'Intracity',
        'intercity': 'Intercity',
        'interstate': 'Interstate',
        'national': 'National',
        'international': 'International'
      }

      const displayNames = routesList.map(route => {
        const mapped = routesMap[route] || route;
        console.log(`Mapping "${route}" -> "${mapped}"`);
        return mapped;
      });

      const result = displayNames.join(', ');
      console.log('Final formatted routes result:', result);
      return result;
    }

    console.log('Non-string routes, returning as string:', String(routes));
    return String(routes)
  }

  const formatAverageKm = (avgKm: any): string => {
    if (!avgKm) return 'Not Provided'

    // Map internal values to display names
    const avgKmMap: Record<string, string> = {
      'less_1000': '< 1000 km',
      '1000_3000': '1000 - 3000 km',
      '3000_5000': '3000 - 5000 km',
      '5000_10000': '5000 - 10000 km',
      '10000_plus': '10000+ km'
    }

    return avgKmMap[avgKm] || avgKm
  }

  const formatYearsOfOperation = (years: any): string => {
    if (!years) return 'Not Provided'

    // Map internal values to display names
    const yearsMap: Record<string, string> = {
      'less_than_1': 'Less than 1 year',
      '1-2': '1-2 years',
      '3-5': '3-5 years',
      '6-10': '6-10 years',
      '10+': '10+ years'
    }

    return yearsMap[years] || `${years} years`
  }

  const formatPreferredLocation = (location: any): string => {
    return getPreferredLocationName(location, locations);
  }

  const formatEndorsements = (endorsements: any): string => {
    return getLicenseEndorsementNames(endorsements)
  }

  const formatDate = (date: any): string => {
    if (!date) return 'Not Provided'
    return moment(date).format('DD MMMM YYYY')
  }

  const formatSalaryRange = (range: string): string => {
    if (!range) return 'Not Provided'
    return `₹${range}`
  }

  const getImageUri = (imagePath: string | undefined): string | undefined => {
    if (!imagePath) return undefined
    return `${BASE_URL}public/${imagePath}`
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Space height={safeAreaInsets.top} />
        <ActivityIndicator size="large" color={colors.royalBlue} />
        <Text style={[styles.loadingText, { color: colors.blackOpacity(0.6) }]}>
          {t('loadingProfile') || 'Loading Profile...'}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <Space height={safeAreaInsets.top} />

      {/* Header - Same as AvailableJob */}
      <View style={{
        backgroundColor: colors.white,
        paddingHorizontal: responsiveWidth(4),
        paddingVertical: responsiveHeight(1.5),
        borderBottomWidth: 1,
        borderBottomColor: colors.blackOpacity(0.05),
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              height: responsiveFontSize(4.5),
              width: responsiveFontSize(4.5),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.royalBlue + '12',
              borderRadius: responsiveFontSize(2.25),
            }}
          >
            <Ionicons name={'chevron-back'} size={22} color={colors.royalBlue} />
          </TouchableOpacity>

          {/* Centered Title */}
          <Text style={{
            fontSize: responsiveFontSize(2.2),
            color: colors.black,
            fontWeight: '700',
            letterSpacing: -0.3,
            flex: 1,
            textAlign: 'center',
          }}>
            {t('profileOverview') || 'Profile Overview'}
          </Text>

          {/* Edit Button (replacing filter) */}
          <TouchableOpacity
            // onPress={() => navigateToEdit()}
            activeOpacity={1}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.royalBlue + '10',
              paddingHorizontal: responsiveFontSize(1.5),
              paddingVertical: responsiveFontSize(0.8),
              borderRadius: responsiveFontSize(1),
            }}
          >
            <Feather name={'edit-2'} size={18} color={colors.royalBlue} />
            <Text style={{
              color: colors.royalBlue,
              fontSize: responsiveFontSize(1.6),
              fontWeight: '600',
              marginLeft: responsiveFontSize(0.5),
            }}>
              {t('edit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{
          backgroundColor: colors.background,
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: responsiveHeight(4),
          paddingTop: responsiveHeight(2),
        }}
      >
        {/* Profile Photo Section */}
        <FieldGroupCard
          title={t('profilePhoto') || 'Profile Photo'}
          icon="person-circle"
          stepId="avatar"
          fields={[
            {
              label: t('profilePhoto') || 'Profile Photo',
              value: '',
              isImage: true,
              imageUri: getImageUri(user?.images),
            }
          ]}
          onEdit={navigateToEdit}
        />

        {/* Personal Information Section */}
        <FieldGroupCard
          title={t('personalInformation') || 'Personal Information'}
          icon="person"
          stepId="personal_info"
          fields={[
            {
              label: t('fullName') || 'Full Name',
              value: user?.name,
            },
            {
              label: t('e-mail') || 'Email',
              value: user?.email,
            },
            {
              label: t('mobile') || 'Mobile',
              value: user?.mobile,
            },
            ...(isDriver ? [{
              label: t('fatherName') || 'Father Name',
              value: user?.Father_Name,
            }] : []),
          ]}
          onEdit={navigateToEdit}
        />

        {/* Driver-only sections */}
        {isDriver && (
          <>
            {/* Date of Birth Section - Separate step */}
            <FieldGroupCard
              title={t('dateOfBirth') || 'Date of Birth'}
              icon="calendar"
              stepId="dob"
              fields={[
                {
                  label: t('dateOfBirth') || 'Date of Birth',
                  value: formatDate(user?.DOB),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Gender & Marital Status Section - Same step in profile edit */}
            <FieldGroupCard
              title={t('genderMaritalStatus') || 'Gender & Marital Status'}
              icon="person"
              stepId="gender"
              fields={[
                {
                  label: t('gender') || 'Gender',
                  value: user?.Sex,
                },
                {
                  label: t('maritalStatus') || 'Marital Status',
                  value: user?.Marital_Status,
                },
              ]}
              onEdit={navigateToEdit}
            />
          </>
        )}

        {/* Transporter-only sections */}
        {isTransporter && (
          <>
            {/* Transport Name Section */}
            <FieldGroupCard
              title={t('transportName') || 'Transport Name'}
              icon="business"
              stepId="transport_details"
              fields={[
                {
                  label: t('transportName') || 'Transport Name',
                  value: user?.Transport_Name,
                },
              ]}
              onEdit={navigateToEdit}
            />
          </>
        )}

        {/* Education Section - Separate step for drivers only */}
        {isDriver && (
          <FieldGroupCard
            title={t('educationStep') || 'Education'}
            icon="school"
            stepId="education"
            fields={[
              {
                label: t('educationStep') || 'Education',
                value: user?.Highest_Education || user?.education,
              },
            ]}
            onEdit={navigateToEdit}
          />
        )}

        {/* Address Section */}
        <FieldGroupCard
          title={t('addressInformation') || 'Address Information'}
          icon="home"
          stepId="address"
          fields={[
            {
              label: t('address') || 'Address',
              value: user?.address,
            },
            {
              label: t('city') || 'City',
              value: user?.city,
            },
            {
              label: t('pincode') || 'Pincode',
              value: user?.pincode,
            },
            {
              label: t('state') || 'State',
              value: user?.state_name || getStateName(user?.states) || getStateName(user?.state),
            },
          ]}
          onEdit={navigateToEdit}
        />

        {/* Vehicle Information Section */}
        <FieldGroupCard
          title={t('vehicleInformation') || 'Vehicle Information'}
          icon="car"
          iconLibrary="MaterialCommunityIcons"
          stepId="vehicle"
          fields={[
            {
              label: t('vehicleType') || 'Vehicle Type',
              value: formatVehicleTypes(user?.Vehicle_Type || user?.vehicle_type),
            },
          ]}
          onEdit={navigateToEdit}
        />

        {/* Driver Specific Fields */}
        {isDriver && (
          <>
            {/* Experience Section - driving experience and preferred location */}
            <FieldGroupCard
              title={t('experience') || 'Experience'}
              icon="briefcase"
              stepId="experience"
              fields={[
                {
                  label: t('drivingExperience') || 'Driving Experience',
                  value: formatDrivingExperience(user?.Driving_Experience),
                },
                {
                  label: t('preferredLocation') || 'Preferred Location',
                  value: formatPreferredLocation(user?.Preferred_Location),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* License Type Section - separate step */}
            <FieldGroupCard
              title={t('licenseType') || 'License Type'}
              icon="card"
              stepId="license_type"
              fields={[
                {
                  label: t('licenseType') || 'License Type',
                  value: user?.Type_of_License,
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* License Endorsements Section - separate step */}
            <FieldGroupCard
              title={t('licenseEndorsements') || 'License Endorsements'}
              icon="checkmark-circle"
              stepId="endorsement"
              fields={[
                {
                  label: t('licenseEndorsements') || 'License Endorsements',
                  value: formatEndorsements(user?.licence_endorsement || user?.Licence_Endorsement),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Salary Information Section */}
            <FieldGroupCard
              title={t('salaryInformation') || 'Salary Information'}
              icon="cash"
              stepId="salary"
              fields={[
                {
                  label: t('currentMonthlyIncome') || 'Current Monthly Income',
                  value: formatSalaryRange(user?.Current_Monthly_Income),
                },
                {
                  label: t('expectedMonthlyIncome') || 'Expected Monthly Income',
                  value: formatSalaryRange(user?.Expected_Monthly_Income),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Job Preferences Section */}
            <FieldGroupCard
              title={t('jobPreferences') || 'Job Preferences'}
              icon="settings"
              stepId="preferences"
              fields={[
                {
                  label: t('jobPlacement') || 'Job Placement',
                  value: user?.job_placement === 'yes' ? t('yes') : user?.job_placement === 'no' ? t('no') : user?.job_placement,
                },
                {
                  label: t('previousEmployer') || 'Previous Employer',
                  value: user?.previous_employer === 'yes' ? t('yes') : user?.previous_employer === 'no' ? t('no') : user?.previous_employer,
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Aadhar Documents Section */}
            {/* <FieldGroupCard
              title={t('aadharDocuments') || 'Aadhar Documents'}
              icon="card"
              stepId="aadhar_details"
              fields={[
                {
                  label: t('aadharNumber') || 'Aadhar Number',
                  value: user?.Aadhar_Number,
                },
                {
                  label: t('aadharPhoto') || 'Aadhar Photo',
                  value: '',
                  isImage: true,
                  imageUri: getImageUri(user?.Aadhar_Photo),
                },
              ]}
              onEdit={navigateToEdit}
            /> */}

            {/* License Documents Section */}
            <FieldGroupCard
              title={t('licenseDocuments') || 'License Documents'}
              icon="card"
              stepId="license_details"
              fields={[
                {
                  label: t('licenseNumber') || 'License Number',
                  value: user?.License_Number,
                },
                {
                  label: t('licenseExpiryDate') || 'License Expiry Date',
                  value: formatDate(user?.Expiry_date_of_License),
                },
                {
                  label: t('drivingLicense') || 'Driving License',
                  value: '',
                  isImage: true,
                  imageUri: getImageUri(user?.Driving_License),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* PAN Documents Section */}
            <FieldGroupCard
              title={t('panDocuments') || 'PAN Documents'}
              icon="card"
              stepId="pan_details"
              fields={[
                {
                  label: t('panNumber') || 'PAN Number',
                  value: user?.PAN_Number,
                },
                {
                  label: t('panImage') || 'PAN Image',
                  value: '',
                  isImage: true,
                  imageUri: getImageUri(user?.PAN_Image),
                },
              ]}
              onEdit={navigateToEdit}
            />
          </>
        )}

        {/* Transporter Specific Fields */}
        {isTransporter && (
          <>
            {/* Years of Operation Section */}
            <FieldGroupCard
              title={t('yearsOfOperation') || 'Years of Operation'}
              icon="calendar"
              stepId="year_of_exp"
              fields={[
                {
                  label: t('yearsOfOperation') || 'Years of Operation',
                  value: formatYearsOfOperation(user?.Year_of_Establishment),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Fleet Size Section */}
            <FieldGroupCard
              title={t('fleetSize') || 'Fleet Size'}
              icon="car-multiple"
              iconLibrary="MaterialCommunityIcons"
              stepId="fleet_size"
              fields={[
                {
                  label: t('fleetSize') || 'Fleet Size',
                  value: user?.Fleet_Size || 'Not Provided',
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Operational Segment Section */}
            <FieldGroupCard
              title={t('operationalSegment') || 'Operational Segment'}
              icon="briefcase"
              stepId="industry_segment"
              fields={[
                {
                  label: t('operationalSegment') || 'Operational Segment',
                  value: formatOperationalSegment(user?.Operational_Segment || user?.operational_segment || user?.Industry_Segment || user?.industry_segment),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* Routes Section */}
            {/* <FieldGroupCard
              title={t('routes') || 'Routes'}
              icon="map"
              stepId="operational_segment"
              fields={[
                {
                  label: t('routes') || 'Routes',
                  value: formatRoutes(user?.routes || user?.operational_segment),
                },
              ]}
              onEdit={navigateToEdit}
            /> */}

            {/* Average Km Run Section */}
            <FieldGroupCard
              title={t('averageKmRun') || 'Average Km Run'}
              icon="speedometer"
              stepId="avg_km_run"
              fields={[
                {
                  label: t('averageKmRun') || 'Average Km Run',
                  value: formatAverageKm(user?.Average_KM || user?.Average_Km || user?.average_km || user?.avg_km_run || user?.average_run),
                },
              ]}
              onEdit={navigateToEdit}
            />

            {/* PAN & GST Documents Section - Combined */}
            <FieldGroupCard
              title={t('panGstDocuments') || 'PAN & GST Documents'}
              icon="card"
              stepId="pan_gst"
              fields={[
                {
                  label: t('panNumber') || 'PAN Number',
                  value: user?.PAN_Number,
                },
                {
                  label: t('panImage') || 'PAN Image',
                  value: '',
                  isImage: true,
                  imageUri: getImageUri(user?.PAN_Image),
                },
                {
                  label: t('gstNumber') || 'GST Number',
                  value: user?.GST_Number,
                },
                {
                  label: t('gstCertificate') || 'GST Certificate',
                  value: '',
                  isImage: true,
                  imageUri: getImageUri(user?.GST_Certificate),
                },
              ]}
              onEdit={navigateToEdit}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  fieldCard: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCardContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fieldsContainer: {
    marginTop: 0,
  },
  fieldRow: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldValueContainer: {
    minHeight: 28,
    justifyContent: 'center',
  },
  fieldValue: {
    fontWeight: '500',
    lineHeight: 24,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  fieldImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
})