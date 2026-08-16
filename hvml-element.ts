import set from 'lodash.set';
// import Video from './video.js';
import {
  XMLAttribute,
  XMLDocument as ILibxmljsXMLDocument,
  XMLElement,
} from 'libxmljs';

import Data, { LodashPath } from './util/data.js';
import { emitTypedScalar } from './util/datatypes.js';
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
import { getBaseFromContext, mintIri } from './util/iri.js';

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

    let property = getQualifiedAttributeName( attribute );

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
    set( this.json, attributePath, emitTypedScalar( property, attribute.value() ) );
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
              /**
               * Mirrors the MOM serializer (`_setJsonChild`): same-element
               * siblings (multiple `presentation`s, etc.) are indexed
               * numerically, and then fed into `lodash.set()` to develop
               * a compact, human-readable JSON representation of the node
               * tree. Elements that occur once remain single objects.
               * Text nodes (whitespace, in practice) are excluded from
               * the tally.
               */
              const elementCounts: HVMLChildCounts = {};

              grandchildren.forEach( ( grandchild ) => {
                if ( grandchild.type() === 'element' ) {
                  const key = grandchild.name();

                  if ( hasProperty( elementCounts, key ) ) {
                    elementCounts[key].count += 1;
                  } else {
                    elementCounts[key] = {
                      "count": 1,
                      "i": -1,
                    };
                  }
                }
              } );

              grandchildren.forEach( ( grandchild ) => {
                /**
                 * A recursion may leave its own name (and index) on the
                 * shared path: childless elements have no grandchildren
                 * loop to pop them, and indexed elements pop differently
                 * depending on whether they have children. We snapshot
                 * the depth and restore it after every sibling, so no
                 * sibling can disturb the next one's path.
                 */
                const depth = path.length;

                if (
                  ( grandchild.type() === 'element' )
                  && ( elementCounts[grandchild.name()].count > 1 )
                ) {
                  this._jsonifyChild( grandchild, path, false, ++elementCounts[grandchild.name()].i );
                } else {
                  this._jsonifyChild( grandchild, path );
                }

                while ( path.length > depth ) {
                  path.pop();
                }
              } );
              path.pop();
            }
          } else {
            grandchildren.forEach( ( grandchild ) => {
              // Same depth discipline as the multi-child loop above
              const depth = path.length;
              const wasBlank = this._jsonifyChild( grandchild, path );

              while ( path.length > depth ) {
                path.pop();
              }

              if ( wasBlank && !attributes.length ) {
                // Whitespace-only content is empty content: same rule
                // as the childless branch below. (Non-null assertion:
                // closures reset the narrowing from the guard above.)
                set( this.json!, path, {} );
              }
            } );
            path.pop();
          }
        } else if ( !attributes.length ) {
          /**
           * An element with no attributes and no children never reaches
           * `set()`, so its key would vanish from the JSON. We emit an
           * empty object instead: the canonical representation of an
           * empty element on both serialization paths (the MOM
           * serializer already produces `{}` for elements created
           * without data).
           */
          set( this.json, path, {} );
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
                const obj: JSONLDSerializedHTMLElement = {};

                /**
                 * Two slot shapes for a text-only XHTML element: a
                 * positional `childNodes` index carries no element
                 * name, so the node states its own via `@type`; a
                 * name-keyed slot (`html:div` directly under a typed
                 * payload like `content`) already carries it, and
                 * hoisting the payload one level up would overwrite
                 * the containing element and its attributes.
                 */
                const slotIsPositional = ( typeof dupePath[dupePath.length - 1] === 'number' );

                if ( slotIsPositional ) {
                  obj['@type'] = upone.substring( 5 );
                }

                attrs.forEach( ( attr ) => {
                  obj[attr.name()] = attr.value();
                } );

                obj.textContent = text;

                set( this.json, slotIsPositional ? dupePath : path, obj );
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
                  value.push( emitTypedScalar( upone, text ) );
                  set( this.json, dupePath, value );
                } else {
                  set( this.json, dupePath, emitTypedScalar( upone, text ) );
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

    /**
     * The MOM stores every scalar in its XML lexical form (`toMom`
     * normalizes JSON numbers and booleans to strings on ingestion),
     * so grammar-typed terms convert back on the way out.
     */
    for ( const [term, value] of Object.entries( attributes ) ) {
      if ( typeof value === 'string' ) {
        ( attributes as Record<string, unknown> )[term] = emitTypedScalar( term, value );
      }
    }

    // const parentNode = path[path.length - 1 ];

    if ( root ) {
      if ( atIndex !== null ) {
        path.push( atIndex );
        set( this.json, path, {
          "@type": nodeName,
          ...attributes,
        } );
        /**
         * The path keeps this node's prefix (e.g. ['@graph', 0]) so
         * the descendant loop below writes inside the node. Callers
         * hand each root child a fresh path array, so there are no
         * shared-path pops to balance.
         */
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
      /**
       * Same-name children are tallied across the entire sibling set,
       * not just adjacent runs, because this serialization treats child
       * elements as *properties* of their parent, JSON-LD-style:
       * <presentation/><title/><presentation/> and
       * <presentation/><presentation/><title/> both mean “a video with
       * two presentations and a title”. JSON forbids duplicate keys, so
       * multi-valued properties are rendered as arrays. Relative order
       * within one name survives in array order; interleaving across
       * names is discarded as authoring accident, not semantics.
       * Embedded XHTML takes the opposite path (a `childNodes` list)
       * because prose is mixed content: there, interleaving IS the
       * meaning.
       *
       * NOTE: this shape suits record-like content models. If the
       * vocabulary ever gains sequence-like models where order across
       * different element names is semantic (EDL-style edit sequences),
       * those will need an explicit ordering affordance.
       */
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
      const { children } = this;

      if ( children.length > 1 ) {
        /**
         * Multiple root-level children form a JSON-LD named graph:
         * one node per child, each carrying its own `@type`. (The
         * earlier `@list` shape expanded to zero nodes; a list
         * object in node position generates no triples.)
         */
        children.forEach( ( child, index ) => {
          this._setJsonChild( child, ['@graph'], true, index );
        } );
      } else {
        this._setJsonChild( children[0], [], true );
      }
    }

    if ( this.xml ) {
      /**
       * We capture `json` because closures reset TypeScript’s property
       * narrowing. The reference remains current: nothing below
       * reassigns `this.json`, only mutates it.
       */
      const json = this.json;

      const rootChildren = ( this.xml.root()?.childNodes() ?? [] ).filter(
        ( node ) => ( node.type() === 'element' ),
      );

      rootChildren.forEach( ( node, index ) => {
        /**
         * A single root element serializes as the top-level object;
         * two or more form a JSON-LD named graph, one node apiece,
         * each carrying its own `@type`.
         */
        const nodePath: LodashPath = ( rootChildren.length > 1 ) ? ['@graph', index] : [];
        const attributes = node.attrs();
        const children = node.childNodes();

        if ( nodePath.length ) {
          set( json, [...nodePath, '@type'], node.name() );
        } else {
          json['@type'] = node.name();
        }

        attributes.forEach( ( attribute ) => {
          this._jsonifyAttribute( attribute, nodePath );
        } );

        /* istanbul ignore else: optional */
        if ( children.length ) {
          const childCounts: HVMLChildCounts = {};

          children.forEach( ( child ) => {
            if ( child.type() === 'element' ) {
              const key = child.name();

              if ( hasProperty( childCounts, key ) ) {
                childCounts[key].count += 1;
              } else {
                childCounts[key] = {
                  "count": 1,
                  "i": -1,
                };
              }
            }
          } );

          children.forEach( ( child ) => {
            if (
              ( child.type() === 'element' )
              && ( childCounts[child.name()].count > 1 )
            ) {
              // Each root-level child is handed a fresh path array;
              // there are no shared-path pops to balance here
              this._jsonifyChild( child, [...nodePath], false, ++childCounts[child.name()].i );
            } else {
              this._jsonifyChild( child, [...nodePath] );
            }
          } );
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
    value: string | object | number | boolean | null,
    target = this.children,
  ) {
    if ( value === null ) {
      // Same rule as `toMom()`: JSON-LD drops null entries during
      // expansion, so we skip them at every nesting depth
      return;
    }

    if ( ( typeof value === 'number' ) || ( typeof value === 'boolean' ) ) {
      /**
       * JSON's typed scalars map to XSD lexical forms on the XML side
       * (23 ↔ "23" under xs:nonNegativeInteger; the grammar already
       * declares the XML Schema datatype library), so we carry the
       * lexical form rather than rejecting the value. Emitting typed
       * JSON back out belongs to the context layer, where the
       * grammar's datatypes can drive it.
       */
      this._momifyChild( key, String( value ), target );
      return;
    }

    /**
     * `@type` names the element its containing object describes. When
     * we build an element from an object value, `@type` is consumed as
     * its `nodeName`; the document root has no containing object, so
     * it is handled here.
     */
    if ( key === '@type' && typeof value === 'string' ) {
      target.push( createHVMLElement( value ) ?? new HVMLUnknownElement( value ) );
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
               * The MOM is permissive; conformance belongs to the
               * RNG validator.
               */
              lastChild.title = value;
              break;

            case '@context':
              break;

            default:
              /**
               * Every other string term is preserved generically: a
               * dedicated setter wins when the class defines one
               * (`setEpisode`, `setDescription`); otherwise the value
               * lands as an expando property so no term is silently
               * dropped. We go through `Object.assign` because
               * `HVMLElement` has no string index signature (adding
               * one would defeat type-checking everywhere else).
               */
              if ( hasMethod( lastChild, setMethod ) ) {
                lastChild[setMethod]( value );
              } else {
                Object.assign( lastChild, { [key]: value } );
              }
              break;
          }
          break;

        case 'object':
          switch ( key ) {
            case '@graph':
              /**
               * A named graph holds root-level siblings. Each node
               * names its element via its own `@type` and lands in
               * the current target, never nested under the previous
               * child the way ordinary object values are. Nodes
               * without a string `@type` cannot be named and are
               * skipped, matching the `@context` drop above.
               */
              if ( Array.isArray( value ) ) {
                ( value as Record<string, unknown>[] ).forEach( ( node ) => {
                  const { '@type': nodeType, ...nodeTerms } = node;

                  if ( typeof nodeType !== 'string' ) {
                    return;
                  }

                  this._momifyChild( '@type', nodeType, target );

                  Object.entries( nodeTerms ).forEach( ( [nodeKey, nodeValue] ) => {
                    this._momifyChild( nodeKey, nodeValue as string | object | number | boolean | null, target );
                  } );
                } );
              }

              break;

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
              if ( Array.isArray( value ) ) {
                /**
                 * A JSON array under an element-name key holds repeated
                 * same-name elements (`presentation: [ {…}, {…} ]`, the
                 * XML serializer's canonical shape): we build one child
                 * element per entry.
                 */
                value.forEach( ( entry: string | object | null ) => {
                  this._momifyChild( key, entry, target );
                } );
              } else {
                /**
                 * Embedded XHTML serializes to JSON as `childNodes`
                 * lists, where position rather than a key locates each
                 * node: the node's tag name travels in `@type`, and
                 * text nodes have none. `@type` therefore becomes the
                 * new element's `nodeName`, `childNodes` entries
                 * without one become `#text` nodes, and every other
                 * object is named by its key.
                 */
                const valueRecord = value as Record<string, unknown>;
                let newChildName = key;

                if ( typeof valueRecord['@type'] === 'string' ) {
                  newChildName = valueRecord['@type'];
                } else if ( key === 'childNodes' ) {
                  newChildName = '#text';
                }

                lastChild.children.push( createHVMLElement( newChildName ) ?? new HVMLUnknownElement( newChildName ) );

                /**
                 * Recurse so nested terms build out the new element's
                 * own properties and children; without this, `showing`,
                 * `venue`, and company arrive as empty shells. `@type`
                 * is consumed above as the node name, so we skip it
                 * here.
                 */
                Object.entries( value ).forEach( ( [nestedKey, nestedValue] ) => {
                  if ( nestedKey === '@type' ) {
                    return;
                  }

                  this._momifyChild( nestedKey, nestedValue as string | object | number | boolean | null, lastChild.children );
                } );
              }
          }
          break;

        /* istanbul ignore next: defensive */
        default:
          /**
           * Numbers and booleans normalize to strings above, and JSON
           * cannot produce the remaining types (undefined, function,
           * symbol), so this throw only fires on programmatic misuse.
           */
          throw new HVMLTypeError({
            badValues: [String( value )],
            expected: ['String', 'Object'],
            got: typeof value,
            input: { [key]: value },
            methodName: '_momifyChild',
          });
      }
    }
  }

  toMom() {
    if ( this.json ) {
      this.children = createHVMLCollection();

      for ( const [key, value] of Object.entries( this.json ) ) {
        if ( value === null ) {
          /**
           * JSON-LD gives `null` a defined meaning: the entry is
           * dropped during expansion, as if the key were absent.
           * We follow suit rather than treating it as an authoring
           * error.
           */
          continue;
        }

        if (
          ( typeof value === 'string' )
          || ( typeof value === 'object' )
          || ( typeof value === 'number' )
          || ( typeof value === 'boolean' )
        ) {
          this._momifyChild( key, value );
        } else {
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

  /**
   * DOM cue: `getElementById`. Depth-first over descendants; the
   * receiver itself is never a match.
   */
  getElementByXmlId( xmlId: string ): HVMLElement | null {
    for ( const child of this.children ) {
      if ( child.id === xmlId ) {
        return child;
      }

      const match = child.getElementByXmlId( xmlId );

      if ( match ) {
        return match;
      }
    }

    return null;
  }

  /**
   * The document base, read from whichever representation this
   * element holds: `xml:base` on the MOM root, the XML root’s
   * `xml:base`, or `@base` in the JSON `@context`. `null` when none is
   * declared: the document mints only local names.
   */
  getBase(): string | null {
    if ( this['xml:base'] ) {
      return this['xml:base'];
    }

    const xmlRoot = this.xml?.root();

    if ( xmlRoot ) {
      const base = getXmlAttributeValue( xmlRoot.attrs(), 'xml:base' );

      if ( base ) {
        return base;
      }
    }

    return getBaseFromContext( this.json?.['@context'] );
  }

  /**
   * The IRI this document gives `element`, for a receiver that is the
   * document root: the cited `about` when present; else the minted
   * IRI when the document declares a base and the element carries an
   * `xml:id` (the primary child mints the base itself, every other
   * element a fragment); else `null`, a blank node.
   */
  getIri( element: HVMLElement ): string | null {
    const about = getAbout( element );

    if ( about ) {
      return about;
    }

    const base = this.getBase();

    if ( !base || !element.id ) {
      return null;
    }

    return mintIri( base, element.id, this.children[0] === element );
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
 * `prefix:name` for a namespaced attribute (`xml:id`, `xlink:href`),
 * the bare name otherwise: the key the serialization uses.
 */
function getQualifiedAttributeName( attribute: XMLAttribute ): string {
  const namespace = attribute.namespace();
  const name = attribute.name();

  return namespace ? `${namespace.prefix()}:${name}` : name;
}

function getXmlAttributeValue( attributes: XMLAttribute[], qualifiedName: string ): string | null {
  const attribute = attributes.find( ( candidate ) => getQualifiedAttributeName( candidate ) === qualifiedName );

  return attribute ? attribute.value() : null;
}

/**
 * `about` is declared per subject-bearing class rather than on the
 * base element, and ingest sets it as an expando on whichever element
 * carries it.
 */
function getAbout( element: HVMLElement ): string | null {
  const value = ( element as { about?: unknown } ).about;

  return ( typeof value === 'string' && value ) ? value : null;
}

/**
 * DOM cue: `HTMLUnknownElement`. Stands in for tags with no registered
 * class, so `children` always holds real elements.
 *
 * The MOM is permissive about not-yet-conformant trees; conformance
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
