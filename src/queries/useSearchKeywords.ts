import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useSearchKeywords() {
  return useQuery({
    queryKey: ['searchKeywords'],
    queryFn: async () => {
      try {
        const res = await api.get('/users/search/keywords');
        const data = res.data;
        if (data && data.status && Array.isArray(data.data)) {
          return data.data as string[];
        }
        return [];
      } catch (error) {
        console.error('Error fetching search keywords:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
