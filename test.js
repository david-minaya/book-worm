const { PDFExtract } = require('pdf.js-extract');

(async () => {

  const pdfExtract = new PDFExtract();
  
  const path = 'C:\\Users\\davidminaya\\Documents\\PDF\\Curriculum David Minaya 2 2024.pdf';
  
  const data = await pdfExtract.extract(path);

  let text = '';

  for (const page of data.pages) {
    const lines = PDFExtract.utils.pageToLines(page, 2);
    const rows = PDFExtract.utils.extractTextRows(lines);
    text += rows.map((row) => row.join('')).join('') + '\n\n';
  }

  console.log(text);
})();