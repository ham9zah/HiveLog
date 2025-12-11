import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/Post/PostCard';
import PostCardSkeleton from '../components/Post/PostCardSkeleton';
import SearchFilters from '../components/Search/SearchFilters';
import { AlertCircle } from 'lucide-react';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    stage: searchParams.get('stage') || '',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    sort: searchParams.get('sort') || 'hot',
    search: searchParams.get('search') || '',
    dateRange: searchParams.get('dateRange') || '',
    tags: searchParams.get('tags') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const { data, isLoading, error } = useQuery(
    ['posts', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.categories.length > 0) {
        filters.categories.forEach(cat => params.append('category', cat));
      }
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.tags) params.append('tags', filters.tags);
      params.append('page', filters.page);
      params.append('limit', '20');

      const response = await api.get(`/posts?${params.toString()}`);
      return response.data;
    }
  );

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
    
    // تحديث URL
    const params = new URLSearchParams();
    if (newFilters.stage) params.set('stage', newFilters.stage);
    if (newFilters.categories?.length > 0) params.set('categories', newFilters.categories.join(','));
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.dateRange) params.set('dateRange', newFilters.dateRange);
    if (newFilters.tags) params.set('tags', newFilters.tags);
    
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      stage: '',
      categories: [],
      sort: 'hot',
      search: '',
      dateRange: '',
      tags: '',
      page: 1,
    };
    setFilters(defaultFilters);
    setSearchParams({});
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={40} />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          حدث خطأ في تحميل المنشورات
        </h3>
        <p className="text-red-600">
          {error.response?.data?.message || 'حاول مرة أخرى'}
        </p>
      </div>
    );
  }

  const posts = data?.posts || [];
  const pagination = data?.pagination || {};

  return (
    <div>
      {/* Header with Filters */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {filters.search ? `نتائج البحث: "${filters.search}"` :
             filters.stage === 'sandbox' ? 'النقاشات النشطة' :
             filters.stage === 'wiki' ? 'الويكي المتجدد' :
             filters.categories.length > 0 ? `الفئات: ${filters.categories.join(', ')}` :
             filters.sort === 'trending' ? 'الشائع' :
             filters.sort === 'hot' ? 'الأكثر نشاطاً' :
             'أحدث النقاشات'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {pagination.total || 0} منشور
          </p>
        </div>
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">لا توجد منشورات حالياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => {
            const pageNum = i + 1;
            const params = new URLSearchParams(searchParams);
            params.set('page', pageNum);
            
            return (
              <a
                key={pageNum}
                href={`?${params.toString()}`}
                className={`px-4 py-2 rounded-lg ${
                  pageNum === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomePage;
