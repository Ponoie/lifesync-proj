import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found</p>
      <Link
        to="/dashboard"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
