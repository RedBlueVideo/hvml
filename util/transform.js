const md2jsonml = require( 'md2jsonml' );
const xmlTrident = require( 'xml-trident' );
const isString = require( 'lodash.isstring' );
const isPlainObject = require( 'lodash.isplainobject' );

const { softTrim } = require( './strings' );

class Transform {
  static markdownToJsonMl( input ) {
    const jsonML = md2jsonml( input );
    // md2jsonml wraps contents in an <article>,
    // whereas we want a namespaced <div>
    const innerHTML = jsonML.slice( 1 );
    return Transform.wrapJsonMl( innerHTML );
  }

  static toJsonMl( input ) {
    return xmlTrident.toJsonml( input );
  }

  static toXmlString( input ) {
    return xmlTrident.toString( input );
  }

  static get jsonMlWrapper() {
    return ['div', {
      "xmlns": "http://www.w3.org/1999/xhtml",
    }];
  }

  static get xhtmlWrapper() {
    return '<div xmlns="http://www.w3.org/1999/xhtml">$innerHTML</div>';
  }

  static wrapXhtml( innerHTML ) {
    return Transform.xhtmlWrapper.replace( '$innerHTML', innerHTML );
  }

  static wrapJsonMl( innerHTML = [] ) {
    if ( isString( innerHTML ) ) {
      innerHTML = [innerHTML];
    }
    return Transform.jsonMlWrapper.concat( innerHTML );
  }

  static getJsonMlTextContent( jsonML, preserveBRs = false, normalizeWhitespace = false ) {
    let string = '';
    let childNodesOrTextContent;

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
      } else if ( isString( node ) ) {
        // console.log( 'isString: ', `'${node}'` );
        if ( normalizeWhitespace ) {
          string += softTrim( node );
        } else {
          string += node;
        }
      }
    } );

    return string;
  }
}

module.exports = Transform;
