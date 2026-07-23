import HVMLElement from './hvml-element';
import { IHVMLElement } from './types/elements';
import { defineHVMLElement } from './util/registry';

class Series extends HVMLElement {
  get nodeName(): string {
    return 'series';
  }

  title: IHVMLElement['title'];

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
