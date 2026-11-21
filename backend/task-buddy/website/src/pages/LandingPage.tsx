import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CheckCircle, Star, ShieldCheck } from 'lucide-react';
import ChatWidget from '../components/ChatWidget.tsx';
import Navbar from '../components/Navbar.tsx';

const SERVICES = [
  { name: 'Cleaning', icon: '🧹', desc: 'Deep cleaning and organization' },
  { name: 'Plumbing', icon: '🚰', desc: 'Fix leaks and install fixtures' },
  { name: 'Electrical', icon: '⚡', desc: 'Wiring, lighting and repairs' },
  { name: 'Furniture', icon: '🛋️', desc: 'Assembly and moving' },
  { name: 'Gardening', icon: '🌱', desc: 'Lawn care and landscaping' },
  { name: 'General Help', icon: '📦', desc: 'Odd jobs and errands' },
  { name: 'Air Conditioner Repair', icon: '❄️', desc: 'AC service and installation' },
  { name: 'Auto Repair', icon: '🔧', desc: 'Vehicle repairs and maintenance' },
];

const DOC_TYPES_OK = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const Toast = ({ text }: { text: string | null }) =>
  text ? (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-buddy-dark dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl text-sm font-bold animate-pulse" key={text}>
      {text}
    </div>
  ) : null;


