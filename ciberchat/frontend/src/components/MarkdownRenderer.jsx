import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.css';

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Personalización de componentes si es necesario
          strong: ({node, ...props}) => <strong className="md-bold" {...props} />,
          em: ({node, ...props}) => <em className="md-italic" {...props} />,
          h1: ({node, ...props}) => <h1 className="md-h1" {...props} />,
          h2: ({node, ...props}) => <h2 className="md-h2" {...props} />,
          h3: ({node, ...props}) => <h3 className="md-h3" {...props} />,
          h4: ({node, ...props}) => <h4 className="md-h4" {...props} />,
          code: ({node, inline, ...props}) => 
            inline 
              ? <code className="md-inline-code" {...props} />
              : <code className="md-block-code" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;