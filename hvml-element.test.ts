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

      it( 'preserves string values for terms without dedicated setters when building the MOM from JSON', () => {
        hvml = new HVML( './examples/nested-terms.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const firstChild = MOM.children[0];

          expect( firstChild ).toBeInstanceOf( Video );
          expect( firstChild ).toMatchObject( {
            "type": "personal",
            "recorded": "2016-09-17",
          } );
        } );
      } );

      it( 'builds nested elements recursively when their JSON values contain their own terms', () => {
        hvml = new HVML( './examples/nested-terms.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const video = MOM.children[0];
          const showing = video.children[0];

          expect( showing.nodeName ).toBe( 'showing' );
          expect( showing ).toMatchObject( {
            "scope": "release",
          } );

          const venue = showing.children[0];

          expect( venue.nodeName ).toBe( 'venue' );
          expect( venue ).toMatchObject( {
            "type": "site",
            "uri": "https://www.youtube.com/watch?v=nWdWq3hMwao",
          } );
        } );
      } );

      it( 'creates one MOM element per entry when a JSON term holds an array of repeated elements', () => {
        hvml = new HVML( './examples/nested-terms.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const video = MOM.children[0];
          const presentations = video.children.filter( ( child ) => child.nodeName === 'presentation' );

          expect( presentations.length ).toBe( 2 );
          expect( presentations[0].id ).toBe( 'first-presentation' );
          expect( presentations[1].id ).toBe( 'second-presentation' );
        } );
      } );

      it( 'names DOM-serialized XHTML nodes by their @type, with #text for text nodes, when building the MOM', () => {
        hvml = new HVML( './examples/hvml.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const video = MOM.children[0];
          const presentation = video.children.filter( ( child ) => child.nodeName === 'presentation' )[0];
          const choice = presentation.children[0];
          const name = choice.children[0];
          const div = name.children[0];

          expect( div.nodeName ).toBe( 'html:div' );
          expect( div.children.map( ( child ) => child.nodeName ) ).toEqual( ['#text', 'code', '#text'] );
          expect( div.children[1] ).toMatchObject( {
            "style": "font-family: inherit; font-weight: bold;",
            "textContent": "hugh.today/2016-09-17/live",
          } );
        } );
      } );

      it( 'converts number and boolean values to strings when building the MOM, matching their XML lexical forms', () => {
        hvml = new HVML( './examples/typed-scalars.jsonld' );
        return hvml.ready.then( () => {
          const MOM = hvml!.toMom();
          const video = MOM.children[0];
          const presentation = video.children[0];

          expect( presentation.nodeName ).toBe( 'presentation' );
          expect( presentation ).toMatchObject( {
            "width": "23",
            "hidden": "true",
          } );
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
        "@graph": [
          { "@type": "video", "xml:id": "video-01", "xml:lang": "en-US" },
          { "@type": "video", "xml:id": "video-02", "xml:lang": "en" },
        ],
      } );
    } );

    it( 'renders multiple root-level elements as a JSON-LD named graph, each node carrying its own children', () => {
      hvmlElement = new HVMLElement();
      const seriesOne = new Series( {
        "id": "series-01",
      } );
      const episodeOne = new Video( {
        "id": "episode-01",
      } );
      const seriesTwo = new Series( {
        "id": "series-02",
      } );

      seriesOne.appendChild( episodeOne );
      hvmlElement.appendChild( seriesOne );
      hvmlElement.appendChild( seriesTwo );

      expect( hvmlElement.toJson() ).toEqual( {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
        "@graph": [
          {
            "@type": "series",
            "xml:id": "series-01",
            "video": {
              "xml:id": "episode-01",
            },
          },
          {
            "@type": "series",
            "xml:id": "series-02",
          },
        ],
      } );
    } );

    it( 'renders multiple root-level XML elements as a JSON-LD named graph', ( done ) => {
      hvml = new HVML( './examples/series-group.xml' );
      void hvml.ready.then( () => {
        const json = hvml!.toJson() as Record<string, unknown>;
        const graph = json['@graph'] as Array<Record<string, unknown>>;

        expect( json['@type'] ).toBeUndefined();
        expect( graph ).toHaveLength( 2 );
        expect( graph[0] ).toStrictEqual( {
          "@type": "series",
          "xml:id": "hughs-vlog",
          "title": "Hugh’s Vlog",
          "series": {
            "xml:id": "season-01",
            "title": "Season 1",
            "video": {
              "xml:id": "episode-01",
              "title": "Introduction",
            },
          },
        } );
        expect( graph[1] ).toMatchObject( {
          "@type": "group",
          "xml:id": "film-diary",
          "type": "series",
          "title": "Film Diary",
          "video": {
            "xml:id": "entry-01",
            "title": "Week 1: Drive",
          },
        } );
        done();
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
