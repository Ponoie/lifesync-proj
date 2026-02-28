import { useParams } from 'react-router-dom';

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Goal Details</h1>
      <p className="text-gray-600">Viewing goal ID: {id}</p>
    </div>
  );
}
