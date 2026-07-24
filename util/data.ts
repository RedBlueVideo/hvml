import { IHVMLElement } from "../types/elements.js";

class Data {
  static getJsonBoilerplate(): Partial<IHVMLElement> {
    return {
      "@context": "https://redblue.video/guide/hvml.context.jsonld",
    };
  }
}

export default Data;

/**
 * JSON-ML (https://web.archive.org/web/2021/http://www.jsonml.org/):
 * an element is a tuple of tag name, optional attribute record, then
 * children (each a text node or a nested element). This is the single
 * definition; the `md2jsonml` and `xml-trident` shims import it.
 */
export type JSONMLAttributes = Record<string, string>;
export type JSONMLNode = string | JSONML;
export type JSONML = [tag: string, ...rest: ( JSONMLAttributes | JSONMLNode )[]];

/**
 * FIXME: `HVMLPath` is being using with `lodash.set`,
 * which doesn’t expect `null`s (at least according to TypeScript;
 * it handles them fine but they’re converted to strings).
 * This is causing us to have to do
 * `path.filter(pathPart => pathPart !== null)` all ovet the place
 * just to satisfy type-checking.
 */
export type HVMLPath = (string | number | null)[];
export type LodashPath = (string | number)[];