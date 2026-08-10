import { readFileSync } from 'fs';
import skipIf from 'skip-if';
import jsonld from 'jsonld';
import type { JsonLdDocument } from 'jsonld';

import { HVML } from './hvml.js';

const libxmljsUnavailable = ( () => {
  let canParseXml = false;

  try {
    ( require.resolve( 'libxmljs' ) );
    canParseXml = true;
  } catch {}

  return !canParseXml;
} )();

const skipIfLibxmljsUnavailable = skipIf( () => libxmljsUnavailable );

const context = (
  JSON.parse( readFileSync( './context/hvml.context.jsonld', 'utf8' ) ) as { '@context': Record<string, unknown> }
)['@context'];

/**
 * Canonicalizes one serialization to URDNA2015 N-Quads, so the twins
 * compare at the RDF layer: triple-equal rather than string-equal.
 * The published context URL still serves the conflicted document; M9
 * publishes the in-repo source at hypervideo.tech. Until then both
 * twins expand against the local file.
 */
async function canonicalize( document: Record<string, unknown> ): Promise<string> {
  return jsonld.canonize( { ...document, "@context": context } as JsonLdDocument, {
    "algorithm": "URDNA2015",
    "format": "application/n-quads",
  } );
}

/**
 * The spec’s twin-serialization conformance check: an HVML document’s
 * XML and JSON-LD serializations must describe the same RDF dataset.
 */
describe( 'Twin serialization', () => {
  skipIfLibxmljsUnavailable( 'canonicalizes the XML and JSON-LD twins to the same RDF dataset', async () => {
    const hvml = new HVML( './examples/hvml.xml' );
    await hvml.ready;

    const fromXml = await canonicalize( hvml.toJson() as Record<string, unknown> );
    const fromJson = await canonicalize(
      JSON.parse( readFileSync( './examples/hvml.jsonld', 'utf8' ) ) as Record<string, unknown>,
    );

    // Two empty datasets are also “equal”; demand substance first
    expect( fromXml ).not.toBe( '' );
    expect( fromXml ).toBe( fromJson );
  } );

  skipIfLibxmljsUnavailable( 'canonicalizes an independently published annotation track to the same RDF dataset from either serialization', async () => {
    const hvml = new HVML( './examples/annotation-track.xml' );
    await hvml.ready;

    const fromXml = await canonicalize( hvml.toJson() as Record<string, unknown> );
    const fromJson = await canonicalize(
      JSON.parse( readFileSync( './examples/annotation-track.jsonld', 'utf8' ) ) as Record<string, unknown>,
    );

    expect( fromXml ).not.toBe( '' );
    expect( fromXml ).toBe( fromJson );
  } );
} );
