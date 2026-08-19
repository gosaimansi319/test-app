import { createSlice } from "@reduxjs/toolkit";
import {
  bulkDeleteOrder,
  createOrder,
  deleteOrderById,
  fetchOrders,
  fetchPriceHistory,
  getOrderById,
  getOrdersByProductId,
  updateOrderById,
} from "./ordersThunk";

const initialState = {
  orders: [],
  productOrders: [],
  priceHistory: [],
  priceHistoryLoading: false,
  orderById: {},
  pagination: {},
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH SUPPLIERS
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.orders;
        state.pagination = action.payload?.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH PRODUCT ORDERS
      .addCase(getOrdersByProductId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersByProductId.fulfilled, (state, action) => {
        state.loading = false;
        state.productOrders = action.payload?.orders;
        state.pagination = action.payload?.pagination;
      })
      .addCase(getOrdersByProductId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE ORDER
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        // state.orders = action.payload?.orders;
        state.pagination = action.payload?.pagination;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // DELETE SUPPLIER
      .addCase(deleteOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload
        );
      })
      .addCase(deleteOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk  SUPPLIER
      .addCase(bulkDeleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload
        );
      })
      .addCase(bulkDeleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk  SUPPLIER
      .addCase(updateOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload
        );
      })
      .addCase(updateOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET ORDER BY ID
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.orderById = action.payload;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // GET ORDER BY ID
      .addCase(fetchPriceHistory.pending, (state) => {
        state.priceHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchPriceHistory.fulfilled, (state, action) => {
        state.priceHistoryLoading = false;
        state.priceHistory = action.payload;
      })
      .addCase(fetchPriceHistory.rejected, (state, action) => {
        state.priceHistoryLoading = false;
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;
