import { ISO639LanguageCode } from "./language.js";

import type { HVMLElement } from "../hvml-element.js";
import type { HVML } from "../hvml.js";
import type HVMLVideoElement from "../video.js";
import type Series from "../series.js";
import type Group from "../group.js";
import type { HVMLDescriptionElement } from "../description.js";

/**
 * Embedded-XHTML tag name. HVML embeds arbitrary XHTML content (rich
 * descriptions and the like); duplicating lib.dom’s hundred-plus tag
 * names here would create a sync burden with a spec this library
 * doesn’t own, so this stays `string` — and keeps the published types
 * usable by Node consumers who don’t load the browser lib.
 */
export type XHTMLTagName = string;

export interface JSONLDSerializedHTMLElement {
  /**
   * This should technically conform to only
   * valid HTML attributes.
   */
  [propertyName: string]: any;
  "@type"?: XHTMLTagName;
  "textContent"?: string;
}

/**
 * The HVML element vocabulary. The source of truth is `rng/hvml.rng` —
 * `types/elements.test.ts` fails with an exact diff whenever the
 * schema and this list drift apart.
 */
export const HVML_ELEMENT_TAG_NAMES = [
  'animate',
  'bitdepth',
  'bitrate',
  'choice',
  'codec',
  'container',
  'description',
  'entity',
  'episode',
  'file',
  'fps',
  'frametype',
  'goto',
  'height',
  'hvml',
  'mime',
  'name',
  'par',
  'poster',
  'presentation',
  'recorded',
  'showing',
  'title',
  'uri',
  'venue',
  'video',
  'width',
] as const;

export type HVMLElementTagName = typeof HVML_ELEMENT_TAG_NAMES[number];

export function isValidHVMLElementTagName(tagName: string): tagName is HVMLElementTagName {
  return HVML_ELEMENT_TAG_NAMES.some( ( validTagName ) => validTagName === tagName );
}

/**
 * Tag-name → element-class map, mirroring lib.dom’s
 * `HTMLElementTagNameMap`. Tags without a dedicated class yet fall
 * back to the `HVMLElement` base; give a tag its own entry when it
 * grows a class.
 */
export interface HVMLElementTagNameMap extends Record<HVMLElementTagName, HVMLElement> {
  description: HVMLDescriptionElement;
  group: Group;
  hvml: HVML;
  series: Series;
  video: HVMLVideoElement;
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