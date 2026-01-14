/**
 * JSON-LD Script Component
 *
 * Renders JSON-LD structured data as a script tag.
 * Use this component in Server Components to add structured data to pages.
 */

interface JsonLdProps {
  data: string;
}

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: data }} />;
}

/**
 * Multiple JSON-LD Script Component
 *
 * Renders multiple JSON-LD structured data blocks.
 */
interface MultiJsonLdProps {
  data: string[];
}

export function MultiJsonLd({ data }: MultiJsonLdProps) {
  return (
    <>
      {data.map((jsonLd, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      ))}
    </>
  );
}
