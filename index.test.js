// const mock = require( 'mock-fs' );
const skipIf = require( 'skip-if' );
const { execSync } = require( 'child_process' );

const { HVML } = require( './index.js' );

// test( 'opens files successfully', () => {} );

const JSON_LD = {
  "@context": "https://redblue.video/guide/hvml.context.jsonld",
  "@type": "video",
  // "@id": "vlog:2016-09-17",
  "xml:id": "ep-23",
  "type": "personal",
  "title": "Overnight Dance Party at the Museum of Fine Arts Boston",
  "episode": "23",
  "recorded": "2016-09-17",
  "description": {
    "type": "xhtml",
    "html:div": {
      "childNodes": [
        {
          "@type": "p",
          "textContent": "Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/",
        },
        {
          "@type": "p",
          "textContent": "#mfaNOW #mfaLateNites",
        },
      ],
    },
  },
  "showing": {
    "scope": "release",
    "type": "internet",
    "admission": "private",
    "venue": {
      "type": "site",
      "entity": [
        {
          "site": "https://www.youtube.com/",
        },
        "YouTube",
      ],
      "uri": "https://www.youtube.com/watch?v=nWdWq3hMwao",
      "title": "Overnight Dance Party at the Museum of Fine Arts Boston | Hugh’s Vlog | #mfaNOW #mfaLateNites",
    },
  },
  "presentation": {
    "choice": {
      "xml:id": "full-stream",
      "name": {
        "type": "xhtml",
        "html:div": {
          "childNodes": [
            {
              "textContent": "Go to: ",
            },
            {
              "@type": "code",
              "style": "font-family: inherit; font-weight: bold;",
              "textContent": "hugh.today/2016-09-17/live",
            },
            {
              "textContent": " for the full stream",
            },
          ],
        },
      },
      "goto": {
        "on": "duration",
        "xlink:actuate": "onRequest",
        "xlink:href": "https://www.facebook.com/hugh.guiney/videos/10100195051457860/",
        "width": "70%",
        "height": "13%",
        "css:font-size": "calc(384 / 150 * 1vw)",
        "css:font-family": "'Noto Sans CJK JP', 'Noto Sans CJK', 'Noto Sans', sans-serif",
        "css:white-space": "nowrap",
        "css:overflow": "hidden",
        "animate": [
          {
            "startTime": "517.292107",
            "endTime": "518.872131",
            "startX": "14.9%",
            "startY": "-15%",
            "endX": "15%",
            "endY": "10%",
          },
          {
            "startTime": "523.373882",
            "endTime": "524.873404",
            "startX": "14.9%",
            "startY": "10%",
            "endX": "15%",
            "endY": "-15%",
          },
        ],
      },
    },
  },
};

// skipIf(condition, name, test)
const skipIfXmllintUnavailable = skipIf( () => {
  let exitCode;
  let error;

  try {
    exitCode = execSync( 'xmllint', { "encoding": "utf8" } );
  } catch ( err ) {
    error = err;
    exitCode = err.status;
  }

  return (
    ( exitCode === 127 )
    || !/xmllint \[options\] XMLfiles/.test( error.stdout )
  );
} );

