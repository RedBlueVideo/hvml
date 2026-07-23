import md2jsonml from 'md2jsonml';
/**
 * TODO: Deprecated package. Migrate to `slimdom-sax-parser`.
 */
import { toJsonml, toString } from 'xml-trident';
import { isString, isPlainObject } from './types.js';
import { softTrim } from './strings.js';

import type { JSONML, JSONMLAttributes, JSONMLNode } from './data.js';

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
