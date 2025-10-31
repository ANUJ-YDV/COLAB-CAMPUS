export default function TaskCard({ task }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border border-gray-200 mb-3">
      <h3 className="font-medium text-gray-800">{task.title}</h3>
      <p className="text-xs text-gray-500 mt-2 capitalize">{task.status.replace('-', ' ')}</p>
    </div>
  );
}
