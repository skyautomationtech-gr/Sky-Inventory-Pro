import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  AlertTriangle, 
  ShieldAlert,
  Search,
  CheckCircle,
  Truck
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, inventoryLogs, adjustStock, currentUser, loading, addActivityLog } = useApp();

  // Selected state for stock adjusting
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState<'Stock In' | 'Stock Out'>('Stock In');
  const [adjustQuantity, setAdjustQuantity] = useState(5);
  const [adjustNotes, setAdjustNotes] = useState('');
  
  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Log searching
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Handle Manual Stock Modification
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedProductId) {
      setErrorMsg('Invalid Selection: Please choose a valid catalog product components.');
      return;
    }

    if (adjustQuantity <= 0) {
      setErrorMsg('Invalid Quantity: Adjustments must consist of positive integer values.');
      return;
    }

    const targetProduct = products.find(p => p.id === selectedProductId);
    if (!targetProduct) {
      setErrorMsg('Target product element not found in our catalogs.');
      return;
    }

    // Attempt stock calculations
    const success = adjustStock(selectedProductId, adjustType, adjustQuantity, adjustNotes);
    
    if (success) {
      setSuccessMsg(`Successfully executed stock Adjustment log for SKU: ${targetProduct.sku}.`);
      setAdjustQuantity(5);
      setAdjustNotes('');
      setSelectedProductId('');

      // Clear success feedback banner automatically
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(`Error executing stock update on SKU ${targetProduct.sku}. Check if stock contains sufficient balances.`);
    }
  };

  // Filter movements audit
  const filteredLogs = inventoryLogs.filter(log => {
    return log.productName.toLowerCase().includes(searchLogQuery.toLowerCase()) || 
           log.sku.toLowerCase().includes(searchLogQuery.toLowerCase()) || 
           log.staffName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
           (log.notes && log.notes.toLowerCase().includes(searchLogQuery.toLowerCase()));
  });

  const lowStockProducts = products.filter(p => p.stock < 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div id="inventory-hdr">
        <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Warehouse Stock & Controls</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Perform Inbound (Stock In) / Outbound (Stock Out) ledger entries and track logs</p>
      </div>

      {/* Grid: Left - Stock in/out panel, Right - Low stock items info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left Form Panel: Stock Adjustments */}
        <div id="stock-adjustment-card" className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
              <Boxes className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-semibold font-display text-slate-800">New Inventory Movement Entry</h3>
            </div>

            {/* Error & Success Feedback Banners */}
            {successMsg && (
              <div id="adj-success-banner" className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div id="adj-error-banner" className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              {/* Barcode Fast Scan Input */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10.5px] font-bold text-teal-700 flex items-center gap-1">
                  <span>⚡ Fast Scan Barcode / SKU</span>
                </label>
                <input
                  type="text"
                  placeholder="Scan barcode or enter SKU... (then press Enter)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-teal-500 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val) return;
                      const matched = products.find(p => 
                        (p.barcode && p.barcode.toLowerCase() === val.toLowerCase()) || 
                        (p.sku && p.sku.toLowerCase() === val.toLowerCase())
                      );
                      if (matched) {
                        setSelectedProductId(matched.id);
                        setSuccessMsg(`Product found: "${matched.name}" selected!`);
                        if (addActivityLog && currentUser) {
                          addActivityLog('barcode_scan', currentUser.email, `Successfully scanned barcode/SKU in Warehouse Controls: "${val}" for product "${matched.name}"`);
                        }
                        (e.target as HTMLInputElement).value = '';
                        setTimeout(() => setSuccessMsg(''), 3000);
                      } else {
                        setErrorMsg(`No product found matching "${val}"`);
                        if (addActivityLog && currentUser) {
                          addActivityLog('barcode_scan_failed', currentUser.email, `Scanned barcode/SKU in Warehouse Controls not found: "${val}"`);
                        }
                        setTimeout(() => setErrorMsg(''), 4000);
                      }
                    }
                  }}
                />
              </div>

              {/* Product Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Select Component Part *</label>
                <select
                  id="adj-product-select"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-teal-500 font-bold"
                >
                  <option value="">-- Choose item from catalog --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.brand} - {p.name} (SKU: {p.sku} | In stock: {p.stock} units)</option>
                  ))}
                </select>
              </div>

              {/* Action Type Select & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Movement Type Radio Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Transaction Class</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      id="adj-btn-stock-in"
                      type="button"
                      onClick={() => setAdjustType('Stock In')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                        adjustType === 'Stock In'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Stock In (+)</span>
                    </button>
                    
                    <button
                      id="adj-btn-stock-out"
                      type="button"
                      onClick={() => setAdjustType('Stock Out')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                        adjustType === 'Stock Out'
                          ? 'bg-rose-55 bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-705 text-slate-700'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Stock Out (-)</span>
                    </button>
                  </div>
                </div>

                {/* Adjusting Quantity */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Quantity to Adjust *</label>
                  <input
                    id="adj-quantity-input"
                    type="number"
                    min="1"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs sm:text-sm text-slate-850 text-slate-800 focus:outline-none focus:border-teal-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Memo Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Audit Ledger Notes</label>
                <input
                  id="adj-notes-input"
                  type="text"
                  placeholder="e.g., restock from supplier, operational usage, etc"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </form>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-between text-xs text-slate-400">
            <p className="italic font-medium">Operator ID: <span className="text-slate-800 font-bold">{currentUser.name}</span></p>
            <button
              id="btn-submit-adjustment"
              onClick={handleAdjustmentSubmit}
              className="px-5 py-2.5 bg-teal-605 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition-all cursor-pointer"
            >
              Post Ledger Entry
            </button>
          </div>
        </div>

        {/* Right Panel: Replenishments Summary & Critical Alerter */}
        <div id="low-stock-summary-card" className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold font-display text-slate-800">Reorder Warnings</h3>
            </div>

            <p className="text-xs text-slate-550 text-slate-500 mb-4 leading-relaxed font-medium">
              Unique categories in inventory holding <span className="text-rose-600 font-bold">fewer than 5 units</span> are flagged here. Order replacement stocks to maintain operation levels.
            </p>

            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-emerald-200 rounded-xl bg-emerald-50/20 text-xs text-emerald-800 font-mono flex items-center justify-center gap-2 font-bold select-none">
                  <CheckCircle className="w-4 h-4" />
                  <span>All parts catalog nominal (&gt;= 5 pcs)</span>
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-medium">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">SKU Code: {p.sku}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold rounded-lg text-[10px]">
                        {p.stock} units
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1.5 justify-end font-bold text-right">
            <Truck className="w-4 h-4 text-teal-600" />
            <span>SKY INVENTORY DEPOT</span>
          </div>
        </div>
      </div>

      {/* Audit History Timeline List */}
      <div id="audit-log-timeline-widget" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-semibold font-display text-slate-800">Warehouse Movements Timeline</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Log streams audit trailing in-real-time</p>
            </div>
          </div>

          {/* Log search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="log-search-input"
              type="text"
              placeholder="Filter timeline activity..."
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold font-sans bg-slate-50/50 tracking-tight">
                <th className="py-3 px-4">Date &amp; Timestamp</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Component Name</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-center">Adjusted Qty</th>
                <th className="py-3 px-4">Log Operator</th>
                <th className="py-3 px-4">Journal Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 font-semibold">
                      <div className="w-6 h-6 border-2 border-teal-550 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-600 font-bold">Retrieving movement logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans font-medium">No matching log activities recorded</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isStockIn = log.type === 'Stock In';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 text-slate-700 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-600 whitespace-nowrap">
                        {log.sku}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold max-w-[170px] truncate" title={log.productName}>
                        {log.productName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold border ${
                          isStockIn 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-205 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-205 border-rose-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-900 font-mono font-bold">
                        {log.quantity}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        {log.staffName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={log.notes || '-'}>
                        {log.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
