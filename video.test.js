const Video = require( './video' );
const Validation = require( './util/validation' );

describe( 'Video', () => {
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

    expect( () => new Video( badTypes ) ).toThrowError( Validation.EnumError );

    try {
      new Video( badTypes ); // eslint-disable-line no-new
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual( {
      "className": "Video",
      "field": "type",
      "badValues": ["bad", "evil"],
    } );
  } );

  describe( 'title', () => {
    // it( 'sets titles' )

    it( 'handles regional variants', () => {
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

  describe( 'episode', () => {
    it( 'throws an error for non-integer values', () => {
      expect( () => {
        const video = new Video();
        video.setEpisode( NaN );
      } ).toThrowError( Validation.NotIntegerError );
    } );
  } );

  describe( 'description', () => {
    it( 'sets/gets type `text`', () => {
      const video = new Video();
      const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );

      video.setDescription( text, 'text' );

      expect( video.getDescription( 'text' ) ).toBe( text );
    } );

    it( 'sets/gets/wraps type `xhtml`', () => {
      const video = new Video();
      const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

      video.setDescription( xhtml, 'xhtml' );

      expect( video.getDescription( 'xhtml' ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
    } );

    describe( 'set `text`, get `xhtml`', () => {
      test( '+ Markdown, + Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml' ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );

      test( '- Markdown, + Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = `<p>Nope<br /><br />Dope<br /><br />**Pope**</p>`;

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', false ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );

      test( '- Markdown, - Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = [`<p>Nope`, `Dope`, `**Pope**</p>`].join( '\n\n' );

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', false, false ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );
    } );
  } );
} );
