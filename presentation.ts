import HVMLElement from './hvml-element.js';
import { defineHVMLElement } from './util/registry.js';

/**
 * The experience layer: which timing and experience of a version to
 * play, as distinct from which work (`video`) and which content
 * (`version`). Repeatable under either; document order is preference
 * order, and a conforming player plays the first presentation it can
 * play. “Can play” is the player’s call (`canPlayType()`, bandwidth,
 * whether the version can be sourced), so selection takes it as a
 * predicate rather than guessing.
 *
 * A presentation with no `file` children is instruction-only: an
 * experience composed onto a playing source (an annotation track, a
 * choice menu) rather than a source itself. It can never satisfy
 * “can play”, so it self-excludes from source selection.
 */
class Presentation extends HVMLElement {
  get nodeName(): string {
    return 'presentation';
  }

  /**
   * The presentation’s own IRI, minted by whoever owns it under their
   * own authority; absent means a document-local blank node.
   */
  declare about?: string;

  isInstructionOnly(): boolean {
    return !this.children.some( ( child ) => child.nodeName === 'file' );
  }

  /**
   * First-playable selection: the first source-bearing presentation
   * among `candidates`, in the order given, that `canPlay` accepts.
   * Non-presentation siblings are skipped, so a `video`’s or
   * `version`’s whole `children` collection may be passed as is.
   */
  static selectFirstPlayable(
    candidates: Iterable<HVMLElement>,
    canPlay: ( presentation: Presentation ) => boolean = () => true,
  ): Presentation | null {
    for ( const candidate of candidates ) {
      if (
        ( candidate instanceof Presentation )
        && !candidate.isInstructionOnly()
        && canPlay( candidate )
      ) {
        return candidate;
      }
    }

    return null;
  }
}

export default Presentation;

defineHVMLElement( 'presentation', Presentation );
