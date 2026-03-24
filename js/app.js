/**
 * 메디테라피 썸네일 생성기 — app.js
 *
 * 구글 시트 CSV URL (공개 설정 필요):
 * 시트 → 파일 → 공유 → 웹에 게시 → CSV 로 게시 후 URL 교체
 */

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYjkiTVCUBF41ITs5lkCtZVsLdjzZgNamDX6hR2qmj8uAof8HnCuJAWzFmd34Z3eJ5Lmnmwwszgy4j/pub?output=csv';

const BRAND_KR = { meditherapy: '메디테라피', hidif: '히디프' };

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
let products = [];

const state = {
  brand: 'meditherapy',
  country: 'tw',
  products: [],
  shipping: 'no',
  bundle: 'no',
  discount: 0,
  gifts: [],
  giftLabel: '',
};

// ──────────────────────────────────────────
// CSV 로드
// ──────────────────────────────────────────
async function loadProducts() {
  const input = document.getElementById('productSearch');
  try {
    input.placeholder = '제품 데이터 로드 중...';
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text.trim().split('\n').slice(1); // 헤더 제거
    products = lines
      .map(line => {
        const cols = parseCSVLine(line);
        return {
          brand:    (cols[0] || '').replace(/^\uFEFF/, '').trim(),
          name:     (cols[1] || '').trim(),
          category: (cols[2] || '').trim(),
          volume:   (cols[3] || '').trim(),
          imageUrl: convertDriveUrl((cols[4] || '').trim()),
        };
      })
      .filter(p => p.name);
    window._products = products; // 콘솔 디버그용
    console.log(`✅ 제품 로드 완료: ${products.length}개`);
    if (products.length > 0) {
      console.log('첫번째 제품:', products[0]);
      console.log('브랜드 목록 (unique):', [...new Set(products.map(p => JSON.stringify(p.brand)))]);
    }
    input.placeholder = '제품명으로 검색';
  } catch (e) {
    console.warn('❌ 제품 데이터 로드 실패:', e.message);
    input.placeholder = '데이터 로드 실패 (F12 콘솔 확인)';
  }
}

function convertDriveUrl(url) {
  if (!url) return '';
  // /d/FILE_ID 형식
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://lh3.googleusercontent.com/d/${m1[1]}`;
  // ?id=FILE_ID 형식
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://lh3.googleusercontent.com/d/${m2[1]}`;
  return url;
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// ──────────────────────────────────────────
// 검색
// ──────────────────────────────────────────
function searchProducts(query, brandFilter = null) {
  const q = query.toLowerCase().trim();
  const brandKr = (brandFilter || BRAND_KR[state.brand] || '').trim();
  return products
    .filter(p => p.brand.trim() === brandKr && (!q || p.name.toLowerCase().includes(q)))
    .slice(0, 30);
}

function searchAllProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 30);
}

// ──────────────────────────────────────────
// 토글 버튼 그룹
// ──────────────────────────────────────────
function setupToggleGroup(groupId, stateKey) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[stateKey] = btn.dataset.value;
      updateThumbnail();
    });
  });
}

