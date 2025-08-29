import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetNewARRData {
  month: string;
  netNewARR: number;
  newARR: number;
  churnARR: number;
  upsellARR: number;
  downsellARR: number;
  comebackARR: number;
}

interface NetNewARRChartProps {
  data: NetNewARRData[];
}

export const NetNewARRChart = ({ data }: NetNewARRChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}:</span>
              </div>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
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
          <CardTitle>Net New ARR Over Time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload data to see ARR movement over time
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

  const maxValue = Math.max(...data.map(d => Math.max(d.newARR, Math.abs(d.churnARR), d.upsellARR)));
  const yAxisDomain = maxValue > 0 ? [-maxValue * 0.3, maxValue * 1.1] : [0, 100];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net New ARR Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly breakdown of ARR movement components
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="newARR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="upsellARR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="comebackARR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="churnARR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="downsellARR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
                domain={yAxisDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Positive areas */}
              <Area
                type="monotone"
                dataKey="newARR"
                stackId="positive"
                stroke="hsl(var(--success))"
                fill="url(#newARR)"
                name="New ARR"
              />
              <Area
                type="monotone"
                dataKey="upsellARR"
                stackId="positive"
                stroke="hsl(var(--chart-2))"
                fill="url(#upsellARR)"
                name="Upsell ARR"
              />
              <Area
                type="monotone"
                dataKey="comebackARR"
                stackId="positive"
                stroke="hsl(var(--chart-5))"
                fill="url(#comebackARR)"
                name="Comeback ARR"
              />
              
              {/* Negative areas */}
              <Area
                type="monotone"
                dataKey="churnARR"
                stackId="negative"
                stroke="hsl(var(--destructive))"
                fill="url(#churnARR)"
                name="Churn ARR"
              />
              <Area
                type="monotone"
                dataKey="downsellARR"
                stackId="negative"
                stroke="hsl(var(--warning))"
                fill="url(#downsellARR)"
                name="Downsell ARR"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-sm">New ARR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
            <span className="text-sm">Upsell ARR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-5))' }}></div>
            <span className="text-sm">Comeback ARR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span className="text-sm">Churn ARR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-sm">Downsell ARR</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};