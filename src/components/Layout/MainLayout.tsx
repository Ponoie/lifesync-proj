import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar/Navbar';
import { useThemeStore } from '../../stores/themeStore';

export function MainLayout() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
