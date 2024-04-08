import { XMLAttribute, XMLElement, XMLNode } from "libxmljs";

export function isNumber( number ) {
  return ( typeof number === 'number' );
}

export function isPlainObject( object ) {
  return ( Object.prototype.toString.call( object ) === '[object Object]' );
}

export function isString( string ) {
  return (
    ( typeof string === 'string' )
    || ( Object.prototype.toString.call( string ) === '[object String]' )
  );
}

export function isUndefined( object ) {
  return ( typeof object === 'undefined' );
}

export function hasProperty( object, property ) {
  return Object.prototype.hasOwnProperty.call( object, property );
}

/**
 * libxmljs utility
 */
export function isXmlElement( node: any ): node is XMLElement {
  if ( 'type' in node && node.type() === 'element' ) {
    return true;
  }

  return false;
}

/**
 * libxmljs utility
 */
export function isXmlAttribute( node: any ): node is XMLAttribute {
  if ( node && 'type' in node && ( node as XMLNode ).type() === 'attribute' ) {
    return true;
  }

  return false;
}

/**
 * libxmljs utility
 */
export function isXmlNode( node: any ): node is XMLNode {
  if ( node && 'type' in node && ( node as XMLNode ).type() === 'node' ) {
    return true;
  }

  return false;
}


/**
 * libxmljs utility
 */
export function isXmlDocument( node: any ): node is XMLDocument {
  if ( node && 'type' in node && ( node as XMLNode ).type() === 'document' ) {
    return true;
  }

  return false;
}
