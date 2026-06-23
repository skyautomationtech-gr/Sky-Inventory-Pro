import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SignaturePad } from '../components/SignaturePad';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  FileText, 
  Edit,
  AlertTriangle, 
  Printer, 
  X, 
  CreditCard, 
  CheckCircle,
  Clock,
  User,
  Phone,
  Truck,
  Tag,
  Download,
  Sparkles,
  MapPin,
  Building,
  Layers,
  ChevronRight,
  Hash,
  Globe,
  DollarSign,
  ShieldCheck,
  Cpu,
  Gift
} from 'lucide-react';
import { PaymentMethod, Sale, CreateSaleParams } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getCustomerPointsByPhone, updateCustomerPoints, addLoyaltyTransaction, LoyaltyCustomer } from '../services/loyaltyService';
import { saveWarranty, getWarrantyByInvoice, WarrantyInformation } from '../services/warrantyService';
import skyLogo from '../components/Sky.jpeg';
import GadgetZuLogo from '../assets/GadgetZu.jpeg';
import RTXGadgetLogo from '../assets/RTXGadget.jpeg';

// Brand specs definition for matching live previews
const BRAND_SPECS = {
  'Sky Automation Tech': {
    name: 'Sky Automation Tech',
    address: 'Dhaka, Bangladesh',
    contact: 'phone: 01577351518 / 01571542070 | email: skyautomationtech@gmail.com',
    accentColor: 'text-neutral-900',
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-350',
    headerBg: 'bg-white',
    headerText: 'text-neutral-900',
    badgeClass: 'bg-neutral-50 border border-neutral-350 text-neutral-800',
    tagline: 'GADGETS & MOBILE ACCESSORIES',
    website: 'skyautomationtech@gmail.com',
    email: 'skyautomationtech@gmail.com',
    phone: '01577351518 / 01571542070',
    brandCode: 'SAT',
    initials: 'SAT',
    logo: skyLogo
  },
  'GadgetZu': {
    name: 'GadgetZu',
    address: 'Level 4, Block C, Jamuna Future Park, Kuril, Dhaka, Bangladesh',
    contact: 'phone: +880-1712-442211 | email: core@gadgetzu.net',
    accentColor: 'text-amber-800',
    accentBg: 'bg-amber-50/50',
    accentBorder: 'border-amber-350',
    headerBg: 'bg-white',
    headerText: 'text-neutral-900',
    badgeClass: 'bg-amber-50 border border-amber-300 text-amber-950',
    tagline: 'PREMIUM PERSONAL LOGISTICS & GADGETRY',
    website: 'www.gadgetzu.net',
    email: 'core@gadgetzu.net',
    phone: '+880-1712-442211',
    brandCode: 'GDZ',
    initials: 'ZUG',
    logo: GadgetZuLogo
  },
  'RTX Gadget': {
    name: 'RTX Gadget',
    address: 'Shop 45, MultiPlan Center, New Elephant Road, Dhaka, Bangladesh',
    contact: 'phone: +880-1888-990022 | email: deals@rtxgadgets.com.bd',
    accentColor: 'text-rose-800',
    accentBg: 'bg-rose-50/50',
    accentBorder: 'border-rose-350',
    headerBg: 'bg-white',
    headerText: 'text-neutral-900',
    badgeClass: 'bg-rose-50 border border-rose-300 text-rose-950',
    tagline: 'HIGH-PERFORMANCE COMPUTER STATIONS & GADGETS',
    website: 'www.rtxgadgets.com.bd',
    email: 'deals@rtxgadgets.com.bd',
    phone: '+880-1888-990022',
    brandCode: 'RTX',
    initials: 'RTX',
    logo: RTXGadgetLogo
  }
};

