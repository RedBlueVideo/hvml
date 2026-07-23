import HVMLElement from "./hvml-element.js";

export class HVMLDescriptionElement extends HVMLElement {
  get nodeName(): string {
    return 'description';
  }

  type?: 'text' | 'html' | 'xhtml';
}