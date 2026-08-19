import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePostApi, usePutApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getAllProducts = async (params) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await useGetApi(`${API_BASE_URL}/product?${query}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getProductsAll = async (params) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/product/products-data`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


export const getProductById = async (id) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/product/${id}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Create a product
export const createProduct = async (formData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/product/create`, formData, true);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateProduct = async (id,formData) => {
  try {
    const response = await usePutApi(`${API_BASE_URL}/product/update/${id}`, formData);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


export const createSectorApi = async (data) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/sectors/create`, data);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/product/delete/${productId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

// Delete All Products by Page
export const bulkDeleteProductsByPage = async (page, limit) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/product/delete-all?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getAllSectors = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/sectors`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};