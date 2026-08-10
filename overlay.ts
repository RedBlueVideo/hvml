import HVMLElement from './hvml-element.js';
import { defineHVMLElement } from './util/registry.js';

/**
 * The standalone time- and space-scoped annotation unit (“text
 * overlay”, “graphic overlay”). Geometry and timing live here;
 * `content` carries the payload, and an optional `goto` adds the
 * action. Fields hold XML lexical forms; the serializers convert
 * grammar-typed numerics on the way out.
 */
class Overlay extends HVMLElement {
  get nodeName(): string {
    return 'overlay';
  }

  declare about?: string;

  /** Playback phase; absent means `duration` */
  declare on?: string;

  declare start?: string;

  declare end?: string;

  declare width?: string;

  declare height?: string;

  declare top?: string;

  declare right?: string;

  declare bottom?: string;

  declare left?: string;
}

export default Overlay;

defineHVMLElement( 'overlay', Overlay );
