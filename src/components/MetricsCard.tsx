import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  subtitle?: string;
}

export const MetricsCard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  variant = 'default',
  subtitle 
}: MetricsCardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const getChangeIcon = () => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text-muted-foreground';
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getCardVariant = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-success-light/30';
      case 'warning':
        return 'border-warning/20 bg-warning-light/30';
      case 'destructive':
        return 'border-destructive/20 bg-destructive-light/30';
      default:
        return 'hover:shadow-md transition-shadow';
    }
  };

  return (
    <Card className={`${getCardVariant()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
              {getChangeIcon()}
              <span>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};