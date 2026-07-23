import type { HVMLNode } from '../types/elements.js';

/**
 * Any concrete element class. `never[]` is the contravariant-safe
 * “accepts every constructor signature” shape, and still permits the
 * zero-argument construction the registry performs.
 */
export type HVMLElementConstructor = new ( ...args: never[] ) => HVMLNode;

/**
 * Tag-name-keyed element registry, à la `customElements.define` /
 * `document.createElement`. A leaf module — it imports no element
 * classes, so it can never join an import cycle; classes self-register
 * at the bottom of their own modules instead.
 */
const registry = new Map<string, HVMLElementConstructor>();

export function defineHVMLElement( tagName: string, ElementClass: HVMLElementConstructor ): void {
  registry.set( tagName, ElementClass );
}

export function getHVMLElementClass( tagName: string ): HVMLElementConstructor | undefined {
  return registry.get( tagName );
}

export function createHVMLElement( tagName: string ): HVMLNode | undefined {
  const ElementClass = registry.get( tagName );

  return ElementClass ? new ElementClass() : undefined;
}
