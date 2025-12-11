import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  User, 
  Eye,
  Share2,
  Bookmark,
  Loader,
  ChevronLeft
} from 'lucide-react';
import StageBadge from '../components/Post/StageBadge';
import CommentSection from '../components/Comment/CommentSection';

const PostPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery(['post', id], async () => {
    const response = await api.get(`/posts/${id}`);
    return response.data.post;
  });

  const voteMutation = useMutation(
    async (voteType) => {
      const response = await api.post(`/posts/${id}/vote`, { voteType });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['post', id]);
        queryClient.invalidateQueries(['posts']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل التصويت');
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400 text-xl mb-4">المنشور غير موجود</p>
        <Link to="/" className="btn btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
      >
        <ChevronLeft size={20} />
        العودة للرئيسية
      </Link>

      {/* Post Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <StageBadge stage={post.stage} />
              {post.category && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {post.category}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <User size={16} />
            <Link
              to={`/profile/${post.author._id}`}
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              {post.author.username}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: ar,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} />
            {post.views || 0} مشاهدة
          </div>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none mb-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-lg leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Images */}
        {post.attachments && post.attachments.filter(a => a.type === 'image').length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              الصور المرفقة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.attachments
                .filter(a => a.type === 'image')
                .map((img, index) => (
                  <a
                    key={index}
                    href={`http://localhost:5000${img.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={`http://localhost:5000${img.url}`}
                      alt={img.name}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Vote Buttons */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <button
              onClick={() => handleVote('upvote')}
              className={`p-2 rounded hover:bg-white dark:hover:bg-gray-600 transition-colors ${
                post.userVote === 'upvote' 
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/30' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              disabled={voteMutation.isLoading}
            >
              <ThumbsUp size={20} />
            </button>
            <span className="font-bold text-gray-900 dark:text-white min-w-[40px] text-center">
              {post.voteScore || 0}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              className={`p-2 rounded hover:bg-white dark:hover:bg-gray-600 transition-colors ${
                post.userVote === 'downvote' 
                  ? 'text-red-600 bg-red-50 dark:bg-red-900/30' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              disabled={voteMutation.isLoading}
            >
              <ThumbsDown size={20} />
            </button>
          </div>

          {/* Share Button */}
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Share2 size={18} />
            مشاركة
          </button>

          {/* Bookmark Button */}
          {isAuthenticated() && (
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bookmark size={18} />
              حفظ
            </button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <CommentSection postId={id} />
      </div>
    </div>
  );
};

export default PostPage;
