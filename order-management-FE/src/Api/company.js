import toast from "react-hot-toast";
import { useDeleteApi, useGetApi, usePostApi } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const getAllCompanies = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/company`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createCompaniesApi = async (data) => {
  try {
    const response = await usePostApi(`${API_BASE_URL}/company/create`, data);
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getAllDepartments = async () => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/department`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createDepartmentApi = async (data) => {
  try {
    const response = await usePostApi(
      `${API_BASE_URL}/department/create`,
      data
    );
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getCenterCost = async (id) => {
  try {
    const response = await useGetApi(
      `${API_BASE_URL}/centercost/by-departments/${id}`
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createCenterCostApi = async (data) => {
  try {
    const response = await usePostApi(
      `${API_BASE_URL}/centercost/create`,
      data
    );
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteCompaniesApi = async (id) => {
  try {
    const response = await useDeleteApi( `${API_BASE_URL}/company/delete/${id}`
    );
  if (response.status !== 200){
      toast.error(response?.response?.data?.message);
    } else{
      toast.success("Company Cost deleted")
    }
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteDepartmentApi = async (id) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/department/delete/${id}`
    );
if (response.status !== 200){
      toast.error(response?.response?.data?.message);
    } else{
      toast.success("Department deleted")
    }
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteCenterCostApi = async (id) => {
  try {
    const response = await useDeleteApi(`${API_BASE_URL}/centercost/delete/${id}`);
    if (response.status !== 200){
      toast.error(response?.response?.data?.message);
    } else{
      toast.success("Center Cost deleted")
    }
    return response.data;
  } catch (error) {
    return error;
  }
};
