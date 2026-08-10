import {
  HVML,
  Version,
  Overlay,
  Content,
  Sync,
} from './hvml.js';

describe( 'H5 vocabulary classes', () => {
  let hvml: HVML | undefined;

  beforeEach( () => {
    hvml = undefined;
  } );

  it( 'builds dedicated element classes for the version, overlay, content, and sync vocabulary', () => {
    hvml = new HVML( './examples/hvml.jsonld' );
    return hvml.ready.then( () => {
      const MOM = hvml!.toMom();
      const video = MOM.children[0];
      const version = video.children.filter( ( child ) => child.nodeName === 'version' )[0];
      const rebroadcast = video.children.filter( ( child ) => child.nodeName === 'presentation' )[1];
      const sync = rebroadcast.children.filter( ( child ) => child.nodeName === 'sync' )[0];
      const overlay = rebroadcast.children.filter( ( child ) => child.nodeName === 'overlay' )[0];
      const content = overlay.children.filter( ( child ) => child.nodeName === 'content' )[0];

      expect( version ).toBeInstanceOf( Version );
      expect( sync ).toBeInstanceOf( Sync );
      expect( overlay ).toBeInstanceOf( Overlay );
      expect( content ).toBeInstanceOf( Content );
    } );
  } );
} );

describe( 'Content', () => {
  let hvml: HVML | undefined;

  beforeEach( () => {
    hvml = undefined;
  } );

  /**
   * Reads a MOM built from a fixture down to its one `content`
   * element. Both twin fixtures place it at
   * video → presentation → overlay → content.
   */
  function getIngestedContent( fixturePath: string ): Promise<Content> {
    hvml = new HVML( fixturePath );
    return hvml.ready.then( () => {
      const MOM = hvml!.toMom();
      const video = MOM.children[0];
      const presentations = video.children.filter( ( child ) => child.nodeName === 'presentation' );
      const overlay = presentations[presentations.length - 1].children
        .filter( ( child ) => child.nodeName === 'overlay' )[0];
      const content = overlay.children.filter( ( child ) => child.nodeName === 'content' )[0];

      expect( content ).toBeInstanceOf( Content );
      return content as Content;
    } );
  }

  it( 'surfaces an ingested XHTML payload as an XML string', async () => {
    const content = await getIngestedContent( './examples/annotation-track.jsonld' );

    expect( content.getContent( 'xhtml' ) ).toBe(
      '<div xmlns="http://www.w3.org/1999/xhtml">Refn commissioned four scorpion jackets.</div>',
    );
  } );

  it( 'extracts the text of an ingested XHTML payload', async () => {
    const content = await getIngestedContent( './examples/hvml.jsonld' );

    expect( content.getContent() ).toBe( 'Filmed at the Museum of Fine Arts Boston#mfaNOW' );
  } );

  it( 'accepts a raw XHTML string and rebuilds the payload subtree', () => {
    const content = new Content();

    content.setContent( '<p>Four scorpion jackets.</p>', 'xhtml' );

    expect( content.type ).toBe( 'xhtml' );
    expect( content.children[0].nodeName ).toBe( 'html:div' );
    expect( content.children[0].children[0].nodeName ).toBe( 'p' );
    expect( content.getContent( 'xhtml' ) ).toBe(
      '<div xmlns="http://www.w3.org/1999/xhtml"><p>Four scorpion jackets.</p></div>',
    );
  } );

  it( 'accepts a JSON-LD-serialized XHTML payload', () => {
    const content = new Content();

    content.setContent( {
      "childNodes": [
        {
          "@type": "p",
          "textContent": "Four scorpion jackets.",
        },
      ],
    }, 'xhtml' );

    expect( content.getContent( 'xhtml' ) ).toBe(
      '<div xmlns="http://www.w3.org/1999/xhtml"><p>Four scorpion jackets.</p></div>',
    );
  } );

  it( 'accepts plain text', () => {
    const content = new Content();

    content.setContent( 'Four scorpion jackets.' );

    expect( content.type ).toBe( 'text' );
    expect( content.getContent() ).toBe( 'Four scorpion jackets.' );
  } );

  it( 'returns null before any payload is set', () => {
    const content = new Content();

    expect( content.getContent() ).toBeNull();
  } );
} );
