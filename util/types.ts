// import { HVMLElement } from "../hvml.js";

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

/**
 * Narrows to “object with a callable `method`”. Type guards are
 * TypeScript’s sanctioned escape hatch for duck-typed dynamic
 * dispatch, where `@ts-ignore` would otherwise accumulate. We also
 * reach for this where `instanceof` would require importing the
 * concrete class; between `hvml-element.ts` and `video.ts`, that
 * import creates a cycle.
 */
export function hasMethod<MethodName extends string>(
  object: unknown,
  method: MethodName,
): object is Record<MethodName, (...args: unknown[]) => unknown> {
  return (
    (typeof object === 'object')
    && (object !== null)
    && (typeof (object as Record<string, unknown>)[method] === 'function')
  );
}

// export function isHVMLElement(data: unknown): data is HVMLElement {
//   if (data)
// }