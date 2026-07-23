import { readFileSync } from 'fs';

import { HVML_ELEMENT_TAG_NAMES, isValidHVMLElementTagName } from './elements.js';

describe( 'HVML element vocabulary', () => {
  it( 'matches the elements defined in rng/hvml.rng', () => {
    const rng = readFileSync( './rng/hvml.rng', 'utf8' );

    /**
     * Foreign-namespace elements (e.g. xhtml:div) are embedded content,
     * not HVML vocabulary, so colon-qualified names are excluded.
     */
    const schemaElements = Array.from(
      rng.matchAll( /<element\s+name="([^"]+)"/g ),
      ( match ) => match[1],
    ).filter( ( name ) => !name.includes( ':' ) );

    const schemaSet = [...new Set( schemaElements )].sort();
    const vocabularySet = [...HVML_ELEMENT_TAG_NAMES].sort();

    expect( vocabularySet ).toEqual( schemaSet );
  } );

  test( 'isValidHVMLElementTagName agrees with the vocabulary', () => {
    HVML_ELEMENT_TAG_NAMES.forEach( ( tagName ) => {
      expect( isValidHVMLElementTagName( tagName ) ).toBe( true );
    } );

    expect( isValidHVMLElementTagName( 'big-chungus' ) ).toBe( false );
    expect( isValidHVMLElementTagName( 'xhtml:div' ) ).toBe( false );
  } );
} );
