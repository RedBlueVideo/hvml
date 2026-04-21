export function isNumber(number: unknown) {
  return (typeof number === 'number');
}

export function isPlainObject(object: unknown) {
  return (Object.prototype.toString.call(object) === '[object Object]');
}

export function isString(string: unknown): string is string {
  return (
    (typeof string === 'string')
    || (Object.prototype.toString.call(string) === '[object String]')
  );
}

export function isUndefined(object: unknown) {
  return (typeof object === 'undefined');
}

export function hasProperty(object: object, property: string) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
