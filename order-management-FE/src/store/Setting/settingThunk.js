import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUserDetails, updateSetting } from "../../Api/setting";

export const fetchUserDetailSetting = createAsyncThunk(
    "setting/fetchUserDetailSetting",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserDetails();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const updateUserSetting = createAsyncThunk(
    "setting/updateSetting",
  async (formData, { rejectWithValue }) => {
    try {
      
      const response = await updateSetting(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

