import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (ext === 'txt') {
    return file.text();
  }
  
  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    
    return text;
  }
  
  throw new Error(`Unsupported file type: .${ext}`);
}

export function detectLanguage(text: string): 'en' | 'id' {
  // A very simple heuristic using common stopwords
  const enWords = ['the', 'is', 'in', 'and', 'to', 'of', 'a', 'for', 'this', 'that', 'with'];
  const idWords = ['yang', 'di', 'dan', 'ini', 'untuk', 'dari', 'dalam', 'dengan', 'pada', 'adalah'];
  
  const words = text.toLowerCase().split(/\W+/);
  let enCount = 0;
  let idCount = 0;
  
  for (const word of words) {
    if (enWords.includes(word)) enCount++;
    if (idWords.includes(word)) idCount++;
  }
  
  return idCount > enCount ? 'id' : 'en';
}
