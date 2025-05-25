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

export interface IHVMLElement {
  '@context'?: string;
  '@type': HVMLElementTagName;
  id?: string;
  setDescription: (description: string) => void;
}

export type DescriptionType =
  | 'jsonml'
  | 'text'
  | 'xhtml';
