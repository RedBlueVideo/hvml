const HVML = require( './index.js' );

const hvml = new HVML( './examples/hvml.xml' );
hvml.ready.then( () => {
  // Instance methods available
  console.log( hvml.validate() );
} );
