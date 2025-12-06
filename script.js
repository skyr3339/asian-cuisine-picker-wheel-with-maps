// ==== Element references ====
const cuisineSelect = document.getElementById('cuisineSelect');

const foodListElement = document.getElementById('foodList');
const newItemInput = document.getElementById('newItemInput');
const addItemBtn = document.getElementById('addItemBtn');
const confirmListBtn = document.getElementById('confirmListBtn');
const resetBtn = document.getElementById('resetBtn');

const wheelCanvas = document.getElementById('wheelCanvas');
const ctx = wheelCanvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultText = document.getElementById('resultText');
const mapsLinkContainer = document.getElementById('mapsLinkContainer');

const themeToggle = document.getElementById('themeToggle');
const surpriseCuisineBtn = document.getElementById('surpriseCuisineBtn');

// ==== State ====
let foodItems = []; // array of dish names
let currentAngle = 0;
let isSpinning = false;

const STORAGE_KEY = 'menuWheelFoodItems';
const THEME_KEY = 'menuWheelTheme';

// ==== Cuisine data ====
const CUISINES = {
  Japanese: [
    'Sushi Platter',
    'Tonkotsu Ramen',
    'Chicken Katsu',
    'Tempura Udon',
    'Gyudon Beef Bowl',
    'Okonomiyaki',
    'Salmon Don',
    'Karaage Fried Chicken'
  ],
  Chinese: [
    'Kung Pao Chicken',
    'Sweet & Sour Pork',
    'Yangzhou Fried Rice',
    'Mapo Tofu',
    'Beef Chow Fun',
    'Steamed Fish with Soy',
    'Xiao Long Bao',
    'Char Siu Rice'
  ],
  Korean: [
    'Bibimbap',
    'Kimchi Jjigae',
    'Korean Fried Chicken',
    'Bulgogi Beef',
    'Tteokbokki',
    'Jajangmyeon',
    'Samgyeopsal',
    'Sundubu Jjigae'
  ],
  Taiwanese: [
    'Beef Noodle Soup',
    'Braised Pork Rice',
    'Oyster Omelette',
    'Chicken Cutlet Rice',
    'Lu Rou Fan',
    'Popcorn Chicken',
    'Stinky Tofu',
    'Scallion Pancake'
  ],
  Thai: [
    'Pad Thai',
    'Green Curry Chicken',
    'Tom Yum Goong',
    'Pad Kra Pao',
    'Massaman Curry',
    'Pineapple Fried Rice',
    'Som Tum Papaya Salad',
    'Thai Basil Beef'
  ],
  Malaysian: [
    'Nasi Lemak',
    'Char Kway Teow',
    'Hainanese Chicken Rice',
    'Laksa',
    'Roti Canai',
    'Nasi Goreng Kampung',
    'Satay',
    'Mee Goreng Mamak'
  ],
  Indonesian: [
    'Nasi Goreng',
    'Rendang Beef',
    'Ayam Goreng',
    'Gado-Gado',
    'Soto Ayam',
    'Bakso Noodles',
    'Sate Ayam',
    'Mie Goreng'
  ],
  Vietnamese: [
    'Pho Bo',
    'Banh Mi',
    'Bun Cha',
    'Com Tam',
    'Spring Rolls',
    'Bun Bo Hue',
    'Grilled Pork Vermicelli',
    'Ca Kho To'
  ],
  Filipino: [
    'Chicken Adobo',
    'Sinigang',
    'Pork Sisig',
    'Kare-Kare',
    'Lechon Kawali',
    'Pancit Canton',
    'Bicol Express',
    'Halo-Halo (dessert)'
  ],
  Singaporean: [
    'Hainanese Chicken Rice',
    'Chilli Crab',
    'Laksa',
    'Char Kway Teow',
    'Bak Kut Teh',
    'Nasi Lemak',
    'Hokkien Mee',
    'Fried Carrot Cake'
  ],
  Indian: [
    'Butter Chicken',
    'Paneer Tikka Masala',
    'Chicken Biryani',
    'Palak Paneer',
    'Chole Bhature',
    'Masala Dosa',
    'Lamb Rogan Josh',
    'Tandoori Chicken'
  ],
  Pakistani: [
    'Chicken Karahi',
    'Beef Biryani',
    'Nihari',
    'Haleem',
    'Chapli Kebab',
    'Chana Chaat',
    'Seekh Kebabs',
    'Aloo Paratha'
  ],
  'Sri Lankan': [
    'Rice & Curry',
    'Kottu Roti',
    'Lamprais',
    'Fish Ambul Thiyal',
    'Hoppers (Appam)',
    'Dhal Curry',
    'Pol Sambol',
    'Devilled Chicken'
  ],
  Bangladeshi: [
    'Kacchi Biryani',
    'Hilsa Fish Curry',
    'Beef Bhuna',
    'Morog Polao',
    'Panta Bhat',
    'Fuchka (Puchka)',
    'Chingri Malai Curry',
    'Dal & Bhaji Set'
  ],
  Nepalese: [
    'Momos Dumplings',
    'Dal Bhat',
    'Choila',
    'Thukpa Noodle Soup',
    'Sekuwa Grilled Meat',
    'Gundruk Soup',
    'Aloo Tama',
    'Chatamari'
  ]
};

