import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import {
  createOrderApi,
  deleteOrder,
  getAllOrders,
  bulkDeleteOrders,
  updateOrder,
  getOrder,
  requestReturnApi,
  cancelOrderApi,
} from "../../Api/userOrder";

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllOrders(params);
      return response.data;
    } catch (error) {
      toast.error(response.message || "Failed to fetch suppliers");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createOrderApi(formData);
      // toast.success("Order Created successfully");
      return response.data;
    } catch (error) {
      toast.error(response.message || "Failed to fetch suppliers");
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
      toast.error(response.message || "Error updating Order");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const requestReturn = createAsyncThunk(
  "orders/updateOrder",
  async ({ orderId, productId, orderData }, { rejectWithValue }) => {
    try {
      const response = await requestReturnApi(orderId, productId, orderData);
      toast.success(response.data.message || "Return Request successfully");
      return response.data;
    } catch (error) {
      toast.error(response.message || "Error while Return request ");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async ({ orderId }, { rejectWithValue }) => {
    try {
      const response = await cancelOrderApi(orderId);
      toast.success(response.data.message || "Order Cancelled successfully");
      return response.data;
    } catch (error) {
      toast.error(response.message || "Error while Cancelling Ordering ");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteOrderById = createAsyncThunk(
  "orders/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await deleteOrder(orderId);
      toast.success(response.data.message || "Order deleted successfully");
      return orderId;
    } catch (error) {
      toast.error(response.message || "Error deleting Order");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrderById = createAsyncThunk(
  "orders/getOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await getOrder(orderId);
      // toast.success(response.data.message || "Order fetched successfully");
      return response.data;
    } catch (error) {
      toast.error(response.message || "Error fetching Order");
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
      return response.data.data;
    } catch (error) {
      toast.error(response.message || "Error deleting Orders");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
