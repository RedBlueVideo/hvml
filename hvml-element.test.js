const HVMLElement = require( './hvml-element' );
const Video = require( './video' );
const Series = require( './series' );

describe( 'HVMLElement', () => {
  describe( 'MOM Manipulation', () => {
    it( 'sets its own ID if specified in the constructor', () => {
      const hvmlElement = new HVMLElement( {
        "id": "anonymous-element",
      } );

      expect( hvmlElement.id ).toBe( 'anonymous-element' );
    } );

    it( 'appends children', () => {
      const hvml = new HVMLElement();
      const channel = new Video();
      const secondChannel = new Video();

      hvml.appendChild( channel );
      hvml.appendChild( secondChannel );

      expect( hvml.children.length ).toBe( 2 );
      expect( Object.keys( hvml.children ).length ).toBe( 2 );
      expect( hvml.children[0] ).toStrictEqual( channel );
      expect( hvml.children[1] ).toStrictEqual( secondChannel );
    } );

    it( 'registers named indices when appending children with IDs', () => {
      const hvml = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvml.appendChild( channel );
      hvml.appendChild( secondChannel );

      expect( hvml.children['welcome-to-my-channel'] ).toStrictEqual( channel );
      expect( hvml.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );

    it( 'removes children', () => {
      const hvml = new HVMLElement();
      const channel = new Video();
      const secondChannel = new Video();

      hvml.appendChild( channel );
      hvml.appendChild( secondChannel );
      hvml.removeChild( channel );

      expect( hvml.children.length ).toBe( 1 );
      expect( Object.keys( hvml.children ).length ).toBe( 1 );
    } );

    it( 'deregisters named indices when removing children with IDs', () => {
      const hvml = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvml.appendChild( channel );
      hvml.appendChild( secondChannel );
      hvml.removeChild( channel );

      expect( hvml.children.length ).toBe( 1 );
      expect( Object.keys( hvml.children ).length ).toBe( 2 );
      expect( hvml.children['welcome-to-my-channel'] ).toBeUndefined();
      expect( hvml.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );
  } );

  describe( 'toJson', () => {
    it( 'converts children', () => {
      const hvmlElement = new HVMLElement();
      const hughsVlog = new Series( {
        "id": "hughs-vlog",
        "title": "Hugh’s Vlog",
      } );
      const seasonOne = new Series( {
        "id": "season-01",
      } );
      const episodeOne = new Video( {
        "id": "episode-01",
      } );
      const episodeTwo = new Video( {
        "id": "episode-02",
      } );
      const episodeThree = new Video( {
        "id": "episode-03",
      } );

      seasonOne.appendChild( episodeOne );
      seasonOne.appendChild( episodeTwo );
      seasonOne.appendChild( episodeThree );
      hughsVlog.appendChild( seasonOne );
      hvmlElement.appendChild( hughsVlog );

      expect( hvmlElement.toJson() ).toEqual( {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
        "@type": "series",
        "xml:id": "hughs-vlog",
        "title": "Hugh’s Vlog",
        "series": {
          "xml:id": "season-01",
          "video": [
            { "xml:id": "episode-01" },
            { "xml:id": "episode-02" },
            { "xml:id": "episode-03" },
          ],
        },
      } );
    } );

    it( 'sets language appropriately', () => {
      const hvmlElement = new HVMLElement();
      const videoOne = new Video( {
        "id": "video-01",
        "lang": "en-US",
      } );
      const videoTwo = new Video( {
        "id": "video-02",
        "lang": "en",
      } );

      hvmlElement.appendChild( videoOne );
      hvmlElement.appendChild( videoTwo );

      expect( hvmlElement.toJson() ).toEqual( {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
        "@type": "video",
        "@list": [
          { "xml:id": "video-01", "xml:lang": "en-US" },
          { "xml:id": "video-02", "xml:lang": "en" },
        ],
      } );
    } );
  } );
} );
