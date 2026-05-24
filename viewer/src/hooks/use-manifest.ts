import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useManifest() {
  return useQuery({
    queryKey: ['manifest'],
    queryFn: api.manifest,
    staleTime: 5 * 60_000,
  });
}