// ──────────────────────────────────────────
// 검색 드롭다운
// ──────────────────────────────────────────
function setupSearch(inputId, dropdownId, onSelect, searchFn = searchProducts) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);

  input.addEventListener('input', () => {
    const results = searchFn(input.value);
    if (results.length === 0) {
      dropdown.innerHTML = input.value.trim()
        ? '<div class="dropdown-empty">검색 결과 없음</div>'
        : results.length === 0 ? '' : '';
    } else {
      dropdown.innerHTML = results.map(p =>
        `<div class="dropdown-item" data-idx="${products.indexOf(p)}">
           <span class="dropdown-tag">${p.category || ''}</span>
           ${p.name}
           ${p.volume ? `<span class="dropdown-vol">${p.volume}</span>` : ''}
         </div>`
      ).join('');
    }
    dropdown.classList.toggle('open', results.length > 0 || !!input.value.trim());
  });

  dropdown.addEventListener('mousedown', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    onSelect(products[idx]);
    input.value = '';
    dropdown.classList.remove('open');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// ──────────────────────────────────────────
// 썸네일 업데이트
// ──────────────────────────────────────────
function updateThumbnail() {
  updateTemplate();
  updateShippingBadge();
  updateDiscountBadge();
  updateBundleBadge();
  updateProductImages();
  updateGift();
}

function updateCountryByBrand() {
  const hkBtn = document.querySelector('#countryGroup [data-value="hk"]');
  const sgBtn = document.querySelector('#countryGroup [data-value="sg"]');
  const bundleLabel = document.getElementById('bundleLabel');
  const bundleBtns  = document.querySelectorAll('#bundleGroup .toggle-btn');

  if (state.brand === 'hidif') {
    hkBtn.style.display = 'none';
    sgBtn.style.display = 'none';
    // 대만으로 강제 선택
    document.querySelector('#countryGroup [data-value="tw"]').click();
    // 구성 비활성화
    bundleLabel.textContent = '구성(현재 미사용)';
    bundleBtns.forEach(btn => { btn.disabled = true; });
    // 구성 NO로 초기화
    state.bundle = 'no';
    bundleBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('#bundleGroup [data-value="no"]').classList.add('active');
  } else {
    hkBtn.style.display = '';
    sgBtn.style.display = '';
    bundleLabel.textContent = '구성';
    bundleBtns.forEach(btn => { btn.disabled = false; });
  }
}

function updateTemplate() {
  const thumbnail = document.getElementById('thumbnail');
  thumbnail.classList.remove('template-hk', 'template-sg', 'template-hidif-tw');
  if (state.country === 'hk') thumbnail.classList.add('template-hk');
  if (state.country === 'sg') thumbnail.classList.add('template-sg');
  if (state.brand === 'hidif' && state.country === 'tw') thumbnail.classList.add('template-hidif-tw');

  // 할인율 입력창 suffix 변경
  const suffix = document.querySelector('.input-suffix');
  suffix.textContent = state.country === 'sg' ? '%' : '折';
}

function updateShippingBadge() {
  const el   = document.getElementById('thShipping');
  const icon = el.querySelector('.th-shipping-icon');
  const text = el.querySelector('span');

  // 브랜드·국가별 아이콘·텍스트 분기
  if (state.brand === 'hidif' && state.country === 'tw') {
    icon.src           = 'assets/delivery-icon-hidif-tw.png';
    text.style.display = 'none';
  } else if (state.country === 'hk') {
    icon.src           = 'assets/delivery-icon-hk.png';
    text.style.display = '';
    text.innerHTML     = '免郵';
  } else if (state.country === 'sg') {
    icon.src           = 'assets/delivery-icon.png';
    text.style.display = '';
    text.innerHTML     = '<span class="sg-free">FREE</span><span class="sg-shipping">SHIPPING</span>';
  } else {
    icon.src           = 'assets/delivery-icon.png';
    text.style.display = '';
    text.innerHTML     = '免運';
  }

  el.style.display = state.shipping === 'yes' ? 'flex' : 'none';
}

function updateDiscountBadge() {
  const el   = document.getElementById('thDiscount');
  const text = document.getElementById('thDiscountText');
  if (state.discount > 0) {
    if (state.country === 'sg') {
      text.innerHTML = `<span class="sg-discount-num">${state.discount}</span><span class="sg-discount-right"><span class="sg-discount-pct">%</span><span class="sg-discount-off">OFF</span></span>`;
    } else if (state.brand === 'hidif') {
      text.innerHTML = `${state.discount}折`;
    } else {
      // TW/HK: 숫자와 折 분리
      text.innerHTML = `<span class="tw-discount-num">${state.discount}</span><span class="tw-discount-unit">折</span>`;
    }
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

function updateBundleBadge() {
  const el   = document.getElementById('thBundle');
  const text = document.getElementById('thBundleText');
  if (state.bundle !== 'no') {
    text.textContent = state.bundle;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

function getProductCount() {
  const map = { 'no': 1, '1+1': 2, '2+1': 3, '3+1': 4 };
  return map[state.bundle] || 1;
}

function renderSelectedChips(containerId, items, removeCallback) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item, idx) => {
    const chip = document.createElement('div');
    chip.className = 'selected-chip';
    chip.innerHTML = `<span>${item.name}${item.volume ? ` (${item.volume})` : ''}</span><button class="chip-clear">×</button>`;
    chip.querySelector('.chip-clear').addEventListener('click', () => {
      removeCallback(idx);
    });
    container.appendChild(chip);
  });
}

function updateProductImages() {
  const container = document.getElementById('thProducts');
  container.innerHTML = '';

  if (state.products.length === 0) {
    const ph = document.createElement('div');
    ph.className   = 'th-product-placeholder';
    ph.textContent = '제품 이미지';
    container.appendChild(ph);
    return;
  }

  // 단일 제품: 구성 배지 수량만큼 반복 / 복수 제품: 각 1장
  const bundleCount = state.products.length === 1 ? getProductCount() : 1;
  state.products.forEach(product => {
    for (let i = 0; i < bundleCount; i++) {
      const img = document.createElement('img');
      img.className   = 'th-product-img';
      img.src         = product.imageUrl;
      img.alt         = product.name;
      img.crossOrigin = 'anonymous';
      container.appendChild(img);
    }
  });
}

function updateGift() {
  const giftEl        = document.getElementById('thGift');
  const giftPlus      = document.getElementById('thGiftPlus');
  const giftImgsEl    = document.getElementById('thGiftImgs');
  const giftLabel     = document.getElementById('thGiftLabel');

  const hasGift = state.gifts.length > 0 || state.giftLabel;

  if (hasGift) {
    giftImgsEl.innerHTML = '';
    state.gifts.forEach(gift => {
      if (gift.imageUrl) {
        const img = document.createElement('img');
        img.src         = gift.imageUrl;
        img.alt         = gift.name;
        img.crossOrigin = 'anonymous';
        giftImgsEl.appendChild(img);
      }
    });
    giftLabel.textContent  = state.giftLabel || '사은품 증정';
    giftEl.style.display   = '';
    giftPlus.style.display = '';
  } else {
    giftEl.style.display   = 'none';
    giftPlus.style.display = 'none';
  }
}

// ──────────────────────────────────────────
// 내보내기
// ──────────────────────────────────────────
async function exportImage(format) {
  const exportBtn = document.getElementById(format === 'jpg' ? 'exportJpg' : 'exportPng');
  exportBtn.disabled = true;
  exportBtn.textContent = '생성 중...';

  try {
    const thumbnail = document.getElementById('thumbnail');
    const scaler    = document.getElementById('thumbnailScaler');

    const prevTransform = scaler.style.transform;
    scaler.style.transform = 'scale(1)';

    const isHidif = thumbnail.classList.contains('template-hidif-tw');
    const isHK    = thumbnail.classList.contains('template-hk');
    const bgColor = (state.country === 'tw' || state.country === 'sg') ? '#f5f5f5' : '#ffffff';

    // 히디프: 배경색 강제 지정 + 노이즈 레이어 숨김
    if (isHidif) {
      thumbnail.style.backgroundColor = '#ffffff';
      thumbnail.classList.add('th-exporting');
    }

    // HK: CSS 그라데이션 테두리 제거 (캡처 후 Canvas에서 직접 그림)
    if (isHK) {
      thumbnail.style.border     = 'none';
      thumbnail.style.background = '#ffffff';
    }

    // 무료배송 뱃지 정보 저장 (캡처 후 post-processing용)
    const badge = document.getElementById('thShipping');
    let badgeInfo = null;
    if (badge && badge.style.display !== 'none') {
      badgeInfo = {
        x: badge.offsetLeft,
        y: badge.offsetTop,
        w: badge.offsetWidth,
        h: badge.offsetHeight,
        color: isHK ? '#ffc410' : '#ffda2a',
      };
    }

    await new Promise(r => requestAnimationFrame(r));

    const canvas = await html2canvas(thumbnail, {
      width:           1000,
      height:          1000,
      scale:           1,
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: bgColor,
      logging:         false,
    });

    scaler.style.transform = prevTransform;

    // DOM 복원
    if (isHidif) {
      thumbnail.style.backgroundColor = '';
      thumbnail.classList.remove('th-exporting');
    }
    if (isHK) {
      thumbnail.style.border     = '';
      thumbnail.style.background = '';
    }

    // ── Post-processing ──────────────────────────────
    const ctx = canvas.getContext('2d');

    // 1) 무료배송 뱃지 → 육각형 clip
    if (badgeInfo) {
      const { x, y, w, h, color } = badgeInfo;
      const pts = [[0.5,0],[0.933,0.25],[0.933,0.75],[0.5,1],[0.067,0.75],[0.067,0.25]];

      // 뱃지 내용(아이콘+텍스트 포함)을 임시 캔버스에 복사
      const tmp = document.createElement('canvas');
      tmp.width  = w;
      tmp.height = h;
      tmp.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);

      // 메인 캔버스에서 뱃지 영역을 배경색으로 덮음 (사각형 제거)
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);

      // 육각형 영역만 clip 후 뱃지 내용 복원
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + pts[0][0]*w, y + pts[0][1]*h);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i][0]*w, y + pts[i][1]*h);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(tmp, x, y);
      ctx.restore();
    }

    // 2) HK 그라데이션 테두리 → Canvas에 직접 그림
    if (isHK) {
      const grad = ctx.createLinearGradient(0, 0, 1000, 1000);
      grad.addColorStop(0, '#FF5001');
      grad.addColorStop(1, '#C20116');
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 11;
      ctx.strokeRect(5.5, 5.5, 989, 989);
    }
    // ────────────────────────────────────────────────

    const countryLabel = { tw: '대만', hk: '홍콩', sg: '싱가포르' };
    const productLabel = state.products.length > 0 ? state.products[0].name : '썸네일';
    const filename     = `${productLabel}_${countryLabel[state.country]}_1000x1000.${format}`;

    const a    = document.createElement('a');
    a.href     = format === 'jpg'
      ? canvas.toDataURL('image/jpeg', 0.95)
      : canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  } catch (err) {
    alert('내보내기 실패: ' + err.message);
    console.error(err);
  } finally {
    const btn = document.getElementById(format === 'jpg' ? 'exportJpg' : 'exportPng');
    btn.disabled   = false;
    btn.innerHTML  = `<img src="assets/download-icon.png" class="btn-dl-icon" alt=""> ${format.toUpperCase()}`;
  }
}

