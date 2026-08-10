import HVMLElement from './hvml-element.js';
import { defineHVMLElement } from './util/registry.js';

/**
 * PROVISIONAL, matching the grammar: maps the presenting resource’s
 * local timeline onto its version’s reference timeline
 * (local = offset + reference × rate/scale). Fields hold XML lexical
 * forms; the serializers convert grammar-typed numerics on the way
 * out.
 */
class Sync extends HVMLElement {
  get nodeName(): string {
    return 'sync';
  }

  declare offset?: string;

  declare rate?: string;

  declare scale?: string;
}

export default Sync;

defineHVMLElement( 'sync', Sync );
