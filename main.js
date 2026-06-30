// 📌 [1. IMPORTS]
import { packages } from './packages.js';
import { vaccines } from './vaccines.js';
import { insights } from './insights.js';

// 📌 [2. CONFIGURATION & CONSTANTS]
const APPOINTMENT_WEBHOOK_URL = "https://hook.eu1.make.com/ebfhf5m9d1mpqmgwkm5wa4b6i1rbtv4i"; 
const REFILL_WEBHOOK_URL = "https://hook.eu1.make.com/1iy7ku6xsxo4p49irh4wo6p3yop2y9us"; 

// 📌 [3. GLOBAL STATES]
let currentFilters = { gender: null, ageGroup: null, hasDiabetes: null }; 
let activeHighlightId = "METABOLIC-FU45"; 
let selectedVaccineIds = []; 
let currentInsightIndex = 0; // เริ่มต้นที่บทความใบแรกสุด (ใบที่ 0)


// 🪄 ฟังก์ชันคำนวณสถานะคลินิกแบบเรียลไทม์ (ล็อกโซนเวลาประเทศไทย 100%)
function initRealtimeStatus() {
    const statusElement = document.getElementById('realtime-status');
    if (!statusElement) return;

    // 👑 ดึงเวลาปัจจุบันโดยบังคับเซ็ตเป็นเขตเวลาประเทศไทย (Asia/Bangkok) เสมอ เพื่อรองรับคนไข้จากทั่วโลก
    const thailandTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const day = thailandTime.getDay();     // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
    const hour = thailandTime.getHours();
    const minute = thailandTime.getMinutes();
    
    // แปลงค่าชั่วโมงและนาทีให้เป็น "นาทีรวมของวัน" เพื่อให้คำนวณช่วงข้ามเวลาได้เสถียรที่สุด
    const currentMinutes = (hour * 60) + minute;
    let isOpen = false;

    // ⏱️ เงื่อนไขที่ 1: วันจันทร์ - วันศุกร์ (เปิด 08:00 - 18:00) -> 480 นาที ถึง 1080 นาที
    if (day >= 1 && day <= 5) {
    if (currentMinutes >= 480 && currentMinutes < 1080) {
        isOpen = true;
    }
    }
    // ⏱️ เงื่อนไขที่ 2: วันเสาร์ (เปิด 08:00 - 12:00) -> 480 นาที ถึง 720 นาที
    else if (day === 6) {
    if (currentMinutes >= 480 && currentMinutes < 720) {
        isOpen = true;
    }
    }
    // วันอาทิตย์ (day === 0) ระบบจะข้ามไปเป็นตาราง Closed โดยอัตโนมัติ

    // 🎨 แสดงผลหน้าต่าง UI ตามสถานะจริง
    if (isOpen) {
    statusElement.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
        <span class="text-emerald-600 font-extrabold">Open Now</span>
    `;
    } else {
    statusElement.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-rose-500"></span> 
        <span class="text-slate-400 font-bold">Closed Now</span>
    `;
    }
}

// ========================================================================
// ⭐ SAFE SYSTEM INITIALIZER
// ========================================================================
function startClinicSystem() {
    if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    }

    initTabs();
    setupFilters();
    initHighlightMetaTabs();
    evaluateAndRender();
    initFormSubmissions();
    renderVaccines();
    renderInsights();
    initInsightNavigation(); 
    initVaccineReset();
    initDeliveryToggle();
    initNotificationClose();
    lockPastDates();
    initPromoNavigation();
    initRealtimeStatus();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startClinicSystem);
} else {
    startClinicSystem();
}

// ========================================================================
// 📑 CATEGORY A: MEDICATION REFILL ROWS CONTROLLER
// ========================================================================
const container = document.getElementById("medication-rows-container");
const addBtn = document.getElementById("add-row-btn");

