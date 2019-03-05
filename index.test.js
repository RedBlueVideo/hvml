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
    const hvml = new HVML( './hvml.xml' );
    // const promise = hvml.ready.catch( () => {} );
    // expect.assertions( 1 );
    return expect( hvml.ready ).resolves.toEqual( expect.anything() );
  } );

  // it( 'fails for nonexistent files', () => {
  //   const hvml = new HVML( './hvml.gone' );
  // } );

  it( 'parses XML into JSON-LD', () => {
    const hvml = new HVML( './hvml.xml' );
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

  it( 'validates HVML', () => {
    const hvml = new HVML( './hvml.xml' );
    // const badHvml = new HVML( './hvml.bad.xml' )
    // expect.assertions( 2 );

    hvml.ready.then( () => {
      // expect( hvml.isValid() ).toBe( true );
      console.log( hvml.isValid() );
    } );

    // badHvml.ready.then( () => {
    //   expect( hvml.isValid() ).toBe( false );
    // } );
  } );
} );
