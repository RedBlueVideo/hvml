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

  _jsonifyAttribute( attribute, attributePath = [] ) {
    const namespace = attribute.namespace();
    let property = attribute.name();

    if ( namespace ) {
      property = `${namespace.prefix()}:${property}`;
    }

    // console.log( attributePath, attribute.name() );

    switch ( property ) {
      case 'endtime':
        property = 'endTime';
        break;

      case 'endx':
        property = 'endX';
        break;

      case 'endy':
        property = 'endY';
        break;

      case 'starttime':
        property = 'startTime';
        break;

      case 'startx':
        property = 'startX';
        break;

      case 'starty':
        property = 'startY';
        break;

      default:
    }

    attributePath.push( property );
    // }
    set( this.json, attributePath, attribute.value() );
    attributePath.pop();
  }

  _jsonifyChild( child, path = [], domNode = false, childIndex ) {
    const type = child.type();
    const attributes = child.attrs();
    // let path;
    let name;
    let namespace;
    let prefix;
    let text;
    let grandchildren;

    switch ( type ) {
      case 'comment':
        break;

      case 'element':
        name = child.name();
        namespace = child.namespace();
        grandchildren = child.childNodes();
        // path = path;

        if ( namespace ) {
          prefix = ( namespace.prefix() || this.prefixes[namespace.href()] );

          switch ( prefix ) {
            case 'hvml':
              path.push( name );
              break;

            default:
              path.push( `${prefix}:${name}` );
          }
        } else {
          path.push( name );
        }

        if ( Number.isInteger( childIndex ) ) {
          path.push( childIndex );
        }

        if ( attributes.length ) {
          attributes.forEach( ( attribute ) => {
            this._jsonifyAttribute( attribute, path );
          } );
        }

        if ( grandchildren.length ) {
          if ( grandchildren.length > 1 ) {
            if ( prefix === 'html' ) {
              let i = -1;
              path.push( 'childNodes' );
              path.push( null );
              grandchildren.forEach( ( grandchild ) => {
                path.pop();
                path.push( ++i );
                const wasBlank = this._jsonifyChild( grandchild, path, true );
                if ( wasBlank ) {
                  --i;
                }
              } );
              path.pop();
              path.pop();
              path.pop();
            } else {
              let i = -1;
              let wasBlank;
              grandchildren.forEach( ( grandchild ) => {
                // path.pop();
                ++i;
                if ( grandchild.name() === 'animate' ) {
                  wasBlank = this._jsonifyChild( grandchild, path, false, i );
                  path.pop();
                  path.pop();
                } else {
                  wasBlank = this._jsonifyChild( grandchild, path );
                }
                if ( wasBlank ) {
                  --i;
                }
              } );
              path.pop();
              // path.pop();
              // path.pop();
            }
          } else {
            grandchildren.forEach( ( grandchild ) => {
              // path.pop();
              // path.push( ++i );
              this._jsonifyChild( grandchild, path );
              // if ( wasBlank ) {
              //   --i;
              // }
            } );
            path.pop();
            // path.pop();
          }
        }
        break; // element

      case 'text':
        text = child.text();
        if ( text.trim() !== '' ) {
          const dupePath = Object.assign( [], path );

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
              const attrs = child.parent().attrs();

              if ( attrs.length ) {
                const value = [];
                const keyValue = {};
                attrs.forEach( ( attr ) => {
                  keyValue[attr.name()] = attr.value();
                } );
                value.push( keyValue );
                value.push( text );
                set( this.json, dupePath, value );
              } else {
                set( this.json, dupePath, text );
              }
            }
          }
        } else {
          return true;
        }
        break;

      case 'attribute':
        // set( this.json, path, child.value() );
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
    return this.json;
  }
}

// function parse( path, encoding = 'utf8', cb ) {}

// toJson

module.exports = HVML;
