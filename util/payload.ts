import type { HVMLElement } from '../hvml-element.js';
import type { JSONMLAttributes, JSONMLNode } from './data.js';

/**
 * Instance fields that are MOM bookkeeping rather than serialized
 * attributes; the same set the MOM serializer deletes before
 * spreading an element into its JSON attributes. `textContent` rides
 * along because it is an element’s text, never an attribute.
 */
export const MOM_BOOKKEEPING_KEYS = [
  'children',
  'hvmlPath',
  'id',
  'instance',
  'json',
  'language',
  'prefixes',
  'region',
  'textContent',
  'xml',
];

/**
 * `textContent` expandos live on reconstructed elements (`#text`
 * nodes, text-only leaves), which the base class doesn’t declare.
 */
export function textContentOf( element: HVMLElement ): string | undefined {
  const value = ( element as { textContent?: unknown } ).textContent;
  return ( typeof value === 'string' ) ? value : undefined;
}

/**
 * The string-valued own properties of an element, minus bookkeeping:
 * its attributes, as the JSON-ML and JSON-LD payload forms carry them.
 */
export function payloadAttributesOf( element: HVMLElement ): JSONMLAttributes {
  const attributes: JSONMLAttributes = {};

  Object.entries( element ).forEach( ( [key, value] ) => {
    if ( ( typeof value === 'string' ) && !MOM_BOOKKEEPING_KEYS.includes( key ) ) {
      attributes[key] = value;
    }
  } );

  return attributes;
}

/**
 * An XHTML payload element’s content as JSON-ML nodes, walking the
 * shapes the generic reconstruction produces: a lone text run as a
 * `textContent` leaf, mixed content as children with `#text` nodes.
 * Descendants keep bare names in JSON-ML (`p`, not `html:p`).
 */
export function payloadNodesOf( element: HVMLElement ): JSONMLNode[] {
  const ownText = textContentOf( element );

  if ( typeof ownText === 'string' ) {
    return [ownText];
  }

  return element.children.map( ( child ): JSONMLNode => {
    if ( child.nodeName === '#text' ) {
      return textContentOf( child ) ?? '';
    }

    const name = child.nodeName.replace( /^html:/, '' );

    return [name, payloadAttributesOf( child ), ...payloadNodesOf( child )];
  } );
}
