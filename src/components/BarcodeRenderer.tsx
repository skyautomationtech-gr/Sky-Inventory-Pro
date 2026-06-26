import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Download, Printer, FileDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BarcodeRendererProps {
  barcode: string;
  name: string;
  sku: string;
  showActions?: boolean;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  barcode,
  name,
  sku,
  showActions = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addActivityLog, currentUser } = useApp();

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        JsBarcode(canvasRef.current, barcode, {
          format: 'CODE128',
          width: 2,
          height: 70,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 4,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Error rendering barcode with JsBarcode:', err);
      }
    }
  }, [barcode]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Barcode_${sku}_${barcode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (addActivityLog && currentUser) {
      addActivityLog('barcode_download', currentUser.email, `Downloaded barcode PNG for SKU: ${sku} / Barcode: ${barcode}`);
    }
  };

  const downloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png');
      // Create small label PDF size
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 50], // custom small label size 80mm x 50mm
      });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      // Clean display of product name at the top
      const shortName = name.length > 28 ? name.substring(0, 25) + '...' : name;
      pdf.text(shortName, 40, 8, { align: 'center' });

      // Add the barcode image (centered)
      pdf.addImage(imgData, 'PNG', 5, 10, 70, 32);

      // SKU details at the bottom
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7);
      pdf.text(`SKU: ${sku}`, 40, 45, { align: 'center' });

      pdf.save(`Barcode_${sku}_${barcode}.pdf`);

      if (addActivityLog && currentUser) {
        addActivityLog('barcode_download', currentUser.email, `Downloaded barcode PDF for SKU: ${sku} / Barcode: ${barcode}`);
      }
    } catch (err) {
      console.error('Failed to export barcode PDF:', err);
    }
  };

  const printBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imgData = canvas.toDataURL('image/png');
    
    // Create temporary hidden iframe to avoid iframe sandbox / window.open restrictions
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <style>
              @page { size: auto; margin: 10mm; }
              body {
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
                text-align: center;
              }
              .container {
                border: 1px dashed #ccc;
                padding: 15px;
                border-radius: 8px;
                display: inline-block;
              }
              img {
                max-width: 100%;
                height: auto;
                margin: 10px 0;
              }
              .title {
                font-size: 14px;
                font-weight: bold;
                color: #111827;
              }
              .subtitle {
                font-size: 11px;
                color: #4b5563;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">${name}</div>
              <img src="${imgData}" />
              <div class="subtitle">SKU: ${sku} | Barcode: ${barcode}</div>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }

    if (addActivityLog && currentUser) {
      addActivityLog('barcode_print', currentUser.email, `Printed barcode for SKU: ${sku} / Barcode: ${barcode}`);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm max-w-sm w-full mx-auto">
      <div className="text-center w-full mb-2">
        <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Smart Barcode Label</span>
        <h4 className="font-semibold text-slate-800 text-sm truncate max-w-xs mt-0.5" title={name}>{name}</h4>
        <span className="inline-block px-2 py-0.5 mt-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-mono text-slate-500 font-bold">
          SKU: {sku}
        </span>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-50 flex items-center justify-center">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>

      {showActions && (
        <div className="grid grid-cols-3 gap-2 mt-4 w-full">
          <button
            type="button"
            onClick={downloadPNG}
            className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 rounded-xl transition-all font-semibold text-[10px] cursor-pointer"
            title="Download barcode as PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PNG</span>
          </button>
          <button
            type="button"
            onClick={downloadPDF}
            className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 text-slate-600 hover:text-emerald-600 rounded-xl transition-all font-semibold text-[10px] cursor-pointer"
            title="Download barcode label as PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Save PDF</span>
          </button>
          <button
            type="button"
            onClick={printBarcode}
            className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-600 hover:text-rose-600 rounded-xl transition-all font-semibold text-[10px] cursor-pointer"
            title="Print barcode label"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );
};