if (addBtn && container) {
    const updateRemoveButtons = () => {
    const rows = container.querySelectorAll(".medication-row");
    rows.forEach(row => {
        const btn = row.querySelector(".remove-row-btn");
        if (btn) btn.disabled = (rows.length <= 1);
    });
    };

    addBtn.addEventListener("click", () => {
    const firstRow = container.querySelector(".medication-row");
    const newRow = firstRow.cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    container.appendChild(newRow);

    newRow.querySelector(".remove-row-btn").addEventListener("click", () => {
        newRow.remove();
        updateRemoveButtons();
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateRemoveButtons();
    });

    container.querySelector(".remove-row-btn").addEventListener("click", (e) => {
    e.currentTarget.closest(".medication-row").remove();
    updateRemoveButtons();
    });
}

// ========================================================================
// 📑 CATEGORY B: BACKEND SUBMISSIONS
// ========================================================================
function initFormSubmissions() {
    const apptForm = document.getElementById("appointment-form");
    const refillForm = document.getElementById("refill-form");

    if (apptForm) {
    apptForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = {
        formType: "APPOINTMENT",
        firstName: document.getElementById("appt-firstname").value,
        middleName: document.getElementById("appt-middlename").value,
        lastName: document.getElementById("appt-lastname").value,
        email: document.getElementById("appt-email").value,
        phone: document.getElementById("appt-phone").value,
        preferredDate: document.getElementById("appt-date").value,
        preferredTime: document.getElementById("appt-time").value,
        gender: document.getElementById("appt-gender").value,
        dateOfBirth: document.getElementById("appt-dob").value,
        returningPatient: document.getElementById("appt-returning").value,
        programId: document.getElementById("appt-program").value,
        clinicalNotes: document.getElementById("appt-message").value,
        selectedVaccines: vaccines
            .filter(v => selectedVaccineIds.includes(v.id))
            .map(v => v.name)
            .join(', ')
        };
        await sendToBackend(APPOINTMENT_WEBHOOK_URL, formData, apptForm);
    });
    }

    if (refillForm) {
    refillForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const rowElements = document.querySelectorAll(".medication-row");
        let formattedMedsText = "Medication Refill List:\n";

        rowElements.forEach((row, index) => {
        const name = row.querySelector(".med-name").value.trim();
        const dosage = row.querySelector(".med-dosage").value.trim();
        const qty = row.querySelector(".med-qty").value.trim();
        if (name) {
            formattedMedsText += `${index + 1}. Medicine: ${name} | Dosage: ${dosage} | Qty: ${qty}\n`;
        }
        });

        const formData = {
        formType: "REFILL",
        firstName: document.getElementById("refill-firstname").value,
        middleName: document.getElementById("refill-middlename").value,
        lastName: document.getElementById("refill-lastname").value,
        email: document.getElementById("refill-email").value,
        phone: document.getElementById("refill-phone").value,
        returningPatient: document.getElementById("refill-returning").value,
        receiptOption: document.getElementById("refill-delivery").value,
        deliveryAddress: document.getElementById("refill-address").value.trim(),
        medicationDetails: formattedMedsText
        };
        await sendToBackend(REFILL_WEBHOOK_URL, formData, refillForm);
    });
    }
}

