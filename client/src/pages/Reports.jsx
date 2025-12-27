import { Card, Title, Text, Button } from '@tremor/react';
import { FileText, Download, Printer } from 'lucide-react';
import { api } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {

    const backend = import.meta.env.VITE_BACKEND_URL || "/api";

    const downloadJSON = () => {
        // Trigger download
        window.location.href = `${backend}/reports/download`;
    };

    const generatePDF = async () => {
        try {
            // Fetch comprehensive data
            const [overview, apps, reportRes] = await Promise.all([
                api.getOverview(),
                api.getApps(),
                fetch(`${backend}/reports/download`).then(res => res.json())
            ]);

            const doc = new jsPDF();
            // Unwrap report response (JSON endpoint returns 'report' object or the object itself)
            // My controller returns the object directly.
            const { system, os: osInfo, cpu, battery, graphics, network, storage } = reportRes;

            // Header
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.text("ByteForge System Report", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
            doc.text(`Hostname: ${reportRes.hostname} (${reportRes.platform})`, 14, 33);
            doc.setDrawColor(200, 200, 200);
            doc.line(14, 36, 196, 36);

            // 1. System Overview
            let y = 45;
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text("System Overview", 14, y);
            y += 8;
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);

            doc.text(`OS: ${osInfo.distro} ${osInfo.release} (${osInfo.arch})`, 14, y);
            y += 5;
            doc.text(`Kernel: ${osInfo.kernel || 'N/A'}`, 14, y);
            y += 5;
            doc.text(`Model: ${system.manufacturer} ${system.model}`, 14, y);
            y += 5;
            doc.text(`CPU: ${cpu.manufacturer} ${cpu.brand} (${cpu.cores} Cores @ ${cpu.speed}GHz)`, 14, y);
            y += 5;
            if (battery && battery.hasBattery) {
                doc.text(`Battery: ${battery.percent}% (${battery.isCharging ? 'Charging' : 'Discharging'})`, 14, y);
                y += 5;
            }

            // 2. Storage Analysis
            y += 10;
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text("Storage Analysis", 14, y);
            y += 2;

            const diskData = overview.disks.map(d => [
                d.mount,
                d.type,
                `${(d.used / 1024 / 1024 / 1024).toFixed(1)} GB`,
                `${(d.size / 1024 / 1024 / 1024).toFixed(1)} GB`,
                `${d.usePercent.toFixed(1)}%`
            ]);

            doc.autoTable({
                startY: y + 5,
                head: [['Mount', 'Type', 'Used', 'Total', 'Usage']],
                body: diskData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }
            });

            // 3. Network Interfaces
            y = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Network Interfaces", 14, y);

            const netData = network
                .filter(n => !n.internal && n.mac !== '00:00:00:00:00:00')
                .map(n => [n.iface, n.ip4 || 'N/A', n.mac, n.operstate === 'up' ? 'Active' : 'Down']);

            doc.autoTable({
                startY: y + 5,
                head: [['Interface', 'IP Address', 'MAC', 'Status']],
                body: netData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] } // Emerald
            });

            // 4. Installed Apps (Top 25)
            y = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Installed Applications (Top 25)", 14, y);
            y += 2;

            const appData = apps.slice(0, 25).map(a => [
                a.displayName.substring(0, 50),
                a.displayVersion ? a.displayVersion.substring(0, 15) : '-',
                a.publisher ? a.publisher.substring(0, 30) : '-'
            ]);

            doc.autoTable({
                startY: y + 5,
                head: [['Application', 'Version', 'Publisher']],
                body: appData,
                theme: 'striped',
                headStyles: { fillColor: [239, 68, 68] } // Red
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
                doc.text("ByteForge Stats Board - Comprehensive System Report", 14, 285);
            }

            doc.save(`ByteForge_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF. See console for details.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Reports</h2>
                    <p className="text-slate-500 mt-1">Generate and export system health snapshots</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white ring-1 ring-slate-200 border-l-4 border-blue-500 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="text-blue-500" />
                            <Title>Raw Data Snapshot (JSON)</Title>
                        </div>
                        <Text className="text-slate-600 mb-6">
                            Full system dump including hardware specs, software environment, disk hierarchies, batteries, and raw metrics. Best for backups or automated analysis.
                        </Text>
                    </div>
                    <Button variant="secondary" icon={Download} onClick={downloadJSON}>
                        Download Full JSON
                    </Button>
                </Card>

                <Card className="bg-white ring-1 ring-slate-200 border-l-4 border-red-500 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Printer className="text-red-500" />
                            <Title>Executive Summary (PDF)</Title>
                        </div>
                        <Text className="text-slate-600 mb-6">
                            Professional PDF report summarizing system hardware, storage health, network configuration, and top installed applications. Suitable for archiving or sharing with IT.
                        </Text>
                    </div>
                    <Button variant="primary" color="red" icon={FileText} onClick={generatePDF}>
                        Generate Full Report
                    </Button>
                </Card>
            </div>
        </div>
    );
}
