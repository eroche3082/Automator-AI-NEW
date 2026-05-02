import React from "react";

interface WorkflowTemplateProps {
  title: string;
  description: string;
  badge?: {
    text: string;
    color: string;
  };
  onClick: () => void;
}

const WorkflowTemplate: React.FC<WorkflowTemplateProps> = ({
  title,
  description,
  badge,
  onClick,
}) => {
  return (
    <div 
      className="bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{title}</span>
        {badge && (
          <span className={`${badge.color} text-xs py-1 px-2 rounded`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
};

export default WorkflowTemplate;
