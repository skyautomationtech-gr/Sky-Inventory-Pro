import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Check, 
  ShieldAlert, 
  Mail, 
  Key, 
  LogIn,
  Search,
  Filter,
  UserCheck,
  X,
  Trash2,
  Shield,
  UserX
} from 'lucide-react';

export const Users: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUserRole, 
    users, 
    addUser, 
    loading,
    approveUser,
    rejectUser,
    deleteUser,
    updateUserRole,
    disableUser
  } = useApp();

  const isAuthorized = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto shadow-sm my-12 font-sans">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4 ring-8 ring-rose-50/50">
          <UsersIcon className="w-8 h-8 opacity-75" />
        </div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Standard Staff operators do not have permissions to view or manage system users.
        </p>
        <p className="text-[10px] text-slate-400 font-mono mt-4 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          Role Required: Admin or Super Admin
        </p>
      </div>
    );
  }

  const getRoleStyle = (userRole: UserRole) => {
    switch (userRole) {
      case 'Super Admin':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Admin':
        return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'Staff':
        return 'bg-amber-50 border-amber-205 text-amber-700';
      case 'Warehouse Staff':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status || 'active') {
      case 'active':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'pending':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'blocked':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'rejected':
        return 'bg-slate-100 border-slate-200 text-slate-650 text-slate-600';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    // Use a random avatar matching the gender profile randomly or generic
    const randomId = Math.floor(Math.random() * 70);
    const mockAvatar = `https://i.pravatar.cc/100?img=${randomId}`;

    const newUser: User = {
      name,
      email,
      role,
      avatar: mockAvatar
    };

    if (addUser) {
      addUser(newUser);
    }
    setName('');
    setEmail('');
    setRole('Staff');
    setIsAdding(false);
    setSuccessMsg(`User ${name} created successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="users-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div id="users-hdr" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">System Users Directory</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Verify system clearing access levels, view operators logs, and manage registered roles</p>
        </div>
        <div>
          <button
            id="btn-add-user-modal"
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Operator</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div id="users-success-alert" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        
        {/* Main operators directory list (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters/Search box */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search operators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Warehouse Staff">Warehouse Staff</option>
              </select>
            </div>
          </div>

          {/* Users Card Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl p-12 text-slate-400 font-semibold text-xs">
                <div className="w-8 h-8 border-4 border-teal-555 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span>Syncing with Firestore directory...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 font-semibold text-xs">
                No operators match specified search constraints.
              </div>
            ) : (
              filteredUsers.map((user, idx) => {
                const isActive = currentUser && currentUser.email === user.email;
                const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
                const isSystemAdmin = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');
                const isSkyAdmin = user.email.toLowerCase() === 'skyautomationtech@gmail.com';
                const userStatus = user.status || 'active';
                const userId = user.uid || user.id || '';

                return (
                  <div 
                    key={idx}
                    className={`bg-white border hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between gap-4 ${
                      isActive 
                        ? 'border-teal-500 shadow-md shadow-teal-500/5 ring-1 ring-teal-500/5 bg-gradient-to-br from-white to-teal-50/5' 
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <img 
                        src={user.avatar || `https://i.pravatar.cc/100?img=${idx + 1}`}
                        alt={user.name} 
                        className={`w-12 h-12 rounded-full border shadow-inner object-cover shrink-0 ${isActive ? 'border-teal-500' : 'border-slate-200'}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span className="truncate max-w-[120px]" title={user.name}>{user.name}</span>
                          {isActive && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] bg-teal-600/90 text-white font-mono uppercase px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              <UserCheck className="w-2.5 h-2.5" />
                              <span>You</span>
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate" title={user.email}>
                          <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </p>
                        
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border inline-block ${getRoleStyle(user.role)}`}>
                            {user.role}
                          </span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border inline-block ${getStatusStyle(userStatus)}`}>
                            {userStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Interactive Panel */}
                    {isSystemAdmin && !isSkyAdmin && (
                      <div className="pt-3 border-t border-slate-50 flex flex-col gap-2">
                        {/* Pending Approvals screen actions */}
                        {userStatus === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              id={`btn-approve-${idx}`}
                              onClick={() => approveUser && approveUser(userId, user.email)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`btn-reject-${idx}`}
                              onClick={() => rejectUser && rejectUser(userId, user.email)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* Active user state updates */}
                        {userStatus === 'active' && (
                          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[100px]">
                              <select
                                id={`select-role-${idx}`}
                                value={user.role}
                                onChange={(e) => updateUserRole && updateUserRole(userId, user.email, e.target.value as UserRole)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-teal-500 text-slate-800"
                              >
                                <option value="Staff">Staff</option>
                                <option value="Warehouse Staff">Warehouse Staff</option>
                                <option value="Admin">Admin</option>
                                {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                              </select>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                id={`btn-disable-${idx}`}
                                title="Block Clearance"
                                onClick={() => disableUser && disableUser(userId, user.email)}
                                className="p-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-550 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-${idx}`}
                                title="Delete Operator"
                                onClick={() => deleteUser && deleteUser(userId, user.email)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-750 text-rose-600 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Blocked or Rejected users restoration */}
                        {(userStatus === 'blocked' || userStatus === 'rejected') && (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              id={`btn-reactivate-${idx}`}
                              onClick={() => approveUser && approveUser(userId, user.email)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Reactivate & Approve</span>
                            </button>
                            <button
                              id={`btn-delete-blocked-${idx}`}
                              title="Delete Operator"
                              onClick={() => deleteUser && deleteUser(userId, user.email)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-750 text-rose-600 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Form panel columns (Span 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-sm font-semibold font-display text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>Inbound Quick Addition</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Add a new registered team member or system operator</p>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-500">Operator Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shakil Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-500">Corporate Email ID</label>
              <input
                type="email"
                required
                placeholder="e.g. shakil@skyautomation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-500">Assigned Access Profile Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-teal-500 text-slate-800"
              >
                <option value="Staff">Staff (Warehouse level entries)</option>
                <option value="Warehouse Staff">Warehouse Staff (📦 Stock adjustments only)</option>
                <option value="Admin">Admin (Management desk clears)</option>
                <option value="Super Admin">Super Admin (Universal permissions)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-550 shadow-teal-500/10 cursor-pointer flex justify-center items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Validate & Create</span>
            </button>
          </form>

          <div className="bg-slate-50/55 rounded-xl border border-slate-100 p-3 text-[10px] text-slate-500 leading-normal flex items-start gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 text-teal-600 self-start shrink-0 mt-0.5" />
            <span>Only authorised users with valid roles are permitted to access different segments of the inventory system.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
