import HVMLElement from './hvml-element.js';
import { HVML, Video, Series } from './hvml.js';

describe( 'HVMLElement', () => {
  let hvml: HVML | undefined;
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
      const channel = new Video();
      const secondChannel = new Video();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children?.length ).toBe( 2 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 2 );
      expect( hvmlElement.children?.[0] ).toStrictEqual( channel );
      expect( hvmlElement.children?.[1] ).toStrictEqual( secondChannel );
    } );

    it( 'registers named indices when appending children with IDs', () => {
      hvmlElement = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );

      expect( hvmlElement.children?.['welcome-to-my-channel'] ).toStrictEqual( channel );
      expect( hvmlElement.children?.['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );

    it( 'removes children', () => {
      hvmlElement = new HVMLElement();
      const channel = new Video();
      const secondChannel = new Video();

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );
      hvmlElement.removeChild( channel );

      expect( hvmlElement.children?.length ).toBe( 1 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 1 );
    } );

    it( 'deregisters named indices when removing children with IDs', () => {
      hvmlElement = new HVMLElement();
      const channel = new Video( {
        "id": "welcome-to-my-channel",
      } );
      const secondChannel = new Video( {
        "id": "welcome-to-my-second-channel",
      } );

      hvmlElement.appendChild( channel );
      hvmlElement.appendChild( secondChannel );
      hvmlElement.removeChild( channel );

      expect( hvmlElement.children?.length ).toBe( 1 );
      expect( Object.keys( hvmlElement.children ).length ).toBe( 2 );
      expect( hvmlElement.children?.['welcome-to-my-channel'] ).toBeUndefined();
      expect( hvmlElement.children?.['welcome-to-my-second-channel'] ).toStrictEqual( secondChannel );
    } );
  } );

  describe( 'toMom', () => {
    beforeEach( () => {
      hvml = undefined;
      hvmlElement = undefined;
    } );

    it( 'works with non-root elements', () => {
      const video = new Video();
      const videoMom = video.toMom();

      const series = new Series();
      const seriesMom = series.toMom();

      expect( videoMom.constructor ).toBe( HVML );
      expect( videoMom.children[0].constructor ).toBe( Video );

      expect( seriesMom.constructor ).toBe( HVML );
      expect( seriesMom.children[0].constructor ).toBe( Series );
    } );

    describe( 'Video', () => {
      beforeEach( () => {
        hvml = undefined;
        hvmlElement = undefined;
      } );

      it( 'handles text descriptions', ( done ) => {
        hvml = new HVML( './examples/text-description.jsonld' );
        hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const firstChild = MOM.children[0];

          expect( firstChild ).toBeInstanceOf( Video );

          if ( firstChild instanceof Video ) {
            expect( firstChild.description?.text ).toBe( 'Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/\n\n#mfaNOW #mfaLateNites' );
          }

          done();
        } )
          .catch( error => {
            console.error( error );
            done( error );
          } );
      } );

      it( 'handles object descriptions', () => {
        hvml = new HVML( './examples/text-description--object.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const firstChild = MOM.children[0];
          // const { description } = children;

          console.debug( 'MOM', MOM );
          console.debug( 'children', MOM.children );
          console.debug( 'firstChild', firstChild );
          // console.debug( 'description', description );
          // expect( description.text ).toBe( 'Full Facebook Live stream: https://www.facebook.com/hugh.guiney/videos/10100195051457860/\n\n#mfaNOW #mfaLateNites' );
        } );
      } );

      it( 'passes empty string values through when building the MOM from JSON', () => {
        hvml = new HVML( './examples/empty-values.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const firstChild = MOM.children[0];

          expect( firstChild ).toBeInstanceOf( Video );
          expect( firstChild.title ).toBe( '' );
        } );
      } );

      it( 'ignores null values when building the MOM from JSON, following JSON-LD semantics', () => {
        hvml = new HVML( './examples/empty-values.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const firstChild = MOM.children[0];

          expect( firstChild ).toBeInstanceOf( Video );
          expect( ( firstChild as Video ).episode ).toBeUndefined();
        } );
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
      hvmlElement = new HVMLElement();
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
      hvmlElement = new HVMLElement();
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

      hvml = new HVML( './examples/series.xml' );
      void hvml.ready.then( () => {
        const declarativeToJson = hvml!.toJson();

        expect( imperativeToJson ).toStrictEqual( declarativeToJson );
        done();
      } );
    } );

    it( 'renders repeated XML elements as JSON arrays, one array per element name', ( done ) => {
      hvml = new HVML( './examples/repeated-siblings.xml' );
      void hvml.ready.then( () => {
        expect( hvml!.toJson() ).toStrictEqual( {
          "@context": "https://redblue.video/guide/hvml.context.jsonld",
          "@type": "video",
          "type": "personal",
          "xml:id": "repeats",
          "title": "Repeated Siblings",
          "presentation": [
            {
              "xml:id": "first-presentation",
              "poster": "first",
            },
            {
              "xml:id": "second-presentation",
              "file": [
                { "label": "a" },
                { "label": "b" },
              ],
            },
          ],
        } );
        done();
      } )
        .catch( error => done( error ) );
    } );

    it( 'renders empty XML elements as empty JSON objects, leaving sibling elements intact', ( done ) => {
      hvml = new HVML( './examples/empty-elements.xml' );
      void hvml.ready.then( () => {
        expect( hvml!.toJson() ).toStrictEqual( {
          "@context": "https://redblue.video/guide/hvml.context.jsonld",
          "@type": "video",
          "type": "personal",
          "xml:id": "empties",
          "title": "Empty Elements",
          "episode": {},
          "description": {},
          "recorded": "2026-08-03",
          "presentation": {
            "fps": {
              "rate": "30",
              "scale": "1",
            },
            "poster": "placeholder",
          },
        } );
        done();
      } )
        .catch( error => done( error ) );
    } );

    it( 'renders repeated XML elements that themselves contain children as JSON arrays', ( done ) => {
      hvml = new HVML( './examples/nested-repeats.xml' );
      void hvml.ready.then( () => {
        expect( hvml!.toJson() ).toStrictEqual( {
          "@context": "https://redblue.video/guide/hvml.context.jsonld",
          "@type": "video",
          "type": "personal",
          "xml:id": "nested-repeats",
          "presentation": {
            "choice": [
              {
                "xml:id": "first-choice",
                "name": "First",
              },
              {
                "xml:id": "second-choice",
                "name": "Second",
              },
            ],
          },
        } );
        done();
      } )
        .catch( error => done( error ) );
    } );
  } );
} );
