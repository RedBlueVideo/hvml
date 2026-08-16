import HVMLElement, { HVMLUnknownElement } from './hvml-element.js';
import Transform from './util/transform.js';
import Validation from './util/validation.js';
import { defineHVMLElement, createHVMLElement } from './util/registry.js';
import { createHVMLCollection } from './types/elements.js';
import { payloadNodesOf } from './util/payload.js';
import type { HVMLXhtmlPayloadInput } from './types/elements.js';
import type { JSONML, JSONMLAttributes, JSONMLNode } from './util/data.js';

/**
 * Typed payload carrier, following the same pattern as
 * `description type="xhtml"` (and Atom’s element of the same job).
 *
 * The payload state lives in `children`, in the same shapes `toMom`’s
 * generic XHTML reconstruction produces — an `html:div` element whose
 * descendants are named from `@type`, with text runs as `#text` nodes
 * or `textContent` leaves — so payloads parsed from documents surface
 * through `getContent()`, and payloads set imperatively serialize
 * back through the ordinary child-element path.
 */
class Content extends HVMLElement {
  get nodeName(): string {
    return 'content';
  }

  declare type?: 'text' | 'html' | 'xhtml';

  declare textContent?: string;

  setContent( content: string, type?: 'text' ): void;

  setContent( content: string | HVMLXhtmlPayloadInput, type: 'xhtml' ): void;

  setContent( content: string | HVMLXhtmlPayloadInput, type: 'text' | 'xhtml' = 'text' ) {
    const errorData = {
      ...this._baseErrorData,
      "methodName": "setContent",
      "fieldName": "content",
      "input": content,
      "expected": ["String", "Object"],
    };

    switch ( type ) {
      case 'xhtml': {
        let xhtml;

        if ( typeof content === 'string' ) {
          xhtml = Transform.wrapXhtml( content.trim() );
        } else if ( Array.isArray( content.childNodes ) ) {
          xhtml = Transform.jsonLdChildNodesToXhtml( content.childNodes );
        } else {
          throw new Validation.TypeError( errorData );
        }

        const documentJsonMl = Transform.xmlStringToJsonMl( xhtml );
        const divJsonMl = documentJsonMl[1];

        /* istanbul ignore next: wrapXhtml guarantees a root div */
        if ( !Array.isArray( divJsonMl ) ) {
          throw new Validation.TypeError( errorData );
        }

        this.type = 'xhtml';
        delete this.textContent;
        this.children = createHVMLCollection();
        this.children.push( this._buildPayloadElement( 'html:div', divJsonMl ) );
        break;
      }

      case 'text':
      default:
        if ( typeof content !== 'string' ) {
          throw new Validation.TypeError( errorData );
        }

        this.type = 'text';
        this.children = createHVMLCollection();
        this.textContent = content.trim();
    }
  }

  getContent( type: 'text' | 'xhtml' = 'text' ): string | null {
    const div = this.children.filter( ( child ) => child.nodeName === 'html:div' )[0];

    if ( div ) {
      const payloadJsonMl = Transform.wrapJsonMl( payloadNodesOf( div ) );

      if ( type === 'xhtml' ) {
        return Transform.jsonMlToXmlString( payloadJsonMl );
      }

      return Transform.getJsonMlTextContent( payloadJsonMl, true, true );
    }

    if ( typeof this.textContent === 'string' ) {
      if ( type === 'xhtml' ) {
        return Transform.wrapXhtml( this.textContent );
      }

      return this.textContent;
    }

    return null;
  }

  /**
   * One JSON-ML node → one MOM element, in the generic
   * reconstruction’s shapes: attributes as expando properties, a lone
   * text run as a `textContent` leaf, mixed content as children with
   * `#text` nodes. The `html:div` root keeps its prefixed name (the
   * JSON serialization’s key); descendants are named barely, matching
   * `@type` reconstruction. The wrapper’s `xmlns` is a namespace
   * declaration, not payload data, so it never lands as an expando.
   */
  _buildPayloadElement( name: string, jsonMl: JSONML ): HVMLElement {
    const element = createHVMLElement( name ) ?? new HVMLUnknownElement( name );
    let contentNodes: ( JSONMLAttributes | JSONMLNode )[];

    if ( isPlainAttributes( jsonMl[1] ) ) {
      const attributes = { ...jsonMl[1] };
      delete attributes.xmlns;
      Object.assign( element, attributes );
      contentNodes = jsonMl.slice( 2 );
    } else {
      contentNodes = jsonMl.slice( 1 );
    }

    if ( ( contentNodes.length === 1 ) && ( typeof contentNodes[0] === 'string' ) ) {
      Object.assign( element, { "textContent": contentNodes[0] } );
      return element;
    }

    contentNodes.forEach( ( node ) => {
      if ( typeof node === 'string' ) {
        const textNode = new HVMLUnknownElement( '#text' );
        Object.assign( textNode, { "textContent": node } );
        element.children.push( textNode );
      } else if ( Array.isArray( node ) ) {
        element.children.push( this._buildPayloadElement( node[0], node ) );
      }
    } );

    return element;
  }
}

function isPlainAttributes( node: JSONMLAttributes | JSONMLNode | undefined ): node is JSONMLAttributes {
  return ( typeof node === 'object' ) && !Array.isArray( node ) && ( node !== null );
}

export default Content;

defineHVMLElement( 'content', Content );
