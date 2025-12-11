import { useState } from 'react';
import { Filter, X, Calendar, Tag as TagIcon, Folder } from 'lucide-react';

const SearchFilters = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    'سؤال',
    'نقاش',
    'فكرة',
    'تجربة',
    'طلب مساعدة',
    'عام',
  ];

  const stages = [
    { value: 'sandbox', label: 'نقاش نشط' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'wiki', label: 'ويكي' },
  ];

  const sortOptions = [
    { value: 'hot', label: 'الأكثر نشاطاً' },
    { value: 'new', label: 'الأحدث' },
    { value: 'top', label: 'الأعلى تقييماً' },
    { value: 'trending', label: 'الرائج' },
  ];

  const handleCategoryToggle = (category) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onFilterChange({ ...filters, categories: updated });
  };

  const handleStageToggle = (stage) => {
    onFilterChange({ ...filters, stage: filters.stage === stage ? '' : stage });
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length > 0) count++;
    if (filters.stage) count++;
    if (filters.dateRange) count++;
    if (filters.tags) count++;
    return count;
  };

  return (
    <div className="relative">
      {/* زر فتح الفلاتر */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2 relative"
      >
        <Filter size={18} />
        <span>تصفية</span>
        {activeFiltersCount() > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
            {activeFiltersCount()}
          </span>
        )}
      </button>

      {/* قائمة الفلاتر */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Filters Panel */}
          <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                الفلاتر
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* الترتيب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الترتيب حسب
              </label>
              <select
                value={filters.sort || 'hot'}
                onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* المرحلة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Folder size={16} />
                المرحلة
              </label>
              <div className="space-y-2">
                {stages.map((stage) => (
                  <label
                    key={stage.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="stage"
                      checked={filters.stage === stage.value}
                      onChange={() => handleStageToggle(stage.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {stage.label}
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stage"
                    checked={!filters.stage}
                    onChange={() => handleStageToggle('')}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    الكل
                  </span>
                </label>
              </div>
            </div>

            {/* الفئات */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <TagIcon size={16} />
                الفئات
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* النطاق الزمني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                النطاق الزمني
              </label>
              <select
                value={filters.dateRange || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, dateRange: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">كل الأوقات</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="year">هذا العام</option>
              </select>
            </div>

            {/* الوسوم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                البحث بالوسوم
              </label>
              <input
                type="text"
                value={filters.tags || ''}
                onChange={(e) => onFilterChange({ ...filters, tags: e.target.value })}
                placeholder="برمجة, تقنية, ذكاء اصطناعي"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                افصل بين الوسوم بفاصلة
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="flex-1 btn btn-outline"
              >
                إعادة تعيين
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 btn btn-primary"
              >
                تطبيق
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchFilters;
