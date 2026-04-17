import './style.css'

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

// Razorpay Integration Logic
(window as any).openRazorpay = function (program: 'kids' | 'pro') {
  const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID"; // REPLACEME: Get this from dashboard.razorpay.com

  if (RAZORPAY_KEY === "YOUR_RAZORPAY_KEY_ID") {
    alert("Please set your real Razorpay Key ID in src/main.ts to enable payments.\nYou can get one from the Razorpay Dashboard (Test Mode).");
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: program === 'kids' ? 500000 : 800000, // as specified in requirements
    currency: "INR",
    name: "AI Mastery Workshop",
    description: program === 'kids'
      ? "AI Explorers Academy — 4-Week Program"
      : "AI Mastery Bootcamp — 2-Day Workshop",
    image: "/logo.png", // placeholder as requested
    handler: function (response: any) {
      console.log("Payment Success:", response.razorpay_payment_id);
      window.location.href = "/thank-you?payment_id=" + response.razorpay_payment_id;
    },
    prefill: { name: "", email: "", contact: "" },
    modal: { ondismiss: function () { console.log("Payment closed"); } },
    theme: { color: program === 'kids' ? "#FF8C00" : "#3D2C8D" }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
};

// Removed manual smooth scroll JS in favor of native CSS scroll-behavior and scroll-padding-top
