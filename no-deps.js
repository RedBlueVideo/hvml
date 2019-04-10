/* eslint-disable */
// lol
const parseXML_broken = ( string ) => {
  var tokens = string.split( '<' );
  var json = [];
  var currentNode = json;

  for ( var i = 0; i < tokens.length; i++ ) {
    let currentToken = tokens[i];
    let currentTag = null;
    let attributes = null;
    let textNodes = null;
    let endOfTag = currentToken.indexOf( '>' );
    let childNode = null;

    currentTag = currentToken.substring( 0, endOfTag );
    textNodes = currentToken.substring( endOfTag + 1 );
    attributes = currentTag.split( ' ' );
    currentTag = attributes.shift();
    // console.log( 'currentTag', currentTag );

    switch ( currentToken.charAt( 0 ) ) {
      case '/':
        // if ( currentNode && ( currentTag === currentNode.nodeName ) ) {
        //   currentNode.open = false;
        //   // currentNode = currentNode.parentNode;
        // }
      break;

      case '?':
        currentNode = json[0];
      break;

      default:
        if ( currentTag !== '' ) {
          if ( currentTag === 'hvml' ) {
            json[0] = {
              "nodeName": currentTag,
              // "parentNode": null,
              "open": true,
              "attributes": attributes.join( ' ' ),
              "children": []
            };
            currentNode = json[0];
          } else {
            childNode = {
              "nodeName": currentTag,
              // "parentNode": currentNode,
              "open": true,
              "attributes": ( attributes.join( ' ' ) || null ),
              "children": []
            }
            // console.log( 'currentNode', currentNode );
            currentNode = currentNode || json[0];
            currentNode.children.push( childNode );
            currentNode = currentNode.children[currentNode.children.length - 1];
          }
        }
        // if ( textNodes.length ) {
        //   currentNode.children.push( textNodes );
        // }
      // default
    }

    // console.log( currentNode );
  } // for

  console.log( json );
};

const parseXML_almostThere = ( string ) => {
  var tokens = string.split( '<' );
  var json = [];
  var jsonString = '[';
  var currentNode = json;

  for ( let i = 0; i < tokens.length; ++i ) {
    let currentToken = tokens[i];
    let currentTag = null;
    let attributes = null;
    let textNodes = null;
    let endOfTag = currentToken.indexOf( '>' );
    let childNode = null;

    currentTag = currentToken.substring( 0, endOfTag );
    textNodes = currentToken.substring( endOfTag + 1 );
    attributes = currentTag.split( ' ' );
    currentTag = attributes.shift();
    attributes = attributes.join(' ').replace( /"/g, '\\"' );

    if ( ( currentTag !== '' ) && ( currentTag !== '?xml' ) ) {
      // console.log( 'currentTag', currentTag );

      if ( currentTag.charAt( 0 ) !== '/' ) {
        jsonString += `{ "index": ${i}, "nodeName": "${currentTag}", "attributes": ${attributes ? '"' + attributes + '"' : 'null'}, "children": [`;
        // if the following tag is a closer

        let textNode = `"${textNodes.replace( /"/g, '\\"' )}"`;
        if ( textNode !== '""' ) {
          jsonString += textNode + ', ';
        }

        let j = 1;
        while ( !( new RegExp( `\/${currentTag}` ) ).test( tokens[i + j] ) ) {
          if ( tokens[i + j].charAt( 0 ) !== '/' ) {
            // console.log( tokens[i + j] );
            jsonString += `${i + j}, `;
          }
          ++j;
        }

        jsonString += "] }";

        if ( i < tokens.length - 1 ) {
          jsonString += ', ';
        }
      }
    }
  } // for

  jsonString += ']';
  jsonString = jsonString.replace( /,\s+\]/g, ']' ).replace( /\[\s*(['"])\1\s*\]/g, '[]' );
  console.log( jsonString );
  json = JSON.parse( jsonString );

  var processed = [];

  // for ( let i = 0; i < json.length; ++i ) {
  //   if ( json[i].children.length ) {
  //     for ( let j = 0; j < json[i].children.length; ++j ) {
  //       json[i].children[j]
  //     }
  //   }
  // }

  // console.log( 'tokens[42]', tokens[42] );

  console.log( json );
};