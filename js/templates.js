/**
 * templates.js
 * 브랜드/국가별 템플릿 설정
 * 새 템플릿 추가 시 이 배열에 항목을 추가하고
 * css/style.css 에 .thumbnail.template-{id} 스타일을 추가하세요.
 */

const TEMPLATES = [
  // ─── 한국 ───────────────────────────────────────────────
  {
    id: 'kr_minimal',
    name: 'KR 미니멀',
    country: '한국',
    brand: 'Brand KR-A',
    description: '순백 배경의 미니멀 감성 — 고급스럽고 깔끔한 한국형',
    previewBg: '#F5F5F5',
    previewAccent: '#E8856A',
    defaultColors: {
      bg: '#FFFFFF',
      accent: '#E8856A',
      text: '#1A1A1A',
      sub: '#888888',
    },
    layout: 'centered',   // 레이아웃 타입 (CSS 에서 구현)
  },
  {
    id: 'kr_bold',
    name: 'KR 볼드',
    country: '한국',
    brand: 'Brand KR-B',
    description: '다크 배경 + 골드 포인트 — 강렬하고 트렌디한 한국형',
    previewBg: '#111111',
    previewAccent: '#F0C040',
    defaultColors: {
      bg: '#111111',
      accent: '#F0C040',
      text: '#FFFFFF',
      sub: '#AAAAAA',
    },
    layout: 'bold',
  },

  // ─── 일본 ───────────────────────────────────────────────
  {
    id: 'jp_sakura',
    name: 'JP 사쿠라',
    country: '일본',
    brand: 'Brand JP',
    description: '체리블라썸 감성의 소프트 핑크 — 섬세하고 우아한 일본형',
    previewBg: '#FDE8F0',
    previewAccent: '#C4708A',
    defaultColors: {
      bg: '#FDF0F5',
      accent: '#C4708A',
      text: '#3A1A28',
      sub: '#9A6070',
    },
    layout: 'split',
  },

  // ─── 미국 ───────────────────────────────────────────────
  {
    id: 'us_fresh',
    name: 'US 프레시',
    country: '미국',
    brand: 'Brand US',
    description: '활기차고 자연친화적 그린 — 에너지 넘치는 미국형',
    previewBg: '#D4EDDA',
    previewAccent: '#2E7D32',
    defaultColors: {
      bg: '#E8F5E9',
      accent: '#2E7D32',
      text: '#1B4020',
      sub: '#4CAF50',
    },
    layout: 'dynamic',
  },

  // ─── 중국 ───────────────────────────────────────────────
  {
    id: 'cn_luxury',
    name: 'CN 럭셔리',
    country: '중국',
    brand: 'Brand CN',
    description: '딥 레드 + 골드 테두리 — 프리미엄 럭셔리 중국형',
    previewBg: '#1A0800',
    previewAccent: '#C9A84C',
    defaultColors: {
      bg: '#180600',
      accent: '#C9A84C',
      text: '#F5E6C8',
      sub: '#C9A84C',
    },
    layout: 'luxury',
  },

  // ─── 유럽 ───────────────────────────────────────────────
  {
    id: 'eu_classic',
    name: 'EU 클래식',
    country: '유럽',
    brand: 'Brand EU',
    description: '딥 네이비 + 크림 — 클래식하고 세련된 유럽형',
    previewBg: '#1B2A4A',
    previewAccent: '#E8D5B7',
    defaultColors: {
      bg: '#1B2A4A',
      accent: '#E8D5B7',
      text: '#F0E8D8',
      sub: '#B0A090',
    },
    layout: 'classic',
  },
];
