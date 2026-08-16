import HVMLElement from './hvml-element.js';
import Time from './util/time.js';
import Validation from './util/validation.js';
import { isNumber, isString } from './util/types.js';
import { defineHVMLElement } from './util/registry.js';
import { setDescription, getDescription } from './util/description.js';

import type { DescriptionType, HVMLXhtmlPayloadInput, IHVMLDescription } from './types/elements.js';
import type { JSONMLNode } from './util/data.js';

export type RuntimeFormat = 'seconds' | 'minutes' | 'hours' | 'iso8601';

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

  /** Branding for this version (“Final Cut”); the work’s title lives on `video` */
  declare title?: string;

  /**
   * The XML lexical form the grammar accepts: decimal seconds
   * (`"5880"`) or an ISO 8601 duration (`"PT1H38M"`).
   */
  declare runtime?: string;

  declare description?: Partial<IHVMLDescription>;

  setTitle( title: string ) {
    if ( !isString( title ) ) {
      throw new Validation.TypeError( {
        ...this._baseErrorData,
        "fieldName": "title",
        "expected": "String",
        "input": title,
      } );
    }

    this.title = title;
  }

  getTitle() {
    return this.title;
  }

  /**
   * A number is taken as seconds and kept in decimal form; a string
   * is kept in the lexical form given, whether an ISO 8601 duration or
   * a decimal, so a document round-trips through the MOM unchanged.
   */
  setRuntime( runtime: string | number ) {
    const errorData = {
      ...this._baseErrorData,
      "fieldName": "runtime",
      "expected": ["Number", "ISO8601 Duration"],
      "input": runtime,
    };

    if ( isString( runtime ) ) {
      if ( Time.isoDurationRegex.test( runtime ) ) {
        this.runtime = runtime;
        return;
      }

      const seconds = Number( runtime );

      if ( ( runtime.trim() === '' ) || Number.isNaN( seconds ) ) {
        throw new Validation.TypeError( errorData );
      }

      if ( seconds < 0 ) {
        throw new Validation.RangeError( { ...errorData, "lowerBound": 0 } );
      }

      this.runtime = runtime.trim();
      return;
    }

    if ( !isNumber( runtime ) || Number.isNaN( runtime ) ) {
      throw new Validation.TypeError( errorData );
    }

    if ( runtime < 0 ) {
      throw new Validation.RangeError( { ...errorData, "lowerBound": 0 } );
    }

    this.runtime = String( runtime );
  }

  getRuntime( format: RuntimeFormat = 'seconds' ) {
    if ( typeof this.runtime !== 'string' ) {
      return undefined;
    }

    const isDuration = Time.isoDurationRegex.test( this.runtime );
    const seconds = isDuration ? Time.isoDurationToSeconds( this.runtime ) : Number( this.runtime );

    switch ( format ) {
      case 'iso8601':
        return isDuration ? this.runtime : `PT${seconds}S`;
      case 'hours':
        return seconds / 3600;
      case 'minutes':
        return seconds / 60;
      case 'seconds':
      default:
        return seconds;
    }
  }

  setDescription( description: string, type?: 'text' ): void;

  setDescription( description: JSONMLNode[], type: 'jsonml' ): void;

  setDescription( description: string | HVMLXhtmlPayloadInput, type: 'xhtml' ): void;

  setDescription( description: string | HVMLXhtmlPayloadInput | JSONMLNode[], type: DescriptionType = 'text' ) {
    setDescription( this, description, type );
  }

  getDescription( type?: DescriptionType, parseMarkdown = true, newlinesToBRs = true ) {
    return getDescription( this, type, parseMarkdown, newlinesToBRs );
  }
}

export default Version;

defineHVMLElement( 'version', Version );
