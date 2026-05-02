import React from "react";

interface IntegrationCardProps {
  name: string;
  icon: React.ReactNode | string;
  bgColor: string;
  status: "connected" | "needsAuth" | "new";
  onClick?: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  name,
  icon,
  bgColor,
  status,
  onClick,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
            Connected
          </span>
        );
      case "needsAuth":
        return (
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
            Needs Auth
          </span>
        );
      case "new":
        return null;
    }
  };

  return (
    <div
      className={`${
        status === "new"
          ? "bg-gray-800/30 border border-dashed border-gray-700 hover:bg-gray-800/50"
          : "bg-gray-800/50"
      } p-4 rounded-lg flex flex-col items-center cursor-pointer`}
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mb-2`}
      >
        {typeof icon === "string" ? (
          <span className="text-white font-bold">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <span className="text-sm font-medium mb-1">{name}</span>
      {getStatusBadge()}
      {status === "new" && (
        <span className="text-xs text-gray-500">Integration</span>
      )}
    </div>
  );
};

export default IntegrationCard;
