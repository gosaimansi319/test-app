import { useEffect, useRef, useState } from "react";
import PermissionIcon from "../../../assets/svg/permission-icon.svg";
import Edit from "../../../assets/svg/editIcon.svg";
import Delete from "../../../assets/svg/delete-icon.svg";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import CloseIcon from "../../../assets/svg/closeIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoles,
  updateExistingRole,
  removeRole,
  addNewRole,
} from "../../../store/Roles/rolesThunk";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import { Tooltip } from "@material-tailwind/react";
import { Loader } from "../../../components/commen/Loader";
import PageLoader from "../../../components/commen/PageLoader";

export default function RolesandPermissionsList() {
  const dispatch = useDispatch();
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [recentlyAddedRoleId, setRecentlyAddedRoleId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  // Edit role modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editPermissions, setEditPermissions] = useState({});

  // New Permission modal state for newly created role
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newRolePermissions, setNewRolePermissions] = useState({});
  const [newRoleForPermissions, setNewRoleForPermissions] = useState(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  const modules = ["Product", "Order", "User"];
  const permissionTypes = ["Create", "Read", "Update", "Delete"];

  const handleAddRole = () => {
    if (!newRole.trim()) return;

    // Create a new role object for the API
    const roleData = {
      name: newRole,
      permissions: {},
    };

    // Initialize permissions
    modules.forEach((module) => {
      roleData.permissions[module] = {
        Create: false,
        Read: false,
        Update: false,
        Delete: false,
      };
    });

    // Dispatch the addNewRole action
    dispatch(addNewRole(roleData))
      .unwrap()
      .then((response) => {
        setRecentlyAddedRoleId(response._id);

        // Initialize the newly created role for permission setting
        const newRoleObj = {
          _id: response._id,
          name: newRole,
          permissions: {},
        };

        // Initialize permissions for the new role
        modules.forEach((module) => {
          newRoleObj.permissions[module] = {
            Create: false,
            Read: false,
            Update: false,
            Delete: false,
          };
        });

        setNewRoleForPermissions(newRoleObj);
        setNewRolePermissions({ ...newRoleObj.permissions });
      })
      .catch((error) => {
        console.error("Failed to create role:", error);
      });
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditPermissions({ ...role.permissions });
    setShowEditModal(true);
    setActionMenuId(null);
  };

  const handleSaveEdit = () => {
    if (!editRoleName.trim()) return;

    // Prepare the updated role data for dispatch
    const roleData = {
      name: editRoleName,
      permissions: editPermissions,
    };

    // Dispatch the updateExistingRole action
    dispatch(updateExistingRole({ roleId: editingRole._id, roleData }))
      .unwrap()
      .then(() => {
        setShowEditModal(false);
        dispatch(fetchRoles());
      })
      .catch((error) => {
        console.error("Failed to update role:", error);
      });
  };

  // Open delete confirmation modal
  const openDeleteModal = (roleId) => {
    setDeleteRoleId(roleId);
    // setDeleteRoleName(roleName);
    setShowDeleteModal(true);
    setActionMenuId(null);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    dispatch(removeRole(deleteRoleId))
      .unwrap()
      .then(() => {
        setShowDeleteModal(false);
        setDeleteRoleId(null);
        // setDeleteRoleName("");
      })
      .catch((error) => {
        console.error("Failed to delete role:", error);
        setShowDeleteModal(false);
      });
  };

  const togglePermission = (module, permissionType, isNewRole = false) => {
    if (isNewRole) {
      setNewRolePermissions((prev) => ({
        ...prev,
        [module]: {
          ...prev[module],
          [permissionType]: !prev[module]?.[permissionType],
        },
      }));
    } else {
      setEditPermissions((prev) => ({
        ...prev,
        [module]: {
          ...prev[module],
          [permissionType]: !prev[module]?.[permissionType],
        },
      }));
    }
  };

  // Toggle all permissions for a module
  const toggleAllModulePermissions = (module, isNewRole = false) => {
    if (isNewRole) {
      const allChecked = permissionTypes.every(
        (type) => newRolePermissions[module]?.[type]
      );

      const newValue = !allChecked;
      const updatedModulePermissions = {};

      permissionTypes.forEach((type) => {
        updatedModulePermissions[type] = newValue;
      });

      setNewRolePermissions((prev) => ({
        ...prev,
        [module]: updatedModulePermissions,
      }));
    } else {
      const allChecked = permissionTypes.every(
        (type) => editPermissions[module]?.[type]
      );

      const newValue = !allChecked;
      const updatedModulePermissions = {};

      permissionTypes.forEach((type) => {
        updatedModulePermissions[type] = newValue;
      });

      setEditPermissions((prev) => ({
        ...prev,
        [module]: updatedModulePermissions,
      }));
    }
  };

  // Open the permission modal for the newly created role
  const openPermissionModal = () => {
    setShowPermissionModal(true);
  };

  // Handle saving permissions for the newly created role
  const handleSaveNewRolePermissions = () => {
    // if (!newRoleForPermissions || !newRoleForPermissions._id) return;

    const roleData = {
      name: newRoleForPermissions?.name || newRole,
      permissions: newRolePermissions,
    };

    setShowPermissionModal(false);
    if (newRoleForPermissions || newRoleForPermissions?._id) {
      dispatch(
        updateExistingRole({ roleId: newRoleForPermissions._id, roleData })
      )
        .unwrap()
        .then(() => {
          setShowPermissionModal(false);
          setRecentlyAddedRoleId(null);
          setNewRole("");
          dispatch(fetchRoles());
        })
        .catch((error) => {
          console.error("Failed to update role permissions:", error);
        });
    } else {
      // debugger
      dispatch(addNewRole(roleData))
        .unwrap()
        .then(() => {
          setShowPermissionModal(false);
          setRecentlyAddedRoleId(null);
          setNewRole("");
          dispatch(fetchRoles());
        })
        .catch((error) => {
          console.error("Failed to create role with permissions:", error);
        });
    }
  };

  // Close the modal when clicking outside
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showEditModal) {
        setShowEditModal(false);
      }
      if (showPermissionModal) {
        setShowPermissionModal(false);
      }
    }
  };

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const rolesState = useSelector((state) => state.roles);
  const { roles: apiRoles, loading, updateLoading, createLoading } = rolesState;

  useEffect(() => {
    if (apiRoles && apiRoles.length > 0) {
      const transformedRoles = apiRoles.map((role) => {
        // Initialize permissions object with all modules and CRUD operations set to false
        const permissionsObj = {};
        modules.forEach((module) => {
          permissionsObj[module.toLowerCase()] = {
            Create: false,
            Read: false,
            Update: false,
            Delete: false,
          };
        });

        // Update permissions based on API response
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((perm) => {
            const moduleKey = perm.module.toLowerCase();

            if (permissionsObj[moduleKey]) {
              // Map actions array to individual CRUD properties
              if (Array.isArray(perm.actions)) {
                perm.actions.forEach((action) => {
                  const actionKey =
                    action.charAt(0).toUpperCase() +
                    action.slice(1).toLowerCase();
                  if (permissionTypes.includes(actionKey)) {
                    permissionsObj[moduleKey][actionKey] = true;
                  }
                });
              }
            }
          });
        }

        // Capitalize module names for UI consistency
        const formattedPermissions = {};
        Object.keys(permissionsObj).forEach((moduleKey) => {
          const capitalizedKey =
            moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
          formattedPermissions[capitalizedKey] = permissionsObj[moduleKey];
        });

        return {
          _id: role._id,
          name: role.name,
          status: role.status || "Active",
          users: role.total_users || 0,
          permissions: formattedPermissions,
        };
      });

      setRoles(transformedRoles);
    }
  }, [apiRoles]);

  const actionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActionMenuId(null);
      }
    };

    if (actionMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionMenuId]);
  return (
    <>
      {/* Header with Create Role button */}
      <div className="mx-auto mb-5 boxShadow">
        <div>
          <h2 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-4">
            Roles & Permissions
          </h2>
          <h2 className="formField-headTitle text-base sm:text-xl md:text-2xl">
            Create Role
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-5 mt-5 md:flex-nowrap">
            <div className="w-full">
              <label htmlFor="role" className="formField-label">
                Role
              </label>
              <input
                type="text"
                placeholder="Enter role"
                value={newRole}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[a-zA-Z]*$/.test(value)) {
                    setNewRole(value);
                  }
                }}
                className="formField-inputBox w-full"
              />
            </div>
            <div className="md:mt-9 flex items-center gap-2.5 mr-3">
              <button
                className={`text-[#888888] font-medium underline-offset-1 text-nowrap ${
                  !newRole.trim() ? "opacity-50 cursor-default" : ""
                }`}
                onClick={() => {
                  if (newRole.trim()) openPermissionModal();
                }}
                disabled={!newRole.trim()}
              >
                <span className="underline underline-offset-2">
                  Set Permission
                </span>
              </button>

              <Tooltip content="Set permission link will be enabled once the role is added">
                <img src={PermissionIcon} alt="PermissionIcon" />
              </Tooltip>
            </div>
          </div>

          {/* for buttons */}
          <div className="flex justify-between gap-5 mt-5 md:justify-end">
            <button
              className="formField-btn"
              onClick={() => {
                setNewRole("");
                setRecentlyAddedRoleId(null);
              }}
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              className="formField-btn bg-[#3D3D3D] text-white"
              onClick={handleAddRole}
              disabled={createLoading || recentlyAddedRoleId}
            >
              {createLoading ? (
                <div className="">
                  <Loader />
                </div>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="p-5 boxShadow custom-scrollbar">
        <div>
          {loading ? (
            <PageLoader />
          ) : (
            <table className="md:w-full w-[600px]">
              <thead>
                <tr>
                  <th className="table-title">Roles</th>
                  <th className="table-title">Total Users</th>
                  <th className="table-title">Status</th>
                  <th className="table-title">Action</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role._id} className="border-t">
                    <td className="table-data">{role.name}</td>
                    <td className="table-data">{role.users}</td>
                    <td className="table-data">
                      <span
                        className={`py-[2px] px-2.5 text-sm font-medium rounded-full ${
                          role.status === "Active"
                            ? "bg-[#E3F5E3] text-[#358438]"
                            : "bg-[#FFEBEE] text-[#C62828]"
                        }`}
                      >
                        {role.status}
                      </span>
                    </td>
                    <td className="relative table-data">
                      <button
                        onClick={() =>
                          setActionMenuId((prev) =>
                            prev === role._id ? null : role._id
                          )
                        }
                        className="p-2"
                      >
                        <img src={VarticalDotIcon} alt="icon" />
                      </button>
                      {actionMenuId === role._id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute md:right-[90%] right-[75%] top-[-20px] z-10 max-w-[116px] w-full bg-white border boxShadow flex flex-col gap-5 p-3"
                        >
                          <button
                            onClick={() => openEditModal(role)}
                            className="flex gap-2.5 items-center text-base font-normal text-[#212121] leading-[26px]"
                          >
                            <img src={Edit} alt="Edit" />
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(role._id, role.name)}
                            className="flex gap-2.5 items-center text-base font-normal leading-[26px] text-[#C62828] disabled:text-[#ef9a9a] disabled:opacity-100 disabled:cursor-default"
                            disabled={true}
                          >
                            <img
                              src={Delete}
                              alt="Delete"
                              className="opacity-50"
                            />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-[15px]"
          onClick={handleModalBackdropClick}
        >
          <div className="w-full max-w-[500px] boxShadow p-0 bg-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium leading-[30px] text-[#212121]">
                  Edit Role
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500"
                >
                  <img src={CloseIcon} alt="closeIcon" />
                </button>
              </div>

              <div className="mt-5">
                <label className="formField-label">Role</label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="formField-inputBox"
                  disabled={true}
                />
              </div>

              <div className="mt-5 custom-scrollbar">
                <table className="table-auto text-sm font-medium w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="table-title">Module</th>
                      <th className="table-title">All</th>
                      {permissionTypes.map((type) => (
                        <th key={type} className="table-title">
                          {type}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {modules.map((module, index) => {
                      const isLast = index === modules.length - 1;
                      const cellClass = `py-[11px] pl-2.5 text-base font-normal text-[#454545] text-start ${
                        isLast ? "" : "border-b border-[#E7E7E7]"
                      }`;

                      // Check if all permissions are checked for this module
                      const allChecked = permissionTypes.every(
                        (type) => editPermissions[module]?.[type]
                      );

                      return (
                        <tr key={module}>
                          <td className={cellClass + " font-medium"}>
                            {module}
                          </td>
                          <td className={cellClass}>
                            <input
                              id="checkbox"
                              type="checkbox"
                              checked={allChecked}
                              onChange={() =>
                                toggleAllModulePermissions(module)
                              }
                            />
                          </td>
                          {permissionTypes.map((type) => (
                            <td key={`${module}-${type}`} className={cellClass}>
                              <input
                                id="checkbox"
                                type="checkbox"
                                checked={
                                  editPermissions[module]?.[type] || false
                                }
                                onChange={() => togglePermission(module, type)}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-4 border-t border-[#E7E7E7] p-5">
              <button
                onClick={() => setShowEditModal(false)}
                className="formField-btn"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="formField-btn bg-[#3D3D3D] text-white"
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <div className="">
                    <Loader />
                  </div>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Permission Modal for Newly Created Role */}
      {showPermissionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-[15px]"
          onClick={handleModalBackdropClick}
        >
          <div className="w-full max-w-[500px] boxShadow p-0 bg-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium leading-[30px] text-[#212121]">
                  Set Permission
                </h3>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="text-gray-500"
                >
                  <img src={CloseIcon} alt="closeIcon" />
                </button>
              </div>

              <div className="mt-5 custom-scrollbar">
                <table className="table-auto text-sm font-medium w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="table-title">Module</th>
                      <th className="table-title">All</th>
                      {permissionTypes.map((type) => (
                        <th key={type} className="table-title">
                          {type}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {modules.map((module, index) => {
                      const isLast = index === modules.length - 1;
                      const cellClass = `py-[11px] pl-2.5 text-base font-normal text-[#454545] text-start ${
                        isLast ? "" : "border-b border-[#E7E7E7]"
                      }`;

                      // Check if all permissions are checked for this module
                      const allChecked = permissionTypes.every(
                        (type) => newRolePermissions[module]?.[type]
                      );

                      return (
                        <tr key={module}>
                          <td className={cellClass + " font-medium"}>
                            {module}
                          </td>
                          <td className={cellClass}>
                            <input
                              id="checkbox"
                              type="checkbox"
                              checked={allChecked}
                              onChange={() =>
                                toggleAllModulePermissions(module, true)
                              }
                            />
                          </td>
                          {permissionTypes.map((type) => (
                            <td key={`${module}-${type}`} className={cellClass}>
                              <input
                                id="checkbox"
                                type="checkbox"
                                checked={
                                  newRolePermissions[module]?.[type] || false
                                }
                                onChange={() =>
                                  togglePermission(module, type, true)
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-4 border-t border-[#E7E7E7] p-5">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="formField-btn"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewRolePermissions}
                className="formField-btn bg-[#3D3D3D] text-white"
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <div className="">
                    <Loader />
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        orderId={deleteRoleId}
        modelTitle="Role"
      />
    </>
  );
}
