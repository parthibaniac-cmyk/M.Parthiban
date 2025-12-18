
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkPacket, SecurityAlert, AIAnalysis } from './types';
import { generatePacket, detectAnomalies } from './utils/dataGenerator';
import { analyzeThreatWithGemini } from './services/gemini';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Terminal, 
  Cpu, 
  Zap, 
  Wifi, 
  Lock,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const App: React.FC = () => {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'dashboard' | 'logs' | 'ai'>('dashboard');

  const packetsRef = useRef<NetworkPacket[]>([]);

  // Simulation Loop
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const newPacket = generatePacket();
      packetsRef.current = [newPacket, ...packetsRef.current.slice(0, 99)];
      setPackets([...packetsRef.current]);
    }, 800);

    return () => clearInterval(interval);
  }, [isLive]);

  // Alert Detection logic
  useEffect(() => {
    const newAlerts = detectAnomalies(packets);
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const unique = [...newAlerts, ...prev].slice(0, 50);
        // Deduplicate by IP + Type
        const seen = new Set();
        return unique.filter(a => {
            const key = `${a.sourceIp}-${a.type}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
      });
    }
  }, [packets]);

  const runAiAnalysis = async () => {
    if (alerts.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeThreatWithGemini(alerts, packets);
      setAiAnalysis(result);
      setView('ai');
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trafficData = packets.map((p, i) => ({
    time: i,
    length: p.length,
  })).reverse();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <nav className="w-full lg:w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <Shield className="w-8 h-8 text-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight">SENTINEL<span className="text-emerald-500">SHIELD</span></h1>
        </div>

        <div className="space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Activity size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setView('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'logs' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Terminal size={20} /> Traffic Logs
          </button>
          <button 
            onClick={() => setView('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'ai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Cpu size={20} /> AI Analyst
          </button>
        </div>

        <div className="pt-8 border-t border-gray-800">
           <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</div>
           <div className="mt-2 space-y-4">
              <div className="flex justify-between items-center px-4">
                 <span className="text-sm text-gray-400">Capture Engine</span>
                 <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                   {isLive ? 'ACTIVE' : 'PAUSED'}
                 </span>
              </div>
              <div className="flex justify-between items-center px-4">
                 <span className="text-sm text-gray-400">Database Connection</span>
                 <span className="text-xs text-emerald-500 font-medium">ESTABLISHED</span>
              </div>
           </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
            <button 
                onClick={() => setIsLive(!isLive)}
                className={`w-full py-2 rounded border text-sm transition-all ${isLive ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'}`}
            >
                {isLive ? 'Stop Traffic Capture' : 'Start Traffic Capture'}
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black bg-[radial-gradient(circle_at_top_right,_#111827,_transparent)]">
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-black/50 backdrop-blur-md border-b border-gray-800 px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-gray-200 capitalize">{view}</h2>
                <div className="h-4 w-[1px] bg-gray-700" />
                <span className="text-xs text-gray-500 mono">Session: {Math.floor(Date.now()/100000)}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" placeholder="Search IP..." className="bg-gray-900 border border-gray-800 rounded-full px-10 py-1.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors w-48 lg:w-64" />
                </div>
                <button 
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing || alerts.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
                >
                  {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  Analyze Threats
                </button>
            </div>
        </header>

        <div className="p-8 space-y-8">
            {view === 'dashboard' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Wifi className="text-emerald-400" />} label="Packets/Sec" value={(Math.random() * 50 + 10).toFixed(1)} change="+5.2%" />
                        <StatCard icon={<AlertTriangle className="text-red-400" />} label="Total Alerts" value={alerts.length} change={`${alerts.filter(a => a.severity === 'critical').length} critical`} />
                        <StatCard icon={<Lock className="text-blue-400" />} label="Active Sessions" value="1,284" change="-12" />
                        <StatCard icon={<Cpu className="text-purple-400" />} label="System Load" value="14.2%" change="Optimal" />
                    </div>

                    {/* Chart & Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Activity className="text-emerald-500" size={20} /> Traffic Throughput
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trafficData}>
                                        <defs>
                                            <linearGradient id="colorLen" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                            itemStyle={{ color: '#10b981' }}
                                        />
                                        <Area type="monotone" dataKey="length" stroke="#10b981" fillOpacity={1} fill="url(#colorLen)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
                            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" size={20} /> Real-time Alerts
                                </span>
                                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">{alerts.length}</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                                {alerts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-2">
                                        <Shield size={48} />
                                        <p>No threats detected</p>
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} className="p-3 bg-gray-950/50 border-l-2 border-red-500 rounded-r-lg hover:bg-gray-950 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-red-400 uppercase">{alert.type}</span>
                                                <span className="text-[10px] text-gray-500 mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-1">{alert.description}</p>
                                            <div className="text-[10px] text-gray-500 mono">Source: {alert.sourceIp}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {view === 'logs' && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/60">
                        <h3 className="font-semibold text-gray-300">Live Traffic Stream</h3>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-500 mono">Capturing: eth0</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-950/80 text-gray-400 uppercase text-xs font-bold tracking-widest border-b border-gray-800">
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Source IP</th>
                                    <th className="px-6 py-4">Destination IP</th>
                                    <th className="px-6 py-4">Port</th>
                                    <th className="px-6 py-4">Proto</th>
                                    <th className="px-6 py-4">Length</th>
                                    <th className="px-6 py-4">Flags</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {packets.map(p => (
                                    <tr key={p.id} className="hover:bg-emerald-500/5 transition-colors mono text-gray-400">
                                        <td className="px-6 py-3 text-xs opacity-60">{new Date(p.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-6 py-3 text-emerald-400 font-medium">{p.sourceIp}</td>
                                        <td className="px-6 py-3">{p.destIp}</td>
                                        <td className="px-6 py-3">{p.destPort}</td>
                                        <td className="px-6 py-3 text-blue-400">{p.protocol}</td>
                                        <td className="px-6 py-3">{p.length} B</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${p.flags === 'SYN' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {p.flags}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'ai' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                    <div className="bg-gradient-to-br from-gray-900 to-emerald-950 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Cpu size={120} />
                        </div>
                        
                        {!aiAnalysis ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="inline-block p-4 rounded-full bg-emerald-500/10 mb-4">
                                    <Shield className="w-12 h-12 text-emerald-500 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold">Waiting for Threat Data</h3>
                                <p className="text-gray-400 max-w-md mx-auto">Click 'Analyze Threats' to trigger Gemini-powered deep packet inspection and risk assessment.</p>
                                <button 
                                    onClick={runAiAnalysis}
                                    className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold transition-all shadow-xl shadow-emerald-600/20"
                                >
                                    Initiate Analysis
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 relative z-10">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                                <Cpu size={18} />
                                                <span className="text-sm font-bold uppercase tracking-wider">AI Executive Summary</span>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white leading-tight">
                                                {aiAnalysis.assessment}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {aiAnalysis.recommendations.map((rec, i) => (
                                                <div key={i} className="flex gap-3 bg-black/40 border border-white/5 p-4 rounded-xl">
                                                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-gray-300">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-48 bg-black/60 backdrop-blur rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
                                        <div className="relative mb-4">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                                                <circle 
                                                    cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                                    strokeDasharray={351.8}
                                                    strokeDashoffset={351.8 - (351.8 * aiAnalysis.threatLevel) / 10}
                                                    className={aiAnalysis.threatLevel > 7 ? "text-red-500" : aiAnalysis.threatLevel > 4 ? "text-orange-500" : "text-emerald-500"}
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{aiAnalysis.threatLevel}/10</span>
                                        </div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Calculated Risk</span>
                                    </div>
                                </div>
                                
                                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Lock size={14} className="text-emerald-500" />
                                        <span>Encrypted Analysis Session ID: 0x{Math.floor(Math.random()*16777215).toString(16)}</span>
                                    </div>
                                    <button 
                                        onClick={() => setAiAnalysis(null)}
                                        className="text-emerald-400 text-sm hover:underline font-medium"
                                    >
                                        Clear and Rescan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-semibold text-gray-200 mb-4">Top Attacking IP Addresses</h4>
                            <div className="space-y-4">
                                {alerts.slice(0, 3).map((a, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-help">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="mono text-sm text-gray-300">{a.sourceIp}</span>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
                                            {a.count} hits
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-semibold text-gray-200 mb-4">Detection Heuristics</h4>
                            <div className="space-y-4">
                                <HeuristicItem label="Signature Match" status="PASS" />
                                <HeuristicItem label="Anomaly Discovery" status="WARN" color="text-orange-400" />
                                <HeuristicItem label="Behavioral Analysis" status="WARN" color="text-orange-400" />
                                <HeuristicItem label="Payload Inspection" status="PASS" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, change: string }> = ({ icon, label, value, change }) => (
    <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all hover:bg-gray-900/60 group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-gray-950 rounded-xl border border-gray-800 group-hover:border-emerald-500/30 transition-colors">
                {icon}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${change.includes('+') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {change}
            </span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
);

const HeuristicItem: React.FC<{ label: string, status: string, color?: string }> = ({ label, status, color = "text-emerald-400" }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={`font-bold ${color}`}>{status}</span>
    </div>
);

export default App;
