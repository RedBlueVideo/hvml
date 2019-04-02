// Keep newlines
function softTrim( string ) {
  // https://stackoverflow.com/a/8927965/214325
  return string.replace( /^\x20+|\x20+$/gm, '' );
}

module.exports = {
  softTrim,
};
