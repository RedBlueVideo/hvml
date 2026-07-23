import HVMLElement from "./hvml-element.js";

export class HVMLDescriptionElement extends HVMLElement {
  get nodeName(): string {
    return 'description';
  }

  declare type?: 'text' | 'html' | 'xhtml';
}