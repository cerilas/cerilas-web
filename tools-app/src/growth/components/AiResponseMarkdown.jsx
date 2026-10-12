import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MARKDOWN_COMPONENTS = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  table: ({ node, ...props }) => (
    <div className="ai-md-table-wrap">
      <table {...props} />
    </div>
  )
};

export default function AiResponseMarkdown({ text, className = '' }) {
  if (!text) return null;
  return (
    <div className={`ai-response-content ai-md ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
