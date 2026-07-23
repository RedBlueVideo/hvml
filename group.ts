import HVMLElement from './hvml-element';
import { defineHVMLElement } from './util/registry';

class Group extends HVMLElement {
  get nodeName(): string {
    return 'group';
  }
}

export default Group;

defineHVMLElement( 'group', Group );
