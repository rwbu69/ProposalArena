export function chunkText(text: string, maxChunkSize = 800, overlapSize = 200): string[] {
  // Split by double newline to respect paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Build overlap from the end of the current chunk
      const words = currentChunk.split(/\s+/);
      let overlap = '';
      let i = words.length - 1;
      while (i >= 0) {
        const word = words[i];
        if (word === undefined || overlap.length + word.length >= overlapSize) break;
        overlap = word + ' ' + overlap;
        i--;
      }
      currentChunk = overlap.trim() + '\n\n' + p;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + p;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
