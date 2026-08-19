import { createAsyncThunk } from "@reduxjs/toolkit";
import { addReviewsApi, deleteReviewsApi, getAllReviewsApi, getReviewsByProductId, likePrivateCommentApi, likePublicCommentApi, postPrivateCommentApi, postPublicCommentApi, updateReviewsApi } from "../../Api/comments";

export const postPublicComment = createAsyncThunk(
  "comments/postPublicComment",
  async ({orderId,productId,data}, { rejectWithValue }) => {
    try {
      const response = await postPublicCommentApi(orderId,productId,data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const likePublicComment = createAsyncThunk(
  "comments/likePublicComment",
  async ({orderId,commentId,productId}, { rejectWithValue }) => {
    try {
      const response = await likePublicCommentApi(orderId,commentId,productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const postPrivateComment = createAsyncThunk(
  "comments/postPublicComment",
  async ({id , data}, { rejectWithValue }) => {
    try {
      const response = await postPrivateCommentApi(id,data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const likePrivateComment = createAsyncThunk(
  "comments/likePublicComment",
  async ({orderId,commentId,data}, { rejectWithValue }) => {
    try {
      const response = await likePrivateCommentApi(orderId,commentId,data);
      return response?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



export const getAllreviews = createAsyncThunk(
  "reviews/getAllReviews",
  async ({orderId,productId}, { rejectWithValue }) => {
    try {
      const response = await getAllReviewsApi(orderId,productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addReview = createAsyncThunk(
  "reviews/addReview",
  async ({productId,orderId,reviewData}, { rejectWithValue }) => {
    try {
      const response = await addReviewsApi(productId,orderId,reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({orderId,reviewId,reviewData}, { rejectWithValue }) => {
    try {
      const response = await updateReviewsApi(orderId,reviewId,reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/updateReview",
  async ({orderId,reviewId}, { rejectWithValue }) => {
    try {
      const response = await deleteReviewsApi(orderId,reviewId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getProductReviews = createAsyncThunk(
  "reviews/getProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await getReviewsByProductId(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
