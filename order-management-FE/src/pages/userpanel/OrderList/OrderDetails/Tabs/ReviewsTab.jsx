import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "../../../../../store/Comment/commentThunk";
import { formatDate } from "../../../../../utils/utilities";
import PageLoader from "../../../../../components/commen/PageLoader";

export const ReviewsTab = ({ orderById, viewProduct }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const [userSubmittedReview, setUserSubmittedReview] = useState(null);
  const dispatch = useDispatch();
  const user = localStorage.getItem("user") || sessionStorage.getItem("user");
  const [isEditing, setIsEditing] = useState(false);

  const [reviewsData, setReviewsData] = useState(null);
  const loggedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  const [loading, setLoading] = useState(false);

  // Handle star click for ratings
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  useEffect(() => {
    setLoading(true);
    dispatch(getProductReviews(viewProduct.product_id)).then((response) => {
      setReviewsData(response.payload);
      setLoading(false);
    });
  }, [dispatch, orderById._id]);

  useEffect(() => {
    // Check if the current user has already submitted a review
    if (reviewsData?.total_reviews > 0 && user) {
      const userReview = reviewsData?.reviews.find(
        (review) => review.user_id === JSON.parse(user)._id
      );

      if (userReview) {
        setUserSubmittedReview(userReview);
        setComment(userReview.message);
        setRating(userReview.rating);
      }
    }
  }, [reviewsData, user]);

  const handleAddReview = () => {
    if (!comment.trim() || rating === 0) {
      return;
    }

    const reviewData = {
      message: comment,
      rating: rating,
    };

    if (isEditing) {
      dispatch(
        updateReview({
          orderId: orderById._id,
          reviewId: userSubmittedReview?.review_id,
          reviewData: reviewData,
        })
      ).then(() => {
        resetForm();
        setLoading(true);
        dispatch(getProductReviews(viewProduct.product_id)).then((response) => {
          setReviewsData(response.payload);
          setLoading(false);
        });
        setIsEditing(false);
      });
    } else {
      dispatch(
        addReview({
          productId: viewProduct.product_id,
          orderId: orderById?._id,
          reviewData: reviewData,
        })
      ).then((response) => {
        resetForm();
        // Set the user submitted review
        setUserSubmittedReview({
          ...reviewData,
          user_name: user.name,
          user_image: user.profileImage,
          created_at: new Date().toISOString(),
          id: response?.payload?.id, // Assuming the response contains the review ID
          user_id: user.id,
        });

        setLoading(true);
        dispatch(getProductReviews(viewProduct.product_id)).then((response) => {
          setReviewsData(response.payload);
          setLoading(false);
        });
      });
    }
  };

  const handleDeleteReview = () => {
    dispatch(
      deleteReview({
        orderId: orderById._id,
        reviewId: userSubmittedReview.review_id,
      })
    ).then(() => {
      setUserSubmittedReview(null);
      setLoading(false);
      dispatch(getProductReviews(viewProduct.product_id)).then((response) => {
        setReviewsData(response.payload);
        setLoading(true);
      });
      setComment("");
      setRating(0);
    });
  };

  const resetForm = () => {
    setComment("");
    setRating(0);
    setEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
        {/* Left Section - Existing Reviews */}
        {
         loading ?
              <PageLoader />
              :
        reviewsData?.reviews.length > 0 ? (
          <div className="w-full p-5 bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px] flex-1">
            <div className="flex flex-col justify-center text-center items-center gap-2.5 mb-5">
              <div className="text-2xl leading-9 font-bold text-[#282828]">
                {reviewsData?.average_rating || "0"}/5
              </div>
              <div className="flex h-5 gap-1 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl leading-5 ${
                      star <= (reviewsData?.average_rating || 0)
                        ? "text-[#FF9800]"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-base font-medium text-[#212121] leading-6 mb-5">
              Latest Reviews
            </h3>

            {/* Review Items */}
            {reviewsData?.reviews
              ?.filter((review) => review.user_id !== user?.id)
              .map((reviewData) => (
                <div className="mb-6" key={reviewData.review_id}>
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                      <img
                        src={`${reviewData.user_image}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-base leading-[26px] text-[#212121] mr-2">
                          {reviewData.user_name}
                        </span>
                        <span className="text-xs leading-6 text-[#6D6D6D]">
                          {formatDate(reviewData.created_at)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl leading-5 ${
                              star <= reviewData.rating
                                ? "text-[#FF9800]"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs ml-1 leading-6 text-[#212121]">
                          ({reviewData.rating})
                        </span>
                      </div>
                      <p className="text-xs text-[#6D6D6D] leading-4 mt-1">
                        {reviewData.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="w-full p-5 bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px] flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-base font-medium text-[#212121] text-center leading-6 mb-5">
                No Reviews Present
              </div>
            </div>
          </div>
        )}

        {/* Right Section - User Review */}
        <div className="flex-1 w-full p-5 bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px]">
          {loading ?
          <PageLoader />
          : userSubmittedReview ? (
              <div className="flex-1">
                {/* User Review Display */}

                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                      <img
                        className="h-full w-full"
                        src={`${JSON.parse(loggedUser).image}`}
                        alt="Avatar"
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-base leading-[26px] text-[#212121] mr-2">
                          {userSubmittedReview.user_name}
                        </span>
                        <span className="text-xs leading-6 text-[#6D6D6D]">
                          {formatDate(userSubmittedReview.created_at)}
                        </span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl leading-5 ${
                              star <= userSubmittedReview.rating
                                ? "text-[#FF9800]"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs ml-1 leading-6 text-[#212121]">
                          ({userSubmittedReview.rating}.0)
                        </span>
                      </div>
                      <p className="text-xs text-[#6D6D6D] leading-4 mt-1">
                        {userSubmittedReview.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notification and Action Buttons */}
                {isEditing ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-medium text-[#212121] leading-6 mb-6">
                      {isEditing ? "Edit your review" : "Write a review"}
                    </h3>
                    <div className="mb-6">
                      <p className="text-sm text-[#212121] mb-2">Ratings</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingClick(star)}
                            className="focus:outline-none"
                          >
                            <span
                              className={`text-xl leading-5 ${
                                rating >= star
                                  ? "text-[#FF9800]"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-[#212121] mb-2">Comment</p>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add your review comment here.."
                        className="w-full h-24 border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      {isEditing && (
                        <button
                          className="px-6 py-2 border border-gray-200 rounded-md text-sm"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="px-6 py-2 bg-gray-800 text-white rounded-md text-sm"
                        onClick={handleAddReview}
                      >
                        {isEditing ? "Edit" : "Add"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    {/* Notification box */}
                    <div className="bg-[#FFFBEA] p-2.5 rounded-md mb-4 text-[10px] leading-4 text-[#454545] text-center">
                      You can edit or delete your review within the next 30
                      minutes.
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-5 justify-end">
                      <button
                        className="px-8 py-1.5 bg-white border border-solid border-[#3D3D3D] text-[#3D3D3D] h-10 rounded-xl text-base leading-[26px] font-medium"
                        onClick={handleDeleteReview}
                      >
                        Delete
                      </button>
                      <button
                        className="px-8 py-1.5 bg-[#3D3D3D] border border-solid border-[#3D3D3D] text-white h-10 rounded-xl text-base leading-[26px] font-medium"
                        onClick={handleEdit}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
          ) : (
           
            <div className="">
              <h3 className="text-base font-medium text-[#212121] leading-6 mb-6">
                {isEditing ? "Edit Review" : "Write a review"}
              </h3>
              <div className="mb-6">
                <p className="text-base font-medium text-[#212121] leading-6 mb-5">
                  Ratings
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      className="focus:outline-none"
                    >
                      <span
                        className={`text-xl leading-5 ${
                          rating >= star ? "text-[#FF9800]" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-base font-medium text-[#212121] leading-6 mb-5">
                  Comment
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your review comment here.."
                  className="w-full h-24 border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="flex w-full flex-1 justify-end gap-5">
                {editing && (
                  <button
                    className="px-8 py-2 bg-white border border-solid border-[#3D3D3D] text-[#3D3D3D] h-10 rounded-xl text-base leading-[26px] font-medium"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="px-8 py-1.5 bg-[#3D3D3D] border border-solid border-[#3D3D3D] text-white h-10 rounded-xl text-base leading-[26px] font-medium"
                  onClick={handleAddReview}
                >
                  {editing ? "Update" : "Add"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
