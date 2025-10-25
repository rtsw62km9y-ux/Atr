import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setData(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setData(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setData(res.data.parameters);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">ATR Analyzer</h1>
      <div className="bg-white shadow rounded p-6 w-full max-w-md flex flex-col gap-4">
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
        />
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze ATR"}
        </button>
        {loading && <div className="flex justify-center"><Spinner /></div>}
        {error && <div className="text-red-600">{error}</div>}
        {data && <ParameterTable parameters={data} />}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
  );
}

function ParameterTable({ parameters }) {
  return (
    <div className="mt-4 bg-gray-50 p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Extracted Technical Parameters</h2>
      <table className="min-w-full text-sm">
        <tbody>
          {Object.entries(parameters).map(([key, value]) => (
            <tr key={key}>
              <td className="font-medium pr-4">{key}:</td>
              <td>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}