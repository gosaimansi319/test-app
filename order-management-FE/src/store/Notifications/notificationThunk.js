import { createAsyncThunk } from "@reduxjs/toolkit";
import { allNotificationsRead, getAdminNotifications, getNotificationsCount, getUserNotifications } from "../../Api/notifications";

export const fetchUserNotifications = createAsyncThunk(
    "notification/fetchUserNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserNotifications();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdminNotifications = createAsyncThunk(
    "notification/fetchAdminNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAdminNotifications();   
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchNotificationsCount = createAsyncThunk(
    "notification/fetchNotificationCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getNotificationsCount();   
      return response?.data.data?.unreadCount;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const notificationsReadAll = createAsyncThunk(
    "notification/notificationsReadAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await allNotificationsRead();   
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

