import { useState, useCallback } from "react";
import { Workflow, WorkflowAction } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface UseWorkflowBuilderReturn {
  workflow: Workflow;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setWorkflowCategory: (category: string) => void;
  setTrigger: (trigger: string) => void;
  addAction: (action: Omit<WorkflowAction, "id">) => void;
  updateAction: (id: string, action: Partial<WorkflowAction>) => void;
  removeAction: (id: string) => void;
  moveAction: (id: string, direction: "up" | "down") => void;
  resetWorkflow: () => void;
  saveWorkflow: () => Promise<boolean>;
}

export function useWorkflowBuilder(): UseWorkflowBuilderReturn {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: 0, // Will be assigned by the server when saved
    name: "New Workflow",
    description: "Describe your workflow here",
    trigger: "",
    category: "Customer Onboarding",
    status: "draft",
    actions: [],
  });

  const setWorkflowName = useCallback((name: string) => {
    setWorkflow((prev) => ({ ...prev, name }));
  }, []);

  const setWorkflowDescription = useCallback((description: string) => {
    setWorkflow((prev) => ({ ...prev, description }));
  }, []);

  const setWorkflowCategory = useCallback((category: string) => {
    setWorkflow((prev) => ({ ...prev, category }));
  }, []);

  const setTrigger = useCallback((trigger: string) => {
    setWorkflow((prev) => ({ ...prev, trigger }));
  }, []);

  const addAction = useCallback((action: Omit<WorkflowAction, "id">) => {
    const newAction = {
      ...action,
      id: generateId(),
    };

    setWorkflow((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  }, []);

  const updateAction = useCallback((id: string, action: Partial<WorkflowAction>) => {
    setWorkflow((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => 
        a.id === id ? { ...a, ...action } : a
      ),
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setWorkflow((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }));
  }, []);

  const moveAction = useCallback((id: string, direction: "up" | "down") => {
    setWorkflow((prev) => {
      const actionIndex = prev.actions.findIndex((a) => a.id === id);
      if (actionIndex === -1) return prev;

      const newActions = [...prev.actions];
      
      if (direction === "up" && actionIndex > 0) {
        // Swap with the previous action
        [newActions[actionIndex], newActions[actionIndex - 1]] = 
        [newActions[actionIndex - 1], newActions[actionIndex]];
      } else if (direction === "down" && actionIndex < newActions.length - 1) {
        // Swap with the next action
        [newActions[actionIndex], newActions[actionIndex + 1]] = 
        [newActions[actionIndex + 1], newActions[actionIndex]];
      }

      return {
        ...prev,
        actions: newActions,
      };
    });
  }, []);

  const resetWorkflow = useCallback(() => {
    setWorkflow({
      id: 0,
      name: "New Workflow",
      description: "Describe your workflow here",
      trigger: "",
      category: "Customer Onboarding",
      status: "draft",
      actions: [],
    });
  }, []);

  const saveWorkflow = useCallback(async (): Promise<boolean> => {
    try {
      // Here we would make an API call to save the workflow
      // For now, we'll just return true to simulate a successful save
      console.log("Saving workflow:", workflow);
      return true;
    } catch (error) {
      console.error("Error saving workflow:", error);
      return false;
    }
  }, [workflow]);

  return {
    workflow,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowCategory,
    setTrigger,
    addAction,
    updateAction,
    removeAction,
    moveAction,
    resetWorkflow,
    saveWorkflow,
  };
}
