// const fs = require( 'fs' );
// const xml = require( 'libxmljs' );
// const set = require( 'lodash.set' );
const isObject = require( 'lodash.isobject' );
const isNumber = require( 'lodash.isnumber' );
const isString = require( 'lodash.isstring' );

const Time = require( './util/time' );
const Validation = require( './util/validation' );
const Transform = require( './util/transform' );

class Video {
  _isValidType( type ) {
    switch ( type ) {
      case 'narrative':
      case 'ad':
      case 'personal':
      case 'historical':
        return true;
      default:
        return false;
    }
  }

  _validateTypes( types ) {
    const badTypes = [];

    types.forEach( ( type ) => {
      if ( !this._isValidType( type ) ) {
        badTypes.push( type );
      }
    } );

    if ( badTypes.length ) {
      throw new Validation.EnumError( {
        ...this._baseErrorData,
        "field": "type",
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

  // _escapeForJSON( html ) {
  //   return html.replace( /"/g, `\\"` );
  // }

  get _baseErrorData() {
    return {
      "className": this.constructor.name,
    };
  }

  constructor( configOrType, lang, id ) {
    let type;
    let language;
    let region;

    if ( isObject( configOrType ) ) {
      ( { type, lang, id } = configOrType );
    } else {
      type = configOrType;
    }

    if ( type ) {
      if ( isString( type ) ) {
        type = type.replace( /\s+/g, ' ' ).trim().split( ' ' );
      } else if ( !Array.isArray( type ) ) {
        throw new Error( `Parameter \`type\` must be of type Array or String` );
      }

      this._validateTypes( type );
      this.type = type;
    }

    if ( lang ) {
      ( { language, region } = this._getLanguageAndRegion( lang ) );
    } else {
      language = '_';
      region = '_';
    }
    this.language = language;
    this.region = region;

    if ( id ) {
      if ( typeof id !== 'string' ) {
        // @todo: validate for XML ID
        throw new Error( `Parameter \`id\` must be of type String` );
      }

      this.id = id;
    }

    return this;
  }

  setTitle( title, lang ) {
    const errorData = {
      ...this._baseErrorData,
      "field": "title",
      "expected": "String",
      "input": title,
    };
    let language;
    let region;

    if ( !isString( title ) ) {
      throw new Validation.TypeError( errorData );
    }

    this.title = this.title || {};

    if ( lang ) {
      ( { language, region } = this._getLanguageAndRegion( lang, () => this._getRegion( lang ) ) );
    } else {
      language = '_';
      region = '_';
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
      "field": "episode",
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
      "field": "runtime",
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
      "field": "description",
      "expected": ["String", "Object"],
    };

    if ( ( type === 'text' ) && !isString( description ) ) {
      throw new Validation.TypeError( errorData );
    }

    this.description = {};

    switch ( type ) {
      case 'xhtml':
        switch ( typeof description ) {
          case 'string':
            this.description.xhtml = Transform.wrapXhtml( description.trim() );
            break;
          case 'object':
            this.description.xhtml = Transform.wrapXhtml( Transform.toXmlString( description ) );
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

  getDescription( type, parseMarkdown = true, newlinesToBRs = true ) {
    switch ( type ) {
      case 'jsonml':
      case 'json':
        if ( this.description.xhtml ) {
          return Transform.toJsonMl( this.description.xhtml );
        }

        if ( this.description.text ) {
          return Transform.markdownToJsonMl( this.description.text );
        }
        break;

      case 'xhtml':
      // case 'html':
      // case 'xml':
        if ( this.description.xhtml ) {
          return this.description.xhtml;
        }

        // If user set a text description, and is trying to get back XHTML,
        // assume the text is Markdown-formatted and convert it to JSON-ML
        // before turning it into a DOM string
        if ( this.description.text ) {
          let description;

          if ( parseMarkdown ) {
            description = Transform.markdownToJsonMl( this.description.text );
          } else {
            description = this.description.text;

            if ( newlinesToBRs ) {
              description = description.replace( /\n/g, '<br />' );
            }

            description = Transform.toJsonMl( Transform.wrapXhtml( `<p>${description}</p>` ) );
          }

          return Transform.toXmlString( description );
        }
        break;
      case 'text':
      default:
        if ( this.description.text ) {
          return this.description.text;
        }

        if ( this.description.xhtml ) {
          return Transform.getJsonMlTextContent( Transform.toJsonMl( this.description.xhtml )[1], true, true );
        }
    }

    return null;
  }
}

module.exports = Video;
