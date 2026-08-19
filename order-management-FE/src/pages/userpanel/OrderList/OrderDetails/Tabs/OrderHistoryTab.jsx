import { useEffect, useState } from "react";
import Like from "../../../../../assets/svg/thumbIcon.svg";
import LikedIcon from "../../../../../assets/svg/LikedIcon.svg";
import SendIcon from "../../../../../assets/svg/SendIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  likePublicComment,
  postPublicComment,
} from "../../../../../store/Comment/commentThunk";
import { formatDate } from "../../../../../utils/utilities";

// User Panel order history
export const OrderHistoryTab = ({ orderById, viewProduct }) => {
  const dispatch = useDispatch();
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState(viewProduct?.public_comments || []);
  const loggedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  const userData = useSelector((state) => state?.settings?.setting?.data);

  useEffect(() => {
    const myProduct = orderById?.products?.find(
      (p) => p?.product_id === viewProduct?.product_id
    )?.public_comments;
    setComments(myProduct);
  }, [orderById]);

  const handleSendComment = async () => {
    if (!replyText.trim()) return;

    const data = { message: replyText };
    try {
      const res = await dispatch(
        postPublicComment({
          orderId: orderById?._id,
          productId: viewProduct?.product_id,
          data,
        })
      ).unwrap();
      if (res && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setReplyText("");
      } else {
        console.warn("No comment returned from API");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await dispatch(
        likePublicComment({
          orderId: orderById?._id,
          commentId: commentId,
          productId: viewProduct?.product_id,
        })
      ).unwrap();
      if (res && res.comment) {
        let filterComment = comments?.map((data) => {
          if (data?.comment_id === res?.comment?.comment_id) {
            return {
              ...data,
              likes: res?.comment?.likes,
            };
          }
          return data;
        });
        setComments(filterComment);
      } else {
        console.warn("No comment returned from API");
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

 // Status arrays matching User Panel logic
  const CREATED_COMPLETE = [
    "Pending Review",
    "In Analysis",
    "Approved",
    "Not Approved",
    "Ordered",
    "In transit",
    "Received",
    "Completed",
    "Return",
    "Issue (RMA)",
    "Cancelled",
    "Pending",
    "Rejected",
    "Shipped",
    "Processing",
  ];

  const REJECT_OR_CANCEL = ["Not Approved", "Cancelled", "Rejected"];
  const APPROVAL_COMPLETE = [
    "Approved",
    "Ordered",
    "In transit",
    "Received",
    "Completed",
    "Shipped",
    "Processing",
    "Issue (RMA)",
  ];
  const DELIVERY_COMPLETE = [
    "Ordered",
    "In transit",
    "Received",
    "Shipped",
    "Processing",
    "Issue (RMA)",
    "Completed"
  ];
  const COMPLETED_COMPLETE = ["Completed", "Issue (RMA)"];

  const STEP_OWNER = {
    Created: ["Pending Review", "In Analysis", "Pending"],
    Approval: ["Approved", "Not Approved", "Rejected"],
    Delivery: ["Ordered", "In transit", "Shipped", "Processing", "Received"],
    Completed: ["Completed", "Return", "Issue (RMA)"],
    Terminated: ["Cancelled"],
  };

  const ownsStatus = (step, status) =>
    STEP_OWNER[step]?.includes(status);

  let ApprovalDes = viewProduct?.status_history?.find((d) =>
    APPROVAL_COMPLETE.includes(d.status))

  let deliveryDes = viewProduct?.status_history?.find((d) =>
    DELIVERY_COMPLETE.includes(d.status))

  let completedDes = viewProduct?.status_history?.find((d) =>
    COMPLETED_COMPLETE.includes(d.status))

  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 justify-between gap-5">
      {/* Timeline */}
      <div className="relative pl-8 flex flex-col">
        {/* ─────── Created ───────────────────────────────────────────── */}
        <div
          className={`pb-8 relative before:absolute before:-left-6 before:top-0 h-[170px] before:h-[calc(100%+1px)] before:w-[1px] ${CREATED_COMPLETE.includes(orderById?.status)
            ? "before:bg-[#2EA0AC]"
            : "before:bg-[#888888]"
            }`}
        >
          <div className="absolute -left-8 top-0">
            <span
              className={`${CREATED_COMPLETE.includes(viewProduct?.status)
                ? "bg-[#2EA0AC]"
                : "bg-[#888888]"
                } w-5 h-5 rounded-full flex items-center justify-center text-white`}
            >
              {CREATED_COMPLETE.includes(viewProduct?.status) && "✓"}
            </span>
          </div>
          <h3 className="activeTitle-orderBox">Created</h3>
          <div className="mt-2.5 flex flex-col gap-1">
            <p className="text-sm text-[#212121]">
              Order for {viewProduct?.product_name} has been created.
            </p>
            <p className="text-xs text-[#6D6D6D]">
              Order ID: {orderById?.order_id}
            </p>
            <p className="text-xs text-[#6D6D6D]">
              Created By: {orderById?.created_by?.name}
            </p>
            <p className="text-xs text-[#6D6D6D]">
              {formatDate(orderById?.createdAt)}
            </p>
            <p className="text-xs text-[#6D6D6D]">
              {ownsStatus("Created", viewProduct?.status) && viewProduct?.status}
            </p>
          </div>
        </div>

        {/* ─────── Rejection / Cancellation SHORT‑CIRCUIT ───────────── */}
        {REJECT_OR_CANCEL.includes(viewProduct?.status) ? (
          <div className="pb-8 relative before:absolute before:-left-6 before:top-0 h-[200px] before:h-[calc(100%+1px)] before:bg-[#888888]">
            <div className="absolute -left-8 top-0">
              <span
                className={`${REJECT_OR_CANCEL.includes(viewProduct?.status)
                  ? "bg-[#2EA0AC]"
                  : "bg-[#888888]"
                  } w-5 h-5 rounded-full flex items-center justify-center text-white`}
              >
                {REJECT_OR_CANCEL.includes(orderById?.status) && "✓"}
              </span>
            </div>
            <h3 className="title-orderBox">{viewProduct?.status}</h3>
          </div>
        ) : (
          /* ─────── Normal happy‑path timeline ─────────────────────── */
          <>
            {/* ─── Approval ─────────────────────────────────────────── */}
            <div
              className={`pb-8 relative before:absolute before:-left-6 before:top-0 h-[200px] before:h-[calc(100%+1px)] before:w-[1px] ${APPROVAL_COMPLETE.includes(orderById?.status)
                ? "before:bg-[#2EA0AC]"
                : "before:bg-[#888888]"
                }`}
            >
              <div className="absolute -left-8 top-0">
                <span
                  className={`${APPROVAL_COMPLETE.includes(viewProduct?.status)
                    ? "bg-[#2EA0AC]"
                    : "bg-[#888888]"
                    } w-5 h-5 rounded-full flex items-center justify-center text-white`}
                >
                  {APPROVAL_COMPLETE.includes(viewProduct?.status) && "✓"}
                </span>
              </div>
              <h3 className="title-orderBox">Approval</h3>
              <div className="mt-2 text-sm text-gray-600">
                {ApprovalDes ? (
                  <>
                    <p className="text-sm text-[#212121]">
                      Your order has been approved.
                    </p>
                    <p className="text-xs text-[#6D6D6D]">
                      By{" "}
                      {
                        ApprovalDes?.changed_by_name
                      }
                    </p>
                    <p className="text-xs text-[#6D6D6D]">
                      {formatDate(
                        ApprovalDes?.changed_at
                      )}
                    </p>
                    <p className="text-xs text-[#6D6D6D]">
                      {ownsStatus("Approval", viewProduct?.status) && viewProduct?.status}
                    </p>
                  </>
                ) : (
                  <span className="mt-2 text-sm text-gray-600">
                    Awaiting approval
                  </span>
                )}
              </div>
            </div>

            {/* ─── Delivery (Ordered / In transit / Received) ───────── */}
            <div
              className={`pb-8 relative before:absolute before:-left-6 before:top-0 h-[200px] before:h-[calc(100%+1px)] before:w-[1px] ${DELIVERY_COMPLETE.includes(viewProduct?.status)
                ? "before:bg-[#2EA0AC]"
                : "before:bg-[#888888]"
                }`}
            >
              <div className="absolute -left-8 top-0">
                <span
                  className={`${DELIVERY_COMPLETE.includes(viewProduct?.status)
                    ? "bg-[#2EA0AC]"
                    : "bg-[#888888]"
                    } w-5 h-5 rounded-full flex items-center justify-center text-white`}
                >
                  {DELIVERY_COMPLETE.includes(viewProduct?.status) && "✓"}
                </span>
              </div>
              <h3 className="title-orderBox">Delivery</h3>
              {deliveryDes ? (
                <>
                  <p className="text-sm text-[#212121]">Order is on the way.</p>
                  <p className="text-xs text-[#6D6D6D]">
                    {formatDate(
                      completedDes?.changed_at
                    )}
                  </p>
                  <p className="text-xs text-[#6D6D6D]">
                    {ownsStatus("Delivery", viewProduct?.status) && viewProduct?.status}
                  </p>
                </>
              ) : (
                <span className="mt-2 text-sm text-gray-600">
                  Waiting to ship
                </span>
              )}
            </div>

            {/* ─── Completed (Received / Completed) ─────────────────── */}
            <div className="relative">
              <div className="absolute -left-8 top-0">
                <span
                  className={`${COMPLETED_COMPLETE.includes(viewProduct?.status)
                    ? "bg-[#2EA0AC]"
                    : "bg-[#888888]"
                    } w-5 h-5 rounded-full flex items-center justify-center text-white`}
                >
                  {COMPLETED_COMPLETE.includes(viewProduct?.status) && "✓"}
                </span>
              </div>
              <h3 className="title-orderBox">Completed</h3>
              {completedDes ? (
                <>
                  <p className="text-sm text-[#212121]">
                    Order received &amp; closed.
                  </p>
                  <p className="text-xs text-[#6D6D6D]">
                    {formatDate(
                      completedDes?.changed_at
                    )}
                  </p>
                  <p className="text-xs text-[#6D6D6D]">
                    {ownsStatus("Completed", viewProduct?.status) && viewProduct?.status}
                  </p>
                </>
              ) : (
                <span className="mt-2 text-sm text-gray-600">
                  Yet to complete
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Column - Comments */}
      <div className="w-full bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px] justify-between overflow-hidden p-5 flex flex-col gap-4">
        <div className="flex-1 flex flex-col justify-start">
          <h2 className="text-base font-medium text-[#212121] leading-[26px]">
            All Comments
          </h2>
          <div className="mt-5 flex-1 max-h-[450px] custom-scrollbar overflow-auto flex flex-col gap-5">
            {comments?.length > 0 ? (
              comments?.map((comment, index) => {
                return (
                  <div key={index} className="flex items-start gap-5">
                    <div className="w-10 h-10 bg-[#F6F6F6] rounded-full overflow-hidden object-cover">
                      <img
                        className="h-full w-full"
                        src={`${comment?.user_image}`}
                        alt="Avatar"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <p className="text-base font-medium text-[#212121] leading-[26px]">
                          {comment?.user_name}
                        </p>
                        <p className="text-sm font-normal text-[#6D6D6D] leading-6">
                          {formatDate(comment?.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {comment?.message}
                      </p>
                      <div className="flex items-center mt-2.5 gap-5">
                        <button
                          className="flex items-center gap-[7px]"
                          onClick={() => handleLikeComment(comment?.comment_id)}
                        >
                          {comment.likes?.includes(
                            JSON.parse(loggedUser)?._id
                          ) ? (
                            <img src={LikedIcon} alt="liked" />
                          ) : (
                            <img src={Like} alt="like" />
                          )}
                          <span>{comment?.likes?.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center mt-20">
                No comments yet.
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-[15px]">
            <div className="w-10 h-10 bg-[#F6F6F6] rounded-full object-cover overflow-hidden">
              <img
                className="h-full w-full"
                src={userData?.image}
                alt="Avatar"
              />
            </div>
            <div className="bg-[#F6F6F6] h-9 w-full py-[5px] px-2.5 rounded-[10px] flex gap-[10px] items-center ">
              <input
                type="text"
                placeholder="write a comment..."
                className="w-full border-none text-sm outline-none bg-none bg-[#F6F6F6]"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendComment();
                }}
              />
              <button className="flex" onClick={() => handleSendComment()}>
                <img src={SendIcon} alt="" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
