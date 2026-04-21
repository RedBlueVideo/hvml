import { IHVMLElement } from "../types/elements";

class Data {
  static getJsonBoilerplate(): Partial<IHVMLElement> {
    return {
      "@context": "https://redblue.video/guide/hvml.context.jsonld",
    };
  }
}

export default Data;

export type JSONMLNode = string | Record<string, string> | {};
export type JSONML = JSONMLNode[];

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