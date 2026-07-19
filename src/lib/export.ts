

// Simple browser-side exporters — no external deps.
// CSV opens directly in Excel; PDF/print uses the browser print dialog.

export function exportCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
  headers.join(','),
  ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].
  join('\n');
  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Print a specific DOM element (used for receipts / invoices / PDF export)
export function printElement(elementId: string, title = 'Document'): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).
  map((n) => n.outerHTML).
  join('\n');
  win.document.write(`<!doctype html><html><head><title>${title}</title>${styles}
    <style>body{background:#fff;margin:0;padding:24px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}</style>
    </head><body>${el.outerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}