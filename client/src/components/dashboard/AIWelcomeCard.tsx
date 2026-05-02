import { useEffect, useState } from "react";
import { getAIWelcomeMessage } from "@/lib/gemini";

const AIWelcomeCard = () => {
  const [welcomeData, setWelcomeData] = useState({
    userName: "John",
    activeWorkflows: 12,
    timesSaved: 4.5,
    isLoading: true,
    suggestion: "",
  });

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        const response = await getAIWelcomeMessage();
        if (response) {
          setWelcomeData({
            ...welcomeData,
            isLoading: false,
            suggestion: response.suggestion,
          });
        }
      } catch (error) {
        console.error("Error fetching AI welcome message:", error);
        setWelcomeData({
          ...welcomeData,
          isLoading: false,
        });
      }
    };

    fetchWelcomeMessage();
  }, []);

  return (
    <div className="bg-[#151515] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-6 mb-8 relative overflow-hidden">
      <div className="flex items-start">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2">
            Welcome back, {welcomeData.userName}!
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Your automation system is running smoothly. Here's what's new today:
          </p>

          <div className="text-gray-300 mb-4">
            <p>
              • You have{" "}
              <span className="text-white font-medium">
                {welcomeData.activeWorkflows} active workflows
              </span>{" "}
              running efficiently
            </p>
            <p>
              • Your email automations have saved{" "}
              <span className="text-white font-medium">
                {welcomeData.timesSaved} hours
              </span>{" "}
              this week
            </p>
            <p>
              • New{" "}
              <span className="gradient-text font-medium">AI</span> template
              suggestions are ready for your review
            </p>
          </div>

          <div className="mt-4">
            <button className="px-4 py-2 bg-[#0047FF] text-white text-sm rounded-full hover:shadow-[0_0_15px_rgba(0,71,255,0.5)] transition-all">
              View Recommendations
            </button>
          </div>
        </div>
        <div className="hidden md:block w-64 h-64 absolute right-0 top-0 opacity-20">
          {/* We don't include an actual image here as per the guidelines */}
        </div>
      </div>
    </div>
  );
};

export default AIWelcomeCard;
