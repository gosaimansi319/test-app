import toast from "react-hot-toast";
import {
  useDeleteApi,
  useGetApi,
  usePostApi,
  usePutApi,
} from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

// Get all users with pagination
export const getAllUsers = async (params) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await useGetApi(`${API_BASE_URL}/users?${query}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/users/${userId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Create a user
export const createUser = async (userData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/users/create`, userData);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Update a user
export const updateUser = async (userId, userData) => {
  try {
    const response = await usePutApi(
      `${API_BASE_URL}/users/update/${userId}`,
      userData
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Delete a user
export const deleteUser = async (userId) => {
  try {
    const response = await useDeleteApi(
      `${API_BASE_URL}/users/delete/${userId}`
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Bulk delete users by page
export const bulkDeleteUsers = async (page, limit) => {
  try {
    const response = await useDeleteApi(
      `${API_BASE_URL}/users/delete-all?page=${page}&limit=${limit}`
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};
