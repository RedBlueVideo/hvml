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

  describe( 'hasType()', () => {
    it( 'returns `true` for types that are present', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );

      expect.assertions( 2 );

      expect( video.hasType( 'narrative' ) ).toBe( true );
      expect( video.hasType( 'documentary' ) ).toBe( true );
    } );

    it( 'returns `false` for types that are absent', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );

      expect.assertions( 3 );

      expect( video.hasType( 'ad' ) ).toBe( false );
      expect( video.hasType( ['ad', 'personal'] ) ).toBe( false );
      expect( video.hasType( ['narrative', 'ad'] ) ).toBe( false );
    } );

    it( 'handles space-separated input values', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );

      expect.assertions( 5 );

      expect( video.hasType( 'narrative documentary' ) ).toBe( true );
      expect( video.hasType( '  narrative documentary' ) ).toBe( true );
      expect( video.hasType( 'narrative documentary  ' ) ).toBe( true );
      expect( video.hasType( 'narrative  documentary' ) ).toBe( true );
      expect( video.hasType( '  narrative  documentary  ' ) ).toBe( true );
    } );

    it( 'disregards the order of parameters', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );

      expect( video.hasType( ['documentary', 'narrative'] ) ).toBe( true );
    } );

    it( 'throws an error for invalid parameters', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );
      const badInput = 0;
      let thrownError;

      expect.assertions( 2 );

      expect( () => video.hasType( badInput ) ).toThrowError( Validation.ParamError );

      try {
        video.hasType( badInput );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "got": "Number",
          "input": badInput,
          "methodName": "hasType",
        } ),
      );
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
    it( 'sets and gets `text`', () => {
      const video = new Video();
      const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );

      video.setDescription( text, 'text' );

      expect( video.getDescription( 'text' ) ).toBe( text );
    } );

    it( 'sets and gets `xhtml`', () => {
      const video = new Video();
      const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

      video.setDescription( xhtml, 'xhtml' );

      expect( video.getDescription( 'xhtml' ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
    } );

    describe( 'sets `text`, gets `xhtml`', () => {
      test( '+ Markdown, + Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', true, true ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );

      test( '+ Markdown, - Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', true, false ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );

      test( '- Markdown, + Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = `<p>Nope<br /><br />Dope<br /><br />**Pope**</p>`;

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', false, true ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );

      test( '- Markdown, - Newlines → br', () => {
        const video = new Video();
        const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );
        const xhtml = [`<p>Nope`, `Dope`, `**Pope**</p>`].join( '\n\n' );

        video.setDescription( text, 'text' );

        expect( video.getDescription( 'xhtml', false, false ) ).toBe( `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` );
      } );
    } );

    it( 'sets `xhtml`, gets `text`', () => {
      const video = new Video();
      const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

      video.setDescription( xhtml, 'xhtml' );

      expect( video.getDescription( 'text' ) ).toBe( 'NopeDopePope' );
    } );
  } );

  describe( 'runtime', () => {
    const sampleRuntime = {
      "minutes": 90,
      "hours": 1.5,
      "iso8601": 'PT90M',
    };

    it( 'throws an error for incorrect input values', () => {
      const video = new Video();
      const badValue = null;
      let thrownError;

      expect.assertions( 2 );

      expect( () => video.setRuntime( badValue ) ).toThrowError( Validation.TypeError );

      try {
        video.setRuntime( badValue );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "field": "runtime",
          "expected": [
            "Number",
            "ISO8601 Duration",
          ],
          "got": "Null",
          "input": null,
        } ),
      );
    } );

    describe( 'sets and gets the same value', () => {
      test( 'minutes', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.minutes );
        expect( video.getRuntime( 'minutes' ) ).toBe( sampleRuntime.minutes );
      } );

      test( 'ISO 8601 duration', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.iso8601 );
        expect( video.getRuntime( 'iso8601' ) ).toBe( sampleRuntime.iso8601 );
      } );
    } );

    describe( 'sets a value and gets back another equivalent value', () => {
      test( 'minutes → hours', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.minutes );
        expect( video.getRuntime( 'hours' ) ).toBe( sampleRuntime.hours );
      } );

      test( 'minutes → ISO 8601 duration', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.minutes );
        expect( video.getRuntime( 'iso8601' ) ).toBe( sampleRuntime.iso8601 );
      } );

      test( 'ISO 8601 duration → minutes', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.iso8601 );
        expect( video.getRuntime( 'minutes' ) ).toBe( sampleRuntime.minutes );
      } );

      test( 'ISO 8601 duration → hours', () => {
        const video = new Video();
        video.setRuntime( sampleRuntime.iso8601 );
        expect( video.getRuntime( 'hours' ) ).toBe( sampleRuntime.hours );
      } );
    } );
  } );
} );
