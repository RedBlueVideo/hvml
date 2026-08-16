 
import skipIf from 'skip-if';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import Validation from './util/validation.js';
import Data from './util/data.js';

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
      return expect( hvml.ready ).resolves.toEqual( Data.getJsonBoilerplate() );
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
      return hvml.ready
        .then( () => {
          expect( hvml.toJson() ).toStrictEqual( JSON_LD );
        } );
    } );

    it( 'from JSON-LD', () => {
      const hvml = new HVML( './examples/hvml.jsonld' );
      return hvml.ready
        .then( () => {
          expect( hvml.toJson() ).toStrictEqual( JSON_LD );
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

    skipIfXmllintUnavailable( 'validates the round-trip fixture: attribute-bearing text elements, version text children, and text-typed content', () => {
      const roundTripHvml = new HVML( './examples/roundtrip.xml' );

      return roundTripHvml.ready
        .then( () => roundTripHvml.validate() )
        .then( ( validationResult: unknown ) => {
          expect( validationResult ).toStrictEqual( true );
        } );
    } );

    skipIfXmllintUnavailable( 'validates documents with `series` and `group` collection elements', () => {
      const collectionsHvml = new HVML( './examples/series-group.xml' );

      return collectionsHvml.ready
        .then( () => collectionsHvml.validate() )
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

      skipIfXmllintUnavailable( 'about on a property element', () => {
        const badHvmlPath = './examples/bad/about-on-property-element.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Invalid attribute about for element title",
              "element": "title",
              "file": badHvmlPath,
              "got": "about",
              "line": "4",
              "message": `${badHvmlPath}:4: element title: Relax-NG validity error : Invalid attribute about for element title`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'about on the root element', () => {
        const badHvmlPath = './examples/bad/about-on-root.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Invalid attribute about for element hvml",
              "element": "hvml",
              "file": badHvmlPath,
              "got": "about",
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Invalid attribute about for element hvml`,
              "type": "validity error",
            }] );
          } );
      } );

      skipIfXmllintUnavailable( 'sync outside a presentation', () => {
        const badHvmlPath = './examples/bad/sync-outside-presentation.hvml';
        const badHvml = new HVML( badHvmlPath );

        expect.assertions( 1 );

        return badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult: unknown ) => {
            expect( badValidationResult ).toBeUndefined();
          } )
          .catch( ( error: unknown ) => {
            expect( error ).toStrictEqual( [{
              "error": "Did not expect element sync there",
              "file": badHvmlPath,
              "got": "sync",
              "line": "3",
              "message": `${badHvmlPath}:3: element sync: Relax-NG validity error : Did not expect element sync there`,
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
    const { HVML, Video, Series, Group } = require( './hvml' );

    it( 'accepts every root element the grammar does: video, series, and group', () => {
      const hvml = new HVML();

      hvml.appendChild( new Video( { "id": "a-video" } ) );
      hvml.appendChild( new Series( { "id": "a-series" } ) );
      hvml.appendChild( new Group( { "id": "a-group" } ) );

      expect( hvml.children.map( ( child: { nodeName: string } ) => child.nodeName ) ).toEqual( ['video', 'series', 'group'] );
    } );

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
              "about": "https://id.nospoon.tv/2016/hughs-vlog/overnight-dance-party-at-the-mfa",
              "title": "Overnight Dance Party at the Museum of Fine Arts Boston",
              "description": {
                "xhtml": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p>Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/</p><p>#mfaNOW #mfaLateNites</p></div>",
              },
              "children": [
                {
                  // <version>
                },
                {
                  // <showing>
                },
                {
                  // <presentation>
                },
                {
                  // <presentation xml:id="rebroadcast">
                },
              ],
            },
          ],
        } );
        done();
      } );
    } );

    test( 'toMom builds one root-level child per named-graph node', () => {
      const hvml = new HVML();
      hvml.json = {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
        "@graph": [
          { "@type": "video", "xml:id": "first", "title": "First" },
          { "@type": "video", "xml:id": "second", "title": "Second" },
        ],
      };

      const MOM = hvml.toMom();

      expect( MOM.children ).toHaveLength( 2 );
      expect( MOM.children[0] ).toMatchObject( {
        "id": "first",
        "title": "First",
      } );
      expect( MOM.children[1] ).toMatchObject( {
        "id": "second",
        "title": "Second",
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
