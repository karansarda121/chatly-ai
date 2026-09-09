import { FileText, ImagePlus, Languages, Plus, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import './MediaPicker.css';

function MediaPicker({ canTranslate, disabled, onOpenTranslate, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const toolsRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useClickOutside(toolsRef, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  function handleChange(event) {
    const [file] = event.target.files;
    if (file) onSelect(file);
    event.target.value = '';
    setIsOpen(false);
  }

  function openTranslation() {
    setIsOpen(false);
    onOpenTranslate();
  }

  return (
    <div className="media-picker" ref={toolsRef}>
      <input ref={imageInputRef} className="media-picker__input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} />
      <input ref={documentInputRef} className="media-picker__input" type="file" accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" onChange={handleChange} />
      <input ref={videoInputRef} className="media-picker__input" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleChange} />
      <button type="button" className="media-picker__trigger" onClick={() => setIsOpen((open) => !open)} disabled={disabled} aria-label="Open message tools" aria-expanded={isOpen} title="Message tools">
        <Plus size={21} />
      </button>
      {isOpen && <section className="media-picker__menu" role="dialog" aria-label="Message tools">
        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={disabled} aria-label="Upload photo" title="Upload photo"><ImagePlus size={20} /></button>
        <button type="button" onClick={() => videoInputRef.current?.click()} disabled={disabled} aria-label="Upload video" title="Upload video"><Video size={20} /></button>
        <button type="button" onClick={() => documentInputRef.current?.click()} disabled={disabled} aria-label="Upload document" title="Upload document"><FileText size={20} /></button>
        <button type="button" onClick={openTranslation} disabled={!canTranslate || disabled} aria-label={canTranslate ? 'Translate draft' : 'Write a message to translate'} title={canTranslate ? 'Translate draft' : 'Write a message first'}><Languages size={20} /></button>
      </section>}
    </div>
  );
}

export default MediaPicker;