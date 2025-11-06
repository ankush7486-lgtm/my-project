import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import TurndownService from 'turndown';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../api/api';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import {
  FaBold, FaItalic, FaUnderline, FaHeading, FaListUl,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaImage, FaSave,
  FaEye, FaHighlighter, FaLink, FaMarkdown
} from 'react-icons/fa';
import './PostEditor.css';

Modal.setAppElement('#root');

export default function PostEditor({ postToEdit = null, onPostCreated, onCancelEdit }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewUrlRef = useRef(null);
    const [showSuccessTick, setShowSuccessTick] = useState(false);


  const initialFormikValues = (() => {
    if (postToEdit) return { title: postToEdit.title, content: postToEdit.content };
    const draft = localStorage.getItem('postDraft');
    if (draft) try { return JSON.parse(draft); } catch { }
    return { title: '', content: '' };
  })();

  const formik = useFormik({
    initialValues: initialFormikValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      content: Yup.string().required('Content is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('content', values.content);
        if (file) formData.append('image', file);

        const postsBaseUrl = 'http://localhost:5000/api/auth/posts';
        const res = postToEdit
          ? await API.put(`${postsBaseUrl}/${postToEdit._id}`, formData)
          : await API.post(postsBaseUrl, formData);

        toast.success(postToEdit ? 'Post updated!' : 'Post published!');
        onPostCreated && onPostCreated(res.data);

        editor?.commands.clearContent();
        resetForm();
        setFile(null);
        localStorage.removeItem('postDraft');
      } catch (err) {
        console.error(err);
        toast.error('Failed to save post.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Underline,
      Link,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount.configure({ limit: 10000 }),
      Highlight,
    ],
    content: formik.values.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      formik.setFieldValue('content', html);
      if (!postToEdit) {
        localStorage.setItem('postDraft', JSON.stringify({ title: formik.values.title, content: html }));
      }
    },
  });

  useEffect(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      previewUrlRef.current = objectUrl;
    } else if (postToEdit?.image) {
      setPreview(`http://localhost:5000/uploads/${postToEdit.image}`);
    } else {
      setPreview(null);
    }

    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [file, postToEdit]);

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
  };

  return (
    <form onSubmit={formik.handleSubmit} className="editor-wrapper">
      <div className="editor-left">
        <input
          name="title"
          value={formik.values.title}
          onChange={formik.handleChange}
          placeholder="Enter post title"
          className="editor-input"
          onBlur={formik.handleBlur}
        />
        {formik.touched.title && formik.errors.title && (
          <p className="editor-error">{formik.errors.title}</p>
        )}

        <div className="editor-toolbar">
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleBold().run()}><FaBold /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><FaHeading /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('left').run()}><FaAlignLeft /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('center').run()}><FaAlignCenter /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('right').run()}><FaAlignRight /></button>
          <button type="button" disabled={!editor} onClick={() => editor.chain().focus().toggleHighlight().run()}><FaHighlighter /></button>
          <button type="button" disabled={!editor} onClick={() => {
            const url = prompt('Image URL');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}><FaImage /></button>
          <button type="button" disabled={!editor} onClick={() => {
            const url = prompt('Enter link');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}><FaLink /></button>
          <button type="button" disabled={!editor} onClick={() => {
            const turndownService = new TurndownService();
            const markdown = turndownService.turndown(editor.getHTML());
            navigator.clipboard.writeText(markdown);
            toast.info('Markdown copied to clipboard!');
          }}><FaMarkdown /></button>
        </div>

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="floating-toolbar">
              <button onClick={() => editor.chain().focus().toggleBold().run()}><FaBold /></button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic /></button>
              <button onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline /></button>
              <button onClick={() => editor.chain().focus().toggleHighlight().run()}><FaHighlighter /></button>
            </div>
          </BubbleMenu>
        )}

        <EditorContent editor={editor} className="tiptap-editor" />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="editor-file"
          accept="image/*"
        />

        {preview && <img src={preview} alt="Preview" className="editor-preview" />}

        <p className="editor-wordcount">
          Word count: {editor?.storage.characterCount.words ?? 0}
        </p>
      </div>

      <div className="editor-sidebar">
        {postToEdit && onCancelEdit && (
          <button type="button" className="editor-cancel" onClick={onCancelEdit}>Cancel</button>
        )}
        <button type="button" className="sidebar-btn" onClick={() => {
          localStorage.setItem('postDraft', JSON.stringify({ title: formik.values.title, content: formik.values.content }));
          toast.info('Draft saved locally.');
        }}><FaSave /> Save Draft</button>
        <button type="button" className="sidebar-btn" onClick={() => setIsPreviewOpen(true)}><FaEye /> Preview</button>
        <button type="submit" className="editor-submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'Saving...' : postToEdit ? 'Update' : 'Publish'}
        </button>
      </div>

 <div className={`success-tick-container ${showSuccessTick ? 'show-success' : ''}`} aria-hidden="true">
        <svg className="success-tick" viewBox="0 0 52 52">
          <circle className="success-tick__circle" cx="26" cy="26" r="25" fill="none"/>
          <path className="success-tick__check" fill="none" d="M14 27l7 7 16-16"/>
        </svg>
      </div>
      <Modal isOpen={isPreviewOpen} onRequestClose={() => setIsPreviewOpen(false)} style={modalStyles}>
        <h2>{formik.values.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: formik.values.content }} />
        <button onClick={() => setIsPreviewOpen(false)}>Close Preview</button>
      </Modal>
    </form>
  );
}
