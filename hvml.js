import { readFile } from 'fs';
import { extname } from 'path';
import { exec } from 'child_process';

import { HVMLElement } from './hvml-element';

import { Video } from './video';
import { Series } from './series';
import { Group } from './group';

import Validation from './util/validation';
import { hasProperty } from './util/types';
import Data from './util/data';

// const elements = {
//   Series,
//   Group,
//   Video,
// };

class HVML extends HVMLElement {
  constructor( path, config = {} ) {
    super();

    this.libxml = undefined;
    this.canParseXml = false;
    this.parseXml = '';

    (async () => {
      try {
        this.libxml = await import( 'libxmljs' );

        if ( hasProperty( this.libxml, 'parseXml' ) ) {
          this.canParseXml = true;
          this.parseXml = 'parseXml';
        } else
        /* istanbul ignore next */
        if ( hasProperty( this.libxml, 'parseXmlString' ) ) {
          this.canParseXml = true;
          this.parseXml = 'parseXml';
        }
      } catch ( error ) {
        // eslint-disable-line no-empty
      }
    })();
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
      "rng": "http://relaxng.org/ns/structure/1.0",
    };

    this.fileExtensions = {
      "xml": [
        "xml",
        "ovml",
        "hvml",
        // "rng",
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

    if ( path ) {
      const fileReady = ( new Promise( ( resolve, reject ) => {
        readFile( path, config.encoding, ( error, data ) => {
          if ( error ) {
            // throw new Error( error );
            reject( error );
          }
          resolve( data );
        } );
      } ) );

      const schemaReady = ( new Promise( ( resolve, reject ) => {
        readFile( this.schemaPath, 'utf8', ( error, data ) => {
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
          if ( !this.canParseXml ) {
            throw new Validation.OptionalDependencyNotInstalled( {
              "className": "HVML",
              "fieldName": "ready",
              "dependency": "libxmljs",
            } );
          }

          this.xml = this.libxml?.[this.parseXml]( fileContents );
          this.json = null;
          this.hvmlPath = path;
          this.children = [];
          // this.xsd = xml.parseXmlString( data[1] );
          return this.xml;
        }

        if ( isJson ) {
          this.xml = null;
          this.json = JSON.parse( fileContents );
          this.hvmlPath = path;
          this.children = [];
          // throw new Error( 'JSON Parsing not implemented yet' );
          return this.json;
        }

        throw new Error( 'Unsupported file type' );
      } );
    } else {
      // Instantiate with empty JSON data if no file path is specified
      this.xml = null;
      this.json = Data.getJsonBoilerplate();
      this.hvmlPath = null;
      this.children = [];
      this.ready = Promise.resolve( this.json );
    }
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

          /**
           * FIXME:
           * @type {any}
           */
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

  appendChild( child ) {
    const errorData = {
      ...this._baseErrorData,
      "methodName": "appendChild",
    };

    switch ( child.constructor ) {
      case Video:
      case Series:
        super.appendChild( child );
        break;

      default:
        throw new Validation.EnumError( {
          ...errorData,
          // "message": `${child.constructor.name} can not be a child of ${this.constructor.name}`,
          "fieldName": "child",
          "expected": ["Video"],
          "badValues": [child],
        } );
    }
  }
}

// function parse( path, encoding = 'utf8', cb ) {}

// toJson

export default {
  HVML,
  Series,
  Group,
  Video,
};

globalThis.HVML = {
  ...globalThis.HVML,
  HVML,
};
