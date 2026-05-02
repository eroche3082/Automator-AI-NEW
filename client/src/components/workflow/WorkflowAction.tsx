import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface WorkflowActionProps {
  type: "trigger" | "action";
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  options: Option[];
  value?: string;
  description: string;
  onChange?: (value: string) => void;
}

const WorkflowAction: React.FC<WorkflowActionProps> = ({
  type,
  title,
  icon,
  bgColor,
  iconBgColor,
  options,
  value,
  description,
  onChange,
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-4 w-64`}>
      <div className="flex items-center mb-3">
        <div className={`w-6 h-6 rounded ${iconBgColor} flex items-center justify-center mr-2`}>
          {icon}
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      
      <Select 
        value={value} 
        onValueChange={(value) => onChange && onChange(value)}
      >
        <SelectTrigger className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm text-white mb-3">
          <SelectValue placeholder={`Select ${type === 'trigger' ? 'trigger' : 'action'}`} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border border-gray-700">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-xs text-gray-400">
        {description}
      </div>
    </div>
  );
};

export default WorkflowAction;