// ==== Theme handling ====
function applyTheme(mode) {
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  }
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (e) {
    // ignore
  }
}

// Initialize theme from storage or system preference
(function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) {
    saved = null;
  }

  if (!saved) {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  } else {
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  }
})();

// Toggle theme on button click
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    applyTheme(isCurrentlyDark ? 'light' : 'dark');
  });
}

// ==== Random cuisine ("Surprise me") ====
if (surpriseCuisineBtn) {
  surpriseCuisineBtn.addEventListener('click', () => {
    const cuisineKeys = Object.keys(CUISINES);
    if (cuisineKeys.length === 0) return;

    const randomKey =
      cuisineKeys[Math.floor(Math.random() * cuisineKeys.length)];

    if (cuisineSelect) {
      cuisineSelect.value = randomKey;
      cuisineSelect.dispatchEvent(new Event('change'));
    }
  });
}

// ==== Cuisine selection → load dishes ====
if (cuisineSelect) {
  cuisineSelect.addEventListener('change', () => {
    const value = cuisineSelect.value;
    if (!value || !CUISINES[value]) {
      foodItems = [];
    } else {
      // shallow copy so user edits don't mutate base data
      foodItems = [...CUISINES[value]];
    }
    renderFoodList();
    drawWheel();
    resultText.textContent = '';
    resultText.classList.remove('show');
    updateMapsLink('');
  });
}

// ==== Food list rendering & editing ====
function renderFoodList() {
  foodListElement.innerHTML = '';

  foodItems.forEach((item, index) => {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = item;

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      const newValue = prompt('Edit dish:', foodItems[index]);
      if (newValue === null) return; // cancel
      const trimmed = newValue.trim();
      if (trimmed.length === 0) return;
      foodItems[index] = trimmed;
      renderFoodList();
      drawWheel();
      saveFoodItems();
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      foodItems.splice(index, 1);
      renderFoodList();
      drawWheel();
      saveFoodItems();
    });

    li.appendChild(span);
    li.appendChild(editButton);
    li.appendChild(deleteButton);
    foodListElement.appendChild(li);
  });
}

// Add new item
addItemBtn.addEventListener('click', () => {
  const value = newItemInput.value.trim();
  if (value.length === 0) return;
  foodItems.push(value);
  newItemInput.value = '';
  renderFoodList();
  drawWheel();
  saveFoodItems();
});

// Allow Enter key to add item
newItemInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addItemBtn.click();
  }
});

// ==== Confirm list ====
confirmListBtn.addEventListener('click', () => {
  if (foodItems.length === 0) {
    alert('Your list is empty. Add at least one dish.');
    return;
  }

  drawWheel();
  saveFoodItems();
  alert('List confirmed and saved! You can now spin the wheel.');
});

// ==== Reset all ====
resetBtn.addEventListener('click', () => {
  // Clear selection & list
  if (cuisineSelect) cuisineSelect.value = '';
  foodItems = [];
  renderFoodList();
  clearWheel();
  currentAngle = 0;
  resultText.textContent = '';
  resultText.classList.remove('show');
  updateMapsLink('');

  clearSavedList();
});

