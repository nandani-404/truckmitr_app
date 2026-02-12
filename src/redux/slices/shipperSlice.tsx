import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Material {
    id: number;
    name: string;
    parent_id: string | null;
    children?: Material[];
}

interface ShipperState {
    materials: Material[];
}

const initialState: ShipperState = {
    materials: [],
};

const shipperSlice = createSlice({
    name: 'shipper',
    initialState,
    reducers: {
        setMaterials: (state, action: PayloadAction<Material[]>) => {
            state.materials = action.payload;
        },
    },
});

export const { setMaterials } = shipperSlice.actions;
export default shipperSlice.reducer;
