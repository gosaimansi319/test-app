import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createCenterCostApi,
  createCompaniesApi,
  createDepartmentApi,
  deleteCenterCostApi,
  deleteCompaniesApi,
  deleteDepartmentApi,
  getAllCompanies,
  getAllDepartments,
  getCenterCost,
} from "../../Api/company";

export const fetchCompanies = createAsyncThunk(
  "companies/fetchCompanies",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllCompanies();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const fetchDepartments = createAsyncThunk(
  "companies/fetchDepartments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllDepartments();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const fetchCenterCostByDept = createAsyncThunk(
  "companies/fetchCenterCost",
  async (deptId, { rejectWithValue }) => {
    try {
      const response = await getCenterCost(deptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCompanies = createAsyncThunk(
  "companies/createCompanies",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCompaniesApi(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createDepartment = createAsyncThunk(
  "companies/createDepartment",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createDepartmentApi(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCenterCost = createAsyncThunk(
  "companies/createCenterCost",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCenterCostApi(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteCompanies = createAsyncThunk(
  "companies/deleteCompanies",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteCompaniesApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "companies/deleteDepartment",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteDepartmentApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteCenterCost = createAsyncThunk(
  "companies/deleteCenterCost",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteCenterCostApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);