import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProductReviews } from "../../../../../store/Comment/commentThunk";
import { formatDate } from "../../../../../utils/utilities";
import { Loader } from "../../../../../components/commen/Loader";
import PageLoader from "../../../../../components/commen/PageLoader";

export const ReviewsTab = ({ orderById, viewProduct }) => {
  const dispatch = useDispatch();
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(getProductReviews(viewProduct.product_id)).then((response) => {
      setReviewsData(response.payload);
      setLoading(false);
    });
  }, [dispatch, orderById?._id]);

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
        {/* Left Section - Existing Reviews */}
        {loading ? (
          <PageLoader />
        ) : reviewsData?.reviews.length > 0 ? (
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
              // ?.filter((review) => review.user_id !== user?.id)
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
      </div>
    </div>
  );
};
