import set from 'lodash.set';

// const Video = require( './video' );

import Data from './util/data';
import { hasProperty } from './util/types';
import { ucFirst } from './util/strings';

export class HVMLElement {
  constructor( data ) {
    // super();

    if ( data ) {
      /* istanbul ignore else */
      if ( data.id ) {
        this.id = data.id;
      }
    }

    this.children = [];
  }

  get _baseErrorData() {
    return {
      "className": this.constructor.name,
    };
  }

  /* istanbul ignore next: internals of toJson(), which is already tested */
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

  /* istanbul ignore next: internals of toJson(), which is already tested */
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
                if (
                  ( grandchild.name() === 'animate' )
                  || ( grandchild.name() === 'video' )
                ) {
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

  /* istanbul ignore next: internals of toJson(), which is already tested */
  _setJsonChild(
    child,
    path = [],
    /** @type {boolean | null} */
    root = false,
    atIndex = null,
  ) {
    const nodeName = child.constructor.name.toLowerCase();
    // const attributes = { ...child };
    let attributes = {};

    if ( child.id ) {
      attributes['xml:id'] = child.id;
    }

    if ( child.language && ( child.language !== '_' ) ) {
      if ( child.region && ( child.region !== '_' ) ) {
        attributes['xml:lang'] = `${child.language}-${child.region}`;
      } else {
        attributes['xml:lang'] = child.language;
      }
    }

    attributes = {
      ...attributes,
      ...child,
    };
    delete attributes.id;
    delete attributes.children;
    delete attributes.language;
    delete attributes.region;
    delete attributes.instance;

    // const parentNode = path[path.length - 1 ];

    if ( root ) {
      if ( atIndex !== null ) {
        this.json = {
          ...this.json,
          "@type": nodeName,
        };
        path.push( atIndex );
        set( this.json, path, attributes );
        path.pop();
        path.pop();
      } else {
        this.json = {
          ...this.json,
          "@type": nodeName,
          ...attributes,
        };
        // set( this.json, path, attributes );
      }
    } else {
      path.push( nodeName );

      if ( atIndex !== null ) {
        path.push( atIndex );
        set( this.json, path, attributes );
        path.pop();
        path.pop();
      } else {
        set( this.json, path, attributes );
      }
    }

    if ( child.children.length ) {
      const grandchildren = child.children;
      const grandchildCounts = {};

      grandchildren.forEach( ( grandchild ) => {
        const key = grandchild.constructor.name.toLowerCase();

        if ( hasProperty( grandchildCounts, key ) ) {
          grandchildCounts[key].count += 1;
        } else {
          grandchildCounts[key] = {
            "count": 1,
            "i": -1,
          };
        }
      } );

      grandchildren.forEach( ( grandchild ) => {
        const grandchildNodeName = grandchild.constructor.name.toLowerCase();

        if ( grandchildCounts[grandchildNodeName].count > 1 ) {
          ++grandchildCounts[grandchildNodeName].i;

          this._setJsonChild( grandchild, path, null, grandchildCounts[grandchildNodeName].i );
        } else {
          this._setJsonChild( grandchild, path );
        }
      } );
    }
  }

  toJson() {
    /* istanbul ignore else: assumed to already be set otherwise */
    if ( !this.json ) {
      this.json = Data.getJsonBoilerplate();
    }

    if ( this.children.length ) {
      const path = [];
      // path.push( nodeName );

      // this.children.forEach( ( child ) => {
      //   this._setJsonChild( child, path, true );
      // } );
      const { children } = this;
      const childCounts = {};

      children.forEach( ( child ) => {
        const key = child.constructor.name.toLowerCase();

        if ( hasProperty( childCounts, key ) ) {
          childCounts[key].count += 1;
        } else {
          childCounts[key] = {
            "count": 1,
            "i": -1,
          };
        }
      } );

      children.forEach( ( child ) => {
        const childNodeName = child.constructor.name.toLowerCase();

        if ( childCounts[childNodeName].count > 1 ) {
          path.push( '@list' );
          ++childCounts[childNodeName].i;

          this._setJsonChild( child, path, true, childCounts[childNodeName].i );
          path.pop();
        } else {
          this._setJsonChild( child, path, true );
        }
      } );
    }

    if ( 'xml' in this ) {
      this.xml.root().childNodes().forEach( ( node ) => {
        if ( node.type() === 'element' ) {
          const attributes = node.attrs();
          const children = node.childNodes();

          this.json['@type'] = node.name();

          attributes.forEach( ( attribute ) => {
            this._jsonifyAttribute( attribute );
          } );

          /* istanbul ignore else: optional */
          if ( children.length ) {
            children.forEach( ( child ) => {
              this._jsonifyChild( child );
            } );
          }
        }
      } );
    }

    return this.json;
  }

  _momifyChild( key, value, target = this.children ) {
    if ( key === '@type' ) {
      const className = ucFirst( value );
      this.children.push( new globalThis.HVML[className]() );
    } else {
      const className = ucFirst( key );
      const lastChild = target[target.length - 1];
      const setMethod = `set${ucFirst( key )}`;

      switch ( typeof value ) {
        case 'string':
          switch ( key ) {
            case 'xml:id':
              lastChild.id = value;
              break;

            case 'title':
              lastChild.title = value;
              break;

            case 'episode':
            case 'description':
            // case 'type':
            // case 'recorded':
              /* istanbul ignore else: edge case */
              if ( typeof lastChild[setMethod] === 'function' ) {
                lastChild[setMethod]( value );
              } else {
                lastChild[key] = value;
              }
              break;

            case '@context':
              break;

            default:
              // console.log( key, value );
              break;
          }
          break;

        case 'object':
          switch ( key ) {
            case 'description':
              switch ( value.type ) {
                case 'xhtml':
                  lastChild.setDescription( value['html:div'], 'xhtml' );
                  break;

                default:
                  lastChild.setDescription( value );
                  break;
              }

              break;

            default:
              try {
                lastChild.children.push( new globalThis.HVML[className]() );
              } catch ( error ) {
                lastChild.children.push( className );
              }
          }
          break;

        default:
      }
    }
  }

  toMom() {
    if ( this.json ) {
      this.children = [];

      for ( const [key, value] of Object.entries( this.json ) ) {
        this._momifyChild( key, value );
      }
    }

    if ( this.constructor.name !== 'HVML' ) {
      const hvml = new globalThis.HVML.HVML();
      hvml.appendChild( this );
      return hvml;
    }

    return this;
  }

  appendChild( child ) {
    // const errorData = {
    //   ...this._baseErrorData,
    //   "methodName": "appendChild",
    // };

    this.children.push( child );

    if ( hasProperty( child, 'id' ) ) {
      this.children[child.id] = this.children[this.children.length - 1];
    }
  }

  removeChild( child ) {
    let i = this.children.length;

    while ( i-- ) {
      const element = this.children[i];

      if ( Object.is( child, this.children[i] ) ) {
        this.children.splice( i, 1 );

        if ( hasProperty( element, 'id' ) ) {
          delete this.children[element.id];
        }
      }
    }
  }
}

module.exports = HVMLElement;
