declare module 'xml-trident' {
  type JSONML = import('./util/data.js').JSONML;

  /**
   * The upstream library also accepts DOM nodes, but this package only
   * ever passes strings/JSON-ML. Typing only that subset keeps the DOM
   * lib out of the program.
   */
  export function toJsonml(xmlSource: string): JSONML;
  export function toString(jsonml: JSONML): string;
}
