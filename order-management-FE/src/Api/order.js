import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePostApi, usePutApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getAllOrders = async (params) => {
  try {
   const query = new URLSearchParams(params).toString();
    const response = await useGetApi(`${API_BASE_URL}/orders?${query}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getOrderByProduct = async (params) => {
  try {
    const { product_id, page, limit } = params;
    const response = await useGetApi(`${API_BASE_URL}/orders/orders-by-product/${product_id}?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getPriceHistory = async (params) => {
  try {
    const { product_id, page, limit } = params;
    const response = await useGetApi(`${API_BASE_URL}/product/updated-prices/${product_id}?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createOrderApi = async (formData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/orders/create`,formData);
    if (response.status !== 201){
      toast.error(response?.response?.data?.message);
    } else {
       toast.success("Order Created successfully");
    }
    return response?.data;
  } catch (error) {
    return error;
  }
};

export const updateOrder = async (userId, userData) => {
  try {
    const response = await usePutApi(`${API_BASE_URL}/orders/update/${userId}`, userData);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/orders/delete/${orderId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


export const getOrder = async (orderId) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/orders/${orderId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Bulk delete users by page
export const bulkDeleteOrders = async (page, limit) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/orders/delete-all?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};
