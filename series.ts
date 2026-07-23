import HVMLElement from './hvml-element.js';
import { IHVMLElement } from './types/elements.js';
import { defineHVMLElement } from './util/registry.js';

class Series extends HVMLElement {
  get nodeName(): string {
    return 'series';
  }

  declare title: IHVMLElement['title'];

  constructor( data?: Partial<IHVMLElement> ) {
    super( data );

    /* istanbul ignore next */
    if ( data ) {
      if ( data.title ) {
        this.title = data.title;
      }
    }
  }
}

export default Series;

defineHVMLElement( 'series', Series );
