import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

const CommentForm = ({ postId, parentComment = null, onSuccess, depth = 0 }) => {
  const [content, setContent] = useState('');
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation(
    async (data) => {
      const response = await api.post('/comments', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('تم إضافة التعليق');
        setContent('');
        queryClient.invalidateQueries(['comments', postId]);
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل إضافة التعليق');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    createCommentMutation.mutate({
      postId,
      content,
      parentComment,
    });
  };

  if (!isAuthenticated()) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          <a href="/login" className="text-primary-600 hover:underline">
            سجّل دخول
          </a>{' '}
          لإضافة تعليق
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentComment ? 'اكتب رداً...' : 'اكتب تعليقاً...'}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows={depth > 0 ? 2 : 4}
          required
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="submit"
          disabled={createCommentMutation.isLoading || !content.trim()}
          className="btn btn-primary flex items-center gap-2"
        >
          {createCommentMutation.isLoading ? (
            <>
              <div className="w-4 h-4 spinner"></div>
              جاري النشر...
            </>
          ) : (
            <>
              <Send size={16} />
              {parentComment ? 'رد' : 'تعليق'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
