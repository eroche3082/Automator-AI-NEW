import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { N8nWorkflow, N8nCredential, N8nExecution } from '@/lib/types';

/**
 * Hook para obtener todos los workflows de n8n
 */
export function useN8nWorkflows() {
  return useQuery<N8nWorkflow[]>({
    queryKey: ['/api/n8n/workflows'],
    retry: 1,
    // Add better error handling for n8n API failures
    meta: {
      errorMessage: "Failed to connect to n8n. Please verify your API key and endpoint.",
    }
  });
}

/**
 * Hook para obtener un workflow específico de n8n
 */
export function useN8nWorkflow(id: string) {
  return useQuery<N8nWorkflow>({
    queryKey: [`/api/n8n/workflows/${id}`],
    enabled: !!id,
  });
}

/**
 * Hook para crear un nuevo workflow en n8n
 */
export function useCreateN8nWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workflowData: Partial<N8nWorkflow>) => {
      const response = await apiRequest({
        url: '/api/n8n/workflows',
        method: 'POST',
        data: workflowData,
      });
      return response as N8nWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
    },
  });
}

/**
 * Hook para actualizar un workflow existente en n8n
 */
export function useUpdateN8nWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workflowData: Partial<N8nWorkflow>) => {
      const response = await apiRequest({
        url: `/api/n8n/workflows/${id}`,
        method: 'PATCH',
        data: workflowData,
      });
      return response as N8nWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows', id] });
    },
  });
}

/**
 * Hook para eliminar un workflow de n8n
 */
export function useDeleteN8nWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest({
        url: `/api/n8n/workflows/${id}`,
        method: 'DELETE',
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
    },
  });
}

/**
 * Hook para activar un workflow en n8n
 */
export function useActivateN8nWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiRequest({
        url: `/api/n8n/workflows/${id}/activate`,
        method: 'POST',
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows', id] });
    },
  });
}

/**
 * Hook para desactivar un workflow en n8n
 */
export function useDeactivateN8nWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiRequest({
        url: `/api/n8n/workflows/${id}/deactivate`,
        method: 'POST',
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows', id] });
    },
  });
}

/**
 * Hook para ejecutar un workflow de n8n
 */
export function useExecuteN8nWorkflow(id: string) {
  return useMutation({
    mutationFn: async (data: any = {}) => {
      const response = await apiRequest({
        url: `/api/n8n/workflows/${id}/execute`,
        method: 'POST',
        data: data,
      });
      return response as N8nExecution;
    },
  });
}

/**
 * Hook para obtener ejecuciones de workflows en n8n
 */
export function useN8nExecutions(workflowId?: string, limit = 20) {
  const url = workflowId
    ? `/api/n8n/executions?workflowId=${encodeURIComponent(workflowId)}&limit=${limit}`
    : `/api/n8n/executions?limit=${limit}`;

  return useQuery<N8nExecution[]>({
    queryKey: [url],
  });
}

/**
 * Hook para obtener credenciales de n8n
 */
export function useN8nCredentials() {
  return useQuery<N8nCredential[]>({
    queryKey: ['/api/n8n/credentials'],
  });
}