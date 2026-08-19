import { createSlice } from "@reduxjs/toolkit";
import { fetchUserDetailSetting, updateUserSetting } from "./settingThunk";

const initialState = {
  setting: [],
  loading: false,
  error: null,
};

const settingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetailSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDetailSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.setting = action.payload;
      })
      .addCase(fetchUserDetailSetting.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateUserSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.setting = action.payload;
      })
      .addCase(updateUserSetting.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default settingSlice.reducer;
