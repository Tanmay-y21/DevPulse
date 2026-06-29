import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface HealthChartProps {
  complexityScore: number;
  filesCount: number;
}

export default function HealthChart({ complexityScore, filesCount }: HealthChartProps) {
  const data = [
    { name: 'Baseline', Complexity: 10, Files: 1 },
    { name: 'Prior Commit Block', Complexity: Math.max(15, complexityScore - 15), Files: Math.max(1, filesCount - 2) },
    { name: 'Current Pulse', Complexity: complexityScore, Files: filesCount },
  ];

  return (
    /* Dashboard wrapper using semi-transparent background overlays over custom themes */
    <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          {/* Accent icon matching system electric-blue styling */}
          <div className="p-2 bg-electric-blue/10 rounded-xl text-electric-blue text-sm">膜</div>
          <div>
            <h3 className="text-sm font-bold text-white">Metrics Trajectory</h3>
            <p className="text-xs text-white/40">Visualizing systemic shifts across work blocks</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} />
            <XAxis 
              dataKey="name" 
              stroke="#ffffff" 
              opacity={0.4}
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="#ffffff" 
              opacity={0.4}
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0D0D0D', 
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '12px'
              }} 
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            
            {/* Area 1: Complexity Score - Hardcoded exact hex string to prevent SVG rendering drops */}
            <Area 
              name="Complexity Score"
              type="monotone" 
              dataKey="Complexity" 
              stroke="#00d2ff" 
              strokeWidth={2}
              fill="#00d2ff"
              fillOpacity={0.08} 
            />
            
            {/* Area 2: Files Impacted - Hardcoded exact hex string to prevent SVG rendering drops */}
            <Area 
              name="Files Impacted"
              type="monotone" 
              dataKey="Files" 
              stroke="#39ff14" 
              strokeWidth={2}
              fill="#39ff14"
              fillOpacity={0.08} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}