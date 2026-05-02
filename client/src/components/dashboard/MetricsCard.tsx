import React from "react";
import { TrendingUp } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: string;
  changeText: string;
  borderColor: string;
  iconColor: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeText,
  borderColor,
  iconColor,
}) => {
  return (
    <div className={`bg-[#151515] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-5 border-t-2 ${borderColor}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 text-sm">{title}</h3>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <div className="flex items-center text-xs">
        <span className="text-green-500 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          {change}
        </span>
        <span className="text-gray-400 ml-2">{changeText}</span>
      </div>
    </div>
  );
};

export default MetricsCard;
