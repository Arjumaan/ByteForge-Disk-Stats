// frontend/src/components/ReportExport.jsx
import html2canvas from "html2canvas";
import axios from "axios";
import { useStats } from "../context/StatsContext";

export default function ReportExport() {
  const { latest, processTree, events } = useStats();
  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const generatePdf = async () => {
    let chartImageBase64 = null;

    const el = document.getElementById("chart-root");
    if (el) {
      try {
        const canvas = await html2canvas(el, { scale: 2 });
        chartImageBase64 = canvas.toDataURL("image/png");
      } catch (err) {
        console.error("Chart capture error:", err);
      }
    }

    // Flatten process tree
    const flatProcesses = [];
    const flatten = (nodes) => {
      nodes?.forEach((n) => {
        flatProcesses.push(n);
        if (n.children) flatten(n.children);
      });
    };
    flatten(processTree);

    const payload = {
      title: "System Report",
      statsSnapshot: latest || {},
      chartImageBase64,
      processes: flatProcesses.slice(0, 30),
      registry: [],
      events: events?.slice(0, 50) || [],
    };

    try {
      const res = await axios.post(`${backend}/report`, payload, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `system_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Report generation error:", err);
      alert("Report failed: " + err.message);
    }
  };

  return (
    <button
      onClick={generatePdf}
      className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
    >
      Download PDF Report
    </button>
  );
}
