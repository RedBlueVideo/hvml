const HVMLElement = require( './hvml-element' );
const { HVML, Video, Series } = require( './hvml' );

describe( 'HVMLElement', () => {
  describe( 'MOM Manipulation', () => {
    it( 'sets its own ID if specified in the constructor', () => {
      const hvmlElement = new HVMLElement( {
        "id": "anonymous-element",
      } );

      expect( hvmlElement.id ).toBe( 'anonymous-element' );
    } );

    it( 'appends children', () => {
      const hvmlElement = new HVMLElement();
      const channel = new Video();
      const secondChannel = new Video();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children.length ).toBe( 2 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 2 );
      expect( hvmlElement.children[0] ).toStrictEqual( channel );
      expect( hvmlElement.children[1] ).toStrictEqual( secondChannel );
    } );

    it( 'registers named indices when appending children with IDs', () => {
      const hvmlElement = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children['welcome-to-my-channel'] ).toStrictEqual( channel );
      expect( hvmlElement.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );

    it( 'removes children', () => {
      const hvmlElement = new HVMLElement();
      const channel = new Video();
      const secondChannel = new Video();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );
      hvmlElement.removeChild( channel );

      expect( hvmlElement.children.length ).toBe( 1 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 1 );
    } );

    it( 'deregisters named indices when removing children with IDs', () => {
      const hvmlElement = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );
      hvmlElement.removeChild( channel );

      expect( hvmlElement.children.length ).toBe( 1 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 2 );
      expect( hvmlElement.children['welcome-to-my-channel'] ).toBeUndefined();
      expect( hvmlElement.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );
  } );

  // describe( 'toMom', () => {} );

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

    it( 'produces the same output whether converting from children or file', ( done ) => {
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

      const imperativeToJson = hvmlElement.toJson();

      const hvml = new HVML( './examples/series.xml' );
      hvml.ready.then( () => {
        const declarativeToJson = hvml.toJson();

        expect( imperativeToJson ).toStrictEqual( declarativeToJson );
        done();
      } );
    } );
  } );
} );
