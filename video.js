const isPlainObject = require( 'lodash/isPlainObject' );
const isNumber = require( 'lodash/isNumber' );
const isString = require( 'lodash/isString' );
const isUndefined = require( 'lodash/isUndefined' );

const Time = require( './util/time' );
const Validation = require( './util/validation' );
const Transform = require( './util/transform' );

class Video {
  static isValidType( type ) {
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

  _validateTypes( types, fieldName = 'type' ) {
    const badTypes = [];

    types.forEach( ( type ) => {
      if ( !Video.isValidType( type ) ) {
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

  _getRegion( lang ) {
    let region;

    if ( lang === this.language ) {
      ( { region } = this );
    } else {
      region = '_';
    }

    return region;
  }

  _langHasRegion( lang ) {
    return ( lang.indexOf( '-' ) !== -1 );
  }

  _getLanguageAndRegion( lang, regionFallback = () => '_' ) {
    let language;
    let region;

    if ( this._langHasRegion( lang ) ) {
      ( [language, region] = lang.split( '-' ) );
    } else {
      language = lang;
      region = regionFallback();
    }

    return { language, region };
  }

  get _baseErrorData() {
    return {
      "className": this.constructor.name,
    };
  }

  constructor( config = {} ) {
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
    this.language = language;
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

  hasType( type ) {
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
    const hasAll = () => type.every( typeValue => this.type.indexOf( typeValue ) !== -1 );

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

  setTitle( title, lang ) {
    const errorData = {
      ...this._baseErrorData,
      "fieldName": "title",
      "expected": "String",
      "input": title,
    };
    let language = '_';
    let region = '_';

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

  getTitle( lang ) {
    let language;
    let region;

    if ( lang ) {
      ( { language, region } = this._getLanguageAndRegion( lang, () => this._getRegion( lang ) ) );
    } else {
      ( { language, region } = this );
    }

    return this.title[language][region];
  }

  setEpisode( number ) {
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

  setRuntime( runtime ) {
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

  getRuntime( format ) {
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

  /* type = text|xhtml */
  setDescription( description, type = 'text' ) {
    const errorData = {
      ...this._baseErrorData,
      "methodName": "setDescription",
      "fieldName": "description",
      "input": description,
      "expected": ["String", "Object"],
    };

    if ( ( type === 'text' ) && !isString( description ) ) {
      throw new Validation.TypeError( errorData );
    }

    this.description = {};

    switch ( type ) {
      case 'jsonml':
        this.description.xhtml = Transform.jsonMlToXmlString( Transform.wrapJsonMl( description ) );
        break;

      case 'xhtml':
        switch ( typeof description ) {
          case 'string':
            this.description.xhtml = Transform.wrapXhtml( description.trim() );
            break;
          default:
            throw new Validation.TypeError( errorData );
        }
        break;

      case 'text':
      default:
        this.description.text = description.trim();
    }
  }

  getDescription( type, parseMarkdown = true, newlinesToBRs = true ) { // eslint-disable-line consistent-return
    if ( !this.description ) {
      return null;
    }

    switch ( type ) {
      case 'jsonml':
      // case 'json':
        /* istanbul ignore else */
        if ( this.description.xhtml ) {
          return Transform.xmlStringToJsonMl( this.description.xhtml );
        }

        /* istanbul ignore else */
        if ( this.description.text ) {
          return Transform.markdownToJsonMl( this.description.text );
        }
        /* istanbul ignore next */
        break;

      case 'xhtml':
      // case 'html':
      // case 'xml':
        /* istanbul ignore else */
        if ( this.description.xhtml ) {
          return this.description.xhtml;
        }

        // If user set a text description, and is trying to get back XHTML,
        // assume the text is Markdown-formatted and convert it to JSON-ML
        // before turning it into a DOM string
        /* istanbul ignore else */
        if ( this.description.text ) {
          let description;

          if ( parseMarkdown ) {
            description = Transform.markdownToJsonMl( this.description.text );
          } else {
            description = this.description.text;

            if ( newlinesToBRs ) {
              description = description.replace( /\n/g, '<br />' );
            }

            description = Transform.xmlStringToJsonMl( Transform.wrapXhtml( `<p>${description}</p>` ) );
          }

          return Transform.jsonMlToXmlString( description );
        }
        /* istanbul ignore next */
        break;
      case 'text':
      default:
        /* istanbul ignore else */
        if ( this.description.text ) {
          return this.description.text;
        }

        /* istanbul ignore else */
        if ( this.description.xhtml ) {
          return Transform.getJsonMlTextContent( Transform.xmlStringToJsonMl( this.description.xhtml )[1], true, true );
        }
        // throw new Validation.DomainError( 'Something broke. Please file a bug.' );
    }
  }
}

module.exports = Video;
