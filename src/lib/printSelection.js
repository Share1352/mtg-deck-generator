export function preferOriginalEnglishPaper(printings) {
  return [...printings].filter((c) => !c.digital && c.lang === 'en').sort((a, b) => new Date(a.released_at || '9999') - new Date(b.released_at || '9999'))[0] || printings[0];
}
