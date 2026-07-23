declare module 'md2jsonml' {
  type JSONML = import('./util/data.js').JSONML;

  export default function md2jsonml(markdown: string): JSONML;
}
