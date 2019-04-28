const fs = require( 'fs' );
const set = require( 'lodash.set' ); // eslint-disable-line lodash/import-scope
const { extname } = require( 'path' );
const { exec } = require( 'child_process' );

const Video = require( './video' );
const Validation = require( './util/validation' );
const { hasProperty } = require( './util/types.js' );

let xml;
let canParseXml = false;

try {
  xml = require( 'libxmljs' ); /* eslint-disable-line global-require */ /* eslint-disable-line import/no-extraneous-dependencies */
  /* istanbul ignore next */
  if ( hasProperty( xml, 'parseXmlString' ) ) {
    canParseXml = true;
  }
} catch ( error ) {
  // eslint-disable-line no-empty
}

class HVML {
  constructor( path, config = {} ) {
    /*
      fs.readFile(path[, options], callback)
      - path <string> | <Buffer> | <URL> | <integer> filename or file descriptor
      - options <Object> | <string>
        - encoding <string> | <null> Default: null
        - flag <string> See support of file system flags. Default: 'r'.
      - callback <Function>
        - err <Error>
        - data <string> | <Buffer>
    */
    const defaultConfig = {
      "schemaPath": "rng/hvml.rng",
      "schemaType": "rng",
      "encoding": "utf8",
    };

    config = {
      ...defaultConfig,
      ...config,
    };

    this.namespaces = {
      "html": "http://www.w3.org/1999/xhtml",
      "hvml": "https://hypervideo.tech/hvml#",
      "xlink": "http://www.w3.org/1999/xlink",
      "css": "https://www.w3.org/TR/CSS/",
    };

    this.fileExtensions = {
      "xml": [
        "xml",
        "ovml",
        "hvml",
      ],
      "json": [
        "json",
        "jsonld",
      ],
    };

    this.prefixes = Object.keys( this.namespaces )
      .reduce( ( accumulator, currentPrefix ) => {
        accumulator[this.namespaces[currentPrefix]] = currentPrefix;
        return accumulator;
      }, {} );

    this.schemaPath = config.schemaPath;
    this.schemaType = config.schemaType;

    const fileReady = ( new Promise( ( resolve, reject ) => {
      fs.readFile( path, config.encoding, ( error, data ) => {
        if ( error ) {
          // throw new Error( error );
          reject( error );
        }
        resolve( data );
      } );
    } ) );

    const schemaReady = ( new Promise( ( resolve, reject ) => {
      fs.readFile( this.schemaPath, 'utf8', ( error, data ) => {
        if ( error ) {
          reject( error );
        }
        resolve( data );
      } );
    } ) );

    this.ready = Promise.all( [fileReady, schemaReady] ).then( ( data ) => {
      const fileContents = data[0];
      const extension = extname( path ).slice( 1 );
      const isXml = ( this.fileExtensions.xml.indexOf( extension ) !== -1 );
      const isJson = ( this.fileExtensions.json.indexOf( extension ) !== -1 );

      if ( isXml ) {
        if ( !canParseXml ) {
          throw new Validation.OptionalDependencyNotInstalled( {
            "className": "HVML",
            "fieldName": "ready",
            "dependency": "libxmljs",
          } );
        }

        this.xml = xml.parseXmlString( fileContents );
        this.hvmlPath = path;
        // this.xsd = xml.parseXmlString( data[1] );
        return this.xml;
      }

      if ( isJson ) {
        this.json = JSON.parse( fileContents );
        this.hvmlPath = path;
        // throw new Error( 'JSON Parsing not implemented yet' );
        return this.json;
      }

      throw new Error( 'Unsupported file type' );
    } );
  }

