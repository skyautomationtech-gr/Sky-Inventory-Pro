export type UserRole = 'Super Admin' | 'Admin' | 'Staff';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string; // unique ID
  sku: string; // SKU e.g., "SAT-P-0001"
  name: string;
  category: string;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  image?: string;
  description?: string;
  lowStockLimit?: number;
  supplierName?: string;
  imageBase64?: string;
  thumbnailBase64?: string;
  barcode?: string; // Automatically generated barcode e.g., "SAT-000001"
}

export type InventoryActionType = 'Stock In' | 'Stock Out';

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: InventoryActionType;
  quantity: number;
  timestamp: string; // ISO string
  staffName: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  serialNumber?: string;
}

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'COD';

export interface Sale {
  id: string;
  invoiceNo: string; // SAT-GR-0001
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  brand?: string;
  platform?: string;
  courier?: string;
  trackingId?: string;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'Paid' | 'Partial' | 'Due';
  amountPaid?: number;
  transactionId?: string;
  notes?: string;
  timestamp: string;
  staffName: string;
  signatureDataUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  productSupplied: string;
  paymentPaid: number;
  dueAmount: number;
  historyLogs?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name, e.g., "BatteryCharging", "Cable", "Headphones"
  subcategories: string[];
  createdAt: string;
}

export interface CreateSaleParams {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  brand?: string;
  platform?: string;
  items: { productId: string; quantity: number; serialNumber?: string }[];
  courier?: string;
  trackingId?: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  transactionId?: string;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  notes?: string;
  signatureDataUrl?: string;
}



