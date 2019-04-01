// const fs = require( 'fs' );
// const xml = require( 'libxmljs' );
// const set = require( 'lodash.set' );
const isObject = require( 'lodash.isobject' );
const isString = require( 'lodash.isstring' );

const Validation = require( './validation' );

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
}

module.exports = Video;
