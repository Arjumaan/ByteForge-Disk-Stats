// frontend/src/components/DiskNetwork.jsx
import React from "react";
import { useStats } from "../context/StatsContext";

export default function DiskNetwork() {
  const { diskNetwork } = useStats() || {};

  // Safe defaults to prevent null errors
  const diskIO = diskNetwork?.diskIO || {};
  const fsSize = Array.isArray(diskNetwork?.fsSize) ? diskNetwork.fsSize : [];
  const network = Array.isArray(diskNetwork?.network) ? diskNetwork.network : [];

  // rBytes / wBytes fallback (some systems return null)
  const readVal =
    diskIO.rBytes ??
    diskIO.rIO ??
    0;

  const writeVal =
    diskIO.wBytes ??
    diskIO.wIO ??
    0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 dark:text-white">
        Disk & Network
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Disk IO Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold">Disk IO</h3>
          <p className="text-sm">
            Read: {(diskIO?.rIO ?? diskIO?.rBytes ?? 0).toString()}
            | Write: {(diskIO?.wIO ?? diskIO?.wBytes ?? 0).toString()}
          </p>

          <div className="mt-3">
            {fsSize.map((d) => (
              <div key={d.fs} className="mb-3">
                <div className="flex justify-between text-sm">
                  <div>
                    {d.fs} ({d.mount})
                  </div>
                  <div>{d.use}%</div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded mt-1">
                  <div
                    style={{ width: `${d.use}%` }}
                    className="bg-blue-600 h-2 rounded"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold">Network</h3>

          <div>
            {network.map((n, idx) => {
              const tx = (n.tx_sec || 0) / 1024; // KB/s
              const rx = (n.rx_sec || 0) / 1024;
              const max = Math.max(tx, rx, 100); // Dynamic scale

              return (
                <div key={idx} className="py-3 border-b dark:border-gray-700">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>{n.iface || "Network Interface"}</span>
                    <a href="/network" className="text-blue-500 hover:underline text-xs">Details &gt;</a>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="w-8 text-gray-500">Down</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div style={{ width: `${Math.min((rx / max) * 100, 100)}%` }} className="h-full bg-emerald-500 transition-all duration-300" />
                    </div>
                    <span className="w-16 text-right font-mono">{rx.toFixed(1)} KB/s</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-gray-500">Up</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div style={{ width: `${Math.min((tx / max) * 100, 100)}%` }} className="h-full bg-blue-500 transition-all duration-300" />
                    </div>
                    <span className="w-16 text-right font-mono">{tx.toFixed(1)} KB/s</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
