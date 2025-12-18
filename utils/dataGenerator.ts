
import { NetworkPacket, SecurityAlert } from "../types";

const COMMON_IPS = [
  "192.168.1.10", "192.168.1.5", "10.0.0.12", "172.16.0.4", "192.168.1.20"
];

const MALICIOUS_IPS = [
  "45.33.22.11", "103.22.44.1", "185.12.33.4"
];

export const generatePacket = (forceMalicious: boolean = false): NetworkPacket => {
  const isAttack = forceMalicious || Math.random() < 0.05;
  const src = isAttack ? MALICIOUS_IPS[Math.floor(Math.random() * MALICIOUS_IPS.length)] : COMMON_IPS[Math.floor(Math.random() * COMMON_IPS.length)];
  const dst = COMMON_IPS[Math.floor(Math.random() * COMMON_IPS.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    sourceIp: src,
    destIp: dst,
    sourcePort: Math.floor(Math.random() * 65535),
    destPort: isAttack ? (Math.random() > 0.5 ? 22 : 80) : 443,
    protocol: Math.random() > 0.1 ? 'TCP' : 'UDP',
    length: Math.floor(Math.random() * 1500),
    flags: isAttack ? 'SYN' : 'ACK'
  };
};

export const detectAnomalies = (packets: NetworkPacket[]): SecurityAlert[] => {
  const alerts: SecurityAlert[] = [];
  const ipCounts: Record<string, number> = {};
  const portScans: Record<string, Set<number>> = {};

  packets.forEach(p => {
    // Brute Force / High Traffic Heuristic
    ipCounts[p.sourceIp] = (ipCounts[p.sourceIp] || 0) + 1;
    
    // Port Scan Heuristic
    if (!portScans[p.sourceIp]) portScans[p.sourceIp] = new Set();
    portScans[p.sourceIp].add(p.destPort);
  });

  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count > 15) {
      alerts.push({
        id: `alert-${Date.now()}-${ip}`,
        timestamp: new Date().toISOString(),
        severity: count > 30 ? 'critical' : 'high',
        type: 'Flooding / DoS Attempt',
        description: `Unusual traffic volume (${count} packets) from ${ip}`,
        sourceIp: ip,
        count
      });
    }
  });

  Object.entries(portScans).forEach(([ip, ports]) => {
    if (ports.size > 5) {
      alerts.push({
        id: `scan-${Date.now()}-${ip}`,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        type: 'Port Scan Detected',
        description: `Source ${ip} scanned ${ports.size} unique ports`,
        sourceIp: ip,
        count: ports.size
      });
    }
  });

  return alerts;
};
