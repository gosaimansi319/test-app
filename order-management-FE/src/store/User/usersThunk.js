import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { bulkDeleteUsers, createUser, deleteUser, getAllUsers, getUserById, updateUser } from "../../Api/user";

// Fetch all users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      // const { page = 1, limit = 10 } = params;
      const response = await getAllUsers(params);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch user by ID
export const fetchUserById = createAsyncThunk(
    "users/fetchUserById",
    async (userId, { rejectWithValue }) => {
      try {
        const response = await getUserById(userId);
        return response.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch user details");
        return rejectWithValue(error.response?.data || error.message);
      }
    }
);

// Create new user
export const createNewUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await createUser(userData);
      
      // toast.success(response.data.message || "User created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating user");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update user
export const updateUserById = createAsyncThunk(
  "users/updateUser",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await updateUser(userId, userData);
      toast.success(response.message || "User updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating user");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete user
export const deleteUserById = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await deleteUser(userId);
      if (response) toast.success(response?.data?.message || "User deleted successfully");
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Bulk delete users by page
export const bulkDeleteUsersByPage = createAsyncThunk(
  "users/bulkDeleteByPage",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await bulkDeleteUsers(page, limit);
      toast.success(response.data.message || "Users deleted successfully");
      return response.data.data; // contains { deletedCount, page, limit }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);