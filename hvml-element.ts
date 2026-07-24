import set from 'lodash.set';
// import Video from './video.js';
import {
  XMLAttribute,
  XMLDocument as ILibxmljsXMLDocument,
  XMLElement,
} from 'libxmljs';

import Data, { LodashPath } from './util/data.js';
import { hasMethod, hasProperty } from './util/types.js';
import { ucFirst } from './util/strings.js';
import {
  createHVMLCollection,
  HVMLNode,
  HVMLTitle,
  IHVMLElement,
  JSONLDSerializedHTMLElement,
} from './types/elements.js';
import { HVMLTypeError } from './util/validation.js';
import { createHVMLElement } from './util/registry.js';

export type HVMLChildCount = {
  count: number;
  i: number;
};
export type HVMLChildCounts = Record<string, HVMLChildCount>;

// export type IHVMLElement = InstanceType<typeof HVMLElement>;

export class HVMLElement extends HVMLNode {
  /**
   * Present on select elements; subclasses narrow this to their own
   * shape (Video: the i18n `VideoTitle` record). `declare` keeps the
   * field type-only. NOTE: an emitted field would leak into
   * serialization, because `_setJsonChild` spreads instances into
   * attribute records.
   */
  declare title?: HVMLTitle;

  json: Partial<IHVMLElement> | null;

  xml: ILibxmljsXMLDocument | null;

  hvmlPath: string | null;

  /**
   * Mapping of URIs to XML namespaces
   */
  prefixes: { [key: string]: string };

  constructor( data?: Partial<IHVMLElement>) {
    super();

    if ( data ) {
      /* istanbul ignore else */
      if ( data.id ) {
        this.id = data.id;
      }
    }

    this.hvmlPath = null;
    /**
     * `null`, not `{}`: `toJson()` installs the JSON-LD boilerplate
     * (`@context`) only when `json` is falsy.
     */
    this.json = null;
    this.prefixes = {};
    this.xml = null;
  }

  /**
   * Fallback for subclasses that don’t declare their own `nodeName`:
   * matches the historical `constructor.name.toLowerCase()` serialization
   * keys. Concrete elements override with a literal tag name.
   */
  get nodeName(): string {
    return this.constructor.name.toLowerCase();
  }

  get _baseErrorData() {
    return {
      "className": this.constructor.name,
    };
  }

  /**
   * `toJson()` establishes `json` before delegating to the `_jsonify*`
   * internals. Each internal also establishes it for itself, so no
   * call order can reach `set( null, … )`.
   */
  /* istanbul ignore next: internals of toJson(), which is already tested */
  _jsonifyAttribute( attribute: XMLAttribute, attributePath: LodashPath = [] ) {
    if ( !this.json ) {
      this.json = Data.getJsonBoilerplate();
    }

    const namespace = attribute.namespace();
    let property = attribute.name();

    if ( namespace ) {
      property = `${namespace.prefix()}:${property}`;
    }

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
    set( this.json, attributePath, attribute.value() );
    attributePath.pop();
  }

