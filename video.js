// const fs = require( 'fs' );
// const xml = require( 'libxmljs' );
// const set = require( 'lodash.set' );
const isObject = require( 'lodash.isobject' );

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
      throw new Error( `The following are not valid video types: ${badTypes.join( ', ' )}` );
    }

    return true;
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
      if ( typeof type === 'string' ) {
        type = type.replace( /\s+/g, ' ' ).trim().split( ' ' );
      } else if ( !Array.isArray( type ) ) {
        throw new Error( `Parameter \`type\` must be of type Array or String` );
      }

      this._validateTypes( type );
      this.type = type;
    }

    if ( lang ) {
      if ( lang.indexOf( '-' ) !== -1 ) {
        ( [language, region] = lang.split( '-' ) );
      } else {
        language = lang;
        region = '_';
      }
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
    let language;
    let region;

    this.title = this.title || {};

    if ( lang ) {
      if ( lang.indexOf( '-' ) !== -1 ) {
        ( [language, region] = lang.split( '-' ) );
      } else {
        language = lang;

        if ( lang === this.language ) {
          ( { region } = this );
        } else {
          region = '_';
        }
      }
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
      if ( lang.indexOf( '-' ) !== -1 ) {
        ( [language, region] = lang.split( '-' ) );
      } else {
        language = lang;

        if ( lang === this.language ) {
          ( { region } = this );
        } else {
          region = '_';
        }
      }
    } else {
      ( { language, region } = this );
    }

    return this.title[language][region];
  }
}

module.exports = Video;
