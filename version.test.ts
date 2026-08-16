import {
  HVML,
  Video,
  Version,
} from './hvml.js';
import Validation from './util/validation.js';

describe( 'Version', () => {
  describe( 'title', () => {
    it( 'stores and returns a plain-string title', () => {
      const version = new Version();

      version.setTitle( 'Theatrical cut' );

      expect( version.getTitle() ).toBe( 'Theatrical cut' );
      expect( version.title ).toBe( 'Theatrical cut' );
    } );

    it( 'rejects a non-string title', () => {
      const version = new Version();

      expect( () => version.setTitle( 42 as unknown as string ) ).toThrow( Validation.TypeError );
    } );
  } );

  describe( 'runtime', () => {
    it( 'stores a number as decimal seconds', () => {
      const version = new Version();

      version.setRuntime( 5880 );

      expect( version.runtime ).toBe( '5880' );
      expect( version.getRuntime() ).toBe( 5880 );
      expect( version.getRuntime( 'minutes' ) ).toBe( 98 );
      expect( version.getRuntime( 'hours' ) ).toBeCloseTo( 1.6333, 3 );
      expect( version.getRuntime( 'iso8601' ) ).toBe( 'PT5880S' );
    } );

    it( 'keeps an ISO 8601 duration as given and converts on read', () => {
      const version = new Version();

      version.setRuntime( 'PT1H38M' );

      expect( version.runtime ).toBe( 'PT1H38M' );
      expect( version.getRuntime( 'iso8601' ) ).toBe( 'PT1H38M' );
      expect( version.getRuntime() ).toBe( 5880 );
      expect( version.getRuntime( 'minutes' ) ).toBe( 98 );
    } );

    it( 'keeps a decimal string in its lexical form', () => {
      const version = new Version();

      version.setRuntime( '5880.5' );

      expect( version.runtime ).toBe( '5880.5' );
      expect( version.getRuntime() ).toBe( 5880.5 );
    } );

    it( 'rejects negative and non-numeric runtimes', () => {
      const version = new Version();

      expect( () => version.setRuntime( -1 ) ).toThrow( Validation.RangeError );
      expect( () => version.setRuntime( 'ninety-eight minutes' ) ).toThrow( Validation.TypeError );
    } );

    it( 'reads as undefined before any runtime is set', () => {
      expect( new Version().getRuntime() ).toBeUndefined();
    } );
  } );

  describe( 'description', () => {
    it( 'stores and returns plain text', () => {
      const version = new Version();

      version.setDescription( 'Refn’s theatrical version.' );

      expect( version.getDescription() ).toBe( 'Refn’s theatrical version.' );
    } );

    it( 'sets XHTML and reads it back wrapped', () => {
      const version = new Version();

      version.setDescription( '<p>Refn’s theatrical version.</p>', 'xhtml' );

      expect( version.getDescription( 'xhtml' ) ).toBe( '<div xmlns="http://www.w3.org/1999/xhtml"><p>Refn’s theatrical version.</p></div>' );
      expect( version.getDescription() ).toBe( 'Refn’s theatrical version.' );
    } );

    it( 'returns null before any description is set', () => {
      expect( new Version().getDescription() ).toBeNull();
    } );
  } );

  it( 'routes ingested text children through the setters', async () => {
    const hvml = new HVML( './examples/roundtrip.jsonld' );
    await hvml.ready;
    const version = hvml.toMom().getElementByXmlId( 'theatrical' ) as Version;

    expect( version ).toBeInstanceOf( Version );
    expect( version.getTitle() ).toBe( 'Theatrical cut' );
    expect( version.getRuntime() ).toBe( 5880 );
    expect( version.getDescription() ).toBe( 'Refn’s theatrical version.' );
  } );

  it( 'serializes what the setters set', () => {
    const hvml = new HVML();
    const video = new Video( { "id": "drive" } );
    const version = new Version( { "id": "theatrical" } );

    version.type = 'theatrical';
    version.setTitle( 'Theatrical cut' );
    version.setRuntime( 5880 );
    version.setDescription( 'Refn’s theatrical version.' );
    video.appendChild( version );
    hvml.appendChild( video );

    expect( hvml.toJson() ).toStrictEqual( {
      "@context": "https://redblue.video/guide/hvml.context.jsonld",
      "@type": "video",
      "xml:id": "drive",
      "version": {
        "xml:id": "theatrical",
        "type": "theatrical",
        "title": "Theatrical cut",
        "runtime": 5880,
        "description": "Refn’s theatrical version.",
      },
    } );
  } );
} );
