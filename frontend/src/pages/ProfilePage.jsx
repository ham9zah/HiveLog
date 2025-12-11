import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import { User, MessageSquare, FileText, Award } from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();

  const { data, isLoading } = useQuery(['user', username], async () => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  });

  if (isLoading) {
    return <div className="text-center py-20">جاري التحميل...</div>;
  }

  const user = data?.user;
  const stats = data?.stats;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-start gap-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={48} className="text-primary-600" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.username}
            </h1>
            <p className="text-gray-600 mb-4">{user?.bio || 'لا يوجد وصف'}</p>
            
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-primary-600">
                  <Award size={20} />
                  <span className="text-2xl font-bold">{user?.karma || 0}</span>
                </div>
                <span className="text-sm text-gray-600">نقاط الكارما</span>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText size={20} />
                  <span className="text-2xl font-bold">{stats?.postCount || 0}</span>
                </div>
                <span className="text-sm text-gray-600">منشور</span>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 text-green-600">
                  <MessageSquare size={20} />
                  <span className="text-2xl font-bold">{stats?.commentCount || 0}</span>
                </div>
                <span className="text-sm text-gray-600">تعليق</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">المنشورات الأخيرة</h2>
        {data?.recentPosts && data.recentPosts.length > 0 ? (
          <div className="space-y-3">
            {data.recentPosts.map((post) => (
              <a
                key={post._id}
                href={`/post/${post._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  {post.title}
                </h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{post.voteScore} تصويت</span>
                  <span>{post.commentCount} تعليق</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('ar')}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">لا توجد منشورات</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
