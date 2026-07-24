import type { HVMLElementTagNameMap } from '../types/elements.js';
import type { HVMLElement } from '../hvml-element.js';

/**
 * Any concrete element class. `never[]` is the contravariant-safe
 * “accepts every constructor signature” shape, and still permits the
 * zero-argument construction the registry performs.
 */
export type HVMLElementConstructor = new ( ...args: never[] ) => HVMLElement;

/**
 * Tag-name-keyed element registry, à la `customElements.define` /
 * `document.createElement`.
 *
 * This is a leaf module: it imports no element classes at runtime, so
 * it can never join an import cycle. Classes self-register at the
 * bottom of their own modules instead.
 *
 * The `HVMLElementTagNameMap`-keyed overloads make the map an enforced
 * contract. Registering the wrong class for a known tag is a type
 * error. So is expecting the wrong element back from a known one.
 */
const registry = new Map<string, HVMLElementConstructor>();

export function defineHVMLElement<TagName extends keyof HVMLElementTagNameMap>(
  tagName: TagName,
  ElementClass: new ( ...args: never[] ) => HVMLElementTagNameMap[TagName],
): void;
export function defineHVMLElement( tagName: string, ElementClass: HVMLElementConstructor ): void;
export function defineHVMLElement( tagName: string, ElementClass: HVMLElementConstructor ): void {
  registry.set( tagName, ElementClass );
}

export function getHVMLElementClass( tagName: string ): HVMLElementConstructor | undefined {
  return registry.get( tagName );
}

export function createHVMLElement<TagName extends keyof HVMLElementTagNameMap>(
  tagName: TagName,
): HVMLElementTagNameMap[TagName] | undefined;
export function createHVMLElement( tagName: string ): HVMLElement | undefined;
export function createHVMLElement( tagName: string ): HVMLElement | undefined {
  const ElementClass = registry.get( tagName );

  return ElementClass ? new ElementClass() : undefined;
}
