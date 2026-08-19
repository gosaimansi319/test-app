import { useState } from "react";
import Like from "../../../../../assets/svg/thumbIcon.svg";
import LikedIcon from "../../../../../assets/svg/LikedIcon.svg";
import SendIcon from "../../../../../assets/svg/SendIcon.svg";
import { useDispatch } from "react-redux";
import {
  likePublicComment,
  postPublicComment,
} from "../../../../../store/Comment/commentThunk";
import { formatDate } from "../../../../../utils/utilities";
import { useSelector } from "react-redux";

export const PublicObservationsTab = ({ orderById, viewProduct }) => {
  const dispatch = useDispatch();
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState(viewProduct?.public_comments || []);
  const loggedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  const userData = useSelector((state) => state?.settings?.setting?.data);
  const handleSendComment = async () => {
    if (!replyText.trim()) return;

    let userCommentId = comments.filter(
      (c) => !["Admin Test", "Manager Test"].includes(c.user_name)
    )?.[0]?.comment_id;

    const data = { message: replyText, reply_to: userCommentId };

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
          orderId: orderById._id,
          commentId: commentId,
          productId: viewProduct?.product_id,
        })
      ).unwrap();
      if (res && res.comment) {
        let filterComment = comments?.map((data) => {
          if (data.comment_id === res.comment.comment_id) {
            return {
              ...data,
              likes: res.comment.likes,
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

  return (
    <div className="mt-10">
      <div className="w-full bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px] justify-between overflow-hidden p-5 flex flex-col gap-4">
        <h2 className="text-base font-medium text-[#212121] leading-[26px]">
          All Comments
        </h2>
        {comments?.length > 0 ? (
          comments?.map((comment, index) => {
            return (
              <div key={index} className="flex items-start gap-5">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded-full overflow-hidden object-cover">
                  <img
                    className="h-full w-full"
                    src={`${comment.user_image}`}
                    alt="Avatar"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <p className="text-base font-medium text-[#212121] leading-[26px]">
                      {comment.user_name}
                    </p>
                    <p className="text-sm font-normal text-[#6D6D6D] leading-6">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comment.message}
                  </p>
                  <div className="flex items-center mt-2.5 gap-5">
                    <button
                      className="flex items-center gap-[7px]"
                      onClick={() => handleLikeComment(comment?.comment_id)}
                    >
                      {comment.likes?.includes(JSON.parse(loggedUser)._id) ? (
                        <img src={LikedIcon} alt="liked" />
                      ) : (
                        <img src={Like} alt="like" />
                      )}
                      <span>{comment.likes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">No comments yet.</p>
        )}

        <div>
          <div className="flex items-center gap-[15px]">
            <div className="w-10 h-10 bg-[#F6F6F6] rounded-full object-cover overflow-hidden">
              <img
                className="h-full w-full"
                src={userData?.image}
                alt="Avatar"
              />
            </div>
            <div className="bg-[#F6F6F6] w-full py-[5px] px-2.5 rounded-[10px] flex gap-[10px] items-center ">
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
