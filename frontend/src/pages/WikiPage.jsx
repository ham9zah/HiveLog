import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import { BookOpen } from 'lucide-react';

const WikiPage = () => {
  const { postId } = useParams();

  const { data: wiki, isLoading } = useQuery(['wiki', postId], async () => {
    const response = await api.get(`/wiki/post/${postId}`);
    return response.data.wiki;
  });

  if (isLoading) {
    return <div className="text-center py-20">جاري تحميل الويكي...</div>;
  }

  if (!wiki) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          الويكي غير متوفر
        </h2>
        <p className="text-gray-600">
          هذا المنشور لا يزال في مرحلة النقاش النشط
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wiki Header */}
      <div className="bg-gradient-to-br from-wiki to-wiki-dark rounded-lg shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={32} />
          <div>
            <h1 className="text-3xl font-bold">ويكي متجدد</h1>
            <p className="text-wiki-light">
              النسخة {wiki.version} • تم التحديث منذ {new Date(wiki.generatedAt).toLocaleDateString('ar')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4">الملخص</h2>
        <div className="prose max-w-none">
          {wiki.summary}
        </div>
      </div>

      {/* Key Points */}
      {wiki.keyPoints && wiki.keyPoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">النقاط الرئيسية</h2>
          <div className="space-y-4">
            {wiki.keyPoints.map((point, index) => (
              <div key={index} className="border-r-4 border-primary-500 pr-4">
                <h3 className="font-bold text-lg mb-2">{point.title}</h3>
                <p className="text-gray-700">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opinions */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6">الآراء</h2>
        
        <div className="space-y-6">
          {/* Supporting */}
          {wiki.opinions?.supporting?.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                الآراء المؤيدة
              </h3>
              <div className="space-y-3">
                {wiki.opinions.supporting.map((opinion, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-800">{opinion.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opposing */}
          {wiki.opinions?.opposing?.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                الآراء المعارضة
              </h3>
              <div className="space-y-3">
                {wiki.opinions.opposing.map((opinion, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-gray-800">{opinion.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Questions */}
      {wiki.pendingQuestions && wiki.pendingQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">أسئلة معلقة</h2>
          <div className="space-y-3">
            {wiki.pendingQuestions.map((q, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-gray-900">{q.question}</p>
                {q.context && (
                  <p className="text-sm text-gray-600 mt-1">{q.context}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      {wiki.conclusion && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">الخلاصة</h2>
          <div className="prose max-w-none">
            {wiki.conclusion}
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiPage;
