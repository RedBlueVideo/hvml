import { HVMLElement } from './hvml-element.js';
import { HVML, HVMLSeriesElement, HVMLVideoElement } from './hvml.js';

describe( 'HVMLElement', () => {
  let hvml;
  let hvmlElement;

  describe( 'MOM Manipulation', () => {
    beforeEach( () => {
      hvml = undefined;
      hvmlElement = undefined;
    } );

    it( 'sets its own ID if specified in the constructor', () => {
      hvmlElement = new HVMLElement( {
        "id": "anonymous-element",
      } );

      expect( hvmlElement.id ).toBe( 'anonymous-element' );
    } );

    it( 'appends children', () => {
      hvmlElement = new HVMLElement();
      const channel = new HVMLVideoElement();
      const secondChannel = new HVMLVideoElement();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children.length ).toBe( 2 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 2 );
      expect( hvmlElement.children[0] ).toStrictEqual( channel );
      expect( hvmlElement.children[1] ).toStrictEqual( secondChannel );
    } );

    it( 'registers named indices when appending children with IDs', () => {
      hvmlElement = new HVMLElement();
      const channel = new HVMLVideoElement( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new HVMLVideoElement( {
        "id": "welcome-to-my-second-channel",
      } );

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children['welcome-to-my-channel'] ).toStrictEqual( channel );
      expect( hvmlElement.children['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );

    it( 'removes children', () => {
      hvmlElement = new HVMLElement();
      const channel = new HVMLVideoElement();
      const secondChannel = new HVMLVideoElement();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );
      hvmlElement.removeChild( channel );

      expect( hvmlElement.children.length ).toBe( 1 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 1 );
    } );

    it( 'deregisters named indices when removing children with IDs', () => {
      hvmlElement = new HVMLElement();
      const channel = new HVMLVideoElement( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new HVMLVideoElement( {
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

  describe( 'toMom', () => {
    beforeEach( () => {
      hvml = undefined;
      hvmlElement = undefined;
    } );

    it( 'works with non-root elements', () => {
      const video = new HVMLVideoElement();
      const videoMom = video.toMom();

      const series = new HVMLSeriesElement();
      const seriesMom = series.toMom();

      expect( videoMom.constructor ).toBe( HVML );
      expect( videoMom.children[0].constructor ).toBe( HVMLVideoElement );

      expect( seriesMom.constructor ).toBe( HVML );
      expect( seriesMom.children[0].constructor ).toBe( HVMLSeriesElement );
    } );

    describe( 'Video', () => {
      beforeEach( () => {
        hvml = undefined;
        hvmlElement = undefined;
      } );

      it( 'handles text descriptions', () => {
        hvml = new HVML( './examples/text-description.jsonld' );
        hvml.ready.then( () => {
          expect( hvml.toMom().children[0].description.text ).toBe( 'Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/\n\n#mfaNOW #mfaLateNites' );
        } )
          .catch( error => console.error( error ) );
      } );

      it( 'handles object descriptions', () => {
        hvml = new HVML( './examples/text-description--object.jsonld' );
        hvml.ready.then( () => {
          const MOM = hvml.toMom();
          const firstChild = MOM.children[0];
          // const { description } = children;

          console.error( 'MOM', MOM );
          console.error( 'children', MOM.children );
          console.error( 'firstChild', firstChild );
          // console.error( 'description', description );
          // expect( description.text ).toBe( 'Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/\n\n#mfaNOW #mfaLateNites' );
        } )
          .catch( ( error ) => { throw new Error( error ); } );
      } );
    } );
  } );

  describe( 'toJson', () => {
    beforeEach( () => {
      hvml = undefined;
      hvmlElement = undefined;
    } );

    it( 'converts children', () => {
      hvmlElement = new HVMLElement();
      const hughsVlog = new HVMLSeriesElement( {
        "id": "hughs-vlog",
        "title": "Hugh’s Vlog",
      } );
      const seasonOne = new HVMLSeriesElement( {
        "id": "season-01",
      } );
      const episodeOne = new HVMLVideoElement( {
        "id": "episode-01",
      } );
      const episodeTwo = new HVMLVideoElement( {
        "id": "episode-02",
      } );
      const episodeThree = new HVMLVideoElement( {
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
      hvmlElement = new HVMLElement();
      const videoOne = new HVMLVideoElement( {
        "id": "video-01",
        "lang": "en-US",
      } );
      const videoTwo = new HVMLVideoElement( {
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
      hvmlElement = new HVMLElement();
      const hughsVlog = new HVMLSeriesElement( {
        "id": "hughs-vlog",
        "title": "Hugh’s Vlog",
      } );
      const seasonOne = new HVMLSeriesElement( {
        "id": "season-01",
      } );
      const episodeOne = new HVMLVideoElement( {
        "id": "episode-01",
      } );
      const episodeTwo = new HVMLVideoElement( {
        "id": "episode-02",
      } );
      const episodeThree = new HVMLVideoElement( {
        "id": "episode-03",
      } );

      seasonOne.appendChild( episodeOne );
      seasonOne.appendChild( episodeTwo );
      seasonOne.appendChild( episodeThree );
      hughsVlog.appendChild( seasonOne );
      hvmlElement.appendChild( hughsVlog );

      const imperativeToJson = hvmlElement.toJson();

      hvml = new HVML( './examples/series.xml' );
      hvml.ready.then( () => {
        const declarativeToJson = hvml.toJson();

        expect( imperativeToJson ).toStrictEqual( declarativeToJson );
        done();
      } );
    } );
  } );
} );
