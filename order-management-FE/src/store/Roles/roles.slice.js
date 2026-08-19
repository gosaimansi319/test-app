import { createSlice } from "@reduxjs/toolkit";
import {
  fetchRoleIds,
  fetchRoles,
  addNewRole,
  updateExistingRole,
  removeRole,
} from "./rolesThunk";

const initialState = {
  roles: [],
  roleIds: [],
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearRoleErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Role IDs
      .addCase(fetchRoleIds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleIds.fulfilled, (state, action) => {
        state.loading = false;
        state.roleIds = action.payload;
      })
      .addCase(fetchRoleIds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Role
      .addCase(addNewRole.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(addNewRole.fulfilled, (state, action) => {
        state.createLoading = false;
        state.roles.push(action.payload);
      })
      .addCase(addNewRole.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // Update Role
      .addCase(updateExistingRole.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateExistingRole.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.roles.findIndex(
          (role) => role._id === action.payload._id
        );
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(updateExistingRole.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })

      // Delete Role
      .addCase(removeRole.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(removeRole.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.roles = state.roles.filter((role) => role._id !== action.payload);
      })
      .addCase(removeRole.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRoleErrors } = roleSlice.actions;
export default roleSlice.reducer;