  validate( xmllintPath = 'xmllint' ) {
    // return this.xml.validate( this.xsd );
    return ( new Promise( ( resolve, reject ) => {
      exec( `${xmllintPath} --nowarning --noout --relaxng ${this.schemaPath} ${this.hvmlPath}`, ( error, stdout, stderr ) => { // eslint-disable-line
        if ( error ) {
          /* istanbul ignore next */
          const xmllintNotFound = (
            // Linux/macOS exit code 127 means command not found
            ( error.code === 127 )
            // Windows may exit with code 1 instead of 127,
            // which is the same code thrown by xmllint
            // when it finds validation errors.
            //
            // So instead, test for the nonexistence of a pass/fail message.
            // (Rather than testing against “command not found” strings which
            // will be localized into different languages for different users.)
            || (
              !/fails to validate/.test( error.message )
              && !/validates/.test( error.message )
            )
          );

          if ( xmllintNotFound ) {
            reject( new Validation.OptionalDependencyNotInstalled( {
              "className": "HVML",
              "fieldName": "validate",
              "dependency": "xmllint",
            } ) );
            return;
          }

          let validationErrors = error.toString().trim().split( '\n' );
          validationErrors.shift();
          validationErrors.pop();

          /* Array [
            "./examples/redblue.ovml.xml:3: element ovml: Relax-NG validity error : Expecting element hvml, got ovml",
            "./examples/redblue.ovml.xml fails to validate",
          ] */
          validationErrors = validationErrors.map( ( currentValue ) => {
            const validationErrorRegexPattern = `(?:(${this.hvmlPath}):(\\d+)):\\s+`
              + `(?:element .+):\\s+(Relax-NG validity error)\\s+:\\s+`
              + `(Expecting element (.+), got (.+))`;
            const expectingGotRegex = new RegExp( validationErrorRegexPattern, 'gi' );
            const expectingGot = expectingGotRegex.exec( currentValue );

            if ( expectingGot ) {
              return {
                "message": expectingGot[0],
                "file": expectingGot[1],
                "line": expectingGot[2],
                "type": expectingGot[3].replace( 'Relax-NG ', '' ).replace( ' error', '' ),
                "error": expectingGot[4],
                "expecting": expectingGot[5],
                "got": expectingGot[6],
              };
            }

            const wrongNamespaceRegexPattern = validationErrorRegexPattern.replace(
              `(Expecting element (.+), got (.+))`,
              `(Element (.+) has wrong namespace: expecting (.+))`,
            );
            const wrongNamespaceRegex = new RegExp( wrongNamespaceRegexPattern, 'gi' );
            const wrongNamespace = wrongNamespaceRegex.exec( currentValue );

            if ( wrongNamespace ) {
              return {
                "message": wrongNamespace[0],
                "file": wrongNamespace[1],
                "line": wrongNamespace[2],
                "type": wrongNamespace[3].replace( 'Relax-NG ', '' ),
                "error": wrongNamespace[4],
                "element": wrongNamespace[5],
                "expecting": wrongNamespace[6],
                // "got": null,
              };
            }

            const missingNamespaceRegexPattern = wrongNamespaceRegexPattern.replace(
              `(Element (.+) has wrong namespace: expecting (.+))`,
              `(Expecting a namespace for element (.+))`,
            );
            const missingNamespaceRegex = new RegExp( missingNamespaceRegexPattern, 'gi' );
            const missingNamespace = missingNamespaceRegex.exec( currentValue );

            if ( missingNamespace ) {
              let namespace = missingNamespace[6];

              /* istanbul ignore else: optional */
              if ( !namespace && ( missingNamespace[5] === 'hvml' ) ) {
                namespace = this.namespaces.hvml;
              }

              return {
                "message": missingNamespace[0],
                "file": missingNamespace[1],
                "line": missingNamespace[2],
                "type": missingNamespace[3].replace( 'Relax-NG ', '' ),
                "error": missingNamespace[4],
                "element": missingNamespace[5],
                "expecting": namespace,
                "got": null,
              };
            }

            const unexpectedTextRegexPattern = missingNamespaceRegexPattern.replace(
              `(Expecting a namespace for element (.+))`,
              `(Did not expect text in element (.+) content)`,
            );
            const unexpectedTextRegex = new RegExp( unexpectedTextRegexPattern, 'gi' );
            const unexpectedText = unexpectedTextRegex.exec( currentValue );

            if ( unexpectedText ) {
              return {
                "message": unexpectedText[0],
                "file": unexpectedText[1],
                "line": unexpectedText[2],
                "type": unexpectedText[3].replace( 'Relax-NG ', '' ),
                "error": unexpectedText[4],
                "element": unexpectedText[5],
                // "expecting": namespace,
                "got": "Text",
              };
            }

            const invalidAttributeRegexPattern = unexpectedTextRegexPattern.replace(
              `(Did not expect text in element (.+) content)`,
              `(Invalid attribute (.+) for element (.+))`,
            );
            const invalidAttributeRegex = new RegExp( invalidAttributeRegexPattern, 'gi' );
            const invalidAttribute = invalidAttributeRegex.exec( currentValue );

            if ( invalidAttribute ) {
              return {
                "message": invalidAttribute[0],
                "file": invalidAttribute[1],
                "line": invalidAttribute[2],
                "type": invalidAttribute[3].replace( 'Relax-NG ', '' ),
                "error": invalidAttribute[4],
                "element": invalidAttribute[6],
                // "expecting": namespace,
                "got": invalidAttribute[5],
              };
            }

            const unexpectedElementRegexPattern = invalidAttributeRegexPattern.replace(
              `(Invalid attribute (.+) for element (.+))`,
              `(Did not expect element (.+) there)`,
            );
            const unexpectedElementRegex = new RegExp( unexpectedElementRegexPattern, 'gi' );
            const unexpectedElement = unexpectedElementRegex.exec( currentValue );

            /* istanbul ignore else: covered later */
            if ( unexpectedElement ) {
              return {
                "message": unexpectedElement[0],
                "file": unexpectedElement[1],
                "line": unexpectedElement[2],
                "type": unexpectedElement[3].replace( 'Relax-NG ', '' ),
                "error": unexpectedElement[4],
                // "element": unexpectedElement[6],
                // "expecting": namespace,
                "got": unexpectedElement[5],
              };
            }

            /* istanbul ignore next: defensive */
            const otherValidationErrorRegexPattern = unexpectedElementRegexPattern.replace(
              `(Did not expect element (.+) there)`,
              `(.*)`,
            );
            /* istanbul ignore next: defensive */
            const otherValidationErrorRegex = new RegExp( otherValidationErrorRegexPattern, 'gi' );
            /* istanbul ignore next: defensive */
            const otherValidationError = otherValidationErrorRegex.exec( currentValue );

            /* istanbul ignore next: defensive */
            if ( otherValidationError ) {
              return {
                "message": otherValidationError[0],
                "file": otherValidationError[1],
                "line": otherValidationError[2],
                "type": otherValidationError[3].replace( 'Relax-NG ', '' ),
                "error": otherValidationError[4],
                // "element": otherValidationError[6],
                // "expecting": namespace,
                "got": otherValidationError[5],
              };
            }

            /* istanbul ignore next: defensive */
            throw new Validation.DomainError( currentValue );
          } );

          reject( validationErrors );
        } else {
          // xmllint prints diagnostic information, good or bad, to stderr
          /* istanbul ignore else: defensive */
          if ( stderr.match( new RegExp( `${this.hvmlPath} validates` ) ) ) {
            resolve( true );
          } else {
            resolve( stderr );
          }
        }
      } );
    } ) );
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
                if ( grandchild.name() === 'animate' ) {
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

  toJson() {
    if ( !this.json ) {
      this.json = {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
      };
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
}

// function parse( path, encoding = 'utf8', cb ) {}

// toJson

module.exports = { HVML, Video };
