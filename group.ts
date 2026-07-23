import HVMLElement from './hvml-element';

class Group extends HVMLElement {
  get nodeName(): string {
    return 'group';
  }
}

export default Group;
