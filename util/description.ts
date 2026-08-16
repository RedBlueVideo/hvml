import { isString } from './types.js';
import Validation from './validation.js';
import Transform from './transform.js';

import type { DescriptionType, HVMLXhtmlPayloadInput, IHVMLDescription } from '../types/elements.js';
import type { JSONMLNode } from './data.js';

/**
 * An element that carries a `description` record: `video` and
 * `version` share this implementation behind their own overloaded
 * methods.
 */
export interface DescriptionHost {
  description?: Partial<IHVMLDescription>;
  readonly _baseErrorData: { className: string };
}

export function setDescription(
  host: DescriptionHost,
  description: string | HVMLXhtmlPayloadInput | JSONMLNode[],
  type: DescriptionType = 'text',
) {
  const errorData = {
    ...host._baseErrorData,
    "methodName": "setDescription",
    "fieldName": "description",
    "input": description,
    "expected": ["String", "Object"],
  };

  if ( ( type === 'text' ) && !isString( description ) ) {
    throw new Validation.TypeError( errorData );
  }

  host.description = {};

  switch ( type ) {
    case 'jsonml':
      if ( !Array.isArray( description ) ) {
        throw new Validation.TypeError( errorData );
      }

      host.description.xhtml = Transform.jsonMlToXmlString( Transform.wrapJsonMl( description ) );
      break;

    case 'xhtml':
      switch ( typeof description ) {
        case 'string':
          host.description.xhtml = Transform.wrapXhtml( description.trim() );
          break;

        case 'object':
          if ( !Array.isArray( description ) && Array.isArray( description.childNodes ) ) {
            host.description.xhtml = Transform.jsonLdChildNodesToXhtml( description.childNodes );
          }
          break;

        default:
          throw new Validation.TypeError( errorData );
      }
      break;

    case 'text':
    default:
      /**
       * Unknown `type` values arrive here from untyped callers; they
       * get the same validation 'text' got up top.
       */
      if ( !isString( description ) ) {
        throw new Validation.TypeError( errorData );
      }

      host.description.text = description.trim();
  }
}

export function getDescription(
  host: DescriptionHost,
  type?: DescriptionType,
  parseMarkdown = true,
  newlinesToBRs = true,
) {
  if ( !host.description ) {
    return null;
  }

  switch ( type ) {
    case 'jsonml':
      /* istanbul ignore else */
      if ( host.description.xhtml ) {
        return Transform.xmlStringToJsonMl( host.description.xhtml );
      }

      /* istanbul ignore else */
      if ( host.description.text ) {
        return Transform.markdownToJsonMl( host.description.text );
      }
      /* istanbul ignore next */
      break;

    case 'xhtml':
      /* istanbul ignore else */
      if ( host.description.xhtml ) {
        return host.description.xhtml;
      }

      // If user set a text description, and is trying to get back XHTML,
      // assume the text is Markdown-formatted and convert it to JSON-ML
      // before turning it into a DOM string
      /* istanbul ignore else */
      if ( host.description.text ) {
        let description;

        if ( parseMarkdown ) {
          description = Transform.markdownToJsonMl( host.description.text );
        } else {
          description = host.description.text;

          if ( newlinesToBRs ) {
            description = description.replace( /\n/g, '<br />' );
          }

          description = Transform.xmlStringToJsonMl( Transform.wrapXhtml( `<p>${description}</p>` ) );
        }

        return Transform.jsonMlToXmlString( description );
      }
      /* istanbul ignore next */
      break;

    case 'text':
    default:
      /* istanbul ignore else */
      if ( host.description.text ) {
        return host.description.text;
      }

      /* istanbul ignore else */
      if ( host.description.xhtml ) {
        const documentJsonMl = Transform.xmlStringToJsonMl( host.description.xhtml );
        const rootElement = documentJsonMl[1];

        /* istanbul ignore else: descriptions serialize wrapped in a root div */
        if ( Array.isArray( rootElement ) ) {
          return Transform.getJsonMlTextContent( rootElement, true, true );
        }
      }
  }
}
