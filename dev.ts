import {
  HVML,
  // HVMLVideoElement,
  // HVMLSeriesElement,
} from './hvml.js';

// const hvml = new HVML( './examples/hvml.jsonld' );
const hvml = new HVML( './examples/hvml.xml' );
hvml.ready.then( () => {
  const MOM = hvml.toMom();

  console.log( MOM );
} );
