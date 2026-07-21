import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, RotateCcw, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { defaultData, PAGES, uid, GOLD } from '@/lib/brochureDefaults';
import { BrochurePage, buildPageList } from '@/components/BrochurePages';
import { Field, TextInput, TextArea, ImageUpload, ListEditor } from '@/components/Editors';

const STORAGE_KEY = 'adn_brochure_v1';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return defaultData();
};


export default function HomePage() {
  const [data, setData] = useState(load);
  const [active, setActive] = useState('cover');
  const [activeDay, setActiveDay] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [scale, setScale] = useState(0.5);
  const previewWrap = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }, [data]);

  // responsive preview scaling
  useEffect(() => {
    const fit = () => {
      if (!previewWrap.current) return;
      const w = previewWrap.current.clientWidth - 48;
      setScale(Math.min(1, w / 1456));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const set = (fn) => setData((prev) => {
    const next = structuredClone(prev);
    fn(next);
    return next;
  });

  const addDay = () => {
    set((d) => {
      const n = d.days.length + 1;
      d.days.push({ id: uid(), dayNumber: n, activities: [{ id: uid(), text: '' }], imgTop: null, imgBottom: null });
    });
    setActive('days');
    setActiveDay(data.days.length);
  };

  const removeDay = (i) => {
    set((d) => { d.days.splice(i, 1); });
    setActiveDay((p) => Math.max(0, p - (i <= p ? 1 : 0)));
  };

  const reset = () => {
    if (!window.confirm('Clear all fields and start a new package?')) return;
    const fresh = defaultData();
    setData(fresh);
    setActive('cover');
    setActiveDay(0);
  };

  const generatePDF = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const pages = Array.from(exportRef.current.querySelectorAll('.brochure-page'));
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1456, 816] });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 1456, height: 816 });
        const img = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage([1456, 816], 'landscape');
        pdf.addImage(img, 'JPEG', 0, 0, 1456, 816);
      }
      const name = (data.cover.destination || 'package').toString().toLowerCase().replace(/\s+/g, '-');
      pdf.save(`adn-${name}-tour-package.pdf`);
    } catch (e) {
      window.alert('PDF generation failed: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const previewPage = active === 'days' ? 'day' : active;
  const pageList = buildPageList(data);



  // Social media data configuration
  const socialLinks = [
    { id: 'twitter', icon: <FaTwitter />, url: 'https://twitter.com', color: 'hover:text-sky-500' },
    { id: 'linkedin', icon: <FaLinkedin />, url: 'https://linkedin.com', color: 'hover:text-blue-700' },
    { id: 'github', icon: <FaGithub />, url: 'https://github.com', color: 'hover:text-slate-900' },
    { id: 'facebook', icon: <FaFacebook />, url: 'https://facebook.com', color: 'hover:text-blue-600' }
  ];

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: GOLD }}>
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>ADN Adventures</h1>
            <p className="text-xs text-slate-500">Tour Package PDF Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RotateCcw size={15} /> Start New
          </button>
          <button onClick={generatePDF} disabled={generating} className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60" style={{ background: GOLD }}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </header>

      {/* Page nav */}
      <nav className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-6 py-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${active === p.key ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            style={active === p.key ? { background: GOLD } : {}}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1">
        {/* Editor panel */}
        <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6">
          <Editor
            active={active}
            data={data}
            set={set}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            addDay={addDay}
            removeDay={removeDay}
          />
        </aside>

        {/* Preview */}
        <main ref={previewWrap} className="flex-1 overflow-auto bg-slate-200 p-6">
          <div className="mx-auto" style={{ width: 1456 * scale }}>
            <div className="mb-2 text-center text-xs font-medium text-slate-500">Live Preview · A4 Landscape · 1456 × 816</div>
            <div className="brochure-scale-wrap shadow-2xl" style={{ transform: `scale(${scale})`, height: 816 * scale }}>
              <BrochurePage page={previewPage} data={data} dayIndex={activeDay} />
            </div>
          </div>
        </main>
      </div>

      {/* Hidden full-size export container */}
      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        <div ref={exportRef}>
          {pageList.map((p, i) => (
            <BrochurePage key={i} page={p.page} data={data} dayIndex={p.dayIndex || 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Editor({ active, data, set, activeDay, setActiveDay, addDay, removeDay }) {
  if (active === 'cover') {
    const c = data.cover;
    return (
      <div>
        <SectionTitle>Cover Page</SectionTitle>
        <ImageUpload label="Logo (top-left)" value={c.logo} onChange={(v) => set((d) => { d.cover.logo = v; })} />
        <Field label="Destination Name"><TextInput value={c.destination} onChange={(e) => set((d) => { d.cover.destination = e.target.value; })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nights"><TextInput type="number" value={c.nights} onChange={(e) => set((d) => { d.cover.nights = e.target.value; })} /></Field>
          <Field label="Days"><TextInput type="number" value={c.days} onChange={(e) => set((d) => { d.cover.days = e.target.value; })} /></Field>
        </div>
        <Field label="Tagline"><TextInput value={c.tagline} onChange={(e) => set((d) => { d.cover.tagline = e.target.value; })} /></Field>
        <ImageUpload label="Cover Image 1 (Left)" value={c.img1} onChange={(v) => set((d) => { d.cover.img1 = v; })} />
        <ImageUpload label="Cover Image 2 (Center)" value={c.img2} onChange={(v) => set((d) => { d.cover.img2 = v; })} />
        <ImageUpload label="Cover Image 3 (Right)" value={c.img3} onChange={(v) => set((d) => { d.cover.img3 = v; })} />
      </div>
    );
  }

  if (active === 'why') {
    return (
      <div>
        <SectionTitle>Why Travel With Us?</SectionTitle>
        {data.why.map((item, i) => (
          <div key={item.id} className="mb-4 rounded-md border border-slate-200 p-3">
            <div className="mb-2 text-xs font-bold" style={{ color: GOLD }}>Item {i + 1}</div>
            <Field label="Title"><TextInput value={item.title} onChange={(e) => set((d) => { d.why[i].title = e.target.value; })} /></Field>
            <Field label="Description"><TextArea rows={2} value={item.desc} onChange={(e) => set((d) => { d.why[i].desc = e.target.value; })} /></Field>
          </div>
        ))}
      </div>
    );
  }

  if (active === 'days') {
    const day = data.days[activeDay];
    return (
      <div>
        <SectionTitle>Day-wise Itinerary</SectionTitle>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {data.days.map((dd, i) => (
            <button key={dd.id} onClick={() => setActiveDay(i)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeDay === i ? 'text-white' : 'bg-slate-100 text-slate-600'}`} style={activeDay === i ? { background: GOLD } : {}}>
              Day {dd.dayNumber}
            </button>
          ))}
          <button onClick={addDay} className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#D4A94A]"><Plus size={12} /> Add Day</button>
        </div>
        {day && (
          <>
            <div className="mb-3 flex items-center gap-2">
              <Field label="Day Number"><TextInput type="number" value={day.dayNumber} onChange={(e) => set((d) => { d.days[activeDay].dayNumber = e.target.value; })} /></Field>
              {data.days.length > 1 && (
                <button onClick={() => removeDay(activeDay)} className="mt-4 flex items-center gap-1 rounded-md border border-red-200 px-2 py-2 text-xs text-red-500 hover:bg-red-50"><Trash2 size={14} /> Remove</button>
              )}
            </div>
            <ListEditor label="Activities / Places" items={day.activities} onChange={(v) => set((d) => { d.days[activeDay].activities = v; })} fields={[{ key: 'text', placeholder: 'e.g. Suicide Point' }]} />
            <ImageUpload label="Day Image 1 (Top Right)" value={day.imgTop} onChange={(v) => set((d) => { d.days[activeDay].imgTop = v; })} />
            <ImageUpload label="Day Image 2 (Bottom Right)" value={day.imgBottom} onChange={(v) => set((d) => { d.days[activeDay].imgBottom = v; })} />
          </>
        )}
      </div>
    );
  }

  if (active === 'incl') {
    return (
      <div>
        <SectionTitle>Inclusions & Exclusions</SectionTitle>
        <ListEditor label="Inclusions" items={data.inclusions} onChange={(v) => set((d) => { d.inclusions = v; })} />
        <ListEditor label="Exclusions" items={data.exclusions} onChange={(v) => set((d) => { d.exclusions = v; })} />
      </div>
    );
  }

  if (active === 'price') {
    return (
      <div>
        <SectionTitle>Price Chart</SectionTitle>
        <ListEditor
          label="Table Rows"
          items={data.priceRows}
          onChange={(v) => set((d) => { d.priceRows = v; })}
          fields={[{ key: 'persons', placeholder: 'Persons' }, { key: 'rate', placeholder: 'Rate ₹' }, { key: 'rooms', placeholder: 'Rooms' }, { key: 'vehicle', placeholder: 'Vehicle' }]}
          newItem={{ persons: '', rate: '', rooms: '', vehicle: '' }}
        />
        <ListEditor label="Note Lines" items={data.priceNotes} onChange={(v) => set((d) => { d.priceNotes = v; })} />
      </div>
    );
  }

  if (active === 'gallery') {
    return (
      <div>
        <SectionTitle>Customer Gallery (up to 10)</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {data.gallery.map((g, i) => (
            <ImageUpload key={g.id} label={`Image ${i + 1}`} value={g.img} onChange={(v) => set((d) => { d.gallery[i].img = v; })} />
          ))}
        </div>
      </div>
    );
  }

  if (active === 'terms') {
    return (
      <div>
        <SectionTitle>Terms & Policies</SectionTitle>
        <Field label="Advance Payment %"><TextInput type="number" value={data.advancePct} onChange={(e) => set((d) => { d.advancePct = e.target.value; })} /></Field>
        <ListEditor label="Terms" items={data.terms} onChange={(v) => set((d) => { d.terms = v; })} />
        <ListEditor
          label="Payment Charges"
          items={data.paymentCharges}
          onChange={(v) => set((d) => { d.paymentCharges = v; })}
          fields={[{ key: 'window', placeholder: 'Payment window' }, { key: 'charge', placeholder: 'Charge %' }]}
          newItem={{ window: '', charge: '' }}
        />
      </div>
    );
  }

  if (active === 'cancel') {
    return (
      <div>
        <SectionTitle>Cancellation Policy</SectionTitle>
        <ListEditor label="Cancellation Rules" items={data.cancellation} onChange={(v) => set((d) => { d.cancellation = v; })} />
      </div>
    );
  }

  if (active === 'payment') {
    const p = data.payment;
    const f = (k) => (e) => set((d) => { d.payment[k] = e.target.value; });
    return (
      <div>
        <SectionTitle>Payment Details</SectionTitle>
        <Field label="Bank Name"><TextInput value={p.bankName} onChange={f('bankName')} /></Field>
        <Field label="Account Name"><TextInput value={p.accountName} onChange={f('accountName')} /></Field>
        <Field label="Account Number"><TextInput value={p.accountNo} onChange={f('accountNo')} /></Field>
        <Field label="IFSC Code"><TextInput value={p.ifsc} onChange={f('ifsc')} /></Field>
        <Field label="Branch"><TextInput value={p.branch} onChange={f('branch')} /></Field>
        <Field label="Phone Number"><TextInput value={p.phone} onChange={f('phone')} /></Field>
        <Field label="UPI / GPay ID"><TextInput value={p.upi} onChange={f('upi')} /></Field>
        <ImageUpload label="QR Code Image" value={p.qr} onChange={(v) => set((d) => { d.payment.qr = v; })} />
        <Field label="Google Review Rating (out of 5)"><TextInput type="number" step="0.1" max="5" value={p.rating} onChange={f('rating')} /></Field>
        <Field label="Testimonial Quote"><TextArea rows={3} value={p.testimonial} onChange={f('testimonial')} /></Field>
      </div>
    );
  }

  if (active === 'Follow Us') {
    return (
      <div className="space-y-6">
        <div>
          <SectionTitle>Follow Us</SectionTitle>
          <p className="text-sm text-slate-600 mb-4">
            This section is for any additional follow-up information or notes you may want to include.
          </p>
          <TextArea
            rows={4}
            value={data.followUp}
            onChange={(e) => set((d) => { d.followUp = e.target.value; })}
          />
        </div>

        {/* Social Media Section */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Follow Us</h4>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-2xl text-slate-400 transition-colors duration-200 ${link.color}`}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SectionTitle({ children }) {
  return <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>{children}</h2>;
}
