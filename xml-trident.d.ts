declare module 'xml-trident' {
  // Sync with `/util/data.ts`
  type JSONMLNode = string | Record<string, string> | {};
  type JSONML = JSONMLNode[];

  export function toJsonml(stringOrDom: string | Node): JSONML;
  export function toString(domOrJsonml: Node | object): string;
}