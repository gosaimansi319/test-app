import { createSlice } from "@reduxjs/toolkit";
import { fetchAdminNotifications, fetchNotificationsCount, fetchUserNotifications, notificationsReadAll } from "./notificationThunk";

const initialState = {
  notifications: [],
  notificationCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchAdminNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchNotificationsCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsCount.fulfilled, (state, action) => {
        state.loading = false;
        state.notificationCount = action.payload;
      })
      .addCase(fetchNotificationsCount.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(notificationsReadAll.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(notificationsReadAll.fulfilled, (state, action) => {
        // state.loading = false;
        state.notificationCount = 0;
      })
      .addCase(notificationsReadAll.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default notificationSlice.reducer;
