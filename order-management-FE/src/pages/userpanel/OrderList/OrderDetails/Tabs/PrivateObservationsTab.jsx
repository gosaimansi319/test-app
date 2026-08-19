import { useState } from "react";
import Like from "../../../../../assets/svg/thumbIcon.svg";
import SendIcon from "../../../../../assets/svg/SendIcon.svg";
import OrderDetailAvatar from "../../../../../assets/svg/orderDetailAvatar.png";
import Avatar from "../../../../../assets/image/userAvatar.jpg";

export const PrivateObservationsTab = () => {
  const [replyText, setReplyText] = useState("");
  return (
    <div className="mt-10">
      <div className="w-full bg-white shadow-[0px_4px_16px_0px_#0000000D] border border-[#E7E7E7] rounded-[20px] justify-between overflow-hidden p-5 flex flex-col gap-4">
        <h2 className="text-base font-medium text-[#212121] leading-[26px]">
          Private Observations
        </h2>

        <div className="flex items-start gap-5">
          <div className="w-10 h-10 bg-[#F6F6F6] rounded-full overflow-hidden object-cover">
            <img
              className="h-full w-full"
              src={OrderDetailAvatar}
              alt="Avatar"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <p className="text-base font-medium text-[#212121] leading-[26px]">
                Martina Lauther
              </p>
              <p className="text-sm font-normal text-[#6D6D6D] leading-6">
                2 Days Ago
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
              finibus pellentesque convallis.
            </p>
            <div className="flex items-center mt-2.5 gap-5">
              <button className="flex items-center gap-[7px]">
                <img src={Like} alt="" />
                <span>02</span>
              </button>
              <button className="text-sm text-[#282828] leading-6 font-normal">
                Reply
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <div className="w-10 h-10 bg-[#888888] rounded-full overflow-hidden">
            <img src={OrderDetailAvatar} alt="Avatar" />
          </div>
          <div className="flex-1">
            <div className="flex gap-2.5 items-center">
              <p className="text-base font-medium text-[#212121] leading-[26px]">
                Martina Lauther
              </p>
              <p className="text-sm font-normal text-[#6D6D6D] leading-6">
                March 20, 2025
              </p>
            </div>
            <p className="text-sm font-normal text-[#6D6D6D] leading-6 mt-2.5">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
              viverra vehicula massa, sit amet rhoncus orci pharetra vitae.
              Nulla vestibulum odio odio, sed vestibulum tellus molestie vel.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <button className="flex items-center mr-4">
                <span>00</span>
              </button>
              <button className="text-sm text-[#282828] leading-6 font-normal">
                Reply
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <div className="w-10 h-10 bg-[#F6F6F6] rounded-full overflow-hidden object-cover">
            <img src={OrderDetailAvatar} alt="Avatar" />
          </div>
          <div className="flex-1">
            <div className="flex gap-2.5 items-center">
              <p className="text-base font-medium text-[#212121] leading-[26px]">
                Martina Lauther
              </p>
              <p className="text-sm font-normal text-[#6D6D6D] leading-6">
                March 18, 2025
              </p>
            </div>
            <p className="text-sm font-normal text-[#6D6D6D] leading-6 mt-2.5">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
              finibus pellentesque convallis.
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <button className="flex items-center mr-4">
                <span>00</span>
              </button>
              <button className="text-sm text-[#282828] leading-6 font-normal">
                Reply
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-[15px]">
            <div className="w-10 h-10 bg-[#F6F6F6] rounded-full object-cover overflow-hidden">
              <img className="h-full w-full" src={Avatar} alt="Avatar" />
            </div>
            <div className="bg-[#F6F6F6] w-full py-[5px] px-2.5 rounded-[10px] flex gap-[10px] items-center ">
              <input
                type="text"
                placeholder="Reply"
                className="w-full border-none text-sm outline-none bg-none bg-[#F6F6F6]"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button className="flex">
                <img src={SendIcon} alt="" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
