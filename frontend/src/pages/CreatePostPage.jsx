import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Tag } from 'lucide-react';
import ImageUploader from '../components/Upload/ImageUploader';

const CreatePostPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'عام',
    tags: '',
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const navigate = useNavigate();

  const createPostMutation = useMutation(
    async (data) => {
      const response = await api.post('/posts', {
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(t => t),
        attachments: uploadedImages.map(img => ({
          type: 'image',
          url: img.url,
          name: img.originalname,
          size: img.size
        }))
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('تم إنشاء المنشور بنجاح');
        navigate(`/post/${data.post._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل إنشاء المنشور');
      },
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createPostMutation.mutate(formData);
  };

  const categories = [
    'سؤال',
    'نقاش',
    'فكرة',
    'تجربة',
    'طلب مساعدة',
    'عام',
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <PlusCircle className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              إنشاء منشور جديد
            </h1>
            <p className="text-gray-600 text-sm">
              شارك سؤالك أو فكرتك مع المجتمع
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفئة <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="ما الذي تريد مناقشته؟"
              required
              minLength={5}
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/300 حرف
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المحتوى <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="textarea"
              rows={12}
              placeholder="اشرح فكرتك بالتفصيل... يمكنك استخدام Markdown"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              يدعم Markdown للتنسيق
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوسوم (اختياري)
            </label>
            <div className="relative">
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input pr-10"
                placeholder="برمجة, تقنية, ذكاء اصطناعي (افصل بينها بفاصلة)"
              />
              <Tag className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الصور (اختياري)
            </label>
            <ImageUploader
              multiple={true}
              maxFiles={5}
              onUploadSuccess={(files) => {
                setUploadedImages([...uploadedImages, ...files]);
                toast.success('تمت إضافة الصور');
              }}
            />
            {uploadedImages.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  الصور المرفقة ({uploadedImages.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <img
                        src={`http://localhost:5000${img.url}`}
                        alt={img.originalname}
                        className="w-20 h-20 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              ℹ️ كيف يعمل HiveLog؟
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• سيبدأ منشورك في مرحلة "النقاش النشط" لمدة 30 يوماً</li>
              <li>• سيقوم الذكاء الاصطناعي بتحليل النقاش تلقائياً</li>
              <li>• سيتم تحويله إلى "ويكي متجدد" يحتوي على ملخص منظم</li>
              <li>• سيظل النقاش الأصلي متاحاً للمراجعة والتحقق</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createPostMutation.isLoading}
              className="btn btn-primary px-8 py-3"
            >
              {createPostMutation.isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 spinner"></div>
                  جاري النشر...
                </span>
              ) : (
                'نشر المنشور'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary px-8 py-3"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
