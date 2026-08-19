import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import viewDetailIcon from "../../../assets/svg/view-detail.svg";
import deleteIocn from "../../../assets/svg/delete-icon.svg";
import {
  bulkDeleteUsersByPage,
  deleteUserById,
  fetchUserById,
  fetchUsers,
} from "../../../store/User/usersThunk";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import Pagination from "../../../components/commen/Pagination";
import FilterButton from "../../../assets/svg/FilterButton.svg";
import { useNavigate } from "react-router-dom";
import UserFilterPopup from "../../../components/commen/UserFilterPopup";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import PageLoader from "../../../components/commen/PageLoader";

const UserList = () => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  // Filter states
  const [showFilter, setShowFilter] = useState(false);

   const [filterValueParams,setFilterValueParams] = useState({})

  const dispatch = useDispatch();

  const users = useSelector((state) => state.users?.users);
  useEffect(() => {
    setLoading(true);
    dispatch(fetchUsers({ page: currentPage, limit: itemsPerPage, ...filterValueParams }))
      .then((res) => {
        if (res.payload) {
          if (res.payload.pagination) {
            setTotalItems(res.payload.pagination.total_items);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [dispatch, currentPage, itemsPerPage]);

  const handleConfirmDelete = () => {
    setDeleteLoading(true);
    const isBulkDelete =
      selectedIds.length > 1 && selectedIds.length === users.length;
    const idsToDelete = deleteUserId ? [deleteUserId] : selectedIds;

    if (isBulkDelete) {
      dispatch(
        bulkDeleteUsersByPage({ page: currentPage, limit: itemsPerPage })
      )
        .unwrap()
        .then(() => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteUserId(null);
          setDeleteLoading(false);
          dispatch(fetchUsers({ page: currentPage, limit: itemsPerPage })).then(
            (res) => {
              if (res.payload?.pagination) {
                setTotalItems(res.payload.pagination.total_items);
              }
            }
          );
        });
    } else {
      Promise.all(idsToDelete.map((id) => dispatch(deleteUserById(id)))).then(
        () => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteUserId(null);
          setDeleteLoading(false);
          dispatch(fetchUsers({ page: currentPage, limit: itemsPerPage })).then(
            (res) => {
              if (res.payload?.pagination) {
                setTotalItems(res.payload.pagination.total_items);
              }
            }
          );
        }
      );
    }
  };

  // Methods
  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users?.map((user) => user._id));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Filter handlers
  const handleApplyFilter = (filterData) => {
    setShowFilter(false); // Hide the filter popup

    const filterParams = {
      page: 1,
      limit: itemsPerPage,
      name: filterData.name || undefined,
      role_name: filterData.role || undefined,
      status: filterData.status.toLowerCase() || undefined,
    };

    // Remove undefined values
    Object.keys(filterParams).forEach(
      (key) => filterParams[key] === undefined && delete filterParams[key]
    );
    setLoading(true);

    dispatch(fetchUsers(filterParams))
      .then((res) => {
        if (res.payload?.pagination) {
          setTotalItems(res.payload.pagination.total_items);
          setCurrentPage(1);
        }
      })
      .then(() => {
        setLoading(false);
      });
  };

  const handleRemoveFilter = () => {
    setShowFilter(false);

    const defaultParams = {
      page: 1,
      limit: itemsPerPage,
    };
    setLoading(true);
    dispatch(fetchUsers(defaultParams))
      .then((res) => {
        if (res.payload?.pagination) {
          setTotalItems(res.payload.pagination.total_items);
          setCurrentPage(1);
        }
      })
      .then(() => {
        setLoading(false);
      });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor = "bg-green-100";
    let textColor = "text-green-600";

    if (status?.toLowerCase() === "inactive") {
      bgColor = "bg-[#FFF2C5]"; // Tailwind doesn't recognize this unless you extend it
      textColor = "text-[#E27100]";
    } else if (status === "Suspended") {
      bgColor = "bg-red-100";
      textColor = "text-red-600";
    } else if (status === "Download") {
      bgColor = "bg-gray-100";
      textColor = "text-gray-600";
    }

    return (
      <span
        className={`px-2.5 py-[2px] text-xs font-medium rounded-full leading-[22px] capitalize  ${bgColor} ${textColor}`}
      >
        {status}
      </span>
    );
  };

  const handleViewEditUser = (id) => {
    dispatch(fetchUserById(id));
    navigate("/admin/users/view-updateusers", { state: { id: id } });
  };

  const filterRef = useRef(null);

  const handleClickOutside = (event) => {
    if (filterRef.current && !filterRef.current.contains(event.target)) {
      setShowFilter(false);
    }
  };

  useEffect(() => {
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  return (
    <div className="boxShadow">
      <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
        Users
      </h3>

      <div className="flex items-center justify-between gap-5 pt-5 md:justify-end sm:pt-0">
        {selectedIds.length > 0 && (
          <button
            className="formField-btn flex gap-[10px]"
            onClick={() => setShowDeleteModal(true)}
          >
            <img src={deleteIocn} alt="deleteIcon" /> ({selectedIds.length})
          </button>
        )}
        <button
          className="formField-btn"
          onClick={() => navigate("/admin/users/createusers")}
        >
          Create User
        </button>
        <span className="relative" ref={filterRef}>
          <img
            src={FilterButton}
            alt="FilterButton"
            className="cursor-pointer"
            onClick={() => setShowFilter(!showFilter)}
          />
          <UserFilterPopup
            show={showFilter}
            onApply={handleApplyFilter}
            onClear={handleRemoveFilter}
            onClose={() => setShowFilter(false)}
          />
        </span>
      </div>

      <div className="mt-5 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <table className="min-w-full border-separate border-spacing-0 table-auto">
          <thead className="sticky top-0">
            <tr>
              <th className="w-10 px-2 py-3 text-left">
                <input
                  id="checkbox"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    users.length > 0 && selectedIds.length === users.length
                  }
                />
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                User ID
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Profile
              </th>
              <th className="table-title font-bold whitespace-nowrap">Name</th>
              <th className="table-title font-bold whitespace-nowrap">Email</th>
              <th className="table-title font-bold whitespace-nowrap">
                Contact Number
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Address
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Company
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Department
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Center Cost
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Created By
              </th>
              <th className="table-title font-bold whitespace-nowrap">Role</th>
              <th className="table-title font-bold whitespace-nowrap">
                Permission
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Account Status
              </th>
              <th className="table-title font-bold whitespace-nowrap">Date</th>
              <th className="table-title font-bold md:sticky md:right-0 md:bg-white md:z-10  md:border-l md:border-[#E7E7E7] md:border-b">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <>
                <tr>
                  <td colSpan="15" className="text-center py-5 text-gray-500">
                    <PageLoader />
                  </td>
                </tr>
              </>
            ) : users.length > 0 ? (
              users?.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className=" py-4 pl-2.5 pr-[14px] border-b border-[#E7E7E7] text-start">
                    <input
                      id="checkbox"
                      type="checkbox"
                      className="rounded"
                      onChange={() => toggleSelection(user._id)}
                      checked={selectedIds.includes(user._id)}
                    />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.user_id}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    <img
                      src={`${user?.image?.replace(
                        "http://localhost:5000",
                        ""
                      )}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="table-data whitespace-nowrap">{user.email}</td>
                  <td className="table-data whitespace-nowrap">
                    {user.phone_number}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.address.length > 25
                      ? `${user.address.slice(0, 25)}...`
                      : user.address}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.company}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.department}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.center_cost}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.created_by_name || "N/A"}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.role_id?.name}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {user.role_id?.permissions
                      ?.filter((perm) => perm.module === "user")
                      .map((perm, index) => {
                        const allActions = [
                          "create",
                          "read",
                          "update",
                          "delete",
                        ];
                        const hasAllActions = allActions.every((action) =>
                          perm.actions.includes(action)
                        );
                        return (
                          <div key={index}>
                            {hasAllActions ? "all" : perm.actions.join(", ")}
                          </div>
                        );
                      })}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="relative table-data md:sticky md:right-0 md:bg-white md:border-l md:border-b md:border-[#E7E7E7] z-[2]">
                    <Menu placement="bottom-end">
                      <MenuHandler>
                        <Button className="h-6 w-6 rounded-lg flex mx-auto items-center justify-center bg-transparent border-none cursor-pointer shadow-none p-0">
                          <img src={VarticalDotIcon} alt="icon" />
                        </Button>
                      </MenuHandler>
                      <MenuList className="p-2.5 bg-white rounded-[10px] z-50 w-[182px] border border-[#ebe8e8] absolute top-[40px] right-[90%] flex flex-col shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)]">
                        <MenuItem
                          className="flex items-center gap-2.5 p-2.5"
                          onClick={() => handleViewEditUser(user._id)}
                        >
                          <img src={viewDetailIcon} alt="viewDetailIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            View/Edit User
                          </span>
                        </MenuItem>
                        <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            setDeleteUserId(user._id);
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                            toggleDropdown(null);
                          }}
                        >
                          <img src={deleteIocn} alt="deleteIocn" />
                          <span className="text-base font-normal leading-[26px] text-[red]">
                            Delete
                          </span>
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" className="text-center py-5 text-gray-500">
                  No data present
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        deleteLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        orderId={deleteUserId}
        showId={selectedUser?.user_id}
        modelTitle={"User"}
      />
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
};

export default UserList;
