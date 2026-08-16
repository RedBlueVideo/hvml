import {
  isPlainObject,
  isNumber,
  isString,
  isUndefined,
} from './util/types.js';

import HVMLElement from './hvml-element.js';
// import Series from './series.js';

import Time from './util/time.js';
import Validation, { HVMLTypeError } from './util/validation.js';
import { DescriptionType, HVMLXhtmlPayloadInput, IHVMLDescription } from './types/elements.js';
import { ISO639LanguageCode, isValidISO639LanguageCode } from './types/language.js';
import { JSONMLNode } from './util/data.js';
import { defineHVMLElement } from './util/registry.js';
import { setDescription, getDescription } from './util/description.js';

// export type VideoTitle = {
//   [Language in ISO639LanguageCode]?: {
//     [key: string]: string;
//   }
// } | string;

export type VideoTitle = Record<string, {
  [key: string]: string;
}>; // | string;

/**
 * @deprecated Moved to types/elements.ts when `version` joined `video`
 * as a description carrier; re-exported here for 0.1.x continuity.
 */
export type { IHVMLDescription } from './types/elements.js';

/**
 * @deprecated Renamed `HVMLXhtmlPayloadInput` (types/elements.ts)
 * when `content` joined `description` as a typed-payload carrier.
 */
export type HVMLXhtmlDescriptionInput = HVMLXhtmlPayloadInput;

/**
 * Constructor input. This is distinct from the instance shape: `lang`
 * is parsed into `language` + `region` and never stored verbatim.
 */
export interface HVMLVideoElementConfig {
  type?: string | string[];
  /** BCP-47-style language tag, e.g. `en-US`. */
  lang?: string;
  id?: string;
}

class HVMLVideoElement extends HVMLElement {
  get nodeName(): string {
    return 'video';
  }

  /**
   * TODO: Make explicit allowed values
   */
  declare type?: string | string[];

  region: string = '_';

  declare title?: VideoTitle;

  declare episode?: number;

  declare runtime?: string;

  declare description?: Partial<IHVMLDescription>;

  declare about?: string;

  static isValidType( type: string ) {
    switch ( type ) {
      case 'narrative':
      case 'documentary':
      case 'ad':
      case 'personal':
      case 'historical':
        return true;
      default:
        return false;
    }
  }

  _validateTypes( types: string[], fieldName = 'type' ) {
    const badTypes: string[] = [];

    types.forEach( ( type ) => {
      if ( !HVMLVideoElement.isValidType( type ) ) {
        badTypes.push( type );
      }
    } );

    if ( badTypes.length ) {
      throw new Validation.EnumError( {
        ...this._baseErrorData,
        fieldName,
        "badValues": badTypes,
      } );
    }

    return true;
  }

  _getRegion( lang: string ) {
    let region: string | undefined;

    if ( lang === this.language ) {
      ( { region } = this );
    } else {
      region = '_';
    }

    if (!region) {
      region = '_'
    }

    return region;
  }

  _langHasRegion( lang: string ) {
    return ( lang.indexOf( '-' ) !== -1 );
  }

  _getLanguageAndRegion( lang: string, regionFallback = () => '_' ): { language: ISO639LanguageCode; region: string; } {
    let language: string;
    let region: string;

    if ( this._langHasRegion( lang ) ) {
      ( [language, region] = lang.split( '-' ) );
    } else {
      language = lang;
      region = regionFallback();
    }

    if (isValidISO639LanguageCode(language)) {
      return { language, region };
    }

    throw new HVMLTypeError({
      methodName: '_getLanguageAndRegion',
      expected: 'Valid ISO-639 two-letter language code',
      got: language,
    })
  }

  constructor( config: HVMLVideoElementConfig = {} ) {
    super();

    let language;
    let region;
    const errorData = {
      ...this._baseErrorData,
      "methodName": "constructor",
    };

    if ( !isPlainObject( config ) ) {
      throw new Validation.TypeError( {
        ...errorData,
        "fieldName": "config",
        "expected": "Object",
        "input": config,
      } );
    }

    if ( config.type ) {
      if ( isString( config.type ) ) {
        config.type = config.type.replace( /\s+/g, ' ' ).trim().split( ' ' );
      } else if ( !Array.isArray( config.type ) ) {
        throw new Validation.TypeError( {
          ...errorData,
          "fieldName": "config.type",
          "expected": ["String", "Array"],
          "input": config.type,
        } );
      }

      this._validateTypes( config.type, 'config.type' );
      this.type = config.type;
    }

    if ( config.lang ) {
      ( { language, region } = this._getLanguageAndRegion( config.lang ) );
    } else {
      language = '_';
      region = '_';
    }
    if (isValidISO639LanguageCode(language)) {
      this.language = language;
    }
    this.region = region;

    if ( !isUndefined( config.id ) ) {
      if ( !isString( config.id ) ) {
        // @todo: validate for XML ID
        throw new Validation.TypeError( {
          ...errorData,
          "fieldName": "id",
          "expected": "String",
          "input": config.id,
        } );
      }

      this.id = config.id;
    }

    return this;
  }

