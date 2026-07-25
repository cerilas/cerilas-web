export function exportToExcel(data, columns, filename) {
  const escapeXml = (value) => String(value ?? '')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || code >= 32;
    })
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const columnXml = columns.map((column) => (
    `<Column ss:AutoFitWidth="0" ss:Width="${column.width || 140}"/>`
  )).join('');
  const headerXml = columns.map((column) => (
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`
  )).join('');
  const rowsXml = data.map((row, index) => {
    const cells = columns.map((column) => {
      const value = column.key ? row[column.key] : column.render(row);
      return `<Cell ss:StyleID="${index % 2 === 0 ? 'Body' : 'BodyAlt'}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Aptos" ss:Size="10"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Aptos" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Body">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Aptos" ss:Size="10"/>
  </Style>
  <Style ss:ID="BodyAlt">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Aptos" ss:Size="10"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Veriler">
  <Table>
   ${columnXml}
   <Row ss:Height="24">${headerXml}</Row>
   ${rowsXml}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob(['\uFEFF', workbookXml], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