// ──────────────────────────────────────────
// 프리뷰 스케일
// ──────────────────────────────────────────
function updateScale() {
  const container = document.getElementById('previewContainer');
  const scaler    = document.getElementById('thumbnailScaler');
  const w = container.clientWidth  - 40;
  const h = container.clientHeight - 40;
  const scale = Math.min(w / 1000, h / 1000, 1);
  scaler.style.transform = `scale(${scale})`;
}

// ──────────────────────────────────────────
// Init
// ──────────────────────────────────────────
async function init() {
  // 토글 그룹
  setupToggleGroup('countryGroup',  'country');
  setupToggleGroup('shippingGroup', 'shipping');
  setupToggleGroup('bundleGroup',   'bundle');

  // 브랜드 토글 (국가 노출 연동)
  const brandGroup = document.getElementById('brandGroup');
  brandGroup.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      brandGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.brand = btn.dataset.value;
      updateCountryByBrand();
      updateThumbnail();
    });
  });

  // 할인율
  document.getElementById('discountInput').addEventListener('input', e => {
    state.discount = parseInt(e.target.value) || 0;
    updateThumbnail();
  });

  function refreshProductChips() {
    renderSelectedChips('selectedProducts', state.products, idx => {
      state.products.splice(idx, 1);
      refreshProductChips();
      updateThumbnail();
    });
  }

  function refreshGiftChips() {
    renderSelectedChips('selectedGifts', state.gifts, idx => {
      state.gifts.splice(idx, 1);
      refreshGiftChips();
      updateThumbnail();
    });
  }

  // 제품 검색 (중복 선택)
  setupSearch('productSearch', 'productDropdown', product => {
    state.products.push(product);
    refreshProductChips();
    updateThumbnail();
  });

  // 사은품 검색 (전체 브랜드, 중복 선택)
  setupSearch('giftSearch', 'giftDropdown', gift => {
    state.gifts.push(gift);
    refreshGiftChips();
    updateThumbnail();
  }, searchAllProducts);

  // 사은품 텍스트
  document.getElementById('giftLabelInput').addEventListener('input', e => {
    state.giftLabel = e.target.value;
    updateThumbnail();
  });

  // 내보내기
  document.getElementById('exportJpg').addEventListener('click', () => exportImage('jpg'));
  document.getElementById('exportPng').addEventListener('click', () => exportImage('png'));

  // 스케일
  window.addEventListener('resize', updateScale);
  updateScale();

  // 초기 렌더
  updateThumbnail();

  // 데이터 로드
  await loadProducts();
}

document.addEventListener('DOMContentLoaded', init);
