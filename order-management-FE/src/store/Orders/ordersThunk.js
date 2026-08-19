import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrderApi,
  deleteOrder,
  getAllOrders,
  bulkDeleteOrders,
  updateOrder,
  getOrder,
  getPriceHistory,
  getOrderByProduct,
} from "../../Api/order";
import toast from "react-hot-toast";

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPriceHistory = createAsyncThunk(
  "orders/fetchPriceHistory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getPriceHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createOrderApi(formData);
      return response?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateOrderById = createAsyncThunk(
  "orders/updateOrder",
  async ({ orderId, orderData }, { rejectWithValue }) => {
    try {
      const response = await updateOrder(orderId, orderData);
      toast.success(response.data.message || "Order updated successfully");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteOrderById = createAsyncThunk(
  "orders/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      await deleteOrder(orderId);
      return orderId;
    } catch (error) {
      toast.error("Error deleting Order");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrderById = createAsyncThunk(
  "orders/getOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await getOrder(orderId);
      return response.data;
    } catch (error) {
      toast.error("Error fetching Order");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrdersByProductId = createAsyncThunk(
  "orders/getOrdersByProduct",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getOrderByProduct(params);
      toast.success(response.data.message || "Order fetched successfully");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkDeleteOrder = createAsyncThunk(
  "orders/bulkDeleteOrders",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await bulkDeleteOrders(page, limit);
      toast.success(response.data.message || "Orders deleted successfully");
      return response.data.data; // contains { deletedCount, page, limit }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
