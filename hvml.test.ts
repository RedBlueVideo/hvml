 
import skipIf from 'skip-if';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import Validation from './util/validation.js';

// test( 'opens files successfully', () => {} );

const JSON_LD = JSON.parse( readFileSync( './examples/hvml.jsonld', 'utf8' ) );

// skipIf(condition, name, test)

const libxmljsUnavailable = ( () => {
  let canParseXml = false;

  try {
    ( require.resolve( 'libxmljs' ) );
    canParseXml = true;
  } catch {}

  return !canParseXml;
} )();
const libxmljsAvailable = !libxmljsUnavailable;

const skipIfLibxmljsUnavailable = skipIf( () => libxmljsUnavailable );

const skipIfXmllintUnavailable = skipIf( () => {
  let exitCode: unknown;
  let stdout: unknown = '';
  let stderr: unknown = '';

  if ( libxmljsUnavailable ) {
    return true;
  }

  try {
    exitCode = execSync( 'xmllint', { "encoding": "utf8" } );
  } catch ( err ) {
    if ( err && typeof err === 'object' ) {
      exitCode = ( 'status' in err ) ? err.status : undefined;
      stdout = ( 'stdout' in err ) ? err.stdout : '';
      stderr = ( 'stderr' in err ) ? err.stderr : '';
    }
  }

  return (
    ( exitCode === 127 )
    // xmllint prints its usage text to stderr on current libxml2
    || !/xmllint \[options\] XMLfiles/.test( `${String( stdout )}${String( stderr )}` )
  );
} );

