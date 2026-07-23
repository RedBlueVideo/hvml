import HVMLElement from './hvml-element.js';
import { defineHVMLElement } from './util/registry.js';

class Group extends HVMLElement {
  get nodeName(): string {
    return 'group';
  }
}

export default Group;

defineHVMLElement( 'group', Group );
