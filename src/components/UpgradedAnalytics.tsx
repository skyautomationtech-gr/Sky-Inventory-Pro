import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid
} from 'recharts';
import { Sale, Product } from '../types';
import { 
  ShoppingBag, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Phone, 
  CalendarDays, 
  Wallet,
  Coins,
  Building,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

interface UpgradedAnalyticsProps {
  sales: Sale[];
  products: Product[];
}

const PALETTE = {
  Teal: '#0d9488',
  Sky: '#0ea5e9',
  Indigo: '#6366f1',
  Amber: '#f59e0b',
  Emerald: '#10b981',
  Pink: '#ec4899',
  Violet: '#8b5cf6',
  Slate: '#64748b'
};

// Colors associated with each payment method
const PAYMENT_BRAND_COLORS: { [key: string]: string } = {
  'Cash': '#0d9488',   // Teal
  'bKash': '#E2125B',  // Official bKash Pink
  'Nagad': '#FA4D05',  // Official Nagad Orange/Red
  'Rocket': '#8C3280', // Official Rocket Purple
  'Bank': '#1e40af'    // Deep Blue
};

export const UpgradedAnalytics: React.FC<UpgradedAnalyticsProps> = ({ sales = [], products = [] }) => {
  const isSalesEmpty = sales.length === 0;

  // Safe currency output
  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  // Safe date output
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // ==========================================
  // WIDGET 1: BEST SELLING PRODUCTS (Horizontal Bar Chart)
  // ==========================================
  const bestSellersData = useMemo(() => {
    const counts: { [key: string]: { name: string; sku: string; qty: number; revenue: number } } = {};

    sales.forEach(sale => {
      if (!sale.items) return;
      sale.items.forEach(item => {
        const pid = item.productId || 'unknown';
        if (!counts[pid]) {
          counts[pid] = {
            name: item.productName || 'Unknown Product',
            sku: item.sku || 'N/A',
            qty: 0,
            revenue: 0
          };
        }
        counts[pid].qty += (item.quantity || 0);
        counts[pid].revenue += (item.quantity * item.sellingPrice);
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(item => ({
        ...item,
        // short name for horizontal chart representation
        displayName: item.name.length > 15 ? item.name.substring(0, 12) + '..' : item.name
      }));
  }, [sales]);

  // ==========================================
  // WIDGET 2: TOP CUSTOMERS BY VALUE (Compact Analytics & Table)
  // ==========================================
  const topCustomersData = useMemo(() => {
    const customerMap: { 
      [key: string]: { 
        name: string; 
        phone: string; 
        totalOrders: number; 
        totalAmount: number; 
        lastPurchaseDate: string; 
      } 
    } = {};

    sales.forEach(sale => {
      const phone = sale.customerPhone?.trim() || '';
      const name = sale.customerName?.trim() || 'Walk-in Customer';
      const key = phone || name.toLowerCase();

      if (!customerMap[key]) {
        customerMap[key] = {
          name,
          phone: phone || 'Walk-in / No Phone',
          totalOrders: 0,
          totalAmount: 0,
          lastPurchaseDate: sale.timestamp
        };
      }

      const client = customerMap[key];
      client.totalOrders += 1;
      client.totalAmount += (sale.totalAmount || 0);
      
      if (new Date(sale.timestamp) > new Date(client.lastPurchaseDate)) {
        client.lastPurchaseDate = sale.timestamp;
      }
    });

    const sortedAll = Object.values(customerMap).sort((a, b) => b.totalAmount - a.totalAmount);
    return {
      top5Chart: sortedAll.slice(0, 5).map(c => ({
        ...c,
        displayName: c.name.length > 12 ? c.name.substring(0, 10) + '..' : c.name
      })),
      top5Table: sortedAll.slice(0, 5)
    };
  }, [sales]);

  // ==========================================
  // WIDGET 3: PAYMENT METHOD SUMMARY
  // ==========================================
  const paymentSummaryData = useMemo(() => {
    const methods: { [key: string]: number } = {
      'Cash': 0,
      'bKash': 0,
      'Nagad': 0,
      'Rocket': 0,
      'Bank': 0
    };

    let totalVolume = 0;

    sales.forEach(sale => {
      const method = sale.paymentMethod;
      if (methods[method] !== undefined) {
        methods[method] += (sale.totalAmount || 0);
        totalVolume += (sale.totalAmount || 0);
      } else {
        // Fallback for custom entries if any
        methods['Cash'] += (sale.totalAmount || 0);
        totalVolume += (sale.totalAmount || 0);
      }
    });

    const chartItems = Object.entries(methods)
      .map(([name, value]) => ({
        name,
        value,
        color: PAYMENT_BRAND_COLORS[name] || PALETTE.Slate
      }))
      .filter(item => item.value > 0); // Only show methods with transactions

    return {
      chartItems,
      breakdown: methods,
      totalVolume
    };
  }, [sales]);

  // Combined empty checker
  const isNoSales = sales.length === 0;

  // Custom tooltips
  const TooltipBestSellers = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-xl leading-normal text-xs font-sans max-w-xs">
          <p className="font-bold border-b border-slate-800 pb-1.5 mb-1.5 text-teal-400">{data.name}</p>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <p>SKU: <span className="text-white font-bold">{data.sku}</span></p>
            <p>Units Sold: <span className="text-teal-300 font-bold">{data.qty} pcs</span></p>
            <p>Gross Value: <span className="text-indigo-300 font-bold">{formatCurrency(data.revenue)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const TooltipTopCustomers = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-xl leading-normal text-xs font-sans max-w-xs">
          <p className="font-bold border-b border-slate-800 pb-1.5 mb-1.5 text-indigo-400">{data.name}</p>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <p>Contact: <span className="text-white font-bold">{data.phone}</span></p>
            <p>Order Count: <span className="text-indigo-300 font-bold">{data.totalOrders} invoices</span></p>
            <p>Total Purchase: <span className="text-teal-300 font-bold">{formatCurrency(data.totalAmount)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const TooltipPaymentPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = paymentSummaryData.totalVolume > 0 
        ? ((data.value / paymentSummaryData.totalVolume) * 100).toFixed(1) 
        : '0.0';
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-lg p-2.5 shadow-xl text-xs font-sans">
          <p className="font-bold" style={{ color: data.color }}>{data.name}</p>
          <p className="font-mono text-[11px] mt-0.5 text-slate-300">
            Amount: <span className="text-white font-bold">{formatCurrency(data.value)}</span> ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 3-Column Metrics Row for Executive Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Best Selling Products (Horizontal Bar Chart) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all hover:border-slate-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 border border-teal-150 rounded-lg text-teal-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Best Selling Products</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Top SKUs ranked by total quantity sold</p>
                </div>
              </div>
              <span className="text-[9px] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-teal-600 font-bold">Qty Demands</span>
            </div>

            <div className="h-48 relative flex items-center justify-center">
              {isNoSales || bestSellersData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/10 rounded-xl border border-dashed border-slate-200/40">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <p className="text-[11px] font-bold text-slate-700">No Sales Registry Found</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 max-w-[180px]">Inventory sales records will compile ranking metrics instantly.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={bestSellersData}
                    margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      dataKey="displayName" 
                      type="category" 
                      stroke="#475569" 
                      fontSize={9.5} 
                      tickLine={false} 
                      axisLine={false}
                      width={85}
                    />
                    <Tooltip content={<TooltipBestSellers />} cursor={{ fill: '#f8fafc', opacity: 0.6 }} />
                    <Bar 
                      dataKey="qty" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                      animationDuration={805}
                    >
                      {bestSellersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(PALETTE)[index % Object.values(PALETTE).length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Widget 2: Top Customers (Compact Horizontal Chart) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all hover:border-slate-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Top Customers</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Top purchasers ranked by absolute spending</p>
                </div>
              </div>
              <span className="text-[9px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-600 font-bold">VIP Ranking</span>
            </div>

            <div className="h-48 relative flex items-center justify-center">
              {isNoSales || topCustomersData.top5Chart.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/10 rounded-xl border border-dashed border-slate-200/40">
                  <Users className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <p className="text-[11px] font-bold text-slate-700">No Customers Tracked</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 max-w-[180px]">Customer invoice metrics populate automatically upon sales checkpoint.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topCustomersData.top5Chart}
                    margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <YAxis 
                      dataKey="displayName" 
                      type="category" 
                      stroke="#475569" 
                      fontSize={9.5} 
                      tickLine={false} 
                      axisLine={false}
                      width={85}
                    />
                    <Tooltip content={<TooltipTopCustomers />} cursor={{ fill: '#f8fafc', opacity: 0.6 }} />
                    <Bar 
                      dataKey="totalAmount" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                      animationDuration={805}
                    >
                      {topCustomersData.top5Chart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#0ea5e9', '#0d9488', '#8b5cf6', '#ec4899'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Widget 3: Payment Method Summary (Pie Chart & Compact Cards Combo) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all hover:border-slate-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 border border-amber-150 rounded-lg text-amber-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Payment Summary</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Aggregation of receipts across channels</p>
                </div>
              </div>
              <span className="text-[9px] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-amber-600 font-bold">Channels</span>
            </div>

            <div className="h-48 relative flex items-center justify-center">
              {isNoSales || paymentSummaryData.chartItems.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/10 rounded-xl border border-dashed border-slate-200/40">
                  <CreditCard className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <p className="text-[11px] font-bold text-slate-700">No Revenue Logged</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 max-w-[180px]">Payment breakdowns will form automatically once funds are recorded.</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-between">
                  {/* Left Pie donut chart */}
                  <div className="w-[50%] h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<TooltipPaymentPie />} />
                        <Pie
                          data={paymentSummaryData.chartItems}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey="value"
                          animationDuration={805}
                        >
                          {paymentSummaryData.chartItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Total</span>
                      <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                        ${paymentSummaryData.totalVolume >= 1000 ? `${(paymentSummaryData.totalVolume / 1000).toFixed(1)}k` : paymentSummaryData.totalVolume.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Right dense grid cards showing channel breakdowns */}
                  <div className="w-[50%] flex flex-col py-1 pl-2 gap-1 max-h-[180px] overflow-y-auto scrollbar-none font-sans text-left">
                    {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank'].map(methodName => {
                      const amount = paymentSummaryData.breakdown[methodName] || 0;
                      const color = PAYMENT_BRAND_COLORS[methodName] || '#64748b';
                      const pct = paymentSummaryData.totalVolume > 0 ? ((amount / paymentSummaryData.totalVolume) * 100).toFixed(0) : '0';
                      
                      return (
                        <div 
                          key={methodName} 
                          className="flex items-center justify-between p-1 px-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] leading-tight transition-transform duration-200 hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="font-bold text-slate-700 truncate">{methodName}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-950 font-mono text-[9px]">{formatCurrency(amount)}</p>
                            <span className="text-[8px] font-semibold text-slate-400 font-mono">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Table Section: Top Customers In-depth Ledger (Table strictly below chart as requested) */}
      {!isNoSales && topCustomersData.top5Table.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
            <div>
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Top Customer Acquisitions Ledger</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Granular audit list of the top 5 cash flow generators</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-mono tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-center">Total Orders</th>
                  <th className="py-2.5 px-3 text-right">Total Purchase</th>
                  <th className="py-2.5 px-3 text-right">Last Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topCustomersData.top5Table.map((cust, idx) => (
                  <tr key={`${cust.name}-${cust.phone}`} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PAYMENT_BRAND_COLORS[cust.name] || ['#6366f1', '#0ea5e9', '#0d9488', '#8b5cf6', '#ec4899'][idx % 5] }}></span>
                      <span className="font-bold text-slate-800 truncate max-w-[180px]" title={cust.name}>{cust.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{cust.phone}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">{cust.totalOrders}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(cust.totalAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px]">
                      {formatDate(cust.lastPurchaseDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
