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
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { Sale, Product } from '../types';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, ShoppingBag, FolderHeart, CalendarDays } from 'lucide-react';

interface DashboardChartsProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = [
  '#0d9488', // Teal 600
  '#0ea5e9', // Sky 500
  '#6366f1', // Indigo 500
  '#f59e0b', // Amber 500
  '#10b981', // Emerald 500
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#64748b'  // Slate 500
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sales = [], products = [] }) => {
  // Safe currency output
  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const isSalesEmpty = sales.length === 0;

  // 1. Top Selling Products (aggregated by unit quantities sold)
  const topProductsData = useMemo(() => {
    const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
    
    sales.forEach(sale => {
      if (!sale.items) return;
      sale.items.forEach(item => {
        const pid = item.productId;
        if (!pid) return;
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = {
            name: item.productName || 'Unknown SKU',
            qty: 0,
            revenue: 0
          };
        }
        productSalesMap[pid].qty += (item.quantity || 0);
        productSalesMap[pid].revenue += (item.quantity || 0) * (item.sellingPrice || 0);
      });
    });

    return Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 13) + '..' : item.name,
        fullName: item.name,
        Units: item.qty,
        Revenue: item.revenue
      }));
  }, [sales]);

  // 2. Category Wise Sales (aggregated by sum of total item revenues)
  const categorySalesData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    
    const productToCategory: { [key: string]: string } = {};
    products.forEach(p => {
      if (p.id) {
        productToCategory[p.id] = p.category || 'Other Electronics';
      }
    });

    sales.forEach(sale => {
      if (!sale.items) return;
      sale.items.forEach(item => {
        let category = productToCategory[item.productId];
        if (!category) {
          category = 'Other Electronics';
        }
        
        // Clean category to show main category parent only (e.g., Chargers)
        const mainCategory = category.split(' - ')[0] || 'Other Electronics';
        const itemVal = (item.quantity || 0) * (item.sellingPrice || 0);
        categoryMap[mainCategory] = (categoryMap[mainCategory] || 0) + itemVal;
      });
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [sales, products]);

  // Total CATEGORY Sales for percentages
  const totalCategorySalesRevenue = useMemo(() => {
    return categorySalesData.reduce((sum, item) => sum + item.value, 0);
  }, [categorySalesData]);

  // 3. Daily Sales Trend (aggregated continuously for the last 10 calendar days)
  const dailySalesData = useMemo(() => {
    const dailyMap: { [key: string]: number } = {};
    
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const today = new Date();
    const pastDays: string[] = [];
    
    // Create sliding 10 days window
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      pastDays.push(dateStr);
      dailyMap[dateStr] = 0;
    }

    sales.forEach(sale => {
      if (!sale.timestamp) return;
      try {
        const saleDateStr = formatDate(new Date(sale.timestamp));
        if (dailyMap[saleDateStr] !== undefined) {
          dailyMap[saleDateStr] += (sale.totalAmount || 0);
        }
      } catch (e) {
        console.error("Invalid sale timestamp conversion:", e);
      }
    });

    return pastDays.map(dateStr => {
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: label,
        rawDate: dateStr,
        Amount: dailyMap[dateStr]
      };
    });
  }, [sales]);

  // Custom tooltips to match smooth high-contrast styling
  const CustomTooltipCurrency = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-2.5 rounded-lg shadow-xl font-sans text-xs">
          <p className="text-slate-400 font-medium mb-1 font-mono">{label}</p>
          <p className="text-teal-400 font-bold font-mono">
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipBarGroup = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-3 rounded-xl shadow-xl font-sans text-xs max-w-xs">
          <p className="text-white font-bold mb-1 truncate">{data.fullName}</p>
          <div className="space-y-0.5 font-mono text-[11px]">
            <p className="text-teal-400 font-semibold">Units Sold: {data.Units} pcs</p>
            <p className="text-slate-400">Total Revenue: {formatCurrency(data.Revenue)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalCategorySalesRevenue > 0 ? ((data.value / totalCategorySalesRevenue) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-2.5 rounded-lg shadow-xl font-sans text-xs text-left">
          <p className="text-white font-bold mb-0.5">{data.name}</p>
          <p className="text-indigo-400 font-semibold font-mono">
            Value: {formatCurrency(data.value)} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
      
      {/* 1. Daily Sales Trend Line Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all group hover:border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-600">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Daily Invoices Progression</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">10-day continuous revenue stream timeline</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-indigo-600 font-bold">10 Days</span>
        </div>

        <div className="h-48 relative flex items-center justify-center">
          {isSalesEmpty ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/20 rounded-xl border border-dashed border-slate-100/80">
              <LineIcon className="w-8 h-8 text-slate-350 stroke-1 mb-2 animate-bounce-slow" />
              <p className="text-[11px] font-bold text-slate-700">No Sales Registry Found</p>
              <p className="text-[9px] text-slate-450 text-slate-400 mt-0.5 max-w-[180px]">Daily trends populate dynamically as payments clear</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltipCurrency />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="Amount"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#4f46e5' }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Category Wise Sales Pie Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all group hover:border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 border border-teal-150 rounded-lg text-teal-600">
              <FolderHeart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Category Share Distributions</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Revenues split across hardware classes</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-teal-605 text-teal-600 font-bold">Category</span>
        </div>

        <div className="h-48 relative flex items-center justify-center">
          {categorySalesData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/20 rounded-xl border border-dashed border-slate-100/80">
              <PieIcon className="w-8 h-8 text-slate-350 stroke-1 mb-2" />
              <p className="text-[11px] font-bold text-slate-700">No Category Distributives</p>
              <p className="text-[9px] text-slate-400 mt-0.5 max-w-[180px]">Plots show billing slices split by product type</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-row items-center justify-between">
              <div className="w-[55%] h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltipPie />} />
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={850}
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Sidebar Legends */}
              <div className="w-[45%] flex flex-col space-y-1.5 max-h-[160px] overflow-y-auto pl-2 py-1 scrollbar-none font-sans">
                {categorySalesData.map((entry, index) => {
                  const percent = totalCategorySalesRevenue > 0 ? ((entry.value / totalCategorySalesRevenue) * 100).toFixed(0) : '0';
                  return (
                    <div key={entry.name} className="flex items-start gap-1 w-full text-left">
                      <span 
                        className="w-2 h-2 rounded-full mt-1 shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <div className="min-w-0 flex-1 leading-none">
                        <p className="text-[9.5px] font-bold text-slate-700 truncate" title={entry.name}>
                          {entry.name}
                        </p>
                        <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                          {percent}% ({formatCurrency(entry.value)})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Top Selling Products Bar Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col justify-between transition-all group hover:border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 border border-amber-150 rounded-lg text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Top Moving SKUs</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Top 5 inventory items by quantity sold</p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-amber-600 font-bold">Registry</span>
        </div>

        <div className="h-48 relative flex items-center justify-center">
          {topProductsData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/20 rounded-xl border border-dashed border-slate-100/80">
              <BarChart3 className="w-8 h-8 text-slate-350 stroke-1 mb-2" />
              <p className="text-[11px] font-bold text-slate-700">No SKU Moving Records</p>
              <p className="text-[9px] text-slate-400 mt-0.5 max-w-[180px]">Aggregate sales list top SKUs dynamically</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltipBarGroup />} cursor={{ fill: '#f8fafc', opacity: 0.6 }} />
                <Bar 
                  dataKey="Units" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  animationDuration={900}
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};
