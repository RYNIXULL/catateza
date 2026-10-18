const XLSX = require('xlsx');

const wb = XLSX.readFile('d:/pak ipin/Template-Laporan-Keuangan-Sederhana-untuk-UMKM.xlsx');

const targetSheets = [
  "Jurnal UMUM",
  "Posting Buku Besar",
  "Neraca Saldo",
];

for (const sheetName of targetSheets) {
  const ws = wb.Sheets[sheetName];
  if (!ws) { console.log(`\n=== ${sheetName} - NOT FOUND ===\n`); continue; }
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\n=== ${sheetName} ===`);
  for (let i = 0; i < Math.min(35, json.length); i++) {
    const row = json[i];
    const nonEmpty = row.filter(c => c !== '');
    if (nonEmpty.length > 0) {
      console.log(`Row ${i}: ${JSON.stringify(row)}`);
    }
  }
}
