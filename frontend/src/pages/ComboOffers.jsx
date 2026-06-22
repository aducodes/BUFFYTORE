import React, { useContext, useEffect, useRef, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';

// ─── Default combos (fallback if admin hasn't set any) ───────────────────────
const DEFAULT_COMBOS = [
  {
    id: 'combo_2jersey',
    label: '2 Jerseys',
    emoji: '🎽',
    count: 2,
    description: 'Any 2 jerseys of your choice',
    discount: 10,
    badge: 'Popular',
    slots: [
      { label: 'First Jersey', category: 'Jersey' },
      { label: 'Second Jersey', category: 'Jersey' },
    ],
  },
  {
    id: 'combo_3jersey',
    label: '3 Jerseys',
    emoji: '🎽',
    count: 3,
    description: 'Pick any 3 jerseys',
    discount: 15,
    badge: 'Best Value',
    slots: [
      { label: 'First Jersey', category: 'Jersey' },
      { label: 'Second Jersey', category: 'Jersey' },
      { label: 'Third Jersey', category: 'Jersey' },
    ],
  },
  {
    id: 'combo_5jersey',
    label: '5 Jerseys',
    emoji: '🎽',
    count: 5,
    description: 'Team pack — all 5 jerseys',
    discount: 20,
    badge: 'Team Deal',
    slots: [
      { label: 'First Jersey', category: 'Jersey' },
      { label: 'Second Jersey', category: 'Jersey' },
      { label: 'Third Jersey', category: 'Jersey' },
      { label: 'Fourth Jersey', category: 'Jersey' },
      { label: 'Fifth Jersey', category: 'Jersey' },
    ],
  },
  {
    id: 'combo_jersey_tracks',
    label: 'Jersey + Tracks',
    emoji: '🎽',
    count: 2,
    description: 'One jersey + one pair of tracks',
    discount: 12,
    badge: null,
    slots: [
      { label: 'Select Jersey', category: 'Jersey' },
      { label: 'Select Tracks', category: 'Tracks' },
    ],
  },
  {
    id: 'combo_2jersey_tracks',
    label: '2 Jerseys + Tracks',
    emoji: '🎽',
    count: 3,
    description: 'Two jerseys with matching tracks',
    discount: 17,
    badge: null,
    slots: [
      { label: 'First Jersey', category: 'Jersey' },
      { label: 'Second Jersey', category: 'Jersey' },
      { label: 'Select Tracks', category: 'Tracks' },
    ],
  },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// ─── Mini combo card for homepage strip ──────────────────────────────────────
const ComboCard = ({ combo, onSelect }) => (
  <div
    onClick={() => onSelect(combo)}
    className="relative flex-shrink-0 w-56 sm:w-64 cursor-pointer group"
  >
    {/* Glow border */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    <div className="relative border border-green-900 group-hover:border-green-500 rounded-2xl p-5 h-full transition-all duration-300 bg-[#0a1a0a]">
      {/* Badge */}
      {combo.badge && (
        <span className="absolute -top-2.5 left-4 bg-green-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {combo.badge}
        </span>
      )}

      {/* Jersey count visual */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: Math.min(combo.count, 5) }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-9 rounded-md border border-green-700 bg-green-900/40 flex items-center justify-center text-sm"
            style={{ transform: `rotate(${(i - (combo.count - 1) / 2) * 4}deg)` }}
          >
            {combo.emoji}
          </div>
        ))}
      </div>

      <h3 className="text-white font-bold text-base mb-1 group-hover:text-green-400 transition-colors">
        {combo.label}
      </h3>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">{combo.description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black text-green-400">{combo.discount}%</span>
          <span className="text-gray-500 text-xs leading-tight">OFF<br />combo</span>
        </div>
        <div className="w-8 h-8 rounded-full border border-green-700 group-hover:bg-green-600 group-hover:border-green-600 flex items-center justify-center transition-all">
          <span className="text-green-400 group-hover:text-white text-sm">→</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Modal overlay for item-picking flow ─────────────────────────────────────
const ComboModal = ({ combo, products, currency, delivery_fee, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = (category) => {
    const catLower = category.toLowerCase();
    return products.filter((p) => {
      const matchCat =
        p.category?.toLowerCase().includes(catLower) ||
        p.subCategory?.toLowerCase().includes(catLower) ||
        p.name?.toLowerCase().includes(catLower);
      const matchSearch =
        searchQuery === '' || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  };

  const handleSelect = (product) => {
    if (!selectedSize) return alert('Please select a size first');
    const updated = [...selections];
    updated[currentStep] = { product, size: selectedSize };
    setSelections(updated);

    if (currentStep + 1 < combo.slots.length) {
      setCurrentStep(currentStep + 1);
      setSelectedSize('');
      setSearchQuery('');
    } else {
      onComplete(combo, updated);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      const prev = [...selections];
      prev.splice(currentStep, 1);
      setSelections(prev);
      setCurrentStep(currentStep - 1);
      setSelectedSize('');
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  const subtotal = selections.reduce((s, sel) => s + (sel?.product?.price || 0), 0);
  const discount = (subtotal * combo.discount) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-[#0d1f0d] border border-green-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-900">
          <div>
            <p className="text-green-400 text-xs font-semibold uppercase tracking-widest">Building combo</p>
            <h2 className="text-white font-bold text-lg">{combo.label}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-2xl leading-none">×</button>
        </div>

        {/* Progress steps */}
        <div className="flex gap-0 px-5 pt-4 pb-2 overflow-x-auto">
          {combo.slots.map((slot, idx) => (
            <div key={idx} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  idx < currentStep
                    ? 'bg-green-500 border-green-500 text-black'
                    : idx === currentStep
                    ? 'border-green-400 text-green-400'
                    : 'border-gray-700 text-gray-600'
                }`}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${idx === currentStep ? 'text-green-400' : 'text-gray-600'}`}>
                  {slot.label}
                </span>
              </div>
              {idx < combo.slots.length - 1 && (
                <div className={`h-px w-6 mx-1 mb-4 ${idx < currentStep ? 'bg-green-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left: Product picker */}
          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            <p className="text-gray-400 text-sm mb-3">
              Step {currentStep + 1}: <span className="text-white">{combo.slots[currentStep].label}</span>
              {' '}— select size then tap product
            </p>

            {/* Sizes */}
            <div className="flex gap-2 flex-wrap mb-3">
              {SIZE_OPTIONS.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                    selectedSize === sz
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'border-gray-700 text-gray-400 hover:border-green-600'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder={`Search ${combo.slots[currentStep].category}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-700 rounded-lg py-2 px-3 w-full bg-transparent text-white text-sm mb-3 focus:border-green-500 outline-none"
            />

            {/* Products */}
            <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
              {filteredProducts(combo.slots[currentStep].category).map((p) => (
                <div
                  key={p._id}
                  onClick={() => handleSelect(p)}
                  className={`border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-green-400 hover:scale-[1.02] ${
                    !selectedSize ? 'opacity-40 pointer-events-none' : 'border-gray-800'
                  }`}
                >
                  <img src={p.image?.[0]} alt={p.name} className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <p className="text-white text-[11px] font-medium line-clamp-1">{p.name}</p>
                    <p className="text-green-400 text-xs font-bold">{currency}{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary panel */}
          <div className="sm:w-60 border-t sm:border-t-0 sm:border-l border-green-900 p-4 flex flex-col gap-3 bg-[#081408]">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Your picks</p>

            {combo.slots.map((slot, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-2.5 flex gap-2 items-center transition ${
                  idx === currentStep
                    ? 'border-green-500'
                    : selections[idx]
                    ? 'border-green-900'
                    : 'border-gray-800'
                }`}
              >
                {selections[idx] ? (
                  <>
                    <img
                      src={selections[idx].product.image?.[0]}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-white text-[11px] font-medium truncate">{selections[idx].product.name}</p>
                      <p className="text-green-400 text-[10px]">Size {selections[idx].size}</p>
                      <p className="text-gray-500 text-[10px]">{currency}{selections[idx].product.price}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center text-base flex-shrink-0 ${
                      idx === currentStep ? 'border-green-500' : 'border-gray-800'
                    }`}>
                      {idx === currentStep ? '→' : '○'}
                    </div>
                    <p className={`text-[11px] ${idx === currentStep ? 'text-green-400' : 'text-gray-700'}`}>
                      {slot.label}
                    </p>
                  </>
                )}
              </div>
            ))}

            {subtotal > 0 && (
              <div className="mt-auto border border-green-900 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>−{combo.discount}%</span>
                  <span>−{currency}{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span><span>{currency}{delivery_fee}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-green-900">
                  <span>Total</span>
                  <span>{currency}{(subtotal - discount + delivery_fee).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={goBack}
              className="w-full border border-gray-700 text-gray-400 py-2 rounded-xl text-xs hover:border-white hover:text-white transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ComboOffers (drop into Home.jsx) ───────────────────────────────────
const ComboOffers = () => {
  const { products, token, delivery_fee, currency } = useContext(ShopContext);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [activeCombo, setActiveCombo] = useState(null);
  const [combos, setCombos] = useState(DEFAULT_COMBOS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // TODO: fetch combos from your backend if you've saved them via admin
  // useEffect(() => {
  //   fetch(`${backendUrl}/api/combos`).then(r => r.json()).then(d => setCombos(d.combos || DEFAULT_COMBOS));
  // }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const handleSelectCombo = (combo) => {
    if (!token) { navigate('/login'); return; }
    setActiveCombo(combo);
  };

  const handleComplete = (combo, selections) => {
    // Pass selections to the full ComboOffers page or directly to checkout
    // Option A: store in sessionStorage and navigate to the combo page
    sessionStorage.setItem('pendingCombo', JSON.stringify({ combo, selections }));
    navigate('/combo-offers');
    setActiveCombo(null);
  };

  return (
    <section className="py-14 px-4 sm:px-6">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-green-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Limited bundles</p>
          <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight">
            COMBO <span className="text-green-400">OFFERS</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Bundle up · Save more · Play better</p>
        </div>

        {/* Scroll arrows — desktop */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full border border-green-900 flex items-center justify-center text-green-400 disabled:opacity-30 hover:bg-green-900 transition"
          >
            ←
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full border border-green-900 flex items-center justify-center text-green-400 disabled:opacity-30 hover:bg-green-900 transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal scrollable strip */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {combos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} onSelect={handleSelectCombo} />
        ))}

        {/* "See all" card */}
        <div
          onClick={() => navigate('/combo-offers')}
          className="flex-shrink-0 w-40 border border-dashed border-green-900 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-green-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-full border border-green-700 group-hover:bg-green-600 group-hover:border-green-600 flex items-center justify-center transition-all text-green-400 group-hover:text-black font-bold text-lg">
            +
          </div>
          <span className="text-gray-500 group-hover:text-white text-xs text-center leading-tight transition">
            See all<br />combos
          </span>
        </div>
      </div>

      {/* Saving strip */}
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: 'Up to 20% off', sub: 'on jersey bundles' },
          { label: 'Free delivery', sub: 'on all combo orders' },
          { label: 'Mix & match', sub: 'any style, any size' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 bg-green-950 border border-green-900 rounded-xl px-4 py-2">
            <span className="text-green-400 text-sm font-bold">{item.label}</span>
            <span className="text-gray-600 text-xs">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {activeCombo && (
        <ComboModal
          combo={activeCombo}
          products={products}
          currency={currency}
          delivery_fee={delivery_fee}
          onClose={() => setActiveCombo(null)}
          onComplete={handleComplete}
        />
      )}
    </section>
  );
};

export default ComboOffers;