  hasType( type: string | string[] ) {
    if ( !this.type ) {
      return false;
    }

    const errorData = {
      ...this._baseErrorData,
      "methodName": "hasType",
      "fieldName": "type",
      "expected": ["String", "Array"],
      "input": type,
    };
    /**
     * FIXME: type coercion
     * Assuming for now that `hasAll` is only called in contexts
     * in which we have already established that `type` is an array
     */
    const hasAll = () => (type as string[]).every( typeValue => this.type?.indexOf( typeValue ) !== -1 );

    if ( Array.isArray( type ) ) {
      const numberOfTypesToCheck = type.length;
      const numberOfTypesVideoHas = this.type.length;

      if ( numberOfTypesToCheck > numberOfTypesVideoHas ) {
        return false;
      }

      if ( numberOfTypesToCheck === 1 ) {
        return ( this.type.indexOf( type[0] ) !== -1 );
      }

      return hasAll();
    }

    if ( isString( type ) ) {
      // Split multi-value strings ( e.g. 'narrative documentary' ) into an array
      if ( type.indexOf( ' ' ) !== -1 ) {
        type = type.trim().replace( /\s+/g, ' ' ).split( ' ' );
        return hasAll();
      }

      return ( this.type.indexOf( type ) !== -1 );
    }

    throw new Validation.TypeError( errorData );
  }

  isVlogEpisode() {
    return this.hasType( ['personal', 'documentary'] );
  }

  isArchived() {
    return this.hasType( ['historical', 'personal'] );
  }

  setTitle( title: string, lang?: string ) {
    const errorData = {
      ...this._baseErrorData,
      "fieldName": "title",
      "expected": "String",
      "input": title,
    };
    let language: string = '_';
    let region: string = '_';

    if ( !isString( title ) ) {
      throw new Validation.TypeError( errorData );
    }

    this.title = this.title || {};

    if ( lang ) {
      ( { language, region } = this._getLanguageAndRegion( lang, () => this._getRegion( lang ) ) );
    } else {
      ( { language, region } = this );
    }

    this.title[language] = this.title[language] || {};
    this.title[language][region] = title;
  }

  getTitle( lang?: string ) {
    let language;
    let region;

    if ( lang ) {
      ( { language, region } = this._getLanguageAndRegion( lang, () => this._getRegion( lang ) ) );
    } else {
      ( { language, region } = this );
    }

    return this.title?.[language][region];
  }

  setEpisode( number: string | number ) {
    const errorData = {
      ...this._baseErrorData,
      "fieldName": "episode",
      "expected": "Integer",
      "input": number,
    };

    if ( isString( number ) ) {
      number = parseInt( number, 10 );
    }

    if ( !Number.isInteger( number ) ) {
      throw new Validation.NotIntegerError( errorData );
    }

    this.episode = number;
  }

  getEpisode() {
    return this.episode;
  }

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

      runtime = parseInt( runtime, 10 );
    }

    if ( !isNumber( runtime ) ) {
      throw new Validation.TypeError( errorData );
    }

    if ( runtime <= 0 ) {
      throw new Validation.RangeError( {
        ...errorData,
        "lowerBound": 0,
      } );
    }

    this.runtime = `PT${runtime}M`;
  }

  /**
   * TODO: Enumerate format options in a union type
   */
  getRuntime( format: string ) {
    /* istanbul ignore else */
    if ( isString( format ) ) {
      format = format.toLowerCase();
    }

    switch ( format ) {
      case 'hours':
        return Time.isoDurationToHours( this.runtime );
      case 'minutes':
        return Time.isoDurationToMinutes( this.runtime );
      case 'iso8601':
      default:
        return this.runtime;
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

export default HVMLVideoElement;

defineHVMLElement( 'video', HVMLVideoElement );
