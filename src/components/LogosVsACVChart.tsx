import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LogoACVData {
  month: string;
  newLogos: number;
  averageACV: number;
  totalNewARR: number;
}

interface LogosVsACVChartProps {
  data: LogoACVData[];
}

export const LogosVsACVChart = ({ data }: LogosVsACVChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{data.month}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>New Logos:</span>
              <span className="font-medium">{data.newLogos}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Average ACV:</span>
              <span className="font-medium">{formatCurrency(data.averageACV)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total New ARR:</span>
              <span className="font-medium">{formatCurrency(data.totalNewARR)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Logos vs Average Contract Value</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload data to see customer acquisition patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Color scale based on total new ARR
  const maxARR = Math.max(...data.map(d => d.totalNewARR));
  const getColor = (arr: number) => {
    if (maxARR === 0) return 'hsl(var(--muted-foreground))';
    const intensity = arr / maxARR;
    if (intensity > 0.8) return 'hsl(var(--success))';
    if (intensity > 0.6) return 'hsl(var(--chart-2))';
    if (intensity > 0.4) return 'hsl(var(--warning))';
    if (intensity > 0.2) return 'hsl(var(--chart-5))';
    return 'hsl(var(--muted-foreground))';
  };

  // Size scale based on total new ARR
  const getSize = (arr: number) => {
    const minSize = 40;
    const maxSize = 200;
    const intensity = arr / maxARR;
    return minSize + (maxSize - minSize) * intensity;
  };

  const maxLogos = Math.max(...data.map(d => d.newLogos));
  const maxACV = Math.max(...data.map(d => d.averageACV));

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Logos vs Average Contract Value</CardTitle>
        <p className="text-sm text-muted-foreground">
          Relationship between customer acquisition volume and deal size (bubble size = total new ARR)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              data={data}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number" 
                dataKey="newLogos"
                name="New Logos"
                domain={[0, maxLogos * 1.1]}
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'New Logos', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="averageACV"
                name="Average ACV"
                domain={[0, maxACV * 1.1]}
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
                label={{ value: 'Average ACV', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="averageACV" fill="hsl(var(--primary))">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.totalNewARR)}
                    r={Math.sqrt(getSize(entry.totalNewARR)) / 2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">Bubble Size & Color Legend:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
              <span>High ARR (80-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
              <span>Good ARR (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }}></div>
              <span>Medium ARR (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }}></div>
              <span>Low ARR (&lt;40%)</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Larger bubbles = Higher total new ARR for that month
          </div>
        </div>
      </CardContent>
    </Card>
  );
};