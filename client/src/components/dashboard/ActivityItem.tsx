import React from "react";

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  time: string;
  description: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  time,
  description,
}) => {
  return (
    <div className="flex items-start p-3 rounded-md hover:bg-gray-800 transition-colors">
      <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center mr-3 mt-1`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-medium">{title}</p>
          <span className="text-xs text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
