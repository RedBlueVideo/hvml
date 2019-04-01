const Video = require( './video' );
const { ValueError } = require( './errors' );

describe( 'Video Class', () => {
  it( 'instantiates', () => {
    expect( new Video() ).toBeInstanceOf( Video );
  } );

  it( 'accepts a config object', () => {
    const video = new Video( {
      "type": ['narrative', 'ad'],
      "lang": "en-US",
      "id": "foo",
    } );

    expect( video ).toMatchObject( {
      "type": ['narrative', 'ad'],
      "language": "en",
      "region": "US",
      "id": "foo",
    } );
  } );

  it( 'throws an error for invalid `type` values', () => {
    const badTypes = {
      "type": ['narrative', 'bad', 'evil'],
    };
    let thrownError;

    expect.assertions( 2 );

    expect( () => new Video( badTypes ) ).toThrowError( ValueError );

    try {
      new Video( badTypes ); // eslint-disable-line no-new
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual( {
      "field": "type",
      "badValues": ["bad", "evil"],
    } );
  } );

  // it( 'sets titles' )

  it( 'handles regional title variants', () => {
    const video = new Video( {
      "lang": "en-US",
    } );

    expect.assertions( 7 );

    video.setTitle( 'Hello', 'en' );
    video.setTitle( 'Allo', 'en-GB' );
    video.setTitle( 'こんにちは', 'ja' );
    video.setTitle( 'ハロ', 'ja-US' );

    expect( video.getTitle() ).toBe( 'Hello' );
    expect( video.getTitle( 'en' ) ).toBe( 'Hello' );
    expect( video.getTitle( 'en-US' ) ).toBe( 'Hello' );
    expect( video.getTitle( 'en-GB' ) ).toBe( 'Allo' );
    expect( video.getTitle( 'ja' ) ).toBe( 'こんにちは' );
    expect( video.getTitle( 'ja-US' ) ).toBe( 'ハロ' );
    expect( video.getTitle( 'ja-JP' ) ).toBeUndefined();
  } );
} );
