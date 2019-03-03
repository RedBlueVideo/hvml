const HVML = require( './index.js' );

const hvml = new HVML( './hvml.xml' );

hvml.ready
  .then( () => {
    console.log( hvml.toJson() );
  } )
  .catch( ( error ) => {
    // throw new Error( error.toString() );
    console.error( error );
  } );
