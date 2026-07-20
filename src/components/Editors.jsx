import React, { useRef } from 'react';
import { X, Plus, Upload } from 'lucide-react';
import { uid } from '@/lib/brochureDefaults';

const readFile = (file, cb) => {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
};

export function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A] ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A]" />;
}

export function ImageUpload({ label, value, onChange }) {
  const ref = useRef();
  return (
    <div className="mb-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <div
          onClick={() => ref.current?.click()}
          className="relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#D4A94A]"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <Upload size={18} />
              <span className="text-[10px]">Upload</span>
            </div>
          )}
        </div>
        {value && (
          <button onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline">Remove</button>
        )}
        <input ref={ref} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => readFile(e.target.files[0], onChange)} />
      </div>
    </div>
  );
}

export function ListEditor({ label, items, onChange, fields = [{ key: 'text', placeholder: 'Item' }], newItem }) {
  const update = (id, key, val) => onChange(items.map((it) => (it.id === id ? { ...it, [key]: val } : it)));
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const add = () => onChange([...items, { id: uid(), ...(newItem || { text: '' }) }]);
  return (
    <div className="mb-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="mt-1 space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                value={it[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => update(it.id, f.key, e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-[#D4A94A] focus:outline-none"
              />
            ))}
            <button onClick={() => remove(it.id)} className="shrink-0 text-slate-400 hover:text-red-500"><X size={16} /></button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-2 flex items-center gap-1 text-sm font-medium text-[#7A2E3A] hover:underline">
        <Plus size={14} /> Add Item
      </button>
    </div>
  );
}
