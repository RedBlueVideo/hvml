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
    // expect.assertions( 2 );

    expect( video ).toBeInstanceOf( Video );
    expect( video ).toMatchObject( {
      "type": ['narrative', 'ad'],
      "language": "en",
      "region": "US",
      "id": "foo",
    } );
  } );

  it( 'throws an error for invalid type values', () => {
    expect( () => new Video( {
      "type": ['narrative', 'bad'],
      "lang": "en-US",
      "id": "foo",
    } ) ).toThrowError( ValueError );
  } );

  // it( 'sets titles' )

  it( 'handles regional title variants', () => {
    const video = new Video( {
      "type": ['narrative', 'ad'],
      "lang": "en-US",
      "id": "foo",
    } );

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
