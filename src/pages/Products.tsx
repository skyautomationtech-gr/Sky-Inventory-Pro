import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as Icons from 'lucide-react';
import { Product } from '../types';
import { BarcodeRenderer } from '../components/BarcodeRenderer';

export const Products: React.FC = () => {
  const { 
    products, 
    currentUser, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    generateMissingBarcodes,
    loading,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    suppliers
  } = useApp();
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All'); // 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'
  
  // Modal controllers
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  
  // Multi-form items
  const [formName, setFormName] = useState('');
  const [formCategoryMain, setFormCategoryMain] = useState('');
  const [formCategorySub, setFormCategorySub] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState(0);
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formLowStockLimit, setFormLowStockLimit] = useState(5);
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Display notifications or alerts
  const [roleErrorMessage, setRoleErrorMessage] = useState('');
  const [copySuccessMessage, setCopySuccessMessage] = useState('');

  // Image upload and client-side compression states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);

  // Compress image to a squared 800x800 high clarity WEBP, and a fast-loading 150x150 thumbnail
  const compressImageToSquareBase64 = (file: File): Promise<{ imageBase64: string; thumbnailBase64: string }> => {
    return new Promise((resolve, reject) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        reject(new Error('Only JPG, PNG and WEBP formats are supported.'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // 1. Create main squared high resolution canvas (800x800)
          const TARGET_SIZE = 800;
          const canvas = document.createElement('canvas');
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to capture graphics context for high-res compression.'));
            return;
          }

          // Solid White Background for professional e-commerce product placement
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

          let drawWidth = TARGET_SIZE;
          let drawHeight = TARGET_SIZE;
          let offsetX = 0;
          let offsetY = 0;

          if (img.width > img.height) {
            drawHeight = TARGET_SIZE * (img.height / img.width);
            offsetY = (TARGET_SIZE - drawHeight) / 2;
          } else if (img.height > img.width) {
            drawWidth = TARGET_SIZE * (img.width / img.height);
            offsetX = (TARGET_SIZE - drawWidth) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          // WEBP format with 0.65 quality for balanced clarity & ultra-fast load
          const imageBase64 = canvas.toDataURL('image/webp', 0.65);

          // 2. Create small square thumbnail canvas (150x150)
          const THUMB_SIZE = 150;
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = THUMB_SIZE;
          thumbCanvas.height = THUMB_SIZE;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (!thumbCtx) {
            reject(new Error('Failed to capture graphics context for thumbnail creation.'));
            return;
          }

          // Solid White Background for the thumbnail
          thumbCtx.fillStyle = '#FFFFFF';
          thumbCtx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

          let thumbDrawWidth = THUMB_SIZE;
          let thumbDrawHeight = THUMB_SIZE;
          let thumbOffsetX = 0;
          let thumbOffsetY = 0;

          if (img.width > img.height) {
            thumbDrawHeight = THUMB_SIZE * (img.height / img.width);
            thumbOffsetY = (THUMB_SIZE - thumbDrawHeight) / 2;
          } else if (img.height > img.width) {
            thumbDrawWidth = THUMB_SIZE * (img.width / img.height);
            thumbOffsetX = (THUMB_SIZE - thumbDrawWidth) / 2;
          }

          thumbCtx.drawImage(img, thumbOffsetX, thumbOffsetY, thumbDrawWidth, thumbDrawHeight);

          // WEBP format with 0.5 quality for maximum lightweight footprint
          const thumbnailBase64 = thumbCanvas.toDataURL('image/webp', 0.5);

          // Calculate size of main base64-encoded image for safety limit checks
          const sizeInBytes = Math.round((imageBase64.length * 3) / 4);
          const sizeInKB = sizeInBytes / 1024;

          console.log(`Square processing metrics for ${file.name}: Original size: ${(file.size/1024).toFixed(1)} KB | Main squared (800x800): ${sizeInKB.toFixed(1)} KB | Thumbnail (150x150): ${Math.round((thumbnailBase64.length*3/4)/1024)} KB`);

          // Enforce 150 KB maximum to prevent large Firestore documents & sync overhead
          const limitKB = 150;
          if (sizeInKB > limitKB) {
            reject(new Error(`The compressed image size (${sizeInKB.toFixed(1)} KB) exceeds the safe allowed limit of ${limitKB} KB. Please select a less complex image asset.`));
            return;
          }

          resolve({ imageBase64, thumbnailBase64 });
        };
        img.onerror = () => reject(new Error('Failed to decode selected image contents.'));
      };
      reader.onerror = () => reject(new Error('Failed to read selected image source.'));
    });
  };

  const handleImageFile = async (file: File) => {
    setLastSelectedFile(file);
    setIsUploading(true);
    setUploadStatus('Optimizing and converting image locally...');
    setUploadError('');

    console.log("Processing direct Base64 transformation for:", file.name);

    try {
      const result = await compressImageToSquareBase64(file);
      setFormImage(result.imageBase64);
      setFormThumbnail(result.thumbnailBase64);
      setUploadStatus('');
      console.log("Photo converted to encoded Base64 images successfully.");
    } catch (err: any) {
      console.error("Local Compression Failure:", err);
      setUploadError(err.message || 'Failed to process selected image file.');
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("User cleared product image.");
    setFormImage('');
    setFormThumbnail('');
    setLastSelectedFile(null);
    setUploadError('');
    setUploadStatus('');
  };

  const handleRetrySelection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("User clicked retry select image.");
    setUploadError('');
    setUploadStatus('');
    document.getElementById('product-photo-upload-input')?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleImageFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleImageFile(file);
    }
  };

  // Category Manager State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<any>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormIcon, setCatFormIcon] = useState('FolderPlus');
  const [catFormSubcategories, setCatFormSubcategories] = useState<string[]>([]);
  const [newSubcategoryText, setNewSubcategoryText] = useState('');

  // Synchronize dynamic defaults when categories load
  useEffect(() => {
    if (!formCategoryMain && categories.length > 0) {
      setFormCategoryMain(categories[0].name);
      setFormCategorySub(categories[0].subcategories[0] || '');
    }
  }, [categories]);

  // Open modal for either Add or Edit
  const openModal = (product?: Product) => {
    setRoleErrorMessage('');
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      
      // Parse main category and subcategory
      if (product.category.includes(' - ')) {
        const [main, sub] = product.category.split(' - ');
        setFormCategoryMain(main);
        setFormCategorySub(sub || '');
      } else {
        setFormCategoryMain(product.category);
        setFormCategorySub('');
      }
      
      setFormBrand(product.brand);
      setFormPurchasePrice(product.purchasePrice);
      setFormSellingPrice(product.sellingPrice);
      setFormStock(product.stock);
      setFormLowStockLimit(product.lowStockLimit !== undefined ? product.lowStockLimit : 10);
      setFormSupplierName(product.supplierName || '');
      setFormImage(product.imageBase64 || product.image || '');
      setFormThumbnail(product.thumbnailBase64 || '');
      setFormDesc(product.description || '');
    } else {
      setEditingProduct(null);
      setFormName('');
      
      const firstCat = categories[0]?.name || 'Chargers';
      setFormCategoryMain(firstCat);
      const firstSub = categories[0]?.subcategories[0] || '';
      setFormCategorySub(firstSub);
      
      setFormBrand('');
      setFormPurchasePrice(0);
      setFormSellingPrice(0);
      setFormStock(0);
      setFormLowStockLimit(10);
      setFormSupplierName(suppliers[0]?.name || '');
      setFormImage('');
      setFormThumbnail('');
      setFormDesc('');
    }
    setIsModifyModalOpen(true);
  };

  const closeModal = () => {
    setIsModifyModalOpen(false);
    setEditingProduct(null);
    setIsUploading(false);
    setUploadStatus('');
    setUploadError('');
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build category matching template e.g., "Chargers - Fast Charger" or "Chargers"
    const finalCategoryName = formCategorySub ? `${formCategoryMain} - ${formCategorySub}` : formCategoryMain;

    const fields = {
      name: formName,
      category: finalCategoryName,
      brand: formBrand,
      purchasePrice: Number(formPurchasePrice),
      sellingPrice: Number(formSellingPrice),
      stock: Number(formStock),
      lowStockLimit: Number(formLowStockLimit),
      supplierName: formSupplierName,
      image: formImage || '',
      imageBase64: formImage || '',
      thumbnailBase64: formThumbnail || '',
      description: formDesc
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, fields);
    } else {
      addProduct(fields);
    }

    closeModal();
  };

  // Delete Action under Permission Rules
  const handleDeleteProduct = (id: string) => {
    setRoleErrorMessage('');
    const approved = deleteProduct(id);
    if (!approved) {
      setRoleErrorMessage('Security Denied: Staff roles are unauthorized to permanently remove products from Catalog.');
      // Dismiss the role warning banner after 5 seconds automatically
      setTimeout(() => setRoleErrorMessage(''), 5000);
    }
  };

  // Helper function to get correct status derived values
  const getProductStockStatus = (p: Product) => {
    const lowLimit = p.lowStockLimit !== undefined ? p.lowStockLimit : 10;
    if (p.stock <= 0) return 'Out of Stock';
    if (p.stock < lowLimit) return 'Low Stock';
    return 'In Stock';
  };

  // Dynamic filter lists supporting Category/Subcategory, Search queries, and Stock Statuses
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      matchesCategory = p.category === selectedCategory || p.category.startsWith(`${selectedCategory} - `);
    }
    
    let matchesSubcategory = true;
    if (selectedSubcategory !== 'All') {
      matchesSubcategory = p.category === `${selectedCategory} - ${selectedSubcategory}` || p.category.endsWith(` - ${selectedSubcategory}`);
    }

    let matchesStock = true;
    if (selectedStockStatus !== 'All') {
      matchesStock = getProductStockStatus(p) === selectedStockStatus;
    }

    return matchesSearch && matchesCategory && matchesSubcategory && matchesStock;
  });

  // Calculate live metric counts for filter badges
  const stockStatisticsMatched = React.useMemo(() => {
    let inStockVal = 0;
    let lowStockVal = 0;
    let outStockVal = 0;

    products.forEach(p => {
      const status = getProductStockStatus(p);
      if (status === 'In Stock') inStockVal++;
      else if (status === 'Low Stock') lowStockVal++;
      else if (status === 'Out of Stock') outStockVal++;
    });

    return {
      inStock: inStockVal,
      lowStock: lowStockVal,
      outOfStock: outStockVal,
      total: products.length
    };
  }, [products]);

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const RenderIcon = ({ name, className = "w-4 h-4" }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name];
    if (!IconComponent) return <Icons.FolderOpen className={className} />;
    return <IconComponent className={className} />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessMessage('Copied SKU successfully!');
    setTimeout(() => setCopySuccessMessage(''), 3000);
  };

  const AVAILABLE_ICONS = [
    'Zap', 'Cable', 'Headphones', 'BatteryCharging', 'Smartphone', 'Cpu', 
    'Keyboard', 'Gamepad2', 'HardDrive', 'Wifi', 'Camera', 'Radio', 
    'Laptop', 'Tv', 'Speakers', 'Plug', 'Layers', 'FolderPlus',
    'Wrench', 'Shield', 'Car', 'Lightbulb', 'Eye', 'Hammer', 'Scissors', 'Sparkles'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Add Actions */}
      <div id="products-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#090d16]">Products Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">Manage physical hardware SKUs, low stock warnings, cost values and supplier mappings</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Admin category management access trigger */}
          {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
            <>
              <button
                id="btn-generate-barcodes"
                onClick={async () => {
                  const confirmGen = window.confirm("Are you sure you want to scan and generate missing barcodes for all products?");
                  if (confirmGen) {
                    await generateMissingBarcodes();
                  }
                }}
                className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-indigo-200 transition-colors shrink-0 cursor-pointer"
                title="Generate barcodes for all items missing them (Admin Only)"
              >
                <Icons.Barcode className="w-4 h-4 text-indigo-500 font-bold" />
                <span>Generate Barcodes</span>
              </button>

              <button
                id="btn-manage-categories"
                onClick={() => {
                  setIsCategoryFormOpen(false);
                  setCategoryEditing(null);
                  setIsCategoryManagerOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors shrink-0 cursor-pointer"
                title="Manage Categories (Admin Only)"
              >
                <Icons.Settings className="w-4 h-4 text-slate-500 font-bold animate-spin-hover" />
                <span>Manage Categories</span>
              </button>
            </>
          )}

          <button
            id="btn-add-product"
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-500/10 transition-colors shrink-0 cursor-pointer"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Role Warning Banner */}
      {roleErrorMessage && (
        <div id="role-warning-banner" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3.5 rounded-xl flex items-center gap-2 animate-pulse text-xs font-semibold shadow-sm">
          <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{roleErrorMessage}</span>
        </div>
      )}

      {/* Copy Clipboard Notification Toast */}
      {copySuccessMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xl text-xs font-bold font-mono z-50 animate-in slide-in-from-bottom-2 duration-300">
          <Icons.CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{copySuccessMessage}</span>
        </div>
      )}

      {/* Category Horizontal Filter Bar */}
      <div className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase mb-2 block">Filter by Business Category</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                selectedCategory === 'All'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-teal-500/15'
                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icons.Layers className="w-4 h-4" />
              <span>All Categories</span>
            </button>
            
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setSelectedSubcategory('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-600 shadow-teal-500/15'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <RenderIcon name={cat.icon} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Subcategories Sub-row */}
        {selectedCategory !== 'All' && (
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="text-[10px] font-bold text-slate-400 font-mono px-2 py-1">Subsections:</span>
            <button
              onClick={() => setSelectedSubcategory('All')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                selectedSubcategory === 'All'
                  ? 'bg-teal-50 text-teal-600 border-teal-200 font-extrabold'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
              }`}
            >
              All {selectedCategory}
            </button>
            {categories.find(c => c.name === selectedCategory)?.subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                  selectedSubcategory === sub
                    ? 'bg-teal-50 text-teal-600 border-teal-200 font-extrabold'
                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Search & Stock Status Filters */}
      <div id="products-controls" className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="lg:col-span-6 relative">
          <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="product-search-input"
            type="text"
            placeholder="Search by product name, SKU part codes, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const exactMatch = products.find(p => p.sku.toLowerCase() === searchQuery.toLowerCase());
                if (exactMatch) {
                  setViewingProduct(exactMatch);
                }
              }
            }}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
          />
        </div>

        {/* Stock Status Buttons Row */}
        <div className="lg:col-span-6 flex flex-wrap items-center gap-2 justify-start lg:justify-end">
          <button
            onClick={() => setSelectedStockStatus('All')}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              selectedStockStatus === 'All'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <span>All Statuses</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${selectedStockStatus === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{stockStatisticsMatched.total}</span>
          </button>

          <button
            onClick={() => setSelectedStockStatus('In Stock')}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              selectedStockStatus === 'In Stock'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/10'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>In Stock</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${selectedStockStatus === 'In Stock' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{stockStatisticsMatched.inStock}</span>
          </button>

          <button
            onClick={() => setSelectedStockStatus('Low Stock')}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              selectedStockStatus === 'Low Stock'
                ? 'bg-amber-550 bg-amber-500 text-white border-amber-500 shadow-amber-500/10'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Low Stock</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${selectedStockStatus === 'Low Stock' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{stockStatisticsMatched.lowStock}</span>
          </button>

          <button
            onClick={() => setSelectedStockStatus('Out of Stock')}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              selectedStockStatus === 'Out of Stock'
                ? 'bg-[#b91c1c] text-white border-[#b91c1c] shadow-rose-500/10'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Out of Stock</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${selectedStockStatus === 'Out of Stock' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{stockStatisticsMatched.outOfStock}</span>
          </button>
        </div>
      </div>

      {/* SASS Product Table Grid */}
      <div id="products-table-container" className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold font-sans bg-slate-50/50 tracking-tight">
                <th className="py-3.5 px-6">Image</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU Code</th>
                <th className="py-3.5 px-4">Barcode</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Cost (In)</th>
                <th className="py-3.5 px-4">Price (Out)</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-600 font-bold">Syncing product catalog...</p>
                      <p className="text-slate-400 text-xs font-medium">Downloading records live from Cloud Firestore</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Icons.FolderPlus className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-700 font-bold">No Products Recorded</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm">
                        Get started by adding a brand new product part. After you create a product SKU, you can record active sales, suppliers, and purchase journals.
                      </p>
                      <button
                        onClick={() => openModal()}
                        className="mt-2 text-xs text-teal-600 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 px-4 py-2 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Register First Part SKU
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status = getProductStockStatus(p);
                  return (
                    <tr 
                      key={p.id} 
                      id={`row-product-${p.id}`} 
                      className="hover:bg-slate-50/40 text-xs transition-colors align-middle font-medium text-slate-700"
                    >
                      {/* Image */}
                      <td className="py-4 px-6">
                        {p.thumbnailBase64 || p.imageBase64 || p.image ? (
                          <img 
                            src={p.thumbnailBase64 || p.imageBase64 || p.image} 
                            alt={p.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm bg-slate-50 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                            referrerPolicy="no-referrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(p.imageBase64 || p.image || '');
                            }}
                            title="Click to zoom preview"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400">
                            <Icons.Package className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-4 min-w-[180px]">
                        <div className="min-w-0">
                          <p onClick={() => setViewingProduct(p)} className="font-bold text-slate-800 truncate hover:text-teal-600 cursor-pointer max-w-[190px]" title="Click to view details">{p.name}</p>
                          <span className="text-[10px] text-slate-400 font-medium font-mono block">Supplier: {p.supplierName || 'Not Linked'}</span>
                        </div>
                      </td>

                      {/* SKU Number */}
                      <td className="py-4 px-4 font-mono font-bold text-teal-600">
                        <div className="flex items-center gap-1.5">
                          <span>{p.sku}</span>
                          <button 
                            onClick={() => copyToClipboard(p.sku)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-450 hover:text-slate-700" 
                            title="Copy SKU code"
                          >
                            <Icons.Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="py-4 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Icons.Barcode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{p.barcode || 'N/A'}</span>
                          {p.barcode && (
                            <button
                              onClick={() => setBarcodeProduct(p)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                              title="View, Print & Download Barcode"
                            >
                              <Icons.Eye className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-600 font-mono text-[9px] font-bold">
                          {p.category}
                        </span>
                      </td>

                      {/* Brand */}
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {p.brand}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-4 px-4 font-mono text-slate-500">
                        {formatCurrency(p.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4 font-mono text-slate-900 font-bold col-span">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Stock levels */}
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {p.stock}
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex justify-center">
                          {status === 'In Stock' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>In Stock</span>
                            </span>
                          )}
                          {status === 'Low Stock' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-550 bg-amber-500 animate-pulse"></span>
                              <span>Low Stock</span>
                            </span>
                          )}
                          {status === 'Out of Stock' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-[#b91c1c] border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>Out of Stock</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all shadow-sm cursor-pointer"
                            title="View product details"
                          >
                            <Icons.Eye className="w-3.5 h-3.5" />
                          </button>

                          {p.barcode && (
                            <button
                              onClick={() => setBarcodeProduct(p)}
                              className="p-1.5 text-indigo-500 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-all shadow-sm cursor-pointer"
                              title="View, Print & Download Barcode"
                            >
                              <Icons.Barcode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button
                            id={`btn-edit-${p.id}`}
                            onClick={() => openModal(p)}
                            className="p-1.5 text-slate-550 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all shadow-sm cursor-pointer"
                            title="Edit product info"
                          >
                            <Icons.Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            id={`btn-delete-${p.id}`}
                            onClick={() => handleDeleteProduct(p.id)}
                            className={`p-1.5 rounded-lg border transition-all shadow-sm cursor-pointer ${
                              currentUser.role === 'Staff' 
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-rose-50 text-[#b91c1c] border-rose-250 border-rose-200 hover:text-[#991b1b]'
                            }`}
                            title={currentUser.role === 'Staff' ? "Staff are restricted from deleting parts" : "Delete Product"}
                            disabled={currentUser.role === 'Staff'}
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details Modal (View Action) */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-150 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded text-teal-700 font-mono text-[9px] font-bold uppercase tracking-wider">
                  Product Details Sheet
                </span>
                <h3 className="font-display font-extrabold text-[#090d16] text-base mt-1">
                  SKU Spec Summary
                </h3>
              </div>
              <button 
                onClick={() => setViewingProduct(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Image & Basic Details Row */}
              <div className="flex flex-col sm:flex-row gap-5 border-b border-slate-100 pb-5">
                {viewingProduct.imageBase64 || viewingProduct.image ? (
                  <img 
                    src={viewingProduct.imageBase64 || viewingProduct.image} 
                    alt={viewingProduct.name} 
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-150 bg-slate-50 shadow-sm grow-0 shrink-0 self-center sm:self-start cursor-zoom-in hover:scale-105 active:scale-95 transition-all"
                    referrerPolicy="no-referrer"
                    onClick={() => setLightboxImage(viewingProduct.imageBase64 || viewingProduct.image || '')}
                    title="Click to zoom preview"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-150 bg-slate-50 shadow-sm grow-0 shrink-0 self-center sm:self-start flex items-center justify-center text-slate-400">
                    <Icons.Package className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="space-y-2 flex-1 text-center sm:text-left min-w-0">
                  <h4 className="text-base font-bold text-[#090d16] truncate" title={viewingProduct.name}>
                    {viewingProduct.name}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.8 bg-slate-100 border border-slate-150 rounded text-slate-600 font-mono text-[9px] font-bold flex items-center gap-1">
                      <Icons.Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewingProduct.category}</span>
                    </span>
                    <span className="px-2 py-0.8 bg-slate-100 border border-slate-150 rounded text-slate-600 font-mono text-[9px] font-bold">
                      Brand: {viewingProduct.brand}
                    </span>
                  </div>
                  <div className="font-mono text-xs flex items-center justify-center sm:justify-start gap-1 text-slate-500">
                    <span>Part SKU:</span>
                    <span className="font-bold text-teal-600">{viewingProduct.sku}</span>
                    <button 
                      onClick={() => copyToClipboard(viewingProduct.sku)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-450 hover:text-slate-700" 
                      title="Copy SKU code"
                    >
                      <Icons.Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inbound/Outbound Financial Analysis & Margin Section */}
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-3.5">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Financial Analytics & Profit Matrix
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-2 border border-slate-200/55 rounded-xl bg-white text-left shadow-sm">
                    <p className="text-[9px] font-semibold text-slate-400">Buying Cost (In)</p>
                    <p className="text-sm font-extrabold text-slate-900 font-mono mt-1">
                      {formatCurrency(viewingProduct.purchasePrice)}
                    </p>
                  </div>
                  <div className="p-2 border border-slate-200/55 rounded-xl bg-white text-left shadow-sm">
                    <p className="text-[9px] font-semibold text-slate-400">Trade Price (Out)</p>
                    <p className="text-sm font-extrabold text-teal-600 font-mono mt-1">
                      {formatCurrency(viewingProduct.sellingPrice)}
                    </p>
                  </div>
                  <div className="p-2 border border-slate-200/55 rounded-xl bg-white text-left shadow-sm">
                    <p className="text-[9px] font-semibold text-rose-450 text-rose-500">Net Profit Margin</p>
                    <p className="text-sm font-extrabold text-emerald-600 font-mono mt-1">
                      {formatCurrency(viewingProduct.sellingPrice - viewingProduct.purchasePrice)}
                    </p>
                  </div>
                  <div className="p-2 border border-slate-200/55 rounded-xl bg-white text-left shadow-sm">
                    <p className="text-[9px] font-semibold text-slate-405 text-slate-400">Mark-up Percentage</p>
                    <p className="text-sm font-extrabold text-indigo-600 font-mono mt-1">
                      {viewingProduct.purchasePrice > 0 
                        ? `${(((viewingProduct.sellingPrice - viewingProduct.purchasePrice) / viewingProduct.purchasePrice) * 100).toFixed(1)}%` 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Warehouse Inventory Controls & Status Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 p-4 rounded-xl space-y-1 bg-white shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Onhand Stock status</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-lg font-mono font-extrabold text-slate-800">{viewingProduct.stock} units</span>
                    {getProductStockStatus(viewingProduct) === 'In Stock' && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">Safe</span>
                    )}
                    {getProductStockStatus(viewingProduct) === 'Low Stock' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold">Needs Refill</span>
                    )}
                    {getProductStockStatus(viewingProduct) === 'Out of Stock' && (
                      <span className="px-2 py-0.5 bg-rose-50 text-[#b91c1c] rounded text-[9px] font-bold">Urgent Out</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-100 p-4 rounded-xl space-y-1 bg-white shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Configured Limits</span>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Refill alerts trigger at: <span className="font-mono font-bold text-slate-705 text-slate-700">{viewingProduct.lowStockLimit !== undefined ? viewingProduct.lowStockLimit : 10} units</span>
                  </p>
                  <p className="text-[10px] text-slate-400 italic">Determines Low Stock status filters dynamically.</p>
                </div>
              </div>

              {/* Product Barcode Display Block */}
              {viewingProduct.barcode && (
                <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50 space-y-3 shadow-sm">
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    Product Barcode & Labels
                  </h5>
                  <BarcodeRenderer 
                    barcode={viewingProduct.barcode} 
                    name={viewingProduct.name} 
                    sku={viewingProduct.sku} 
                  />
                </div>
              )}

              {/* Supplier & Logistics Mapping */}
              <div className="border border-slate-100 p-4 rounded-2xl bg-white space-y-2.5 shadow-sm">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Supplier and Procurement Info
                </h5>
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-teal-50 border border-teal-150 rounded-xl text-teal-600">
                    <Icons.Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {viewingProduct.supplierName || 'Unassigned Supplier'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {viewingProduct.supplierName 
                        ? 'Products are regularly fulfilled by this company partner. Edit to remap.'
                        : 'No logistics company is currently linked in Catalog details for this SKU.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Component specifications description */}
              {viewingProduct.description && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h6 className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">
                    Specification Telemetry & Log notes
                  </h6>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/60 leading-relaxed font-sans italic whitespace-pre-wrap">
                    "{viewingProduct.description}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer actions */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setViewingProduct(null);
                  openModal(viewingProduct);
                }}
                className="px-4 py-2.5 bg-white border border-slate-150 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Edit className="w-3.5 h-3.5" />
                <span>Modify Details</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 bg-slate-855 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {barcodeProduct && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-150 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-mono text-[9px] font-bold uppercase tracking-wider">
                  Product Barcode Label
                </span>
                <h3 className="font-display font-extrabold text-[#090d16] text-sm mt-0.5">
                  Print & Save Label
                </h3>
              </div>
              <button 
                onClick={() => setBarcodeProduct(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col items-center justify-center">
              <BarcodeRenderer 
                barcode={barcodeProduct.barcode || ''} 
                name={barcodeProduct.name} 
                sku={barcodeProduct.sku} 
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setBarcodeProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modify Dialog Modal Editor */}
      {isModifyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div id="modify-product-modal" className="bg-white border border-slate-150 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-sm sm:text-base text-[#090d16]" id="modify-product-modal-title">
                {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New Product'}
              </h3>
              <button 
                onClick={closeModal} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Product Name *</label>
                  <input
                    id="form-product-name"
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., iPhone 15 Pro Max Screen Protector"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-bold"
                  />
                </div>

                {/* SKU Code (Auto or manual) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">SKU / Code</label>
                  <input
                    disabled
                    type="text"
                    value={editingProduct ? editingProduct.sku : "(Auto Generated on Save)"}
                    className="w-full bg-slate-100 border border-slate-150 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                {/* Company Maker / Brand */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Brand *</label>
                  <input
                    id="form-product-brand"
                    required
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g., Anker"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Main Category Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Category *</label>
                  <select
                    id="form-product-category-main"
                    required
                    value={formCategoryMain}
                    onChange={(e) => {
                      setFormCategoryMain(e.target.value);
                      const cat = categories.find(c => c.name === e.target.value);
                      if (cat && cat.subcategories.length > 0) {
                        setFormCategorySub(cat.subcategories[0]);
                      } else {
                        setFormCategorySub('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-bold cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Subcategory</label>
                  <select
                    id="form-product-category-sub"
                    value={formCategorySub}
                    onChange={(e) => setFormCategorySub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="">None / Standard</option>
                    {categories.find(c => c.name === formCategoryMain)?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Inbound Buying Cost */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Purchase Price (৳) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      id="form-product-purchase-price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-8 pr-3.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Outbound Retail Value */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Selling Price (৳) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      id="form-product-selling-price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-8 pr-3.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Initial Onhand Stock level */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">{editingProduct ? 'Update Stock Level' : 'Stock Quantity *'}</label>
                  <input
                    id="form-product-stock"
                    required
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-mono font-bold"
                  />
                </div>

                {/* Low Stock Refill Warning Limit */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Low Stock Warning Point *</label>
                  <input
                    id="form-product-lowstock-limit"
                    required
                    type="number"
                    min="0"
                    value={formLowStockLimit}
                    onChange={(e) => setFormLowStockLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-mono font-bold"
                  />
                </div>

                {/* Linked Supplier Selection Dropdown */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Supplier Description *</label>
                  <select
                    id="form-product-supplier-name"
                    required
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-bold cursor-pointer"
                  >
                    <option value="">-- Assign Supplier Partner --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.phone})</option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="Standard Supplier">Standard Local Supplier</option>
                    )}
                  </select>
                  <p className="text-[9px] text-slate-400">Links components to existing active supplier accounts for unified logistics.</p>
                </div>

                {/* Modern Drag & Drop Image/Photo Upload Zone */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Product Image</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!isUploading) {
                        document.getElementById('product-photo-upload-input')?.click();
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[140px] focus-within:ring-2 focus-within:ring-teal-500/20 ${
                      isDragging
                        ? 'border-teal-500 bg-teal-50/20 text-teal-600'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-teal-500/50 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Hidden Native File Input */}
                    <input
                      id="product-photo-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileInputChange}
                      className="sr-only"
                    />

                    {/* Loading State Spinner overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center space-y-2 z-10 p-4">
                        <Icons.Loader className="w-6 h-6 text-teal-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-700">{uploadStatus}</span>
                      </div>
                    )}

                    {/* Main Content inside the drop box */}
                    {!isUploading && (
                      <div className="w-full text-center space-y-3 pointer-events-none">
                        {formImage ? (
                          <div className="flex flex-col sm:flex-row items-center gap-4 text-left pointer-events-auto">
                            {/* Preview Thumbnail */}
                            <div className="relative group shrink-0">
                              <img
                                src={formImage}
                                alt="Product preview"
                                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-sm transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Upload Info Sheet */}
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600 font-bold text-xs">
                                <Icons.CheckCircle className="w-4 h-4 shrink-0" />
                                <span>Image Optimized & Preview ready</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                                Compressed Base64 asset will be saved in your document. Choose another or clear below.
                              </p>
                              
                              <div className="flex items-center justify-center sm:justify-start gap-2">
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Icons.Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>Remove Image</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRetrySelection}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Icons.RefreshCw className="w-3 h-3 text-slate-500" />
                                  <span>Retry Selection</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center py-2">
                            <div className="inline-flex p-3 bg-teal-500/10 text-teal-600 rounded-2xl border border-teal-50">
                              <Icons.Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                Drag & drop product photo, or <span className="text-teal-600 hover:underline">browse</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Supports JPG, PNG, WEBP (Completely offline Base64 compression)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feedback line for error */}
                  {uploadError && (
                    <div className="space-y-2 mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-left">
                      <div className="flex items-start gap-1.5 text-[11px] font-bold text-rose-700 leading-normal">
                        <Icons.XCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <span>{uploadError}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Icons.Trash2 className="w-3 h-3 text-slate-500" />
                          <span>Clear selection</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRetrySelection}
                          className="bg-teal-600 hover:bg-teal-550 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-teal-500/10"
                        >
                          <Icons.RefreshCw className="w-3 h-3 text-white" />
                          <span>Retry selection</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brief description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">Specifications Description</label>
                  <textarea
                    id="form-product-description"
                    rows={2.5}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Write details like technical dimensions, manufacturer numbers, color presets or components spec notes..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium resize-none leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons inside footer */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-colors border border-slate-100 shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-product-form"
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-550 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-150 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-display font-bold text-[#090d16] text-sm sm:text-base flex items-center gap-2">
                  <Icons.Settings className="w-4 h-4 text-teal-600" />
                  <span>Category Registry Manager</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Define corporate product classes, match Lucide key icons, and register device subsections</p>
              </div>
              <button 
                onClick={() => {
                  setIsCategoryManagerOpen(false);
                  setIsCategoryFormOpen(false);
                  setCategoryEditing(null);
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              
              {/* Left Column: List of Categories */}
              <div className="md:w-1/2 flex flex-col space-y-3 border-r border-slate-100 pr-0 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Classes ({categories.length})</span>
                  <button
                    onClick={() => {
                      setCategoryEditing(null);
                      setCatFormName('');
                      setCatFormIcon('FolderPlus');
                      setCatFormSubcategories([]);
                      setIsCategoryFormOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] bg-teal-50 text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <Icons.Plus className="w-3 h-3" />
                    <span>Create Class</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {categories.map(c => (
                    <div 
                      key={c.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        categoryEditing?.id === c.id 
                          ? 'bg-teal-50/40 border-teal-200 shadow-sm'
                          : 'bg-white border-slate-100 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                          <RenderIcon name={c.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{c.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{c.subcategories?.length || 0} Subclasses</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setCategoryEditing(c);
                            setCatFormName(c.name);
                            setCatFormIcon(c.icon);
                            setCatFormSubcategories([...(c.subcategories || [])]);
                            setIsCategoryFormOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg border border-transparent hover:border-slate-150 transition-all cursor-pointer"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to permanently delete category ${c.name}?`)) {
                              await deleteCategory(c.id);
                              if (categoryEditing?.id === c.id) {
                                setIsCategoryFormOpen(false);
                                setCategoryEditing(null);
                              }
                            }
                          }}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Add/Edit Form */}
              <div className="md:w-1/2 flex flex-col justify-between">
                {isCategoryFormOpen ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!catFormName.trim()) return;
                    if (categoryEditing) {
                      await updateCategory(categoryEditing.id, catFormName, catFormIcon, catFormSubcategories);
                    } else {
                      await addCategory(catFormName, catFormIcon, catFormSubcategories);
                    }
                    setIsCategoryFormOpen(false);
                    setCategoryEditing(null);
                  }} className="space-y-4 flex-1 flex flex-col justify-between h-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-slate-700 tracking-tight font-sans border-b border-slate-100 pb-1.5 flex items-center justify-between">
                        <span>{categoryEditing ? 'Edit Spec' : 'New Class'}</span>
                        {categoryEditing && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsCategoryFormOpen(false);
                              setCategoryEditing(null);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </h4>

                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Category Name *</label>
                        <input
                          required
                          type="text"
                          value={catFormName}
                          onChange={(e) => setCatFormName(e.target.value)}
                          placeholder="e.g., Wireless Audio"
                          className="w-full bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-bold"
                        />
                      </div>

                      {/* Icon selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Display Icon</label>
                        <div className="grid grid-cols-6 gap-1.5 p-2 bg-white rounded-xl border border-slate-150 max-h-[110px] overflow-y-auto">
                          {AVAILABLE_ICONS.map(ic => (
                            <button
                              type="button"
                              key={ic}
                              onClick={() => setCatFormIcon(ic)}
                              className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                catFormIcon === ic 
                                  ? 'bg-teal-50 text-teal-600 scale-105 border border-teal-200 font-bold' 
                                  : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <RenderIcon name={ic} className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom subcategory list tags */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Device Subsection Tags</label>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubcategoryText}
                            onChange={(e) => setNewSubcategoryText(e.target.value)}
                            placeholder="Add tag e.g., TWS Earbuds"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSubcategoryText.trim()) {
                                  setCatFormSubcategories([...catFormSubcategories, newSubcategoryText.trim()]);
                                  setNewSubcategoryText('');
                                }
                              }
                            }}
                            className="flex-1 bg-white border border-slate-150 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSubcategoryText.trim()) {
                                setCatFormSubcategories([...catFormSubcategories, newSubcategoryText.trim()]);
                                setNewSubcategoryText('');
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        {/* List of subcategory tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-[80px] overflow-y-auto font-sans font-bold">
                          {catFormSubcategories.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No subclasses. Type above & click add.</span>
                          ) : (
                            catFormSubcategories.map((sub, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-150 border border-slate-200/50 rounded-lg pl-2 pr-1.5 py-1 text-[10px] font-bold text-slate-700">
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => setCatFormSubcategories(catFormSubcategories.filter((_, i) => i !== idx))}
                                  className="p-0.5 hover:text-rose-600 rounded cursor-pointer"
                                >
                                  <Icons.X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-555 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/15 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Save className="w-3.5 h-3.5" />
                      <span>{categoryEditing ? 'Commit Changes' : 'Save Category'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <Icons.Layers className="w-10 h-10 text-slate-300 stroke-1 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No Category Selected</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Click the Edit button next to any category or click Create Class to add a custom group.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic zoom Lightbox Overlay portal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none transition-all duration-300 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl p-3 shadow-2xl border border-slate-200/40 flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay Close Circle */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-all cursor-pointer shadow-xs border border-slate-200"
                title="Dismiss image screen"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* High Clarity Square product image display block */}
            <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={lightboxImage}
                alt="Product Catalog Render"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <p className="text-slate-500 text-[10px] my-2.5 font-mono font-bold tracking-widest flex items-center gap-1">
              <Icons.Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>800x800 HIGH CLARITY WEB-OPTIMIZED PRODUCT PHOTO</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
