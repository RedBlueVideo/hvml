declare module 'md2jsonml' {
  // Sync with `/util/data.ts`
  type JSONMLNode = string | Record<string, string> | {};
  type JSONML = JSONMLNode[];

export default function md2jsonml(markdown: string): JSONML;
}