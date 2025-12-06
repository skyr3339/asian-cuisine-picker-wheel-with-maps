// ==== Element references ====
const menuImageInput = document.getElementById('menuImageInput');
const menuImagePreview = document.getElementById('menuImagePreview');
const extractTextBtn = document.getElementById('extractTextBtn');
const ocrStatus = document.getElementById('ocrStatus');

const foodListElement = document.getElementById('foodList');
const newItemInput = document.getElementById('newItemInput');
const addItemBtn = document.getElementById('addItemBtn');
const confirmListBtn = document.getElementById('confirmListBtn');
const resetBtn = document.getElementById('resetBtn');

const wheelCanvas = document.getElementById('wheelCanvas');
const ctx = wheelCanvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultText = document.getElementById('resultText');

const themeToggle = document.getElementById('themeToggle');

// ==== State ====
let uploadedImageFile = null;
let foodItems = []; // array of strings
let currentAngle = 0;
let isSpinning = false;

const STORAGE_KEY = 'menuWheelFoodItems';
const THEME_KEY = 'menuWheelTheme';

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
    const prefersDark = window.matchMedia &&
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

// ==== Image upload & preview ====
menuImageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedImageFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = function (e) {
    menuImagePreview.src = e.target.result;
    menuImagePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// ==== OCR: extract text using Tesseract.js ====
extractTextBtn.addEventListener('click', () => {
  if (!uploadedImageFile) {
    alert('Please upload a menu image first.');
    return;
  }

  ocrStatus.textContent = 'Reading text from image... This may take a moment.';

  Tesseract.recognize(uploadedImageFile, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        ocrStatus.textContent = `Recognizing text: ${Math.round(
          m.progress * 100
        )}%`;
      }
    },
  })
    .then(({ data }) => {
      ocrStatus.textContent = 'Done! Text extracted.';
      const fullText = data.text;
      console.log('OCR result:', fullText);

      // Convert OCR text into a list of items (improved parsing)
      foodItems = parseMenuText(fullText);
      renderFoodList();
      drawWheel();
    })
    .catch((err) => {
      console.error(err);
      ocrStatus.textContent = 'Error reading text from image.';
    });
});

// ==== Improved menu text parsing ====
function parseMenuText(text) {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

  const items = [];

  for (let line of lines) {
    // 1) Keep only the part before the price (RM / $ / MYR)
    const priceMatch = /(.*?)(?:\s*(RM|MYR|\$)\s*\d+(\.\d+)?)/i.exec(line);
    if (priceMatch) {
      line = priceMatch[1];
    }

    // 2) Remove weird symbols and trailing garbage
    line = line
      .replace(/[^a-zA-Z0-9&\-\/\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 3) Limit to first few words so we don't keep random tail
    const words = line.split(' ').filter(Boolean);
    if (words.length > 5) {
      line = words.slice(0, 5).join(' ');
    }

    // 4) Filter out too-short / obviously bad lines
    if (line.length < 3) continue;
    if (/^\d+(\.\d+)?$/.test(line)) continue; // just numbers

    items.push(line);
  }

  // 5) Remove duplicates
  return [...new Set(items)];
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
      const newValue = prompt('Edit food item:', foodItems[index]);
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
    alert('Your list is empty. Add at least one food item.');
    return;
  }

  drawWheel();
  saveFoodItems();
  alert('List confirmed and saved! You can now spin the wheel.');
});

// ==== Reset all ====
resetBtn.addEventListener('click', () => {
  // Clear image
  uploadedImageFile = null;
  menuImageInput.value = '';
  menuImagePreview.src = '';
  menuImagePreview.style.display = 'none';

  // Clear OCR status
  ocrStatus.textContent = '';

  // Clear items and UI
  foodItems = [];
  renderFoodList();
  clearWheel();
  currentAngle = 0; // reset angle explicitly here
  resultText.textContent = '';
  resultText.classList.remove('show');

  // Clear saved data
  clearSavedList();
});

