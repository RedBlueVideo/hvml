const Video = require( './video' );
const Validation = require( './util/validation' );

describe( 'Video', () => {
  /* --- Instantiation --- */

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

  it( 'throws an error for invalid `config` values', () => {
    let thrownError;
    const badConfig = ['bad', 'config'];

    expect.assertions( 2 );

    expect( () => new Video( badConfig ) ).toThrowError( Validation.TypeError );

    try {
      new Video( badConfig ); // eslint-disable-line no-new
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual(
      expect.objectContaining( {
        "className": "Video",
        "methodName": "constructor",
        "fieldName": "config",
        "expected": "Object",
        "got": "Array",
        "input": badConfig,
      } ),
    );
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
      "fieldName": "config.type",
      "badValues": ["bad", "evil"],
    } );
  } );

  it( 'throws an error for invalid `type` type', () => {
    const badType = {
      "type": 10,
    };
    let thrownError;

    expect.assertions( 2 );

    expect( () => new Video( badType ) ).toThrowError( Validation.TypeError );

    try {
      new Video( badType ); // eslint-disable-line no-new
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual(
      expect.objectContaining( {
        "className": "Video",
        "fieldName": "config.type",
        "expected": ["String", "Array"],
        "got": "Number",
        "input": badType.type,
        "methodName": "constructor",
      } ),
    );
  } );

  it( 'throws an error for invalid `id` values', () => {
    let thrownError;
    const configWithBadId = {
      "type": ["narrative", "ad"],
      "lang": "en-US",
      "id": null,
    };

    expect.assertions( 2 );

    expect( () => new Video( configWithBadId ) ).toThrowError( Validation.TypeError );

    try {
      new Video( configWithBadId ); // eslint-disable-line no-new
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual(
      expect.objectContaining( {
        "className": "Video",
        "methodName": "constructor",
        "fieldName": "id",
        "expected": "String",
        "got": "Null",
        "input": null,
      } ),
    );
  } );

  /* --- Private Methods --- */

  test( '_validateTypes', () => {
    const mixedValidInvalidTypes = [
      'narrative',
      'documentary',
      'ad',
      'personal',
      'historical',
      'monkey',
      'seahorse',
      'big-chungus',
    ];
    const video = new Video();
    let thrownError;

    try {
      video._validateTypes( mixedValidInvalidTypes );
    } catch ( error ) {
      thrownError = error;
    }

    expect( thrownError.data ).toEqual(
      expect.objectContaining( {
        "className": "Video",
        "fieldName": "type",
        "badValues": ["monkey", "seahorse", "big-chungus"],
      } ),
    );
  } );

  test( '_getRegion', () => {
    const videoOne = new Video();
    const videoTwo = new Video( {
      "lang": "ja-JP",
    } );

    expect.assertions( 2 );

    expect( videoOne._getRegion( 'ja' ) ).toBe( '_' );
    expect( videoTwo._getRegion( 'ja' ) ).toBe( 'JP' );
  } );

  test( '_langHasRegion', () => {
    const video = new Video();

    expect.assertions( 2 );

    expect( video._langHasRegion( 'en' ) ).toBe( false );
    expect( video._langHasRegion( 'en-US' ) ).toBe( true );
  } );

  test( '_getLanguageAndRegion', () => {
    // lang, regionFallback
    const video = new Video();

    expect.assertions( 3 );

    expect( video._getLanguageAndRegion( 'en' ) ).toEqual( {
      "language": "en",
      "region": "_",
    } );

    expect( video._getLanguageAndRegion( 'en-US' ) ).toEqual( {
      "language": "en",
      "region": "US",
    } );

    expect( video._getLanguageAndRegion( 'en', () => 'fallback' ) ).toEqual( {
      "language": "en",
      "region": "fallback",
    } );
  } );

  /* --- Public Methods --- */

  test( 'isValidType', () => {
    const knownValidTypes = [
      'narrative',
      'documentary',
      'ad',
      'personal',
      'historical',
    ];
    const knownInvalidTypes = [
      'monkey',
      'seahorse',
      'big-chungus',
    ];
    expect.assertions( knownValidTypes.length + knownInvalidTypes.length );

    knownValidTypes.forEach( ( validType ) => {
      expect( Video.isValidType( validType ) ).toBe( true );
    } );

    knownInvalidTypes.forEach( ( invalidType ) => {
      expect( Video.isValidType( invalidType ) ).toBe( false );
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

    it( 'works with single-item arrays', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );

      expect( video.hasType( ['documentary'] ) ).toBe( true );
    } );

    it( 'returns `false` if no type has been set yet', () => {
      const video = new Video();

      expect( video.hasType( 'documentary' ) ).toBe( false );
    } );

    it( 'throws an error for invalid parameters', () => {
      const video = new Video( {
        "type": ["narrative", "documentary"],
      } );
      const badInput = 0;
      let thrownError;

      expect.assertions( 2 );

      expect( () => video.hasType( badInput ) ).toThrowError( Validation.TypeError );

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

  describe( 'isVlogEpisode()', () => {
    it( 'reports the presence of the types `personal` and `documentary`', () => {
      const vlogEpisode = new Video( {
        "type": ["personal", "documentary"],
      } );
      const nonVlogEpisode = new Video( {
        "type": "personal",
      } );

      expect.assertions( 2 );

      expect( vlogEpisode.isVlogEpisode() ).toBe( true );
      expect( nonVlogEpisode.isVlogEpisode() ).toBe( false );
    } );
  } );

  describe( 'isArchived()', () => {
    it( 'reports the presence of the types `historical` and `personal`', () => {
      const archivedEpisode = new Video( {
        "type": ["personal", "historical"],
      } );
      const nonArchivedEpisode = new Video( {
        "type": "personal",
      } );

      expect.assertions( 2 );

      expect( archivedEpisode.isArchived() ).toBe( true );
      expect( nonArchivedEpisode.isArchived() ).toBe( false );
    } );
  } );

  /* --- Fields --- */

  describe( 'title', () => {
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

    it( 'handles inherited language/region', () => {
      const video = new Video( {
        "lang": "en-US",
      } );

      video.setTitle( 'Hello' );

      expect( video.getTitle() ).toBe( 'Hello' );
    } );

    it( 'throws an error for invalid inputs', () => {
      const video = new Video( {
        "lang": "en-US",
      } );
      let thrownError;

      expect.assertions( 2 );

      try {
        video.setTitle( null, 'en' );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.constructor.name ).toBe( 'HVMLTypeError' );
      expect( thrownError.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "expected": "String",
          "fieldName": "title",
          "got": "Null",
          "input": null,
        } ),
      );
    } );
  } );

  describe( 'episode', () => {
    it( 'gets and sets the same value', () => {
      const videoOne = new Video();
      const videoTwo = new Video();

      expect.assertions( 2 );

      videoOne.setEpisode( 10 );
      expect( videoOne.getEpisode() ).toBe( 10 );

      videoTwo.setEpisode( '100' );
      expect( videoTwo.getEpisode() ).toBe( 100 );
    } );

    it( 'throws an error for non-integer values', () => {
      expect( () => {
        const video = new Video();
        video.setEpisode( NaN );
      } ).toThrowError( Validation.NotIntegerError );
    } );
  } );

  describe( 'description', () => {
    it( 'sets and gets `text` by default', () => {
      const video = new Video();
      const text = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );

      video.setDescription( text );

      expect( video.getDescription() ).toBe( text );
    } );

    it( 'sets and gets `text` explicitly', () => {
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

    it( 'sets and gets `jsonml`', () => {
      const video = new Video();
      const jsonMl = [
        [
          "p", "Nope",
        ], [
          "p", "Dope",
        ], [
          "p", [
            "strong", "Pope",
          ],
        ],
      ]; // wrapper
      const wrappedJsonMl = [
        "#document", [
          "div", { "xmlns": "http://www.w3.org/1999/xhtml" },
          [
            "p", "Nope",
          ], [
            "p", "Dope",
          ], [
            "p", [
              "strong", "Pope",
            ],
          ],
        ],
      ]; // wrapper
      video.setDescription( jsonMl, 'jsonml' );
      const output = video.getDescription( 'jsonml' );
      expect( output ).toEqual( wrappedJsonMl );
    } );

    it( 'sets `text`, gets `jsonml`', () => {
      const video = new Video();
      const xhtml = [`Nope`, `Dope`, `**Pope**`].join( '\n\n' );

      video.setDescription( xhtml, 'text' );

      expect( video.getDescription( 'jsonml' ) ).toEqual( [
        "div", { "xmlns": "http://www.w3.org/1999/xhtml" },
        [
          "p", "Nope",
        ], // p
        [
          "p", "Dope",
        ], // p
        [
          "p", [
            "strong", "Pope",
          ], // p#childNodes
        ], // p
      ] ); // root
    } );

    it( 'sets `xhtml`, gets `jsonml`', () => {
      const video = new Video();
      const xhtml = `<p>Nope</p><p>Dope</p><p><strong>Pope</strong></p>`;

      video.setDescription( xhtml, 'xhtml' );

      expect( video.getDescription( 'jsonml' ) ).toEqual( [
        "#document", [
          "div", { "xmlns": "http://www.w3.org/1999/xhtml" },
          [
            "p", "Nope",
          ], // p
          [
            "p", "Dope",
          ], // p
          [
            "p", [
              "strong", "Pope",
            ], // p#childNodes
          ], // p
        ], // #document
      ] ); // root
    } );

    it( 'returns null if description was never set', () => {
      const video = new Video();

      expect.assertions( 4 );

      expect( video.getDescription() ).toBeNull();
      expect( video.getDescription( 'jsonml' ) ).toBeNull();
      expect( video.getDescription( 'xhtml' ) ).toBeNull();
      expect( video.getDescription( 'text' ) ).toBeNull();
    } );

    it( 'throws an error when setting type `text` with a non-string description', () => {
      const video = new Video();
      const text = null;
      let thrownError;

      try {
        video.setDescription( text, 'text' );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "methodName": "setDescription",
          "expected": ["String", "Object"],
          "fieldName": "description",
          "got": "Null",
          "input": null,
        } ),
      );
    } );

    it( 'throws an error when setting type `xhtml` with a non-string description', () => {
      const video = new Video();
      const xhtml = null;
      let thrownError;

      try {
        video.setDescription( xhtml, 'xhtml' );
      } catch ( error ) {
        thrownError = error;
      }

      expect( thrownError.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "expected": ["String", "Object"],
          "fieldName": "description",
          "got": "Null",
          "input": null,
        } ),
      );
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
      const nullValue = null;
      const subZeroValue = -90;
      let thrownErrorOne;
      let thrownErrorTwo;

      expect.assertions( 5 );

      expect( () => video.setRuntime( nullValue ) ).toThrowError( Validation.TypeError );

      try {
        video.setRuntime( nullValue );
      } catch ( error ) {
        thrownErrorOne = error;
      }

      expect( thrownErrorOne.constructor.name ).toBe( 'HVMLTypeError' );
      expect( thrownErrorOne.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "fieldName": "runtime",
          "expected": [
            "Number",
            "ISO8601 Duration",
          ],
          "got": "Null",
          "input": null,
        } ),
      );

      try {
        video.setRuntime( subZeroValue );
      } catch ( error ) {
        thrownErrorTwo = error;
      }

      expect( thrownErrorTwo.constructor.name ).toBe( 'HVMLRangeError' );
      expect( thrownErrorTwo.data ).toEqual(
        expect.objectContaining( {
          "className": "Video",
          "fieldName": "runtime",
          "expected": [
            "Number",
            "ISO8601 Duration",
          ],
          "lowerBound": 0,
          "upperBound": Infinity,
          "input": subZeroValue,
        } ),
      );
    } );

    describe( 'sets and gets the same value', () => {
      test( 'minutes', () => {
        const videoOne = new Video();
        const videoTwo = new Video();

        expect.assertions( 2 );

        videoOne.setRuntime( sampleRuntime.minutes );
        expect( videoOne.getRuntime( 'minutes' ) ).toBe( sampleRuntime.minutes );

        videoTwo.setRuntime( sampleRuntime.minutes.toString() );
        expect( videoTwo.getRuntime( 'minutes' ) ).toBe( sampleRuntime.minutes );
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
