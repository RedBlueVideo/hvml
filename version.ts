import HVMLElement from './hvml-element.js';
import { defineHVMLElement } from './util/registry.js';

/**
 * The expression layer: which content this is, as distinct from which
 * work (`video`) and which artifact (`presentation`, `file`).
 */
class Version extends HVMLElement {
  get nodeName(): string {
    return 'version';
  }

  /** `theatrical` | `directors-cut` | `workprint` | `broadcast` | … (open set) */
  declare type?: string;

  /** Dates a revision, for works whose file versions are the editorial versions */
  declare datetime?: string;

  declare about?: string;
}

export default Version;

defineHVMLElement( 'version', Version );
