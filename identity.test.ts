import skipIf from 'skip-if';

import {
  HVML,
  Video,
  Version,
  Presentation,
} from './hvml.js';
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
  } );
} );
