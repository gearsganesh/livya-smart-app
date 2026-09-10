import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { OFFLINE_MUTATION_KEY, type OfflineMutationVariables } from '../lib/query-client';

export type SubmitDataOptions<TData, TVariables> = {
  path: string | ((variables: TVariables) => string);
  method?: OfflineMutationVariables['method'];
  queryKey: QueryKey;
  optimisticUpdate: (current: TData | undefined, variables: TVariables) => TData;
};

export function useSubmitData<TData = unknown, TVariables = unknown>({
  path,
  method = 'POST',
  queryKey,
  optimisticUpdate,
}: SubmitDataOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: OFFLINE_MUTATION_KEY,
    networkMode: 'offlineFirst',
    mutationFn: async (variables: TVariables) => {
      const resolvedPath = typeof path === 'function' ? path(variables) : path;
      return apiFetch<TData>(resolvedPath, {
        method,
        body: JSON.stringify(variables),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      queryClient.setQueryData<TData>(queryKey, (current) => optimisticUpdate(current, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
