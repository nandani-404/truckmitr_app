import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Driver {
    id: number;
    name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    state_name: string;
    created_at: string;
    payment_type: string | null;
    profile_completion_percentage: number;
}

interface PilotsState {
    allPilots: Driver[];
    selectedPilot: Driver | null;
    loading: boolean;
    lastUpdated: number | null;
}

const initialState: PilotsState = {
    allPilots: [],
    selectedPilot: null,
    loading: false,
    lastUpdated: null,
};

const pilotsSlice = createSlice({
    name: 'pilots',
    initialState,
    reducers: {
        setPilots: (state, action: PayloadAction<Driver[]>) => {
            state.allPilots = action.payload;
            state.lastUpdated = Date.now();
            state.loading = false;
        },
        updatePilotInList: (state, action: PayloadAction<Driver>) => {
            const index = state.allPilots.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.allPilots[index] = action.payload;
            }
        },
        setSelectedPilot: (state, action: PayloadAction<Driver | null>) => {
            state.selectedPilot = action.payload;
        },
        setPilotsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        clearPilotsData: (state) => {
            state.allPilots = [];
            state.selectedPilot = null;
            state.lastUpdated = null;
            state.loading = false;
        }
    },
});

export const {
    setPilots,
    updatePilotInList,
    setSelectedPilot,
    setPilotsLoading,
    clearPilotsData
} = pilotsSlice.actions;

export default pilotsSlice.reducer;