// ==== Wheel drawing ====
function clearWheel() {
  ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
}

// Shorten raw label to max 40 characters with "..."
function shortenLabel(label) {
  const trimmed = (label || '').trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 37) + '...'; // total 40 chars
}

// Helper: wrap text into at most 2 lines so that each line fits maxWidth
function wrapTextTwoLines(label, ctx2, maxWidth) {
  const words = label.split(' ').filter(Boolean);
  if (words.length === 0) return [''];

  if (words.length === 1) return [label];

  let line1 = words[0];
  let breakIndex = words.length;

  for (let i = 1; i < words.length; i++) {
    const testLine = line1 + ' ' + words[i];
    if (ctx2.measureText(testLine).width <= maxWidth) {
      line1 = testLine;
    } else {
      breakIndex = i;
      break;
    }
  }

  if (breakIndex === words.length) {
    return [line1];
  } else {
    const line2 = words.slice(breakIndex).join(' ');
    return [line1, line2];
  }
}

// ==== Google Maps link helper ====
function updateMapsLink(dishName) {
  if (!mapsLinkContainer) return;

  mapsLinkContainer.innerHTML = '';
  if (!dishName) return;

  const cuisinePrefix =
    cuisineSelect && cuisineSelect.value ? `${cuisineSelect.value} ` : '';

  const query = encodeURIComponent(
    `${cuisinePrefix}${dishName} restaurant near me`
  );

  const link = document.createElement('a');
  link.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'maps-link';
  link.textContent = 'Find nearby places on Google Maps';

  mapsLinkContainer.appendChild(link);
}

function drawWheel() {
  clearWheel();

  const numItems = foodItems.length;
  if (numItems === 0) return;

  const width = wheelCanvas.width;
  const height = wheelCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  const radius = Math.min(width, height) / 2 - 70;
  const sliceAngle = (2 * Math.PI) / numItems;

  // ===== Stand / base =====
  const baseTop = centerY + radius + 20;
  const baseBottom = height - 10;

  ctx.save();
  ctx.fillStyle = '#0d3456';
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.65, baseBottom);
  ctx.lineTo(centerX + radius * 0.65, baseBottom);
  ctx.lineTo(centerX + radius * 0.45, baseTop);
  ctx.lineTo(centerX - radius * 0.45, baseTop);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0b2840';
  ctx.fillRect(centerX - radius * 0.4, baseTop - 20, radius * 0.8, 20);
  ctx.restore();

  // ===== Outer rim =====
  const rimRadius = radius + 22;

  ctx.beginPath();
  ctx.arc(centerX, centerY, rimRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#143d6b';
  ctx.fill();

  ctx.lineWidth = 7;
  ctx.strokeStyle = '#e0b54a';
  ctx.stroke();

  // ===== Gold studs =====
  const studs = 28;
  ctx.fillStyle = '#f2d57c';
  for (let i = 0; i < studs; i++) {
    const a = (2 * Math.PI * i) / studs;
    const sx = centerX + (rimRadius - 7) * Math.cos(a);
    const sy = centerY + (rimRadius - 7) * Math.sin(a);
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // ===== Inner cream disc =====
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#fce9c9';
  ctx.fill();

  // ===== Slices + text =====
  for (let i = 0; i < numItems; i++) {
    const startAngle = currentAngle + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#d43228' : '#fce9c9';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#f8f1df';
    ctx.lineWidth = 1;
    ctx.stroke();

    const rawLabel = foodItems[i];
    const label = shortenLabel(rawLabel);

    ctx.save();
    ctx.translate(centerX, centerY);

    const safeAngle = startAngle + sliceAngle / 2;
    ctx.rotate(safeAngle);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5c2313';

    const textRadius = radius * 0.5;
    const maxTextWidth =
      textRadius * 2 * Math.sin(sliceAngle / 2) * 0.8;

    let baseFontSize = 26;
    if (label.length > 20) baseFontSize = 22;
    if (label.length > 30) baseFontSize = 18;

    let fontSize = baseFontSize;

    while (fontSize > 12) {
      ctx.font = `bold ${fontSize}px Arial`;

      const lines = wrapTextTwoLines(label, ctx, maxTextWidth);
      const tooWide = lines.some(
        (line) => ctx.measureText(line).width > maxTextWidth
      );

      if (!tooWide) break;
      fontSize -= 1;
    }

    ctx.font = `bold ${fontSize}px Arial`;
    const finalLines = wrapTextTwoLines(label, ctx, maxTextWidth);
    const lineHeight = fontSize + 2;

    if (finalLines.length === 1) {
      ctx.fillText(finalLines[0], textRadius, 5);
    } else {
      ctx.fillText(finalLines[0], textRadius, 5 - lineHeight / 2);
      ctx.fillText(finalLines[1], textRadius, 5 + lineHeight / 2);
    }

    ctx.restore();
  }

  // ===== Center hub =====
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.19, 0, 2 * Math.PI);
  ctx.fillStyle = '#f3cf66';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.11, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffe8a0';
  ctx.fill();

  // ===== Pointer (shiny, with shadow) =====
  ctx.save();
  const pointerTopY = centerY - rimRadius - 2;
  const pointerBottomY = pointerTopY + 30;

  ctx.beginPath();
  ctx.moveTo(centerX - 16, pointerTopY);
  ctx.lineTo(centerX + 16, pointerTopY);
  ctx.lineTo(centerX, pointerBottomY);
  ctx.closePath();

  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  const grad = ctx.createLinearGradient(
    centerX,
    pointerTopY,
    centerX,
    pointerBottomY
  );
  grad.addColorStop(0, '#fff7cf');
  grad.addColorStop(0.4, '#f8dd78');
  grad.addColorStop(1, '#e0b043');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#b58b33';
  ctx.stroke();
  ctx.restore();
}