  /* istanbul ignore next: internals of toJson(), which is already tested */
  _jsonifyChild(
    child: XMLElement,
    path: LodashPath = [],
    domNode = false,
    childIndex?: number,
  ) {
    if ( !this.json ) {
      this.json = Data.getJsonBoilerplate();
    }

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
          path.push( childIndex! );
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
              /**
               * FIXME: This is the ONLY instance
               * of pushing `null` onto a path, which
               * is causing type-checking issues. I’ve
               * verified that Lodash stringifies `null`s,
               * so it’s not going to cause any runtime errors
               * as far as Lodash is concerned. But nevertheless
               * don’t remember the intent behind this.
               */
              path.push( null! );
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

            if (typeof upone === 'string') {
              const htmlPos = upone.indexOf( 'html:' );

              if ( htmlPos !== -1 ) {
                dupePath.pop();
                const parent = child.parent();
                const attrs = parent && 'attrs' in parent ? parent.attrs() : [];
                const obj: JSONLDSerializedHTMLElement = {
                  "@type": upone.substring( 5 ),
                };

                attrs.forEach( ( attr ) => {
                  obj[attr.name()] = attr.value();
                } );

                obj.textContent = text;

                set( this.json, dupePath, obj );
              } else {
                const parent = child.parent();
                const attrs = parent && 'attrs' in parent ? parent.attrs() : [];

                if ( attrs.length ) {
                  const value = [];
                  const keyValue: Record<string, string> = {};
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
  _setJsonChild( child: HVMLElement, path: LodashPath = [], root = false, atIndex: number | null = null ) {
    if ( !this.json ) {
      this.json = Data.getJsonBoilerplate();
    }

    const { nodeName } = child;
    // const attributes = { ...child };
    let attributes: Partial<HVMLElement> = {};

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
    // Runtime bookkeeping, not part of the HVML vocabulary
    delete attributes.hvmlPath;
    delete attributes.json;
    delete attributes.prefixes;
    delete attributes.xml;

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
      const grandchildCounts: HVMLChildCounts = {};

      grandchildren.forEach( ( grandchild ) => {
        const key = grandchild.nodeName;

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
        const grandchildNodeName = grandchild.nodeName;

        if ( grandchildCounts[grandchildNodeName].count > 1 ) {
          ++grandchildCounts[grandchildNodeName].i;

          this._setJsonChild( grandchild, path, null!, grandchildCounts[grandchildNodeName].i );
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

    if ( this.children?.length ) {
      const path: string[] = [];
      // path.push( nodeName );

      // this.children.forEach( ( child ) => {
      //   this._setJsonChild( child, path, true );
      // } );
      const { children } = this;
      const childCounts: HVMLChildCounts = {};

      children.forEach( ( child ) => {
        const key = child.nodeName;

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
        const childNodeName = child.nodeName;

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

    if ( this.xml ) {
      /**
       * We capture `json` because closures reset TypeScript’s property
       * narrowing. The reference stays current: nothing below
       * reassigns `this.json`, only mutates it.
       */
      const json = this.json;

      this.xml.root()?.childNodes().forEach( ( node ) => {
        if ( node.type() === 'element' ) {
          const attributes = node.attrs();
          const children = node.childNodes();

          json['@type'] = node.name();

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

  _momifyChild(
    /**
     * Technically something like:
     * `HVMLGlobalAttributeName | HVMLElementTagName | ValidXMLGlobalAttributeName`,
     * but `string` is less of a pain in the ass.
     */
    key: string,
    value: string | object,
    target = this.children,
  ) {
    if ( key === '@type' && typeof value === 'string' ) {
      this.children.push( createHVMLElement( value ) ?? new HVMLUnknownElement( value ) );
    } else {
      const lastChild = target[target.length - 1];
      const setMethod = `set${ucFirst( key )}`;

      switch ( typeof value ) {
        case 'string':
          switch ( key ) {
            case 'xml:id':
              lastChild.id = value;
              break;

            case 'title':
              /**
               * `title` is only valid on select elements but there is
               * no way to validate what type we are working with at
               * this stage: the element is built one piece at a time,
               * and type information isn’t necessarily in place yet.
               * The MOM stays permissive; conformance belongs to the
               * RNG validator.
               */
              lastChild.title = value;
              break;

            case 'episode':
            case 'description':
            // case 'type':
            // case 'recorded':
              /* istanbul ignore else: edge case */
              if ( hasMethod( lastChild, setMethod ) ) {
                lastChild[setMethod]( value );
              } else {
                /**
                 * Expando assignment for not-yet-conformant trees. We
                 * go through `Object.assign` because `HVMLElement` has
                 * no string index signature (adding one would defeat
                 * type-checking everywhere else).
                 */
                Object.assign( lastChild, { [key]: value } );
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
              /**
               * TODO: Same as above re `HVMLAnyElement`. Determine whether
               * or not to aggressively narrow here. Do we want to be absolutely
               * type-safe or do we want to support potentially invalid MOM trees
               * and save conformance checking for the RNG schema parser?
               */
              /**
               * We duck-type here rather than test
               * `instanceof HVMLVideoElement`. Importing that class
               * into this module would recreate the
               * `hvml-element` ⇄ `video` circular import. Duck typing
               * also matches the MOM’s tolerance for not-yet-conformant
               * trees; conformance belongs to the RNG validator.
               */
              if ('type' in value && hasMethod(lastChild, 'setDescription')) {
                switch ( value.type ) {
                  case 'xhtml':
                    if ('html:div' in value) {
                      lastChild.setDescription( value['html:div'], 'xhtml' );
                    }
                    break;

                  default:
                    lastChild.setDescription( value );
                    break;
                }
              }

              break;

            default:
              // FIXME: This may be redundant
              lastChild.children.push( createHVMLElement( key ) ?? new HVMLUnknownElement( key ) );
          }
          break;

        default:
      }
    }
  }

  toMom() {
    if ( this.json ) {
      this.children = createHVMLCollection();

      for ( const [key, value] of Object.entries( this.json ) ) {
        if ( ( typeof value === 'string' && value ) || ( typeof value === 'object' && value !== null ) ) {
          this._momifyChild( key, value );
        } else {
          /**
           * TODO: Remains to be seen whether this warrants
           * a type error or not, or if `_momifyChild` should
           * have its type signature updated from `value: string | object`.
           */
          throw new HVMLTypeError({
            badValues: [String( value )],
            expected: ['String', 'Object'],
            got: typeof value,
            input: this.json,
            methodName: 'toMom',
          })
        }
      }
    } 

    if ( this.nodeName !== 'hvml' ) {
      const root = createHVMLElement( 'hvml' );

      /* istanbul ignore next: hvml.ts registers 'hvml' on import */
      if ( !root ) {
        throw new ReferenceError( 'toMom requires the <hvml> element class to be registered — import the package entry point' );
      }

      root.appendChild( this );
      return root;
    }

    return this;
  }

  appendChild( child: HVMLElement ) {
    // const errorData = {
    //   ...this._baseErrorData,
    //   "methodName": "appendChild",
    // };

    this.children.push( child );

    if ( hasProperty( child, 'id' ) && typeof child.id !== 'undefined' ) {
      this.children[child.id] = this.children[this.children.length - 1];
    }
  }

  removeChild( child: HVMLElement ) {
    let i = this.children.length;

    while ( i-- ) {
      const element = this.children[i];

      if ( Object.is( child, this.children[i] ) ) {
        this.children.splice( i, 1 );

        if ( hasProperty( element, 'id' ) && typeof element.id !== 'undefined' ) {
          // eslint-disable-next-line @typescript-eslint/no-array-delete -- we delete the NAMED index here, not an array slot; the rule can’t see the live-collection design
          delete this.children[element.id];
        }
      }
    }
  }
}

/**
 * DOM cue: `HTMLUnknownElement`. Stands in for tags with no registered
 * class, so `children` always holds real elements.
 *
 * The MOM stays permissive about not-yet-conformant trees; conformance
 * checking remains the RNG validator’s job. (This settles the old
 * question in `_momifyChild` about how aggressively to narrow.)
 *
 * A private field backs `nodeName` rather than a plain field, which
 * keeps it out of the serialization attribute spread.
 */
export class HVMLUnknownElement extends HVMLElement {
  #nodeName: string;

  get nodeName(): string {
    return this.#nodeName;
  }

  constructor( nodeName: string, data?: Partial<IHVMLElement> ) {
    super( data );
    this.#nodeName = nodeName;
  }
}

export default HVMLElement;
