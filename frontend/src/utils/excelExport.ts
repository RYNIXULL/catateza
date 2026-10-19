import ExcelJS from 'exceljs';

interface FinancialReportOptions {
  reportData: {
    revenue?: number;
    expenses?: number;
    cogs?: number;
    grossProfit?: number;
    netProfit?: number;
    transactionCount?: number;
  };
  cashFlowData: Array<{
    id?: string;
    date: string | Date;
    description: string;
    type: 'INCOME' | 'EXPENSE' | string;
    amount: number | string;
    category?: string;
    source?: string;
  }>;
  period: string;
  storeName?: string;
}

const formatPeriodLabel = (period: string) => {
  switch (period) {
    case 'today': return 'Hari Ini';
    case 'week': return 'Minggu Ini';
    case 'month': return 'Bulan Ini';
    case 'year': return 'Tahun Ini';
    case 'all': return 'Semua Periode';
    default: return period;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export const exportFinancialReportExcel = async (options: FinancialReportOptions) => {
  const { reportData, cashFlowData, period, storeName = 'Semua Cabang' } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Catat Eza POS';
  workbook.lastModifiedBy = 'Catat Eza POS';
  workbook.created = new Date();
  workbook.modified = new Date();

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const revenue = Number(reportData.revenue) || 0;
  const expenses = Number(reportData.expenses) || 0;
  const grossProfit = reportData.grossProfit !== undefined ? Number(reportData.grossProfit) : revenue;
  const netProfit = reportData.netProfit !== undefined ? Number(reportData.netProfit) : (grossProfit - expenses);
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

  // ==========================================
  // SHEET 1: RINGKASAN & LABA RUGI
  // ==========================================
  const wsSummary = workbook.addWorksheet('Ringkasan & Laba Rugi', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF1E3A8A' } }
  });

  // Title Banner
  wsSummary.mergeCells('A1:E1');
  const title1 = wsSummary.getCell('A1');
  title1.value = 'CATAT EZA POS - LAPORAN KEUANGAN';
  title1.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(1).height = 36;

  // Subtitle Banner
  wsSummary.mergeCells('A2:E2');
  const sub1 = wsSummary.getCell('A2');
  sub1.value = `Ringkasan Laba Rugi & Indikator Finansial Bisnis`;
  sub1.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
  sub1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sub1.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(2).height = 20;

  // Metadata block
  wsSummary.getCell('A4').value = 'Cabang Toko';
  wsSummary.getCell('B4').value = `: ${storeName}`;
  wsSummary.getCell('A5').value = 'Periode Laporan';
  wsSummary.getCell('B5').value = `: ${formatPeriodLabel(period)}`;
  wsSummary.getCell('A6').value = 'Tanggal Dicetak';
  wsSummary.getCell('B6').value = `: ${printDateStr}`;

  ['A4', 'A5', 'A6'].forEach(cellId => {
    wsSummary.getCell(cellId).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
  });
  ['B4', 'B5', 'B6'].forEach(cellId => {
    wsSummary.getCell(cellId).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0F172A' } };
  });

  // KPI Highlights Box
  wsSummary.mergeCells('A8:B8');
  const kpiHeader = wsSummary.getCell('A8');
  kpiHeader.value = 'IKHTISAR KINERJA FINANSIAL';
  kpiHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  kpiHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsSummary.getRow(8).height = 25;

  const kpiItems = [
    { label: 'Total Pendapatan (Penjualan)', value: revenue, isCurrency: true, color: 'FF15803D' },
    { label: 'Total Pengeluaran (Beban Operasional)', value: expenses, isCurrency: true, color: 'FFB91C1C' },
    { label: 'Laba Kotor (Gross Profit)', value: grossProfit, isCurrency: true, color: 'FF0F172A' },
    { label: 'Laba Bersih (Net Profit)', value: netProfit, isCurrency: true, bold: true, color: netProfit >= 0 ? 'FF15803D' : 'FFB91C1C' },
    { label: 'Margin Laba Bersih', value: `${profitMargin}%`, isCurrency: false, color: 'FF4338CA' }
  ];

  let curRow = 9;
  kpiItems.forEach(item => {
    wsSummary.getCell(`A${curRow}`).value = item.label;
    wsSummary.getCell(`A${curRow}`).font = { name: 'Segoe UI', size: 10, bold: item.bold };
    wsSummary.getCell(`A${curRow}`).border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    const valCell = wsSummary.getCell(`B${curRow}`);
    valCell.value = item.value;
    valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: item.color } };
    valCell.alignment = { horizontal: 'right' };
    if (item.isCurrency) {
      valCell.numFmt = '"Rp"#,##0';
    }
    valCell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
    wsSummary.getRow(curRow).height = 22;
    curRow++;
  });

  // Detailed Statement of Profit and Loss
  curRow += 2;
  wsSummary.mergeCells(`A${curRow}:D${curRow}`);
  const plHeader = wsSummary.getCell(`A${curRow}`);
  plHeader.value = 'RINCIAN STRUKTUR LABA RUGI';
  plHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  plHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  plHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsSummary.getRow(curRow).height = 25;

  curRow++;
  const tableHeaders = ['Keterangan Pos Akun', 'Kode / Tipe', 'Catatan', 'Nominal (Rp)'];
  tableHeaders.forEach((th, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = wsSummary.getCell(`${colLetter}${curRow}`);
    cell.value = th;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 3 ? 'right' : 'left', indent: idx === 0 ? 1 : 0 };
  });
  wsSummary.getRow(curRow).height = 24;

  const plRows = [
    { title: '1. PENDAPATAN OPERASIONAL', type: 'REVENUE', note: 'Hasil akumulasi transaksi POS', amount: revenue, isHeader: true },
    { title: '   - Penjualan Kasir & Produk', type: 'POS_SALES', note: 'Kas masuk dari kasir', amount: revenue, isHeader: false },
    { title: '2. HARGA POKOK PENJUALAN (HPP)', type: 'COGS', note: 'Estimasi nilai modal persediaan', amount: (revenue - grossProfit), isHeader: true },
    { title: '   - Laba Kotor Usaha', type: 'GROSS_PROFIT', note: 'Pendapatan dikurangi HPP', amount: grossProfit, isHeader: true, isHighlight: true },
    { title: '3. BEBAN OPERASIONAL & PENGELUARAN KAS', type: 'EXPENSE', note: 'Beban operasional toko', amount: expenses, isHeader: true },
    { title: '   - Pengeluaran Kas Operasional', type: 'CASH_OUT', note: 'Biaya sewa, gaji, belanja modal, dll', amount: expenses, isHeader: false },
    { title: '4. LABA BERSIH (NET PROFIT)', type: 'NET_INCOME', note: 'Laba akhir sebelum pajak', amount: netProfit, isHeader: true, isTotal: true },
  ];

  plRows.forEach(item => {
    curRow++;
    const row = wsSummary.getRow(curRow);
    row.height = 22;

    const cellA = wsSummary.getCell(`A${curRow}`);
    cellA.value = item.title;
    cellA.font = { 
      name: 'Segoe UI', 
      size: item.isTotal ? 11 : 10, 
      bold: item.isHeader,
      color: item.isTotal ? (netProfit >= 0 ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' }) : { argb: 'FF0F172A' }
    };

    const cellB = wsSummary.getCell(`B${curRow}`);
    cellB.value = item.type;
    cellB.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };

    const cellC = wsSummary.getCell(`C${curRow}`);
    cellC.value = item.note;
    cellC.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };

    const cellD = wsSummary.getCell(`D${curRow}`);
    cellD.value = item.amount;
    cellD.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0;"Rp"0';
    cellD.font = { 
      name: 'Segoe UI', 
      size: item.isTotal ? 11 : 10, 
      bold: item.isHeader,
      color: item.isTotal ? (netProfit >= 0 ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' }) : { argb: 'FF0F172A' }
    };
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };

    ['A', 'B', 'C', 'D'].forEach(c => {
      const cell = wsSummary.getCell(`${c}${curRow}`);
      if (item.isTotal) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF0F172A' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } }
        };
      } else if (item.isHighlight) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      } else {
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
        };
      }
    });
  });

  // Column widths auto-adjustment
  wsSummary.getColumn('A').width = 42;
  wsSummary.getColumn('B').width = 18;
  wsSummary.getColumn('C').width = 38;
  wsSummary.getColumn('D').width = 25;
  wsSummary.getColumn('E').width = 8;

  // ==========================================
  // SHEET 2: BUKU ARUS KAS (DETAIL TRANSAKSI)
  // ==========================================
  const wsCashflow = workbook.addWorksheet('Buku Arus Kas', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF059669' } }
  });

  // Title Banner
  wsCashflow.mergeCells('A1:G1');
  const title2 = wsCashflow.getCell('A1');
  title2.value = 'BUKU MUTASI ARUS KAS & TRANSAKSI';
  title2.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsCashflow.getRow(1).height = 36;

  // Subtitle
  wsCashflow.mergeCells('A2:G2');
  const sub2 = wsCashflow.getCell('A2');
  sub2.value = `Cabang: ${storeName} | Periode: ${formatPeriodLabel(period)} | Total Catatan: ${cashFlowData.length} Transaksi`;
  sub2.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFECFDF5' } };
  sub2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  sub2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsCashflow.getRow(2).height = 20;

  // Headers
  const cfHeaders = ['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori / Sumber', 'Jenis', 'Pemasukan (Rp)', 'Pengeluaran (Rp)'];
  const cfColWidths = [6, 15, 42, 22, 16, 22, 22];

  let cfRow = 4;
  cfHeaders.forEach((th, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = wsCashflow.getCell(`${colLetter}${cfRow}`);
    cell.value = th;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: idx === 0 || idx === 1 || idx === 4 ? 'center' : (idx >= 5 ? 'right' : 'left'),
      indent: idx === 2 || idx === 3 ? 1 : 0
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } }
    };
  });
  wsCashflow.getRow(cfRow).height = 26;

  let totalIncome = 0;
  let totalExpense = 0;

  if (cashFlowData.length === 0) {
    cfRow++;
    wsCashflow.mergeCells(`A${cfRow}:G${cfRow}`);
    const emptyCell = wsCashflow.getCell(`A${cfRow}`);
    emptyCell.value = 'Belum ada data transaksi kas pada periode ini.';
    emptyCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsCashflow.getRow(cfRow).height = 32;
  } else {
    cashFlowData.forEach((item, index) => {
      cfRow++;
      const isEven = index % 2 === 0;
      const row = wsCashflow.getRow(cfRow);
      row.height = 22;

      const dateStr = item.date ? new Date(item.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-';

      const isIncome = item.type === 'INCOME';
      const numAmount = Math.abs(Number(item.amount) || 0);

      if (isIncome) {
        totalIncome += numAmount;
      } else {
        totalExpense += numAmount;
      }

      // No
      const cellNo = wsCashflow.getCell(`A${cfRow}`);
      cellNo.value = index + 1;
      cellNo.alignment = { horizontal: 'center', vertical: 'middle' };

      // Tanggal
      const cellDate = wsCashflow.getCell(`B${cfRow}`);
      cellDate.value = dateStr;
      cellDate.alignment = { horizontal: 'center', vertical: 'middle' };

      // Keterangan
      const cellDesc = wsCashflow.getCell(`C${cfRow}`);
      cellDesc.value = item.description || '-';
      cellDesc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Kategori
      const cellCat = wsCashflow.getCell(`D${cfRow}`);
      cellCat.value = item.category || item.source || 'Operasional';
      cellCat.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Jenis
      const cellType = wsCashflow.getCell(`E${cfRow}`);
      cellType.value = isIncome ? 'Pemasukan' : 'Pengeluaran';
      cellType.font = { 
        name: 'Segoe UI', 
        size: 9, 
        bold: true, 
        color: isIncome ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' } 
      };
      cellType.alignment = { horizontal: 'center', vertical: 'middle' };

      // Debit (Pemasukan)
      const cellDebit = wsCashflow.getCell(`F${cfRow}`);
      cellDebit.value = isIncome ? numAmount : 0;
      cellDebit.numFmt = '"Rp"#,##0;;"-"';
      cellDebit.font = { 
        name: 'Segoe UI', 
        size: 10, 
        color: isIncome ? { argb: 'FF15803D' } : { argb: 'FF94A3B8' } 
      };
      cellDebit.alignment = { horizontal: 'right', vertical: 'middle' };

      // Kredit (Pengeluaran)
      const cellCredit = wsCashflow.getCell(`G${cfRow}`);
      cellCredit.value = !isIncome ? numAmount : 0;
      cellCredit.numFmt = '"Rp"#,##0;;"-"';
      cellCredit.font = { 
        name: 'Segoe UI', 
        size: 10, 
        color: !isIncome ? { argb: 'FFB91C1C' } : { argb: 'FF94A3B8' } 
      };
      cellCredit.alignment = { horizontal: 'right', vertical: 'middle' };

      // Borders and alternating background
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(c => {
        const cell = wsCashflow.getCell(`${c}${cfRow}`);
        if (!cell.font) cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
        if (!isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
        };
      });
    });

    // Summary Totals Row
    cfRow++;
    const totalRow = wsCashflow.getRow(cfRow);
    totalRow.height = 26;

    wsCashflow.mergeCells(`A${cfRow}:E${cfRow}`);
    const totalLabel = wsCashflow.getCell(`A${cfRow}`);
    totalLabel.value = 'TOTAL MUTASI KAS';
    totalLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    totalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

    const totalDebitCell = wsCashflow.getCell(`F${cfRow}`);
    totalDebitCell.value = totalIncome;
    totalDebitCell.numFmt = '"Rp"#,##0';
    totalDebitCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
    totalDebitCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalCreditCell = wsCashflow.getCell(`G${cfRow}`);
    totalCreditCell.value = totalExpense;
    totalCreditCell.numFmt = '"Rp"#,##0';
    totalCreditCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
    totalCreditCell.alignment = { horizontal: 'right', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(c => {
      const cell = wsCashflow.getCell(`${c}${cfRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
    });

    // Net Cash Flow Row
    cfRow++;
    const netRow = wsCashflow.getRow(cfRow);
    netRow.height = 26;

    wsCashflow.mergeCells(`A${cfRow}:E${cfRow}`);
    const netLabel = wsCashflow.getCell(`A${cfRow}`);
    netLabel.value = 'ARUS KAS BERSIH (SURPLUS / DEFISIT)';
    netLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    netLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

    const netAmount = totalIncome - totalExpense;
    wsCashflow.mergeCells(`F${cfRow}:G${cfRow}`);
    const netCell = wsCashflow.getCell(`F${cfRow}`);
    netCell.value = netAmount;
    netCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0;"Rp"0';
    netCell.font = { 
      name: 'Segoe UI', 
      size: 11, 
      bold: true, 
      color: netAmount >= 0 ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' } 
    };
    netCell.alignment = { horizontal: 'right', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(c => {
      const cell = wsCashflow.getCell(`${c}${cfRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } }
      };
    });
  }

  // Set column widths
  cfHeaders.forEach((_, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    wsCashflow.getColumn(colLetter).width = cfColWidths[idx];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  await downloadWorkbook(workbook, `Laporan_Keuangan_${cleanStoreName}_${timestamp}.xlsx`);
};

export const exportProductTemplateExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Catat Eza POS';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Template Produk', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF059669' } }
  });

  // Title Banner
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = 'CATAT EZA POS - TEMPLATE IMPORT DATA PRODUK';
  title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  // Instructions
  ws.mergeCells('A2:F2');
  const guide = ws.getCell('A2');
  guide.value = 'Petunjuk: Kolom bertanda (*) WAJIB diisi. SKU harus unik. Barcode boleh kosong. Harga dan Stok hanya angka.';
  guide.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF065F46' } };
  guide.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  guide.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  // Headers
  const headers = ['SKU *', 'Barcode', 'Nama Produk *', 'Harga Beli (Rp) *', 'Harga Jual (Rp) *', 'Stok Awal *'];
  const colWidths = [18, 20, 36, 20, 20, 16];

  let r = 4;
  headers.forEach((th, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = ws.getCell(`${colLetter}${r}`);
    cell.value = th;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: idx >= 3 ? 'right' : (idx === 0 || idx === 1 ? 'center' : 'left'),
      indent: idx === 2 ? 1 : 0
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF065F46' } },
      bottom: { style: 'medium', color: { argb: 'FF065F46' } }
    };
  });
  ws.getRow(r).height = 26;

  // Realistic sample rows
  const sampleData = [
    { sku: 'PRD-1001', barcode: '8999999123456', name: 'Kopi Susu Aren 250ml', buy: 8000, sell: 15000, stock: 50 },
    { sku: 'PRD-1002', barcode: '', name: 'Roti Bakar Coklat Keju', buy: 10000, sell: 18000, stock: 30 },
    { sku: 'PRD-1003', barcode: '8992775123456', name: 'Teh Botol Sosro 450ml', buy: 3500, sell: 5000, stock: 100 },
    { sku: 'PRD-1004', barcode: '', name: 'Air Mineral 600ml', buy: 2000, sell: 3500, stock: 75 },
    { sku: 'PRD-1005', barcode: '8998866123456', name: 'Snack Keripik Singkong 150g', buy: 6000, sell: 10000, stock: 40 },
  ];

  sampleData.forEach((item, index) => {
    r++;
    const row = ws.getRow(r);
    row.height = 22;
    const isEven = index % 2 === 0;

    const cellA = ws.getCell(`A${r}`);
    cellA.value = item.sku;
    cellA.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellB = ws.getCell(`B${r}`);
    cellB.value = item.barcode;
    cellB.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellC = ws.getCell(`C${r}`);
    cellC.value = item.name;
    cellC.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const cellD = ws.getCell(`D${r}`);
    cellD.value = item.buy;
    cellD.numFmt = '#,##0';
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellE = ws.getCell(`E${r}`);
    cellE.value = item.sell;
    cellE.numFmt = '#,##0';
    cellE.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellF = ws.getCell(`F${r}`);
    cellF.value = item.stock;
    cellF.numFmt = '#,##0';
    cellF.alignment = { horizontal: 'right', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => {
      const cell = ws.getCell(`${c}${r}`);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      if (!isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };
    });
  });

  // Set column widths
  headers.forEach((_, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    ws.getColumn(colLetter).width = colWidths[idx];
  });

  await downloadWorkbook(workbook, 'Template_Import_Produk_CatatEza.xlsx');
};

