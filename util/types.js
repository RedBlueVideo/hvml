function isNumber( number ) {
  return ( typeof number === 'number' );
}

function isPlainObject( object ) {
  return ( Object.prototype.toString.call( object ) === '[object Object]' );
}

function isString( string ) {
  return (
    ( typeof string === 'string' )
    || ( Object.prototype.toString.call( string ) === '[object String]' )
  );
}

function isUndefined( object ) {
  return ( typeof object === 'undefined' );
}

module.exports = {
  isNumber,
  isPlainObject,
  isString,
  isUndefined,
};
