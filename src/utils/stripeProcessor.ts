import Papa from 'papaparse';
import { StripeTransaction, ProcessedMetrics, Customer, CohortData, NetNewARRData, LogoACVData } from '@/types/analytics';

export class StripeDataProcessor {

  private cleanAmount(n: any): number {
    if (n === null || n === undefined) return 0;
    // handle strings like "$1,234.56" or "1,234" or empty
    const s = String(n).trim();
    if (!s) return 0;
    const cleaned = s.replace(/[^0-9\.-]/g, "");
    if (!cleaned) return 0;
    const x = Number(cleaned);
    if (!isFinite(x)) return 0;
    // if looks like cents, convert
    return Math.abs(x) > 100000 ? x / 100 : x;
  }

  private transactions: StripeTransaction[] = [];
  private customers: Map<string, Customer> = new Map();

  async processFile(file: File): Promise<ProcessedMetrics> {
    const text = await this.readFile(file);
    this.transactions = this.parseCSV(text);
    this.buildCustomerProfiles();
    
    return {
      arr: this.calculateARR(),
      nrr: this.calculateNRR(),
      grr: this.calculateGRR(),
      cohorts: this.calculateCohorts(),
      netNewARRChart: this.calculateNetNewARRChart(),
      logosVsACV: this.calculateLogosVsACV()
    };
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  
  private normalizeHeader(h: string): string {
    return h.replace(/\uFEFF/g, '').trim().toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ');
  }

  private parseCSV(text: string): StripeTransaction[] {
    // Use PapaParse for robust CSV parsing
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => this.normalizeHeader(h),
    });

    const map: Record<string, string> = {
      'id': 'id',
      'charge id': 'id',
      'invoice id': 'invoice_id',
      'invoice': 'invoice_id',
      'customer id': 'customer_id',
      'customer': 'customer_id',
      'customer email': 'customer_email',
      'email': 'customer_email',
      'amount': 'amount',
      'amount captured': 'amount',
      'net': 'amount',
      'gross': 'amount',
      'amount_cents': 'amount_cents',
      'net_cents': 'net_cents',
      'currency': 'currency',
      'status': 'status',
      'created': 'created',
      'created utc': 'created',
      'created (utc)': 'created',
      'date': 'created',
      'subscription id': 'subscription_id',
      'subscription': 'subscription_id',
      'description': 'product_name',
      'product': 'product_name',
      'plan name': 'plan_name',
      'plan': 'plan_name',
      'interval': 'interval',
      'type': 'type'
    };

    const rows = (result.data as any[]).filter(Boolean);
    const out: StripeTransaction[] = [];

    for (const raw of rows) {
      const row: any = {};
      for (const [k, v] of Object.entries(raw)) {
        const key = map[this.normalizeHeader(String(k))] || this.normalizeHeader(String(k));
        row[key] = typeof v === 'string' ? v.trim() : v;
      }

      // Build transaction with graceful fallbacks
      const txn: StripeTransaction = {
        id: String(row.id || row.invoice_id || ''),
        customer_id: String(row.customer_id || row.customer_email || ''),
        customer_email: String(row.customer_email || ''),
        amount: ( (()=>{ const cents = (row.net_cents ?? row.amount_cents); if(cents!==undefined && cents!==null && String(cents).trim()!==''){ const n = Number(String(cents).replace(/[^0-9.\-]/g,'')); return isFinite(n)? n/100 : 0;} return this.cleanAmount(row.amount); })() ) / 100),
        currency: (row.currency || 'usd').toString().toLowerCase(),
        status: String(row.status || ''),
        created: String(row.created || ''),
        subscription_id: row.subscription_id ? String(row.subscription_id) : undefined,
        invoice_id: row.invoice_id ? String(row.invoice_id) : undefined,
        product_name: row.product_name ? String(row.product_name) : undefined,
        plan_name: row.plan_name ? String(row.plan_name) : undefined,
        interval: row.interval ? String(row.interval) : undefined,
        type: 'one_time',
      };

      // Infer type if missing
      const isRefund = (txn.status || '').toLowerCase().includes('refund') || txn.amount < 0;
      const isSub = !!txn.subscription_id || !!txn.interval || (txn.product_name || '').toLowerCase().includes('subscription');
      if (isRefund) txn.type = 'refund';
      else if (isSub) txn.type = 'subscription';
      else txn.type = (row.type && String(row.type)) || 'one_time' as any;

