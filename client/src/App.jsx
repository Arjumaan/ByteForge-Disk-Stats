import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Cleanup from './pages/Cleanup';
import Applications from './pages/Applications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Duplicates from './pages/Duplicates';
import Assistant from './pages/Assistant';
import Registry from './pages/Registry';
import TaskManager from './pages/TaskManager';
import EventViewer from './pages/EventViewer';
import ProcessTree from './pages/ProcessTree';
import LogsLive from './pages/LogsLive';
import NetworkPage from './pages/NetworkPage';
import Power from './pages/Power';
import Hardware from './pages/Hardware';
import Software from './pages/Software';
import { StatsProvider } from './context/StatsContext';
import { DiskProvider } from './context/DiskContext';

function App() {
  return (
    <DiskProvider>
      <StatsProvider>
        <Router>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8 relative">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/cleanup" element={<Cleanup />} />
                <Route path="/apps" element={<Applications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/duplicates" element={<Duplicates />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/registry" element={<Registry />} />
                <Route path="/processes" element={<TaskManager />} />
                <Route path="/process-tree" element={<ProcessTree />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/power" element={<Power />} />
                <Route path="/hardware" element={<Hardware />} />
                <Route path="/software" element={<Software />} />
                <Route path="/events" element={<EventViewer />} />
                <Route path="/logs-live" element={<LogsLive />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
      </StatsProvider>
    </DiskProvider>
  );
}

export default App;
