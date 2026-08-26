export const parseKannadaVoiceQuery = (queryText) => {
  if (!queryText) return { keyword: '', quantity: 1 };

  const text = queryText.toLowerCase();
  let quantity = 1;
  let keyword = text;

  // Quantity extraction
  if (text.includes('2') || text.includes('yeredu')) quantity = 2;
  if (text.includes('3') || text.includes('mooru')) quantity = 3;
  if (text.includes('5') || text.includes('aidu')) quantity = 5;

  // Kannada -> Product mapping
  if (text.includes('tomato')) keyword = 'tomato';
  else if (text.includes('alugadde') || text.includes('potato')) keyword = 'potato';
  else if (text.includes('erulli') || text.includes('onion')) keyword = 'onion';
  else if (text.includes('mensinakayi') || text.includes('chilli')) keyword = 'green chilli';
  else if (text.includes('haalu') || text.includes('milk')) keyword = 'milk';
  else if (text.includes('akki') || text.includes('rice')) keyword = 'rice';

  return {
    rawQuery: queryText,
    parsedKeyword: keyword,
    parsedQuantity: quantity,
    detectedLanguage: text.match(/beku|yeredu|alugadde|erulli|mensinakayi|haalu|akki/) ? 'Kannada' : 'English'
  };
};
