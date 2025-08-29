import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CohortData {
  cohort: string;
  customers: number;
  startingRevenue: number;
  currentRevenue: number;
  retention: number;
  expansion: number;
}

interface CohortAnalysisProps {
  data: CohortData[];
}

export const CohortAnalysis = ({ data }: CohortAnalysisProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRetentionColor = (retention: number) => {
    if (retention >= 90) return 'bg-success text-success-foreground';
    if (retention >= 80) return 'bg-chart-2 text-white';
    if (retention >= 70) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getExpansionColor = (expansion: number) => {
    if (expansion >= 110) return 'bg-success text-success-foreground';
    if (expansion >= 100) return 'bg-chart-2 text-white';
    if (expansion >= 90) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Customer retention and revenue expansion by cohort
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
            <div>Cohort</div>
            <div>Customers</div>
            <div>Starting Revenue</div>
            <div>Current Revenue</div>
            <div>Retention %</div>
            <div>Expansion %</div>
          </div>

          {/* Data rows */}
          {data.map((cohort, index) => (
            <div key={cohort.cohort} className="grid grid-cols-6 gap-4 items-center py-2 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
              <div className="font-medium">
                {cohort.cohort}
              </div>
              <div className="text-sm">
                {cohort.customers.toLocaleString()}
              </div>
              <div className="text-sm">
                {formatCurrency(cohort.startingRevenue)}
              </div>
              <div className="text-sm font-medium">
                {formatCurrency(cohort.currentRevenue)}
              </div>
              <div>
                <Badge className={`${getRetentionColor(cohort.retention)} text-xs`}>
                  {cohort.retention.toFixed(1)}%
                </Badge>
              </div>
              <div>
                <Badge className={`${getExpansionColor(cohort.expansion)} text-xs`}>
                  {cohort.expansion.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}

          {/* Summary */}
          {data.length > 0 && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-6 gap-4 items-center font-semibold">
                <div>Average</div>
                <div>
                  {Math.round(data.reduce((sum, c) => sum + c.customers, 0) / data.length).toLocaleString()}
                </div>
                <div>
                  {formatCurrency(data.reduce((sum, c) => sum + c.startingRevenue, 0) / data.length)}
                </div>
                <div>
                  {formatCurrency(data.reduce((sum, c) => sum + c.currentRevenue, 0) / data.length)}
                </div>
                <div>
                  <Badge className={`${getRetentionColor(data.reduce((sum, c) => sum + c.retention, 0) / data.length)} text-xs`}>
                    {(data.reduce((sum, c) => sum + c.retention, 0) / data.length).toFixed(1)}%
                  </Badge>
                </div>
                <div>
                  <Badge className={`${getExpansionColor(data.reduce((sum, c) => sum + c.expansion, 0) / data.length)} text-xs`}>
                    {(data.reduce((sum, c) => sum + c.expansion, 0) / data.length).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};