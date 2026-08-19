import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCompanies,
  fetchDepartments,
  fetchCenterCostByDept,
  createDepartment,
} from "./companyThunk";

const initialState = {
  companies: [],
  departments: [],
  centerCost:[],
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: "companies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH COMPANIES
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // FETCH DEPARTMENTS
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // FETCH CENTER COST BY DEPARTMENT
      .addCase(fetchCenterCostByDept.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCenterCostByDept.fulfilled, (state, action) => {
        state.loading = false;
        state.centerCost = action.payload;
      })
      .addCase(fetchCenterCostByDept.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default companySlice.reducer;
