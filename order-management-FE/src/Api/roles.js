import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePostApi, usePutApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getAllRoles = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/roles/ids`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getAllRole = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/roles`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/roles/create`, roleData);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateRole = async (roleId, roleData) => {
  try {
    const response = await usePutApi(`${API_BASE_URL}/roles/update/${roleId}`, roleData);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteRole = async (roleId) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/roles/delete/${roleId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};