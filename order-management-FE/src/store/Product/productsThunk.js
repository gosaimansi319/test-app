import { createAsyncThunk } from "@reduxjs/toolkit";
import { bulkDeleteProductsByPage, createProduct, createSectorApi, deleteProduct, getAllProducts, getAllSectors, getProductsAll } from "../../Api/product";
import toast from "react-hot-toast";

export const fetchProducts = createAsyncThunk(
  "products/fetchproducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  "products/fetchproductsAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getProductsAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create Product
export const createNewProduct = createAsyncThunk(
  "products/createProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createProduct(formData);
      toast.success(response.data.message || "Product created successfully");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteProductById = createAsyncThunk(
  "products/deleteProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await deleteProduct(productId);
      toast.success(response.data.message || "Product deleted successfully");
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkDeleteByPage = createAsyncThunk(
  "products/bulkDeleteByPage",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await bulkDeleteProductsByPage(page, limit);
      toast.success(response.message || "Products deleted successfully");
      return response.data; // contains { deletedCount, page, limit }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSectors = createAsyncThunk(
  "products/fetchSectors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllSectors();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create Product
export const createSector = createAsyncThunk(
  "products/createSector",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createSectorApi(data);
      toast.success(response.data.message || "Sector created successfully");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);