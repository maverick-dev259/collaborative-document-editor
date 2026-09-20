import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Link as LinkIcon, Download, Printer, FileText
} from 'lucide-react';
import { useState } from 'react';

const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={`btn btn-sm ${isActive ? 'btn-secondary text-dark fw-bold' : 'btn-light text-secondary'} border-0 p-1 mx-1 d-flex align-items-center justify-content-center`}
    style={{ width: '32px', height: '32px' }}
  >
    {children}
  </button>
);

const EditorToolbar = ({ editor }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleDownload = (type) => {
    let content, mimeType, filename;
    
    if (type === 'html') {
      content = editor.getHTML();
      mimeType = 'text/html';
      filename = 'document.html';
    } else if (type === 'txt') {
      content = editor.getText();
      mimeType = 'text/plain';
      filename = 'document.txt';
    } else if (type === 'json') {
      content = JSON.stringify(editor.getJSON(), null, 2);
      mimeType = 'application/json';
      filename = 'document.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-light border-bottom px-3 py-2 d-flex flex-wrap align-items-center gap-2 sticky-top z-3">
      
      {/* File Dropdown */}
      <div className="dropdown me-2 border-end pe-2">
        <button className="btn btn-sm btn-light fw-medium d-flex align-items-center gap-1" data-bs-toggle="dropdown">
          <FileText size={16} /> File
        </button>
        <ul className="dropdown-menu shadow-sm">
          <li>
            <button className="dropdown-item d-flex align-items-center gap-2 small" onClick={() => handleDownload('html')}>
              <Download size={14} /> Download as HTML
            </button>
          </li>
          <li>
            <button className="dropdown-item d-flex align-items-center gap-2 small" onClick={() => handleDownload('txt')}>
              <Download size={14} /> Download as Text
            </button>
          </li>
          <li>
            <button className="dropdown-item d-flex align-items-center gap-2 small" onClick={() => handleDownload('json')}>
              <Download size={14} /> Download as JSON (Backup)
            </button>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item d-flex align-items-center gap-2 small" onClick={handlePrint}>
              <Printer size={14} /> Print
            </button>
          </li>
        </ul>
      </div>

      {/* History */}
      <div className="d-flex align-items-center border-end pe-2">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={16} /></ToolbarButton>
        <ToolbarButton onClick={handlePrint} title="Print"><Printer size={16} /></ToolbarButton>
      </div>

      {/* Text Style */}
      <div className="d-flex align-items-center border-end pe-2">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><Underline size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><span style={{ backgroundColor: '#ffeb3b', color: 'black', display: 'flex', width: 14, height: 14, borderRadius: 2 }}></span></ToolbarButton>
      </div>

      {/* Headings */}
      <div className="d-flex align-items-center border-end pe-2">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={16} /></ToolbarButton>
      </div>

      {/* Alignment */}
      <div className="d-flex align-items-center border-end pe-2">
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify size={16} /></ToolbarButton>
      </div>

      {/* Blocks */}
      <div className="d-flex align-items-center">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote"><Quote size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><Code size={16} /></ToolbarButton>
        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Insert Link"><LinkIcon size={16} /></ToolbarButton>
      </div>
    </div>
  );
};

export default EditorToolbar;
