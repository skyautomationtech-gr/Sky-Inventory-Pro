import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, InventoryLog, Sale, Supplier, User, UserRole, PaymentMethod, SaleItem, Category, CreateSaleParams } from '../types';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, getDoc, query, where, runTransaction, orderBy, limit } from 'firebase/firestore';
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

interface AppContextProps {
  currentUser: User;
  products: Product[];
  inventoryLogs: InventoryLog[];
  sales: Sale[];
  suppliers: Supplier[];
  users: User[];
  categories: Category[];
  loading: boolean;
  setCurrentUserRole: (role: UserRole) => void;
  addProduct: (product: Omit<Product, 'id' | 'sku'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  generateMissingBarcodes: () => Promise<void>;
  adjustStock: (productId: string, type: 'Stock In' | 'Stock Out', quantity: number, notes?: string) => Promise<boolean>;
  createSale: (params: CreateSaleParams) => Promise<Sale | null>;
  editSale: (id: string, updatedParams: Partial<Sale>) => Promise<boolean>;
  deleteSale: (id: string) => Promise<boolean>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addUser: (user: User) => void;
  addCategory: (name: string, icon: string, subcategories: string[]) => Promise<void>;
  updateCategory: (id: string, name: string, icon: string, subcategories: string[]) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  clearDatabase: () => Promise<void>;
  isAuthenticated: boolean;
  authenticatedRole: UserRole | null;
  isDevMode: boolean;
  setIsDevMode: (val: boolean) => void;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerUser: (name: string, email: string, password: string, businessName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, password: string) => Promise<void>;
  sendRegisterOTP: (name: string, email: string, password: string, businessName: string) => Promise<string>;
  sendResetOTP: (email: string) => Promise<string>;
  verifyOTP: (email: string, code: string, type: 'registration' | 'reset') => Promise<any>;
  completeOTPRegistration: (email: string, code: string) => Promise<void>;
  completeOTPPasswordReset: (email: string, code: string, passwordReset: string) => Promise<void>;
  addActivityLog: (type: string, email: string, details: string) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const cached = localStorage.getItem('sky_v2_user');
    const sessionActive = localStorage.getItem('sky_v2_session_active') === 'true';
    if (sessionActive && cached) {
      try {
        const u = JSON.parse(cached);
        if (u.email === 'hasib.sky@gmail.com') {
          return false;
        }
      } catch (e) {}
    }
    return sessionActive;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const cached = localStorage.getItem('sky_v2_user');
    const sessionActive = localStorage.getItem('sky_v2_session_active') === 'true';
    if (sessionActive && cached) {
      try {
        const u = JSON.parse(cached);
        if (u.email === 'hasib.sky@gmail.com') {
          localStorage.removeItem('sky_v2_session_active');
          localStorage.removeItem('sky_v2_user');
        } else {
          return u;
        }
      } catch (e) {
        // Fallback
      }
    }
    return {
      name: 'Guest User',
      email: 'guest@skyautomation.com',
      role: 'Staff',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
    };
  });

  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(() => {
    const cachedRole = localStorage.getItem('sky_v2_auth_role');
    if (cachedRole) return cachedRole as UserRole;
    const cachedUserStr = localStorage.getItem('sky_v2_user');
    const sessionActive = localStorage.getItem('sky_v2_session_active') === 'true';
    if (sessionActive && cachedUserStr) {
      try {
        const u = JSON.parse(cachedUserStr);
        if (u.email !== 'hasib.sky@gmail.com') {
          localStorage.setItem('sky_v2_auth_role', u.role);
          return u.role as UserRole;
        }
      } catch (e) {}
    }
    return null;
  });

  const isDevMode = false;
  const setIsDevMode = (val: boolean) => {};

  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [authStateLoaded, setAuthStateLoaded] = useState(false);
  const autoScanCheckedRef = useRef(false);

  const addActivityLog = async (type: string, email: string, details: string) => {
    try {
      const logId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'activity_logs', logId), {
        id: logId,
        type,
        email,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to write activity log:", e);
    }
  };

  // Real Firebase Auth state listener checking user activation level in Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const freshUser = auth.currentUser;
        if (freshUser) {
          if (!freshUser.emailVerified) {
            setIsAuthenticated(false);
            setAuthenticatedRole(null);
            localStorage.setItem('sky_v2_session_active', 'false');
            setAuthStateLoaded(true);
            setLoading(false);
            return;
          }
          try {
            const userEmail = freshUser.email?.toLowerCase() || '';
            const userDocRef = doc(db, 'users', freshUser.uid);
            let userDocSnap = await getDoc(userDocRef);

            let matchedUser: User;
            let isActive = false;
            let userData: any = null;

            if (userDocSnap.exists()) {
              userData = userDocSnap.data();
            } else {
              // Search users collection by email fallback to support preexisting user documents
              try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', userEmail));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                  userData = querySnap.docs[0].data();
                  // Migrate user profile under their actual Firebase auth uid
                  const migratedDoc = {
                    ...userData,
                    id: freshUser.uid,
                    updatedAt: new Date().toISOString()
                  };
                  await setDoc(doc(db, 'users', freshUser.uid), migratedDoc);
                }
              } catch (err) {
                console.error("Error searching user by email fallback:", err);
              }
            }

            if (userEmail === 'skyautomationtech@gmail.com') {
              if (!userData) {
                userData = {
                  name: 'Sky Automation Tech',
                  email: userEmail,
                  role: 'superAdmin',
                  status: 'active'
                };
              } else {
                userData.role = 'superAdmin';
                userData.status = 'active';
              }
              try {
                await setDoc(doc(db, 'users', freshUser.uid), {
                  ...userData,
                  id: freshUser.uid,
                  role: 'superAdmin',
                  status: 'active',
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (err) {
                console.error("Error setting skyautomationtech role:", err);
              }
            }

            if (userData) {
              isActive = userData.status === 'active';
              
              if (isActive) {
                const roleStr = String(userData.role || '').toLowerCase().replace(/[^a-z]/g, '');
                const mappedRole: UserRole = roleStr === 'superadmin' ? 'Super Admin' : roleStr === 'admin' ? 'Admin' : 'Staff';
                matchedUser = {
                  name: userData.name || freshUser.displayName || 'Enterprise Operator',
                  email: userEmail,
                  role: mappedRole,
                  avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name || 'Operator')}`
                };
                
                setCurrentUser(matchedUser);
                setAuthenticatedRole(matchedUser.role);
                setIsAuthenticated(true);
                localStorage.setItem('sky_v2_session_active', 'true');
                localStorage.setItem('sky_v2_user', JSON.stringify(matchedUser));
                localStorage.setItem('sky_v2_auth_role', matchedUser.role);
              }
            } else {
              // Create default profile if none exists yet (e.g. from a direct signin sync)
              const namePart = freshUser.displayName || freshUser.email?.split('@')[0] || 'Representative';
              // Check if empty to set superAdmin
              const allUsersSnap = await getDocs(collection(db, 'users'));
              const isFirstUser = allUsersSnap.empty;
              const roleSlug = isFirstUser ? 'superAdmin' : 'staff';
              const roleLabel: UserRole = isFirstUser ? 'Super Admin' : 'Staff';

              const newUserDoc = {
                id: freshUser.uid,
                name: namePart,
                email: userEmail,
                role: roleSlug,
                status: 'active',
                createdAt: new Date().toISOString()
              };

              await setDoc(doc(db, 'users', freshUser.uid), newUserDoc);

              matchedUser = {
                name: namePart,
                email: userEmail,
                role: roleLabel,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(namePart)}`
              };
              
              setCurrentUser(matchedUser);
              setAuthenticatedRole(matchedUser.role);
              setIsAuthenticated(true);
              localStorage.setItem('sky_v2_session_active', 'true');
              localStorage.setItem('sky_v2_user', JSON.stringify(matchedUser));
              localStorage.setItem('sky_v2_auth_role', matchedUser.role);
              isActive = true;
            }

            if (!isActive) {
              // Sign out immediately if they are logged in but inactive
              setIsAuthenticated(false);
              setAuthenticatedRole(null);
              localStorage.setItem('sky_v2_session_active', 'false');
            }
          } catch (e) {
            console.error("Error setting up verified user session:", e);
            setIsAuthenticated(false);
            setAuthenticatedRole(null);
            localStorage.setItem('sky_v2_session_active', 'false');
          }
        }
      } else {
        // Logged out of Firebase Auth - clear local storage active state and deny access
        setIsAuthenticated(false);
        setAuthenticatedRole(null);
        localStorage.setItem('sky_v2_session_active', 'false');
        localStorage.removeItem('sky_v2_auth_role');
      }
      setAuthStateLoaded(true);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time collections
  useEffect(() => {
    if (!authStateLoaded || !isAuthenticated || !auth.currentUser) {
      if (!isAuthenticated || !auth.currentUser) {
        setProducts([]);
        setInventoryLogs([]);
        setSales([]);
        setSuppliers([]);
        setCategories([]);
      }
      return;
    }

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    // 1. Listen to products
    const qProducts = collection(db, 'products');
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: d.id,
          sku: d.sku,
          name: d.name,
          category: d.category,
          brand: d.brand,
          purchasePrice: d.purchasePrice,
          sellingPrice: d.sellingPrice,
          stock: d.stockQuantity,
          image: d.imageBase64 || d.imageUrl || '',
          imageBase64: d.imageBase64 || d.imageUrl || '',
          thumbnailBase64: d.thumbnailBase64 || '',
          description: d.description || '',
          lowStockLimit: d.lowStockLimit !== undefined ? Number(d.lowStockLimit) : 10,
          supplierName: d.supplierName || '',
          barcode: d.barcode || ''
        });
      });
      // Sort products by id/sku desc
      items.sort((a, b) => b.sku.localeCompare(a.sku));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    unsubscribers.push(unsubProducts);

    // 2. Listen to inventoryLogs
    const qLogs = collection(db, 'inventoryLogs');
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const items: InventoryLog[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: d.id,
          productId: d.productId,
          productName: d.productName,
          sku: d.sku || '',
          type: d.type === 'stockIn' ? 'Stock In' : d.type === 'stockOut' ? 'Stock Out' : (d.type as any),
          quantity: d.quantity,
          timestamp: d.createdAt,
          staffName: d.createdBy,
          notes: d.note || ''
        });
      });
      // Sort logs by timestamp desc
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setInventoryLogs(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventoryLogs');
    });
    unsubscribers.push(unsubLogs);

    // 3. Listen to sales
    const qSales = collection(db, 'sales');
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const items: Sale[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: d.id,
          invoiceNo: d.invoiceNo,
          customerName: d.customerName,
          customerPhone: d.customerPhone || '',
          customerAddress: d.customerAddress || '',
          items: d.items || [],
          brand: d.brand || '',
          platform: d.platform || '',
          courier: d.courier || '',
          trackingId: d.trackingId || '',
          subtotal: d.subtotal !== undefined ? d.subtotal : d.totalAmount,
          discount: d.discount !== undefined ? d.discount : 0,
          deliveryCharge: d.deliveryCharge !== undefined ? d.deliveryCharge : 0,
          totalAmount: d.totalAmount,
          totalProfit: d.profit || 0,
          paymentMethod: d.paymentMethod as any,
          paymentStatus: d.paymentStatus || 'Paid',
          amountPaid: d.amountPaid !== undefined ? d.amountPaid : d.totalAmount,
          transactionId: d.transactionId || '',
          notes: d.notes || '',
          timestamp: d.createdAt,
          staffName: d.createdBy
        });
      });
      items.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));
      setSales(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });
    unsubscribers.push(unsubSales);

    // 4. Listen to suppliers
    const qSuppliers = collection(db, 'suppliers');
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      const items: Supplier[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: d.id,
          name: d.name,
          phone: d.phone,
          address: d.address,
          productSupplied: d.productSupplied,
          paymentPaid: d.totalPaid,
          dueAmount: d.dueAmount,
          historyLogs: d.historyLogs || []
        });
      });
      setSuppliers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'suppliers');
    });
    unsubscribers.push(unsubSuppliers);

    // 5. Listen to users (No default auto-seeding)
    const qUsers = collection(db, 'users');
    const unsubUsers = onSnapshot(qUsers, async (snapshot) => {
      const items: User[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const mappedRole: UserRole = d.role === 'superAdmin' ? 'Super Admin' : d.role === 'admin' ? 'Admin' : 'Staff';
        items.push({
          name: d.name,
          email: d.email,
          role: mappedRole,
          avatar: d.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
        });
      });
      setUsers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    unsubscribers.push(unsubUsers);

    // 6. Listen to categories (Auto-seed if empty)
    const qCategories = collection(db, 'categories');
    const unsubCategories = onSnapshot(qCategories, async (snapshot) => {
      const defaultCategories = [
        {
          id: 'cat-1',
          name: 'Chargers',
          icon: 'Zap',
          subcategories: ['Fast Charger', 'Adapter', 'Charging Brick'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-2',
          name: 'Cables',
          icon: 'Cable',
          subcategories: ['Type-C Cable', 'Lightning Cable', 'Micro USB Cable', '3-in-1 Cable'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-3',
          name: 'Audio',
          icon: 'Headphones',
          subcategories: ['Earphones', 'Headphones', 'Neckband', 'TWS Earbuds', 'Bluetooth Speaker'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-4',
          name: 'Power',
          icon: 'BatteryCharging',
          subcategories: ['Power Bank', 'Extension Board', 'Multi Plug'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-5',
          name: 'Mobile Accessories',
          icon: 'Smartphone',
          subcategories: ['Phone Cover', 'Back Cover', 'Screen Protector', 'Camera Protector', 'Phone Stand', 'Finger Ring Holder'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-6',
          name: 'Smart Gadgets',
          icon: 'Cpu',
          subcategories: ['Smart Watch', 'Fitness Band', 'Mini Fan', 'RGB Light', 'LED Lamp'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-7',
          name: 'Computer Accessories',
          icon: 'Keyboard',
          subcategories: ['Keyboard', 'Mouse', 'Mouse Pad', 'USB Hub', 'Laptop Stand'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-8',
          name: 'Gaming',
          icon: 'Gamepad2',
          subcategories: ['Gaming Mouse', 'Gaming Keyboard', 'Gaming Headset', 'Mobile Trigger', 'Cooling Fan'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-9',
          name: 'Storage',
          icon: 'HardDrive',
          subcategories: ['Memory Card', 'Pendrive', 'SSD', 'HDD'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-10',
          name: 'Networking',
          icon: 'Wifi',
          subcategories: ['Router', 'WiFi Adapter', 'LAN Cable'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-11',
          name: 'Camera & Content Creator',
          icon: 'Camera',
          subcategories: ['Wireless Microphone', 'Tripod', 'Selfie Stick', 'Ring Light'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-12',
          name: 'Other Electronics',
          icon: 'Radio',
          subcategories: ['Calculator', 'Electric Lighter', 'Mini Printer', 'Bluetooth Receiver'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-13',
          name: 'Phone Parts',
          icon: 'Smartphone',
          subcategories: ['Display', 'Battery', 'Charging Port', 'Camera Module', 'Speaker', 'Back Panel'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-14',
          name: 'Mobile Tools',
          icon: 'Wrench',
          subcategories: ['SIM Ejector', 'Screwdriver Set', 'Mobile Opening Tools', 'Cleaning Brush', 'Adhesive Tape'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-15',
          name: 'Protection Accessories',
          icon: 'Shield',
          subcategories: ['Tempered Glass', 'Privacy Glass', 'Matte Protector', 'Hydrogel Protector', 'Lens Protector'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-16',
          name: 'Car Accessories',
          icon: 'Car',
          subcategories: ['Car Charger', 'Car Phone Holder', 'AUX Cable', 'Bluetooth Car Receiver'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-17',
          name: 'Lifestyle Gadgets',
          icon: 'Lightbulb',
          subcategories: ['Digital Clock', 'Table Lamp', 'Smart Remote', 'Mini Projector'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-18',
          name: 'Security & Camera',
          icon: 'Eye',
          subcategories: ['CCTV Camera', 'WiFi Camera', 'Memory Card for Camera', 'Camera Adapter'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-19',
          name: 'Display & TV Accessories',
          icon: 'Tv',
          subcategories: ['HDMI Cable', 'TV Box', 'Remote', 'Wall Mount'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-20',
          name: 'Repair & Service Items',
          icon: 'Hammer',
          subcategories: ['Service Charge', 'Repair Parts', 'Technician Tools', 'Warranty Replacement'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-21',
          name: 'Grooming & Personal Care',
          icon: 'Scissors',
          subcategories: [
            'Trimmer',
            'Hair Clipper',
            'Beard Trimmer',
            'Nose Trimmer',
            'Hair Dryer',
            'Hair Straightener',
            'Electric Shaver',
            'Grooming Kit',
            'Facial Cleaner',
            'Mini Massager'
          ],
          createdAt: new Date().toISOString()
        }
      ];

      if (snapshot.empty) {
        for (const c of defaultCategories) {
          try {
            await setDoc(doc(db, 'categories', c.id), c);
          } catch (e) {
            console.error("Auto seeding category failed", e);
          }
        }
      } else {
        const items: Category[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          items.push({
            id: d.id,
            name: d.name,
            icon: d.icon || 'FolderPlus',
            subcategories: d.subcategories || [],
            createdAt: d.createdAt || new Date().toISOString()
          });
        });

        // Ensure newly defined default categories (like cat-13 to cat-20) are automatically seeded to Firestore
        const existingIds = new Set(items.map(i => i.id));
        const missingDefaults = defaultCategories.filter(c => !existingIds.has(c.id));
        if (missingDefaults.length > 0) {
          for (const c of missingDefaults) {
            try {
              await setDoc(doc(db, 'categories', c.id), c);
            } catch (e) {
              console.error("Auto seeding missing category failed2", e);
            }
          }
        }

        items.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });
    unsubscribers.push(unsubCategories);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [authStateLoaded]);

  // Cleanup default mock users from Firestore and make skyautomationtech@gmail.com Super Admin
  useEffect(() => {
    const cleanupAndSetup = async () => {
      try {
        // 1. Delete default mock users with IDs 'u-1', 'u-2', 'u-3'
        const mockUserIds = ['u-1', 'u-2', 'u-3'];
        for (const uid of mockUserIds) {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            await deleteDoc(docRef);
            console.log(`Removed default mock user doc: ${uid}`);
          }
        }

        // 2. Query and delete docs with mock emails
        const mockEmails = ['hasib.sky@gmail.com', 'safayet.karim@skyautomation.com', 'anika.rahman@skyautomation.com'];
        for (const email of mockEmails) {
          const q = query(collection(db, 'users'), where('email', '==', email));
          const querySnap = await getDocs(q);
          for (const d of querySnap.docs) {
            await deleteDoc(doc(db, 'users', d.id));
            console.log(`Deleted mock email doc: ${d.id} (${email})`);
          }
        }

        // 3. Make skyautomationtech@gmail.com Super Admin in Firestore
        const skyEmail = 'skyautomationtech@gmail.com';
        const qSky = query(collection(db, 'users'), where('email', '==', skyEmail));
        const skySnap = await getDocs(qSky);
        if (!skySnap.empty) {
          for (const d of skySnap.docs) {
            const data = d.data();
            if (data.role !== 'superAdmin' || data.status !== 'active') {
              await setDoc(doc(db, 'users', d.id), {
                ...data,
                role: 'superAdmin',
                status: 'active',
                updatedAt: new Date().toISOString()
              }, { merge: true });
              console.log(`Permanently updated ${skyEmail} role to superAdmin in Firestore`);
            }
          }
        }
      } catch (err) {
        console.error("Cleanup/Setup effect failed:", err);
      }
    };
    
    if (isAuthenticated && currentUser?.email === 'skyautomationtech@gmail.com') {
      cleanupAndSetup();
    }
  }, [isAuthenticated, currentUser]);

  // Auto-scan existing products and generate missing barcodes automatically in background
  useEffect(() => {
    if (!loading && products.length > 0 && !autoScanCheckedRef.current) {
      const missing = products.filter(p => !p.barcode);
      if (missing.length > 0) {
        autoScanCheckedRef.current = true;
        generateMissingBarcodes();
      }
    }
  }, [loading, products]);

  const setCurrentUserRole = (role: UserRole) => {
    console.log(`Role action requested: ${role}`);
  };

  const addProduct = async (newProduct: Omit<Product, 'id' | 'sku'>) => {
    const id = `p-${Date.now()}`;
    try {
      const maxSkuNum = products.reduce((max, p) => {
        const num = parseInt(p.sku.replace('SAT-P-', ''), 10);
        return num > max ? num : max;
      }, 0);

      const nextSkuNum = maxSkuNum + 1;
      const sku = `SAT-P-${String(nextSkuNum).padStart(4, '0')}`;

      // Calculate next barcode number SAT-000001, SAT-000002, etc.
      const maxBarcodeNum = products.reduce((max, p) => {
        if (!p.barcode) return max;
        const match = p.barcode.match(/SAT-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextBarcodeNum = maxBarcodeNum + 1;
      const barcode = `SAT-${String(nextBarcodeNum).padStart(6, '0')}`;

      const productDoc = {
        id,
        name: newProduct.name,
        sku,
        category: newProduct.category,
        brand: newProduct.brand || 'No Brand',
        purchasePrice: Number(newProduct.purchasePrice) || 0,
        sellingPrice: Number(newProduct.sellingPrice) || 0,
        stockQuantity: Number(newProduct.stock) || 0,
        lowStockLimit: Number(newProduct.lowStockLimit) || 10,
        supplierName: newProduct.supplierName || '',
        imageUrl: newProduct.image || '',
        imageBase64: newProduct.imageBase64 || newProduct.image || '',
        thumbnailBase64: newProduct.thumbnailBase64 || '',
        barcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'products', id), productDoc);

      if (productDoc.stockQuantity > 0) {
        const logId = `l-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const logDoc = {
          id: logId,
          productId: id,
          productName: productDoc.name,
          sku: productDoc.sku || '',
          type: 'stockIn',
          quantity: productDoc.stockQuantity,
          previousStock: 0,
          newStock: productDoc.stockQuantity,
          note: 'Initial restock upon product creation',
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'inventoryLogs', logId), logDoc);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
    }
  };

  const generateMissingBarcodes = async (): Promise<void> => {
    try {
      const missing = products.filter(p => !p.barcode);
      if (missing.length === 0) {
        return;
      }

      let maxBarcodeNum = products.reduce((max, p) => {
        if (!p.barcode) return max;
        const match = p.barcode.match(/SAT-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      console.log(`Starting bulk generation for ${missing.length} products. Starting from offset ${maxBarcodeNum}`);

      for (const prod of missing) {
        maxBarcodeNum += 1;
        const barcode = `SAT-${String(maxBarcodeNum).padStart(6, '0')}`;
        await updateDoc(doc(db, 'products', prod.id), {
          barcode,
          updatedAt: new Date().toISOString()
        });
        console.log(`Auto-generated barcode ${barcode} for ${prod.name}`);
      }
    } catch (error) {
      console.error("Error generating missing barcodes:", error);
    }
  };

  const updateProduct = async (id: string, updatedParams: Partial<Product>) => {
    try {
      const existingProduct = products.find(p => p.id === id);
      if (!existingProduct) return;

      const updateData: any = {};
      if (updatedParams.name !== undefined) updateData.name = updatedParams.name;
      if (updatedParams.category !== undefined) updateData.category = updatedParams.category;
      if (updatedParams.brand !== undefined) updateData.brand = updatedParams.brand;
      if (updatedParams.purchasePrice !== undefined) updateData.purchasePrice = Number(updatedParams.purchasePrice);
      if (updatedParams.sellingPrice !== undefined) updateData.sellingPrice = Number(updatedParams.sellingPrice);
      if (updatedParams.image !== undefined) {
        updateData.imageUrl = updatedParams.image;
        updateData.imageBase64 = updatedParams.imageBase64 || updatedParams.image;
        updateData.thumbnailBase64 = updatedParams.thumbnailBase64 || '';
      }
      if (updatedParams.imageBase64 !== undefined) {
        updateData.imageBase64 = updatedParams.imageBase64;
      }
      if (updatedParams.thumbnailBase64 !== undefined) {
        updateData.thumbnailBase64 = updatedParams.thumbnailBase64;
      }
      if (updatedParams.description !== undefined) updateData.description = updatedParams.description;
      if (updatedParams.lowStockLimit !== undefined) updateData.lowStockLimit = Number(updatedParams.lowStockLimit);
      if (updatedParams.supplierName !== undefined) updateData.supplierName = updatedParams.supplierName;
      if (updatedParams.barcode !== undefined) updateData.barcode = updatedParams.barcode;
      
      if (updatedParams.stock !== undefined) {
        const newStock = Number(updatedParams.stock);
        const oldStock = existingProduct.stock;
        
        if (newStock !== oldStock) {
          updateData.stockQuantity = newStock;
          
          const diff = newStock - oldStock;
          const logType = diff > 0 ? 'stockIn' : 'stockOut';
          const qty = Math.abs(diff);

          const logId = `l-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const logDoc = {
            id: logId,
            productId: id,
            productName: updatedParams.name || existingProduct.name,
            sku: existingProduct.sku || '',
            type: logType,
            quantity: qty,
            previousStock: oldStock,
            newStock: newStock,
            note: 'Manual inventory update via product editor',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'inventoryLogs', logId), logDoc);
        }
      }

      updateData.updatedAt = new Date().toISOString();

      await updateDoc(doc(db, 'products', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = (id: string): boolean => {
    if (currentUser.role === 'Staff') {
      return false;
    }
    const executeDelete = async () => {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    };
    executeDelete();
    return true;
  };

  const adjustStock = async (productId: string, type: 'Stock In' | 'Stock Out', quantity: number, notes?: string): Promise<boolean> => {
    try {
      await runTransaction(db, async (transaction) => {
        const prodRef = doc(db, 'products', productId);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) throw new Error("Product not found");
        
        const data = prodSnap.data();
        const previousStock = data.stockQuantity || 0;
        
        if (type === 'Stock Out' && previousStock < quantity) {
          throw new Error("Insufficient stock");
        }
        
        const newStock = type === 'Stock In' ? previousStock + quantity : previousStock - quantity;
        
        transaction.update(prodRef, {
          stockQuantity: newStock,
          updatedAt: new Date().toISOString()
        });
        
        const logId = `l-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        transaction.set(doc(db, 'inventoryLogs', logId), {
          id: logId,
          productId: productId,
          productName: data.name,
          sku: data.sku,
          type: type === 'Stock In' ? 'stockIn' : 'stockOut',
          quantity,
          previousStock,
          newStock,
          note: notes || `Manual ${type}`,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        });
      });
      return true;
    } catch (error) {
      console.error("Error adjusting stock:", error);
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
      return false;
    }
  };

  const createSale = async (params: CreateSaleParams): Promise<Sale | null> => {
    try {
      console.log("createSale Started inside AppContext.tsx", params);
      const nowStr = new Date().toISOString();
      const saleId = `sale-${Date.now()}`;
      
      // 1. Query the latest sales record to determine the next invoice number
      // This completely bypasses the restricted 'counters' collection
      const qSales = query(
        collection(db, 'sales'),
        orderBy('invoiceNo', 'desc'),
        limit(1)
      );
      console.log("Fetching latest sales for invoice No generation...");
      const salesSnap = await getDocs(qSales);
      let nextSalesNum = 1;
      if (!salesSnap.empty) {
        const lastSale = salesSnap.docs[0].data();
        if (lastSale.invoiceNo) {
          const match = lastSale.invoiceNo.match(/\d+/);
          if (match) {
            nextSalesNum = parseInt(match[0], 10) + 1;
          }
        }
      }
      const computedInvoiceNo = `SAT-GR-${String(nextSalesNum).padStart(4, '0')}`;
      console.log("Computed next invoiceNo:", computedInvoiceNo);

      const saleItems: SaleItem[] = [];
      let calculatedProfit = 0;
      
      const invoiceNo = await runTransaction(db, async (transaction) => {
        let totalProfit = 0;
        saleItems.length = 0; // Clear array in case of retry

        // STEP 1: Read all products first
        const productSnapshots: { item: any; ref: any; data: any; exists: boolean }[] = [];
        for (const item of params.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          productSnapshots.push({
            item,
            ref: prodRef,
            data: prodSnap.exists() ? prodSnap.data() : null,
            exists: prodSnap.exists()
          });
        }

        // STEP 2: Validate stock and prepare update details
        const updatesAndLogs: {
          ref: any;
          newStock: number;
          logId: string;
          logData: any;
        }[] = [];

        for (const snap of productSnapshots) {
          if (!snap.exists) {
            throw new Error(`Product ${snap.item.productId} not found`);
          }
          const prodData = snap.data;
          if ((prodData.stockQuantity || 0) < snap.item.quantity) {
            throw new Error(`Insufficient stock for product ${prodData.name}`);
          }
          
          const newStock = prodData.stockQuantity - snap.item.quantity;
          const lineItemProfit = (prodData.sellingPrice - prodData.purchasePrice) * snap.item.quantity;
          totalProfit += lineItemProfit;
          
          saleItems.push({
            productId: snap.item.productId,
            productName: prodData.name,
            sku: prodData.sku,
            quantity: snap.item.quantity,
            purchasePrice: prodData.purchasePrice,
            sellingPrice: prodData.sellingPrice
          });

          const logId = `l-sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${snap.item.productId}`;
          updatesAndLogs.push({
            ref: snap.ref,
            newStock,
            logId,
            logData: {
              id: logId,
              productId: snap.item.productId,
              productName: prodData.name,
              sku: prodData.sku || '',
              type: 'stockOut',
              quantity: snap.item.quantity,
              previousStock: prodData.stockQuantity,
              newStock: newStock,
              note: `Automated Stock Out for Sale`,
              createdBy: currentUser.name,
              createdAt: nowStr
            }
          });
        }
        
        calculatedProfit = totalProfit;

        // STEP 3: Update inventory (writes)
        for (const u of updatesAndLogs) {
          transaction.update(u.ref, {
            stockQuantity: u.newStock,
            updatedAt: nowStr
          });
        }

        // STEP 4: Create sale document (write)
        transaction.set(doc(db, 'sales', saleId), {
          id: saleId,
          invoiceNo: computedInvoiceNo,
          customerName: params.customerName,
          customerPhone: params.customerPhone || '',
          customerAddress: params.customerAddress || '',
          brand: params.brand || '',
          platform: params.platform || '',
          courier: params.courier || '',
          trackingId: params.trackingId || '',
          subtotal: params.subtotal,
          discount: params.discount,
          deliveryCharge: params.deliveryCharge,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod,
          paymentStatus: params.paymentStatus,
          amountPaid: Number(params.amountPaid),
          transactionId: params.transactionId || '',
          notes: params.notes || '',
          signatureDataUrl: params.signatureDataUrl || '',
          items: saleItems,
          profit: totalProfit,
          createdBy: currentUser.name,
          createdAt: nowStr
        });
        
        // Create Invoice
        transaction.set(doc(db, 'invoices', `inv-${saleId}`), {
          id: `inv-${saleId}`,
          invoiceNo: computedInvoiceNo,
          saleId,
          customerName: params.customerName,
          customerPhone: params.customerPhone || '',
          customerAddress: params.customerAddress || '',
          items: saleItems,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod,
          createdAt: nowStr
        });

        // STEP 5: Create inventory logs (writes)
        for (const u of updatesAndLogs) {
          transaction.set(doc(db, 'inventoryLogs', u.logId), u.logData);
        }
        
        return computedInvoiceNo;
      });

      const resultSale = {
        id: saleId,
        invoiceNo,
        staffName: currentUser.name,
        timestamp: nowStr,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerAddress: params.customerAddress,
        brand: params.brand,
        platform: params.platform,
        courier: params.courier,
        trackingId: params.trackingId,
        subtotal: params.subtotal,
        discount: params.discount,
        deliveryCharge: params.deliveryCharge,
        totalAmount: params.totalAmount,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus,
        amountPaid: params.amountPaid,
        transactionId: params.transactionId,
        notes: params.notes,
        signatureDataUrl: params.signatureDataUrl,
        items: saleItems,
        totalProfit: calculatedProfit
      };

      await addActivityLog("sale_created", currentUser.email, `Created sale with Invoice No ${invoiceNo} (Amount: ৳${params.totalAmount})`);

      return resultSale;
    } catch (error) {
      console.log("createSale Failed", error);
      console.error("Error creating sale:", error);
      handleFirestoreError(error, OperationType.WRITE, `sales/create`);
      return null;
    }
  };

  const editSale = async (id: string, updatedParams: Partial<Sale>): Promise<boolean> => {
    try {
      const saleRef = doc(db, 'sales', id);
      const saleSnap = await getDoc(saleRef);
      if (!saleSnap.exists()) return false;
      const oldSale = saleSnap.data() as Sale;

      const nowStr = new Date().toISOString();
      const updatedDoc = {
        ...oldSale,
        customerName: updatedParams.customerName !== undefined ? updatedParams.customerName : oldSale.customerName,
        customerPhone: updatedParams.customerPhone !== undefined ? updatedParams.customerPhone : oldSale.customerPhone,
        customerAddress: updatedParams.customerAddress !== undefined ? updatedParams.customerAddress : oldSale.customerAddress,
        brand: updatedParams.brand !== undefined ? updatedParams.brand : oldSale.brand,
        platform: updatedParams.platform !== undefined ? updatedParams.platform : oldSale.platform,
        courier: updatedParams.courier !== undefined ? updatedParams.courier : oldSale.courier,
        trackingId: updatedParams.trackingId !== undefined ? updatedParams.trackingId : oldSale.trackingId,
        paymentMethod: updatedParams.paymentMethod !== undefined ? updatedParams.paymentMethod : oldSale.paymentMethod,
        paymentStatus: updatedParams.paymentStatus !== undefined ? updatedParams.paymentStatus : oldSale.paymentStatus,
        amountPaid: updatedParams.amountPaid !== undefined ? Number(updatedParams.amountPaid) : oldSale.amountPaid,
        notes: updatedParams.notes !== undefined ? updatedParams.notes : oldSale.notes,
        updatedAt: nowStr
      };

      const qInvoices = query(collection(db, 'invoices'), where('saleId', '==', id));
      const invoiceSnap = await getDocs(qInvoices);
      if (!invoiceSnap.empty) {
        const invoiceDocRef = doc(db, 'invoices', invoiceSnap.docs[0].id);
        await updateDoc(invoiceDocRef, {
          customerName: updatedDoc.customerName,
          customerPhone: updatedDoc.customerPhone,
          customerAddress: updatedDoc.customerAddress,
          brand: updatedDoc.brand,
          platform: updatedDoc.platform,
          courier: updatedDoc.courier,
          trackingId: updatedDoc.trackingId,
          paymentMethod: updatedDoc.paymentMethod,
          paymentStatus: updatedDoc.paymentStatus,
          amountPaid: updatedDoc.amountPaid,
          notes: updatedDoc.notes,
          updatedAt: nowStr
        });
      }

      await updateDoc(saleRef, {
        customerName: updatedDoc.customerName,
        customerPhone: updatedDoc.customerPhone,
        customerAddress: updatedDoc.customerAddress,
        brand: updatedDoc.brand,
        platform: updatedDoc.platform,
        courier: updatedDoc.courier,
        trackingId: updatedDoc.trackingId,
        paymentMethod: updatedDoc.paymentMethod,
        paymentStatus: updatedDoc.paymentStatus,
        amountPaid: updatedDoc.amountPaid,
        notes: updatedDoc.notes,
        updatedAt: nowStr
      });

      await addActivityLog("sale_edited", currentUser.email, `Edited sale ${id} (Invoice No: ${oldSale.invoiceNo})`);

      return true;
    } catch (error) {
      console.error("Error editing sale:", error);
      handleFirestoreError(error, OperationType.UPDATE, `sales/${id}`);
      return false;
    }
  };

  const deleteSale = async (id: string): Promise<boolean> => {
    try {
      let deletedInvoiceNo = '';
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, 'sales', id);
        const saleSnap = await transaction.get(saleRef);
        if (!saleSnap.exists()) throw new Error("Sale not found");
        
        const saleData = saleSnap.data() as Sale;
        deletedInvoiceNo = saleData.invoiceNo || '';
        const nowStr = new Date().toISOString();
        const items = saleData.items || [];
        
        // STEP 1: Read all products first
        const productSnapshots: { item: any; ref: any; data: any; exists: boolean }[] = [];
        for (const item of items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          productSnapshots.push({
            item,
            ref: prodRef,
            data: prodSnap.exists() ? prodSnap.data() : null,
            exists: prodSnap.exists()
          });
        }
        
        // STEP 2: Compute reverted stocks and prepare write details
        const updatesAndLogs: {
          ref: any;
          revertedStock: number;
          logId: string;
          logData: any;
        }[] = [];
        
        for (const snap of productSnapshots) {
          if (snap.exists) {
            const prodData = snap.data;
            const currentStock = prodData.stockQuantity || 0;
            const revertedStock = currentStock + Number(snap.item.quantity);
            const logId = `l-sale-revert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${snap.item.productId}`;
            
            updatesAndLogs.push({
              ref: snap.ref,
              revertedStock,
              logId,
              logData: {
                id: logId,
                productId: snap.item.productId,
                productName: snap.item.productName,
                sku: snap.item.sku || '',
                type: 'stockIn',
                quantity: snap.item.quantity,
                previousStock: currentStock,
                newStock: revertedStock,
                note: `Reverted Stock In due to deletion of invoice ${saleData.invoiceNo || ''}`,
                createdBy: currentUser.name,
                createdAt: nowStr
              }
            });
          }
        }
        
        // STEP 3: Execute all updates and sets (writes)
        for (const u of updatesAndLogs) {
          transaction.update(u.ref, {
            stockQuantity: u.revertedStock,
            updatedAt: nowStr
          });
          
          transaction.set(doc(db, 'inventoryLogs', u.logId), u.logData);
        }
        
        // STEP 4: Delete sale and invoice
        transaction.delete(saleRef);
        transaction.delete(doc(db, 'invoices', `inv-${id}`));
      });
      
      await addActivityLog("sale_deleted", currentUser.email, `Deleted sale with Invoice No ${deletedInvoiceNo}`);

      return true;
    } catch (error) {
      console.error("Error deleting sale:", error);
      handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
      return false;
    }
  };

  const addSupplier = async (newSup: Omit<Supplier, 'id'>) => {
    const id = `s-${Date.now()}`;
    try {
      const supplierDoc = {
        id,
        name: newSup.name,
        phone: newSup.phone,
        address: newSup.address,
        productSupplied: newSup.productSupplied,
        totalPaid: Number(newSup.paymentPaid) || 0,
        dueAmount: Number(newSup.dueAmount) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'suppliers', id), supplierDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `suppliers/${id}`);
    }
  };

  const updateSupplier = async (id: string, updatedParams: Partial<Supplier>) => {
    try {
      const updateData: any = {};
      if (updatedParams.name !== undefined) updateData.name = updatedParams.name;
      if (updatedParams.phone !== undefined) updateData.phone = updatedParams.phone;
      if (updatedParams.address !== undefined) updateData.address = updatedParams.address;
      if (updatedParams.productSupplied !== undefined) updateData.productSupplied = updatedParams.productSupplied;
      if (updatedParams.paymentPaid !== undefined) updateData.totalPaid = Number(updatedParams.paymentPaid);
      if (updatedParams.dueAmount !== undefined) updateData.dueAmount = Number(updatedParams.dueAmount);
      
      updateData.updatedAt = new Date().toISOString();

      await updateDoc(doc(db, 'suppliers', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `suppliers/${id}`);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  };

  const addUser = async (newUser: User) => {
    const id = `u-${Date.now()}`;
    try {
      const mappedRole = newUser.role === 'Super Admin' ? 'superAdmin' : newUser.role === 'Admin' ? 'admin' : 'staff';
      await setDoc(doc(db, 'users', id), {
        id,
        name: newUser.name,
        email: newUser.email,
        role: mappedRole,
        status: 'active',
        avatar: newUser.avatar || '',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${id}`);
    }
  };

  const addCategory = async (name: string, icon: string, subcategories: string[]) => {
    const id = `cat-${Date.now()}`;
    try {
      await setDoc(doc(db, 'categories', id), {
        id,
        name,
        icon: icon || 'FolderPlus',
        subcategories: subcategories.filter(s => s.trim() !== ''),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${id}`);
    }
  };

  const updateCategory = async (id: string, name: string, icon: string, subcategories: string[]) => {
    try {
      await setDoc(doc(db, 'categories', id), {
        id,
        name,
        icon: icon || 'FolderPlus',
        subcategories: subcategories.filter(s => s.trim() !== ''),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      return false;
    }
  };

  const clearDatabase = async () => {
    const collectionsToClear = [
      'products',
      'inventoryLogs',
      'sales',
      'suppliers',
      'users',
      'categories',
      'warranties',
      'loyalty_customers',
      'loyalty_transactions'
    ];

    for (const collName of collectionsToClear) {
      try {
        const querySnapshot = await getDocs(collection(db, collName));
        const deletePromises = querySnapshot.docs.map(docSnap => 
          deleteDoc(doc(db, collName, docSnap.id))
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Failed to clear collection ${collName}:`, error);
        handleFirestoreError(error, OperationType.DELETE, collName);
      }
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check Lockout Status
    const lockoutKey = `sky_lockout_${normalizedEmail}`;
    const attemptsKey = `sky_attempts_${normalizedEmail}`;
    const lockedUntilStr = localStorage.getItem(lockoutKey);
    
    if (lockedUntilStr) {
      const lockedUntil = Number(lockedUntilStr);
      if (Date.now() < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 1000 / 60);
        throw new Error(`ACCOUNT_LOCKED: This account is temporarily locked due to repeated sign-in failures. Please try again in ${remainingMinutes} minute(s).`);
      } else {
        localStorage.removeItem(lockoutKey);
        localStorage.removeItem(attemptsKey);
      }
    }

    try {
      // 1. Enforce Explicit Session Persistence Configuration
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // 2. Default to standard Firebase Auth Signin FIRST
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const authUser = userCredential.user;
      
      // 3. Email Verification Check Gate
      if (!authUser.emailVerified) {
        try {
          await sendEmailVerification(authUser);
        } catch (err) {
          console.error("Error sending verification email on login:", err);
        }
        await signOut(auth);
        throw new Error('EMAIL_NOT_VERIFIED: Your business email must be verified before signing in. A fresh verification link has been sent to your email.');
      }
      
      // Reset attempts on successful sign-in
      localStorage.removeItem(attemptsKey);
      localStorage.removeItem(lockoutKey);

      // Log success in Activity Logs
      await addActivityLog("login_success", normalizedEmail, "Successful sign-in");

      // Retrieve additional user data parameters from our Firestore database
      const userDocRef = doc(db, 'users', authUser.uid);
      let userDocSnap = await getDoc(userDocRef);
      let userData: any = null;

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      } else {
        // Fallback: search users collection by email
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', normalizedEmail));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            userData = querySnap.docs[0].data();
            // Migrate user profile under their actual Firebase uid
            const migratedDoc = {
              ...userData,
              id: authUser.uid,
              updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', authUser.uid), migratedDoc);
          }
        } catch (err) {
          console.error("Error searching user by email in login:", err);
        }
      }
      
      if (userData) {
        if (userData.status === 'inactive') {
          await signOut(auth);
          throw new Error('Your enterprise account is inactive. Please complete your registration via OTP verification.');
        }
        
        if (userData.status === 'blocked') {
          await signOut(auth);
          throw new Error('Your account has been blocked due to security policies. Please contact your Super Admin.');
        }
        
        const roleStr = String(userData.role || '').toLowerCase().replace(/[^a-z]/g, '');
        const mappedRole: UserRole = roleStr === 'superadmin' ? 'Super Admin' : roleStr === 'admin' ? 'Admin' : 'Staff';
        const matchedUser = {
          name: userData.name || authUser.displayName || 'Enterprise Operator',
          email: normalizedEmail,
          role: mappedRole,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name || 'Operator')}`
        };
        
        setCurrentUser(matchedUser);
        setAuthenticatedRole(matchedUser.role);
        setIsAuthenticated(true);
        
        localStorage.setItem('sky_v2_session_active', 'true');
        localStorage.setItem('sky_v2_user', JSON.stringify(matchedUser));
        localStorage.setItem('sky_v2_auth_role', matchedUser.role);
      } else {
        // Build dummy mapping if none exists yet
        const mappedRole: UserRole = 'Staff';
        const matchedUser = {
          name: authUser.email?.split('@')[0] || 'Enterprise Operator',
          email: normalizedEmail,
          role: mappedRole,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Operator`
        };
        setCurrentUser(matchedUser);
        setAuthenticatedRole(mappedRole);
        setIsAuthenticated(true);
        localStorage.setItem('sky_v2_session_active', 'true');
        localStorage.setItem('sky_v2_user', JSON.stringify(matchedUser));
        localStorage.setItem('sky_v2_auth_role', mappedRole);
      }
    } catch (error: any) {
      if (error.message && (error.message.includes("EMAIL_NOT_VERIFIED") || error.message.includes("ACCOUNT_LOCKED"))) {
        throw error;
      }
      
      // Track failed attempts
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        const currentAttempts = Number(localStorage.getItem(attemptsKey) || 0) + 1;
        localStorage.setItem(attemptsKey, currentAttempts.toString());
        
        // Log failure in Activity Logs
        await addActivityLog("login_failure", normalizedEmail, `Failed sign-in attempt (${currentAttempts}/5)`);

        if (currentAttempts >= 5) {
          const lockTime = Date.now() + 15 * 60 * 1000; // 15 mins lock
          localStorage.setItem(lockoutKey, lockTime.toString());
          await addActivityLog("account_locked", normalizedEmail, "Account locked due to 5 consecutive failures");
          throw new Error('ACCOUNT_LOCKED: Too many failed sign-in attempts. This account is locked for 15 minutes.');
        } else {
          throw new Error(`Authentication failed. Incorrect email or password. (${5 - currentAttempts} attempt(s) remaining)`);
        }
      }
      
      throw error;
    }
  };

  const registerUser = async (name: string, email: string, password: string, businessName: string) => {
    // Standard register legacy link - rerouted directly to standard OTP flow
    await sendRegisterOTP(name, email, password, businessName);
  };

  const sendRegisterOTP = async (name: string, email: string, password: string, businessName: string): Promise<string> => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // 1. Create the user in Firebase Auth immediately. Let Firebase naturally handle duplicate detection and security policies.
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await sendEmailVerification(userCredential.user);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An enterprise account with this email address already exists.');
      }
      throw err;
    }
    
    const user = userCredential.user;
    
    // 2. Generate valid 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Store in collection 'otps' - Since user is signed in, request.auth is active and can perform secure writes conforming to schema
    await setDoc(doc(db, 'otps', normalizedEmail), {
      otp: otpCode,
      email: normalizedEmail,
      attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes validity
      verified: false,
      type: 'registration',
      tempUserData: {
        uid: user.uid,
        name,
        email: normalizedEmail,
        businessName
      }
    });

    // Output secure log details to browser console for verification logs
    console.log(`[🔐 SKY SMTP Sandboxed GateWay] Registration authorization OTP dispatched to ${normalizedEmail}. Code: ${otpCode}`);
    return otpCode;
  };

  const sendResetOTP = async (email: string): Promise<string> => {
    const normalizedEmail = email.trim().toLowerCase();
    // Directly use Firebase Auth native password reset email flow
    await sendPasswordResetEmail(auth, normalizedEmail);
    return "";
  };

  const verifyOTP = async (email: string, code: string, type: 'registration' | 'reset'): Promise<any> => {
    const normalizedEmail = email.trim().toLowerCase();
    const otpDocRef = doc(db, 'otps', normalizedEmail);
    const otpDocSnap = await getDoc(otpDocRef);
    
    if (!otpDocSnap.exists()) {
      throw new Error('No authorization OTP session was found for this email address. Please click resend.');
    }
    
    const otpData = otpDocSnap.data();
    
    // 1. Check expiration
    if (new Date() > new Date(otpData.expiresAt)) {
      throw new Error('Authorization code has expired. Active validity is limited to 5 minutes. Please click resend.');
    }
    
    // 2. Check previous attempts limiting brute-force
    if (otpData.attempts >= 5) {
      throw new Error('Maximum verification attempts (5) exceeded. Brute-force protection rules activated. Please request a fresh OTP.');
    }
    
    // 3. Check previously verified status
    if (otpData.verified) {
      throw new Error('This authorization code has already been utilized. Code reuse is prevented. Please request a fresh OTP.');
    }
    
    // 4. Validate matching type
    if (otpData.type !== type) {
      throw new Error('Authorization context mismatch.');
    }
    
    // 5. Compare actual codes
    if (otpData.otp === code.trim()) {
      await updateDoc(otpDocRef, { verified: true });
      return otpData;
    } else {
      const nextAttempts = (otpData.attempts || 0) + 1;
      await updateDoc(otpDocRef, { attempts: nextAttempts });
      if (nextAttempts >= 5) {
        throw new Error('Invalid verification code. Maximum attempts (5) exceeded. Brute-force protection rules activated. Please request a fresh OTP.');
      } else {
        throw new Error(`Invalid verification code. Enter the 6-digit code correctly. (Attempts remaining: ${5 - nextAttempts})`);
      }
    }
  };

  const completeOTPRegistration = async (email: string, code: string): Promise<void> => {
    const otpData = await verifyOTP(email, code, 'registration');
    const { tempUserData } = otpData;
    
    if (!tempUserData) {
      throw new Error('Pending signup records were corrupt. Please register again.');
    }
    
    // 1. Scan users collection to determine correct role slug (since we are signed in, read is permitted)
    const allUsersSnap = await getDocs(collection(db, 'users'));
    const activeUsers = allUsersSnap.docs.filter(d => d.data().status === 'active' && d.id !== tempUserData.uid);
    const isFirstUser = activeUsers.length === 0;
    const roleSlug = isFirstUser ? 'superAdmin' : 'staff';
    const roleLabel: UserRole = isFirstUser ? 'Super Admin' : 'Staff';
    
    // 2. Store formal permanent profile in collection 'users'
    const newUserProfile = {
      id: tempUserData.uid,
      name: tempUserData.name,
      email: tempUserData.email,
      role: roleSlug,
      businessName: tempUserData.businessName,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', tempUserData.uid), newUserProfile);
    
    // 3. Delete the successfully compiled register OTP document safely
    await deleteDoc(doc(db, 'otps', email.trim().toLowerCase()));
    
    // 4. Save details and update context state
    const matchedUser = {
      name: tempUserData.name,
      email: tempUserData.email,
      role: roleLabel,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(tempUserData.name)}`
    };
    
    setCurrentUser(matchedUser);
    setAuthenticatedRole(roleLabel);
    setIsAuthenticated(true);
    localStorage.setItem('sky_v2_session_active', 'true');
    localStorage.setItem('sky_v2_user', JSON.stringify(matchedUser));
    localStorage.setItem('sky_v2_auth_role', roleLabel);
  };

  const completeOTPPasswordReset = async (email: string, code: string, passwordReset: string): Promise<void> => {
    // Deprecated in favor of direct Firebase Auth sendPasswordResetEmail
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Signout error:", e);
    }
    const guestUser = {
      name: 'Guest User',
      email: 'guest@skyautomation.com',
      role: 'Staff' as UserRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
    };
    setCurrentUser(guestUser);
    setAuthenticatedRole(null);
    setIsAuthenticated(false);
    localStorage.setItem('sky_v2_session_active', 'false');
    localStorage.setItem('sky_v2_user', JSON.stringify(guestUser));
    localStorage.removeItem('sky_v2_auth_role');
  };

  const resetPassword = async (email: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, normalizedEmail);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      products,
      inventoryLogs,
      sales,
      suppliers,
      users,
      categories,
      loading,
      setCurrentUserRole,
      addProduct,
      updateProduct,
      deleteProduct,
      generateMissingBarcodes,
      adjustStock,
      createSale,
      editSale,
      deleteSale,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addUser,
      addCategory,
      updateCategory,
      deleteCategory,
      clearDatabase,
      isAuthenticated,
      authenticatedRole,
      isDevMode,
      setIsDevMode,
      login,
      registerUser,
      logout,
      resetPassword,
      sendRegisterOTP,
      sendResetOTP,
      verifyOTP,
      completeOTPRegistration,
      completeOTPPasswordReset,
      addActivityLog
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
