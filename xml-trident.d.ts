declare module 'xml-trident' {
  // Sync with `/util/data.ts`
  type JSONMLNode = string | Record<string, string> | {};
  type JSONML = JSONMLNode[];

  /**
   * The upstream library also accepts DOM nodes, but this package only
   * ever passes strings/JSON-ML — typing that subset keeps the DOM lib
   * out of the program.
   */
  export function toJsonml(xmlSource: string): JSONML;
  export function toString(jsonml: object): string;
}