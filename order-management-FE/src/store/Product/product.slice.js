import { createSlice } from "@reduxjs/toolkit";
import { bulkDeleteByPage, createNewProduct, createSector, deleteProductById, fetchProducts, fetchSectors } from "./productsThunk";

const initialState = {
  products: [],
  sectors:[],
  pagination: {},
  loading: false,
  error: null,
};

const productlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE PRODUCT
      .addCase(createNewProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createNewProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (product) => product.id !== action.payload
        );
      })
      .addCase(deleteProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(bulkDeleteByPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteByPage.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update product list if stored
        state.products = state.products.slice(action.payload.deletedCount); 
      })
      .addCase(bulkDeleteByPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
 
      .addCase(fetchSectors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectors.fulfilled, (state, action) => {
        state.loading = false;
        state.sectors = action.payload;
      })
      .addCase(fetchSectors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // CREATE PRODUCT
      .addCase(createSector.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSector.fulfilled, (state, action) => {
        state.loading = false;
        state.sectors.unshift(action.payload);
      })
      .addCase(createSector.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default productlice.reducer;
