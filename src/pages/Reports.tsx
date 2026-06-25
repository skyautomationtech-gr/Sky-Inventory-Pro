import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Download, 
  Layers, 
  CheckCircle,
  RefreshCw,
  Archive,
  BookOpen,
  TrendingUp
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { products, sales, suppliers, currentUser } = useApp();

  const isAuthorized = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');

  const [exportingType, setExportingType] = useState<'PDF' | 'Excel' | null>(null);
  const [exportMessage, setExportMessage] = useState('');

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto shadow-sm my-12 font-sans">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4 ring-8 ring-rose-50/50">
          <TrendingUp className="w-8 h-8 opacity-75" />
        </div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Standard Staff operators do not have permissions to access financial reports or corporate analytics dashboards.
        </p>
        <p className="text-[10px] text-slate-400 font-mono mt-4 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          Role Required: Admin or Super Admin
        </p>
      </div>
    );
  }

  // Report calculations based on live Context state
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalGrossProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);

  // Live Inventory value calculation (Sum of Qty * Buying cost!)
  const totalInventoryOnCost = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
  const totalInventoryOnRetail = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  const potentialGrossProfitInWarehouse = totalInventoryOnRetail - totalInventoryOnCost;

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  // Simulating the browser download triggers
  const handleExportSim = (format: 'PDF' | 'Excel') => {
    setExportingType(format);
    setExportMessage('');

    setTimeout(() => {
      setExportingType(null);
      setExportMessage(`Contract Approved: Successfully exported "Sky_Automation_AuditReport_${format === 'PDF' ? 'PDF' : 'XLSX'}" containing logs of ${sales.length} invoices to browser downloads.`);
      
      // Clear message automatically
      setTimeout(() => setExportMessage(''), 8000);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div id="reports-hdr">
        <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Financial Reports & Data Analytics</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Review warehouse capital value assessments, pending client balances, and net margin analyses</p>
      </div>

      {exportMessage && (
        <div id="export-notif" className="bg-emerald-55 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Analytics stats blocks */}
      <div id="report-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Capital Value (Cost Base)</span>
          <h3 className="text-2xl font-display font-bold text-[#090d16] tracking-tight mt-1.5">{formatCurrency(totalInventoryOnCost)}</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Cumulative cost of warehouse components</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Evaluated Asset (Retail Base)</span>
          <h3 className="text-2xl font-display font-bold text-teal-650 text-[#0f766e] tracking-tight mt-1.5">{formatCurrency(totalInventoryOnRetail)}</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Expected retail yield at current pricing</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Net Profit Margin locked</span>
          <h3 className="text-2xl font-display font-bold text-teal-605 text-teal-600 tracking-tight mt-1.5">{formatCurrency(potentialGrossProfitInWarehouse)}</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Unreleased profit in warehouse holdings</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm group hover:border-teal-200 transition-colors">
          <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Invoiced Gross Profit</span>
          <h3 className="text-2xl font-display font-bold text-emerald-700 tracking-tight mt-1.5 flex items-center gap-1">
            <span>{formatCurrency(totalGrossProfit)}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Gross cash margin on sales transactions</p>
        </div>
      </div>

      {/* Reports Exports controllers grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left column: Excel / PDF Downloader center */}
        <div id="export-centre-card" className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-semibold font-display text-slate-800">Procurement Exporter</h3>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
              Extract physical sheet audits representing active catalogs, suppliers liability directories, timeline activity logs, and invoicing sheets.
            </p>

            <div className="space-y-3.5">
              <button
                id="btn-export-pdf"
                onClick={() => handleExportSim('PDF')}
                disabled={exportingType !== null}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-between px-4 text-xs font-bold transition-all border border-slate-100 group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Procurements Ledger (PDF Format)</span>
                </div>
                {exportingType === 'PDF' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                ) : (
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                )}
              </button>

              <button
                id="btn-export-excel"
                onClick={() => handleExportSim('Excel')}
                disabled={exportingType !== null}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-705 text-slate-700 rounded-xl flex items-center justify-between px-4 text-xs font-bold transition-all border border-slate-100 group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Inventory Matrix (Excel Sheet XLSX)</span>
                </div>
                {exportingType === 'Excel' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                ) : (
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium italic mt-6 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100/60 select-none">
            Please Note: Data extraction scripts secure audit ledger outputs within localhost thread calculations.
          </p>
        </div>

        {/* Right column: Value Assessment Catalog summary list */}
        <div id="warehouse-assessment-card" className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-semibold font-display text-slate-800">Warehouse Valuation Ledger</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Detailed capital deployment metrics compiled dynamically</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold font-sans bg-slate-50/50 tracking-tight">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Component Description Item</th>
                  <th className="py-2.5 px-3 text-center">In-Stock Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Buying Cost</th>
                  <th className="py-2.5 px-3 text-right">Cumulative Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-sans font-medium">Audit valuation trail is currently empty.</td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 text-slate-700 transition-colors font-medium">
                      <td className="py-3 px-3 font-mono font-bold text-teal-600">{p.sku}</td>
                      <td className="py-3 px-3 text-slate-805 text-slate-800 truncate max-w-[190px]" title={p.name}>{p.name}</td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-900">{p.stock}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.purchasePrice * p.stock)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
