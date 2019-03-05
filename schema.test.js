// const fs = require( 'fs' );
// const xml = require( 'libxmljs' );
const { exec } = require( 'child_process' );

describe( 'HVML Schema Definition', () => {
  it( 'is itself valid', () => ( new Promise( ( resolve, reject ) => {
    exec( 'xmllint --noout --schema XMLSchema.xsd hvml.xsd', ( error, stdout, stderr ) => {
      if ( error ) {
        reject( error );
      }

      stderr = stderr.trim();

      // xmllint prints diagnostic information, good or bad, to stderr
      if ( stderr.length ) {
        if ( stderr === 'hvml.xsd validates' ) {
          resolve( stderr );
        } else {
          reject( stderr );
        }
      }
    } );
  } ).then( ( result ) => {
    expect( result ).toBe( 'hvml.xsd validates' );
  } ).catch( ( rejection ) => {
    throw new Error( rejection );
  } )
  ), 60953 );
} );
