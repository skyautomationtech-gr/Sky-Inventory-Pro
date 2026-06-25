import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  Edit, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  lastUpdated: string;
  notes?: string;
}

export const Customers: React.FC = () => {
  const { currentUser } = useApp();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPoints, setFormPoints] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Listen to Firestore loyalty_customers real-time updates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loyalty_customers'), (snapshot) => {
      const data: CustomerRecord[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          name: item.name || 'Anonymous Client',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
          points: item.points || 0,
          lastUpdated: item.lastUpdated || new Date().toISOString(),
          notes: item.notes || ''
        });
      });
      setCustomers(data);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to loyalty_customers:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormPoints(0);
    setFormNotes('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormAddress(c.address);
    setFormPoints(c.points);
    setFormNotes(c.notes || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Sanitization & custom verification checks
    const name = formName.trim();
    const phone = formPhone.trim();
    const email = formEmail.trim();
    const address = formAddress.trim();
    const notes = formNotes.trim();

    if (!name) {
      setErrorMsg('Client name is required.');
      return;
    }

    if (!/^01\d{9}$/.test(phone)) {
      setErrorMsg('Provide a valid 11-digit Bangladeshi telephone number (e.g., 01700000000).');
      return;
    }

    // Duplicate telephone prevention
    const phoneDupQuery = query(collection(db, 'loyalty_customers'), where('phone', '==', phone));
    const dupSnapshot = await getDocs(phoneDupQuery);

    // Duplicate email prevention if email is provided
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      const emailDupQuery = query(collection(db, 'loyalty_customers'), where('email', '==', email));
      const emailDupSnapshot = await getDocs(emailDupQuery);

      if (editingCustomer) {
        if (!emailDupSnapshot.empty && emailDupSnapshot.docs[0].id !== editingCustomer.id) {
          setErrorMsg('Another client is already registered under this email address.');
          return;
        }
      } else {
        if (!emailDupSnapshot.empty) {
          setErrorMsg('A client is already registered under this email address.');
          return;
        }
      }
    }

    if (editingCustomer) {
      // Editing Mode
      if (!dupSnapshot.empty && dupSnapshot.docs[0].id !== editingCustomer.id) {
        setErrorMsg('Another client is already registered under this telephone number.');
        return;
      }

      try {
        await updateDoc(doc(db, 'loyalty_customers', editingCustomer.id), {
          name,
          phone,
          email,
          address,
          points: Number(formPoints) || 0,
          notes,
          lastUpdated: new Date().toISOString()
        });
        setSuccessMsg(`Successfully updated settings for ${name}.`);
        setTimeout(() => setIsModalOpen(false), 800);
      } catch (err: any) {
        setErrorMsg(`Failed updating details: ${err.message}`);
      }
    } else {
      // Creation Mode
      if (!dupSnapshot.empty) {
        setErrorMsg('A client is already registered under this telephone number.');
        return;
      }

      try {
        await addDoc(collection(db, 'loyalty_customers'), {
          name,
          phone,
          email,
          address,
          points: Number(formPoints) || 0,
          notes,
          lastUpdated: new Date().toISOString()
        });
        setSuccessMsg(`Successfully registered new client: ${name}.`);
        setTimeout(() => setIsModalOpen(false), 800);
      } catch (err: any) {
        setErrorMsg(`Failed storing client: ${err.message}`);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to remove the database profile for ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'loyalty_customers', id));
        alert('Client profile permanently removed from directory.');
      } catch (err: any) {
        alert(`Error deleting profile: ${err.message}`);
      }
    }
  };

  // Filter list
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">CRM Client Directory</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage corporate client accounts, update address journals, trace points logs, and prevent database duplicates.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 p-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-xl font-bold transition-all shadow-sm shadow-teal-600/10 cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Client</span>
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">{customers.length}</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Clients</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">
              {customers.reduce((sum, c) => sum + c.points, 0)}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Loyalty Points Distributed</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">
              {customers.filter(c => c.points > 100).length}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">High Margin VIP Clients</span>
          </div>
        </div>
      </div>

      {/* Directory Content Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Table Search Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search clients by name, email, address, phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Dynamic Client Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-mono tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Client Contact</th>
                <th className="py-3 px-4">Registered Contacts & Journal</th>
                <th className="py-3 px-4 text-center">Loyalty Badge</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-center">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono font-bold">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Syncing CRM database directory...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold font-mono">
                    No matching client records located in storage.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{c.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-1 font-bold">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-650">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.address ? (
                        <div className="flex items-start gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="leading-snug max-w-[280px]">{c.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No postal address recorded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full font-black font-mono text-[10px] uppercase leading-none">
                          ⭐ {c.points} pts
                        </span>
                        {c.points >= 200 && (
                          <span className="text-[9px] text-[#DFFF4F] bg-slate-900 px-1.5 py-0.5 rounded uppercase font-black tracking-wider leading-none">
                            VIP Gold
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(c.lastUpdated).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-[10px] transition-colors font-bold border border-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] transition-colors font-bold border border-rose-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT CLIENT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in scale-in duration-200 text-xs text-slate-800">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-800">
              <h3 className="text-sm font-black font-mono tracking-wider flex items-center gap-1.5 uppercase">
                <Users className="w-4 h-4 text-teal-600" />
                <span>{editingCustomer ? 'Update Client Account' : 'Register Corporate Client'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer bg-transparent border-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl flex items-start gap-2 animate-shake text-[11px] font-semibold leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-start gap-2 text-[11px] font-semibold leading-relaxed">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Client Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Sahadat Hossen"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Client Phone (Bangladeshi)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 01712442211"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="E.g., client@domain.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Delivery/Postal Address (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="E.g., Suite 24, MultiPlan Center, Dhaka"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-505 focus:ring-1 focus:ring-teal-505/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Loyalty Points (Balance)</label>
                <input
                  type="number"
                  min="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Journal/Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="E.g., Enterprise bulk buyer..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-505 focus:ring-1 focus:ring-teal-505/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-105 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-650 hover:bg-teal-700 font-bold text-white rounded-xl bg-teal-600 flex items-center justify-center cursor-pointer border-0 shadow-sm hover:shadow-teal-600/10 transition-all font-sans"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
