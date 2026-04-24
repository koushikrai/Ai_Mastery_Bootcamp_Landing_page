import { 
    getProductPricing, 
    upsertProductPrice, 
    getCouponCodes, 
    createCouponCode, 
    updateCouponCode, 
    deleteCouponCode
  } from './lib/pricing-api';
import type { ProductPricing, CouponCode } from './lib/pricing-api';
import { supabase } from './supabase-client';


  
  // ─── UTILS ─────────────────────────────────────────────────────────────
  
  const PRODUCT_LABELS: Record<string, string> = {
    'kids': 'AI Rangers (Kids)',
    'pro': 'AI Mastery Bootcamp (Pro)',
  };
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
  
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
  
  // ─── STATE ─────────────────────────────────────────────────────────────
  
  let pricingData: ProductPricing[] = [];
  let couponsData: CouponCode[] = [];
  
  // ─── PRICING LOGIC ─────────────────────────────────────────────────────
  
  const renderPricingTable = () => {
    const tbody = document.getElementById('pricing-table-body');
    if (!tbody) return;
  
    if (pricingData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-amber-600 bg-amber-50 font-semibold border-t border-amber-200">
            No pricing found. Please create the tables and seed data in Supabase.
          </td>
        </tr>
      `;
      return;
    }
  
    tbody.innerHTML = '';
    
    pricingData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-amber-50/30 transition-colors group';
      
      tr.innerHTML = `
        <td class="px-4 py-4 text-sm font-bold text-gray-800 whitespace-nowrap">
          ${PRODUCT_LABELS[row.product_id] || row.product_id}
        </td>
        <td class="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
          <span class="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold border border-gray-200">
            ${row.variant_key || 'Default'}
          </span>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500 font-bold text-sm">₹</span>
            <input type="number" id="orig-price-${index}" value="${row.original_price}" class="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-gray-500 line-through">
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-800 font-black text-sm">₹</span>
            <input type="number" id="curr-price-${index}" value="${row.price}" class="w-24 border-2 border-green-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-black text-green-700 bg-green-50">
          </div>
        </td>
        <td class="px-4 py-4 text-center">
          <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" id="coupon-en-${index}" class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-all duration-300 z-10" ${row.coupon_enabled ? 'checked' : ''}/>
              <label for="coupon-en-${index}" class="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300"></label>
          </div>
        </td>
        <td class="px-4 py-4 text-center">
          <button id="save-price-${index}" class="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3D2C8D] hover:bg-[#2B1B61] text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50">
            <i class="fas fa-save"></i> Save
          </button>
        </td>
      `;
      tbody.appendChild(tr);
  
      // Add event listener for save button
      const saveBtn = document.getElementById(`save-price-${index}`);
      saveBtn?.addEventListener('click', async () => {
        const origPriceInput = document.getElementById(`orig-price-${index}`) as HTMLInputElement;
        const currPriceInput = document.getElementById(`curr-price-${index}`) as HTMLInputElement;
        const couponEnInput = document.getElementById(`coupon-en-${index}`) as HTMLInputElement;
        
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.setAttribute('disabled', 'true');
  
        try {
          const updated = await upsertProductPrice({
            product_id: row.product_id,
            variant_key: row.variant_key,
            original_price: Number(origPriceInput.value),
            price: Number(currPriceInput.value),
            coupon_enabled: couponEnInput.checked
          });
          
          pricingData[index] = updated;
          showToast('Pricing saved successfully', 'success');
        } catch (error: any) {
          showToast(error.message || 'Error saving pricing', 'error');
        } finally {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
          saveBtn.removeAttribute('disabled');
        }
      });
    });
  };
  
  // ─── COUPON LOGIC ──────────────────────────────────────────────────────
  
  const renderCouponsTable = () => {
    const tbody = document.getElementById('coupons-table-body');
    const countBadge = document.getElementById('active-coupons-count');
    
    if (!tbody || !countBadge) return;
  
    const activeCount = couponsData.filter(c => c.is_active).length;
    countBadge.textContent = `${activeCount} active`;
  
    if (couponsData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-gray-500 font-semibold">
            No coupons created yet. Add your first coupon above.
          </td>
        </tr>
      `;
      return;
    }
  
    tbody.innerHTML = '';
    
    couponsData.forEach((coupon, index) => {
      const tr = document.createElement('tr');
      tr.className = `hover:bg-amber-50/30 transition-colors ${!coupon.is_active ? 'opacity-60' : ''}`;
      
      tr.innerHTML = `
        <td class="px-4 py-3">
          <span class="font-mono font-black text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-800 border border-gray-200">
            ${coupon.code}
          </span>
        </td>
        <td class="px-4 py-3 text-sm font-black text-green-600">
          ₹${Number(coupon.discount_amount).toLocaleString()}
        </td>
        <td class="px-4 py-3 text-sm text-gray-700 font-semibold">
          ${PRODUCT_LABELS[coupon.applicable_product_id] || coupon.applicable_product_id}
        </td>
        <td class="px-4 py-3 text-sm text-gray-500 font-semibold">
          ${coupon.applicable_variant_key ? `<span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-100">${coupon.applicable_variant_key}</span>` : '<span class="italic text-gray-400">All variants</span>'}
        </td>
        <td class="px-4 py-3 text-center">
          <button id="toggle-coupon-${index}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${coupon.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            <i class="fas ${coupon.is_active ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
            ${coupon.is_active ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td class="px-4 py-3 text-center">
          <button id="delete-coupon-${index}" class="w-8 h-8 rounded-lg text-red-500 hover:text-white hover:bg-red-500 transition shadow-sm bg-red-50 flex items-center justify-center mx-auto" title="Delete coupon">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
  
      // Toggle Event
      const toggleBtn = document.getElementById(`toggle-coupon-${index}`);
      toggleBtn?.addEventListener('click', async () => {
        try {
          toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          const updated = await updateCouponCode(coupon.id!, { is_active: !coupon.is_active });
          couponsData[index] = updated;
          showToast(`Coupon ${updated.code} ${updated.is_active ? 'enabled' : 'disabled'}`, 'success');
          renderCouponsTable();
        } catch (error: any) {
          showToast(error.message, 'error');
        }
      });
  
      // Delete Event
      const deleteBtn = document.getElementById(`delete-coupon-${index}`);
      deleteBtn?.addEventListener('click', async () => {
        if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
        
        try {
          deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          await deleteCouponCode(coupon.id!);
          couponsData = couponsData.filter(c => c.id !== coupon.id);
          showToast(`Coupon deleted`, 'success');
          renderCouponsTable();
        } catch (error: any) {
          showToast(error.message, 'error');
          renderCouponsTable(); // reset button state
        }
      });
    });
  };
  
  // ─── INITIALIZATION & EVENTS ───────────────────────────────────────────
  
  const loadData = async () => {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  
    try {
      [pricingData, couponsData] = await Promise.all([
        getProductPricing(),
        getCouponCodes()
      ]);
      renderPricingTable();
      renderCouponsTable();
    } catch (error: any) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
  
    // Refresh Button
    document.getElementById('refresh-btn')?.addEventListener('click', loadData);
  
    // Toggle Add Coupon Form
    const toggleAddFormBtn = document.getElementById('toggle-add-coupon-btn');
    const addCouponForm = document.getElementById('add-coupon-form');
    
    toggleAddFormBtn?.addEventListener('click', () => {
      const isHidden = addCouponForm?.classList.contains('hidden');
      if (isHidden) {
        addCouponForm?.classList.remove('hidden');
        toggleAddFormBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Cancel';
        toggleAddFormBtn.classList.replace('bg-[#1E1B4B]', 'bg-gray-500');
        toggleAddFormBtn.classList.replace('hover:bg-[#2B1B61]', 'hover:bg-gray-600');
      } else {
        addCouponForm?.classList.add('hidden');
        toggleAddFormBtn.innerHTML = '<i class="fas fa-plus"></i> Add New Coupon';
        toggleAddFormBtn.classList.replace('bg-gray-500', 'bg-[#1E1B4B]');
        toggleAddFormBtn.classList.replace('hover:bg-gray-600', 'hover:bg-[#2B1B61]');
      }
    });
  
    // Checkbox UI label update
    const activeCheckbox = document.getElementById('coupon-active') as HTMLInputElement;
    const activeText = document.getElementById('coupon-active-text');
    activeCheckbox?.addEventListener('change', (e) => {
      if (!activeText) return;
      if ((e.target as HTMLInputElement).checked) {
        activeText.textContent = 'Yes';
        activeText.className = 'text-sm font-bold text-green-600';
      } else {
        activeText.textContent = 'No';
        activeText.className = 'text-sm font-bold text-gray-400';
      }
    });
  
    // Handle form submit
    addCouponForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const codeInput = document.getElementById('coupon-code') as HTMLInputElement;
      const discountInput = document.getElementById('coupon-discount') as HTMLInputElement;
      const productInput = document.getElementById('coupon-product') as HTMLSelectElement;
      const variantInput = document.getElementById('coupon-variant') as HTMLSelectElement;
      const submitBtn = document.getElementById('submit-coupon-btn') as HTMLButtonElement;
  
      if (!codeInput.value.trim() || !discountInput.value) {
        showToast('Please fill all required fields', 'error');
        return;
      }
  
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
      submitBtn.disabled = true;
  
      try {
        const newCoupon = await createCouponCode({
          code: codeInput.value.trim().toUpperCase(),
          discount_amount: Number(discountInput.value),
          applicable_product_id: productInput.value,
          applicable_variant_key: variantInput.value || null,
          is_active: activeCheckbox.checked
        });
  
        couponsData.unshift(newCoupon);
        renderCouponsTable();
        showToast(`Coupon ${newCoupon.code} created successfully`, 'success');
        
        // Reset form
        codeInput.value = '';
        discountInput.value = '';
        toggleAddFormBtn?.click(); // hide form
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Coupon';
        submitBtn.disabled = false;
      }
    });
  });

  // ─── AUTH ─────────────────────────────────────────────────────────────
  
  const showLoginScreen = () => {
    document.getElementById('login-screen')!.classList.remove('hidden');
    document.getElementById('admin-dashboard')!.classList.add('hidden');
  };
  
  const showDashboard = () => {
    document.getElementById('login-screen')!.classList.add('hidden');
    document.getElementById('admin-dashboard')!.classList.remove('hidden');
    loadData();
  };
  
  // Check session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  });
  
  // Listen for auth changes (e.g. session expiry)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  });
  
  // Handle login form
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    const loginError = document.getElementById('login-error') as HTMLParagraphElement;
    const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
  
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('login-password') as HTMLInputElement).value;
  
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      loginBtn.disabled = true;
      loginError.classList.add('hidden');
  
      const { error } = await supabase.auth.signInWithPassword({ email, password });
  
      if (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        loginBtn.disabled = false;
      }
      // On success, onAuthStateChange fires and calls showDashboard()
    });
  
    logoutBtn?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      // onAuthStateChange fires and calls showLoginScreen()
    });
  });
