import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useEffect } from 'react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-gray-600 dark:text-gray-300" />
      ) : (
        <Sun size={20} className="text-yellow-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
