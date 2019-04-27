// Keep newlines
function softTrim( string ) {
  // https://stackoverflow.com/a/8927965/214325
  return string.replace( /^\x20+|\x20+$/gm, '' );
}

function ucFirst( string ) {
  return `${string.charAt( 0 ).toUpperCase()}${string.slice( 1 )}`;
}

export {
  softTrim,
  ucFirst,
};
