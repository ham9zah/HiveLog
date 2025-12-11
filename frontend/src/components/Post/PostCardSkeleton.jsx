const PostCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 animate-pulse">
      <div className="flex gap-4">
        {/* Vote skeleton */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
          
          <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
          
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
          </div>

          <div className="flex gap-4">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;
