// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = mobileMenu.querySelectorAll('a');

function openMenu() {
  mobileMenu.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  mobileMenu.classList.add('hidden');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openMenu);
closeBtn.addEventListener('click', closeMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

function checkReveal() {
  const triggerBottom = window.innerHeight * 0.88;
  revealElements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < triggerBottom) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', checkReveal);
window.addEventListener('load', checkReveal);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Active nav link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('text-amber-400');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('text-amber-400');
    }
  });
});

// Menu Tab Filtering
const menuTabs = document.querySelectorAll('.menu-tab');
const menuCards = document.querySelectorAll('#menu-grid .menu-card');

menuTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    menuTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const category = tab.dataset.category;
    menuCards.forEach(card => {
      if (category === 'all' || card.dataset.category === category) {
        card.classList.remove('hidden-card');
      } else {
        card.classList.add('hidden-card');
      }
    });
  });
});

// Reservation Form
const resForm = document.getElementById('reservation-form');
if (resForm) {
  // Initialize Flatpickr for date input
  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    flatpickr(dateInput, {
      minDate: "today",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      disableMobile: "true",
      onReady: function(selectedDates, dateStr, instance) {
        // Create custom year dropdown
        const yearSelect = document.createElement('select');
        yearSelect.className = 'flatpickr-monthDropdown-months custom-year-select';
        yearSelect.style.marginLeft = '8px';
        
        const currentYear = new Date().getFullYear();
        for (let i = 0; i <= 5; i++) {
          const option = document.createElement('option');
          option.value = currentYear + i;
          option.text = currentYear + i;
          option.className = 'flatpickr-monthDropdown-month';
          if (i === 0) option.selected = true;
          yearSelect.appendChild(option);
        }
        
        yearSelect.addEventListener('change', function(e) {
          instance.changeYear(Number(e.target.value));
        });
        
        // Sync dropdown when year changes (e.g., via prev/next arrows)
        instance.config.onYearChange = [function() {
          yearSelect.value = instance.currentYear;
        }];
        
        // Insert after month dropdown
        const monthDropdown = instance.monthsDropdownContainer;
        if (monthDropdown) {
          monthDropdown.parentNode.insertBefore(yearSelect, monthDropdown.nextSibling);
        }
      }
    });
  }

  // Initialize Choices.js for select inputs
  const guestsSelect = document.getElementById('res-guests');
  if (guestsSelect) {
    new Choices(guestsSelect, {
      searchEnabled: false,
      itemSelectText: '',
      shouldSort: false
    });
  }

  const timeSelect = document.getElementById('res-time');
  if (timeSelect) {
    new Choices(timeSelect, {
      searchEnabled: false,
      itemSelectText: '',
      shouldSort: false
    });
  }

  resForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = resForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    // Collect form data
    const reservation = {
      name: document.getElementById('res-name').value,
      email: document.getElementById('res-email').value,
      phone: document.getElementById('res-phone').value,
      guests: document.getElementById('res-guests').value,
      date: document.getElementById('res-date').value,
      time: document.getElementById('res-time').value,
      notes: document.getElementById('res-notes').value
    };

    // Show loading state
    btn.textContent = 'Sending...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
      });

      const data = await response.json();

      if (data.success) {
        // Success state
        btn.textContent = '✓ Reservation Confirmed!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        btn.style.boxShadow = '0 4px 20px rgba(34,197,94,0.3)';
        btn.style.opacity = '1';
        resForm.reset();

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.boxShadow = '';
          btn.disabled = false;
        }, 4000);
      } else {
        // Validation error
        const errorMsg = data.errors ? data.errors.join(' ') : 'Something went wrong.';
        btn.textContent = '✕ ' + errorMsg;
        btn.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
        btn.style.boxShadow = '0 4px 15px rgba(239,68,68,0.3)';
        btn.style.opacity = '1';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.boxShadow = '';
          btn.disabled = false;
        }, 4000);
      }
    } catch (err) {
      // Network error â€” server not running
      btn.textContent = '✕ Server not reachable';
      btn.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
      btn.style.opacity = '1';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.boxShadow = '';
        btn.disabled = false;
      }, 3000);
    }
  });
}
