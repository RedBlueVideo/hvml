// const mock = require( 'mock-fs' );
const HVML = require( './index.js' );

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

describe( 'HVML Library', () => {
  it( 'instantiates', () => {
    const hvml = new HVML( './examples/hvml.xml' );
    // const promise = hvml.ready.catch( () => {} );
    // expect.assertions( 1 );
    return expect( hvml.ready ).resolves.toEqual( expect.anything() );
  } );

  // it( 'fails for nonexistent files', () => {
  //   const hvml = new HVML( './hvml.gone' );
  // } );

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

  it( 'validates good HVML', ( done ) => {
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

  it( 'validates bad HVML: unexpected element', ( done ) => {
    const badHvmlPath = './examples/redblue.ovml.xml';
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
          "type": "validity error",
        }] );
        done();
      } );
  } );

  it( 'validates bad HVML: wrong namespace', ( done ) => {
    const badHvmlPath = './examples/vlog.hvml';
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
          "expecting": "https://hypervideo.tech/hvml#",
          "file": badHvmlPath,
          "got": null,
          "line": "2",
          "message": `${badHvmlPath}:2: element hvml: Relax-NG validity error : Element hvml has wrong namespace: expecting https://hypervideo.tech/hvml#`,
          "type": "validity error",
        }] );
        done();
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