export const exportInventoryExcel = async (products: any[], storeName: string = 'Cabang Utama') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Catat Eza POS';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Inventaris Produk', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF2563EB' } }
  });

  // Title Banner
  ws.mergeCells('A1:J1');
  const title = ws.getCell('A1');
  title.value = 'CATAT EZA POS - LAPORAN INVENTARIS & STOK';
  title.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 36;

  // Subtitle
  ws.mergeCells('A2:J2');
  const sub = ws.getCell('A2');
  sub.value = `Cabang: ${storeName} | Total Produk: ${products.length} Item | Dicetak: ${new Date().toLocaleDateString('id-ID')}`;
  sub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFDBEAFE' } };
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  // Headers
  const headers = [
    'No', 
    'SKU', 
    'Barcode', 
    'Nama Produk', 
    'Kategori', 
    'Harga Beli (Rp)', 
    'Harga Jual (Rp)', 
    'Margin (Rp)', 
    'Stok', 
    'Total Aset Stok (Rp)'
  ];
  const colWidths = [6, 16, 18, 32, 18, 18, 18, 16, 10, 22];

  let r = 4;
  headers.forEach((th, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = ws.getCell(`${colLetter}${r}`);
    cell.value = th;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: idx >= 5 ? 'right' : (idx === 0 || idx === 1 || idx === 2 ? 'center' : 'left'),
      indent: idx === 3 || idx === 4 ? 1 : 0
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } }
    };
  });
  ws.getRow(r).height = 26;

  let totalAssetValue = 0;
  let totalStockCount = 0;

  products.forEach((prod, idx) => {
    r++;
    const isEven = idx % 2 === 0;
    const row = ws.getRow(r);
    row.height = 22;

    const buyPrice = Number(prod.buyPrice) || 0;
    const sellPrice = Number(prod.sellPrice) || 0;
    const stockQty = prod.stocks?.reduce((acc: number, s: any) => acc + (s.quantity || 0), 0) || 0;
    const itemTotalAsset = buyPrice * stockQty;
    const margin = sellPrice - buyPrice;

    totalStockCount += stockQty;
    totalAssetValue += itemTotalAsset;

    ws.getCell(`A${r}`).value = idx + 1;
    ws.getCell(`A${r}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getCell(`B${r}`).value = prod.sku || '-';
    ws.getCell(`B${r}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getCell(`C${r}`).value = prod.barcode || '-';
    ws.getCell(`C${r}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getCell(`D${r}`).value = prod.name || '-';
    ws.getCell(`D${r}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    ws.getCell(`E${r}`).value = prod.category?.name || 'Umum';
    ws.getCell(`E${r}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const cellBuy = ws.getCell(`F${r}`);
    cellBuy.value = buyPrice;
    cellBuy.numFmt = '"Rp"#,##0';
    cellBuy.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellSell = ws.getCell(`G${r}`);
    cellSell.value = sellPrice;
    cellSell.numFmt = '"Rp"#,##0';
    cellSell.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellMargin = ws.getCell(`H${r}`);
    cellMargin.value = margin;
    cellMargin.numFmt = '"Rp"#,##0';
    cellMargin.font = { name: 'Segoe UI', size: 10, color: margin >= 0 ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' } };
    cellMargin.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellStock = ws.getCell(`I${r}`);
    cellStock.value = stockQty;
    cellStock.numFmt = '#,##0';
    cellStock.font = { name: 'Segoe UI', size: 10, bold: true, color: stockQty <= 5 ? { argb: 'FFB91C1C' } : { argb: 'FF0F172A' } };
    cellStock.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellAsset = ws.getCell(`J${r}`);
    cellAsset.value = itemTotalAsset;
    cellAsset.numFmt = '"Rp"#,##0';
    cellAsset.alignment = { horizontal: 'right', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(c => {
      const cell = ws.getCell(`${c}${r}`);
      if (!cell.font) cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      if (!isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };
    });
  });

  // Summary Row
  r++;
  ws.mergeCells(`A${r}:H${r}`);
  const summaryLabel = ws.getCell(`A${r}`);
  summaryLabel.value = 'TOTAL KESELURUHAN INVENTARIS';
  summaryLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  summaryLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

  const totalStockCell = ws.getCell(`I${r}`);
  totalStockCell.value = totalStockCount;
  totalStockCell.numFmt = '#,##0';
  totalStockCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  totalStockCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalAssetCell = ws.getCell(`J${r}`);
  totalAssetCell.value = totalAssetValue;
  totalAssetCell.numFmt = '"Rp"#,##0';
  totalAssetCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  totalAssetCell.alignment = { horizontal: 'right', vertical: 'middle' };

  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(c => {
    const cell = ws.getCell(`${c}${r}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } }
    };
  });

  headers.forEach((_, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    ws.getColumn(colLetter).width = colWidths[idx];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  await downloadWorkbook(workbook, `Inventaris_Produk_${cleanStoreName}_${timestamp}.xlsx`);
};
