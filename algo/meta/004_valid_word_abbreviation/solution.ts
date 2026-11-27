function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

/** Returns true if `abbr` is a valid abbreviation of `word`. */
export function validWordAbbreviation(word: string, abbr: string): boolean {
  let i = 0;
  let j = 0;
  while (i < word.length && j < abbr.length) {
    if (isDigit(abbr[j])) {
      if (abbr[j] === '0') return false; // leading zero or empty replacement
      let skip = 0;
      while (j < abbr.length && isDigit(abbr[j])) {
        skip = skip * 10 + (abbr.charCodeAt(j) - 48);
        j++;
      }
      i += skip;
    } else {
      if (word[i] !== abbr[j]) return false;
      i++;
      j++;
    }
  }
  return i === word.length && j === abbr.length;
}
