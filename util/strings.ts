// Keep newlines
export function softTrim(string: string) {
  return string.replace(/^\x20+|\x20+$/gm, '');
}

export function ucFirst(string: string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
