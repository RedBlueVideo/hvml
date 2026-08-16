import { readFileSync } from 'fs';
import skipIf from 'skip-if';

import {
  HVML,
  Video,
  Version,
  Presentation,
} from './hvml.js';
import Data from './util/data.js';
import { mintIri } from './util/iri.js';

const libxmljsUnavailable = ( () => {
  let canParseXml = false;

  try {
    ( require.resolve( 'libxmljs' ) );
    canParseXml = true;
  } catch {}

  return !canParseXml;
} )();

const skipIfLibxmljsUnavailable = skipIf( () => libxmljsUnavailable );

const FLAGSHIP_BASE = 'https://hugh.today/2016-09-17/';

/**
 * A registry-shaped document built imperatively: a base, a primary
 * work, and one version below it.
 */
function buildRegistryDocument( base?: string ): { hvml: HVML; video: Video; version: Version } {
  const hvml = new HVML();
  const video = new Video( { "id": "drive" } );
  const version = new Version( { "id": "theatrical" } );

  if ( base ) {
    hvml['xml:base'] = base;
  }

  video.appendChild( version );
  hvml.appendChild( video );

  return { hvml, video, version };
}

describe( 'mintIri', () => {
  it( 'mints a fragment IRI from the base and the xml:id', () => {
    expect( mintIri( 'https://id.nospoon.tv/2011/drive', 'theatrical' ) ).toBe( 'https://id.nospoon.tv/2011/drive#theatrical' );
  } );

  it( 'mints the base itself for the primary child', () => {
    expect( mintIri( 'https://id.nospoon.tv/2011/drive', 'drive', true ) ).toBe( 'https://id.nospoon.tv/2011/drive' );
  } );

  it( 'preserves native-script IRIs character for character', () => {
    expect( mintIri( 'https://id.nospoon.tv/1950/羅生門', 'theatrical' ) ).toBe( 'https://id.nospoon.tv/1950/羅生門#theatrical' );
  } );

  it( 'replaces a fragment already on the base', () => {
    expect( mintIri( 'https://id.example/w#stale', 'theatrical' ) ).toBe( 'https://id.example/w#theatrical' );
    expect( mintIri( 'https://id.example/w#stale', 'w', true ) ).toBe( 'https://id.example/w' );
  } );
} );

