export function isNumber(number) {
  return (typeof number === 'number');
}

export function isPlainObject(object) {
  return (Object.prototype.toString.call(object) === '[object Object]');
}

export function isString(string) {
  return (
    (typeof string === 'string')
    || (Object.prototype.toString.call(string) === '[object String]')
  );
}

export function isUndefined(object) {
  return (typeof object === 'undefined');
}

export function hasProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
