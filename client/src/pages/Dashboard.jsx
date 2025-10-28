import { useNavigate } from "react-router-dom";

const mockProjects = [
  { _id: "1", name: "AI Research Portal", description: "NLP-based research platform" },
  { _id: "2", name: "Hackathon Management", description: "Organize and track events" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Your Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <div
            key={project._id}
            className="p-5 bg-white shadow-md rounded-xl cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate(`/project/${project._id}`)}
          >
            <h2 className="font-semibold text-xl">{project.name}</h2>
            <p className="text-gray-500 mt-1">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
