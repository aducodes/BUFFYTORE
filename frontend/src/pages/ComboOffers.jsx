import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';

// Category map — keeps Jersey/Tracks matching Topwear/Bottomwear
const CATEGORY_MAP = {
  jersey:    ['topwear', 'jersey'],
  tracks:    ['bottomwear', 'tracks', 'track'],
  't-shirt': ['topwear', 't-shirt', 'tshirt'],
  shorts:    ['bottomwear', 'shorts'],
  jacket:    ['topwear', 'jacket'],
};

const matchesCategory = (product, slotCategory) => {
  const cat = slotCategory.toLowerCase();
  const aliases = CATEGORY_MAP[cat] || [cat];
  return aliases.some(
    (alias) =>
      product.category?.toLowerCase().includes(alias) ||
      product.subCategory?.toLowerCase().includes(alias) ||
      product.name?.toLowerCase().includes(alias)
  );
};

const ComboOffers = () => {
  const { products, token, backendUrl, delivery_fee, currency } = useContext(ShopContext);
  const navigate = useNavigate();

  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  const [selectedCombo, setSelectedCombo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState([]);
  const [address, setAddress] = useState({
    firstName: '', lastName: '', email: '',
    street: '', city: '', state: '', pincode: '', phone: '',
  });
  const [stage, setStage] = useState('select-combo');
  const [isProcessing, setIsProcessing] = useState(false);
  // FIX: two-step — pendingProduct is tapped but not yet confirmed
  const [pendingProduct, setPendingProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token]);

  useEffect(() => {
    fetch(`${backendUrl}/api/combos`)
      .then(r => r.json())
      .then(d => { if (d.combos?.length) setCombos(d.combos); })
      .catch(() => {})
      .finally(() => setLoadingCombos(false));
  }, [backendUrl]);

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingCombo');
    if (pending) {
      try {
        const { combo, selections: sel } = JSON.parse(pending);
        sessionStorage.removeItem('pendingCombo');
        setSelectedCombo(combo);
        setSelections(sel);
        setStage('address');
      } catch {}
    }
  }, []);

  const filteredProducts = (slotCategory) =>
    products.filter((p) => {
      const matchCat = matchesCategory(p, slotCategory);
      const matchSearch =
        searchQuery === '' || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

  const startCombo = (combo) => {
    setSelectedCombo(combo);
    setSelections([]);
    setCurrentStep(0);
    setPendingProduct(null);
    setSelectedSize('');
    setSearchQuery('');
    setStage('select-items');
  };

  // Step 1: tap product → show its sizes
  const handleTapProduct = (product) => {
    setPendingProduct(product);
    setSelectedSize('');
  };

  // Step 2: confirm size → advance step
  const handleConfirmSize = () => {
    if (!pendingProduct || !selectedSize) return;
    const newSelections = [...selections];
    newSelections[currentStep] = { product: pendingProduct, size: selectedSize };
    setSelections(newSelections);
    if (currentStep + 1 < selectedCombo.slots.length) {
      setCurrentStep(currentStep + 1);
      setPendingProduct(null);
      setSelectedSize('');
      setSearchQuery('');
    } else {
      setStage('address');
    }
  };

  const goBackStep = () => {
    if (pendingProduct) {
      // dismiss size picker, stay on same product-picker step
      setPendingProduct(null);
      setSelectedSize('');
      return;
    }
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedSize('');
      setSearchQuery('');
      const prev = [...selections];
      prev.splice(currentStep, 1);
      setSelections(prev);
    } else {
      setStage('select-combo');
      setSelectedCombo(null);
    }
  };

  const subtotalAmount = () =>
    selections.reduce((sum, sel) => sum + (sel?.product?.price || 0), 0).toFixed(2);

  const totalAmount = () => {
    const subtotal = selections.reduce((sum, sel) => sum + (sel?.product?.price || 0), 0);
    const disc = (subtotal * (selectedCombo?.discount || 0)) / 100;
    return (subtotal - disc + delivery_fee).toFixed(2);
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) { resolve(true); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async (e) => {
    e.preventDefault();
    if (address.phone.length !== 10) { alert('Enter valid 10-digit phone'); return; }
    if (address.pincode.length !== 6) { alert('Enter valid 6-digit pincode'); return; }
    setIsProcessing(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) { alert('Failed to load payment gateway'); setIsProcessing(false); return; }
    const amount = parseFloat(totalAmount());
    try {
      const res = await fetch(`${backendUrl}/api/order/razorpay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!data.success) { alert('Failed to create payment'); setIsProcessing(false); return; }
      const orderItems = selections.map((sel) => ({
        ...structuredClone(sel.product),
        size: sel.size,
        quantity: 1,
      }));
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: 'INR',
        name: 'Buffy',
        description: selectedCombo.label,
        order_id: data.order.id,
        handler: async (response) => {
          const verifyRes = await fetch(`${backendUrl}/api/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              items: orderItems,
              address,
              amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderType: 'combo',
              comboDetails: {
                id: selectedCombo._id || selectedCombo.id,
                label: selectedCombo.label,
                discount: selectedCombo.discount,
              },
            }),
          });
          const vd = await verifyRes.json();
          if (vd.success) navigate('/order-success');
          else alert('Payment done but order save failed. Contact support.');
        },
        prefill: {
          name: `${address.firstName} ${address.lastName}`,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: '#006400' },
        modal: { ondismiss: () => setIsProcessing(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
      setIsProcessing(false);
    }
  };

  const indianStates = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
    "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
    "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
    "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
    "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir",
    "Ladakh","Chandigarh","Puducherry","Andaman & Nicobar Islands",
    "Dadra & Nagar Haveli and Daman & Diu","Lakshadweep"
  ];

  return (
    <div className='border-t border-white pt-10 min-h-[80vh]'>
      <div className='mb-8'>
        <Title text1={'COMBO'} text2={'OFFERS'} />
        <p className='text-white text-sm mt-1'>Save more by bundling your favourite items together</p>
      </div>

      {/* ── Select combo ── */}
      {stage === 'select-combo' && (
        <>
          {loadingCombos ? (
            <div className='text-gray-400 text-sm text-center py-16'>Loading combos…</div>
          ) : combos.length === 0 ? (
            <div className='text-gray-500 text-sm text-center py-16'>No combo offers available right now.</div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {combos.map((combo) => (
                <div key={combo._id || combo.id} onClick={() => startCombo(combo)}
                  className='border border-green-700 rounded-xl p-5 cursor-pointer hover:border-green-400 hover:bg-green-950 transition-all group'>
                  <div className='relative mb-4' style={{ height: '52px' }}>
                    {Array.from({ length: Math.min(combo.count, 5) }).map((_, i) => {
                      const total = Math.min(combo.count, 5);
                      return (
                        <div key={i}
                          className='absolute rounded-md border border-green-700 overflow-hidden bg-green-900/40'
                          style={{
                            left: `${i * 22}px`, top: 0,
                            transform: `rotate(${(i - (total - 1) / 2) * 5}deg)`,
                            zIndex: i, height: '52px', width: '40px',
                          }}>
                          {combo.image ? (
                            <img src={combo.image} alt={combo.label} className='w-full h-full object-cover' />
                          ) : (
                            <div className='w-full h-full bg-gradient-to-br from-green-800 to-green-950 flex items-center justify-center'>
                              <span className='text-green-500 text-sm font-bold'>{combo.label.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {combo.badge && (
                    <span className='inline-block bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2'>
                      {combo.badge}
                    </span>
                  )}
                  <h3 className='text-white font-bold text-lg group-hover:text-green-400 transition'>{combo.label}</h3>
                  <p className='text-gray-400 text-sm mt-1 mb-3'>{combo.description}</p>
                  <div className='flex items-center justify-between'>
                    {combo.discount > 0 ? (
                      <span className='bg-green-800 text-green-300 text-xs px-3 py-1 rounded-full font-semibold'>
                        {combo.discount}% OFF
                      </span>
                    ) : <span />}
                    <span className='text-green-400 text-sm'>{combo.slots?.length} items →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Select items ── */}
      {stage === 'select-items' && selectedCombo && (
        <div>
          {/* Progress stepper */}
          <div className='flex items-center gap-2 mb-8 overflow-x-auto pb-2'>
            {selectedCombo.slots.map((slot, idx) => (
              <React.Fragment key={idx}>
                <div className={`flex items-center gap-2 flex-shrink-0 ${idx <= currentStep ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    idx < currentStep ? 'bg-green-600 border-green-600 text-white' :
                    idx === currentStep ? 'border-green-400 text-green-400' :
                    'border-gray-600 text-gray-600'}`}>
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <span className='text-xs whitespace-nowrap'>{slot.label}</span>
                </div>
                {idx < selectedCombo.slots.length - 1 && (
                  <div className={`h-0.5 w-8 flex-shrink-0 ${idx < currentStep ? 'bg-green-600' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className='flex flex-col lg:flex-row gap-8'>
            <div className='flex-1'>

              {/* ── Size picker: shown after tapping a product ── */}
              {pendingProduct ? (
                <div>
                  <div className='flex items-center gap-4 mb-5'>
                    <img
                      src={pendingProduct.image?.[0]}
                      alt={pendingProduct.name}
                      className='w-16 h-16 rounded-xl object-cover border border-green-800'
                    />
                    <div>
                      <p className='text-white font-semibold'>{pendingProduct.name}</p>
                      <p className='text-green-400 text-sm'>{currency}{pendingProduct.price}</p>
                    </div>
                  </div>
                  <p className='text-gray-400 text-sm mb-3'>Pick a size:</p>
                  <div className='flex gap-2 flex-wrap mb-6'>
                    {(pendingProduct.sizes && pendingProduct.sizes.length > 0
                      ? pendingProduct.sizes
                      : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
                    ).map((sz) => (
                      <button key={sz} type='button' onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 rounded border text-sm font-medium transition ${
                          selectedSize === sz
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-600 text-gray-300 hover:border-green-500'}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                  <button
                    type='button'
                    onClick={handleConfirmSize}
                    disabled={!selectedSize}
                    className='w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition'
                  >
                    Confirm — {selectedSize || 'select a size'}
                  </button>
                </div>
              ) : (
                /* ── Product picker ── */
                <>
                  <h3 className='text-white text-lg font-semibold mb-1'>
                    Step {currentStep + 1}: {selectedCombo.slots[currentStep].label}
                  </h3>
                  <p className='text-gray-400 text-sm mb-4'>Tap a product to choose its size</p>
                  <input type='text'
                    placeholder={`Search ${selectedCombo.slots[currentStep].category}...`}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className='border border-gray-600 rounded py-2 px-3 w-full bg-transparent text-white mb-4 text-sm' />

                  {filteredProducts(selectedCombo.slots[currentStep].category).length === 0 ? (
                    <div className='text-center text-gray-400 py-10'>
                      No products found for "{selectedCombo.slots[currentStep].category}"
                      <p className='text-xs text-gray-600 mt-1'>Add products with subCategory "Topwear" for jerseys or "Bottomwear" for tracks.</p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1'>
                      {filteredProducts(selectedCombo.slots[currentStep].category).map((p) => (
                        <div key={p._id} onClick={() => handleTapProduct(p)}
                          className='group border border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-green-400 hover:scale-[1.03] hover:shadow-lg hover:shadow-green-900/40 bg-[#0a1a0a]'>
                          <div className='relative w-full overflow-hidden rounded-t-lg' style={{ height: '150px' }}>
                            <img
                              src={p.image?.[0]}
                              alt={p.name}
                              className='w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105'
                            />
                            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                          </div>
                          <div className='p-2 group-hover:bg-green-950 transition-colors duration-200'>
                            <p className='text-white text-xs font-medium line-clamp-2 group-hover:text-green-300'>{p.name}</p>
                            <p className='text-green-400 text-sm font-bold mt-0.5'>{currency}{p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary sidebar */}
            <div className='lg:w-72'>
              <h4 className='text-white font-semibold mb-3'>Your Selections</h4>
              <div className='flex flex-col gap-3'>
                {selectedCombo.slots.map((slot, idx) => (
                  <div key={idx} className={`border rounded-lg p-3 flex gap-3 items-center ${
                    idx === currentStep ? 'border-green-500 bg-green-950' :
                    idx < currentStep && selections[idx] ? 'border-green-800 bg-green-950 bg-opacity-50' : 'border-gray-800'}`}>
                    {selections[idx] ? (
                      <>
                        <img src={selections[idx].product.image?.[0]} alt='' className='w-12 h-12 object-cover rounded' />
                        <div>
                          <p className='text-white text-xs font-medium line-clamp-1'>{selections[idx].product.name}</p>
                          <p className='text-green-400 text-xs'>Size: {selections[idx].size}</p>
                          <p className='text-gray-400 text-xs'>{currency}{selections[idx].product.price}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded border-2 border-dashed flex items-center justify-center text-xl ${idx === currentStep ? 'border-green-500' : 'border-gray-700'}`}>
                          {idx === currentStep ? '→' : '○'}
                        </div>
                        <p className={`text-xs ${idx === currentStep ? 'text-green-400' : 'text-gray-600'}`}>{slot.label}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {selections.length > 0 && (
                <div className='mt-4 p-3 border border-green-800 rounded-lg'>
                  <p className='text-gray-400 text-xs'>Subtotal: {currency}{subtotalAmount()}</p>
                  {selectedCombo.discount > 0 && (
                    <p className='text-green-400 text-xs'>
                      Discount ({selectedCombo.discount}%): -{currency}{((parseFloat(subtotalAmount()) * selectedCombo.discount) / 100).toFixed(2)}
                    </p>
                  )}
                  <p className='text-gray-400 text-xs'>Delivery: {currency}{delivery_fee}</p>
                  <p className='text-white font-bold mt-1'>Total: {currency}{totalAmount()}</p>
                </div>
              )}
              <button type='button' onClick={goBackStep}
                className='mt-4 w-full border border-gray-600 text-gray-400 py-2 rounded text-sm hover:border-white hover:text-white transition'>
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Address ── */}
      {stage === 'address' && (
        <form onSubmit={(e) => { e.preventDefault(); setStage('payment'); }} className='max-w-xl mx-auto'>
          <h3 className='text-white text-xl font-semibold mb-6'>Delivery Address</h3>
          <div className='bg-green-950 border border-green-800 rounded-lg p-4 mb-6'>
            <p className='text-green-400 font-semibold text-sm mb-2'>{selectedCombo?.label}</p>
            {selections.map((sel, idx) => (
              <div key={idx} className='flex items-center gap-3 py-1'>
                <img src={sel.product.image?.[0]} alt='' className='w-10 h-10 rounded object-cover' />
                <span className='text-white text-sm'>{sel.product.name}</span>
                <span className='text-gray-400 text-xs'>({sel.size})</span>
              </div>
            ))}
            <div className='border-t border-green-800 mt-3 pt-3 flex justify-between'>
              <span className='text-gray-400 text-sm'>
                {selectedCombo?.discount > 0 ? `Total after ${selectedCombo.discount}% off` : 'Total'}
              </span>
              <span className='text-white font-bold'>{currency}{totalAmount()}</span>
            </div>
          </div>
          <div className='flex flex-col gap-4'>
            <div className='flex gap-3'>
              <input required placeholder='First Name' value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
              <input required placeholder='Last Name' value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
            </div>
            <input required type='email' placeholder='Email' value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })}
              className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
            <input required placeholder='Street Address' value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
            <div className='flex gap-3'>
              <input required placeholder='District' value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
              <select required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm'>
                <option value=''>State</option>
                {indianStates.map((s) => <option key={s} value={s} className='text-black'>{s}</option>)}
              </select>
            </div>
            <input required placeholder='Pincode (6 digits)' value={address.pincode}
              onChange={(e) => e.target.value.length <= 6 && setAddress({ ...address, pincode: e.target.value })}
              className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
            <input required placeholder='Phone (10 digits)' value={address.phone}
              onChange={(e) => e.target.value.length <= 10 && setAddress({ ...address, phone: e.target.value })}
              className='border border-white rounded py-2 px-3 w-full text-white bg-transparent text-sm' />
          </div>
          <div className='flex gap-3 mt-6'>
            <button type='button' onClick={() => setStage('select-items')}
              className='flex-1 border border-gray-600 text-gray-400 py-3 rounded hover:border-white hover:text-white transition text-sm'>← Back</button>
            <button type='submit'
              className='flex-1 bg-green-700 text-white py-3 rounded hover:bg-green-600 transition text-sm font-semibold'>Continue to Payment →</button>
          </div>
        </form>
      )}

      {/* ── Payment ── */}
      {stage === 'payment' && (
        <form onSubmit={handlePayment} className='max-w-xl mx-auto'>
          <h3 className='text-white text-xl font-semibold mb-6'>Payment</h3>
          <div className='bg-green-950 border border-green-800 rounded-lg p-5 mb-6'>
            <p className='text-green-400 font-bold mb-3'>
              {selectedCombo?.label}
              {selectedCombo?.discount > 0 && ` — ${selectedCombo.discount}% discount applied`}
            </p>
            {selections.map((sel, idx) => (
              <div key={idx} className='flex justify-between text-sm text-gray-300 py-1'>
                <span>{sel.product.name} (Size: {sel.size})</span>
                <span>{currency}{sel.product.price}</span>
              </div>
            ))}
            <div className='border-t border-green-800 mt-3 pt-3 space-y-1 text-sm'>
              <div className='flex justify-between text-gray-400'><span>Subtotal</span><span>{currency}{subtotalAmount()}</span></div>
              {selectedCombo?.discount > 0 && (
                <div className='flex justify-between text-green-400'>
                  <span>Combo Discount ({selectedCombo.discount}%)</span>
                  <span>-{currency}{((parseFloat(subtotalAmount()) * (selectedCombo.discount || 0)) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between text-gray-400'><span>Delivery</span><span>{currency}{delivery_fee}</span></div>
              <div className='flex justify-between text-white font-bold text-base pt-1'><span>Total</span><span>{currency}{totalAmount()}</span></div>
            </div>
          </div>
          <div className='border border-green-600 rounded-lg p-4 flex items-center gap-3 mb-6'>
            <div className='w-5 h-5 rounded-full bg-green-500 flex-shrink-0'></div>
            <div>
              <p className='text-white font-medium text-sm'>Pay via Razorpay</p>
              <p className='text-gray-400 text-xs'>Cards · UPI · Netbanking · Wallets</p>
            </div>
          </div>
          <div className='flex gap-3'>
            <button type='button' onClick={() => setStage('address')}
              className='flex-1 border border-gray-600 text-gray-400 py-3 rounded hover:border-white hover:text-white transition text-sm'>← Back</button>
            <button type='submit' disabled={isProcessing}
              className='flex-1 bg-green-700 text-white py-3 rounded hover:bg-green-600 transition text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed'>
              {isProcessing ? 'PROCESSING...' : `PAY ${currency}${totalAmount()}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ComboOffers;