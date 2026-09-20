import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

// Custom Highlight extension since npm is broken
const Highlight = Mark.create({
  name: 'highlight',
  parseHTML() { return [{ tag: 'mark' }]; },
  renderHTML({ HTMLAttributes }) { return ['mark', mergeAttributes({ style: 'background-color: #ffeb3b;' }, HTMLAttributes), 0]; },
  addCommands() {
    return {
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },
});

const Editor = ({ documentId, initialContent, onContentChange, onEditorReady }) => {
  const { user } = useAuth();
  const socket = getSocket();
  
  useEffect(() => {
    if (!socket || !user) return;

    const handleDocumentUpdated = ({ content, userId }) => {
      if (userId === user._id) return;
      if (editorRef.current && content) {
        const { from, to } = editorRef.current.state.selection;
        editorRef.current.commands.setContent(content, false);
        try {
          editorRef.current.commands.setTextSelection({ from, to });
        } catch (e) {
          // ignore selection errors if document length changed significantly
        }
      }
    };

    socket.on('document-updated', handleDocumentUpdated);
    return () => socket.off('document-updated', handleDocumentUpdated);
  }, [socket, user]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 100, newGroupDelay: 500 },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      Placeholder.configure({ placeholder: 'Start typing your document here...' }),
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      if (onContentChange) onContentChange(json);
      if (socket) {
        socket.emit('document-change', { documentId, content: json });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (socket) {
        const { from, to } = editor.state.selection;
        socket.emit('cursor-move', { documentId, cursor: { from, to } });
      }
    },
    editorProps: {
      attributes: {
        // ProseMirror class matches the CSS in index.css
        class: 'ProseMirror',
      },
    },
  });

  const editorRef = useRef(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!socket || !editor) return;
    const handleCursorUpdated = ({ userId, userName, cursor }) => {
      // Manual cursor overlay logic goes here for true multi-player
      // (Optional given the time and scope, relying on UserPresence for now)
    };
    socket.on('cursor-updated', handleCursorUpdated);
    return () => socket.off('cursor-updated', handleCursorUpdated);
  }, [socket, editor]);

  if (!editor) return null;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', minHeight: '100%' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Editor;
