import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  MoreVertical,
  Flag,
  Edit,
  Trash2
} from 'lucide-react';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, postId, depth = 0, maxDepth = 5 }) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const voteMutation = useMutation(
    async (voteType) => {
      const response = await api.post(`/comments/${comment._id}/vote`, { voteType });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل التصويت');
      },
    }
  );

  const updateMutation = useMutation(
    async (content) => {
      const response = await api.put(`/comments/${comment._id}`, { content });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('تم تحديث التعليق');
        setIsEditing(false);
        queryClient.invalidateQueries(['comments', postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل التحديث');
      },
    }
  );

  const deleteMutation = useMutation(
    async () => {
      await api.delete(`/comments/${comment._id}`);
    },
    {
      onSuccess: () => {
        toast.success('تم حذف التعليق');
        queryClient.invalidateQueries(['comments', postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل الحذف');
      },
    }
  );

  const handleVote = (voteType) => {
    if (!isAuthenticated()) {
      toast.error('يجب تسجيل الدخول للتصويت');
      return;
    }
    voteMutation.mutate(voteType);
  };

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateMutation.mutate(editContent);
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      deleteMutation.mutate();
    }
  };

  const isAuthor = user?._id === comment.author._id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;

  // Calculate indent
  const indentClass = depth > 0 ? 'mr-4 border-r-2 border-gray-200 dark:border-gray-700 pr-4' : '';

  return (
    <div className={`${indentClass}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
              {comment.author.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {comment.author.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ar,
                })}
                {comment.isEdited && ' • تم التعديل'}
              </p>
            </div>
            {depth > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                المستوى {depth}
              </span>
            )}
          </div>

          {/* Actions Menu */}
          {isAuthenticated() && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical size={16} className="text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute left-0 mt-1 bg-white dark:bg-gray-700 shadow-lg rounded-lg py-1 z-10 min-w-[150px]">
                  {isAuthor ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-right px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                      >
                        <Edit size={14} />
                        تعديل
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-right px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full text-right px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <Flag size={14} />
                      إبلاغ
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isLoading}
                className="btn btn-sm btn-primary"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="btn btn-sm btn-outline"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-4 text-sm">
          {/* Vote Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('upvote')}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                comment.userVote === 'upvote' ? 'text-green-600' : 'text-gray-500'
              }`}
              disabled={voteMutation.isLoading}
            >
              <ThumbsUp size={16} />
            </button>
            <span className="font-medium text-gray-900 dark:text-white min-w-[30px] text-center">
              {comment.voteScore || 0}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                comment.userVote === 'downvote' ? 'text-red-600' : 'text-gray-500'
              }`}
              disabled={voteMutation.isLoading}
            >
              <ThumbsDown size={16} />
            </button>
          </div>

          {/* Reply Button */}
          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <MessageCircle size={16} />
              رد
            </button>
          )}

          {/* Toggle Replies */}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {comment.replies.length} {comment.replies.length === 1 ? 'رد' : 'ردود'}
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <div className="mr-8 mb-3">
          <CommentForm
            postId={postId}
            parentComment={comment._id}
            onSuccess={() => setShowReplyForm(false)}
            depth={depth + 1}
          />
        </div>
      )}

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      {/* Max Depth Warning */}
      {depth >= maxDepth && hasReplies && (
        <div className="mr-8 text-sm text-gray-500 dark:text-gray-400 italic">
          تم الوصول للحد الأقصى من التشعبات
        </div>
      )}
    </div>
  );
};

export default CommentItem;
