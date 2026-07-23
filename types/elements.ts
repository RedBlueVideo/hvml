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
   * valid HTML attributes. `any` (not `unknown`) so serialized
   * attribute records stay assignable to JSONMLAttributes.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * @deprecated `children` no longer contains bare tag-name strings —
 * unknown tags are represented by `HVMLUnknownElement`. Kept exported
 * for 0.0.x continuity.
 */
export type HVMLNodeOrNodeName = HVMLNode | string;

/**
 * The DOM’s live, named `HTMLCollection`, HVML-shaped: an element
 * array that also supports named lookup by child `id` — via bracket
 * access (`children['my-id']`, exactly how the HTML DOM behaves in a
 * real browser) or the typed, null-safe `namedItem()` (the same cue
 * TypeScript’s own `HTMLCollection` offers, since its arrays can’t
 * carry a string index signature). Intersections are exempt from
 * index-signature soundness checks, which is what makes this type
 * expressible at all; only *construction* needs convincing, and that
 * lives in `createHVMLCollection()`.
 */
export type HVMLCollection = HVMLElement[]
  & { [namedIndex: string]: HVMLElement | undefined }
  & { namedItem( name: string ): HVMLElement | null };

export function createHVMLCollection(): HVMLCollection {
  /**
   * The codebase’s one collection cast: a plain array satisfies
   * HVMLCollection at runtime (JS arrays accept string keys), but
   * TypeScript cannot express “array that will grow named keys”.
   * Confining the cast here means no call site ever needs a
   * suppression.
   */
  const collection = [] as unknown as HVMLCollection;

  Object.defineProperty( collection, 'namedItem', {
    /**
     * Non-enumerable: `Object.keys()` counts must only ever reflect
     * elements and named indices — tested public behavior.
     */
    "enumerable": false,
    "value": ( name: string ): HVMLElement | null => collection[name] ?? null,
  } );

  return collection;
}

export class HVMLNode {
  /**
   * All optional fields are `declare`: they must exist only when
   * assigned (serialization spreads instances, and an own
   * `undefined` would overwrite computed attributes), matching the
   * pre-TypeScript object shapes.
   */
  declare id?: string;

  declare 'xml:id'?: string;

  declare 'xml:lang'?: string;

  language: ISO639LanguageCode = '_';

  declare region?: string;

  declare instance?: unknown;

  /**
   * DOM cue: `Node.nodeName`. Serialization keys on this — never on
   * `constructor.name`, which changes under minification and class
   * renames. A getter (not a field) so it stays off the instance:
   * `_setJsonChild` spreads instances into serialized attributes.
   */
  get nodeName(): string {
    return '#node';
  }
  children: HVMLCollection = createHVMLCollection();
}

/**
 * A serialized title: a plain string (e.g. series) or the i18n
 * language→region record videos use.
 */
export type HVMLTitle = string | Record<string, Record<string, string>>;

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
  title?: HVMLTitle;
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