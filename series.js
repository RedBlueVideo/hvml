import { HVMLElement } from './hvml-element.js';

export class Series extends HVMLElement {
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

globalThis.HVML = {
  ...globalThis.HVML,
  Series,
};
