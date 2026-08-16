import { readFileSync } from 'fs';
import jsonld from 'jsonld';
import type { JsonLdDocument } from 'jsonld';

const HVML_VOCABULARY = 'https://hypervideo.tech/hvml#';

/**
 * `@types/jsonld`’s expand() overloads reject inline document
 * literals, resolving to the callback overload and typing the result
 * `void`. One cast per suite, in one place.
 */
async function expandDocument( document: Record<string, unknown> ): Promise<Record<string, unknown>[]> {
  const expanded = await jsonld.expand( document as JsonLdDocument );
  return expanded as unknown as Record<string, unknown>[];
}

describe( 'HVML JSON-LD context', () => {
  const context = (
    JSON.parse( readFileSync( './context/hvml.context.jsonld', 'utf8' ) ) as { '@context': Record<string, unknown> }
  )['@context'];

  it( 'expands unprefixed element terms against the HVML vocabulary', async () => {
    const expanded = await expandDocument( {
      "@context": context,
      "@type": "video",
      "title": "Drive",
    } );

    expect( expanded ).toHaveLength( 1 );
    expect( expanded[0]['@type'] ).toEqual( [`${HVML_VOCABULARY}video`] );
    expect( expanded[0] ).toHaveProperty( [`${HVML_VOCABULARY}title`] );
  } );

  /**
   * JSON-LD forbids a colon-bearing term from aliasing anything
   * (a term shaped like `xml:id` must expand to itself), so the twin
   * spells minted identity as bare `@id`. The serializer prepends
   * `#` to `xml:id` values on the way out; a bare relative value
   * would resolve as a sibling path instead of a fragment.
   */
  it( 'mints fragment IRIs: a `#`-prefixed `@id` resolves against the document base', async () => {
    const expanded = await expandDocument( {
      "@context": [context, { "@base": "https://id.nospoon.tv/2011/drive" }],
      "@type": "video",
      "@id": "#theatrical",
    } );

    expect( expanded[0]['@id'] ).toBe( 'https://id.nospoon.tv/2011/drive#theatrical' );
  } );

  it( 'cites with `about`: the referenced IRI becomes the node identifier', async () => {
    const expanded = await expandDocument( {
      "@context": context,
      "@type": "video",
      "about": "https://id.nospoon.tv/2011/drive",
      "title": "Drive",
    } );

    expect( expanded[0]['@id'] ).toBe( 'https://id.nospoon.tv/2011/drive' );
  } );

  it( 'expands multiple root-level videos under `@graph` to one node apiece', async () => {
    const expanded = await expandDocument( {
      "@context": context,
      "@graph": [
        { "@type": "video", "title": "First" },
        { "@type": "video", "title": "Second" },
      ],
    } );

    expect( expanded ).toHaveLength( 2 );
  } );

  it( 'preserves `presentation` document order as an RDF list', async () => {
    const expanded = await expandDocument( {
      "@context": context,
      "@type": "video",
      "presentation": [
        { "@type": "presentation" },
        { "@type": "presentation" },
      ],
    } );

    const presentations = expanded[0][`${HVML_VOCABULARY}presentation`] as Array<Record<string, unknown>>;

    expect( presentations ).toHaveLength( 1 );
    expect( presentations[0] ).toHaveProperty( ['@list'] );
    expect( presentations[0]['@list'] ).toHaveLength( 2 );
  } );

  it( 'expands `xlink` and `css` attribute terms to their prefix IRIs', async () => {
    const expanded = await expandDocument( {
      "@context": context,
      "@type": "goto",
      "xlink:actuate": "onRequest",
      "xlink:href": "https://cine.example/sources/refn-interview",
      "css:font-size": "12px",
      "css:font-family": "sans-serif",
    } );

    const node = expanded[0];

    expect( node ).toHaveProperty( ['http://www.w3.org/1999/xlink#actuate'] );
    expect(
      ( node['http://www.w3.org/1999/xlink#href'] as Array<Record<string, unknown>> )[0]['@id'],
    ).toBe( 'https://cine.example/sources/refn-interview' );
    expect( node ).toHaveProperty( ['https://www.w3.org/TR/CSS/#font-size'] );
    expect( node ).toHaveProperty( ['https://www.w3.org/TR/CSS/#font-family'] );
  } );

  it( 'expands the legacy twin fixture without errors', async () => {
    const fixture = JSON.parse( readFileSync( './examples/hvml.jsonld', 'utf8' ) ) as Record<string, unknown>;

    /**
     * The published context URL still serves the conflicted document;
     * M9 publishes this file at hypervideo.tech. Until then the twin
     * fixtures expand against the in-repo source.
     */
    fixture['@context'] = ( fixture['@context'] as unknown[] ).map(
      ( entry ) => ( ( typeof entry === 'string' ) ? context : entry ),
    );

    const expanded = await expandDocument( fixture );

    expect( expanded.length ).toBeGreaterThan( 0 );
  } );
} );
