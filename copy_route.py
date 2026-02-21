import re

source = "src/app/layouts/main/transporter-added-driver/tracking/index.tsx"
target = "src/app/layouts/Trucker/ActiveTrip/index.tsx"

with open(source, 'r') as f:
    src_content = f.read()

with open(target, 'r') as f:
    tgt_content = f.read()

# 1. Imports
imports_block = """import { fetchDirections } from 'src/utils/maps/google.apis';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';

const ROUTE_COLORS = ['#2874F0', '#F39C12', '#26A541', '#E74C3C', '#9B59B6'];

"""
# Need to insert right before "// ── Classic Color Palette"
tgt_content = tgt_content.replace("// ── Classic Color Palette", imports_block + "// ── Classic Color Palette")

# 2. Icons
icons_block = """const RouteIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18" />
        <Path d="M8 6H18V16" />
    </Svg>
);

const ClockIcon = ({ color = C.textSec }) => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

"""
tgt_content = tgt_content.replace("// Skeleton Components", icons_block + "// Skeleton Components")

# 3. States
states_block = """    // Route selection states
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [decodedRoutes, setDecodedRoutes] = useState<{ latitude: number; longitude: number }[][]>([]);
    const [fetchingRoutes, setFetchingRoutes] = useState(false);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
    const [selectedTripRoute, setSelectedTripRoute] = useState<any | null>(null);
    const [selectedTripRoutePoints, setSelectedTripRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
    const routeMapRef = useRef<MapView>(null);

"""
tgt_content = tgt_content.replace("    // Get user from Redux", states_block + "    // Get user from Redux")

# 4. Functions
# Get functions from source
funcs_match = re.search(r'(    // Decode Google Maps encoded polyline.*?    // Format duration text for display\n.*?})\n', src_content, re.DOTALL)
if funcs_match:
    functions_block = funcs_match.group(1)
    # Insert functions before updateStatusWithAPI
    tgt_content = tgt_content.replace("    const updateStatusWithAPI", functions_block + "\n\n    const updateStatusWithAPI")
else:
    print("Could not find functions in source")

# 5. Modify updateStatus to call fetchAvailableRoutes instead of handleStartTrip
# The Trucker active trip updateStatus looks like:
#         if (currentStatus === 1) {
#             if (!trip.trip_started) {
#                 // Start Trip first
#                 handleStartTrip();
#             } else {
tgt_content = tgt_content.replace("                // Start Trip first\n                handleStartTrip();", "                // Start Trip first -> Show route selection\n                setShowRouteModal(true);\n                fetchAvailableRoutes();")


# 6. Extract Route Modal UI from source
modal_match = re.search(r'(            {/\* Route Selection Modal - Full Screen with Map \*/}.*?            </Modal>)', src_content, re.DOTALL)
if modal_match:
    modal_block = modal_match.group(1)
    # Insert before {/* Bility Upload Modal */} instead of Assign Vehicle because activeTrip index has Bility. Let's insert before Bility Upload Modal if it exists, else end of file
    if "{/* Assign Vehicle Modal */}" in tgt_content:
        tgt_content = tgt_content.replace("            {/* Assign Vehicle Modal */}", modal_block + "\n\n            {/* Assign Vehicle Modal */}")
    else:
        print("Assign Vehicle Modal not found")
else:
    print("Could not find Route Selection Modal in source")

# 7. Extract Modal Styles from source
# The styles start after: // Confirm Modal
styles_match = re.search(r'(    // Route Modal & Map\n    routeMapContainer: \{.*?\n    \},)', src_content, re.DOTALL)
if styles_match:
    styles_block = styles_match.group(1)
    # Insert styles before closing bracket of StyleSheet.create
    tgt_content = tgt_content.replace("\n});", "\n\n" + styles_block + "\n});")
else:
    print("Could not find styles in source")

# Check if Map Marker styles are missing
if "    mapMarker:" not in tgt_content:
    map_marker_styles = """
    // Route Selection Modal
    routeModalContainer: { flex: 1, backgroundColor: C.bg },
    routeMapContainer: { flex: 1.5, position: 'relative' },
    routeMapTopBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 0 : 40, paddingBottom: 16,
    },
    routeMapBackBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    routeMapTitleBadge: {
        backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        marginLeft: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    routeMapTitleText: { fontSize: 14, fontWeight: '600', color: C.text },
    routeMapLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center', alignItems: 'center',
    },
    routeMapLoadingText: { marginTop: 12, fontSize: 14, fontWeight: '500', color: C.text },
    mapMarker: { alignItems: 'center', justifyContent: 'center' },
    mapMarkerInner: {
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
    },
    mapMarkerText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    routeBottomSheet: {
        backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20,
    },
    routeCardsScroll: { paddingHorizontal: 16, paddingBottom: 16 },
    routeMapCard: {
        width: Dimensions.get('window').width * 0.75,
        backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginRight: 12,
        borderWidth: 1, borderColor: C.border,
    },
    routeMapCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    routeColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    routeMapCardName: { flex: 1, fontSize: 16, fontWeight: '600', color: C.textSec },
    fastestBadge: {
        backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    fastestBadgeText: { fontSize: 10, fontWeight: '600', color: C.success },
    routeMapCardStats: { flexDirection: 'row', alignItems: 'center' },
    routeDetailDivider: { width: 1, height: 12, backgroundColor: '#D1D5DB', marginHorizontal: 12 },
    routeMapCardStatValue: { fontSize: 14, fontWeight: '500', color: C.text },
    routeBottomActions: { paddingHorizontal: 20, paddingTop: 8 },
    routeStartBtn: {
        backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        width: '100%',
    },
    routeStartBtnText: { color: C.surface, fontSize: 16, fontWeight: '600', marginLeft: 8 },
"""
    tgt_content = tgt_content.replace("\n});", "\n" + map_marker_styles + "\n});")

with open(target, 'w') as f:
    f.write(tgt_content)

print("Done copying")
