import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { MetricsCard } from './MetricsCard';
import { ARRBreakdown } from './ARRBreakdown';
import { CohortAnalysis } from './CohortAnalysis';
import { StripeDataProcessor } from '@/utils/stripeProcessor';
import { ProcessedMetrics } from '@/types/analytics';
import { TrendingUp, Users, DollarSign, Repeat } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const Dashboard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<ProcessedMetrics | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const processor = new StripeDataProcessor();
      const processedMetrics = await processor.processFile(file);
      setMetrics(processedMetrics);
      
      toast({
        title: "File processed successfully",
        description: `Analyzed ${file.name} and generated your SaaS metrics.`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "Please check that your file is a valid Stripe export.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SaaS Analytics Platform
              </h1>
              <p className="text-muted-foreground text-lg">
                Transform your Stripe data into actionable SaaS metrics
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Get Started</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload your Stripe export file to automatically calculate ARR, NRR, GRR, and detailed cohort analysis. 
                Supports CSV and Excel formats from Stripe's standard export.
              </p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            
            <div className="grid md:grid-cols-4 gap-6 mt-12">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium">ARR Analysis</h3>
                <p className="text-sm text-muted-foreground">New, upsell, churn, downsell, and comeback ARR</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-accent/10 rounded-lg flex items-center justify-center">
                  <Repeat className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-medium">Retention Metrics</h3>
                <p className="text-sm text-muted-foreground">NRR and GRR calculations</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-success/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-medium">Cohort Analysis</h3>
                <p className="text-sm text-muted-foreground">Customer retention and expansion by cohort</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-warning/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-medium">Revenue Insights</h3>
                <p className="text-sm text-muted-foreground">Detailed revenue movement analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">SaaS Analytics Dashboard</h1>
              <p className="text-muted-foreground">Your Stripe data analysis results</p>
            </div>
            <button
              onClick={() => setMetrics(null)}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            >
              Upload New File
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total ARR"
            value={metrics.arr.total}
            icon={<DollarSign className="w-4 h-4" />}
            variant="success"
          />
          <MetricsCard
            title="Net Revenue Retention"
            value={`${metrics.nrr.toFixed(1)}%`}
            change={metrics.nrr - 100}
            changeLabel="vs baseline"
            icon={<TrendingUp className="w-4 h-4" />}
            variant={metrics.nrr >= 100 ? "success" : "warning"}
          />
          <MetricsCard
            title="Gross Revenue Retention"
            value={`${metrics.grr.toFixed(1)}%`}
            change={metrics.grr - 100}
            changeLabel="vs baseline"
            icon={<Repeat className="w-4 h-4" />}
            variant={metrics.grr >= 90 ? "success" : "warning"}
          />
          <MetricsCard
            title="Net New ARR"
            value={metrics.arr.newARR + metrics.arr.upsellARR + metrics.arr.comebackARR - metrics.arr.churnARR - metrics.arr.downsellARR}
            icon={<Users className="w-4 h-4" />}
            subtitle="Total ARR movement"
          />
        </div>

        {/* ARR Breakdown */}
        <ARRBreakdown data={metrics.arr} />

        {/* Cohort Analysis */}
        <CohortAnalysis data={metrics.cohorts} />
      </div>
    </div>
  );
};