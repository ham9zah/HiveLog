import { useState, useRef } from 'react';
import { useMutation } from 'react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';

const ImageUploader = ({ onUploadSuccess, multiple = false, maxFiles = 5 }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation(
    async (files) => {
      const formData = new FormData();
      
      if (multiple) {
        files.forEach((file) => {
          formData.append('images', file);
        });
        const response = await api.post('/upload/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.files;
      } else {
        formData.append('image', files[0]);
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return [response.data.file];
      }
    },
    {
      onSuccess: (data) => {
        toast.success('تم رفع الصور بنجاح');
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }
        // إعادة تعيين الحالة
        setSelectedFiles([]);
        setPreviews([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل رفع الصور');
      },
    }
  );

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (!multiple && files.length > 1) {
      toast.error('يمكنك رفع صورة واحدة فقط');
      return;
    }

    if (files.length > maxFiles) {
      toast.error(`يمكنك رفع ${maxFiles} صور كحد أقصى`);
      return;
    }

    // التحقق من حجم كل ملف
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    // التحقق من نوع الملف
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('نوع الملف غير مسموح. الأنواع المسموحة: jpeg, jpg, png, gif');
      return;
    }

    setSelectedFiles(files);

    // إنشاء معاينات للصور
    const newPreviews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);

    // إعادة تعيين input إذا لم يتبق أي ملفات
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error('يرجى اختيار ملفات أولاً');
      return;
    }
    uploadMutation.mutate(selectedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    
    // محاكاة حدث تغيير الإدخال
    const event = {
      target: {
        files: files
      }
    };
    handleFileSelect(event);
  };

  return (
    <div className="space-y-4">
      {/* منطقة السحب والإفلات */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Upload className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
              اسحب الصور هنا أو انقر للاختيار
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {multiple ? `حتى ${maxFiles} صور، ` : 'صورة واحدة، '}
              حجم أقصى 5 ميجابايت
            </p>
          </div>
        </div>
      </div>

      {/* معاينة الصور المختارة */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            الصور المختارة ({previews.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                  {selectedFiles[index]?.name}
                </div>
              </div>
            ))}
          </div>

          {/* زر الرفع */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadMutation.isLoading}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {uploadMutation.isLoading ? (
              <>
                <Loader className="animate-spin" size={20} />
                جاري الرفع...
              </>
            ) : (
              <>
                <ImageIcon size={20} />
                رفع {previews.length} {previews.length === 1 ? 'صورة' : 'صور'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
