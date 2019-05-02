const HVMLElement = require( './hvml-element' );

class Series extends HVMLElement {
  constructor( data ) {
    super( data );

    /* istanbul ignore next */
    if ( data ) {
      if ( data.title ) {
        this.title = data.title;
      }
    }
  }
}

module.exports = Series;
