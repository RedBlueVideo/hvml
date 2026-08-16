import md2jsonml from 'md2jsonml';
/**
 * TODO: Deprecated package. Migrate to `slimdom-sax-parser`.
 */
import { toJsonml, toString } from 'xml-trident';
import { isString, isPlainObject } from './types.js';
import { softTrim } from './strings.js';

import type { JSONML, JSONMLAttributes, JSONMLNode } from './data.js';
import type { JSONLDSerializedHTMLElement } from '../types/elements.js';

export type { JSONML } from './data.js';

class Transform {
  static markdownToJsonMl( input: string ) {
    const jsonML = md2jsonml( input );
    // md2jsonml wraps contents in an <article>,
    // whereas we want a namespaced <div>
    const innerHTML = jsonML.slice( 1 );
    return Transform.wrapJsonMl( innerHTML );
  }

  static xmlStringToJsonMl( input: string ) {
    return toJsonml( input );
  }

  static jsonMlToXmlString( input: JSONML ) {
    return toString( input );
  }

  static get jsonMlWrapper(): JSONML {
    return ['div', {
      "xmlns": "http://www.w3.org/1999/xhtml",
    }];
  }

  static get xhtmlWrapper() {
    return '<div xmlns="http://www.w3.org/1999/xhtml">$innerHTML</div>';
  }

  static wrapXhtml( innerHTML: string ) {
    return Transform.xhtmlWrapper.replace( '$innerHTML', innerHTML );
  }

  static wrapJsonMl( childNodes: ( JSONMLAttributes | JSONMLNode )[] ): JSONML {
    return [...Transform.jsonMlWrapper, ...childNodes];
  }

  /**
   * JSON-LD-serialized HTML (an `html:div`’s `childNodes` list) as
   * JSON-ML nodes: a node without `@type` is a text run; `@type` names
   * the element, every other string-valued key is an attribute, and
   * `textContent` or a nested `childNodes` list carries the content.
   */
  static jsonLdChildNodesToJsonMl( childNodes: JSONLDSerializedHTMLElement[] ): JSONMLNode[] {
    return childNodes.map( ( childNode ): JSONMLNode => {
      const { '@type': tagName, textContent, childNodes: nestedChildNodes, ...rest } = childNode;

      if ( typeof tagName !== 'string' ) {
        return ( typeof textContent === 'string' ) ? textContent : '';
      }

      const attributes: JSONMLAttributes = {};

      Object.entries( rest ).forEach( ( [key, value] ) => {
        if ( typeof value === 'string' ) {
          attributes[key] = value;
        }
      } );

      if ( Array.isArray( nestedChildNodes ) ) {
        return [tagName, attributes, ...Transform.jsonLdChildNodesToJsonMl( nestedChildNodes as JSONLDSerializedHTMLElement[] )];
      }

      if ( typeof textContent === 'string' ) {
        return [tagName, attributes, textContent];
      }

      return [tagName, attributes];
    } );
  }

  /**
   * The inverse: JSON-ML nodes as JSON-LD-serialized HTML. An element
   * with a lone text run carries `textContent`; one with element
   * children carries a nested `childNodes` list. Whitespace-only text
   * between elements is authoring layout, not content, and is
   * dropped, as the XML path drops it.
   */
  static jsonMlNodesToJsonLdChildNodes( nodes: JSONMLNode[] ): JSONLDSerializedHTMLElement[] {
    return Transform.significantNodes( nodes ).map( ( node ): JSONLDSerializedHTMLElement => {
      if ( typeof node === 'string' ) {
        return { "textContent": node };
      }

      const [tagName, ...rest] = node;
      const attributes = isPlainObject( rest[0] ) ? { ...( rest[0] as JSONMLAttributes ) } : {};
      const contentNodes = ( isPlainObject( rest[0] ) ? rest.slice( 1 ) : rest ) as JSONMLNode[];

      // A namespace declaration, not payload data
      delete attributes.xmlns;

      return {
        "@type": tagName,
        ...attributes,
        ...Transform.jsonLdPayloadOf( contentNodes ),
      };
    } );
  }

  /**
   * The JSON-LD content of an XHTML element, from its JSON-ML nodes:
   * `{ textContent }` for a lone text run, `{ childNodes }` for
   * anything containing elements, `{}` for nothing at all.
   */
  static jsonLdPayloadOf( nodes: JSONMLNode[] ): JSONLDSerializedHTMLElement {
    const significant = Transform.significantNodes( nodes );

    if ( !significant.length ) {
      return {};
    }

    if ( ( significant.length === 1 ) && ( typeof significant[0] === 'string' ) ) {
      return { "textContent": significant[0] };
    }

    return { "childNodes": Transform.jsonMlNodesToJsonLdChildNodes( significant ) };
  }

  static significantNodes( nodes: JSONMLNode[] ): JSONMLNode[] {
    return nodes.filter( ( node ) => ( typeof node !== 'string' ) || ( node.trim() !== '' ) );
  }

  /**
   * JSON-LD-serialized HTML as a namespaced XHTML string, wrapped in
   * the `div` the payload elements carry in XML. Shared by the
   * `description` and `content` payload setters.
   */
  static jsonLdChildNodesToXhtml( childNodes: JSONLDSerializedHTMLElement[] ): string {
    return Transform.jsonMlToXmlString(
      Transform.wrapJsonMl( Transform.jsonLdChildNodesToJsonMl( childNodes ) ),
    );
  }

  static getJsonMlTextContent( jsonML: JSONML, preserveBRs = false, normalizeWhitespace = false ) {
    let string = '';
    let childNodesOrTextContent: ( JSONMLAttributes | JSONMLNode )[];

    if ( isPlainObject( jsonML[1] ) ) {
      childNodesOrTextContent = jsonML.slice( 2 );
    } else {
      childNodesOrTextContent = jsonML.slice( 1 );
    }

    childNodesOrTextContent.forEach( ( node ) => {
      if ( Array.isArray( node ) ) {
        if ( preserveBRs && ( node[0].toLowerCase() === 'br' ) ) {
          string += '\n';
        } else {
          string += Transform.getJsonMlTextContent( node, preserveBRs, normalizeWhitespace );
        }
      } else {
        // This block only triggers inside a recursion,
        // which instanbul/nyc is not picking up on
        /* istanbul ignore next */
        if ( isString( node ) ) {
          // console.log( 'isString: ', `'${node}'` );
          if ( normalizeWhitespace ) {
            string += softTrim( node );
          } else {
            string += node;
          }
        }
      }
    } );

    return string;
  }
}

export default Transform;
