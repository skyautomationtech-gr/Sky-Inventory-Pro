import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  Check, 
  X, 
  Building, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, clearDatabase } = useApp();

  // Basic mock system configurations
  const [compName, setCompName] = useState('Sky Automation Tech');
  const [sysEmail, setSysEmail] = useState('procurement@skyautomation.com');
  const [vatRate, setVatRate] = useState(0);
  const [isSecretVisible, setIsSecretVisible] = useState(false);

  // Success indicator
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Clear DB states
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await clearDatabase();
      setClearSuccess(true);
      setShowConfirmClear(false);
      setTimeout(() => setClearSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Matrix mappings
  const permissionsData = [
    { module: 'View Analytics Dashboard', superAdmin: true, admin: true, staff: true },
    { module: 'Add / Edit SKU Part catalog', superAdmin: true, admin: true, staff: true },
    { module: 'Perform Stock-In Inbound replenishment', superAdmin: true, admin: true, staff: true },
    { module: 'Generate Sales & printable customer Invoice', superAdmin: true, admin: true, staff: true },
    { module: 'Add / Edit Contractor profiles', superAdmin: true, admin: true, staff: true },
    { module: 'Discharge / Pay supplier outstanding dues', superAdmin: true, admin: true, staff: false },
    { module: 'Delete SKU Catalog entries permanently', superAdmin: true, admin: true, staff: false },
    { module: 'Configure Global site profiles and tax thresholds', superAdmin: true, admin: false, staff: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Settings Header */}
      <div id="settings-hdr">
        <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Terminal Configuration Desk</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Configure corporate identity fields, VAT rates, and inspect system role capabilities</p>
      </div>

      {saveSuccess && (
        <div id="settings-success-alert" className="bg-emerald-55 bg-emerald-50 border border-emerald-205 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm animate-pulse">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>System parameters committed successfully.</span>
        </div>
      )}

      {clearSuccess && (
        <div id="database-clear-alert" className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm animate-pulse">
          <Check className="w-4 h-4 text-amber-600" />
          <span>Database reset complete. All transaction ledgers cleared and defaults restored.</span>
        </div>
      )}

      {/* Role permission and parameters split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left Column: Security Policy / Permissions Matrix */}
        <div id="permissions-matrix-card" className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
            <Shield className="w-5 h-5 text-rose-650 text-rose-600" />
            <div>
              <h3 className="text-sm font-semibold font-display text-slate-800">Role Permissions Matrix</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Operational security limits parsed per active user session</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold font-sans bg-slate-50/50 tracking-tight">
                  <th className="py-2.5 px-3">Submodule Task Description</th>
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
                  <th className="py-2.5 px-3 text-center">Admin</th>
                  <th className="py-2.5 px-3 text-center">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-705 text-slate-700">
                {permissionsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-5/50 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-slate-800 font-bold">{row.module}</td>
                    
                    {/* Super Admin check */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex justify-center">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    </td>

                    {/* Admin check */}
                    <td className="py-3.5 px-3">
                      <div className="flex justify-center">
                        {row.admin ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </td>

                    {/* Staff check */}
                    <td className="py-3.5 px-3">
                      <div className="flex justify-center">
                        {row.staff ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="flex items-center gap-1 text-rose-700 font-extrabold text-[9px] justify-center bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 leading-none">
                            <X className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Profile identity edits */}
        <div id="corp-identity-card" className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
              <Building className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-semibold font-display text-slate-800">Profile Fields</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Global properties injected inside customer invoices</p>
              </div>
            </div>

            {/* Warning if staff */}
            {currentUser.role === 'Staff' && (
              <div id="settings-locked-warning" className="mb-5 bg-amber-50 border border-amber-205 text-amber-700 p-3.5 rounded-xl text-xs flex items-center gap-2 leading-relaxed font-semibold shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Operational Lock: "Staff" level accounts are read-only. Shift back into "Super Admin" via user top header card avatar selectors to toggle modifiers.</span>
              </div>
            )}

            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              {/* Comp Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Registered Corporate Name</label>
                <input
                  id="settings-corp-name"
                  type="text"
                  required
                  disabled={currentUser.role === 'Staff'}
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-800 disabled:opacity-40 font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Sys Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">System SMTP Alerts Email</label>
                <input
                  id="settings-corp-email"
                  type="email"
                  required
                  disabled={currentUser.role === 'Staff'}
                  value={sysEmail}
                  onChange={(e) => setSysEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-800 disabled:opacity-40 font-mono font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Invoice Dues VAT Rate */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Standard Client Sales Tax (VAT %)</label>
                <input
                  id="settings-corp-vat"
                  type="number"
                  min="0"
                  max="100"
                  disabled={currentUser.role === 'Staff'}
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-800 disabled:opacity-40 font-mono font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Secure API credentials indicator */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold text-slate-500 font-sans flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Procurements Server Handshake Key</span>
                </label>
                <div className="relative">
                  <input
                    type={isSecretVisible ? 'text' : 'password'}
                    disabled
                    value="sk_sys_procurement_983482701"
                    className="w-full bg-slate-100 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-450 text-slate-400 font-mono pr-12 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSecretVisible(!isSecretVisible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    {isSecretVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex justify-end pt-5 border-t border-slate-50 mt-6 md:mt-4">
            <button
              id="btn-settings-save"
              onClick={handleSettingsSubmit}
              disabled={currentUser.role === 'Staff'}
              className="px-5 py-2.5 bg-teal-605 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-50 disabled:text-slate-350 disabled:border-slate-100 border border-transparent disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-teal-505 shadow-teal-500/10 cursor-pointer"
            >
              Commit System Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div id="danger-zone-card" className="bg-rose-50/30 border border-rose-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-rose-600 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold font-display text-rose-800">Database Administration (Danger Zone)</h3>
            <p className="text-[10px] text-slate-550 text-slate-500 mt-0.5 font-bold">Sensitive database-wide destructive actions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-rose-100 p-4 rounded-xl">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Delete All Data (Reset Database)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              This will permanently delete all custom products, sales transactions, inventory records, suppliers, and customer details. 
              Default user accounts and standard category folders will be automatically re-seeded to system defaults. This operation cannot be undone.
            </p>
          </div>

          <div>
            {!showConfirmClear ? (
              <button
                id="btn-trigger-db-clear"
                type="button"
                onClick={() => setShowConfirmClear(true)}
                disabled={currentUser.role === 'Staff'}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-620 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-50 disabled:text-slate-350 disabled:border-slate-100 disabled:opacity-45 leading-none transition-colors duration-200 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-rose-500/10 cursor-pointer text-center disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
              >
                Reset System Database
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-confirm-db-clear"
                  type="button"
                  onClick={handleClearDatabase}
                  disabled={isClearing}
                  className="px-3.5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-extrabold rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  {isClearing ? 'Clearing...' : 'Yes, Delete Everything'}
                </button>
                <button
                  id="btn-cancel-db-clear"
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  disabled={isClearing}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
