import { useCallback } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
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

  const mutation = useMutation<TData, Error, OfflineMutationVariables, { previous: TData | undefined }>({
    mutationKey: OFFLINE_MUTATION_KEY,
    networkMode: 'offlineFirst',
    // The mutationFn is registered globally in query-client.ts so paused
    // mutations can resume after hydration or an app restart.
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      const variables = request.body as TVariables;
      queryClient.setQueryData<TData>(queryKey, (current) => optimisticUpdate(current, variables));
      return { previous };
    },
    onError: (_error, _request, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const submit = useCallback((variables: TVariables) => {
    const resolvedPath = typeof path === 'function' ? path(variables) : path;
    mutation.mutate({ path: resolvedPath, method, body: variables });
  }, [method, mutation, path]);

  const submitAsync = useCallback(async (variables: TVariables) => {
    const resolvedPath = typeof path === 'function' ? path(variables) : path;
    return mutation.mutateAsync({ path: resolvedPath, method, body: variables });
  }, [method, mutation, path]);

  return { ...mutation, submit, submitAsync };
}
