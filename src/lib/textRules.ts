// What people may type into free-text fields. Letters from any language are allowed (so Ɛ, Ɔ, Ŋ and accented
// letters used in Twi, Ewe, Ga, French… all work), plus numbers and everyday punctuation. Emojis, angle brackets,
// braces and control characters are dropped as the person types. The API applies the same rules.

const LINE_DISALLOWED = /[^\p{L}\p{M}\p{N} .,'’"“”&\-–—/()!?:;+#%@₵]/gu;
const BLOCK_DISALLOWED = /[^\p{L}\p{M}\p{N} \n.,'’"“”&\-–—/()!?:;+#%@₵•*]/gu;
const KEYWORD_DISALLOWED = /[^\p{L}\p{M}\p{N} -]/gu;

/** One line of text (titles, names, addresses): allowed characters only, no double spaces, capped length. */
export const cleanLine = (v: string, max: number) =>
  v.replace(LINE_DISALLOWED, '').replace(/ {2,}/g, ' ').replace(/^ /, '').slice(0, max);

/** A paragraph (descriptions): like cleanLine but keeps line breaks, at most one blank line in a row. */
export const cleanBlock = (v: string, max: number) =>
  v
    .replace(/\r\n?/g, '\n')
    .replace(BLOCK_DISALLOWED, '')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/, '')
    .slice(0, max);

/** A comma-separated keyword list: letters, numbers, spaces and hyphens inside each keyword. */
export const cleanKeywords = (v: string, maxEach: number) =>
  v
    .split(',')
    // keep the single space people type after a comma; only the very first keyword can't start with one
    .map((part, i) =>
      part
        .replace(KEYWORD_DISALLOWED, '')
        .replace(/ {2,}/g, ' ')
        .replace(i === 0 ? /^ / : /^ {2,}/, i === 0 ? '' : ' ')
        .slice(0, maxEach + (i === 0 ? 0 : 1)),
    )
    .join(',');

/** A money amount while typing: digits and one decimal point, at most `decimals` places and `maxDigits` before it. */
export const cleanMoney = (v: string, maxDigits = 6, decimals = 2) => {
  const [whole = '', ...rest] = v.replace(/[^\d.]/g, '').split('.');
  const intPart = whole.replace(/^0+(?=\d)/, '').slice(0, maxDigits);
  return rest.length ? `${intPart}.${rest.join('').slice(0, decimals)}` : intPart;
};

/** A whole number while typing: digits only, capped length. */
export const cleanInt = (v: string, maxDigits = 4) => v.replace(/\D/g, '').slice(0, maxDigits);

/** Trimmed length, for "at least N characters" checks. */
export const len = (v: string) => v.trim().length;
