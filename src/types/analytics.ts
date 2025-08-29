export interface StripeTransaction {
  id: string;
  customer_id: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  subscription_id?: string;
  invoice_id?: string;
  product_name?: string;
  plan_name?: string;
  interval?: string;
  type: 'subscription' | 'one_time' | 'refund';
}

export interface ProcessedMetrics {
  arr: {
    total: number;
    newARR: number;
    upsellARR: number;
    churnARR: number;
    downsellARR: number;
    comebackARR: number;
  };
  nrr: number; // Net Revenue Retention
  grr: number; // Gross Revenue Retention
  cohorts: CohortData[];
  netNewARRChart: NetNewARRData[];
  logosVsACV: LogoACVData[];
}

export interface NetNewARRData {
  month: string;
  netNewARR: number;
  newARR: number;
  churnARR: number;
  upsellARR: number;
  downsellARR: number;
  comebackARR: number;
}

export interface LogoACVData {
  month: string;
  newLogos: number;
  averageACV: number;
  totalNewARR: number;
}

export interface CohortData {
  cohort: string;
  customers: number;
  startingRevenue: number;
  currentRevenue: number;
  retention: number;
  expansion: number;
}

export interface Customer {
  id: string;
  email: string;
  firstTransactionDate: string;
  totalRevenue: number;
  currentMRR: number;
  status: 'active' | 'churned' | 'paused';
  subscriptions: Subscription[];
}

export interface Subscription {
  id: string;
  customer_id: string;
  status: string;
  start_date: string;
  end_date?: string;
  plan_name: string;
  amount: number;
  interval: string;
}