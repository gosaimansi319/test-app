import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkDeleteSupplier,
  deleteSupplierById,
  fetchSuppliers,
} from "../../../store/Supplier/suppliersThunk";
import FilterButton from "../../../assets/svg/FilterButton.svg";
import Pagination from "../../../components/commen/Pagination";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import deleteIocn from "../../../assets/svg/delete-icon.svg";
import FilterPopup from "../../../components/commen/FilterPopup";
import toast from "react-hot-toast";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import PageLoader from "../../../components/commen/PageLoader";

const Suppliers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const suppliersData = useSelector((state) => state.suppliers.suppliers);
  const suppliersDataLoading = useSelector((state) => state.suppliers.loading);
  const [deleteLoad, setDeleteLoad] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteSupplierId, setSupplierUserId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState("contact_person");
  const [filterValue, setFilterValue] = useState("");
  const [filterValueParams, setFilterValueParams] = useState({});

  useEffect(() => {
    dispatch(
      fetchSuppliers({
        page: currentPage,
        limit: itemsPerPage,
        ...filterValueParams,
      })
    )
      .then((res) => {
        if (res.payload) {
          if (res.payload.pagination) {
            setTotalItems(res.payload.pagination.total_items);
            // setTotalPages(res.payload.pagination.total_pages);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dispatch, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleConfirmDelete = () => {
    setDeleteLoad(true);
    const isBulkDelete =
      selectedIds.length > 1 && selectedIds.length === suppliersData.length;
    const idsToDelete = deleteSupplierId ? [deleteSupplierId] : selectedIds;

    if (isBulkDelete) {
      dispatch(bulkDeleteSupplier({ page: currentPage, limit: itemsPerPage }))
        .unwrap()
        .then(() => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setSupplierUserId(null);
          dispatch(
            fetchSuppliers({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.pagination) {
              setTotalItems(res.payload.pagination.total_items);
            }
          });
        })
        .then(() => setDeleteLoad(false))
        .catch((error) => {
          console.error("Bulk delete failed:", error);
          toast.error("Failed to delete supplier");
          setDeleteLoad(false);
        });
    } else {
      Promise.all(idsToDelete.map((id) => dispatch(deleteSupplierById(id))))
        .then(() => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setSupplierUserId(null);
          dispatch(
            fetchSuppliers({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.pagination) {
              setTotalItems(res.payload.pagination.total_items);
            }
          });
        })
        .then(() => {
          // toast.success("Suppliers deleted successfully");
          setDeleteLoad(false);
        })
        .catch((error) => {
          console.error("Delete failed:", error);
          toast.error("Failed to delete supplier");
          setDeleteLoad(false);
        });
    }
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === suppliersData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suppliersData?.map((user) => user._id));
    }
  };

  const handleApplyFilter = () => {
    setShowFilter(false); // Hide the filter popup

    const filterParams = {
      page: 1,
      limit: itemsPerPage,
      [filterType]: filterValue,
    };

    setFilterValueParams({
      [filterType]: filterValue,
    });

    dispatch(fetchSuppliers(filterParams)).then((res) => {
      if (res.payload?.pagination) {
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
    });
  };

  const handleRemoveFilter = () => {
    setFilterType("contact_person");
    setFilterValue("");
    setShowFilter(false);
        setFilterValueParams({})

    const defaultParams = {
      page: 1,
      limit: itemsPerPage,
    };

    dispatch(fetchSuppliers(defaultParams)).then((res) => {
      if (res.payload?.pagination) {
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
    });
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
      <div className="sticky bg-white -top-5 z-[11] p-5 -m-5">
        <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
          Suppliers
        </h3>
        <div className="flex items-center justify-between gap-4 pt-5 md:justify-end sm:pt-0">
          {selectedIds.length > 0 && (
            <button
              className="formField-btn flex  gap-[10px]"
              onClick={() => setShowDeleteModal(true)}
            >
              <img src={deleteIocn} alt="deleteIocn" /> ({selectedIds.length})
            </button>
          )}
          <button
            className="formField-btn"
            onClick={() => navigate("/admin/suppliers/createSuppliers")}
          >
            Create Supplier
          </button>
          <span className="relative" ref={filterRef}>
            <img
              src={FilterButton}
              alt="FilterButton"
              className="cursor-pointer"
              onClick={() => setShowFilter(!showFilter)}
            />
            <FilterPopup
              show={showFilter}
              filterType={filterType}
              setFilterType={setFilterType}
              filterValue={filterValue}
              setFilterValue={setFilterValue}
              onApply={handleApplyFilter}
              onClear={handleRemoveFilter}
              onClose={() => setShowFilter(false)}
            />
          </span>
        </div>
      </div>

      <div className="mt-5 custom-scrollbar overflow-y-hidden">
        <table className="min-w-[700px] lg:w-full table-auto">
          <thead className="border-b border-[#E7E7E7]">
            <tr>
              <th className="w-10 px-2 py-3 text-left">
                <input
                  id="checkbox"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    suppliersData.length > 0 &&
                    selectedIds.length === suppliersData.length
                  }
                />
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Supplier ID
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Company
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                NIF Number
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Address
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Contact Person
              </th>
              <th className="table-title font-bold whitespace-nowrap">
                Contact Number
              </th>
              <th className="table-title font-bold whitespace-nowrap">Date</th>
              <th className="table-title font-bold md:sticky md:right-0 md:bg-white md:z-10  md:border-l md:border-[#E7E7E7] md:border-b">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {suppliersDataLoading ? (
              <>
                <tr>
                  <td colSpan="9" className="text-center py-5 text-gray-500">
                    <PageLoader />
                  </td>
                </tr>
              </>
            ) : suppliersData && suppliersData.length > 0 ? (
              suppliersData?.map((supplier) => (
                <tr key={supplier?._id} className="border-b border-[#E7E7E7]">
                  <td className="px-2 py-3">
                    <input
                      id="checkbox"
                      type="checkbox"
                      className="rounded"
                      onChange={() => toggleSelection(supplier._id)}
                      checked={selectedIds.includes(supplier?._id)}
                    />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.supplier_id}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.company_name || "N/A"}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.NIF_number}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.address.length > 25
                      ? `${supplier?.address.slice(0, 25)}...`
                      : supplier?.address}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.contact_person}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {supplier?.contact_number}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {new Date(supplier?.createdAt).toLocaleDateString("en-GB")}
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
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            setSupplierUserId(supplier._id);
                            setSelectedSupplier(supplier);
                            setShowDeleteModal(true);
                          }}
                        >
                          <img src={deleteIocn} alt="deleteIcon" />
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
                <td colSpan="9" className="text-center py-5 text-gray-500">
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
        onConfirm={handleConfirmDelete}
        orderId={deleteSupplierId}
        deleteLoading={deleteLoad}
        showId={selectedSupplier?.supplier_id}
        modelTitle={"Supplier"}
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

export default Suppliers;
