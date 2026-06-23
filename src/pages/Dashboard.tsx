import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Warehouse,
  Boxes,
  ShoppingCart,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardCharts } from '../components/DashboardCharts';
import { UpgradedAnalytics } from '../components/UpgradedAnalytics';

export const Dashboard: React.FC = () => {
  const { products, sales, inventoryLogs, adjustStock, currentUser, suppliers, loading } = useApp();
  const navigate = useNavigate();
  const [restockQty, setRestockQty] = useState<{ [key: string]: number }>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Calculations for live metrics
  const totalProductsCount = products.length;
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSalesCount = sales.length;
  const totalProfitValue = sales.reduce((sum, s) => sum + s.totalProfit, 0);
  
  // Today's Sales
  const now = new Date();
  const todaySalesAmount = sales
    .filter(s => {
      const saleDate = new Date(s.timestamp);
      return saleDate.getDate() === now.getDate() &&
             saleDate.getMonth() === now.getMonth() &&
             saleDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Monthly Revenue (current month)
  const monthlyRevenueAmount = sales
    .filter(s => {
      const saleDate = new Date(s.timestamp);
      return saleDate.getMonth() === now.getMonth() &&
             saleDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Low Stock Items
  const lowStockItems = products.filter(p => p.stock < 5);
  const lowStockCount = lowStockItems.length;

  // Pending Supplier Due
  const pendingSupplierDue = (suppliers || []).reduce((sum, s) => sum + s.dueAmount, 0);

  // Quick Restock Handler
  const handleQuickRestock = (productId: string) => {
    const qty = restockQty[productId] || 10;
    if (qty > 0) {
      const success = adjustStock(productId, 'Stock In', qty, 'Quick restock from main dashboard');
      if (success) {
        setRestockQty(prev => ({ ...prev, [productId]: 0 }));
      }
    }
  };

  // Safe currency output
  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  // Dynamic revenue chart data compiled from actual live sales
  const chartData = [
    { label: 'Jan', value: sales.filter(s => new Date(s.timestamp).getMonth() === 0).reduce((sum, s) => sum + s.totalAmount, 0) },
    { label: 'Feb', value: sales.filter(s => new Date(s.timestamp).getMonth() === 1).reduce((sum, s) => sum + s.totalAmount, 0) },
    { label: 'Mar', value: sales.filter(s => new Date(s.timestamp).getMonth() === 2).reduce((sum, s) => sum + s.totalAmount, 0) },
    { label: 'Apr', value: sales.filter(s => new Date(s.timestamp).getMonth() === 3).reduce((sum, s) => sum + s.totalAmount, 0) },
    { label: 'May', value: sales.filter(s => new Date(s.timestamp).getMonth() === 4).reduce((sum, s) => sum + s.totalAmount, 0) },
  ];
  const maxVal = Math.max(...chartData.map(d => d.value), 100);
  const isChartEmpty = chartData.every(d => d.value === 0);

  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Welcome Banner Skeleton */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse space-y-3">
          <div className="w-16 h-4 bg-slate-100 rounded-lg"></div>
          <div className="w-48 h-6 bg-slate-200 rounded-lg"></div>
          <div className="w-96 max-w-full h-4 bg-slate-100 rounded-lg"></div>
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <div className="w-16 h-3 bg-slate-100 rounded-lg"></div>
                <div className="w-6 h-6 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="space-y-1.5">
                <div className="w-20 h-6 bg-slate-200 rounded-lg"></div>
                <div className="w-24 h-3 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-pulse">
          <div className="md:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 h-72">
            <div className="w-32 h-4 bg-slate-100 rounded-lg mb-6"></div>
            <div className="flex items-end justify-between h-48 pt-4">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="w-8 bg-slate-100 rounded-t-lg" style={{ height: `${20 + idx * 10}%` }}></div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 h-72">
            <div className="w-24 h-4 bg-slate-100 rounded-lg mb-4"></div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="w-full h-8 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div id="dashboard-welcome" className="bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="absolute top-4 right-4 text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          {formattedTime}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-1.5">
          <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full font-bold font-sans uppercase tracking-wider">System Cleared</span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
            Automation Control Desk
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-medium">
            Welcome back, <span className="text-slate-800 font-semibold">{currentUser.name}</span>. Overseeing physical warehouse depots, client log streams, and active invoicing pipelines with <span className="text-teal-600 font-semibold">{currentUser.role}</span> authorization clearance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div id="dashboard-kpis" className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
        {/* Card 1: Total Products */}
        <div 
          id="kpi-total-products" 
          onClick={() => navigate('/products')}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 hover:border-teal-300 shadow-sm shadow-slate-100/30 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Total Products</span>
            <div className="p-1.5 bg-teal-50/70 text-teal-605 text-teal-600 border border-teal-100/40 rounded-lg group-hover:bg-teal-100/80 group-hover:text-teal-700 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight">{totalProductsCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Active items in catalog</p>
          </div>
        </div>

        {/* Card 2: Total Stock Items */}
        <div 
          id="kpi-total-stock-items" 
          onClick={() => navigate('/inventory')}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 hover:border-teal-300 shadow-sm shadow-slate-100/30 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Total Stock</span>
            <div className="p-1.5 bg-teal-50/70 text-teal-605 text-teal-600 border border-teal-100/40 rounded-lg group-hover:bg-teal-100/80 group-hover:text-teal-700 transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight">{totalStockItems}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Physical units in depot</p>
          </div>
        </div>

        {/* Card 3: Total Sales */}
        <div 
          id="kpi-total-sales" 
          onClick={() => navigate('/sales')}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 hover:border-teal-300 shadow-sm shadow-slate-100/30 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Total Sales</span>
            <div className="p-1.5 bg-teal-50/70 text-teal-605 text-teal-600 border border-teal-100/40 rounded-lg group-hover:bg-teal-100/80 group-hover:text-teal-700 transition-colors">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight">{totalSalesCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Completed checks</p>
          </div>
        </div>

        {/* Card 4: Total Profit (Featured Accent Card) */}
        <div 
          id="kpi-total-profit" 
          onClick={() => navigate('/reports')}
          className="bg-white/95 backdrop-blur-sm border border-teal-100/70 hover:border-teal-305 hover:shadow-md hover:shadow-teal-500/10 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-sm shadow-slate-100/30 ring-1 ring-teal-500/5 font-bold"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-teal-700 font-sans tracking-tight">Total Profit</span>
            <div className="p-1.5 bg-teal-600 text-white rounded-lg group-hover:bg-teal-500 group-hover:scale-105 transition-all shadow-sm shadow-teal-600/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-extrabold text-teal-700 tracking-tight leading-tight">{formatCurrency(totalProfitValue)}</h3>
            <p className="text-[10px] text-teal-600 mt-0.5 font-semibold">Calculated net margin</p>
          </div>
        </div>

        {/* Card 5: Today Sales */}
        <div 
          id="kpi-today-sales" 
          onClick={() => navigate('/sales')}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 hover:border-teal-300 shadow-sm shadow-slate-100/30 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Today Sales</span>
            <div className="p-1.5 bg-teal-50/70 text-teal-605 text-teal-600 border border-teal-100/40 rounded-lg group-hover:bg-teal-100/80 group-hover:text-teal-700 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight">{formatCurrency(todaySalesAmount)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Gross amount today</p>
          </div>
        </div>

        {/* Card 6: Monthly Revenue */}
        <div 
          id="kpi-monthly-revenue" 
          onClick={() => navigate('/reports')}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 hover:border-teal-300 shadow-sm shadow-slate-100/30 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Monthly Rev.</span>
            <div className="p-1.5 bg-teal-50/70 text-teal-605 text-teal-600 border border-teal-100/40 rounded-lg group-hover:bg-teal-100/80 group-hover:text-teal-700 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight">{formatCurrency(monthlyRevenueAmount)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Current progress</span>
            </p>
          </div>
        </div>

        {/* Card 7: Low Stock Alert */}
        <div 
          id="kpi-low-stock-alert" 
          onClick={() => navigate('/inventory')}
          className={`backdrop-blur-sm border rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group shadow-sm flex flex-col justify-between ${
            lowStockCount > 0 
              ? 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300' 
              : 'bg-white/90 border-slate-100 hover:border-teal-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Low Stock</span>
            <div className={`p-1.5 rounded-lg border transition-colors ${
              lowStockCount > 0 
                ? 'bg-amber-100 text-amber-800 border-amber-200/60' 
                : 'bg-teal-50 text-teal-600 border-teal-100/40 group-hover:bg-teal-100 group-hover:text-teal-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-display font-bold tracking-tight leading-tight ${lowStockCount > 0 ? 'text-amber-800' : 'text-[#090d16]'}`}>
              {lowStockCount}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {lowStockCount > 0 ? 'Items need reorder' : 'Levels stable'}
            </p>
          </div>
        </div>

        {/* Card 8: Pending Supplier Due */}
        <div 
          id="kpi-pending-supplier-due" 
          onClick={() => navigate('/suppliers')}
          className={`backdrop-blur-sm border rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group shadow-sm flex flex-col justify-between ${
            pendingSupplierDue > 0 
              ? 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300' 
              : 'bg-white/90 border-slate-100 hover:border-teal-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Supplier Dues</span>
            <div className={`p-1.5 rounded-lg border transition-colors ${
              pendingSupplierDue > 0 
                ? 'bg-rose-100 text-rose-800 border-rose-200/60' 
                : 'bg-teal-50 text-teal-600 border-teal-100/40 group-hover:bg-teal-100 group-hover:text-teal-700'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-display font-bold tracking-tight leading-tight ${pendingSupplierDue > 0 ? 'text-rose-700' : 'text-[#090d16]'}`}>
              {formatCurrency(pendingSupplierDue)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Accounts payable</p>
          </div>
        </div>
      </div>

      {/* Advanced Sales Analytics Desk */}
      <div id="dashboard-advanced-charts" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Corporate Yield & SKU Velocity Analytics Desk</span>
          </h3>
          <span className="text-[9px] text-slate-400 font-medium">Real-time dynamic data</span>
        </div>
        <DashboardCharts sales={sales} products={products} />
      </div>

      {/* Upgraded Multi-metric Business & Customer Analytics */}
      <UpgradedAnalytics sales={sales} products={products} />

      {/* Operations and Inventory Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Right Grid: Low Stock Warnings / Quick Restocker Panel */}
        <div id="inventory-alert-card" className="lg:col-span-12 lg:col-span-5 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col">
          <div className="border-b border-slate-50 pb-3 mb-3">
            <h3 className="text-sm font-semibold font-display text-slate-800">Reorder Desk</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Critical items requiring Stock-In action</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-48 pr-1">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Warehouse className="w-7 h-7 text-teal-600/20 mb-2" />
                <p className="text-xs font-bold text-slate-700">All balances are stable</p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Safe warehouse threshold levels detected.</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="p-2.5 bg-slate-50/50 border border-slate-100/80 hover:border-teal-200 hover:bg-white rounded-xl flex items-center justify-between gap-3 transition-all duration-200">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-100 px-1 py-0.5 rounded font-bold">SKU: {item.sku}</span>
                      <span className="text-[9px] text-rose-700 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-mono">Qty: {item.stock}</span>
                    </div>
                  </div>
                  
                  {/* Quick restock input field and triggers */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="Qty"
                      value={restockQty[item.id] !== undefined ? (restockQty[item.id] || '') : ''} 
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setRestockQty(prev => ({ ...prev, [item.id]: isNaN(v) ? 0 : v }));
                      }}
                      className="w-12 bg-white border border-slate-200 rounded-lg py-1 text-center text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 shadow-inner"
                    />
                    <button
                      id={`btn-dash-restock-${item.id}`}
                      onClick={() => handleQuickRestock(item.id)}
                      className="p-1 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs transition-colors flex items-center gap-0.5 font-semibold shadow-sm hover:shadow-teal-500/10"
                      title="Stock In to catalog"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>In</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Left Side: Recent Sales Log (Merged next to Reorder Desk) */}
        <div id="recent-sales-widget" className="lg:col-span-7 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold font-display text-slate-800">Processed Invoices</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Live sales transactions log stream</p>
            </div>
            <button 
              onClick={() => navigate('/sales')} 
              className="text-[10px] text-teal-600 hover:text-teal-700 font-mono font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>View Terminal</span>
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase font-mono tracking-wider bg-slate-50/50 rounded-lg">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[11px] text-slate-400 font-medium font-sans">No sales transactions processed today</td>
                  </tr>
                ) : (
                  sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 text-xs transition-all font-medium text-slate-700">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{sale.invoiceNo}</td>
                      <td className="py-2.5 px-3 text-slate-800 truncate max-w-[140px]" title={sale.customerName}>{sale.customerName}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900 font-mono font-bold">{formatCurrency(sale.totalAmount)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono font-bold text-slate-500">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Corporate Audit Trail Row */}
      <div className="grid grid-cols-1 gap-4">
        {/* Full Width Activity Logs */}
        <div id="recent-logs-widget" className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/50 flex flex-col">
          <div className="border-b border-slate-50 pb-3 mb-3">
            <h3 className="text-sm font-semibold font-display text-slate-800">Hardware Activity Log</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Comprehensive movements audit trailing</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 pr-1 text-xs">
            {inventoryLogs.length === 0 ? (
              <div className="py-8 text-center text-[11px] text-slate-400 font-medium font-sans">No movements logged to catalog</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {inventoryLogs.slice(0, 5).map((log) => {
                  const isStockIn = log.type === 'Stock In';
                  return (
                    <div key={log.id} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 hover:border-teal-100/80 hover:bg-white transition-all duration-200 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800 truncate text-[11px]" title={log.productName}>{log.productName}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold border shrink-0 ${
                            isStockIn 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isStockIn ? `+${log.quantity}` : `-${log.quantity}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-semibold">
                          <span>Op: {log.staffName}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-[9.5px] text-slate-500 italic mt-1.5 truncate border-t border-slate-100/60 pt-1 leading-tight">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