// ==== Wheel drawing ====
function clearWheel() {
  // Only clear the pixels, don't touch currentAngle
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

  // If only 1 word, no wrapping needed
  if (words.length === 1) return [label];

  let line1 = words[0];
  let breakIndex = words.length; // assume everything fits into line1

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
    // Everything fit into line1
    return [line1];
  } else {
    const line2 = words.slice(breakIndex).join(' ');
    return [line1, line2];
  }
}

function drawWheel() {
  clearWheel();

  const numItems = foodItems.length;
  if (numItems === 0) return;

  const width = wheelCanvas.width;
  const height = wheelCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  // Bigger wheel (canvas was increased)
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

    // Slice fill
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#d43228' : '#fce9c9';
    ctx.fill();

    // Slice border
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#f8f1df';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ===== Text inside slice (auto-fit with safe margins + ellipsis) =====
    // 1) Prepare label: shorten overly long ones first
    const rawLabel = foodItems[i];
    const label = shortenLabel(rawLabel);

    ctx.save();
    ctx.translate(centerX, centerY);

    // SAFE rotation centered in the slice
    const safeAngle = startAngle + sliceAngle / 2;
    ctx.rotate(safeAngle);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5c2313';

    // Text radius: keep it comfortably inside the slice
    const textRadius = radius * 0.5;

    // Max width based on slice geometry (with margin)
    const maxTextWidth =
      textRadius * 2 * Math.sin(sliceAngle / 2) * 0.8;

    // Base font size depends on label length (shorter text = bigger font)
    let baseFontSize = 26;
    if (label.length > 20) baseFontSize = 22;
    if (label.length > 30) baseFontSize = 18;

    let fontSize = baseFontSize;

    // Downsize font until BOTH lines fit within maxTextWidth
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
      // Single line
      ctx.fillText(finalLines[0], textRadius, 5);
    } else {
      // Two lines: one slightly above, one slightly below
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
    alert('Please confirm a list with at least one item first.');
    return;
  }

  isSpinning = true;
  resultText.textContent = '';
  resultText.classList.remove('show');

  const numItems = foodItems.length;
  const sliceAngle = (2 * Math.PI) / numItems;

  const startAngle = currentAngle; // fixed starting angle
  // Random spin between 3 and 6 full rotations
  const randomSpin = (Math.random() * 3 + 3) * 2 * Math.PI;
  const finalAngle = startAngle + randomSpin;

  const duration = 3000; // 3 seconds
  const startTime = performance.now();

  // Small "click" / overshoot animation at the end
  function startClickAnimation() {
    const clickDuration = 180; // ms
    const clickStartTime = performance.now();
    const amplitude = sliceAngle * 0.06; // small angle offset

    function clickFrame(time) {
      const t = Math.min((time - clickStartTime) / clickDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out

      // Start slightly past finalAngle, then settle back
      const offset = amplitude * (1 - eased); // goes from amplitude -> 0
      currentAngle = finalAngle + offset;
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(clickFrame);
      } else {
        // Final resting angle
        currentAngle = finalAngle;
        drawWheel();

        // Now decide the winner
        const fullCircle = 2 * Math.PI;
        const pointerAngle = (3 * Math.PI) / 2; // pointer at top

        let currentNorm = currentAngle % fullCircle;
        if (currentNorm < 0) currentNorm += fullCircle;

        const angleFromStart =
          (pointerAngle - currentNorm + fullCircle) % fullCircle;

        const winningIndex =
          Math.floor(angleFromStart / sliceAngle) % numItems;
        const winningItem = foodItems[winningIndex];

        resultText.textContent = `You should eat: ${winningItem}`;
        resultText.classList.add('show');
        isSpinning = false;
      }
    }

    requestAnimationFrame(clickFrame);
  }

  // Main spin animation
  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out (fast then slow)
    const eased = 1 - Math.pow(1 - progress, 3);

    const angle = startAngle + randomSpin * eased;
    currentAngle = angle;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // When main spin ends, do the small click animation
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
