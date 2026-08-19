import toast from "react-hot-toast";
import {
  useDeleteApi,
  useGetApi,
  usePatchApi,
  usePatchApiFormData,
  usePostApi,
  usePutApi,
} from "../hook/apiHook";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

export const postPublicCommentApi = async (orderId, productId, data) => {
  try {
    const response = await usePostApi(
      `${API_BASE_URL}/orders/public-comment/${orderId}/${productId}`,
      data
    );
    // if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const likePublicCommentApi = async (orderId, commentId, productId) => {
  try {
    const response = await usePatchApiFormData(
      `${API_BASE_URL}/orders/${orderId}/public-comments/${commentId}/like/${productId}`
    );
    // if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const postPrivateCommentApi = async (id, data) => {
  try {
    const response = await usePostApi(
      `${API_BASE_URL}/orders/private-comments/${id}`,
      data
    );
    // if (response.status !== 201) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const likePrivateCommentApi = async (orderId, commentId,data) => {
  try {
    const response = await usePatchApi(
      `${API_BASE_URL}/orders/${orderId}/private-comments/${commentId}/like`,data
    );
    // if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getAllReviewsApi = async (orderId,productId) => {
  try {
    const response = await useGetApi(
      `${API_BASE_URL}/orders/user-orders/review/${orderId}/${productId}`
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addReviewsApi = async (productId, orderId, reviewData) => {
  try {
    const response = await usePostApi(
      `${API_BASE_URL}/orders/user-orders/review/${orderId}/${productId}`,
      reviewData
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateReviewsApi = async (orderId, reviewId, reviewData) => {
  try {
    const response = await usePutApi(
      `${API_BASE_URL}/orders/user-orders/${orderId}/review/${reviewId}`,
      reviewData
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteReviewsApi = async (orderId, reviewId) => {
  try {
    const response = await useDeleteApi(
      `${API_BASE_URL}/orders/user-orders/${orderId}/review/${reviewId}`
    );
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getReviewsByProductId = async (productId) => {
  try {
    const response = await useGetApi(`${API_BASE_URL}/orders/user-orders/commentbyproduct/${productId}`);
    if (response.status !== 200) return toast.error(response?.response?.data?.message);
    return response.data;
  } catch (error) {
    return error;
  }
};