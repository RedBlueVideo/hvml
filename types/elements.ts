import { ISO639LanguageCode } from "./language";

export interface JSONLDSerializedHTMLElement {
  "@type"?: keyof HTMLElementTagNameMap;
  "textContent"?: string;
}

export type HVMLElementTagName =
  | 'animate'
  | 'bitdepth'
  | 'bitrate'
  | 'choice'
  | 'codec'
  | 'container'
  | 'description'
  | 'entity'
  | 'episode'
  | 'file'
  | 'fps'
  | 'frametype'
  | 'goto'
  | 'height'
  | 'hvml'
  | 'mime'
  | 'name'
  | 'par'
  | 'poster'
  | 'presentation'
  | 'recorded'
  | 'showing'
  | 'title'
  | 'uri'
  | 'venue'
  | 'video'
  | 'width';

export type HVMLDescriptionType =
  | 'jsonml'
  | 'jsonml'
  | 'xhtml'
;

export class HVMLNode {
  id?: string;
  language?: ISO639LanguageCode;
  region?: string;
  instance?: unknown;
  children?: Array<IHVMLElement | string>;
}

export interface IHVMLElement extends HVMLNode {
  '@context'?: string;
  '@type': HVMLElementTagName;
  title?: string;
  setDescription: (description: string, type?: HVMLDescriptionType) => void;
}

export type DescriptionType =
  | 'jsonml'
  | 'text'
  | 'xhtml'
;

export type HVMLGlobalAttributeName =
 | 'children'
 | 'id'
 | 'instance'
 | 'language'
 | 'region'
;