describe( 'HVML', () => {
  describe( 'instantiates', () => {
    beforeEach( () => {
      jest.resetModules();
    } );

    test( 'from nothing', () => {
      const { HVML } = require( './hvml' );
      const hvml = new HVML();
      return expect( hvml.ready ).resolves.toEqual( { "@context": JSON_LD['@context'] } );
    } );

    skipIfLibxmljsUnavailable( 'from XML', async () => {
      const { HVML } = require( './hvml' );
      const { XMLDocument } = require( 'libxmljs' );
      const hvml = new HVML( './examples/hvml.xml' );

      expect.assertions( 1 );

      await expect( hvml.ready ).resolves.toBeInstanceOf( XMLDocument );
    } );

    test( 'from XML: throws an error when libxmljs is not installed', () => {
      if ( libxmljsAvailable ) {
        jest.mock( 'libxmljs', () => {
          throw new Error( `Cannot find module 'libxmljs'` );
        } );
      }
      const { HVML } = require( './hvml' );
      const hvml = new HVML( './examples/hvml.xml' );
      return expect( hvml.ready ).rejects.toEqual( expect.anything() );
    } );

    test( 'from JSON-LD', () => {
      const { HVML } = require( './hvml' );
      const hvml = new HVML( './examples/hvml.jsonld' );
      return expect( hvml.ready ).resolves.toEqual( JSON_LD );
    } );

    it( 'throws an error for unsupported file types', () => {
      const { HVML } = require( './hvml' );
      const hvml = new HVML( './examples/hvml.yaml' );
      return expect( hvml.ready ).rejects.toEqual( expect.anything() );
    } );

    it( 'throws an error for nonexistent files', () => {
      const { HVML } = require( './hvml' );
      const hvml = new HVML( './gone.hvml' );
      return expect( hvml.ready ).rejects.toEqual( expect.anything() );
    } );

    it( 'throws an error for nonexistent schema files', () => {
      const { HVML } = require( './hvml' );
      const hvml = new HVML( './examples/hvml.xml', {
        "schemaPath": "rng/gone.rng",
      } );
      return expect( hvml.ready ).rejects.toEqual( expect.anything() );
    } );
  } );

  describe( 'Returns data as JSON-LD', () => {
    const { HVML } = require( './hvml' );

    skipIfLibxmljsUnavailable( 'from XML', () => {
      const hvml = new HVML( './examples/hvml.xml' );
      hvml.ready
        .then( () => {
          expect( hvml.toJson() ).toStrictEqual( JSON_LD );
        } )
        .catch( ( error: unknown ) => {
          throw new Error( String( error ) );
        } );
    } );

    it( 'from JSON-LD', () => {
      const hvml = new HVML( './examples/hvml.jsonld' );
      hvml.ready
        .then( () => {
          expect( hvml.toJson() ).toStrictEqual( JSON_LD );
        } )
        .catch( ( error: unknown ) => {
          throw new Error( String( error ) );
        } );
    } );
  } );

  // test( '_jsonifyChild', () => {
  //   const hvml = new HVML( './examples/hvml.xml' );
  //   const parsed = xml.parseXmlString(
  //     '<?xml version="1.0" encoding="UTF-8"?><foo><bar><baz /></bar><qux><quux /></qux></foo>',
  //   );
  //   const path = [];
  //
  //   hvml.ready
  //     .then( () => {
  //       parsed.root().childNodes().forEach( ( node ) => {
  //         if ( node.type() === 'element' ) {
  //           // console.log( 'node', node.name() );
  //           // hvml._jsonifyChild( node, path, true );
  //           hvml._jsonifyChild( node );
  //           // console.log( 'path', path );
  //           console.log( 'hvml.json', hvml.json );
  //         }
  //       } );
  //     } );
  // } );

  describe( 'Validation', () => {
    // TODO: Convert to ESM if possible
    const { HVML } = require( './hvml' );

    skipIfXmllintUnavailable( 'validates good HVML', () => {
      const goodHvml = new HVML( './examples/hvml.xml' );

      return goodHvml.ready
        .then( () => goodHvml.validate() )
        .then( ( goodValidationResult: unknown ) => {
          expect( goodValidationResult ).toStrictEqual( true );
        } );
    } );

    skipIfXmllintUnavailable( 'validates documents with `version` elements, `rel="presents"` links, and repeated `presentation` elements', () => {
      const versionedHvml = new HVML( './examples/version.xml' );

      return versionedHvml.ready
        .then( () => versionedHvml.validate() )
        .then( ( validationResult: unknown ) => {
          expect( validationResult ).toStrictEqual( true );
        } );
    } );

    skipIfXmllintUnavailable( 'validates documents with `overlay`, `content`, and `sync` elements', () => {
      const annotatedHvml = new HVML( './examples/overlay.xml' );

      return annotatedHvml.ready
        .then( () => annotatedHvml.validate() )
        .then( ( validationResult: unknown ) => {
          expect( validationResult ).toStrictEqual( true );
        } );
    } );

    skipIfXmllintUnavailable( 'validates documents with `about` attributes, root `xml:base`, and `xml:id` on `presentation` elements', () => {
      const citingHvml = new HVML( './examples/about.xml' );

      return citingHvml.ready
        .then( () => citingHvml.validate() )
        .then( ( validationResult: unknown ) => {
          expect( validationResult ).toStrictEqual( true );
        } );
    } );

    describe( 'validates bad HVML', () => {
      skipIfXmllintUnavailable( 'unexpected element', () => {
        const badHvmlPath = './examples/legacy/redblue.ovml.xml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Expecting element hvml, got ovml",
              "expecting": "hvml",
              "file": badHvmlPath,
              "got": "ovml",
              "line": "3",
              "message": `${badHvmlPath}:3: element ovml: Relax-NG validity error : Expecting element hvml, got ovml`,  
              "type": "validity",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'wrong namespace', () => {
        const badHvmlPath = './examples/legacy/vlog.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Element hvml has wrong namespace: expecting https://hypervideo.tech/hvml#",
              "element": "hvml",
              "expecting": "https://hypervideo.tech/hvml#",
              "file": badHvmlPath,
              // "got": null,
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Element hvml has wrong namespace: expecting https://hypervideo.tech/hvml#`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'missing namespace', () => {
        const badHvmlPath = './examples/bad/missing-namespace.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Expecting a namespace for element hvml",
              "element": "hvml",
              "expecting": "https://hypervideo.tech/hvml#",
              "file": badHvmlPath,
              "got": null,
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Expecting a namespace for element hvml`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'unexpected text', () => {
        const badHvmlPath = './examples/bad/unexpected-text-children.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Did not expect text in element hvml content",
              "element": "hvml",
              "file": badHvmlPath,
              "got": "Text",
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Did not expect text in element hvml content`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'invalid attribute', () => {
        const badHvmlPath = './examples/bad/invalid-attribute.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Invalid attribute x for element hvml",
              "element": "hvml",
              "file": badHvmlPath,
              "got": "x",
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Invalid attribute x for element hvml`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'unexpected element', () => {
        const badHvmlPath = './examples/bad/unexpected-element.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Did not expect element big-chungus there",
              // "element": "hvml",
              "file": badHvmlPath,
              "got": "big-chungus",
              "line": "3",
              "message": `${badHvmlPath}:3: element big-chungus: Relax-NG validity error : Did not expect element big-chungus there`,
              "type": "validity error",
            }] );
          } );
      } );
    } );

    skipIfLibxmljsUnavailable( 'alerts user when trying to validate and xmllint path is inaccessible', ( done ) => {
      const hvmlPath = './examples/hvml.xml';
      const hvml = new HVML( hvmlPath );

      hvml.ready
        .then( () => hvml.validate( 'wtf' ) )
        .catch( ( validationErrors: unknown ) => {
          expect( validationErrors ).toBeInstanceOf( Error );

          if ( validationErrors instanceof Error ) {
            expect( validationErrors.message ).toBe( 'Optional dependency xmllint is not installed, so HVML::validate can not be used' );
          }

          done();
        } );
    } );
  } );

  describe( 'MOM Manipulation', () => {
    const { HVML, Video } = require( './hvml' );

    it( 'appends children', () => {
      const hvml = new HVML();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvml.appendChild( channel );
      hvml.appendChild( secondChannel );

      expect( hvml.children.length ).toBe( 2 );
      expect( Object.keys( hvml.children ).length ).toBe( 4 );
    } );

    it( 'supports namedItem lookup (DOM cue: HTMLCollection.namedItem)', () => {
      const hvml = new HVML();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );

      hvml.appendChild( channel );

      expect( hvml.children.namedItem( 'welcome-to-my-channel' ) ).toBe( channel );
      expect( hvml.children.namedItem( 'nonexistent' ) ).toBeNull();
      // namedItem is non-enumerable: key counts reflect elements only
      expect( Object.keys( hvml.children ) ).toEqual( ['0', 'welcome-to-my-channel'] );
    } );

    it( 'throws an error when appending children of unexpected types', () => {
      const hvml = new HVML();
      const channel = {
        "id": "welcome-to-my-channel",
      };
      let thrownError;

      try {
        hvml.appendChild( channel );
      } catch ( error ) {
        thrownError = error;
      }

      if ( !( thrownError instanceof Validation.EnumError ) ) {
        throw thrownError;
      }

      expect( thrownError.constructor ).toBe( Validation.EnumError );
      expect( thrownError.message ).toBe( 'The following values are invalid for HVML.appendChild::child: [object Object]' );
    } );

    test( 'toMom', ( done ) => {
      const hvml = new HVML( './examples/hvml.jsonld' );
      hvml.ready.then( () => {
        const MOM = hvml.toMom();
        // console.debug( 'hvml.toMom()', hvml.toMom() );
        expect( MOM ).toBeInstanceOf( HVML );
        expect( MOM ).toMatchObject( {
          // <hvml>
          // property: value, × n
          "children": [
            {
              // <video>
              "language": "_",
              "region": "_",
              "id": "ep-23",
              "title": "Overnight Dance Party at the Museum of Fine Arts Boston",
              "description": {
                "xhtml": "<p>Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/</p><p>#mfaNOW #mfaLateNites</p>",
              },
              "children": [
                {
                  // <presentation>
                },
                {
                  // <showing>
                },
              ],
            },
          ],
        } );
        done();
      } );
    } );
  } );
} );

// describe( 'HVML Schema', () => {
//   it( 'validates correct syntax', () => {
//
//   } );
//
//   it( 'reports incorrect syntax', () => {
//
//   } );
// } );
