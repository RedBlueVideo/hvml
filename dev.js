const fs = require( 'fs' );
const xml = require( 'libxmljs' );
const { exec } = require( 'child_process' );
const HVML = require( './index.js' );

// const hvml = new HVML( './hvml.xml' );

exec( 'xmllint --noout --schema XMLSchema.xsd hvml.xsd', ( error, stdout, stderr ) => {
  // console.log( 'error', error );
  // console.log( 'stdout', stdout );
  console.log( 'stderr', stderr );
} );