const generateSerial = () => `SAT-SER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

export const Sales: React.FC = () => {
  const { products, sales, createSale, editSale, deleteSale, currentUser, loading } = useApp();

  // Reference for PDF generation
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  // 1. Customer Information States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('');
  const [customerThana, setCustomerThana] = useState('');
  const [customerUnion, setCustomerUnion] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [customerRoad, setCustomerRoad] = useState('');
  const [customerHouse, setCustomerHouse] = useState('');
  const [customerFlat, setCustomerFlat] = useState('');
  const [customerPostCode, setCustomerPostCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      // Basic validation for Bangladeshi phone numbers (11 digits starting with 01)
      if (/^01\d{9}$/.test(customerPhone)) { 
        const data = await getCustomerPointsByPhone(customerPhone);
        setLoyaltyPoints(data ? data.points : 0);
      } else {
        setLoyaltyPoints(null);
      }
    };
    fetchPoints();
  }, [customerPhone]);

  // 2. Order Information States
  const [selectedBrand, setSelectedBrand] = useState<'Sky Automation Tech' | 'GadgetZu' | 'RTX Gadget'>('Sky Automation Tech');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Facebook');

  // 3. Products Cart lines
  const [billItems, setBillItems] = useState<{ productId: string; quantity: number; serialNumber?: string }[]>([
    { productId: '', quantity: 1, serialNumber: generateSerial() }
  ]);

  // 4. Delivery States
  const [selectedCourier, setSelectedCourier] = useState<string>('Steadfast');
  const [trackingId, setTrackingId] = useState('');

  // 5. Pricing states
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [deliveryCharge, setDeliveryCharge] = useState<string>('');

  // 6. Payment States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatusOverride, setPaymentStatusOverride] = useState<'Auto' | 'Paid' | 'Partial' | 'Due'>('Auto');

  // 7. Custom Notes
  const [orderNotes, setOrderNotes] = useState('');
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  
  // Delivery config
  const [deliveryArea, setDeliveryArea] = useState<'InsideDhaka' | 'OutsideDhaka' | 'Others'>('InsideDhaka');

  useEffect(() => {
    if (deliveryArea === 'InsideDhaka') setSelectedCourier('CarryBee Express');
    else if (deliveryArea === 'OutsideDhaka') setSelectedCourier('Steadfast logistics');
    else setSelectedCourier('SAT Express');
  }, [deliveryArea]);

  // Warranty configuration
  const [warrantyPeriod, setWarrantyPeriod] = useState<number>(6);
  const [warrantyTerms, setWarrantyTerms] = useState<string>('Standard warranty terms apply.');

  // 8. Printable / Display active Invoice overlay state
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [activeInvoiceLoyaltyData, setActiveInvoiceLoyaltyData] = useState<LoyaltyCustomer | null>(null);
  const [activeInvoiceWarrantyData, setActiveInvoiceWarrantyData] = useState<WarrantyInformation | null>(null);
  
  useEffect(() => {
    if (activeInvoice && activeInvoice.customerPhone) {
      const fetchData = async () => {
        const points = await getCustomerPointsByPhone(activeInvoice.customerPhone!);
        setActiveInvoiceLoyaltyData(points);
        const warranty = await getWarrantyByInvoice(activeInvoice.invoiceNo);
        setActiveInvoiceWarrantyData(warranty);
      };
      fetchData();
    } else {
      setActiveInvoiceLoyaltyData(null);
      setActiveInvoiceWarrantyData(null);
    }
  }, [activeInvoice]);

  // Status Alerts states
  const [saleError, setSaleError] = useState('');
  const [saleSuccess, setSaleSuccess] = useState('');
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; description: string } | null>(null);

  const showToast = (t: { type: 'success' | 'error'; title: string; description: string }) => {
    setToast(t);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Search filter for bottom history grid
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Edit order modal states
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editFormGroup, setEditFormGroup] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    brand: 'Sky Automation Tech',
    platform: 'Facebook',
    courier: 'Steadfast',
    trackingId: '',
    paymentMethod: 'Cash' as PaymentMethod,
    paymentStatus: 'Paid',
    amountPaid: 0,
    notes: ''
  });

  // Calculate live Cart subtotal
  const computedSubtotal = billItems.reduce((sum, item) => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return sum;
    return sum + (prod.sellingPrice * item.quantity);
  }, 0);

  // Parse numerical inputs safely helper
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const parsedDelivery = parseFloat(deliveryCharge) || 0;
  const grandTotal = Math.max(0, computedSubtotal - parsedDiscount + parsedDelivery);

  // Safely default Amount Paid when empty
  const parsedAmountPaid = amountPaid === '' ? grandTotal : (parseFloat(amountPaid) || 0);

  // Auto payment status computation
  let computedPaymentStatus: 'Paid' | 'Partial' | 'Due' = 'Paid';
  if (parsedAmountPaid === 0) {
    computedPaymentStatus = 'Due';
  } else if (parsedAmountPaid < grandTotal) {
    computedPaymentStatus = 'Partial';
  } else {
    computedPaymentStatus = 'Paid';
  }

  const finalPaymentStatus = paymentStatusOverride === 'Auto' ? computedPaymentStatus : paymentStatusOverride;

  // Auto calculate matching next invoice string
  const getNextInvoiceNo = () => {
    const maxSalesNum = sales.reduce((max, s) => {
      const cleanInv = s.invoiceNo.replace('SAT-GR-', '');
      const num = parseInt(cleanInv, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextSalesNum = maxSalesNum + 1;
    return `SAT-GR-${String(nextSalesNum).padStart(4, '0')}`;
  };

  const dynamicInvoiceNo = getNextInvoiceNo();

  // Synchronize Amount Paid field if grandTotal shifts and user hasn't explicitly edited it yet
  const [hasUserEditedPaid, setHasUserEditedPaid] = useState(false);
  useEffect(() => {
    if (!hasUserEditedPaid) {
      setAmountPaid('');
    }
  }, [grandTotal, hasUserEditedPaid]);

  // Append product cart line row
  const handleAddCartRow = () => {
    setBillItems(prev => [...prev, { productId: '', quantity: 1, serialNumber: generateSerial() }]);
    setSaleError('');
  };

  // Remove cart line row
  const handleRemoveCartRow = (idx: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== idx));
    setSaleError('');
  };

  // Handle cart line row edits
  const handleCartRowChange = (idx: number, field: 'productId' | 'quantity' | 'serialNumber', value: any) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i === idx) {
        if (field === 'quantity') {
          return { ...item, [field]: Math.max(1, parseInt(value, 10) || 1) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
    setSaleError('');
  };

  // Helper currency formatting
  const formatBDTCurrency = (val: number) => {
    if (!val || val <= 0) return "";
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  // POS Submit action (Save in Firestore, perform stock updates, inventory logs, reset fields)
  const handleInvoiceCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError('');
    setSaleSuccess('');

    // Form inputs checks
    if (!customerName.trim()) {
      setSaleError('Input Failure: Please specify Customer Name.');
      return;
    }
    if (billItems.length === 0 || billItems.some(it => !it.productId)) {
      setSaleError('Cart Failure: Please choose unique products in all lines.');
      return;
    }

    // Instantly check stock quantities before calling checkout
    for (const item of billItems) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        setSaleError('Product Failure: Chosen physical item does not exist.');
        return;
      }
      if (prod.stock < item.quantity) {
        setSaleError(`Inventory limit hit: Insufficient stock for "${prod.name}". Available physical: ${prod.stock} items.`);
        return;
      }
    }

    setIsCreatingSale(true);

    try {
      const payload: CreateSaleParams = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: [customerHouse, customerFlat, customerRoad, customerArea, customerUnion, customerThana, customerDistrict, customerPostCode]
          .map(p => p?.trim())
          .filter(Boolean)
          .join(', '),
        brand: selectedBrand,
        platform: selectedPlatform,
        items: billItems,
        courier: selectedCourier,
        trackingId: trackingId.trim(),
        subtotal: computedSubtotal,
        discount: parsedDiscount,
        deliveryCharge: parsedDelivery,
        totalAmount: grandTotal,
        paymentMethod: selectedPaymentMethod,
        amountPaid: parsedAmountPaid,
        transactionId: transactionId.trim(),
        paymentStatus: finalPaymentStatus,
        notes: orderNotes.trim(),
        signatureDataUrl: signatureImg || ''
      };

      const result = await createSale(payload);
      if (result) {
        setSaleSuccess(`Checkout successful! Invoice ${result.invoiceNo} issued and database synchronized.`);
        
        // Add loyalty points if a valid customer phone is provided
        if (/^01\d{9}$/.test(customerPhone.trim())) {
           const pointsToAdd = Math.floor(grandTotal / 100);
           await updateCustomerPoints(customerPhone.trim(), pointsToAdd);
           await addLoyaltyTransaction({
             phone: customerPhone.trim(),
             pointsAdded: pointsToAdd,
             invoiceNo: result.invoiceNo,
             date: result.timestamp
           });
           
           // Warranty info
           const expiryDate = new Date(result.timestamp);
           expiryDate.setMonth(expiryDate.getMonth() + 6);
           
           await saveWarranty({
               invoiceNo: result.invoiceNo,
               phone: customerPhone.trim(),
               status: 'Active',
               periodMonths: warrantyPeriod,
               purchaseDate: result.timestamp,
               expiryDate: expiryDate.toISOString(),
               terms: warrantyTerms
           });
        }
        
        // Open the Printable Modal pop-up
        setActiveInvoice(result);

        // Reset state values
        setCustomerName('');
        setCustomerPhone('');
        setCustomerDistrict('');
        setCustomerThana('');
        setCustomerUnion('');
        setCustomerArea('');
        setCustomerRoad('');
        setCustomerHouse('');
        setCustomerFlat('');
        setCustomerPostCode('');
        setBillItems([{ productId: '', quantity: 1 }]);
        setTrackingId('');
        setDiscountAmount('');
        setDeliveryCharge('');
        setSelectedPaymentMethod('Cash');
        setAmountPaid('');
        setTransactionId('');
        setPaymentStatusOverride('Auto');
        setOrderNotes('');
        setSignatureImg(null);
        setHasUserEditedPaid(false);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSaleError('Checkout Error: Firebase transaction declined. Please check inputs.');
      }
    } catch (err: any) {
      console.error(err);
      setSaleError(`Checkout Error: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setIsCreatingSale(false);
    }
  };

  // Trigger client-side native print
  const triggerNativePrint = () => {
    window.print();
  };

  // Helper to convert oklch / oklab colors to rgb/rgba standard format to avoid html2canvas parser crash
  const convertOklchToRgb = (colorStr: string): string => {
    if (typeof colorStr !== 'string') return colorStr;
    return colorStr.replace(/(oklch|oklab|lab|lch)\(([^)]+)\)/g, (match, type, content) => {
      try {
        const parts = content.trim().split(/[\s,/\u00A0]+/);
        const nums = parts.filter((partsVal: string) => partsVal !== '').map((partsVal: string) => {
          if (partsVal.endsWith('%')) {
            return parseFloat(partsVal) / 100;
          }
          return parseFloat(partsVal);
        });

        if (nums.length < 3) return 'rgba(0,0,0,1)';

        const L = nums[0];
        let a = 0;
        let b = 0;
        const alpha = nums.length >= 4 ? nums[3] : 1;

        if (type === 'oklch' || type === 'lch') {
          const C = nums[1];
          const H = nums[2];
          const hRad = (H * Math.PI) / 180;
          a = C * Math.cos(hRad);
          b = C * Math.sin(hRad);
        } else {
          a = nums[1];
          b = nums[2];
        }

        // Convert OKLAB to linear RGB
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413190470 * s;
        const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const f = (c: number) => {
          return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        };

        const R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
        const G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
        const B = Math.round(Math.max(0, Math.min(1, f(b_lin))) * 255);

        if (alpha === 1) {
          return `rgb(${R}, ${G}, ${B})`;
        } else {
          return `rgba(${R}, ${G}, ${B}, ${alpha})`;
        }
      } catch (e) {
        return 'rgba(0,0,0,1)';
      }
    });
  };

  // Render high fidelity PDF download for direct preview side
  const downloadPDFFile = async (saleObj: Sale | null, isDraftPre: boolean) => {
    // If not drafting, download the printable overlay target, else draft element
    const selector = isDraftPre ? '#live-invoice-pdf-container' : '#printable-invoice-body';
    const element = document.querySelector(selector) as HTMLDivElement;
    if (!element) {
      showToast({
        type: 'error',
        title: 'Invoice Error',
        description: 'Invoice preview not available.'
      });
      return;
    }

    setIsDownloadingPdf(true);

    const originalGetComputedStyle = window.getComputedStyle;

    try {
      // 1. Temporarily override document.styleSheets to be empty [] so html2canvas doesn't try to parse CSS files directly and crash
      Object.defineProperty(document, 'styleSheets', {
        get() {
          return [];
        },
        configurable: true
      });

      // 2. Temporarily monkey-patch getComputedStyle to rewrite oklch/oklab to standard rgb/rgba
      window.getComputedStyle = function (el: any, pseudoElt?: any) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const value = target.getPropertyValue(propertyName);
                if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab') || value.includes('lab') || value.includes('lch'))) {
                  return convertOklchToRgb(value);
                }
                return value;
              };
            }
            // Use target as receiver to avoid illegal invocation on CSSStyleDeclaration prototype getters
            const val = Reflect.get(target, prop, target);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab') || val.includes('lch'))) {
              return convertOklchToRgb(val);
            }
            return val;
          }
        });
      };

      // Calculate naming parameters
      const currentInvoiceName = saleObj ? saleObj.invoiceNo : dynamicInvoiceNo;
      const currentCustomerName = saleObj ? saleObj.customerName : (customerName.trim() || 'Valued_Customer');
      const sanitizedCustName = currentCustomerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${currentInvoiceName}_${sanitizedCustName}.pdf`;

      // Draw canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for sharp print quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = 210; // A4 Standard
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Wrap if overflow
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      // Restore original getters/methods
      window.getComputedStyle = originalGetComputedStyle;
      try {
        delete (document as any).styleSheets;
      } catch (e) {
        console.error('Failed to restore document.styleSheets:', e);
      }
      setIsDownloadingPdf(false);
    }
  };

  const activeBrandSpec = BRAND_SPECS[selectedBrand];

  // Filtering chronological sales history catalog
  const filteredSalesHistory = sales.filter(s => {
    const q = historySearchQuery.toLowerCase();
    return (
      s.invoiceNo.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.customerPhone && s.customerPhone.includes(q)) ||
      (s.courier && s.courier.toLowerCase().includes(q)) ||
      s.paymentMethod.toLowerCase().includes(q) ||
      (s.paymentStatus && s.paymentStatus.toLowerCase().includes(q))
    );
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    const success = await editSale(editingSale.id, editFormGroup);
    if (success) {
      alert(`Invoice ${editingSale.invoiceNo} has been successfully updated.`);
      setIsEditingModalOpen(false);
      setEditingSale(null);
    } else {
      alert(`Failed to save invoice changes.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Sales Navigation Header */}
      <div id="sales-section-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Invoice-Based Sales System</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Formulate multi-product orders, route package dispatch logistics, verify banking transaction registers, and produce high-clarity A4 PDF client receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold bg-teal-50 border border-teal-200 text-teal-700 rounded-full px-3 py-1">
            Operator Clearance: {currentUser.name}
          </span>
        </div>
      </div>

      {/* POS Alert Channels */}
      {saleError && (
        <div id="sales-billing-alert-err" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-2xl flex items-start gap-2.5 shadow-sm font-semibold animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold">Transaction Terminated</p>
            <p className="text-[11px] text-rose-600/90 mt-0.5">{saleError}</p>
          </div>
        </div>
      )}

      {saleSuccess && (
        <div id="sales-billing-alert-succ" className="bg-emerald-50 border border-emerald-25 border-emerald-200 text-emerald-700 text-xs p-4 rounded-2xl flex items-start gap-2.5 shadow-sm font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold">Execution Succeeded</p>
            <p className="text-[11px] text-emerald-600/95 mt-0.5">{saleSuccess}</p>
          </div>
        </div>
      )}

      {/* Main Multi-Part Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start font-sans">
        
        {/* LEFT COLUMN: Full Invoice Creator Terminal Console */}
        <form onSubmit={handleInvoiceCheckout} className="xl:col-span-7 space-y-6">
          
          {/* Customer Profile block */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-750">1. Client / Customer Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name *</label>
                <input
                  required
                  type="text"
                  placeholder="Enter full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 hover:bg-slate-50/20 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone / Contact</label>
                <input
                  type="tel"
                  placeholder="e.g. +88017xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 hover:bg-slate-50/20 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-mono font-medium"
                />
                {loyaltyPoints !== null && (
                  <div className="text-[10px] font-bold text-teal-600 mt-1 flex items-center gap-1.5 p-2 bg-teal-50 rounded-lg">
                    <Sparkles className="w-3 h-3" />
                    <span>Current Loyalty Points: {loyaltyPoints}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing & Dispatch Address block */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-750">Billing & Dispatch Address</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🌍 জেলা (District)</label>
                <input type="text" placeholder="Enter District" value={customerDistrict} onChange={(e) => setCustomerDistrict(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🌆 থানা/উপজেলা (Thana/Upazila)</label>
                <input type="text" placeholder="Enter Thana" value={customerThana} onChange={(e) => setCustomerThana(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏢 ইউনিয়ন (Union/Village)</label>
                <input type="text" placeholder="Enter Union" value={customerUnion} onChange={(e) => setCustomerUnion(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏘️ এলাকা/মহল্লা/গ্রাম (Area/Mahalla)</label>
                <input type="text" placeholder="Enter Area" value={customerArea} onChange={(e) => setCustomerArea(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🛣️ রোড/গলি নম্বর (Road/Lane)</label>
                <input type="text" placeholder="Enter Road Number" value={customerRoad} onChange={(e) => setCustomerRoad(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏠 বাড়ি/হোল্ডিং নম্বর (House/Holding)</label>
                <input type="text" placeholder="Enter House Number" value={customerHouse} onChange={(e) => setCustomerHouse(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏢 ফ্ল্যাট নম্বর (Flat)</label>
                <input type="text" placeholder="Enter Flat Number" value={customerFlat} onChange={(e) => setCustomerFlat(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📮 পোস্ট কোড (Post Code)</label>
                <input type="text" placeholder="Enter Post Code" value={customerPostCode} onChange={(e) => setCustomerPostCode(e.target.value)} className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Logistics & Brand details block */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-750">2. Corporate Catalog & Platform Routing</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Brand Profile</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-750 font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="Sky Automation Tech">Sky Automation Tech</option>
                  <option value="GadgetZu">GadgetZu</option>
                  <option value="RTX Gadget">RTX Gadget</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales Channel Channel</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-750 font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="Facebook">Facebook Profile/Ads</option>
                  <option value="TikTok">TikTok Shop</option>
                  <option value="Instagram">Instagram Direct</option>
                  <option value="Daraz">Daraz Vendor Centre</option>
                  <option value="CartUp">CartUp Platform</option>
                  <option value="Packly">Packly Outlet</option>
                  <option value="Direct">Direct Retail Walk-in</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Computed Invoice ID</label>
                <div className="bg-slate-100 border border-slate-200 select-none rounded-xl p-3 text-xs font-mono font-black text-slate-600">
                  {dynamicInvoiceNo}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Courier Logistics */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-755">3. Delivery & Courier Logistics</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Location Area</label>
                <select
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="InsideDhaka">Inside Dhaka</option>
                  <option value="OutsideDhaka">Outside Dhaka</option>
                  <option value="Others">Others Area</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courier / Logistics Partner</label>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-750 font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="Steadfast logistics">Steadfast logistics</option>
                  <option value="CarryBee Express">CarryBee Express</option>
                  <option value="SAT Express">SAT Express</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking Identifier ID</label>
                <input
                  type="text"
                  placeholder="e.g. STEAD-BD-7096"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 hover:bg-slate-50/20 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Product Lines catalog */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-750">4. Product Invoicing cart</h3>
              </div>

              <button
                type="button"
                onClick={handleAddCartRow}
                className="flex items-center gap-1 text-[11px] bg-teal-50 hover:bg-teal-100/80 border border-teal-150 text-teal-700 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {billItems.map((item, idx) => {
                const activeProd = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className="flex flex-row flex-wrap gap-4 items-center p-4 bg-slate-50/65 border border-slate-100 rounded-2xl relative transition-all">
                    
                    {/* Choose Product dropdown */}
                    <div className="w-full space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Product Catalog Component</label>
                        {/* Stock Alert Warning Badge */}
                        {activeProd && (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold leading-none select-none ${
                            activeProd.stock < item.quantity 
                              ? 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse' 
                              : activeProd.stock < 10 
                              ? 'bg-amber-50 border border-amber-250 text-amber-700' 
                              : 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                          }`}>
                            Stk: {activeProd.stock} units
                          </span>
                        )}
                      </div>
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleCartRowChange(idx, 'productId', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-500 shadow-xs truncate"
                      >
                        <option value="">-- Choose automation or gadget --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.brand} - {p.name} (Qty Available: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-row w-full gap-4">
                      {/* Price read-only auto loads */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price</label>
                        <div className="bg-slate-100 border border-slate-200 text-slate-705 p-2.5 rounded-xl text-xs font-mono font-bold text-right">
                          {activeProd ? formatBDTCurrency(activeProd.sellingPrice) : '৳0.00'}
                        </div>
                      </div>

                      {/* Quantity input spinner */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity *</label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleCartRowChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-center focus:outline-none focus:border-teal-500 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-row w-full gap-4">
                      {/* Subtotal Net calculation */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Subtotal</label>
                        <div className="bg-emerald-50/50 border border-emerald-100 text-teal-700 p-2.5 rounded-xl text-xs font-mono font-black text-right">
                          {activeProd ? formatBDTCurrency(activeProd.sellingPrice * item.quantity) : '৳0.00'}
                        </div>
                      </div>

                      {/* Serial Number Input */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial Number</label>
                        <input
                          type="text"
                          readOnly
                          value={item.serialNumber || ''}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-center focus:outline-none text-slate-500 shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      disabled={billItems.length <= 1}
                      onClick={() => handleRemoveCartRow(idx)}
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
                        billItems.length <= 1 
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100 hover:text-rose-700'
                      }`}
                      title="Discard product row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Pricing Parameters adjustments */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-755">5. Pricing & Bill Adjustments</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cart Subtotal (auto-calculated)</label>
                <div className="bg-slate-100 text-slate-600 font-mono font-bold p-3 rounded-xl text-center text-xs">
                  {formatBDTCurrency(computedSubtotal)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deduct Discount (Receipt / Promo)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">৳</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-105 rounded-xl pl-8 p-3 text-xs font-bold text-red-600 focus:outline-none focus:border-red-500 font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics Delivery Surcharge</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">৳</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-105 rounded-xl pl-8 p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment block */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-755">6. Checkout Payment Verification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment channel</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-105 rounded-xl p-3 text-xs text-slate-750 font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="Cash">Cash (Physical Bill)</option>
                  <option value="bKash">bKash (BD Mobile)</option>
                  <option value="Nagad">Nagad (BD Mobile)</option>
                  <option value="Rocket">Rocket (DBBL Mobile)</option>
                  <option value="Bank">Bank Wire Transfer</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-teal-600 font-bold">Amount Paid (BDT)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">৳</div>
                  <input
                    type="number"
                    min="0"
                    placeholder={`e.g. ${grandTotal.toFixed(2)}`}
                    value={amountPaid}
                    onChange={(e) => {
                      setAmountPaid(e.target.value);
                      setHasUserEditedPaid(true);
                    }}
                    className="w-full bg-teal-50/50 border border-teal-150 rounded-xl pl-7 p-3 text-xs font-black text-teal-700 focus:outline-none focus:border-teal-500 font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status Badge</label>
                <select
                  value={paymentStatusOverride}
                  onChange={(e) => setPaymentStatusOverride(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-105 rounded-xl p-3 text-xs text-slate-755 font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="Auto">Auto ({finalPaymentStatus})</option>
                  <option value="Paid">Force Paid</option>
                  <option value="Partial">Force Partial</option>
                  <option value="Due">Force Due</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Ref ID</label>
                <input
                  type="text"
                  placeholder="bKash ID / Wire Ref"
                  value={transactionId}
                  disabled={selectedPaymentMethod === 'Cash' || selectedPaymentMethod === 'COD'}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className={`w-full border rounded-xl p-3 text-xs font-mono font-bold placeholder-slate-400 focus:outline-none transition-all ${
                    selectedPaymentMethod === 'Cash' || selectedPaymentMethod === 'COD'
                      ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                      : 'bg-slate-50 border-slate-105 focus:border-teal-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Warranty Configuration */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-755">7. Warranty Policy Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warranty Period (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={warrantyPeriod}
                  onChange={(e) => setWarrantyPeriod(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-500 font-mono text-center"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warranty Terms</label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom Notes */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <div className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-755">8. Custom Invoice Memo Notes</h3>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice / Dispatch Memo</label>
              <textarea
                placeholder="Specific delivery notes, installment deadlines, or specific physical configuration instructions..."
                value={orderNotes}
                rows={3}
                spellCheck={true}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 hover:bg-slate-50/20 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium resize-none"
              />
            </div>
          </div>

          {/* Submission and Action Drawer */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Consolidated grand Total</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-display font-black text-teal-400">{formatBDTCurrency(grandTotal)}</span>
                <span className="text-[11px] text-slate-400">({finalPaymentStatus} Status)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="submit"
                disabled={isCreatingSale}
                className="w-full md:w-auto px-6 py-3.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isCreatingSale ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingCart className="w-4 h-4 text-slate-950" />
                )}
                <span>Save Order & Deduct Inventory</span>
              </button>
            </div>
          </div>

        </form>

        {/* RIGHT COLUMN: Live Interactive Draft Invoice Preview */}
        <div className="xl:col-span-5 space-y-4 lg:sticky lg:top-6">
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-black text-slate-750 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>A4 LIVE UPDATE PREVIEW</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => downloadPDFFile(null, true)}
                className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                title="Download draft preview PDF"
              >
                <Download className="w-3 h-3" />
                <span>Download draft pdf</span>
              </button>
            </div>
          </div>
              {/* Actual live document block styled to match A4 aspects perfectly */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto select-none">
            <div 
              id="live-invoice-pdf-container" 
              className="bg-white text-black shadow-xl pt-6 pb-11 px-10 mx-auto flex flex-col justify-between border-4 border-black rounded-none relative overflow-hidden"
              style={{ width: '794px', height: '1123px', minHeight: '1123px', maxHeight: '1123px', backgroundColor: '#ffffff', color: '#000000', fontFamily: "'Inter', 'Poppins', sans-serif" }}
            >
              
              <div className="flex flex-col justify-between h-full space-y-2">
                
                {/* TOP HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    {('logo' in activeBrandSpec && activeBrandSpec.logo) ? (
                      <img 
                        src={activeBrandSpec.logo as string} 
                        alt={activeBrandSpec.name} 
                        className="w-18 h-18 object-contain mb-1.5" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-black text-white rounded-none flex items-center justify-center text-lg font-bold mb-1.5 uppercase tracking-wider">
                        {activeBrandSpec.initials || 'SAT'}
                      </div>
                    )}
                    <h1 className="text-[26px] font-bold text-black leading-tight">
                      {activeBrandSpec.name}
                    </h1>
                    <p className="text-[12px] tracking-wider text-black font-bold uppercase mt-0.5">
                      {activeBrandSpec.tagline}
                    </p>
                    <div className="text-[12px] text-black font-bold mt-2.5 space-y-0.5">
                      <p>📍 {activeBrandSpec.address}</p>
                      <p>📞 {activeBrandSpec.phone}</p>
                      <p>✉️ {activeBrandSpec.email}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <h2 className="text-[22px] font-extrabold tracking-widest text-black uppercase mb-1 leading-none select-none">
                      INVOICE
                    </h2>
                    <div className="text-[12px] text-black space-y-1 mt-2.5 text-right font-bold">
                      <p><span>Invoice No:</span> <span className="font-extrabold text-[14px] underline decoration-2 font-mono">{dynamicInvoiceNo}</span></p>
                      <p><span>Date:</span> <span className="font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                      <div className="inline-block bg-black text-white px-2.5 py-0.5 font-extrabold text-[12px] uppercase tracking-wider rounded-none mt-1 shadow-sm">
                        STATUS: {finalPaymentStatus}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b-2 border-black" />

                {/* 2. CUSTOMER & LOGISTICS INFO BLOCK */}
                <div className="grid grid-cols-2 gap-6 text-[12.5px] pt-1">
                  
                  {/* Bill To */}
                  <div>
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-black mb-1 border-b-2 border-black pb-0.5">BILL TO</h3>
                    <p className="font-bold text-black text-[13.5px] uppercase tracking-wide leading-relaxed">
                      {customerName.trim() || 'Valued Customer'}
                    </p>
                    <p className="font-extrabold text-black mt-0.5 font-mono text-[12px]">Phone: {customerPhone.trim() || '—'}</p>
                    <p className="text-black font-bold leading-normal mt-0.5 w-5/6 text-[12px]">
                      {[customerHouse, customerFlat, customerRoad, customerArea, customerUnion, customerThana, customerDistrict, customerPostCode]
                        .map(p => p?.trim())
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>

                  {/* Delivery & Platform */}
                  <div className="text-right flex flex-col items-end w-full">
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-black mb-1 border-b-2 border-black pb-0.5 w-full">DELIVERY DETAILS</h3>
                    <div className="text-[12px] text-black space-y-1 font-bold">
                      <p><span>Platform:</span> <span className="font-extrabold text-black">{selectedPlatform || 'General Order'}</span></p>
                      <p><span>Courier:</span> <span className="font-extrabold text-black">{selectedCourier || '—'}</span></p>
                      <p><span>Tracking:</span> <span className="font-extrabold text-black font-mono uppercase text-[13px]">{trackingId.trim() || '—'}</span></p>
                      <p><span>Method:</span> <span className="font-extrabold text-black uppercase">{selectedPaymentMethod}</span></p>
                      {transactionId.trim() && (
                        <p><span>TxID:</span> <span className="font-extrabold text-black font-mono uppercase text-[12px]">{transactionId.trim()}</span></p>
                      )}
                    </div>
                  </div>

                </div>

                {/* 3. ORDER ITEMS TABLE */}
                <div className="flex-1 min-h-[80px] pt-0">
                  <table className="w-full text-left text-[12.5px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider w-10 text-center">#</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider pl-2">Description</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-center w-14">Qty</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-center w-28">Serial #</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-right w-28">Unit Price</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item, idx) => {
                        const targetProd = products.find(p => p.id === item.productId);
                        const unitPrice = targetProd ? targetProd.sellingPrice : 0;
                        const rowTotal = unitPrice * item.quantity;
                        return (
                          <tr key={idx} className="border-b border-black last:border-b-0 text-black text-[12.5px] font-semibold">
                            <td className="py-1.5 text-center text-black font-mono text-[12.5px]">{idx + 1}</td>
                            <td className="py-1.5 pl-2">
                              <p className="font-bold text-black text-[12.5px]">
                                {targetProd ? targetProd.name : '—'}
                              </p>
                              {targetProd && (
                                <p className="text-[10.5px] text-black mt-0.5 uppercase tracking-wider font-mono font-bold">
                                  {targetProd.sku} • {targetProd.category}
                                </p>
                              )}
                            </td>
                            <td className="py-1.5 text-center font-bold text-[12.5px]">{item.quantity > 0 ? item.quantity : ' '}</td>
                            <td className="py-1.5 text-center text-black font-mono text-[10.5px] font-bold">{item.serialNumber || '—'}</td>
                            <td className="py-1.5 text-right font-mono text-[12.5px]">{formatBDTCurrency(unitPrice)}</td>
                            <td className="py-1.5 text-right font-mono font-bold text-black text-[12.5px]">{formatBDTCurrency(rowTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS & SUMMARY SECTION */}
                <div className="flex justify-end pt-2 border-t-2 border-black">
                  <div className="w-1/2 md:w-2/5 space-y-0.5 text-[13px] text-black font-bold">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-black">{computedSubtotal > 0 ? formatBDTCurrency(computedSubtotal) : ' '}</span>
                    </div>
                    <div className="flex justify-between text-black">
                      <span>Discount</span>
                      <span className="font-mono">{parsedDiscount > 0 ? `- ${formatBDTCurrency(parsedDiscount)}` : ' '}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className="font-mono">{parsedDelivery > 0 ? `+ ${formatBDTCurrency(parsedDelivery)}` : ' '}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-black pt-1.5 pb-0.5">
                      <span className="font-extrabold text-[#000000] text-[14.5px] uppercase">Grand Total</span>
                      <span className="font-mono text-[18px] font-extrabold text-black">{grandTotal > 0 ? formatBDTCurrency(grandTotal) : ' '}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid</span>
                      <span className="font-mono text-black">{parsedAmountPaid > 0 ? formatBDTCurrency(parsedAmountPaid) : ' '}</span>
                    </div>
                    <div className="flex justify-between text-black font-extrabold border-t-2 border-black pt-1.5">
                      <span>Due Amount</span>
                      <span className="font-mono text-[14px]">{(grandTotal - parsedAmountPaid) > 0 ? formatBDTCurrency(grandTotal - parsedAmountPaid) : ' '}</span>
                    </div>
                  </div>
                </div>

                {/* 5. NOTES, TERMS, WARRANTY & SIGNATURE */}
                <div className="grid grid-cols-2 gap-4 pt-2.5 border-t-2 border-black text-[12.5px] text-black">
                  
                  {/* Left Column: Notes & Warranty */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-[14px] font-bold uppercase tracking-wide text-black mb-0.5">Notes</h4>
                      <p className="text-black font-semibold whitespace-pre-wrap leading-snug text-[12px]">
                        {orderNotes.trim() || 'পণ্য গ্রহণের পর সমস্যা হলে ৩ দিনের মধ্যে জানান। ধন্যবাদ।'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold uppercase tracking-wide text-black mb-0.5">Warranty Terms & Conditions</h4>
                      <ul className="list-decimal pl-4 text-black space-y-0.5 leading-snug text-[9.5px] font-semibold">
                        <li>ওয়ারেন্টি শুধুমাত্র উৎপাদনজনিত (Manufacturing Defect) ত্রুটির ক্ষেত্রে প্রযোজ্য।</li>
                        <li>ফিজিক্যাল ড্যামেজ, পানি প্রবেশ, আগুন, ভাঙা বা পোড়া অবস্থায় ওয়ারেন্টি প্রযোজ্য হবে না।</li>
                        <li>ওয়ারেন্টি দাবি করার সময় মূল ইনভয়েস/রসিদ প্রদর্শন করতে হবে।</li>
                        <li>অনুমোদনহীন মেরামত বা খোলা হলে ওয়ারেন্টি বাতিল বলে গণ্য হবে।</li>
                        <li>ওয়ারেন্টি সেবা কোম্পানির নীতিমালা ও শর্তাবলী অনুযায়ী প্রদান করা হবে.</li>
                      </ul>
                    </div>
                    {warrantyPeriod > 0 && (
                      <div className="p-2 border border-black rounded-none">
                        <h4 className="text-[12px] font-bold uppercase tracking-wide text-black mb-0.5">Warranty Policy</h4>
                        <div className="grid grid-cols-2 gap-y-0.5 text-[11px] text-black font-bold">
                          <p><span>Coverage:</span> <span className="font-extrabold">{warrantyPeriod} Months</span></p>
                          <p><span>Type:</span> <span className="font-extrabold">Official Warranty</span></p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Signature Pad */}
                  <div className="flex flex-col justify-end items-end h-full pb-3">
                    <div className="w-[180px]">
                      <SignaturePad 
                        onSave={setSignatureImg} 
                        savedDataUrl={signatureImg} 
                        ownerName="MD Sahadat Hossen" 
                        brandName={activeBrandSpec.name} 
                      />
                    </div>
                  </div>

                </div>

                {/* SOLID BLACK FOOTER STRIP IN BLACK & WHITE (White bg, light-gray border, black text) */}
                <div className="bg-white text-black border-2 border-black p-3 rounded-none flex items-center justify-between text-[12px] font-medium font-sans select-none tracking-wide">
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 flex items-center justify-center">
                      {'logo' in activeBrandSpec && activeBrandSpec.logo ? (
                        <img 
                          src={activeBrandSpec.logo as string} 
                          alt={activeBrandSpec.name} 
                          className="w-[18px] h-[18px] rounded-full object-contain bg-white p-0.5 border border-black" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg viewBox="0 0 100 100" className="w-[18px] h-[18px] text-black">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.5" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
                          <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
                          <circle cx="50" cy="50" r="6" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                    <span className="font-bold tracking-tight uppercase text-black">{activeBrandSpec.name}</span>
                    <span className="text-black font-extrabold">•</span>
                    <span className="text-black">{activeBrandSpec.email}</span>
                  </div>
                  <div>
                    <span className="font-extrabold">📞</span> {activeBrandSpec.phone}
                  </div>
                  <div className="font-bold flex items-center gap-0.5 text-black">
                    <span>Thank you for your business!</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM HISTORICAL LOGS COMPONENT PANEL */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-slate-800">Historical Order logs (Invoices Journal)</h3>
              <p className="text-[11px] text-slate-400 font-medium">Audit chronologically persisted customer receipts inside the cloud database.</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by ID, client name, status, courier..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>
        </div>

        {/* Database history table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4 font-mono">Invoice Serial</th>
                <th className="py-3 px-4">Brand Profile</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4 font-mono">Logistics Channel</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Grand Net</th>
                <th className="py-3 px-4 text-center">Receipts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold font-mono">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Syncing previous timelines from Firestore...
                  </td>
                </tr>
              ) : filteredSalesHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold font-mono">
                    No matching invoices found in journals database.
                  </td>
                </tr>
              ) : (
                filteredSalesHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-all font-medium">
                    <td className="py-3.5 px-4 font-mono font-black text-teal-600">{s.invoiceNo}</td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 font-bold">{s.brand || 'Original Sky'}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 leading-none">{s.customerName}</p>
                      {s.customerPhone && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.customerPhone}</p>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-550">
                      <p className="font-bold text-slate-700">{s.courier || 'Steadfast'}</p>
                      {s.trackingId && <p className="text-[10px] text-slate-400">Ref: {s.trackingId}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-full leading-none select-none ${
                        s.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                          : s.paymentStatus === 'Partial'
                          ? 'bg-amber-50 border border-amber-100 text-amber-700'
                          : 'bg-rose-50 border border-rose-105 text-rose-700'
                      }`}>
                        {s.paymentStatus || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      {formatBDTCurrency(s.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveInvoice(s)}
                          className="text-[11px] text-teal-600 hover:text-teal-700 font-bold underline flex items-center gap-1 cursor-pointer"
                          title="View formal A4 Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSale(s);
                            setEditFormGroup({
                              customerName: s.customerName,
                              customerPhone: s.customerPhone || '',
                              customerAddress: s.customerAddress || '',
                              brand: s.brand || 'Sky Automation Tech',
                              platform: s.platform || 'Facebook',
                              courier: s.courier || 'Steadfast',
                              trackingId: s.trackingId || '',
                              paymentMethod: s.paymentMethod || 'Cash',
                              paymentStatus: s.paymentStatus || 'Paid',
                              amountPaid: s.amountPaid !== undefined ? s.amountPaid : s.totalAmount,
                              notes: s.notes || ''
                            });
                            setIsEditingModalOpen(true);
                          }}
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-bold underline flex items-center gap-1 cursor-pointer"
                          title="Edit Customer Info / Logistics"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Are you absolutely sure you want to delete invoice ${s.invoiceNo}? This will restore its products' original stock levels!`)) {
                              const success = await deleteSale(s.id);
                              if (success) {
                                alert(`Invoice ${s.invoiceNo} has been successfully deleted and inventory quantities have been reverted.`);
                              } else {
                                alert(`Error deleting invoice document.`);
                              }
                            }
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline flex items-center gap-1 cursor-pointer"
                          title="Purge Invoice & Revert Stocks"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      </div>      {/* UPDATE ORDER EDIT MODAL */}
      {isEditingModalOpen && editingSale && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in scale-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-800">
              <h3 className="text-sm font-black font-mono text-slate-700 tracking-wider flex items-center gap-1.5 uppercase">
                <Edit className="w-4 h-4 text-amber-500" />
                <span>Edit Order: {editingSale.invoiceNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditingModalOpen(false);
                  setEditingSale(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer bg-transparent border-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1 animate-in slide-in-from-top-1 duration-100">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Client Name</label>
                <input
                  type="text"
                  required
                  value={editFormGroup.customerName}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Client Phone</label>
                <input
                  type="text"
                  required
                  value={editFormGroup.customerPhone}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Brand Channel</label>
                <select
                  value={editFormGroup.brand}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Sky Automation Tech">Sky Automation Tech</option>
                  <option value="GadgetZu">GadgetZu</option>
                  <option value="RTX Gadget">RTX Gadget</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Customer Address</label>
                <textarea
                  rows={2}
                  required
                  value={editFormGroup.customerAddress}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, customerAddress: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Order Platform</label>
                <select
                  value={editFormGroup.platform}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Website">Website</option>
                  <option value="In Store">In Store</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Courier Partner</label>
                <input
                  type="text"
                  required
                  value={editFormGroup.courier}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, courier: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Tracking Reference ID</label>
                <input
                  type="text"
                  value={editFormGroup.trackingId}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, trackingId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Payment Method</label>
                <select
                  value={editFormGroup.paymentMethod}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Payment Status</label>
                <select
                  value={editFormGroup.paymentStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    setEditFormGroup(prev => ({
                      ...prev,
                      paymentStatus: status,
                      amountPaid: status === 'Paid' ? (editingSale ? editingSale.totalAmount : 0) : status === 'Due' ? 0 : prev.amountPaid
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-205 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Due">Due</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Amount Paid (৳)</label>
                <input
                  type="number"
                  min="0"
                  max={editingSale?.totalAmount || 1000000}
                  required
                  disabled={editFormGroup.paymentStatus === 'Paid' || editFormGroup.paymentStatus === 'Due'}
                  value={editFormGroup.amountPaid}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, amountPaid: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide">Invoice/Order Notes</label>
                <textarea
                  rows={2}
                  value={editFormGroup.notes}
                  onChange={(e) => setEditFormGroup(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingModalOpen(false);
                    setEditingSale(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 font-bold text-white rounded-xl flex items-center justify-center cursor-pointer border-0 shadow-sm hover:shadow-teal-500/10 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP HIGH FIDELITY printable RECEIPT PANEL MODAL */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          {(() => {
            const invoiceBrandSpec = BRAND_SPECS[activeInvoice.brand as keyof typeof BRAND_SPECS] || BRAND_SPECS['Sky Automation Tech'];
            return (
              <div id="invoice-display-modal" className="bg-white border border-neutral-300 rounded-2xl w-full max-w-[842px] overflow-hidden flex flex-col items-stretch my-8 shadow-2xl animate-in scale-in duration-200 relative">
              
              {/* Modal action controllers */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center select-none text-neutral-800">
                <span className="text-[10px] font-black font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>OFFICIAL LOG DISPATCH DESK</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadPDFFile(activeInvoice, false)}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1.5 p-2 px-3.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 rounded-xl transition-all font-bold shadow-xs cursor-pointer"
                  >
                    {isDownloadingPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download A4 PDF</span>
                  </button>

                  <button
                    id="btn-sys-print-invoice"
                    onClick={triggerNativePrint}
                    className="flex items-center gap-1.5 p-2 px-3.5 bg-black hover:bg-neutral-850 text-xs text-white rounded-xl transition-all font-bold shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveInvoice(null);
                    }}
                    className="p-2 text-xs text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors shrink-0 cursor-pointer"
                    title="Close receipt window"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* HIGH FIDELITY printable DOCUMENT */}
              <div className="overflow-x-auto bg-slate-100 p-6 flex justify-center">
                <div 
                  id="printable-invoice-body" 
                  className="bg-white text-black pt-6 pb-11 px-10 flex flex-col justify-between border-4 border-black rounded-none relative overflow-hidden"
                  style={{ width: '794px', height: '1123px', minHeight: '1123px', maxHeight: '1123px', backgroundColor: '#ffffff', color: '#000000', fontFamily: "'Inter', 'Poppins', sans-serif" }}
                >
                
                {/* 1. Header Section */}
                <div className="flex justify-between items-start select-none">
                  <div>
                    {invoiceBrandSpec.logo ? (
                      <img src={invoiceBrandSpec.logo as string} alt={invoiceBrandSpec.name} className="w-18 h-18 object-contain mb-1.5" />
                    ) : (
                      <div className="w-14 h-14 bg-black text-white rounded-none flex items-center justify-center text-lg font-bold mb-1.5 uppercase tracking-wider">
                        SAT
                      </div>
                    )}
                    <h1 className="text-[26px] font-bold text-black leading-tight">{invoiceBrandSpec.name}</h1>
                    <p className="text-[12px] tracking-wider text-black font-bold uppercase mt-0.5">{invoiceBrandSpec.tagline}</p>
                    <div className="text-[12px] text-black font-bold mt-2.5 space-y-0.5">
                      <p>📍 {invoiceBrandSpec.address}</p>
                      <p>📞 {invoiceBrandSpec.phone}</p>
                      <p>✉️ {invoiceBrandSpec.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <h2 className="text-[22px] font-extrabold tracking-widest text-black uppercase mb-1 leading-none select-none">INVOICE</h2>
                    <div className="text-[12px] text-black space-y-1 mt-2.5 text-right font-bold">
                      <p><span>Invoice No:</span> <span className="font-extrabold text-[14px] underline decoration-2 font-mono">{activeInvoice.invoiceNo}</span></p>
                      <p><span>Date:</span> <span className="font-bold">{new Date(activeInvoice.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                      <div className="inline-block bg-black text-white px-2.5 py-0.5 font-extrabold text-[12px] uppercase tracking-wider rounded-none mt-1 shadow-sm">
                        STATUS: {activeInvoice.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b-2 border-black" />

                {/* 2. Client & Logistics */}
                <div className="grid grid-cols-2 gap-6 text-[12.5px] pt-1">
                  <div>
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-black mb-1 border-b-2 border-black pb-0.5">BILL TO</h3>
                    <p className="font-bold text-black text-[13.5px] uppercase tracking-wide leading-relaxed">{activeInvoice.customerName}</p>
                    <p className="font-extrabold text-black mt-0.5 font-mono text-[12px]">Phone: {activeInvoice.customerPhone}</p>
                    <p className="text-black font-bold leading-normal mt-0.5 w-5/6 text-[12px]">{activeInvoice.customerAddress}</p>
                  </div>
                  <div className="text-right flex flex-col items-end w-full">
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-black mb-1 border-b-2 border-black pb-0.5 w-full">DELIVERY DETAILS</h3>
                    <div className="text-[12px] text-black space-y-1 font-bold">
                      <p><span>Platform:</span> <span className="font-extrabold text-black">{activeInvoice.platform || 'General Order'}</span></p>
                      <p><span>Courier:</span> <span className="font-extrabold text-black">{activeInvoice.courier || '—'}</span></p>
                      <p><span>Tracking:</span> <span className="font-extrabold text-black font-mono uppercase text-[13px]">{activeInvoice.trackingId || '—'}</span></p>
                      <p><span>Method:</span> <span className="font-extrabold text-black uppercase">{activeInvoice.paymentMethod || '—'}</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table */}
                <div className="flex-1 min-h-[80px] pt-0">
                  <table className="w-full text-left text-[12.5px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider w-10 text-center">#</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider pl-2">Description</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-center w-14">Qty</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-right w-28">Price</th>
                        <th className="py-1.5 text-[13px] font-bold text-black uppercase tracking-wider text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvoice.items.map((item, idx) => {
                        const rowTotal = (item.sellingPrice || 0) * (item.quantity || 0);
                        return (
                          <tr key={idx} className="border-b border-black last:border-b-0 text-black text-[12.5px] font-semibold">
                            <td className="py-1.5 text-center text-black font-mono text-[12.5px]">{idx + 1}</td>
                            <td className="py-1.5 pl-2">
                              <span className="font-bold text-black block text-[12.5px]">{item.productName}</span>
                              {item.sku && <span className="text-[10.5px] text-black block mt-0.5 uppercase tracking-wider font-mono font-bold">{item.sku}</span>}
                            </td>
                            <td className="py-1.5 text-center font-bold text-[12.5px]">{item.quantity > 0 ? item.quantity : ' '}</td>
                            <td className="py-1.5 text-right font-mono text-black text-[12.5px]">{formatBDTCurrency(item.sellingPrice || 0)}</td>
                            <td className="py-1.5 text-right font-mono font-bold text-black text-[12.5px]">{formatBDTCurrency(rowTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. Summary Block */}
                <div className="flex justify-end pt-2 border-t-2 border-black">
                  <div className="w-1/2 md:w-2/5 space-y-0.5 text-[13px] text-black font-bold">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-black">{(activeInvoice.subtotal !== undefined ? activeInvoice.subtotal : activeInvoice.totalAmount) > 0 ? formatBDTCurrency(activeInvoice.subtotal !== undefined ? activeInvoice.subtotal : activeInvoice.totalAmount) : ' '}</span>
                    </div>
                    <div className="flex justify-between text-black">
                      <span>Discount</span>
                      <span className="font-mono">{(activeInvoice.discount || 0) > 0 ? `- ${formatBDTCurrency(activeInvoice.discount)}` : ' '}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className="font-mono">{(activeInvoice.deliveryCharge || 0) > 0 ? `+ ${formatBDTCurrency(activeInvoice.deliveryCharge)}` : ' '}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-black pt-1.5 pb-0.5">
                      <span className="font-extrabold text-black text-[14.5px] uppercase">Grand Total</span>
                      <span className="font-mono text-[18px] font-extrabold text-black">{(activeInvoice.totalAmount || 0) > 0 ? formatBDTCurrency(activeInvoice.totalAmount) : ' '}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid</span>
                      <span className="font-mono text-black">{(activeInvoice.amountPaid !== undefined ? activeInvoice.amountPaid : activeInvoice.totalAmount) > 0 ? formatBDTCurrency(activeInvoice.amountPaid !== undefined ? activeInvoice.amountPaid : activeInvoice.totalAmount) : ' '}</span>
                    </div>
                    <div className="flex justify-between text-black font-extrabold border-t-2 border-black pt-1.5">
                      <span>Due Amount</span>
                      <span className="font-mono text-[14px]">{(activeInvoice.totalAmount - (activeInvoice.amountPaid || 0)) > 0 ? formatBDTCurrency(activeInvoice.totalAmount - (activeInvoice.amountPaid || 0)) : ' '}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Footer & Signature Area */}
                <div className="border-t-2 border-black pt-2.5 grid grid-cols-2 gap-4 text-[12.5px] text-black font-bold font-sans">
                  
                  {/* Left Column: Notes & Warranty */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-bold text-black uppercase tracking-wide text-[14px] mb-0.5">Notes</h4>
                      <p className="text-black font-semibold whitespace-pre-wrap text-[12px] leading-snug">{activeInvoice.notes || "Thank you for your business."}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-black uppercase tracking-wide text-[14px] mb-0.5">Warranty Terms & Conditions</h4>
                      <div className="space-y-0.5 text-[9.5px] font-semibold leading-snug">
                        <p>১. ওয়ারেন্টি শুধুমাত্র উৎপাদনজনিত (Manufacturing Defect) ত্রুটির ক্ষেত্রে প্রযোজ্য।</p>
                        <p>২. ফিজিক্যাল ড্যামেজ, পানি প্রবেশ, আগুন, ভাঙা বা পোড়া অবস্থায় ওয়ারেন্টি প্রযোজ্য হবে না।</p>
                        <p>৩. ওয়ারেন্টি দাবি করার সময় মূল ইনভয়েস/রসিদ প্রদর্শন করতে হবে।</p>
                        <p>৪. অনুমোদনহীন মেরামত বা খোলা হলে ওয়ারেন্টি বাতিল বলে গণ্য হবে।</p>
                        <p>৫. ওয়ারেন্টি সেবা কোম্পানির নীতিমালা ও শর্তাবলী অনুযায়ী প্রদান করা হবে.</p>
                      </div>
                    </div>
                    {activeInvoiceWarrantyData ? (
                      <div className="border border-black p-2 text-[11px] text-black space-y-0.5 rounded-none">
                        <span className="font-bold text-black block uppercase tracking-wide text-[11px]">Warranty Information</span>
                        <p>Status: <span className="font-extrabold text-black uppercase text-[11px]">{activeInvoiceWarrantyData.status}</span></p>
                        <p>Period: <span className="font-extrabold text-[11px]">{activeInvoiceWarrantyData.periodMonths} Months</span></p>
                        <p>Expiry: <span className="font-extrabold text-[11px]">{(() => {
                          const purchaseDate = new Date(activeInvoiceWarrantyData.purchaseDate);
                          purchaseDate.setMonth(purchaseDate.getMonth() + activeInvoiceWarrantyData.periodMonths);
                          return purchaseDate.toLocaleDateString();
                        })()}</span></p>
                        <p className="italic font-bold text-black text-[10px]">Terms: {activeInvoiceWarrantyData.terms}</p>
                      </div>
                    ) : (
                      <div className="border border-black p-1.5 text-[10px] text-black bg-white font-semibold rounded-none">
                        Standard warranty policy applies. Check invoice serial.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Signature Display */}
                  <div className="text-right flex flex-col justify-end items-end h-full pb-3">
                    <p className="font-bold text-black uppercase tracking-wide text-[11px] mb-1">Authorized Signature</p>
                    <div className="h-10 flex items-end justify-end mb-1">
                      {activeInvoice.signatureDataUrl ? (
                        <img src={activeInvoice.signatureDataUrl} className="h-9 w-auto object-contain align-bottom" />
                      ) : (
                        <div className="w-36 border-b-2 border-black"></div>
                      )}
                    </div>
                    <p className="text-[11px] text-black font-bold">MD Sahadat Hossen</p>
                  </div>

                </div>

                {/* Branding Footer line */}
                <div className="pt-3 border-t-2 border-black flex justify-between items-center text-[12px] font-medium text-black select-none">
                  <div className="flex gap-2">
                    <span className="font-bold uppercase text-black">{invoiceBrandSpec.name}</span>
                    <span>•</span>
                    <span>{invoiceBrandSpec.email}</span>
                  </div>
                  <div className="font-medium tracking-wide text-black">
                    Thank you for your business!
                  </div>
                </div>

              </div>
            </div>

              </div>
            );
          })()}
        </div>
      )}

      {toast && (
        <div id="toast-notification-panel" className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl flex items-start gap-3 shadow-2xl text-xs z-[100] animate-in slide-in-from-bottom-2 duration-300 max-w-sm">
          {toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold font-sans text-neutral-100">{toast.title}</p>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5">{toast.description}</p>
          </div>
        </div>
      )}

    </div>
  );
};
