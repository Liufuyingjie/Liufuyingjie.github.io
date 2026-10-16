import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { plainText } from "../shared/note-format";

export type Heading = { id: string; text: string; level: number };
export function renderMarkdown(body: string) {
  const headings: Heading[] = [];
  let count = 0;
  const markdown = new Marked({ gfm: true, breaks: false });
  markdown.use({ renderer: {
    heading({ tokens, depth, text }) {
      const id = `heading-${++count}`;
      if (depth <= 3) headings.push({ id, text: plainText(text), level: depth });
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
    table({ header, rows }) {
      const renderCell = (cell: typeof header[number], tag: string) => `<${tag}>${this.parser.parseInline(cell.tokens)}</${tag}>`;
      return `<div class="table-scroll"><table><thead><tr>${header.map(c => renderCell(c, "th")).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => renderCell(c, "td")).join("")}</tr>`).join("")}</tbody></table></div>`;
    },
  }});
  const unsafe = markdown.parse(body) as string;
  const html = sanitizeHtml(unsafe, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "details", "summary"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes, "*": ["id", "class"], a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, ...(attribs.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}) } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
  return { html, headings };
}
