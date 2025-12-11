import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  MessageSquare, 
  Eye, 
  ArrowUp, 
  ArrowDown,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import StageBadge from './StageBadge';

const PostCard = ({ post }) => {
  const {
    _id,
    title,
    content,
    author,
    category,
    stage,
    voteScore,
    commentCount,
    viewCount,
    createdAt,
    tags,
  } = post;

  const contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
  const timeAgo = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true, 
    locale: ar 
  });

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button className="vote-button">
            <ArrowUp size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {voteScore}
          </span>
          <button className="vote-button">
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to={`/user/${author.username}`}
              className="text-sm text-gray-600 hover:text-primary-600 font-medium"
            >
              u/{author.username}
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{timeAgo}</span>
            <span className="text-gray-400">•</span>
            <span className="badge badge-info text-xs">{category}</span>
            <StageBadge stage={stage} />
          </div>

          {/* Title */}
          <Link to={`/post/${_id}`}>
            <h2 className="text-xl font-bold text-gray-900 hover:text-primary-600 mb-2 line-clamp-2">
              {title}
            </h2>
          </Link>

          {/* Content Preview */}
          <p className="text-gray-700 mb-3 line-clamp-3">
            {contentPreview}
          </p>

          {/* Images */}
          {post.attachments && post.attachments.filter(a => a.type === 'image').length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {post.attachments
                .filter(a => a.type === 'image')
                .slice(0, 3)
                .map((img, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5000${img.url}`}
                    alt={img.name}
                    className="w-24 h-24 object-cover rounded border border-gray-200"
                  />
                ))}
              {post.attachments.filter(a => a.type === 'image').length > 3 && (
                <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-600 text-sm">
                  +{post.attachments.filter(a => a.type === 'image').length - 3}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Link 
              to={`/post/${_id}`}
              className="flex items-center gap-1 hover:text-primary-600"
            >
              <MessageSquare size={16} />
              <span>{commentCount} تعليق</span>
            </Link>
            
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{viewCount} مشاهدة</span>
            </div>

            {stage === 'wiki' && (
              <Link 
                to={`/wiki/${_id}`}
                className="flex items-center gap-1 text-wiki hover:text-wiki-dark font-medium"
              >
                <BookOpen size={16} />
                <span>عرض الويكي</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
