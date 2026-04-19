export function exportToExcel(data, columns, filename) {
  const header = columns.map((c) => c.label).join('\t');
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = c.key ? row[c.key] : c.render(row);
      return String(val ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t')
  );
  const tsv = [header, ...rows].join('\n');
  // BOM for Excel to correctly read UTF-8
  const blob = new Blob(['\uFEFF' + tsv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
