import { useQuery } from 'react-query';
import api from '../../services/api';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { MessageCircle, Loader } from 'lucide-react';

const CommentSection = ({ postId }) => {
  const {
    data: comments,
    isLoading,
    error,
  } = useQuery(['comments', postId], async () => {
    const response = await api.get(`/comments/post/${postId}`);
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        فشل تحميل التعليقات
      </div>
    );
  }

  const topLevelComments = comments?.filter((c) => !c.parentComment) || [];

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-primary-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          التعليقات ({comments?.length || 0})
        </h2>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm postId={postId} />
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MessageCircle className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} postId={postId} depth={0} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
