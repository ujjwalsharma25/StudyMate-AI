import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/**
 * Renders AI-generated text as proper formatted markdown — code blocks,
 * bold, headings, lists — instead of dumping raw "**text**" and
 * "```code```" markers on screen as a flat paragraph.
 */
export default function Markdown({ children }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
