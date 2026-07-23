import HVMLElement from "./hvml-element";

export class HVMLDescriptionElement extends HVMLElement {
  get nodeName(): string {
    return 'description';
  }

  type?: 'text' | 'html' | 'xhtml';
}