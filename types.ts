
export interface NetworkPacket {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  sourcePort: number;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  length: number;
  flags: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  sourceIp: string;
  count: number;
}

export interface AIAnalysis {
  assessment: string;
  recommendations: string[];
  threatLevel: number;
}
