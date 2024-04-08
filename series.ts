import { HVMLElement } from './hvml-element.js';

export class HVMLSeriesElement extends HVMLElement {
  title?: string;

  constructor( data?: Record<string, any> ) {
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
  HVMLSeriesElement,
};