// ==== Spin logic ====
spinBtn.addEventListener('click', () => {
  if (isSpinning) return;
  if (foodItems.length === 0) {
    alert('Please confirm a list with at least one dish first.');
    return;
  }

  isSpinning = true;
  resultText.textContent = '';
  resultText.classList.remove('show');
  updateMapsLink('');

  const numItems = foodItems.length;
  const sliceAngle = (2 * Math.PI) / numItems;

  const startAngle = currentAngle;
  const randomSpin = (Math.random() * 3 + 3) * 2 * Math.PI;
  const finalAngle = startAngle + randomSpin;

  const duration = 3000;
  const startTime = performance.now();

  function startClickAnimation() {
    const clickDuration = 180;
    const clickStartTime = performance.now();
    const amplitude = sliceAngle * 0.06;

    function clickFrame(time) {
      const t = Math.min((time - clickStartTime) / clickDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2);

      const offset = amplitude * (1 - eased);
      currentAngle = finalAngle + offset;
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(clickFrame);
      } else {
        currentAngle = finalAngle;
        drawWheel();

        const fullCircle = 2 * Math.PI;
        const pointerAngle = (3 * Math.PI) / 2;

        let currentNorm = currentAngle % fullCircle;
        if (currentNorm < 0) currentNorm += fullCircle;

        const angleFromStart =
          (pointerAngle - currentNorm + fullCircle) % fullCircle;

        const winningIndex =
          Math.floor(angleFromStart / sliceAngle) % numItems;
        const winningItem = foodItems[winningIndex];

        resultText.textContent = `You should eat: ${winningItem}`;
        resultText.classList.add('show');
        updateMapsLink(winningItem);
        isSpinning = false;
      }
    }

    requestAnimationFrame(clickFrame);
  }

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    currentAngle = startAngle + randomSpin * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      startClickAnimation();
    }
  }

  requestAnimationFrame(animate);
});

// ==== Save / load list with localStorage ====
function saveFoodItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foodItems));
  } catch (e) {
    console.warn('Could not save list to localStorage', e);
  }
}

function loadSavedFoodItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      foodItems = parsed;
      renderFoodList();
      drawWheel();
      resultText.textContent = 'Loaded your last confirmed list.';
      resultText.classList.add('show');
      updateMapsLink('');
    }
  } catch (e) {
    console.warn('Could not load list from localStorage', e);
  }
}

function clearSavedList() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

// Load previous list on page load
loadSavedFoodItems();

