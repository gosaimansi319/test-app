import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePatchApi, usePostApi, usePutApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getAllOrders = async (params) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await useGetApi(`${API_BASE_URL}/orders/user-orders?${query}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createOrderApi = async (formData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/orders/user-create`,formData);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
 
    const response = await usePutApi(`${API_BASE_URL}/orders/user-orders/${orderId}`, orderData);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const requestReturnApi = async (orderId,productId, orderData) => {
  try {
 
    const response = await usePostApi(`${API_BASE_URL}/orders/user-orders/return/${orderId}/${productId}`, orderData);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


export const deleteOrder = async (orderId) => {
  try {
    const response = await usePatchApi(`${API_BASE_URL}/orders/user-orders/delete/${orderId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const cancelOrderApi = async (orderId) => {
try {
    const response = await usePatchApi(`${API_BASE_URL}/orders/user-orders/cancel/${orderId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
}


export const getOrder = async (orderId) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/orders/user-orders/${orderId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};



// Bulk delete users by page
export const bulkDeleteOrders = async (page, limit) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/orders/user-orders/delete-all?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};