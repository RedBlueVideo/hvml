import { readFileSync } from 'fs';
import skipIf from 'skip-if';

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

function readJson( path: string ): Record<string, unknown> {
  return JSON.parse( readFileSync( path, 'utf8' ) ) as Record<string, unknown>;
}

/**
 * Builds a MOM from a JSON-LD document and serializes it again from
 * a clean slate, so the result reflects the MOM alone rather than the
 * loaded JSON it was built from.
 */
function rebuildFromMom( json: Record<string, unknown> ): Record<string, unknown> {
  const document = new HVML();
  document.json = json as HVML['json'];
  const MOM = document.toMom();
  MOM.json = null;
  return MOM.toJson() as Record<string, unknown>;
}

describe( 'Round trips', () => {
  describe( 'JSON-LD → MOM → JSON-LD', () => {
    ['hvml', 'annotation-track', 'roundtrip', 'text-description'].forEach( ( name ) => {
      it( `rebuilds examples/${name}.jsonld from its MOM`, () => {
        const fixture = readJson( `./examples/${name}.jsonld` );

        expect( rebuildFromMom( fixture ) ).toStrictEqual( fixture );
      } );
    } );

    it( 'normalizes a `@value` description to the plain-string form', () => {
      const plain = readJson( './examples/text-description.jsonld' );
      const valued = readJson( './examples/text-description--object.jsonld' );

      expect( rebuildFromMom( valued ) ).toStrictEqual( plain );
    } );
  } );

  describe( 'XML → JSON-LD → MOM → JSON-LD', () => {
    ['hvml', 'annotation-track', 'roundtrip'].forEach( ( name ) => {
      skipIfLibxmljsUnavailable( `rebuilds the JSON-LD serialization of examples/${name}.xml from its MOM`, async () => {
        const hvml = new HVML( `./examples/${name}.xml` );
        await hvml.ready;
        const fromXml = hvml.toJson() as Record<string, unknown>;

        expect( rebuildFromMom( fromXml ) ).toStrictEqual( fromXml );
      } );
    } );
  } );

  skipIfLibxmljsUnavailable( 'serializes examples/roundtrip.xml to its JSON-LD twin', async () => {
    const hvml = new HVML( './examples/roundtrip.xml' );
    await hvml.ready;

    expect( hvml.toJson() ).toStrictEqual( readJson( './examples/roundtrip.jsonld' ) );
  } );
} );
