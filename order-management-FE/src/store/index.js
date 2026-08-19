import { combineReducers } from "@reduxjs/toolkit";
import roleReducer from "../store/Roles/roles.slice";
import settingReducer from "../store/Setting/setting.slice";
import productReducer from "../store/Product/product.slice";
import userReducer from "../store/User/user.slice";
import supplierReducer from "../store/Supplier/supplier.slice";
import companyReducer from "../store/Company/company.slice"
import orderReducer from "../store/Orders/order.slice"
import userOrderReducer from "../store/UserOrders/userOrder.slice"
import notificationsReducer from "../store/Notifications/notification.slice"
import commentReducer from "../store/Comment/comment.slice"

const rootReducer = combineReducers({
  roles: roleReducer,
  settings: settingReducer,
  products: productReducer,
  users: userReducer,
  suppliers: supplierReducer,
  companies:companyReducer,
  order: orderReducer,
  userOrder:userOrderReducer,
  notifications:notificationsReducer,
  comment:commentReducer
});

export default rootReducer;