describe( 'HVML', () => {
  it( 'instantiates', () => {
    const hvml = new HVML( './examples/hvml.xml' );
    // const promise = hvml.ready.catch( () => {} );
    // expect.assertions( 1 );
    return expect( hvml.ready ).resolves.toEqual( expect.anything() );
  } );

  it( 'fails for nonexistent files', () => {
    const hvml = new HVML( './gone.hvml' );
    return expect( hvml.ready ).rejects.toEqual( expect.anything() );
  } );

  it( 'fails for nonexistent schema files', () => {
    const hvml = new HVML( './examples/hvml.xml', {
      "schemaPath": "rng/gone.rng",
    } );
    return expect( hvml.ready ).rejects.toEqual( expect.anything() );
  } );

  it( 'parses XML into JSON-LD', () => {
    const hvml = new HVML( './examples/hvml.xml' );
    // expect.assertions( 1 );
    return hvml.ready
      .then( () => {
        // const json = hvml.toJson();
        expect( hvml.toJson() ).toStrictEqual( JSON_LD );
        // console.log( json );
      } )
      .catch( ( error ) => {
        throw new Error( error.toString() );
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
    skipIfXmllintUnavailable( 'validates good HVML', ( done ) => {
      const goodHvml = new HVML( './examples/hvml.xml' );

      goodHvml.ready
        .then( () => goodHvml.validate() )
        .then( ( goodValidationResult ) => {
          expect( goodValidationResult ).toStrictEqual( true );
          done();
        } )
        .catch( ( error ) => {
          expect( error ).toBeUndefined();
          done();
        } );
    } );

    describe( 'validates bad HVML', () => {
      skipIfXmllintUnavailable( 'unexpected element', ( done ) => {
        const badHvmlPath = './examples/legacy/redblue.ovml.xml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
            expect( badValidationResult ).toBeUndefined();
            done();
          } )
          .catch( ( error ) => {
            expect( error ).toStrictEqual( [{
              "error": "Expecting element hvml, got ovml",
              "expecting": "hvml",
              "file": badHvmlPath,
              "got": "ovml",
              "line": "3",
              "message": `${badHvmlPath}:3: element ovml: Relax-NG validity error : Expecting element hvml, got ovml`, // eslint-disable-line
              "type": "validity",
            }] );
            done();
          } );
      } );

      skipIfXmllintUnavailable( 'wrong namespace', ( done ) => {
        const badHvmlPath = './examples/legacy/vlog.hvml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
            expect( badValidationResult ).toBeUndefined();
            done();
          } )
          .catch( ( error ) => {
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
            done();
          } );
      } );

      skipIfXmllintUnavailable( 'missing namespace', ( done ) => {
        const badHvmlPath = './examples/bad/missing-namespace.hvml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
            expect( badValidationResult ).toBeUndefined();
            done();
          } )
          .catch( ( error ) => {
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
            done();
          } );
      } );

      skipIfXmllintUnavailable( 'unexpected text', ( done ) => {
        const badHvmlPath = './examples/bad/unexpected-text-children.hvml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
            expect( badValidationResult ).toBeUndefined();
            done();
          } )
          .catch( ( error ) => {
            expect( error ).toStrictEqual( [{
              "error": "Did not expect text in element hvml content",
              "element": "hvml",
              "file": badHvmlPath,
              "got": "Text",
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Did not expect text in element hvml content`,
              "type": "validity error",
            }] );
            done();
          } );
      } );

      skipIfXmllintUnavailable( 'invalid attribute', ( done ) => {
        const badHvmlPath = './examples/bad/invalid-attribute.hvml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
            expect( badValidationResult ).toBeUndefined();
            done();
          } )
          .catch( ( error ) => {
            expect( error ).toStrictEqual( [{
              "error": "Invalid attribute x for element hvml",
              "element": "hvml",
              "file": badHvmlPath,
              "got": "x",
              "line": "2",
              "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Invalid attribute x for element hvml`,
              "type": "validity error",
            }] );
            done();
          } );
      } );

      skipIfXmllintUnavailable( 'unexpected element', ( done ) => {
        const badHvmlPath = './examples/bad/unexpected-element.hvml';
        const badHvml = new HVML( badHvmlPath );

        badHvml.ready
          .then( () => badHvml.validate() )
          .then( ( badValidationResult ) => {
          //   expect( badValidationResult ).toBeUndefined();
            console.log( 'badValidationResult', badValidationResult );
            done();
          } )
          .catch( ( error ) => {
            expect( error ).toStrictEqual( [{
              "error": "Did not expect element big-chungus there",
              // "element": "hvml",
              "file": badHvmlPath,
              "got": "big-chungus",
              "line": "3",
              "message": `${badHvmlPath}:3: element big-chungus: Relax-NG validity error : Did not expect element big-chungus there`,
              "type": "validity error",
            }] );
            done();
          } );
      } );
    } );
  } );

  it( 'alerts user when trying to validate and xmllint path is inaccessible', ( done ) => {
    const hvmlPath = './examples/hvml.xml';
    const hvml = new HVML( hvmlPath );

    hvml.ready
      .then( () => hvml.validate( 'wtf' ) )
      .catch( ( validationErrors ) => {
        expect( validationErrors.message ).toBe( 'xmllint is not installed or inaccessible' );
        done();
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
