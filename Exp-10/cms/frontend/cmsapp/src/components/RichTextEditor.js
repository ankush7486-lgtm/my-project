import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange }) {
  return <ReactQuill value={value} onChange={onChange} theme="snow" />;
}