const response = await fetch('https://api.scryfall.com/sets');
if (!response.ok) throw new Error(`Scryfall sets endpoint failed: ${response.status}`);
const { data } = await response.json();
const codes = new Set(data.map((set) => set.code));
for (const code of ['ltr', 'fin', 'afr', 'bot', '40k', 'who', 'pip']) {
  console.log(`${code}: ${codes.has(code) ? 'known' : 'not currently returned'}`);
}
