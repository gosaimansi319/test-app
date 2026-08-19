import { useGetApi, usePatchApiFormData } from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api/auth`;

export const updateSetting = async (formData) => {
  try {
    const apiUrl = `${API_BASE_URL}/update-profile`;
    const data = await usePatchApiFormData(apiUrl, formData);
    return data;
  } catch (error) {
    return error;
  }
};
 
export const getUserDetails = async (formData) => {
  try {
    const apiUrl = `${API_BASE_URL}/user-details`;
    const data = await useGetApi(apiUrl, formData);
    return data;
  } catch (error) {
    return error;
  }
};