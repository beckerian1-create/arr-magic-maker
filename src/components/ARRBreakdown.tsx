import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, UserPlus, UserMinus, RotateCcw } from 'lucide-react';

interface ARRBreakdownData {
  total: number;
  newARR: number;
  upsellARR: number;
  churnARR: number;
  downsellARR: number;
  comebackARR: number;
}

interface ARRBreakdownProps {
  data: ARRBreakdownData;
}

export const ARRBreakdown = ({ data }: ARRBreakdownProps) => {
  const { newARR, upsellARR, churnARR, downsellARR, comebackARR, total } = data;
  
  const positiveARR = newARR + upsellARR + comebackARR;
  const negativeARR = churnARR + downsellARR;
  const netNewARR = positiveARR - negativeARR;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPercentage = (value: number) => {
    return total > 0 ? ((value / total) * 100) : 0;
  };

  const arrItems = [
    {
      label: 'New ARR',
      value: newARR,
      icon: <UserPlus className="w-4 h-4" />,
      color: 'text-success',
      bgColor: 'bg-success',
      type: 'positive'
    },
    {
      label: 'Upsell ARR',
      value: upsellARR,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2',
      type: 'positive'
    },
    {
      label: 'Comeback ARR',
      value: comebackARR,
      icon: <RotateCcw className="w-4 h-4" />,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5',
      type: 'positive'
    },
    {
      label: 'Churn ARR',
      value: churnARR,
      icon: <UserMinus className="w-4 h-4" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      type: 'negative'
    },
    {
      label: 'Downsell ARR',
      value: downsellARR,
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-warning',
      bgColor: 'bg-warning',
      type: 'negative'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          ARR Movement Breakdown
          <div className="text-sm font-normal text-muted-foreground">
            Net Change: <span className={netNewARR >= 0 ? 'text-success' : 'text-destructive'}>
              {formatCurrency(netNewARR)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-success">Positive ARR</span>
              <span className="font-medium">{formatCurrency(positiveARR)}</span>
            </div>
            <Progress 
              value={getPercentage(positiveARR)} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-destructive">Negative ARR</span>
              <span className="font-medium">{formatCurrency(negativeARR)}</span>
            </div>
            <Progress 
              value={getPercentage(negativeARR)} 
              className="h-2 [&>div]:bg-destructive"
            />
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="space-y-3">
          {arrItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${item.bgColor}/10 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {getPercentage(item.value).toFixed(1)}% of total ARR
                  </div>
                </div>
              </div>
              <div className={`font-semibold ${item.color}`}>
                {item.type === 'negative' && item.value > 0 ? '-' : ''}
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Total ARR */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Total ARR</div>
            <div className="text-xl font-bold">{formatCurrency(total)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};