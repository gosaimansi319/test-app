import { createSlice } from "@reduxjs/toolkit";
import {
  
  getAllreviews,
  likePublicComment,

} from "./commentThunk";

const initialState = {
  reviews:[],
  comments: [],
  pagination: {},
  loading: false,
  error: null,
};

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        // Like Comment
      .addCase(likePublicComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likePublicComment.fulfilled, (state, action) => {
        state.loading = false;
        // state.suppliers.unshift(action.payload); // add new supplier to top
      })
      .addCase(likePublicComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
         // Like Comment
      .addCase(getAllreviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllreviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
      })
      .addCase(getAllreviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default commentSlice.reducer;
