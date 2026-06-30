/**
 * HCMC Clinic - Vaccines Database (vaccines.js)
 */
export const vaccines = [
  // === GROUP 1: Core & Travel Vaccines ===
  {
    id: "vac-twinrix",
    name: "Twinrix (Hepatitis A&B combination)",
    category: "travel",
    pricePerDose: 1500,
    status: "available",
    showPrice: false,
    protocol: "3 Doses",
    description: "Combined active protection against major liver infections.",
    isPromoCard: true,
    hasPackage: true,
    packageDetails: "Combined Price: 1,500 THB Net",
    promoPrices: [
      { label: "Combined Price", price: "1,500 THB Net", highlight: true }
    ]
  },
  {
    id: "vac-imojev",
    name: "Imojev (Japanese encephalitis)",
    category: "travel",
    pricePerDose: 960,
    status: "available",
    showPrice: false,
    protocol: "Single Shot",
    description: "Protects against mosquito-borne brain inflammation in tropical regions."
  },
  {
    id: "vac-qdenga",
    name: "Qdenga (Dengue fever)",
    category: "travel",
    pricePerDose: 2400,
    status: "available",
    showPrice: false,
    protocol: "2 Doses",
    description: "Prevents severe dengue virus strains. Recommended for tropical residents.",
    hasPackage: true,
    packageDetails: "Package of 2 Doses: 4,500 THB",
    isPromoCard: true, 
    promoLabel: "Dengue Prevention Program",
    // 💡 แยกรายละเอียดราคาทุกแบบเพื่อนำไปโชว์ฝั่งขวาให้ครบถ้วน
    promoPrices: [
      { label: "Single Dose", price: "2,400 THB" },
      { label: "Package of 2", price: "4,500 THB", highlight: true }
    ]
  },
  {
    id: "vac-verorab",
    name: "Verorab (Rabies)",
    category: "travel",
    pricePerDose: 750,
    status: "available",
    showPrice: false,
    protocol: "2 Doses (Pre-Exp)",
    description: "Highly recommended for outdoor athletes and rural travel."
  },
  {
    id: "vac-havrix",
    name: "Havrix 1440 (Hepatitis A, Adult)",
    category: "travel",
    pricePerDose: 1950,
    status: "out-of-stock",
    showPrice: false,
    protocol: "2 Doses",
    description: "Long-term protection against food-borne Hepatitis A."
  },
  {
    id: "vac-menquadfi",
    name: "MenQuadfi (Meningococcal)",
    category: "travel",
    pricePerDose: 3825,
    status: "available",
    showPrice: false,
    protocol: "Single Shot",
    description: "Protection against bacterial meningitis. Required for certain visas/studies."
  },

  // === GROUP 2: Routine & Booster Vaccines ===
  {
    id: "vac-boostrix",
    name: "Boostrix/Adacl (Tdap)",
    category: "routine",
    pricePerDose: 1150,
    status: "available",
    showPrice: false,
    protocol: "Booster Shot",
    description: "Protects against Tetanus, Diphtheria, and Pertussis. Every 10 years."
  },
  {
    id: "vac-engerixb",
    name: "Engerix B (Hepatitis B)",
    category: "routine",
    pricePerDose: 850,
    status: "available",
    showPrice: false,
    protocol: "3 Doses",
    description: "Standard immunization for blood-borne Hepatitis B protection."
  },
  {
    id: "vac-flu",
    name: "Flu quadri (Seasonal Influenza)",
    category: "routine",
    pricePerDose: 700,
    status: "available",
    showPrice: false,
    protocol: "Annual Shot",
    description: "Annual seasonal flu shot protecting against four prevalent strains."
  },
  {
    id: "vac-gardasil9",
    name: "Gardasil 9 (HPV 9)",
    category: "routine",
    pricePerDose: 6450,
    status: "available",
    showPrice: false,
    protocol: "2-3 Doses",
    description: "Comprehensive cervical and HPV-related cancer defense panel.",
    hasPackage: true,
    packageDetails: "Package of 2: 12,800 THB | Package of 3: 17,100 THB",
    isPromoCard: true,
    promoLabel: "HPV 9 Protection Package",
    // 💡 แสดงราคาทั้งแบบ 1 เข็ม, 2 เข็ม, และ 3 เข็ม
    promoPrices: [
      { label: "Single Dose", price: "6,450 THB" },
      { label: "Package of 2", price: "12,800 THB" },
      { label: "Package of 3", price: "17,100 THB", highlight: true }
    ]
  },
  {
    id: "vac-prevnar15",
    name: "Prevnar 15 (Pneumococcal)",
    category: "routine",
    pricePerDose: 3150,
    status: "available",
    showPrice: false,
    protocol: "Single Shot",
    description: "Advanced conjugate defense against invasive pneumococcal pneumonia."
  },
  {
    id: "vac-prevnar20",
    name: "Prevnar 20 (Pneumococcal)",
    category: "routine",
    pricePerDose: 3140,
    status: "available",
    showPrice: false,
    protocol: "Single Shot",
    description: "Next-gen expanded coverage against 20 pneumococcal serotypes."
  },
  {
    id: "vac-pneumovax23",
    name: "Pneumovax 23 (Pneumococcal)",
    category: "routine",
    pricePerDose: 2100,
    status: "available",
    showPrice: false,
    protocol: "Single Shot",
    description: "Polysaccharide vaccine booster for comprehensive lung protection."
  },
  {
    id: "vac-priorix",
    name: "Priorix MMR (Measles, Mumps, Rubella)",
    category: "routine",
    pricePerDose: 860,
    status: "available",
    showPrice: false,
    protocol: "1-2 Doses",
    description: "Essential triple-virus protection package for adults and travelers."
  },
  {
    id: "vac-proquad",
    name: "Proquad (MMR-Varicella)",
    category: "routine",
    pricePerDose: 2530,
    status: "available",
    showPrice: false,
    protocol: "2 Doses",
    description: "Combined immunity update for Measles, Mumps, Rubella, and Chickenpox."
  },
  {
    id: "vac-varivax",
    name: "Varivax (Varicella)",
    category: "routine",
    pricePerDose: 1640,
    status: "available",
    showPrice: false,
    protocol: "2 Doses",
    description: "Targeted protection against chickenpox infection for non-immune adults."
  },
  {
    id: "vac-shingrix",
    name: "Shingrix (Shingles)",
    category: "routine",
    pricePerDose: 6350,
    status: "available",
    showPrice: false,
    protocol: "2 Doses",
    description: "Highly effective non-live vaccine for shingles prevention (Age 50+)."
  },
  {
    id: "vac-td",
    name: "Td (Tetanus-Diptheria)",
    category: "routine",
    pricePerDose: 0,
    status: "out-of-stock",
    showPrice: false,
    protocol: "-",
    description: "Basic Tetanus and Diphtheria booster."
  },

  // === GROUP 3: Pediatric / Junior Vaccines ===
  {
    id: "vac-hexaxim",
    name: "Hexaxim (DTaP-IPV-HB-Hib)",
    category: "routine",
    pricePerDose: 2500,
    status: "available",
    showPrice: false,
    protocol: "Infant Series",
    description: "6-in-1 pediatric combination vaccine for comprehensive early childhood immunity."
  },
  {
    id: "vac-rotateq",
    name: "Rotateq (Rotavirus)",
    category: "routine",
    pricePerDose: 1200,
    status: "available",
    showPrice: false,
    protocol: "3 Doses (Oral)",
    description: "Oral live vaccine to protect infants against severe rotavirus diarrhea."
  },
  {
    id: "vac-vaqta-jr",
    name: "Vaqta 25 u (Hepatitis A, Junior)",
    category: "routine",
    pricePerDose: 1350,
    status: "available",
    showPrice: false,
    protocol: "2 Doses",
    description: "Pediatric formulation for early childhood Hepatitis A immunization."
  },

  // === GROUP 4: Special Promotional Combos (แสดงฝั่งขวาเท่านั้น) ===
  {
    id: "promo-pneumo-flu",
    name: "Pneumonia PCV15 + Quadrivalent Flu",
    category: "promo-only", 
    pricePerDose: 3650,
    status: "available",
    showPrice: false,
    protocol: "Co-administered (2 Shots)",
    description: "Co-administered protection recommended for seniors (65+), asthma sufferers, or diabetics.",
    hasPackage: true,
    packageDetails: "Combined Price: 3,650 THB Net",
    isPromoCard: true,
    promoLabel: "Duo Vaccination Promo",
    promoPrices: [
      { label: "Combined Price", price: "3,650 THB Net", highlight: true }
    ]
  }
];