import toast from "react-hot-toast";
import {
  useGetApi
} from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

// Get recent orders with pagination
export const getRecentOrders = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/orders?page=1&limit=5`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


// Get recent users with pagination
export const getRecentUsers = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/recent-users`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get order comments
export const getOrderComments = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/recent-comments`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get chart1 Data 
export const chart1Data = async (start_date, end_date) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/weekly-order-count?start_date=${start_date || ''}&end_date=${end_date || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get chart2 Data 
export const chart2Data = async (start_date, end_date) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/orders-counts?start_date=${start_date || ''}&end_date=${end_date || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get chart3 Data 
export const chart3Data = async (start_date, end_date) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/weekly-activity?start_date=${start_date || ''}&end_date=${end_date || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get stats for dashboard 
export const getStats = async (filter_type) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/orders-status?filter_type=${filter_type || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get stats for dashboard 
export const getCDCStats = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/CDC_details`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get manager resolved details
export const getManagerOrders = async (start_date, end_date) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/manager_orders_details?start_date=${start_date || ''}&end_date=${end_date || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// get overall order details
export const getOrderStats = async (start_date, end_date) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/dashboard/orders-stats?start_date=${start_date || ''}&end_date=${end_date || ''}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};