      if (txn.id && txn.customer_id) out.push(txn);
    }
    return out;
  }


  private buildCustomerProfiles(): void {
    this.customers.clear();
    
    this.transactions.forEach(transaction => {
      const customerId = transaction.customer_id;
      
      if (!this.customers.has(customerId)) {
        this.customers.set(customerId, {
          id: customerId,
          email: transaction.customer_email,
          firstTransactionDate: transaction.created,
          totalRevenue: 0,
          currentMRR: 0,
          status: 'active',
          subscriptions: []
        });
      }
      
      const customer = this.customers.get(customerId)!;
      customer.totalRevenue += transaction.amount;
      
      // Update first transaction date
      if (new Date(transaction.created) < new Date(customer.firstTransactionDate)) {
        customer.firstTransactionDate = transaction.created;
      }
    });
  }

  private calculateARR() {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const currentYearRevenue = this.getRevenueForYear(currentYear);
    const previousYearRevenue = this.getRevenueForYear(previousYear);
    
    // Calculate ARR components
    const newCustomers = this.getNewCustomersForYear(currentYear);
    const newARR = Array.from(newCustomers.values()).reduce((sum, customer) => {
      return sum + this.getCustomerRevenueForYear(customer.id, currentYear);
    }, 0);

    const existingCustomers = this.getExistingCustomersForYear(currentYear);
    let upsellARR = 0;
    let downsellARR = 0;
    let churnARR = 0;
    let comebackARR = 0;

    existingCustomers.forEach(customer => {
      const currentRevenue = this.getCustomerRevenueForYear(customer.id, currentYear);
      const previousRevenue = this.getCustomerRevenueForYear(customer.id, previousYear);
      
      if (currentRevenue === 0 && previousRevenue > 0) {
        churnARR += previousRevenue;
      } else if (currentRevenue > 0 && previousRevenue === 0) {
        comebackARR += currentRevenue;
      } else if (currentRevenue > previousRevenue) {
        upsellARR += (currentRevenue - previousRevenue);
      } else if (currentRevenue < previousRevenue) {
        downsellARR += (previousRevenue - currentRevenue);
      }
    });

    return {
      total: currentYearRevenue,
      newARR,
      upsellARR,
      churnARR,
      downsellARR,
      comebackARR
    };
  }

  private calculateNRR(): number {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const cohortRevenuePrevious = this.getRevenueForCohort(previousYear);
    const cohortRevenueCurrent = this.getCurrentRevenueForCohort(previousYear);
    
    return cohortRevenuePrevious > 0 ? (cohortRevenueCurrent / cohortRevenuePrevious) * 100 : 0;
  }

  private calculateGRR(): number {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const cohortRevenuePrevious = this.getRevenueForCohort(previousYear);
    const retainedRevenue = this.getRetainedRevenueForCohort(previousYear);
    
    return cohortRevenuePrevious > 0 ? (retainedRevenue / cohortRevenuePrevious) * 100 : 0;
  }

  private calculateCohorts(): CohortData[] {
    const cohorts: CohortData[] = [];
    const currentYear = new Date().getFullYear();
    
    // Generate cohorts for the last 5 years
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const cohortCustomers = this.getNewCustomersForYear(year);
      const startingRevenue = this.getRevenueForCohort(year);
      const currentRevenue = this.getCurrentRevenueForCohort(year);
      const retainedCustomers = this.getRetainedCustomersFromCohort(year);
      
      cohorts.push({
        cohort: year.toString(),
        customers: cohortCustomers.size,
        startingRevenue,
        currentRevenue,
        retention: cohortCustomers.size > 0 ? (retainedCustomers / cohortCustomers.size) * 100 : 0,
        expansion: startingRevenue > 0 ? (currentRevenue / startingRevenue) * 100 : 0
      });
    }
    
    return cohorts.reverse(); // Most recent first
  }

  // Helper methods
  private getRevenueForYear(year: number): number {
    return this.transactions
      .filter(t => new Date(t.created).getFullYear() === year && t.type === 'subscription')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getCustomerRevenueForYear(customerId: string, year: number): number {
    return this.transactions
      .filter(t => t.customer_id === customerId && 
                   new Date(t.created).getFullYear() === year && 
                   t.type === 'subscription')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getNewCustomersForYear(year: number): Map<string, Customer> {
    const newCustomers = new Map<string, Customer>();
    
    this.customers.forEach(customer => {
      if (new Date(customer.firstTransactionDate).getFullYear() === year) {
        newCustomers.set(customer.id, customer);
      }
    });
    
    return newCustomers;
  }

  private getExistingCustomersForYear(year: number): Customer[] {
    return Array.from(this.customers.values()).filter(customer => 
      new Date(customer.firstTransactionDate).getFullYear() < year
    );
  }

  private getRevenueForCohort(cohortYear: number): number {
    const cohortCustomers = this.getNewCustomersForYear(cohortYear);
    return Array.from(cohortCustomers.values()).reduce((sum, customer) => {
      return sum + this.getCustomerRevenueForYear(customer.id, cohortYear);
    }, 0);
  }

  private getCurrentRevenueForCohort(cohortYear: number): number {
    const currentYear = new Date().getFullYear();
    const cohortCustomers = this.getNewCustomersForYear(cohortYear);
    return Array.from(cohortCustomers.values()).reduce((sum, customer) => {
      return sum + this.getCustomerRevenueForYear(customer.id, currentYear);
    }, 0);
  }

  private getRetainedRevenueForCohort(cohortYear: number): number {
    const currentYear = new Date().getFullYear();
    const cohortCustomers = this.getNewCustomersForYear(cohortYear);
    
    return Array.from(cohortCustomers.values()).reduce((sum, customer) => {
      const currentRevenue = this.getCustomerRevenueForYear(customer.id, currentYear);
      const originalRevenue = this.getCustomerRevenueForYear(customer.id, cohortYear);
      return sum + Math.min(currentRevenue, originalRevenue);
    }, 0);
  }

  private getRetainedCustomersFromCohort(cohortYear: number): number {
    const currentYear = new Date().getFullYear();
    const cohortCustomers = this.getNewCustomersForYear(cohortYear);
    
    let retainedCount = 0;
    cohortCustomers.forEach(customer => {
      const currentRevenue = this.getCustomerRevenueForYear(customer.id, currentYear);
      if (currentRevenue > 0) {
        retainedCount++;
      }
    });
    
    return retainedCount;
  }

  private calculateNetNewARRChart(): NetNewARRData[] {
    const chartData: NetNewARRData[] = [];
    const currentDate = new Date();
    
    // Generate data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const monthString = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Get transactions for this month
      const monthTransactions = this.transactions.filter(t => {
        const transactionDate = new Date(t.created);
        return transactionDate.getFullYear() === year && 
               transactionDate.getMonth() === month &&
               t.type === 'subscription';
      });
      
      // Calculate ARR components for this month
      const newCustomersThisMonth = this.getNewCustomersForMonth(year, month);
      const newARR = Array.from(newCustomersThisMonth.values()).reduce((sum, customer) => {
        return sum + this.getCustomerRevenueForMonth(customer.id, year, month);
      }, 0);
      
      // Calculate other ARR components (simplified for monthly view)
      const existingCustomers = this.getExistingCustomersForMonth(year, month);
      let upsellARR = 0;
      let downsellARR = 0;
      let churnARR = 0;
      let comebackARR = 0;
      
      existingCustomers.forEach(customer => {
        const currentRevenue = this.getCustomerRevenueForMonth(customer.id, year, month);
        const previousRevenue = this.getCustomerRevenueForMonth(customer.id, year, month - 1);
        
        if (currentRevenue === 0 && previousRevenue > 0) {
          churnARR += previousRevenue;
        } else if (currentRevenue > 0 && previousRevenue === 0) {
          comebackARR += currentRevenue;
        } else if (currentRevenue > previousRevenue) {
          upsellARR += (currentRevenue - previousRevenue);
        } else if (currentRevenue < previousRevenue) {
          downsellARR += (previousRevenue - currentRevenue);
        }
      });
      
      chartData.push({
        month: monthString,
        netNewARR: newARR + upsellARR + comebackARR - churnARR - downsellARR,
        newARR,
        churnARR,
        upsellARR,
        downsellARR,
        comebackARR
      });
    }
    
    return chartData;
  }
  
  private calculateLogosVsACV(): LogoACVData[] {
    const chartData: LogoACVData[] = [];
    const currentDate = new Date();
    
    // Generate data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const monthString = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Get new customers for this month
      const newCustomersThisMonth = this.getNewCustomersForMonth(year, month);
      const newLogosCount = newCustomersThisMonth.size;
      
      if (newLogosCount > 0) {
        // Calculate total new ARR and average ACV
        const totalNewARR = Array.from(newCustomersThisMonth.values()).reduce((sum, customer) => {
          return sum + this.getCustomerRevenueForMonth(customer.id, year, month);
        }, 0);
        
        const averageACV = totalNewARR / newLogosCount;
        
        chartData.push({
          month: monthString,
          newLogos: newLogosCount,
          averageACV,
          totalNewARR
        });
      } else {
        chartData.push({
          month: monthString,
          newLogos: 0,
          averageACV: 0,
          totalNewARR: 0
        });
      }
    }
    
    return chartData;
  }
  
  // Additional helper methods for monthly calculations
  private getNewCustomersForMonth(year: number, month: number): Map<string, Customer> {
    const newCustomers = new Map<string, Customer>();
    
    this.customers.forEach(customer => {
      const firstDate = new Date(customer.firstTransactionDate);
      if (firstDate.getFullYear() === year && firstDate.getMonth() === month) {
        newCustomers.set(customer.id, customer);
      }
    });
    
    return newCustomers;
  }
  
  private getExistingCustomersForMonth(year: number, month: number): Customer[] {
    const targetDate = new Date(year, month, 1);
    return Array.from(this.customers.values()).filter(customer => 
      new Date(customer.firstTransactionDate) < targetDate
    );
  }
  
  private getCustomerRevenueForMonth(customerId: string, year: number, month: number): number {
    return this.transactions
      .filter(t => {
        const transactionDate = new Date(t.created);
        return t.customer_id === customerId && 
               transactionDate.getFullYear() === year && 
               transactionDate.getMonth() === month &&
               t.type === 'subscription';
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }
}