describe( 'Identity', () => {
  let hvml: HVML | undefined;

  beforeEach( () => {
    hvml = undefined;
  } );

  describe( 'getElementByXmlId', () => {
    it( 'finds a descendant by its xml:id at any depth', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;
      const MOM = hvml.toMom();

      const rebroadcast = MOM.getElementByXmlId( 'rebroadcast' );
      const overlay = MOM.getElementByXmlId( 'mfa-credit' );
      const version = MOM.getElementByXmlId( 'live-stream' );

      expect( rebroadcast ).toBeInstanceOf( Presentation );
      expect( overlay?.nodeName ).toBe( 'overlay' );
      expect( version ).toBeInstanceOf( Version );
      expect( MOM.children[0].getElementByXmlId( 'mfa-credit' ) ).toBe( overlay );
    } );

    it( 'returns null when no descendant carries the xml:id', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;

      expect( hvml.toMom().getElementByXmlId( 'nope' ) ).toBeNull();
    } );
  } );

  describe( 'getBase', () => {
    skipIfLibxmljsUnavailable( 'reads xml:base from an XML document’s root', async () => {
      hvml = new HVML( './examples/hvml.xml' );
      await hvml.ready;

      expect( hvml.getBase() ).toBe( FLAGSHIP_BASE );
    } );

    skipIfLibxmljsUnavailable( 'reports no base for an XML document that declares none', async () => {
      hvml = new HVML( './examples/annotation-track.xml' );
      await hvml.ready;

      expect( hvml.getBase() ).toBeNull();
    } );

    it( 'reads @base from a JSON-LD document’s context', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;

      expect( hvml.getBase() ).toBe( FLAGSHIP_BASE );
      expect( hvml.toMom().getBase() ).toBe( FLAGSHIP_BASE );
    } );

    it( 'reads xml:base set on a MOM root', () => {
      const { hvml: registry } = buildRegistryDocument( 'https://id.nospoon.tv/2011/drive' );

      expect( registry.getBase() ).toBe( 'https://id.nospoon.tv/2011/drive' );
      expect( new HVML().getBase() ).toBeNull();
    } );
  } );

  describe( 'getIri', () => {
    it( 'mints the base for the primary child and fragments below it', () => {
      const { hvml: registry, video, version } = buildRegistryDocument( 'https://id.nospoon.tv/2011/drive' );

      expect( registry.getIri( video ) ).toBe( 'https://id.nospoon.tv/2011/drive' );
      expect( registry.getIri( version ) ).toBe( 'https://id.nospoon.tv/2011/drive#theatrical' );
    } );

    it( 'cites the about IRI when one is present', () => {
      const { hvml: registry, video } = buildRegistryDocument( 'https://cine.example/tracks/drive-trivia' );
      video.about = 'https://id.nospoon.tv/2011/drive';

      expect( registry.getIri( video ) ).toBe( 'https://id.nospoon.tv/2011/drive' );
    } );

    it( 'mints nothing without a base: local names only', () => {
      const { hvml: registry, video, version } = buildRegistryDocument();

      expect( registry.getIri( video ) ).toBeNull();
      expect( registry.getIri( version ) ).toBeNull();
    } );

    it( 'mints nothing for an element without an xml:id', () => {
      const { hvml: registry, video } = buildRegistryDocument( 'https://id.nospoon.tv/2011/drive' );
      const presentation = new Presentation();
      video.appendChild( presentation );

      expect( registry.getIri( presentation ) ).toBeNull();
    } );

    it( 'names the flagship fixture’s subjects', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;
      const MOM = hvml.toMom();
      const video = MOM.children[0];

      // The video both mints and cites; the citation names the node
      expect( MOM.getIri( video ) ).toBe( 'https://id.nospoon.tv/2016/hughs-vlog/overnight-dance-party-at-the-mfa' );
      expect( MOM.getIri( MOM.getElementByXmlId( 'live-stream' )! ) ).toBe( `${FLAGSHIP_BASE}#live-stream` );
      expect( MOM.getIri( MOM.getElementByXmlId( 'rebroadcast' )! ) ).toBe( 'https://hugh.today/2016-09-17/live' );
    } );
  } );

  describe( 'serialization', () => {
    it( 'emits @base and minted @ids from a MOM whose root declares a base', () => {
      const { hvml: registry } = buildRegistryDocument( 'https://id.nospoon.tv/2011/drive' );

      expect( registry.toJson() ).toStrictEqual( {
        "@context": [
          "https://redblue.video/guide/hvml.context.jsonld",
          { "@base": "https://id.nospoon.tv/2011/drive" },
        ],
        "@type": "video",
        "@id": "",
        "xml:id": "drive",
        "version": {
          "@id": "#theatrical",
          "xml:id": "theatrical",
        },
      } );
    } );

    it( 'emits no @id when the element cites with about', () => {
      const { hvml: registry, video } = buildRegistryDocument( 'https://cine.example/tracks/drive-trivia' );
      video.about = 'https://id.nospoon.tv/2011/drive';

      const json = registry.toJson() as Record<string, unknown>;

      expect( json ).not.toHaveProperty( '@id' );
      expect( json.about ).toBe( 'https://id.nospoon.tv/2011/drive' );
      expect( json.version ).toStrictEqual( { "@id": "#theatrical", "xml:id": "theatrical" } );
    } );

    it( 'emits neither @base nor @id from a MOM without a base', () => {
      const { hvml: registry } = buildRegistryDocument();

      expect( registry.toJson() ).toStrictEqual( {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
        "@type": "video",
        "xml:id": "drive",
        "version": {
          "xml:id": "theatrical",
        },
      } );
    } );

    it( 'mints fragments for every root child of a named graph', () => {
      const registry = new HVML();
      registry['xml:base'] = 'https://id.example/hughs-vlog';
      registry.appendChild( new Video( { "id": "first" } ) );
      registry.appendChild( new Video( { "id": "second" } ) );

      const json = registry.toJson() as { '@graph': Record<string, unknown>[] };

      expect( json['@graph'][0]['@id'] ).toBe( '' );
      expect( json['@graph'][1]['@id'] ).toBe( '#second' );
    } );

    skipIfLibxmljsUnavailable( 'emits @base and minted @ids from an XML document that declares a base', async () => {
      hvml = new HVML( './examples/hvml.xml' );
      await hvml.ready;

      const json = hvml.toJson() as Record<string, unknown>;
      const version = json.version as Record<string, unknown>;
      const presentations = json.presentation as Record<string, unknown>[];
      const choice = presentations[0].choice as Record<string, unknown>;
      const overlay = presentations[1].overlay as Record<string, unknown>;

      expect( json['@context'] ).toStrictEqual( [
        "https://redblue.video/guide/hvml.context.jsonld",
        { "@base": FLAGSHIP_BASE },
      ] );
      // The video cites; the citation names the node
      expect( json ).not.toHaveProperty( '@id' );
      expect( version['@id'] ).toBe( '#live-stream' );
      expect( choice['@id'] ).toBe( '#full-stream' );
      expect( presentations[1] ).not.toHaveProperty( '@id' );
      expect( overlay['@id'] ).toBe( '#mfa-credit' );
    } );

    it( 'keeps the boilerplate context for an empty document', () => {
      expect( Data.getJsonBoilerplate() ).toStrictEqual( {
        "@context": "https://redblue.video/guide/hvml.context.jsonld",
      } );
    } );
  } );

  describe( 'ingest', () => {
    it( 'reads @base and drops derived @ids when building the MOM', async () => {
      hvml = new HVML( './examples/hvml.jsonld' );
      await hvml.ready;
      const MOM = hvml.toMom();
      const version = MOM.getElementByXmlId( 'live-stream' )!;

      expect( MOM['xml:base'] ).toBe( FLAGSHIP_BASE );
      expect( version.id ).toBe( 'live-stream' );
      expect( version ).not.toHaveProperty( '@id' );
      expect( MOM.children[0] ).not.toHaveProperty( '@context' );
    } );

    it( 'recovers identity from @id alone: fragments become xml:ids, absolutes become about', () => {
      const document = new HVML();
      document.json = {
        "@context": [
          "https://redblue.video/guide/hvml.context.jsonld",
          { "@base": "https://id.nospoon.tv/2011/drive" },
        ],
        "@type": "video",
        "@id": "https://id.nospoon.tv/2011/drive",
        "version": {
          "@id": "#theatrical",
        },
      } as HVML['json'];

      const MOM = document.toMom();
      const video = MOM.children[0] as Video;
      const version = video.children[0];

      expect( video.about ).toBe( 'https://id.nospoon.tv/2011/drive' );
      expect( video.id ).toBeUndefined();
      expect( version.id ).toBe( 'theatrical' );
      expect( version ).not.toHaveProperty( '@id' );
    } );
  } );

  it( 'the flagship JSON-LD twin carries the XML twin’s base', () => {
    const fixture = JSON.parse( readFileSync( './examples/hvml.jsonld', 'utf8' ) ) as Record<string, unknown>;

    expect( fixture['@context'] ).toStrictEqual( [
      "https://redblue.video/guide/hvml.context.jsonld",
      { "@base": FLAGSHIP_BASE },
    ] );
  } );
} );
