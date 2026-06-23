import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Phone, 
  MapPin, 
  DollarSign, 
  X,
  CreditCard
} from 'lucide-react';
import { Supplier } from '../types';

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, currentUser, loading, products } = useApp();

  // Dialog overlays
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formPaid, setFormPaid] = useState(0);
  const [formDue, setFormDue] = useState(0);

  // Local search
  const [searchQuery, setSearchQuery] = useState('');

  // Reconcile due state
  const [activePaySupplier, setActivePaySupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState(100);

  // Error feeds
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormName(supplier.name);
      setFormPhone(supplier.phone);
      setFormAddress(supplier.address);
      setFormProduct(supplier.productSupplied);
      setFormPaid(supplier.paymentPaid);
      setFormDue(supplier.dueAmount);
    } else {
      setEditingSupplier(null);
      setFormName('');
      setFormPhone('');
      setFormAddress('');
      setFormProduct('');
      setFormPaid(0);
      setFormDue(0);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      name: formName,
      phone: formPhone,
      address: formAddress,
      productSupplied: formProduct,
      paymentPaid: Number(formPaid),
      dueAmount: Number(formDue)
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, fields);
      setFeedbackSuccess(`Supplier information updated.`);
    } else {
      addSupplier(fields);
      setFeedbackSuccess(`New supplier logged into procurement directory.`);
    }

    closeModal();
    setTimeout(() => setFeedbackSuccess(''), 5050);
  };

  // Reconcile due amount logic
  const handlePayDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaySupplier) return;

    const currentDue = activePaySupplier.dueAmount;
    const paidDiff = Math.min(payAmount, currentDue);

    if (paidDiff > 0) {
      updateSupplier(activePaySupplier.id, {
        dueAmount: currentDue - paidDiff,
        paymentPaid: activePaySupplier.paymentPaid + paidDiff
      });
      setFeedbackSuccess(`Reconciled payment of ${formatCurrency(paidDiff)} to ${activePaySupplier.name}.`);
    }

    setActivePaySupplier(null);
    setPayAmount(100);
    setTimeout(() => setFeedbackSuccess(''), 5050);
  };

  // Filters suppliers list
  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.productSupplied.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalDues = filteredSuppliers.reduce((sum, s) => sum + s.dueAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div id="supplier-hdr" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Suppliers & Procurements</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage automation hardware supply lines, vendor pipelines, and due bills</p>
        </div>

        <button
          id="btn-add-supplier"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-teal-605 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-500/10 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier Contract</span>
        </button>
      </div>

      {feedbackSuccess && (
        <div id="supplier-success-banner" className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Grid counters summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Active Vendors</span>
            <h3 className="text-3xl font-display font-bold text-[#090d16] tracking-tight mt-1">{suppliers.length} Contracted</h3>
          </div>
          <Truck className="w-8 h-8 text-teal-650 text-teal-600 bg-teal-50 p-1.5 rounded-xl" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 font-sans tracking-tight">Accounts Payable (dues)</span>
            <h3 className="text-3xl font-display font-bold text-rose-700 tracking-tight mt-1">{formatCurrency(totalDues)}</h3>
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Vendor Search box */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center shadow-sm relative">
          <input
            id="supplier-search-input"
            type="text"
            placeholder="Search vendor pipelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-bold"
          />
        </div>
      </div>

      {/* Supplier Table / Card grid layout */}
      <div id="suppliers-layout-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {loading ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-100 rounded-2xl text-xs text-slate-400 font-bold">
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-6 h-6 border-2 border-teal-550 border-teal-550 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600">Syncing supplier registers...</p>
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-100 rounded-2xl text-xs text-slate-400 font-bold">
            No contracted vendors found
          </div>
        ) : (
          filteredSuppliers.map((sup) => (
            <div 
              key={sup.id} 
              id={`supplier-card-${sup.id}`}
              className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-5 shadow-sm"
            >
              <div className="space-y-4">
                {/* Supplier Headings */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-sm sm:text-base text-slate-800 truncate" title={sup.name}>{sup.name}</h4>
                    <span className="text-[10px] text-teal-605 text-teal-600 font-bold font-mono tracking-wide bg-teal-50 px-2 py-0.5 rounded mt-1.5 inline-block">{sup.productSupplied}</span>
                  </div>
                  <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </span>
                </div>

                {/* Subinfo links */}
                <div className="space-y-2 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate" title={sup.address}>{sup.address}</span>
                  </div>
                </div>

                <div className="border-t border-slate-50"></div>

                {/* Economic balances counts */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block font-bold">Procured (Paid)</span>
                    <span className="text-xs font-mono font-bold text-slate-800 tracking-tight mt-0.5 block">{formatCurrency(sup.paymentPaid)}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${sup.dueAmount > 0 ? 'bg-rose-50 border-rose-100 text-rose-700 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <span className="text-[9px] uppercase font-mono block font-bold">Pending Due</span>
                    <span className="text-xs font-mono font-bold mt-0.5 block">{formatCurrency(sup.dueAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions panel links */}
              <div className="pt-3.5 flex items-center justify-between gap-3 text-xs border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-edit-sup-${sup.id}`}
                    onClick={() => openModal(sup)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm"
                    title="Edit supplier parameters"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`btn-delete-sup-${sup.id}`}
                    onClick={() => deleteSupplier(sup.id)}
                    className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 hover:text-rose-700 rounded-xl transition-all shadow-sm"
                    title="Terminate contract"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {sup.dueAmount > 0 && (
                  <button
                    id={`btn-pay-due-${sup.id}`}
                    onClick={() => {
                      setActivePaySupplier(sup);
                      setPayAmount(sup.dueAmount);
                    }}
                    className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-xl transition-all text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Due</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier Modal add/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div id="supplier-editor-modal" className="bg-white border border-slate-150 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-black text-sm sm:text-base text-[#090d16]">
                {editingSupplier ? 'Modify Vendor Agreement' : 'New Vendor Contract'}
              </h3>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-705 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Vendor Company Name *</label>
                <input
                  id="form-sup-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Siemens Authorized BD Agent"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Phone Contact *</label>
                  <input
                    id="form-sup-phone"
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+8801..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Specialized Parts Supplied</label>
                  <select
                    id="form-sup-product"
                    required
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select Category...</option>
                    {Array.from(new Set(products.map((p) => p.category))).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Corporate Head Office Address</label>
                <input
                  id="form-sup-address"
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Procured Payments Paid (৳)</label>
                  <input
                    id="form-sup-paid"
                    type="number"
                    min="0"
                    value={formPaid}
                    onChange={(e) => setFormPaid(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Current Accounts Due (৳)</label>
                  <input
                    id="form-sup-due"
                    type="number"
                    min="0"
                    value={formDue}
                    onChange={(e) => setFormDue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-850 text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-supplier"
                  type="submit"
                  className="px-5 py-2.5 bg-teal-605 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Commit Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Due modal */}
      {activePaySupplier && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div id="supplier-pay-due-modal" className="bg-white border border-slate-150 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-medium text-xs sm:text-sm text-slate-800 font-bold font-sans">Discharge Due Balance</h3>
              <button onClick={() => setActivePaySupplier(null)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayDueSubmit} className="p-6 space-y-4 font-sans">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Paying settlement to: <span className="font-bold text-slate-800">{activePaySupplier.name}</span>.<br />
                Outstanding Balance Due: <span className="font-bold text-rose-600 font-mono text-sm">{formatCurrency(activePaySupplier.dueAmount)}</span>.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans block">Payment Amount To Discharge (৳)</label>
                <input
                  id="pay-due-qty-input"
                  type="number"
                  required
                  min="1"
                  max={activePaySupplier.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.min(activePaySupplier.dueAmount, Math.max(1, Number(e.target.value))))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-800 font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePaySupplier(null)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Close
                </button>
                <button
                  id="btn-confirm-due-pay"
                  type="submit"
                  className="px-4.5 py-2 bg-teal-605 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Discharge Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
