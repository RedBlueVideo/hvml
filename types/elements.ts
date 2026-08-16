import { ISO639LanguageCode } from "./language.js";
import type { JSONML } from "../util/data.js";

import type { HVMLElement } from "../hvml-element.js";
import type { HVML } from "../hvml.js";
import type HVMLVideoElement from "../video.js";
import type Series from "../series.js";
import type Group from "../group.js";
import type Version from "../version.js";
import type Overlay from "../overlay.js";
import type Presentation from "../presentation.js";
import type Content from "../content.js";
import type Sync from "../sync.js";
import type { HVMLDescriptionElement } from "../description.js";

/**
 * Embedded-XHTML tag name. HVML embeds arbitrary XHTML content (rich
 * descriptions and the like). Duplicating lib.dom’s hundred-plus tag
 * names here would create a sync burden with a spec this library
 * doesn’t own, so this is `string`. It also keeps the published
 * types usable in Node projects that don’t load the browser lib.
 */
export type XHTMLTagName = string;

export interface JSONLDSerializedHTMLElement {
  /**
   * This should technically conform to only
   * valid HTML attributes. We keep `any` rather than `unknown` so
   * serialized attribute records remain assignable to `JSONMLAttributes`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propertyName: string]: any;
  "@type"?: XHTMLTagName;
  "textContent"?: string;
}

/**
 * The `xhtml`-typed input accepted by the payload setters
 * (`setDescription`, `setContent`) when it isn’t a raw XHTML string:
 * JSON-LD-serialized HTML, as parsed from an HVML document’s
 * `html:div` content.
 */
export interface HVMLXhtmlPayloadInput {
  childNodes?: JSONLDSerializedHTMLElement[];
}

/**
 * The HVML element vocabulary. The source of truth is `rng/hvml.rng`;
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
  'content',
  'description',
  'entity',
  'episode',
  'file',
  'fps',
  'frametype',
  'goto',
  'group',
  'height',
  'hvml',
  'link',
  'mime',
  'name',
  'overlay',
  'par',
  'poster',
  'presentation',
  'recorded',
  'runtime',
  'series',
  'showing',
  'sync',
  'title',
  'uri',
  'venue',
  'version',
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
  content: Content;
  description: HVMLDescriptionElement;
  group: Group;
  hvml: HVML;
  overlay: Overlay;
  presentation: Presentation;
  series: Series;
  sync: Sync;
  version: Version;
  video: HVMLVideoElement;
}

export type HVMLDescriptionType =
  | 'jsonml'
  | 'text'
  | 'xhtml'
;

/**
 * @deprecated Bare tag-name strings never appear in `children`;
 * unknown tags are represented by `HVMLUnknownElement`. Kept exported
 * for 0.0.x continuity.
 */
export type HVMLNodeOrNodeName = HVMLNode | string;

/**
 * The DOM’s live, named `HTMLCollection`, HVML-shaped. This is an
 * element array that also supports named lookup by child `id`, in two
 * ways:
 *
 * A.) Bracket access (`children['my-id']`), matching how the HTML DOM
 * behaves in a real browser; and
 * B.) `namedItem()`. (TypeScript’s own `HTMLCollection` relies on this
 * method for the same reason: its arrays can’t carry a string index
 * signature.)
 *
 * Intersection types are exempt from TypeScript’s index-signature
 * soundness checks. That exemption is what makes this type expressible
 * at all. Construction is the one place the compiler still objects, so
 * we confine the cast to `createHVMLCollection()`.
 */
export type HVMLCollection = HVMLElement[]
  & { [namedIndex: string]: HVMLElement | undefined }
  & { namedItem( name: string ): HVMLElement | null };

export function createHVMLCollection(): HVMLCollection {
  /**
   * This is the codebase’s ONLY collection cast. A plain array
   * satisfies `HVMLCollection` at runtime, since JS arrays accept
   * string keys just fine. TypeScript has no way to express “array
   * that will grow named keys”, so we convince the compiler here,
   * once. No call site ever needs a suppression.
   */
  const collection = [] as unknown as HVMLCollection;

  Object.defineProperty( collection, 'namedItem', {
    /**
     * Non-enumerable: `Object.keys()` counts must only ever reflect
     * elements and named indices. Tests assert those counts.
     */
    "enumerable": false,
    "value": ( name: string ): HVMLElement | null => collection[name] ?? null,
  } );

  return collection;
}

export class HVMLNode {
  /**
   * All optional fields are `declare`. They must exist only when
   * assigned, matching the pre-TypeScript object shapes: serialization
   * spreads instances, and an own `undefined` would overwrite computed
   * attributes like `xml:id`.
   */
  declare id?: string;

  declare 'xml:id'?: string;

  declare 'xml:lang'?: string;

  /**
   * The base IRI `xml:id` values resolve against. Consulted on the
   * document root only: `getBase()`/`getIri()` know nothing of XML
   * Base’s nested-scope resolution, so an `xml:base` on a descendant
   * serializes as an ordinary attribute and mints nothing.
   */
  declare 'xml:base'?: string;

  language: ISO639LanguageCode = '_';

  declare region?: string;

  declare instance?: unknown;

  /**
   * DOM cue: `Node.nodeName`. Serialization keys on this, never on
   * `constructor.name` (which changes under minification and class
   * renames). We use a getter rather than a field to keep it off the
   * instance: `_setJsonChild` spreads instances into serialized
   * attributes.
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
/**
 * A JSON-LD context reference: the published context URL alone, or
 * that URL alongside an embedded object carrying the document’s
 * `@base` (the JSON counterpart of the root’s `xml:base`).
 */
export type JSONLDContext = string | Record<string, unknown> | ( string | Record<string, unknown> )[];

export interface IHVMLElement extends HVMLNode {
  '@context'?: JSONLDContext;
  /**
   * The subject IRI, relative to `@base`: `""` for the primary child
   * of `hvml` (it mints the base itself), `#id` for every other
   * element with an `xml:id`. Emitted only when the document declares
   * a base and the element does not cite with `about`, which the
   * context aliases to `@id`.
   */
  '@id'?: string;
  /**
   * The canonical multi-root shape: one node per root-level element,
   * each carrying its own `@type`. A single root element serializes
   * as the top-level object instead, with no `@graph`.
   */
  '@graph'?: Partial<IHVMLElement>[];
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
 * A description as its element stores it: keyed by `DescriptionType`,
 * with the XHTML form wrapped in its namespaced `div`.
 */
export interface IHVMLDescription {
  text: string;
  jsonml: JSONML;
  xhtml: string;
}

/**
 * TODO: Confirm whether we actually allow JSON-LD
 * `@context` and `@type` to appear globally.
 */
export type HVMLGlobalAttributeName =
 | '@context'
 | '@id'
 | '@type'
 /**
  * Cites the IRI of the thing an element describes. The grammar
  * grants it to the subject-bearing elements only (`video`,
  * `version`, `presentation`, `overlay`); this union names
  * attributes, the RNG polices placement.
  */
 | 'about'
 | 'children'
 | 'id'
 | 'instance'
 | 'language'
 | 'region'
;

export type ValidXMLGlobalAttributeName =
 | 'xml:base'
 | 'xml:id'
 | 'xml:lang'
//  | 'xmlns'
;