import HVMLElement from "../hvml-element";
import { ISO639LanguageCode } from "./language";

export interface JSONLDSerializedHTMLElement {
  /**
   * This should technically conform to only
   * valid HTML attributes.
   */
  [propertyName: string]: any;
  "@type"?: keyof HTMLElementTagNameMap;
  "textContent"?: string;
}

export type HVMLElementTagName =
  | 'animate'
  | 'bitdepth'
  | 'bitrate'
  | 'choice'
  | 'codec'
  | 'container'
  | 'description'
  | 'entity'
  | 'episode'
  | 'file'
  | 'fps'
  | 'frametype'
  | 'goto'
  | 'height'
  | 'hvml'
  | 'mime'
  | 'name'
  | 'par'
  | 'poster'
  | 'presentation'
  | 'recorded'
  | 'showing'
  | 'title'
  | 'uri'
  | 'venue'
  | 'video'
  | 'width'
;

export function isValidHVMLElementTagName(tagName: string): tagName is HVMLElementTagName {
  switch (tagName) {
    case 'animate':
    case 'bitdepth':
    case 'bitrate':
    case 'choice':
    case 'codec':
    case 'container':
    case 'description':
    case 'entity':
    case 'episode':
    case 'file':
    case 'fps':
    case 'frametype':
    case 'goto':
    case 'height':
    case 'hvml':
    case 'mime':
    case 'name':
    case 'par':
    case 'poster':
    case 'presentation':
    case 'recorded':
    case 'showing':
    case 'title':
    case 'uri':
    case 'venue':
    case 'video':
    case 'width':
      return true;
    default:
      return false;
  }
}

export type HVMLDescriptionType =
  | 'jsonml'
  | 'text'
  | 'xhtml'
;

export type HVMLNodeOrNodeName = HVMLNode | string;

export type HVMLCollection = HVMLNodeOrNodeName[] & { [namedIndex: string]: HVMLNodeOrNodeName };

export class HVMLNode {
  id?: string;
  'xml:id'?: string;
  'xml:lang'?: string;
  language: ISO639LanguageCode = '_';
  region?: string;
  instance?: unknown;

  /**
   * DOM cue: `Node.nodeName`. Serialization keys on this — never on
   * `constructor.name`, which changes under minification and class
   * renames. A getter (not a field) so it stays off the instance:
   * `_setJsonChild` spreads instances into serialized attributes.
   */
  get nodeName(): string {
    return '#node';
  }
  /**
   * FIXME: TypeScript doesn’t let you do this and then also
   * set e.g. `this.children = []` because plain arrays lack
   * the string index signature.
   * 
   * Currently, the string index is ONLY present if both:
   * 
   * A.) The node has children, AND
   * B.) At least one of the children has an `id`.
   * 
   * This is a bit of “magic” inspired by how the HTML DOM
   * works in a real browser.
   * 
   * Notably, TypeScript’s own implementation of `HTMLCollection`
   * lacks support for string indices as well. It relies on the
   * `.namedItem` method.
   */
  // @ts-ignore - TS limitation
  children: HVMLCollection = [];
}

export type IHVMLNode = typeof HVMLNode & string;

/**
 * FIXME:
 */
export interface IHVMLElement extends HVMLNode {
  '@context'?: string;
  /**
   * This should ideally conform to `HVMLElementTagName`,
   * but doing so makes TypeScript needlessly pedantic.
   * Don’t want to add type guard functions all over the
   * place even when we can be 99.99% sure that the data
   * being operated on conforms to the HVML namespace.
   * 
   * There may also be some edge interop cases where HVML
   * is mixed with foreign data types.
   */
  '@type': string;
  title?: string;
  // /**
  //  * Currently only `HVMLVideoElement` supports the `setDescription`
  //  * method.
  //  */
  // setDescription: (description: string, type?: HVMLDescriptionType) => void;
}

export type DescriptionType =
  | 'jsonml'
  | 'text'
  | 'xhtml'
;

/**
 * TODO: Confirm whether we actually allow JSON-LD
 * `@context` and `@type` to appear globally.
 */
export type HVMLGlobalAttributeName =
 | '@context'
 | '@type'
 | 'children'
 | 'id'
 | 'instance'
 | 'language'
 | 'region'
;

export type ValidXMLGlobalAttributeName =
 | 'xml:id'
 | 'xml:lang'
//  | 'xmlns'
;