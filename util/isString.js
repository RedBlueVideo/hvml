function isString( string ) {
  return (
    ( typeof string === 'string' )
    || ( Object.prototype.toString.call( string ) === '[object String]' )
  );
}

module.exports = isString;
