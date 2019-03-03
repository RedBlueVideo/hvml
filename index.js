const fs = require( 'fs' );
const xml = require( 'libxmljs' );
const set = require( 'lodash.set' );

// https://rclayton.silvrback.com/custom-errors-in-node-js

class HVML {
  constructor( path, encoding = 'utf8' ) {
    /*
      fs.readFile(path[, options], callback)
      - path <string> | <Buffer> | <URL> | <integer> filename or file descriptor
      - options <Object> | <string>
        - encoding <string> | <null> Default: null
        - flag <string> See support of file system flags. Default: 'r'.
      - callback <Function>
        - err <Error>
        - data <string> | <Buffer>
    */
    this.namespaces = {
      "html": "http://www.w3.org/1999/xhtml",
      "hvml": "https://hypervideo.tech/hvml#",
      "xlink": "http://www.w3.org/1999/xlink",
      "css": "https://www.w3.org/TR/CSS/",
    };

    this.prefixes = Object.keys( this.namespaces ).reduce( ( accumulator, currentPrefix ) => {
      accumulator[this.namespaces[currentPrefix]] = currentPrefix;
      return accumulator;
    }, {} );

    this.ready = ( new Promise( ( resolve, reject ) => {
      fs.readFile( path, encoding, ( error, data ) => {
        if ( error ) {
          // throw new Error( error );
          reject( error );
        }
        resolve( data );
      } );
    } ) ).then( ( data ) => {
      this.xml = xml.parseXmlString( data );
      return this.xml;
    } );
  }

  _jsonifyAttribute( attribute, path = [] ) {
    const namespace = attribute.namespace();
    let property = attribute.value();

    if ( namespace ) {
      property = `${namespace.prefix()}:${property}`;
    }

    // console.log( this.json, path, property );
    set( this.json, path, property );
  }

  _jsonifyChild( child, path = [], domNode = false ) {
    const type = child.type();
    let subpath;
    let name;
    let namespace;
    let prefix;
    let attributes;
    let text;
    let grandchildren;

    switch ( type ) {
      case 'comment':
        break;

      case 'element':
        name = child.name();
        namespace = child.namespace();
        attributes = child.attrs();
        grandchildren = child.childNodes();

        if ( attributes.length ) {
          attributes.forEach( ( attribute ) => {
            this._jsonifyAttribute( attribute, subpath );
          } );
        }

        if ( grandchildren.length ) {
          subpath = path;

          if ( namespace ) {
            prefix = this.prefixes[namespace.href()];

            switch ( prefix ) {
              case 'hvml':
                subpath.push( name );
                break;

              default:
                subpath.push( `${prefix}:${name}` );
            }
          } else {
            subpath.push( name );
          }

          if ( grandchildren.length > 1 ) {
            // console.log( 'prefix', prefix );
            if ( prefix === 'html' ) {
              let i = -1;
              // subpath.pop();
              subpath.push( 'childNodes' );
              subpath.push( null );
              grandchildren.forEach( ( grandchild ) => {
                // console.log( 'i', i );
                subpath.pop();
                subpath.push( ++i );
                const wasBlank = this._jsonifyChild( grandchild, subpath, true );
                if ( wasBlank ) {
                  --i;
                }
              } );
              subpath.pop();
              subpath.pop();
            } else {
              grandchildren.forEach( ( grandchild ) => {
                this._jsonifyChild( grandchild, subpath );
              } );
              subpath.pop();
            }
          } else {
            grandchildren.forEach( ( grandchild ) => {
              this._jsonifyChild( grandchild, subpath );
            } );
            subpath.pop();
          }
        }
        break;

      case 'text':
        text = child.text();
        if ( text.trim() !== '' ) {
          const dupePath = Object.assign( [], path );
          // console.log( path, text );

          if ( domNode ) {
            set( this.json, path, {
              "textContent": child.text(),
            } );
          } else {
            const upone = path[path.length - 1];
            const htmlPos = upone.indexOf( 'html:' );

            if ( htmlPos !== -1 ) {
              dupePath.pop();
              const attrs = child.parent().attrs();
              const obj = {
                "@type": upone.substring( 5 ),
              };

              attrs.forEach( ( attr ) => {
                obj[attr.name()] = attr.value();
              } );

              obj.textContent = text;

              set( this.json, dupePath, obj );
            } else {
              set( this.json, dupePath, text );
            }
          }
        } else {
          return true;
        }
        break;

      case 'attribute':
        break;

      case 'dtd':
        break;

      case 'cdata':
        break;

      case 'pi':
        break;

      default:
    }

    return false;
  }

  toJson() {
    this.json = {
      "@context": "https://redblue.video/guide/hvml.context.jsonld",
    };

    this.xml.root().childNodes().forEach( ( node ) => {
      if ( node.type() === 'element' ) {
        const attributes = node.attrs();
        const children = node.childNodes();

        this.json['@type'] = node.name();

        attributes.forEach( ( attribute ) => {
          this._jsonifyAttribute( attribute );
        } );

        if ( children.length ) {
          children.forEach( ( child ) => {
            this._jsonifyChild( child );
          } );
        }
      }
    } );
    // console.log(  );
    return this.json;
  }
}

// function parse( path, encoding = 'utf8', cb ) {}

// toJson

module.exports = HVML;
