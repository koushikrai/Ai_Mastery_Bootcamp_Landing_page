import './style.css'
import { getProductPricing, validateCouponCode } from './lib/pricing-api'
import type { ProductPricing } from './lib/pricing-api'

// ─── STATE ─────────────────────────────────────────────────────────────
let currentPricing: Record<string, ProductPricing> = {};
let activeCouponDiscount: number = 0;

// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuButton = document.getElementById('close-menu');

mobileMenuButton?.addEventListener('click', () => mobileMenu?.classList.remove('hidden'));
closeMenuButton?.addEventListener('click', () => mobileMenu?.classList.add('hidden'));

// Close mobile menu on link click
mobileMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu?.classList.add('hidden'));
});

// Accordion Functionality
const setupAccordions = () => {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling as HTMLElement;
      const icon = header.querySelector('i');

      // Toggle current
      const isHidden = content.classList.contains('hidden');

      if (isHidden) {
        content.classList.remove('hidden');
        icon?.classList.remove('fa-chevron-down', 'fa-plus');
        icon?.classList.add('fa-chevron-up', 'fa-minus');
      } else {
        content.classList.add('hidden');
        icon?.classList.remove('fa-chevron-up', 'fa-minus');
        icon?.classList.add('fa-chevron-down', 'fa-plus');
      }
    });
  });
};

setupAccordions();

// Scroll-Triggered Animations (Fade In)
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Number Counter Animation
const countElements = document.querySelectorAll('[data-count]');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target as HTMLElement;
      const targetValue = parseInt(el.getAttribute('data-count') || '0');
      let current = 0;
      const duration = 2000;
      const frames = 60;
      const stepValue = targetValue / frames;
      const interval = duration / frames;

      const updateCount = () => {
        current += stepValue;
        if (current < targetValue) {
          el.innerText = Math.floor(current).toString();
          setTimeout(updateCount, interval);
        } else {
          el.innerText = targetValue.toString();
        }
      };

      updateCount();
      countObserver.unobserve(el);
    }
  });
}, observerOptions);

countElements.forEach(el => countObserver.observe(el));

// ─── PRICING LOGIC ─────────────────────────────────────────────────────

const initPricing = async () => {
  try {
    const pricing = await getProductPricing();
    
    // Store in a map for easy lookup by product_id
    pricing.forEach(p => {
      if (!currentPricing[p.product_id]) {
        currentPricing[p.product_id] = p;
      }
    });

    // Update DOM if elements exist
    const originalPriceEl = document.getElementById('display-original-price');
    const currentPriceEl = document.getElementById('display-current-price');
    const discountBadgeEl = document.getElementById('display-discount-badge');
    const couponContainer = document.getElementById('coupon-container');

    const proPricing = currentPricing['pro'];
    if (proPricing) {
      if (currentPriceEl) currentPriceEl.textContent = proPricing.price.toLocaleString();
      
      if (originalPriceEl && proPricing.original_price > proPricing.price) {
        originalPriceEl.textContent = `₹${proPricing.original_price.toLocaleString()}`;
        originalPriceEl.classList.remove('hidden');
        
        if (discountBadgeEl) {
          const discountPercent = Math.round(((proPricing.original_price - proPricing.price) / proPricing.original_price) * 100);
          discountBadgeEl.textContent = `SAVE ${discountPercent}%`;
          discountBadgeEl.classList.remove('hidden');
        }
      }

      if (couponContainer && proPricing.coupon_enabled) {
        couponContainer.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error("Failed to load pricing", error);
  }
};

const setupCouponHandling = () => {
  const applyBtn = document.getElementById('apply-promo-btn') as HTMLButtonElement;
  const input = document.getElementById('promo-code-input') as HTMLInputElement;
  const message = document.getElementById('promo-message');
  const btnFinalPrice = document.getElementById('btn-final-price');

  if (!applyBtn || !input || !message) return;

  applyBtn.addEventListener('click', async () => {
    const code = input.value.trim();
    if (!code) return;

    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    applyBtn.disabled = true;

    try {
      const result = await validateCouponCode(code, 'pro', '');
      
      message.classList.remove('hidden', 'text-red-500', 'text-green-600');

      if (result) {
        activeCouponDiscount = result.discount;
        message.textContent = result.message;
        message.classList.add('text-green-600');
        input.classList.add('border-green-500', 'bg-green-50');
        
        // Update final price on the button
        const basePrice = currentPricing['pro']?.price || 5000;
        const finalPrice = Math.max(0, basePrice - activeCouponDiscount);
        if (btnFinalPrice) {
          btnFinalPrice.innerHTML = `| ₹${finalPrice.toLocaleString()}`;
        }
      } else {
        activeCouponDiscount = 0;
        message.textContent = 'Invalid or expired promo code.';
        message.classList.add('text-red-500');
        input.classList.remove('border-green-500', 'bg-green-50');
        if (btnFinalPrice) btnFinalPrice.innerHTML = '';
      }
    } catch (error) {
      console.error(error);
      message.textContent = 'Error validating code.';
      message.classList.remove('hidden');
      message.classList.add('text-red-500');
    } finally {
      applyBtn.innerHTML = 'Apply';
      applyBtn.disabled = false;
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initPricing();
  setupCouponHandling();
});

// Razorpay Integration Logic
(window as any).openRazorpay = function (program: 'kids' | 'pro', prefillData?: any) {
  const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

  // Get base price from Supabase data if available, otherwise fallback
  const fallbackPrice = program === 'kids' ? 5000 : 8000;
  const basePrice = currentPricing[program]?.price || fallbackPrice;
  
  const seats = prefillData?.seats || 1;
  
  // Calculate final amount per seat with discount
  const pricePerSeat = Math.max(0, basePrice - activeCouponDiscount);
  
  // Amount to charge in paise (multiply by 100)
  const amountToCharge = (pricePerSeat * seats) * 100;

  const options = {
    key: RAZORPAY_KEY,
    amount: amountToCharge,
    currency: "INR",
    name: "AI Mastery Workshop",
    description: program === 'kids'
      ? "AI Rangers — 4-Week Program"
      : `AI Mastery Bootcamp — 2-Day Workshop (${seats} Seat${seats > 1 ? 's' : ''})`,
    image: "/logo.png", // placeholder as requested
    handler: function (response: any) {
      console.log("Payment Success:", response.razorpay_payment_id);
      window.location.href = "/thank-you?payment_id=" + response.razorpay_payment_id;
    },
    prefill: { 
      name: prefillData?.name || "", 
      email: prefillData?.email || "", 
      contact: prefillData?.contact || "" 
    },
    modal: { ondismiss: function () { console.log("Payment closed"); } },
    theme: { color: program === 'kids' ? "#FF8C00" : "#3D2C8D" }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
};

// Removed manual smooth scroll JS in favor of native CSS scroll-behavior and scroll-padding-top
