import { createSlice } from "@reduxjs/toolkit";
import {
  bulkDeleteSupplier,
  createNewSupplier,
  deleteSupplierById,
  fetchSuppliers,
} from "./suppliersThunk";

const initialState = {
  suppliers: [],
  pagination: {},
  loading: false,
  error: null,
};

const supplierSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH SUPPLIERS
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload?.suppliers;
        state.pagination = action.payload?.pagination;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE SUPPLIER
      .addCase(createNewSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers.unshift(action.payload); // add new supplier to top
      })
      .addCase(createNewSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE SUPPLIER
      .addCase(deleteSupplierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter(
          (supplier) => supplier._id !== action.payload
        );
      })
      .addCase(deleteSupplierById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk  SUPPLIER
      .addCase(bulkDeleteSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter(
          (supplier) => supplier._id !== action.payload
        );
      })
      .addCase(bulkDeleteSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default supplierSlice.reducer;
