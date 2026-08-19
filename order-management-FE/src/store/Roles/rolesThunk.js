import { createAsyncThunk } from "@reduxjs/toolkit";
import { createRole, deleteRole, getAllRole, getAllRoles, updateRole } from "../../Api/roles";
import toast from "react-hot-toast";

export const fetchRoleIds = createAsyncThunk(
  "roles/fetchRoleIds",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllRoles();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllRole();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addNewRole = createAsyncThunk(
  "roles/addNewRole",
  async (roleData, { rejectWithValue }) => {
    try {
      // Format the role data for the API
      const formattedData = {
        name: roleData.name,
        permissions: []
      };
      
      // Transform permissions from object to array format required by API
      Object.entries(roleData.permissions || {}).forEach(([module, actions]) => {
        const enabledActions = [];
        if (actions.Create) enabledActions.push("create");
        if (actions.Read) enabledActions.push("read");
        if (actions.Update) enabledActions.push("update");
        if (actions.Delete) enabledActions.push("delete");
        
        if (enabledActions.length > 0) {
          formattedData.permissions.push({
            module: module.toLowerCase(),
            actions: enabledActions
          });
        }
      });
      
      const response = await createRole(formattedData);
      
      if (response?.status === "success") {
        toast.success("Role created successfully");
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create role");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateExistingRole = createAsyncThunk(
  "roles/updateExistingRole",
  async ({ roleId, roleData }, { rejectWithValue }) => {
    try {
      // Format the role data for the API
      const formattedData = {
        name: roleData.name,
        permissions: []
      };
      
      // Transform permissions from object to array format required by API
      Object.entries(roleData.permissions || {}).forEach(([module, actions]) => {
        const enabledActions = [];
        if (actions.Create) enabledActions.push("create");
        if (actions.Read) enabledActions.push("read");
        if (actions.Update) enabledActions.push("update");
        if (actions.Delete) enabledActions.push("delete");
        
        if (enabledActions.length > 0) {
          formattedData.permissions.push({
            module: module.toLowerCase(),
            actions: enabledActions
          });
        }
      });
      
      const response = await updateRole(roleId, formattedData);
      
      if (response.status === "success") {
        toast.success("Role updated successfully");
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update role");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeRole = createAsyncThunk(
  "roles/removeRole",
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await deleteRole(roleId);
      
      if (response.status === "success") {
        toast.success("Role deleted successfully");
        return roleId;
      } else {
        throw new Error(response.message || "Failed to delete role");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);