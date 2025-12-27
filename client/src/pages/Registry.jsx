// frontend/src/pages/Registry.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function Registry() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const backend = import.meta.env.VITE_BACKEND_URL || "/api";

  useEffect(() => {
    axios
      .get(`${backend}/registry`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Registry Viewer</h1>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height={24} />
          <LoadingSkeleton height={24} />
          <LoadingSkeleton height={24} />
          <LoadingSkeleton height={24} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700 divide-y dark:divide-gray-700">
          {data.map((item, index) => (
            <div key={index} className="py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{item.name}</p>
              <p className="text-lg dark:text-white break-all">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
