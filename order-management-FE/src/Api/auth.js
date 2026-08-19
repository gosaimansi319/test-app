import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api/auth`;

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const forgetPassword = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email,
    });
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const resetPassword = async (
  token,
  email,
  newPassword,
  confirmPassword
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reset-password?token=${token}`,
      {
        email,
        password: newPassword,
        confirmPassword,
      }
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      name,
      email,
      password,
      role_id: "user",
    });
    if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};
