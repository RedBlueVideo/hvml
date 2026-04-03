import HVMLElement from './hvml-element';
import { IHVMLElement } from './types/elements';

class Series extends HVMLElement {
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