const HeroSlides = () => {
  // Local taskers helping clients — swap or add images in website/public/
  // slide-market-*.jpg: Wikimedia Commons (Lagos, Nigeria), CC-licensed with attribution in filenames:
  // "A fruits seller in Lagos Nigeria" / "A lady hawking snacks in lagos Nigeria"
  const slides = [
    { src: '/slide-1-furniture.jpg', alt: 'Local Tasker Helping a Client — Furniture moving and delivery' },
    { src: '/slide-market-fruits.jpg', alt: 'Fruit market vendors in Lagos, Nigeria' },
    { src: '/slide-2-autorepair.jpg', alt: 'Local Tasker Helping a Client — Roadside auto repair' },
    { src: '/slide-market-hawker.jpg', alt: 'Snack hawker walking through a Lagos market' },
    { src: '/slide-3-delivery.jpg', alt: 'Local Tasker Helping a Client — Groceries delivery' },
    { src: '/slide-4-team.jpg', alt: 'Local Tasker Helping a Client — Task Buddy team on the job' },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="w-full h-[400px] relative rounded-3xl overflow-hidden shadow-2xl">
      {slides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <button
        aria-label="Previous slide"
        onClick={() => setIdx((idx - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-buddy-dark text-xl font-bold leading-none shadow flex items-center justify-center transition"
      >
        ‹
      </button>
      <button
        aria-label="Next slide"
        onClick={() => setIdx((idx + 1) % slides.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-buddy-dark text-xl font-bold leading-none shadow flex items-center justify-center transition"
      >
        ›
      </button>
      <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full transition ${i === idx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
          />
        ))}
      </div>
      <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
        <div className="w-10 h-10 bg-buddy-blue rounded-full flex items-center justify-center text-white">✓</div>
        <div>
          <p className="text-sm font-bold text-buddy-dark dark:text-white">Verified Pro Assigned</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Coming to your location in 15 mins</p>
        </div>
      </div>
    </div>
  );
};


const Hero = (props: {
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
}) => (
  <section className="relative bg-white dark:bg-gray-900 py-20 px-6 overflow-hidden">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-5xl md:text-6xl font-extrabold text-buddy-dark dark:text-white leading-tight mb-6">
          Get your chores done <br />
          <span className="bg-gradient-to-r from-buddy-cyan to-buddy-blue bg-clip-text text-transparent">
            the easy way.
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
          Connecting households and businesses across Africa with verified local pros for everything from plumbing to professional cleaning.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400" size={20} />
            <input
              type="text"
              value={props.query}
              onChange={(e) => props.setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && props.onSearch()}
              placeholder="What do you need help with?"
              className="pl-10 pr-4 py-4 w-full sm:w-80 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-buddy-blue shadow-sm"
            />
          </div>
          <button onClick={props.onSearch} className="bg-buddy-orange text-white px-8 py-4 rounded-full font-bold hover:bg-orange-600 transition">
            Search
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <HeroSlides />
      </div>
    </div>
  </section>
);

const Services = (props: { query: string; onPick: (name: string) => void }) => {
  const query = props.query.trim().toLowerCase();
  const highlighted = useMemo(
    () => SERVICES.map((s) => ({ ...s, match: query.length > 1 && s.name.toLowerCase().includes(query) })),
    [query]
  );
  return (
    <section id="services" className="py-20 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-buddy-dark dark:text-white mb-4">Our Popular Services</h2>
          <p className="text-gray-600 dark:text-gray-400">Everything you need to keep your home running smoothly.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {highlighted.map((s) => (
            <div
              key={s.name}
              onClick={() => props.onPick(s.name)}
              className={`bg-white dark:bg-gray-900 p-8 rounded-2xl text-center hover:shadow-xl transition cursor-pointer border group ${
                s.match ? 'border-buddy-blue ring-2 ring-buddy-blue' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition duration-300">{s.icon}</div>
              <h3 className="text-xl font-extrabold text-buddy-dark dark:text-white mb-2">{s.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { n: '1', title: 'Post Your Task', desc: 'Tell us what you need — cleaning, plumbing, repairs — and when you need it done.', icon: '📝' },
    { n: '2', title: 'Get Matched', desc: 'We connect you with verified local pros nearby, with transparent pricing up front.', icon: '🤝' },
    { n: '3', title: 'Relax & Pay Securely', desc: 'Your pro completes the job and payment is handled safely in the app via Paystack or Flutterwave.', icon: '🔒' },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-buddy-dark dark:text-white mb-4">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-400">Three simple steps to get things done.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-buddy-cyan to-buddy-blue text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-md">
                {s.n}
              </div>
              <div className="text-4xl mb-4 mt-4">{s.icon}</div>
              <h3 className="text-xl font-extrabold text-buddy-dark dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrustSection = () => (
  <section id="trust" className="py-20 px-6 bg-white dark:bg-gray-950">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-4xl font-extrabold text-buddy-dark dark:text-white mb-12">Why Trust Task Buddy?</h2>
      <div className="grid md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-buddy-blue rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-buddy-dark dark:text-white mb-2">Verified Pros</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Every Tasker is verified via NIN/BVN for your security.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 text-buddy-orange rounded-full flex items-center justify-center mb-4">
            <Star size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-buddy-dark dark:text-white mb-2">Quality Guaranteed</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Our rating system ensures only the best pros stay on the platform.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-buddy-blue rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-buddy-dark dark:text-white mb-2">Safe Payments</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Secure payments via Paystack and Flutterwave. No cash stress.</p>
        </div>
      </div>
    </div>
  </section>
);

const BecomeTasker = (props: { onApply: () => void; onLearnMore: () => void }) => (
  <section id="become-tasker" className="py-20 px-6">
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-buddy-cyan via-buddy-blue to-blue-800 rounded-3xl px-8 py-16 text-center relative overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto">
        <img src="/task-buddy-logo.png" alt="Task Buddy" className="h-16 w-auto mx-auto mb-6" />
        <h2 className="text-4xl font-extrabold text-white mb-4">Earn On Your Own Terms</h2>
        <p className="text-blue-100 mb-8">
          Join thousands of Taskers across Africa turning their skills into income. Set your rates, pick your jobs, get paid securely and on time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={props.onApply} className="bg-buddy-orange hover:bg-orange-600 text-white px-8 py-4 rounded-full font-extrabold shadow-lg transition">
            Apply to be a Tasker
          </button>
          <button onClick={props.onLearnMore} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-extrabold transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = (props: { toast: (t: string) => void }) => {
  const link = (label: string, anchor?: string) => (
    <a
      href={anchor ? `#${anchor}` : '#'}
      onClick={(e) => {
        if (!anchor) { e.preventDefault(); props.toast(`${label} is coming soon.`); }
      }}
      className="hover:text-white transition"
    >
      {label}
    </a>
  );
  return (
    <footer className="bg-buddy-dark dark:bg-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <img src="/task-buddy-logo.png" alt="Task Buddy Logo" className="h-10 w-auto" />
            <img src="/task-buddy-wordmark.png" alt="TaskBuddy" className="h-7 w-auto" />
          </div>
          <p className="text-gray-400 max-w-sm">
            The leading marketplace for home services in Africa. Connecting you with the help you need, when you need it.
          </p>
        </div>
        <div>
          <h4 className="font-extrabold mb-6">Company</h4>
          <ul className="text-gray-400 space-y-4 text-sm">
            <li>{link('About Us')}</li>
            <li>{link('Careers')}</li>
            <li>{link('Press')}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-extrabold mb-6">Support</h4>
          <ul className="text-gray-400 space-y-4 text-sm">
            <li>{link('Help Center')}</li>
            <li>{link('Safety', 'trust')}</li>
            <li>{link('Contact')}</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Task Buddy Africa. All rights reserved.
      </div>
    </footer>
  );
};

// ---- Modals ----

const DownloadModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
      <img src="/task-buddy-logo.png" alt="" className="h-16 mx-auto mb-4" />
      <h3 className="text-2xl font-extrabold text-buddy-dark dark:text-white mb-2">The Task Buddy App</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Our mobile app is rolling out soon. Meanwhile, chat with us right here on the site —
        click the 💬 button in the corner!
      </p>
      <div className="flex gap-3 justify-center">
        <span className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold">App Store — soon</span>
        <span className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold">Google Play — soon</span>
      </div>
      <button onClick={onClose} className="mt-6 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Close</button>
    </div>
  </div>
);

const ApplyModal = ({ onClose, toast }: { onClose: () => void; toast: (t: string) => void }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [docs, setDocs] = useState<File[]>([]);
  const [docError, setDocError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const toggle = (name: string) =>
    setSelected((sel) => (sel.includes(name) ? sel.filter((s) => s !== name) : [...sel, name]));

  const addDocs = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [...docs];
    for (const f of Array.from(list)) {
      if (!DOC_TYPES_OK.includes(f.type)) { setDocError('Allowed: PDF, PNG, JPG, DOC, DOCX'); continue; }
      if (f.size > 10 * 1024 * 1024) { setDocError(`${f.name} is over the 10MB limit`); continue; }
      if (next.length >= 5) { setDocError('Up to 5 documents'); continue; }
      if (!next.some((d) => d.name === f.name)) next.push(f);
      setDocError('');
    }
    setDocs(next);
  };

  const submit = async () => {
    setStatus('sending');
    setError('');
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('services', JSON.stringify(selected));
      docs.forEach((d) => fd.append('documents', d));
      const res = await fetch('http://localhost:5000/api/apply/become-tasker', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setError(data.error || 'Could not submit. Try again.');
      }
    } catch {
      setStatus('error');
      setError('Could not reach the server. Is the backend running?');
    }
  };

  const textField = (key: keyof typeof form, label: string, type = 'text') => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      placeholder={label}
      className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full"
    />
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {status === 'done' ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-extrabold text-buddy-dark dark:text-white mb-2">Application received!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Thanks {form.full_name.split(' ')[0]} — you applied for {selected.length} task{selected.length > 1 ? 's' : ''} ({selected.join(', ')}).
              Our team will review your application and contact you via email{docs.length ? ` about the ${docs.length} document${docs.length > 1 ? 's' : ''} you attached` : ''}.
            </p>
            <button onClick={onClose} className="bg-buddy-orange hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold text-sm transition">Done</button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-extrabold text-buddy-dark dark:text-white mb-1">Apply to be a Tasker</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Pick the tasks you do — as many as you like.</p>

            {/* multi-select services */}
            <div className="flex flex-wrap gap-2 mb-5">
              {SERVICES.map((s) => {
                const on = selected.includes(s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => toggle(s.name)}
                    className={`px-4 py-2.5 rounded-full text-sm font-bold border-2 transition ${on ? 'bg-buddy-blue border-buddy-blue text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-buddy-blue'}`}
                  >
                    {s.icon} {s.name} {on && '✓'}
                  </button>
                );
              })}
            </div>

            {/* document upload — evidence of technical/trade training (optional for everyone) */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-buddy-dark dark:text-white mb-1">
                Qualification documents <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                Been to a technical college or hold trade certificates/licenses? Upload them to boost your
                approval chances — trade certificates, NIN/BVN proof, diplomas. PDF, PNG, JPG, DOC or DOCX,
                up to 5 files, 10MB each.
              </p>
              <label className={`block border-2 border-dashed rounded-2xl px-4 py-6 text-center cursor-pointer transition ${docs.length ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-buddy-blue'}`}>
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={(e) => addDocs(e.target.files)} />
                {docs.length ? (
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-bold">{docs.length} file{docs.length > 1 ? 's' : ''} attached</p>
                    <ul className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      {docs.map((d) => <li key={d.name}>📄 {d.name}</li>)}
                    </ul>
                    <p className="text-[11px] text-buddy-blue mt-2">Click to add more</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">📎 Click to upload documents</p>
                )}
              </label>
              {docError && <p className="text-red-500 text-xs mt-1">{docError}</p>}
            </div>

            {/* contact fields */}
            <div className="flex flex-col gap-3">
              {textField('full_name', 'Full name')}
              {textField('email', 'Email address', 'email')}
              {textField('phone', 'Phone (e.g. 08023668000)', 'tel')}
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={submit}
                disabled={status === 'sending' || selected.length === 0}
                className="bg-buddy-orange hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-sm transition"
              >
                {status === 'sending' ? 'Submitting…' : `Submit Application${selected.length ? ` (${selected.length} task${selected.length > 1 ? 's' : ''})` : ''}`}
              </button>
              {selected.length === 0 && <p className="text-[11px] text-gray-400 -mt-2">Pick at least one task above.</p>}
              <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function LandingPage({ dark, onToggleDark }: any) {
  const [query, setQuery] = useState('');
  const [showDownload, setShowDownload] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<any>(null);

  const toast = (t: string) => {
    setToastText(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(null), 2600);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearch = () => {
    scrollTo('services');
    if (!query.trim()) toast('Try a service like "Cleaning" or "Plumbing"');
  };

  const pickService = (name: string) => {
    setQuery(name);
    scrollTo('root-top');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast(`"${name}" loaded in search — hit Search to see it highlighted.`);
  };

  return (
    <div className="font-sans text-buddy-dark dark:text-white bg-white dark:bg-gray-900 min-h-screen">
      <Navbar
        onDownload={() => setShowDownload(true)}
        onApply={() => setShowApply(true)}
        dark={dark}
        onToggleDark={onToggleDark}
        landing
      />
      <Hero query={query} setQuery={setQuery} onSearch={handleSearch} />
      <Services query={query} onPick={pickService} />
      <HowItWorks />
      <TrustSection />
      <BecomeTasker onApply={() => setShowApply(true)} onLearnMore={() => scrollTo('how-it-works')} />
      <Footer toast={toast} />

      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showApply && <ApplyModal onClose={() => setShowApply(false)} toast={toast} />}
      <Toast text={toastText} />
      <ChatWidget />
    </div>
  );
}
