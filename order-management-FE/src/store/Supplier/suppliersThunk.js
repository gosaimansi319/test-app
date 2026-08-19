import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { bulkDeleteSuppliers, createSupplier, deleteSupplier, getAllSuppliers } from "../../Api/supplier";

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllSuppliers(params);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch suppliers");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createNewSupplier = createAsyncThunk(
  "suppliers/createSupplier",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createSupplier(formData);
      toast.success(response.data.message || "Supplier created successfully");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating supplier");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSupplierById = createAsyncThunk(
  "suppliers/deleteSupplier",
  async (supplierId, { rejectWithValue }) => {
    try {
      await deleteSupplier(supplierId);
      return supplierId;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting supplier");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkDeleteSupplier = createAsyncThunk(
  "suppliers/bulkDeleteSupplier",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await  bulkDeleteSuppliers(page, limit);
      toast.success(response.data.message || "Suppliers deleted successfully");
      return response.data.data; // contains { deletedCount, page, limit }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting Suppliers");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);