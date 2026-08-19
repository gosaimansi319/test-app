import { useGetApi, usePatchApiFormData } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getUserNotifications = async (formData) => {
  try {
    const apiUrl = `${API_BASE_URL}/notification`;
    const data = await useGetApi(apiUrl, formData);
    
    return data;
  } catch (error) {
    return error;
  }
};

export const getAdminNotifications = async (formData) => {
  try {
    const apiUrl = `${API_BASE_URL}/notification/admin`;
    const data = await useGetApi(apiUrl, formData);
    return data;
  } catch (error) {
    return error;
  }
};

export const getNotificationsCount = async () => {
  try {
    const apiUrl = `${API_BASE_URL}/notification/unread-count`;
    const data = await useGetApi(apiUrl);
    return data;
  } catch (error) {
    return error;
  }
};

export const allNotificationsRead = async () => {
  try {
    const apiUrl = `${API_BASE_URL}/notification/allread`;
    const data = await usePatchApiFormData(apiUrl);
    return data;
  } catch (error) {
    return error;
  }
};

