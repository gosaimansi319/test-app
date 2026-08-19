import { useEffect, useRef, useState } from "react";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import FilterButton from "../../../assets/svg/FilterButton.svg";
import deleteIcon from "../../../assets/svg/delete-icon.svg";
import viewDetailIcon from "../../../assets/svg/view-detail.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkDeleteByPage,
  deleteProductById,
  fetchProducts,
} from "../../../store/Product/productsThunk";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import Pagination from "../../../components/commen/Pagination";
import deleteIocn from "../../../assets/svg/delete-icon.svg";
import ProductFilterPopup from "../../../components/commen/ProductFilterPopup";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import PageLoader from "../../../components/commen/PageLoader";

const ProductList = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { loading } = useSelector((state) => state.products);
  const [deleteLoad, setDeleteLoad] = useState(false);
   const [filterValueParams,setFilterValueParams] = useState({})

  // Filter states
  const [showFilter, setShowFilter] = useState(false);

  const toggleSelection = (id) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = products.map((product) => product._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle items per page change
  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: itemsPerPage, ...filterValueParams }))
      .then((res) => {
        if (res.payload && res.payload.products) {
          setProducts(res.payload.products);
          // Update pagination info from API response
          if (res.payload.pagination) {
            setTotalItems(res.payload.pagination.total_items);
            setTotalPages(res.payload.pagination.total_pages);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [dispatch, currentPage, itemsPerPage]);

  const handleConfirmDelete = () => {
    setDeleteLoad(true);
    const isBulkDelete =
      selectedIds.length > 1 && selectedIds.length === products.length;
    const idsToDelete = deleteProductId ? [deleteProductId] : selectedIds;

    if (isBulkDelete) {
      // Bulk delete the entire page using backend API
      dispatch(bulkDeleteByPage({ page: currentPage, limit: itemsPerPage }))
        .unwrap()
        .then(() => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteProductId(null);
          // Refresh product list
          dispatch(
            fetchProducts({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.products) {
              setProducts(res.payload.products);
              if (res.payload.pagination) {
                setTotalItems(res.payload.pagination.total_items);
                setTotalPages(res.payload.pagination.total_pages);
              }
            }
          });
        })
        .then(() => setDeleteLoad(false));
    } else {
      // Delete one or several individually
      Promise.all(idsToDelete.map((id) => dispatch(deleteProductById(id))))
        .then(() => {
          setProducts((prev) =>
            prev.filter((p) => !idsToDelete.includes(p._id))
          );
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteProductId(null);
          // Refresh list
          dispatch(
            fetchProducts({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.products) {
              setProducts(res.payload.products);
              if (res.payload.pagination) {
                setTotalItems(res.payload.pagination.total_items);
                setTotalPages(res.payload.pagination.total_pages);
              }
            }
          });
        })
        .then(() => setDeleteLoad(false));
    }
  };

  const handleApplyFilter = (filterData) => {
    setShowFilter(false); // Hide the filter popup

    const filterParams = {
      page: 1,
      limit: itemsPerPage,
      name: filterData.name,
      role: filterData.role,
      date: filterData.date,
    };

    setFilterValueParams({
      name: filterData.name,
      role: filterData.role,
      date: filterData.date,
    })

    dispatch(fetchProducts(filterParams)).then((res) => {
      if (res.payload?.products) {
        setProducts(res.payload.products);
        if (res.payload.pagination) {
          setTotalItems(res.payload.pagination.total_items);
          setTotalPages(res.payload.pagination.total_pages);
          setCurrentPage(1);
        }
      }
    });
  };

  const handleRemoveFilter = () => {
    setShowFilter(false);

        setFilterValueParams({})

    const defaultParams = {
      page: 1,
      limit: itemsPerPage,
    };

    dispatch(fetchProducts(defaultParams)).then((res) => {
      if (res.payload?.products) {
        setProducts(res.payload.products);
        if (res.payload.pagination) {
          setTotalItems(res.payload.pagination.total_items);
          setTotalPages(res.payload.pagination.total_pages);
          setCurrentPage(1);
        }
      }
    });
  };

  const handleViewEditUser = (id) => {
    // dispatch(fetchUserById(id));
    navigate(`/admin/products/view-updateproduct/${id}`);
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
          Products
        </h3>
        <div className="flex items-center justify-between gap-4 pt-5 md:justify-end sm:pt-0">
          {selectedIds.length > 0 && (
            <button
              className="formField-btn flex gap-[10px]"
              onClick={() => setShowDeleteModal(true)}
            >
              <img src={deleteIocn} alt="deleteIocn" /> ({selectedIds.length})
            </button>
          )}
          <button
            className="formField-btn"
            onClick={() => navigate("/admin/products/createproduct")}
          >
            Create Product
          </button>
          <span className="relative" ref={filterRef}>
            <img
              src={FilterButton}
              alt="FilterButton"
              className="cursor-pointer"
              onClick={() => setShowFilter(!showFilter)}
            />
            <ProductFilterPopup
              show={showFilter}
              onApply={handleApplyFilter}
              onClear={handleRemoveFilter}
              onClose={() => setShowFilter(false)}
            />
          </span>
        </div>
      </div>
      <div className="mt-5 custom-scrollbar">
        <table className="min-w-[700px] lg:w-full border-separate border-spacing-0 table-auto">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th className="w-10 px-2 py-3 text-left">
                <input
                  id="checkbox"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    products.length > 0 &&
                    selectedIds.length === products.length
                  }
                />
              </th>
              <th className="table-title font-bold whitespace-nowrap">Product ID</th>
              <th className="table-title font-bold whitespace-nowrap">Name</th>
              <th className="table-title font-bold whitespace-nowrap">UN</th>
              <th className="table-title font-bold whitespace-nowrap">Description</th>
              <th className="table-title font-bold whitespace-nowrap">Sector</th>
              <th className="table-title font-bold whitespace-nowrap">Created By</th>
              <th className="table-title font-bold whitespace-nowrap">Role</th>
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
                  <td colSpan="9" className="text-center py-5 text-gray-500">
                    <PageLoader />
                  </td>
                </tr>
              </>
            ) : products && products.length > 0 ? (
              products?.map((product) => (
                <tr key={product._id}>
                  <td className="px-2 py-3">
                    <input
                      id="checkbox"
                      type="checkbox"
                      onChange={() => toggleSelection(product._id)}
                      checked={selectedIds.includes(product._id)}
                    />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product.product_id}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product.product_name}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {"UN " + product.UN}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product.description.length > 25 ? `${product.description.slice(0, 25)}...` : product.description}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product.sector}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product?.user?.first_name} {product?.user?.last_name}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {product?.user?.role_id?.name}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {new Date(product.createdAt).toLocaleDateString("en-GB")}
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
                          onClick={() => handleViewEditUser(product._id)}
                        >
                          <img src={viewDetailIcon} alt="viewDetailIcon" />
                          <span className="text-base text-nowrap font-normal leading-[26px] text-[#212121]">
                            View/Edit
                          </span>
                        </MenuItem>
                        <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            setDeleteProductId(product._id);
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                        >
                          <img src={deleteIcon} alt="deleteIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#C62828]">
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
                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Component */}
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        orderId={deleteProductId}
        deleteLoading={deleteLoad}
        showId={selectedProduct?.product_id}
        modelTitle={"Product"}
      />
    </div>
  );
};

export default ProductList;
