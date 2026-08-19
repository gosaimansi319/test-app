import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePostApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;


export const getAllSuppliers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await useGetApi(`${API_BASE_URL}/suppliers?${query}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createSupplier = async (formData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/suppliers/create`, formData);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteSupplier = async (supplierId) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/suppliers/delete/${supplierId}`);
    if (response.status !== 200) 
       toast.error(response?.response?.data?.message);
    else
       toast.success(response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};


// Bulk delete users by page
export const bulkDeleteSuppliers = async (page, limit) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/suppliers/delete-all?page=${page}&limit=${limit}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};