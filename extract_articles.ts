import fs from 'fs';

const content = fs.readFileSync('downloaded_js.js', 'utf-8');

// Let's print the text around index 350000 to index 380000 by slicing it.
// We can find where the articles structure starts. Let's search for some characteristic keywords like "Obosi" or "Lieutenant General" around there.
const obosiIndex = content.indexOf("Obosi");
console.log("Obosi Index:", obosiIndex);

if (obosiIndex !== -1) {
  // Let's print 5000 characters before and 30000 characters after
  const sliceStart = Math.max(0, obosiIndex - 8000);
  const sliceEnd = Math.min(content.length, obosiIndex + 25000);
  console.log("Slicing from", sliceStart, "to", sliceEnd);
  
  fs.writeFileSync('extracted_chunk.txt', content.substring(sliceStart, sliceEnd));
  console.log("Written extracted chunk to extracted_chunk.txt");
}
