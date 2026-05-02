import { useState } from "react";
import { useWorkflowBuilder } from "@/hooks/use-workflow-builder";
import WorkflowAction from "./WorkflowAction";
import { 
  Zap, 
  Mail, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Tag, 
  GitBranch, 
  Clock,
  PlusCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ACTION_ITEMS = [
  { id: "email", name: "Send Email", icon: <Mail className="w-6 h-6 text-[#0047FF]" /> },
  { id: "document", name: "Generate Doc", icon: <FileText className="w-6 h-6 text-[#D100FF]" /> },
  { id: "schedule", name: "Schedule", icon: <Calendar className="w-6 h-6 text-green-500" /> },
  { id: "sms", name: "Send SMS", icon: <MessageSquare className="w-6 h-6 text-yellow-500" /> },
  { id: "tag", name: "Update Tag", icon: <Tag className="w-6 h-6 text-[#FF3E3E]" /> },
  { id: "condition", name: "Condition", icon: <GitBranch className="w-6 h-6 text-blue-400" /> },
  { id: "delay", name: "Delay", icon: <Clock className="w-6 h-6 text-orange-500" /> },
];

const WORKFLOW_CATEGORIES = [
  "Customer Onboarding",
  "Lead Nurturing",
  "Document Generation",
  "Meeting Scheduling",
];

const WorkflowBuilder = () => {
  const [workflowName, setWorkflowName] = useState("New Customer Welcome Sequence");
  const [category, setCategory] = useState(WORKFLOW_CATEGORIES[0]);
  const { workflow, addAction, setTrigger } = useWorkflowBuilder();

  return (
    <div className="bg-[#151515] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="border-b border-gray-800 px-5 py-4 flex justify-between items-center">
        <h3 className="font-bold">Workflow Builder</h3>
        <div className="flex space-x-3">
          <Button variant="secondary" className="bg-gray-800 text-gray-300 hover:text-white">
            Exit
          </Button>
          <Button className="gradient-btn text-white">
            Save Workflow
          </Button>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:space-x-4 mb-6 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Workflow Name</label>
            <Input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:border-[#0047FF]"
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full bg-gray-800 border border-gray-700 focus:border-[#0047FF]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-700">
                {WORKFLOW_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Workflow Canvas */}
        <div className="bg-gray-900 rounded-lg p-6 h-80 overflow-auto relative">
          {/* Workflow Builder Drag and Drop Area */}
          <div className="flex items-start space-x-6">
            {/* Trigger */}
            <WorkflowAction
              type="trigger"
              title="Trigger"
              icon={<Zap className="w-4 h-4 text-white" />}
              bgColor="bg-[#0047FF]/10 border border-[#0047FF]"
              iconBgColor="bg-[#0047FF]"
              onChange={(value) => setTrigger(value)}
              options={[
                { value: "new_customer", label: "New Customer Created" },
                { value: "form_submitted", label: "Form Submitted" },
                { value: "payment_received", label: "Payment Received" }
              ]}
              description="This workflow starts when a new customer is added to your CRM"
            />
            
            {/* Render added actions */}
            {workflow.actions.map((action, index) => (
              <WorkflowAction
                key={index}
                type="action"
                title={`Action: ${action.type}`}
                icon={<Mail className="w-4 h-4 text-white" />}
                bgColor="bg-[#D100FF]/10 border border-[#D100FF]"
                iconBgColor="bg-[#D100FF]"
                value={action.value}
                options={[
                  { value: "welcome_email", label: "Welcome Email Template" },
                  { value: "follow_up", label: "Follow-Up Email" },
                  { value: "newsletter", label: "Newsletter" }
                ]}
                description={action.description}
              />
            ))}
            
            {/* Add Next Action Placeholder */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 w-64 opacity-80">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center mr-2">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-medium">Add Next Action</h4>
              </div>
              <div 
                className="flex items-center justify-center p-4 border border-dashed border-gray-700 rounded-md bg-gray-800/50"
                onClick={() => addAction({
                  type: "Send Email",
                  value: "welcome_email",
                  description: "Send a welcome email to the new customer"
                })}
              >
                <span className="text-xs text-gray-500">Drag an action here</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Palette */}
        <div className="mt-6 border-t border-gray-800 pt-4">
          <h4 className="text-sm font-medium mb-3">Available Actions</h4>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {ACTION_ITEMS.map((action) => (
              <div 
                key={action.id}
                className="flex flex-col items-center bg-gray-800 hover:bg-gray-700 p-3 rounded-lg min-w-20 cursor-grab"
                onClick={() => addAction({
                  type: action.name,
                  value: action.id,
                  description: `Add ${action.name.toLowerCase()} to workflow`
                })}
              >
                {action.icon}
                <span className="text-xs mt-2">{action.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