async function sendToBackend(url, data, formElement) {
    const submitBtn = formElement.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="animate-pulse">Processing...</span>`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        showNotification("Submission Successful!", "We have received your request. Please check your email.");
        formElement.reset();
        selectedVaccineIds = [];
        renderVaccines();
        updateClinicalNotesWithVaccines();
    } else {
        throw new Error("Server response error");
    }
    } catch (error) {
    console.error("Backend Connection Error:", error);
    showNotification("Submission Error", "Something went wrong. Please contact the clinic directly.");
    } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    }
}

// ========================================================================
// 💉 CATEGORY C: HEALTH CHECK-UP PACKAGES & FILTERS
// ========================================================================
function initTabs() {
    const tabAppt = document.getElementById("tab-appt");
    const tabRefill = document.getElementById("tab-refill");
    const sectAppt = document.getElementById("section-appt");
    const sectRefill = document.getElementById("section-refill");

    function switchToAppointment() {
    tabAppt.className = "px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all bg-navy text-white shadow-md";
    tabRefill.className = "px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all bg-white text-navy border border-navy hover:bg-slate-50";
    sectAppt.classList.remove("hidden");
    sectRefill.classList.add("hidden");
    }

    function switchToRefill() {
    tabRefill.className = "px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all bg-navy text-white shadow-md";
    tabAppt.className = "px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all bg-white text-navy border border-navy hover:bg-slate-50";
    sectRefill.classList.remove("hidden");
    sectAppt.classList.add("hidden");
    }

    if (tabAppt && tabRefill && sectAppt && sectRefill) {
    tabAppt.addEventListener("click", switchToAppointment);
    tabRefill.addEventListener("click", switchToRefill);
    }

    const crossTriggers = [
    { id: "nav-btn-appt", action: switchToAppointment },
    { id: "nav-btn-refill", action: switchToRefill },
    { id: "drawer-btn-appt", action: switchToAppointment },
    { id: "drawer-btn-refill", action: switchToRefill },
    { id: "hero-book-btn", action: switchToAppointment },
    { id: "vaccine-sched-btn", action: switchToAppointment }
    ];
    crossTriggers.forEach(t => {
    const elem = document.getElementById(t.id);
    if (elem) elem.addEventListener("click", t.action);
    });
}

function initHighlightMetaTabs() {
    const tabs = document.querySelectorAll('[data-highlight-tab]');
    tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => {
        t.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-transparent text-navy hover:bg-slate-50";
        });
        tab.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-navy text-white shadow-sm";
        activeHighlightId = tab.getAttribute('data-highlight-tab');
        renderHighlightCard();
    });
    });

    renderHighlightCard();
    const bookBtn = document.getElementById("book-metabolic-btn");
    if (bookBtn) {
    bookBtn.addEventListener("click", () => {
        selectPackageInForm(activeHighlightId);
        scrollToSection("booking-section-anchor");
    });
    }
}

function renderHighlightCard() {
    const metaPackage = packages.find(p => p.id === activeHighlightId);
    if (!metaPackage) return;

    const titleElem = document.getElementById("hl-package-title");
    const descElem = document.getElementById("hl-package-desc");
    const priceElem = document.getElementById("hl-package-price");
    const itemsContainer = document.getElementById("hl-package-items");

    if (titleElem) titleElem.innerText = metaPackage.name;
    if (descElem) descElem.innerText = metaPackage.suitableFor;
    if (priceElem) priceElem.innerText = Number(metaPackage.price).toLocaleString('en-US');
    if (itemsContainer) {
    itemsContainer.innerHTML = metaPackage.items.map(item => `
        <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
        <span class="text-navy font-bold mt-0.5">•</span>
        <span>${item}</span>
        </li>
    `).join("");
    }
}

function setupFilters() {
    const activeFilters = currentFilters;
    const filterGroups = {
    gender: document.querySelectorAll('[data-filter-gender]'),
    age: document.querySelectorAll('[data-filter-age]'),
    diabetes: document.querySelectorAll('[data-filter-diabetes]')
    };

    function highlightActiveButton(buttons, activeButton) {
    buttons.forEach(btn => {
        if (btn === activeButton) {
        btn.classList.remove('border-navy', 'text-navy', 'bg-transparent', 'hover:bg-iceblue-light');
        btn.classList.add('bg-navy', 'text-white', 'border-navy');
        } else {
        btn.classList.remove('bg-navy', 'text-white');
        btn.classList.add('border-navy', 'text-navy', 'bg-transparent', 'hover:bg-iceblue-light');
        }
    });
    }

    filterGroups.gender.forEach(btn => {
    btn.addEventListener('click', () => {
        activeFilters.gender = btn.getAttribute('data-filter-gender');
        highlightActiveButton(filterGroups.gender, btn);
        evaluateAndRender();
    });
    });

    filterGroups.age.forEach(btn => {
    btn.addEventListener('click', () => {
        activeFilters.ageGroup = btn.getAttribute('data-filter-age');
        highlightActiveButton(filterGroups.age, btn);
        evaluateAndRender();
    });
    });

    filterGroups.diabetes.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-filter-diabetes');
        activeFilters.hasDiabetes = (val === 'yes');
        highlightActiveButton(filterGroups.diabetes, btn);
        evaluateAndRender();
    });
    });

    const resetButton = document.getElementById("reset-filters");
    if (resetButton) {
    resetButton.addEventListener("click", () => {
        Object.values(filterGroups).forEach(buttons => {
        buttons.forEach(btn => {
            btn.classList.remove('bg-navy', 'text-white');
            btn.classList.add('border-navy', 'text-navy', 'bg-transparent', 'hover:bg-iceblue-light');
        });
        });
        activeFilters.gender = null;
        activeFilters.ageGroup = null;
        activeFilters.hasDiabetes = null;
        evaluateAndRender();
    });
    }
}

function evaluateAndRender() {
    const resultsContainer = document.getElementById("filter-results");
    if (!resultsContainer) return;

    if (!currentFilters.gender || !currentFilters.ageGroup || currentFilters.hasDiabetes === null) {
    resultsContainer.className = "grid grid-cols-1 w-full";
    resultsContainer.innerHTML = `
        <div class="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl text-navy-slate w-full">
        <p class="text-sm font-medium">Please select your Gender, Age Group, and Diabetic Status above to load matching clinical screening programs.</p>
        </div>
    `;
    return;
    }

    const filtered = packages.filter(pkg => {
    const matchGender = (pkg.filters.gender === 'all' || pkg.filters.gender === currentFilters.gender);
    const matchAge = (pkg.filters.ageGroup === 'all' || pkg.filters.ageGroup === currentFilters.ageGroup);
    const matchDM = (pkg.filters.hasDiabetes === currentFilters.hasDiabetes);
    return matchGender && matchAge && matchDM;
    });

    if (filtered.length === 0) {
    resultsContainer.className = "grid grid-cols-1 w-full";
    resultsContainer.innerHTML = `
        <div class="text-center py-12 px-6 border border-slate-200 rounded-2xl bg-white text-navy-slate w-full">
        <p class="text-sm font-semibold mb-1">No custom packages found for this exact biological selection.</p>
        <p class="text-xs text-slate-400">Please check alternative choices or contact our medical coordinator.</p>
        </div>
    `;
    return;
    }

    resultsContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-6 w-full";
    renderPackages(filtered, resultsContainer);
}

function renderPackages(list, container) {
    container.innerHTML = "";
    list.forEach(pkg => {
    const card = document.createElement("div");
    card.className = `bg-white rounded-2xl shadow-sm border ${pkg.isHighlight ? 'border-2 border-navy ring-4 ring-iceblue/30' : 'border-slate-200'} p-6 transition-transform duration-200 hover:-translate-y-1 flex flex-col justify-between`;

    const priceFormatted = Number(pkg.price).toLocaleString('en-US');
    const listItemsHtml = pkg.items.map(item => `
        <li class="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
        <span class="text-navy font-bold mt-0.5">•</span>
        <span>${item}</span>
        </li>
    `).join("");

    card.innerHTML = `
        <div>
        ${pkg.isHighlight ? '<span class="inline-block bg-navy text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded mb-3 tracking-widest">Recommended Profile</span>' : ''}
        <h3 class="text-base font-bold text-navy mb-1.5">${pkg.name}</h3>
        <p class="text-xs text-slate-400 mb-4 italic">${pkg.suitableFor}</p>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
            <div class="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Included Bio-Markers & Screenings</div>
            <ul class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            ${listItemsHtml}
            </ul>
        </div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
            <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bespoke Rate</div>
            <div class="text-xl font-black text-navy">${priceFormatted} <span class="text-xs font-normal text-slate-500">THB</span></div>
        </div>
        <button type="button" data-book-id="${pkg.id}" class="bg-navy hover:bg-navy/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
            Book Package
        </button>
        </div>
    `;
    card.querySelector(`[data-book-id="${pkg.id}"]`).addEventListener("click", () => {
        selectPackageInForm(pkg.id);
        scrollToSection("booking-section-anchor");
    });
    container.appendChild(card);
    });
}

function selectPackageInForm(packageId) {
    const selectElem = document.getElementById("appt-program");
    if (selectElem) selectElem.value = packageId;
}

function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth" });
}

// ========================================================================
// 💉 CATEGORY D: VACCINES PANEL LOGIC
// ========================================================================
function renderVaccines() {
    const promotionsContainer = document.getElementById('promotions-container');
    const availContainer = document.getElementById('available-vaccines-container');
    if (!promotionsContainer || !availContainer) return;

    promotionsContainer.innerHTML = '';
    availContainer.innerHTML = '';

    if (!vaccines || !Array.isArray(vaccines)) return;

    promotionsContainer.className = "flex gap-5 overflow-x-auto overflow-y-hidden pb-4 pt-1 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300";
    availContainer.className = "grid grid-rows-3 grid-flow-col md:grid-rows-2 h-[560px] md:h-[370px] gap-y-4 gap-x-5 overflow-x-auto overflow-y-hidden pb-4 pt-1 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300";

    vaccines.forEach(vac => {
    const isChecked = typeof selectedVaccineIds !== 'undefined' && selectedVaccineIds.includes(vac.id);

    let cardOpacityClass = 'opacity-100';
    let pointerEventsClass = '';
    let rightBottomHTML = ''; 

    if (vac.status === 'out-of-stock') {
        cardOpacityClass = 'opacity-50 blur-[0.2px]';
        pointerEventsClass = 'pointer-events-none select-none';
        rightBottomHTML = `<span class="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-100 shrink-0 shadow-sm">Not Available</span>`;
    } else {
        const isShowPrice = vac.showPrice !== false;
        if (isShowPrice) {
        const priceVal = vac.pricePerDose ? vac.pricePerDose.toLocaleString() : '0';
        rightBottomHTML = `<span class="text-[11px] font-bold text-navy bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0 shadow-sm">${priceVal} THB</span>`;
        } else {
        rightBottomHTML = `<span class="text-[11px] font-semibold text-slate-400 italic bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shrink-0">Contact Clinic</span>`;
        }
    }

    // CASE A: PROMOTION CARD
    if (vac.isPromoCard) {
        const promoCardStyle = isChecked ? 'border-navy bg-iceblue/20 shadow-md scale-[1.01]' : 'border-slate-100 bg-white hover:bg-slate-50/80 shadow-sm';
        
        let promoPricingHTML = '';
        if (vac.status === 'out-of-stock') {
        promoPricingHTML = rightBottomHTML;
        } else {
        const prices = vac.promoPrices || [];
        const pricesHtml = prices.map(p => {
            const textStyle = p.highlight ? 'text-sm font-extrabold text-accent-red' : 'text-xs text-slate-400 font-medium';
            return `<span class="${textStyle}">${p.label}: ${p.price}</span>`;
        }).join('');
        promoPricingHTML = `<div class="flex flex-col text-right gap-0.5">${pricesHtml}</div>`;
        }

        const promoCardHtml = `
        <div data-vac-id="${vac.id}" 
            class="relative flex-shrink-0 snap-start w-[82vw] sm:w-[420px] rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all min-h-[230px] ${promoCardStyle} ${cardOpacityClass} ${pointerEventsClass}">
            <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded bg-accent-red/10 text-accent-red text-[10px] font-bold uppercase tracking-wider">${vac.promoLabel || 'Special Offer'}</span>
                <input type="checkbox" ${isChecked ? 'checked' : ''} ${vac.status === 'out-of-stock' ? 'class="hidden"' : 'class="pointer-events-none accent-navy w-4 h-4"'}>
            </div>
            <h4 class="font-extrabold text-base text-navy whitespace-normal break-words">${vac.name}</h4>
            <p class="text-xs text-navy-slate leading-relaxed">${vac.description}</p>
            </div>
            <div class="flex items-end justify-between mt-6 pt-4 border-t border-slate-50">
            <span class="text-xs text-navy-slate font-semibold self-end mb-0.5">Pricing Options:</span>
            ${promoPricingHTML}
            </div>
        </div>
        `;
        promotionsContainer.insertAdjacentHTML('beforeend', promoCardHtml);
    }

    if (vac.category === 'promo-only' || vac.isPromoCard) return;

    // CASE B: ROUTINE VACCINE CARD
    const cardStyle = isChecked ? 'border-navy bg-iceblue/20 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50/80 shadow-sm';
    const packageBadge = vac.hasPackage ? `<span class="text-[9px] font-bold text-accent-red bg-accent-red/5 px-2 py-0.5 rounded border border-accent-red/10 block text-center mt-1 w-fit truncate">${vac.packageDetails}</span>` : '';
    const catBadge = vac.category === 'travel' 
        ? '<span class="text-[9px] font-bold text-accent-red bg-accent-red/5 px-2 py-0.5 rounded border border-accent-red/10 shrink-0">Travel</span>'
        : '<span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">Routine</span>';
        
    const cardHtml = `
        <div data-vac-id="${vac.id}" 
        class="relative p-4 border rounded-2xl flex gap-3 items-start cursor-pointer transition-all flex-shrink-0 w-[82vw] sm:w-[330px] h-[165px] ${cardStyle} ${cardOpacityClass} ${pointerEventsClass}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} ${vac.status === 'out-of-stock' ? 'class="hidden"' : 'class="mt-1 pointer-events-none accent-navy shrink-0"'}>
        <div class="flex-1 flex flex-col h-full min-w-0 justify-between">
            <div>
            <div class="flex items-start justify-between gap-2 mb-1">
                <span class="font-extrabold text-xs sm:text-sm text-navy block leading-tight whitespace-normal break-words">
                ${vac.name}
                </span>
                ${catBadge}
            </div>
            <span class="text-[11px] text-navy-slate/90 block leading-normal line-clamp-2">${vac.description}</span>
            ${packageBadge}
            </div>
            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 mt-auto">
            <span class="text-[10px] font-semibold text-navy-slate bg-slate-100 px-2 py-0.5 rounded shrink-0">Protocol: ${vac.protocol}</span>
            ${rightBottomHTML}
            </div>
        </div>
        </div>
    `;
    availContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

    if (availContainer) {
    availContainer.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0) {
        e.preventDefault(); 
        availContainer.scrollLeft += e.deltaY * 1.5; 
        }
    }, { passive: false });
    }

    if (promotionsContainer) {
    promotionsContainer.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0) {
        e.preventDefault();
        promotionsContainer.scrollLeft += e.deltaY * 1.5;
        }
    }, { passive: false });
    }

    setupVaccineClickEvents();
}

function renderInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    // 1. วาดโครงสร้างการ์ดทั้ง 6 ใบแบบ Absolute ตรึงพิกเซลกึ่งกลางจอไว้ล่วงหน้า
    container.innerHTML = insights.map((item, index) => `
    <div id="insight-card-${index}" 
        class="absolute top-0 left-1/2 w-[85vw] max-w-[350px] h-[480px] rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-500 ease-out select-none ${item.cardClass}"
        style="cursor: grab;">
        <div>
        <div class="h-44 overflow-hidden bg-slate-200 relative pointer-events-none">
            <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover">
        </div>
        
        <div class="p-6 flex flex-col gap-3">
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span class="${item.categoryColorClass}">${item.categoryName}</span>
            <span class="text-slate-400 font-medium">${item.date}</span>
            </div>
            <h3 class="text-sm md:text-base font-extrabold text-navy leading-snug hover:text-navy-slate transition-colors line-clamp-2">
            <a href="javascript:void(0)" class="open-insight-link" data-id="${item.id}">${item.title}</a>
            </h3>
            <p class="text-xs text-navy-slate leading-relaxed line-clamp-3">
            ${item.excerpt}
            </p>
        </div>
        </div>
        
        <div class="px-6 pb-6 mt-auto">
        <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <button type="button" data-id="${item.id}" class="open-insight-btn text-xs font-bold uppercase tracking-wider text-navy hover:text-navy-slate flex items-center gap-1.5">
            Read Insight 
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        </div>
    </div>
    `).join('');

    // ผูกระบบเปิดหน้าต่างป๊อปอัปเมื่อคลิกอ่านข้อมูลฉบับเต็มความยาว 1 หน้า A4
    const openModal = (id) => {
    const item = insights.find(p => p.id == id);
    if (!item) return;
    document.getElementById('modal-vac-category').innerText = item.categoryName;
    document.getElementById('modal-vac-title').innerText = item.title;
    document.getElementById('modal-vac-content').innerHTML = item.fullContent;
    const modal = document.getElementById('insight-modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('.transform').classList.remove('scale-95');
    };

    container.querySelectorAll('.open-insight-btn, .open-insight-link').forEach(elem => {
    elem.addEventListener('click', () => openModal(elem.getAttribute('data-id')));
    });

    // เรียกฟังก์ชันจัดระเบียบเลเยอร์กองไพ่ทันที
    updateCardDeckLayout();
}

// 🪄 ฟังก์ชันคำนวณคณิตศาสตร์สลับชั้นกองไพ่ (เดสท็อปโชว์ 3 ใบเรียงคู่ / มือถือโชว์ 1 ใบและแง้มกองซ้อนหลัง)
function updateCardDeckLayout() {
    const isDesktop = window.innerWidth >= 1024;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    insights.forEach((item, index) => {
    const card = document.getElementById(`insight-card-${index}`);
    if (!card) return;

    if (isDesktop) {
        // 🖥️ โหมดคอมพิวเตอร์เดสท็อป: แสดงผลพร้อมกัน 3 ไอเทมเรียงขนานกันเป็นหน้ากระดาน
        if (index < currentInsightIndex) {
        // การ์ดที่เลื่อนผ่านไปแล้ว -> วิ่งสไลด์ไปซ่อนเข้า Deck กองฝั่งซ้าย
        const factor = currentInsightIndex - index;
        const shiftX = -390 - (factor * 20);
        card.style.transform = `translate(calc(-50% + ${shiftX}px), ${factor * 8}px) scale(${1 - factor * 0.05}) rotate(-${factor * 1.5}deg)`;
        card.style.zIndex = `${30 - factor}`;
        card.style.opacity = factor === 1 ? "0.7" : "0";
        card.style.pointerEvents = "none";
        } else if (index > currentInsightIndex + 2) {
        // การ์ดลำดับท้าย ๆ ที่ยังไม่ถึงคิว -> สแต็กซ้อนเตรียมพร้อมไว้ที่ Deck กองฝั่งขวา
        const factor = index - (currentInsightIndex + 2);
        const shiftX = 390 + (factor * 20);
        card.style.transform = `translate(calc(-50% + ${shiftX}px), ${factor * 8}px) scale(${1 - factor * 0.05}) rotate(${factor * 1.5}deg)`;
        card.style.zIndex = `${30 - factor}`;
        card.style.opacity = factor === 1 ? "0.7" : "0";
        card.style.pointerEvents = "none";
        } else {
        // กลุ่มการ์ดดาวเด่น 3 ใบหลักที่ต้องแสดงผลให้เห็นชัดเจนบนจอคอม
        const slot = index - currentInsightIndex; // ช่องคอลัมน์ที่ 0, 1, 2
        const shiftX = (slot - 1) * 390; // จัดระยะห่างระหว่างการ์ดใบละ 390 พิกเซลพอดีคำสั่งคุณหมอ
        card.style.transform = `translate(calc(-50% + ${shiftX}px), 0) scale(1) rotate(0deg)`;
        card.style.zIndex = "40";
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
        }
    } else if (isTablet) {
        // ธรรมดาของแท็บเล็ต: แสดงผลพร้อมกัน 2 ไอเทม
        if (index < currentInsightIndex) {
        const factor = currentInsightIndex - index;
        card.style.transform = `translate(calc(-50% - ${200 + factor * 15}px), ${factor * 6}px) scale(${1 - factor * 0.05}) rotate(-${factor}deg)`;
        card.style.zIndex = `${30 - factor}`;
        card.style.opacity = factor === 1 ? "0.6" : "0";
        card.style.pointerEvents = "none";
        } else if (index > currentInsightIndex + 1) {
        const factor = index - (currentInsightIndex + 1);
        card.style.transform = `translate(calc(-50% + ${200 + factor * 15}px), ${factor * 6}px) scale(${1 - factor * 0.05}) rotate(${factor}deg)`;
        card.style.zIndex = `${30 - factor}`;
        card.style.opacity = factor === 1 ? "0.6" : "0";
        card.style.pointerEvents = "none";
        } else {
        const slot = index - currentInsightIndex;
        const shiftX = slot === 0 ? -190 : 190;
        card.style.transform = `translate(calc(-50% + ${shiftX}px), 0) scale(1) rotate(0deg)`;
        card.style.zIndex = "40";
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
        }
    } else {
        // 📱 โหมดสมาร์ทโฟนมือถือ: แสดงผลทีละ 1 ไอเทมเด่นตรงกลางจอ และซ้อนเยื้องหลบเข้า Deck ซ้าย-ขวา
        const offset = index - currentInsightIndex;
        if (offset === 0) {
        card.style.transform = "translate(-50%, 0) scale(1) rotate(0deg)";
        card.style.zIndex = "40";
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
        } else if (offset > 0) {
        const factor = Math.min(offset, 3);
        const shiftX = factor * 22; // แง้มเหลื่อมไปฝั่งขวา
        card.style.transform = `translate(calc(-50% + ${shiftX}px), ${factor * 8}px) scale(${1 - factor * 0.06}) rotate(${factor * 1.5}deg)`;
        card.style.zIndex = `${40 - factor}`;
        card.style.opacity = factor === 1 ? "0.8" : factor === 2 ? "0.3" : "0";
        card.style.pointerEvents = "none";
        } else {
        const factor = Math.min(Math.abs(offset), 3);
        const shiftX = -factor * 22; // แง้มเหลื่อมไปฝั่งซ้าย
        card.style.transform = `translate(calc(-50% + ${shiftX}px), ${factor * 8}px) scale(${1 - factor * 0.06}) rotate(-${factor * 1.5}deg)`;
        card.style.zIndex = `${40 - factor}`;
        card.style.opacity = factor === 1 ? "0.8" : factor === 2 ? "0.3" : "0";
        card.style.pointerEvents = "none";
        }
    }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 📱 กลไกการตรวจจับคำสั่งปุ่มกด + ระบบปัดนิ้วสัมผัสซ้ายขวา (Touch Swipe) บนหน้าจอมือถือ
function initInsightNavigation() {
    const container = document.getElementById("insights-container");
    const prevBtn = document.getElementById("prev-insight-btn");
    const nextBtn = document.getElementById("next-insight-btn");
    if (!container) return;

    // ตัวดักจับความเคลื่อนไหวของนิ้วสัมผัส
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeLogic();
    }, { passive: true });

    function handleSwipeLogic() {
    const threshold = 40; // ระยะการลากนิ้วเป็นพิกเซลเพื่อสั่งเปลี่ยนแผ่นไพ่
    const isDesktop = window.innerWidth >= 1024;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const maxLimit = insights.length - (isDesktop ? 3 : isTablet ? 2 : 1);

    if (touchEndX < touchStartX - threshold) {
        // นิ้วปัดไปทางซ้าย -> เปิดไพ่ใบถัดไป (Next)
        if (currentInsightIndex < maxLimit) {
        currentInsightIndex++;
        updateCardDeckLayout();
        }
    }
    if (touchEndX > touchStartX + threshold) {
        // นิ้วปัดไปทางขวา -> ดึงไพ่ใบก่อนหน้ากลับมาโชว์ (Prev)
        if (currentInsightIndex > 0) {
        currentInsightIndex--;
        updateCardDeckLayout();
        }
    }
    }

    // ระบบสั่งงานผ่านปุ่มลูกศรควบคุม
    if (nextBtn && prevBtn) {
    nextBtn.addEventListener("click", () => {
        const isDesktop = window.innerWidth >= 1024;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        const maxLimit = insights.length - (isDesktop ? 3 : isTablet ? 2 : 1);
        if (currentInsightIndex < maxLimit) {
        currentInsightIndex++;
        updateCardDeckLayout();
        }
    });

    prevBtn.addEventListener("click", () => {
        if (currentInsightIndex > 0) {
        currentInsightIndex--;
        updateCardDeckLayout();
        }
    });
    }

    // ตรวจจับกรณีคนไข้ขยายขนาดเบราว์เซอร์หรือหมุนหน้าจอโทรศัพท์ ให้กองไพ่จัดเลเยอร์ใหม่ให้สมส่วนทันที
    window.addEventListener('resize', updateCardDeckLayout);
}

// ฟังก์ชันสำหรับกดปิดหน้าต่างบทความฉบับเต็ม
window.closeInsightModal = function() {
    const modal = document.getElementById('insight-modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.querySelector('.transform').classList.add('scale-95');
}

function setupVaccineClickEvents() {
    document.querySelectorAll('[data-vac-id]').forEach(card => {
    card.addEventListener('click', () => {
        const vacId = card.getAttribute('data-vac-id');
        toggleVaccineSelection(vacId);
    });
    });
}

function toggleVaccineSelection(id) {
    if (selectedVaccineIds.includes(id)) {
    selectedVaccineIds = selectedVaccineIds.filter(vacId => vacId !== id);
    } else {
    selectedVaccineIds.push(id);
    }
    renderVaccines();
    updateClinicalNotesWithVaccines();
}

function updateClinicalNotesWithVaccines() {
    const badgeContainer = document.getElementById('vaccine-badges-container');
    if (!badgeContainer) return;

    if (selectedVaccineIds.length === 0) {
    badgeContainer.innerHTML = `<span class="text-xs text-slate-400 self-center mx-auto italic">No vaccines selected yet. Click items above to add.</span>`;
    return;
    }

    const selectedData = vaccines.filter(v => selectedVaccineIds.includes(v.id));
    badgeContainer.innerHTML = selectedData.map(v => `
    <span class="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
        ${v.name}
        <button type="button" data-remove-id="${v.id}" class="hover:bg-white/25 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold text-[10px] transition-colors">&times;</button>
    </span>
    `).join('');

    badgeContainer.querySelectorAll('[data-remove-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeId = btn.getAttribute('data-remove-id');
        toggleVaccineSelection(removeId);
    });
    });
}

function initVaccineReset() {
    const btnReset = document.getElementById('btn-reset-vaccines');
    if (btnReset) {
    btnReset.addEventListener('click', () => {
        selectedVaccineIds = [];
        renderVaccines();
        updateClinicalNotesWithVaccines();
    });
    }
}

// ========================================================================
// 🎨 CATEGORY E: UI UTILITIES & MODALS
// ========================================================================
function initDeliveryToggle() {
    const deliverySelect = document.getElementById("refill-delivery");
    const addressBlock = document.getElementById("refill-address-block");
    const addressInput = document.getElementById("refill-address");
    if (deliverySelect && addressBlock && addressInput) {
    deliverySelect.addEventListener("change", function() {
        if (this.value === "delivery") {
        addressBlock.classList.remove("hidden");
        addressInput.required = true;
        } else {
        addressBlock.classList.add("hidden");
        addressInput.required = false;
        addressInput.value = "";
        }
    });
    }
}

function lockPastDates() {
    const dateInput = document.getElementById('appt-date');
    if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today; 
    }
}

function showNotification(title, message) {
    const notif = document.getElementById("success-notification");
    const titleElem = document.getElementById("notif-title");
    const msgElem = document.getElementById("notif-message");
    const modalContent = notif ? notif.querySelector('.transform') : null;

    if (notif && titleElem && msgElem) {
    titleElem.innerText = title;
    msgElem.innerText = message;
    notif.classList.remove("opacity-0", "pointer-events-none");
    notif.classList.add("opacity-100", "pointer-events-auto");
    if (modalContent) {
        modalContent.classList.remove("scale-95");
        modalContent.classList.add("scale-100");
    }
    }
}

function initNotificationClose() {
    const closeBtn = document.getElementById("close-notif-btn");
    const notification = document.getElementById("success-notification");
    const modalContent = notification ? notification.querySelector('.transform') : null;

    if (closeBtn && notification) {
    closeBtn.addEventListener("click", () => {
        notification.classList.add("opacity-0", "pointer-events-none");
        notification.classList.remove("opacity-100", "pointer-events-auto");
        if (modalContent) {
        modalContent.classList.add("scale-95");
        modalContent.classList.remove("scale-100");
        }
    });
    }
}

function initPromoNavigation() {
    const container = document.getElementById("promotions-container");
    const prevBtn = document.getElementById("prev-promo-btn");
    const nextBtn = document.getElementById("next-promo-btn");

    if (container && prevBtn && nextBtn) {
    const scrollAmount = 444; 
    nextBtn.addEventListener("click", () => { container.scrollLeft += scrollAmount; });
    prevBtn.addEventListener("click", () => { container.scrollLeft -= scrollAmount; });
    }
}

// Dynamic Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (!header) return;

    if (window.scrollY > 20) {
    header.classList.add('bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'border-slate-100');
    header.classList.remove('bg-transparent', 'border-transparent');
    } else {
    header.classList.remove('bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'border-slate-100');
    header.classList.add('bg-transparent', 'border-transparent');
    }
});

// Realtime Clinic Hours Status Tracker
function updateClinicRealtimeStatus() {
    const statusContainer = document.getElementById('realtime-status');
    if (!statusContainer) return;

    const now = new Date();
    const day = now.getDay();      
    const hour = now.getHours();   

    const isWorkingDay = day >= 1 && day <= 6;
    const isWorkingHour = hour >= 9 && hour < 20;

    if (isWorkingDay && isWorkingHour) {
    statusContainer.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
        Open Now <span class="text-slate-400 font-normal text-[11px] ml-0.5">(Accepting Patients)</span>
    `;
    } else {
    statusContainer.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500"></span> 
        Closed <span class="text-slate-400 font-normal text-[11px] ml-0.5">(Appointments Only)</span>
    `;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    updateClinicRealtimeStatus();
    setInterval(updateClinicRealtimeStatus, 30000);
});