/**
 * BiblioCores - Gerador de Paletas de Cores para Biblioteca
 * JS Principal - Cálculos de harmonia, atualizações do DOM e controle do Mockup
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // Elementos do DOM - Inputs & Controladores
  const baseColorPicker = document.getElementById('baseColorPicker');
  const baseColorHex = document.getElementById('baseColorHex');
  const colorPreviewCircle = document.getElementById('colorPreviewCircle');
  const harmonySelector = document.getElementById('harmonySelector');
  const saturationRange = document.getElementById('saturationRange');
  const saturationValue = document.getElementById('saturationValue');
  const lightnessRange = document.getElementById('lightnessRange');
  const lightnessValue = document.getElementById('lightnessValue');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  // Elementos do DOM - Ações
  const savePaletteBtn = document.getElementById('savePaletteBtn');
  const exportCssBtn = document.getElementById('exportCssBtn');
  const savedPalettesList = document.getElementById('savedPalettesList');
  
  // Elementos do DOM - Grid & Preview
  const paletteGrid = document.getElementById('paletteGrid');
  const mockupFrame = document.getElementById('mockupFrame');
  const mockupLightBtn = document.getElementById('mockupLightBtn');
  const mockupDarkBtn = document.getElementById('mockupDarkBtn');
  
  // Elementos do DOM - Modal
  const exportModal = document.getElementById('exportModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalTabs = document.querySelectorAll('.modal-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const codeCss = document.getElementById('codeCss');
  const codeTailwind = document.getElementById('codeTailwind');
  const codeJson = document.getElementById('codeJson');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  
  // Elementos do DOM - Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Estado Global do App
  let currentPalette = {
    primary: '',
    secondary: '',
    accent: '',
    accent2: '', // Para Tétrade
    neutralLight: '',
    neutralDark: ''
  };

  /* ==========================================================================
     Funções Utilitárias de Cores (Conversões)
     ========================================================================== */

  // Converte HEX (#RRGGBB ou RRGGBB) para RGB
  function hexToRgb(hex) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // Converte RGB para HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // acromático
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // Converte HSL para HEX
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  }

  // Validador de Hex
  function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex) || /^[0-9A-F]{6}$/i.test(hex);
  }

  /* ==========================================================================
     Lógica de Geração de Paletas
     ========================================================================== */

  function generatePalette() {
    let hexValue = baseColorHex.value;
    if (!hexValue.startsWith('#')) {
      hexValue = '#' + hexValue;
    }
    
    if (!isValidHex(hexValue)) return;
    
    // Atualiza o color picker gráfico
    baseColorPicker.value = hexValue;
    colorPreviewCircle.style.backgroundColor = hexValue;

    // Converte para HSL
    const rgb = hexToRgb(hexValue);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Usa os valores dos sliders se o usuário modificou manualmente
    const s = parseInt(saturationRange.value);
    const l = parseInt(lightnessRange.value);
    const h = hsl.h;

    const harmony = harmonySelector.value;
    let pPrimary = hslToHex(h, s, l);
    let pSecondary = '';
    let pAccent = '';
    let pAccent2 = null; // Para tétrade

    switch (harmony) {
      case 'analogous':
        // Análoga: Cores vizinhas (H-30, H, H+30)
        pSecondary = hslToHex((h + 30) % 360, s, l);
        pAccent = hslToHex((h - 30 + 360) % 360, s, l);
        break;

      case 'complementary':
        // Complementar: Oposto na roda (H+180)
        pSecondary = hslToHex((h + 180) % 360, Math.max(15, s - 15), Math.min(85, l + 10)); // Complementar mais suave para suporte
        pAccent = hslToHex((h + 180) % 360, s, l); // Complementar vibrante
        break;

      case 'split':
        // Complementar dividida: Oposto +- 30 graus
        pSecondary = hslToHex((h + 150) % 360, s, l);
        pAccent = hslToHex((h + 210) % 360, s, l);
        break;

      case 'triadic':
        // Tríade: Três pontos equidistantes (+120, +240)
        pSecondary = hslToHex((h + 120) % 360, s, l);
        pAccent = hslToHex((h + 240) % 360, s, l);
        break;

      case 'monochromatic':
        // Monocromático: Variações de luminosidade e saturação
        pSecondary = hslToHex(h, Math.max(10, s - 25), Math.min(85, l + 20));
        pAccent = hslToHex(h, s, Math.max(15, l - 15));
        break;

      case 'tetradic':
        // Tétrade: Duas duplas de complementares (+90, +180, +270)
        pSecondary = hslToHex((h + 90) % 360, s, l);
        pAccent = hslToHex((h + 180) % 360, s, l);
        pAccent2 = hslToHex((h + 270) % 360, s, l);
        break;
    }

    // Cores neutras baseadas na matiz principal (Hue) para dar identidade de marca
    let pNeutralLight = hslToHex(h, 10, 97); // Off-white harmonizado
    let pNeutralDark = hslToHex(h, 15, 12);  // Grafite azulado/avermelhado harmonizado

    // Guarda no estado global
    currentPalette = {
      primary: pPrimary,
      secondary: pSecondary,
      accent: pAccent,
      accent2: pAccent2,
      neutralLight: pNeutralLight,
      neutralDark: pNeutralDark
    };

    renderPaletteCards();
    updateMockupColors();
  }

  /* ==========================================================================
     Renderização dos Elementos no DOM
     ========================================================================== */

  function renderPaletteCards() {
    paletteGrid.innerHTML = '';

    // Mapeamento de papéis e nomes das cores na paleta de UI
    const roles = [
      { name: 'Cor Primária', key: 'primary', desc: 'Identidade principal' },
      { name: 'Cor Secundária', key: 'secondary', desc: 'Suporte e links' },
      { name: 'Destaque (Accent)', key: 'accent', desc: 'Chamadas e alertas' },
    ];

    if (currentPalette.accent2) {
      roles.push({ name: 'Destaque Secundário', key: 'accent2', desc: 'Destaque extra' });
    }

    roles.push(
      { name: 'Neutro Claro', key: 'neutralLight', desc: 'Fundos claros' },
      { name: 'Neutro Escuro', key: 'neutralDark', desc: 'Textos e fundo escuro' }
    );

    roles.forEach(role => {
      const colorVal = currentPalette[role.key];
      const card = document.createElement('div');
      card.className = 'color-card';

      card.innerHTML = `
        <div class="color-card-block" style="background-color: ${colorVal};" data-hex="${colorVal}">
          <div class="color-card-copy-overlay">Copiar Hex</div>
        </div>
        <div class="color-card-info">
          <span class="color-card-role" title="${role.desc}">${role.name}</span>
          <div class="color-card-hex">
            <span>${colorVal}</span>
            <svg class="color-card-copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
        </div>
      `;

      // Evento de clique para copiar cor
      card.querySelector('.color-card-block').addEventListener('click', () => copyToClipboard(colorVal));
      card.querySelector('.color-card-copy-icon').addEventListener('click', () => copyToClipboard(colorVal));

      paletteGrid.appendChild(card);
    });
  }

  // Atualiza as variáveis CSS no Mockup
  function updateMockupColors() {
    const isDarkMode = mockupFrame.classList.contains('dark-mode');
    
    // Calcula valores RGB para transparências no mockup
    const primaryRgb = hexToRgb(currentPalette.primary);
    const secondaryRgb = hexToRgb(currentPalette.secondary);
    
    // Seta as variáveis CSS
    mockupFrame.style.setProperty('--lib-primary', currentPalette.primary);
    mockupFrame.style.setProperty('--lib-primary-hover', adjustColorLightness(currentPalette.primary, -15));
    mockupFrame.style.setProperty('--lib-secondary', currentPalette.secondary);
    mockupFrame.style.setProperty('--lib-accent', currentPalette.accent);
    
    mockupFrame.style.setProperty('--lib-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    mockupFrame.style.setProperty('--lib-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);

    if (isDarkMode) {
      mockupFrame.style.setProperty('--lib-bg-base', currentPalette.neutralDark);
      mockupFrame.style.setProperty('--lib-bg-card', adjustColorLightness(currentPalette.neutralDark, 4));
      mockupFrame.style.setProperty('--lib-text-base', '#f8fafc');
      mockupFrame.style.setProperty('--lib-text-muted', '#94a3b8');
      mockupFrame.style.setProperty('--lib-border', adjustColorLightness(currentPalette.neutralDark, 12));
    } else {
      mockupFrame.style.setProperty('--lib-bg-base', currentPalette.neutralLight);
      mockupFrame.style.setProperty('--lib-bg-card', '#ffffff');
      mockupFrame.style.setProperty('--lib-text-base', currentPalette.neutralDark);
      mockupFrame.style.setProperty('--lib-text-muted', adjustColorLightness(currentPalette.neutralDark, 25));
      mockupFrame.style.setProperty('--lib-border', adjustColorLightness(currentPalette.neutralLight, -5));
    }
  }

  // Escurece ou clareia um Hex para efeitos hover ou variações no mockup
  function adjustColorLightness(hex, percent) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let newL = hsl.l + percent;
    newL = Math.max(0, Math.min(100, newL));
    return hslToHex(hsl.h, hsl.s, newL);
  }

  /* ==========================================================================
     Eventos de Entrada (Inputs)
     ========================================================================== */

  // Ao mudar no color picker nativo
  baseColorPicker.addEventListener('input', (e) => {
    const hex = e.target.value.toUpperCase();
    baseColorHex.value = hex.replace('#', '');
    
    // Atualiza os sliders com base nas propriedades da cor escolhida
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    saturationRange.value = hsl.s;
    saturationValue.textContent = hsl.s + '%';
    lightnessRange.value = hsl.l;
    lightnessValue.textContent = hsl.l + '%';
    
    generatePalette();
  });

  // Ao digitar o código Hex manualmente
  baseColorHex.addEventListener('input', (e) => {
    let val = e.target.value;
    if (val.length === 6 && isValidHex(val)) {
      if (!val.startsWith('#')) val = '#' + val;
      
      const rgb = hexToRgb(val);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      saturationRange.value = hsl.s;
      saturationValue.textContent = hsl.s + '%';
      lightnessRange.value = hsl.l;
      lightnessValue.textContent = hsl.l + '%';
      
      generatePalette();
    }
  });

  // Slider de Saturação
  saturationRange.addEventListener('input', (e) => {
    saturationValue.textContent = e.target.value + '%';
    generatePalette();
  });

  // Slider de Luminosidade
  lightnessRange.addEventListener('input', (e) => {
    lightnessValue.textContent = e.target.value + '%';
    generatePalette();
  });

  // Alterar seletor de Harmonia
  harmonySelector.addEventListener('change', generatePalette);

  // Botões de presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      baseColorHex.value = color.replace('#', '');
      
      const rgb = hexToRgb(color);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      saturationRange.value = hsl.s;
      saturationValue.textContent = hsl.s + '%';
      lightnessRange.value = hsl.l;
      lightnessValue.textContent = hsl.l + '%';
      
      generatePalette();
    });
  });

  // Alternadores de Tema do Mockup (Claro / Escuro)
  mockupLightBtn.addEventListener('click', () => {
    mockupLightBtn.classList.add('active');
    mockupDarkBtn.classList.remove('active');
    mockupFrame.classList.remove('dark-mode');
    updateMockupColors();
  });

  mockupDarkBtn.addEventListener('click', () => {
    mockupDarkBtn.classList.add('active');
    mockupLightBtn.classList.remove('active');
    mockupFrame.classList.add('dark-mode');
    updateMockupColors();
  });

  /* ==========================================================================
     Lógica de Notificação e Cópia
     ========================================================================== */

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copiado: ${text}`);
    }).catch(err => {
      console.error('Falha ao copiar: ', err);
    });
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2500);
  }

  /* ==========================================================================
     Lógica de Exportação de Código (Modal)
     ========================================================================== */

  function generateExportCodes() {
    const isTetrade = !!currentPalette.accent2;

    // 1. Variáveis CSS
    let cssText = `:root {\n`;
    cssText += `  --color-primary: ${currentPalette.primary};\n`;
    cssText += `  --color-secondary: ${currentPalette.secondary};\n`;
    cssText += `  --color-accent: ${currentPalette.accent};\n`;
    if (isTetrade) {
      cssText += `  --color-accent-two: ${currentPalette.accent2};\n`;
    }
    cssText += `  --color-neutral-light: ${currentPalette.neutralLight};\n`;
    cssText += `  --color-neutral-dark: ${currentPalette.neutralDark};\n`;
    cssText += `}`;
    codeCss.textContent = cssText;

    // 2. Config Tailwind CSS
    let tailwindText = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n`;
    tailwindText += `        library: {\n`;
    tailwindText += `          primary: '${currentPalette.primary}',\n`;
    tailwindText += `          secondary: '${currentPalette.secondary}',\n`;
    tailwindText += `          accent: '${currentPalette.accent}',\n`;
    if (isTetrade) {
      tailwindText += `          accent2: '${currentPalette.accent2}',\n`;
    }
    tailwindText += `          light: '${currentPalette.neutralLight}',\n`;
    tailwindText += `          dark: '${currentPalette.neutralDark}',\n`;
    tailwindText += `        }\n      }\n    }\n  }\n}`;
    codeTailwind.textContent = tailwindText;

    // 3. JSON
    const jsonPalette = {
      primary: currentPalette.primary,
      secondary: currentPalette.secondary,
      accent: currentPalette.accent,
      neutralLight: currentPalette.neutralLight,
      neutralDark: currentPalette.neutralDark
    };
    if (isTetrade) {
      jsonPalette.accent2 = currentPalette.accent2;
    }
    codeJson.textContent = JSON.stringify(jsonPalette, null, 2);
  }

  // Abrir modal
  exportCssBtn.addEventListener('click', () => {
    generateExportCodes();
    exportModal.classList.add('open');
  });

  // Fechar modal
  closeModalBtn.addEventListener('click', () => {
    exportModal.classList.remove('open');
  });

  // Fechar clicando fora
  window.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      exportModal.classList.remove('open');
    }
  });

  // Tabs do Modal
  modalTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      modalTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const tabId = `tab-${tab.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Botão copiar dentro do modal
  copyCodeBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.modal-tab.active').dataset.tab;
    let textToCopy = '';
    if (activeTab === 'css') {
      textToCopy = codeCss.textContent;
    } else if (activeTab === 'tailwind') {
      textToCopy = codeTailwind.textContent;
    } else if (activeTab === 'json') {
      textToCopy = codeJson.textContent;
    }
    copyToClipboard(textToCopy);
  });

  /* ==========================================================================
     Lógica de Favoritos (Local Storage)
     ========================================================================== */

  // Salvar paleta atual
  savePaletteBtn.addEventListener('click', () => {
    let saved = JSON.parse(localStorage.getItem('saved_library_palettes') || '[]');
    
    // Evita duplicados
    const isDuplicate = saved.some(p => p.primary === currentPalette.primary && p.secondary === currentPalette.secondary && p.harmony === harmonySelector.value);
    
    if (isDuplicate) {
      showToast('Esta paleta já está nas suas favoritas!');
      return;
    }

    const paletteToSave = {
      id: Date.now(),
      primary: currentPalette.primary,
      secondary: currentPalette.secondary,
      accent: currentPalette.accent,
      accent2: currentPalette.accent2,
      neutralLight: currentPalette.neutralLight,
      neutralDark: currentPalette.neutralDark,
      harmony: harmonySelector.value
    };

    saved.push(paletteToSave);
    localStorage.setItem('saved_library_palettes', JSON.stringify(saved));
    loadSavedPalettes();
    showToast('Paleta salva com sucesso!');
  });

  // Carregar paletas salvas do LocalStorage
  function loadSavedPalettes() {
    let saved = JSON.parse(localStorage.getItem('saved_library_palettes') || '[]');
    savedPalettesList.innerHTML = '';

    if (saved.length === 0) {
      savedPalettesList.innerHTML = '<p class="empty-message">Nenhuma paleta salva ainda. Clique em "Salvar Paleta"!</p>';
      return;
    }

    saved.forEach(palette => {
      const item = document.createElement('div');
      item.className = 'saved-palette-item';
      
      const colorsMarkup = `
        <div class="saved-palette-colors" title="Harmonia: ${palette.harmony}">
          <div class="saved-palette-color-dot" style="background-color: ${palette.primary};"></div>
          <div class="saved-palette-color-dot" style="background-color: ${palette.secondary};"></div>
          <div class="saved-palette-color-dot" style="background-color: ${palette.accent};"></div>
          ${palette.accent2 ? `<div class="saved-palette-color-dot" style="background-color: ${palette.accent2};"></div>` : ''}
          <div class="saved-palette-color-dot" style="background-color: ${palette.neutralLight};"></div>
          <div class="saved-palette-color-dot" style="background-color: ${palette.neutralDark};"></div>
        </div>
      `;

      item.innerHTML = `
        ${colorsMarkup}
        <div class="saved-palette-actions">
          <button class="icon-btn load" title="Carregar Paleta">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button class="icon-btn delete" title="Remover Paleta">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      // Evento: Carregar paleta salva
      item.querySelector('.load').addEventListener('click', () => {
        baseColorHex.value = palette.primary.replace('#', '');
        harmonySelector.value = palette.harmony;
        
        const rgb = hexToRgb(palette.primary);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        saturationRange.value = hsl.s;
        saturationValue.textContent = hsl.s + '%';
        lightnessRange.value = hsl.l;
        lightnessValue.textContent = hsl.l + '%';
        
        generatePalette();
        showToast('Paleta favoritada carregada com sucesso!');
      });

      // Evento: Excluir paleta salva
      item.querySelector('.delete').addEventListener('click', () => {
        let currentSaved = JSON.parse(localStorage.getItem('saved_library_palettes') || '[]');
        currentSaved = currentSaved.filter(p => p.id !== palette.id);
        localStorage.setItem('saved_library_palettes', JSON.stringify(currentSaved));
        loadSavedPalettes();
        showToast('Paleta removida dos favoritos.');
      });

      savedPalettesList.appendChild(item);
    });
  }

  /* ==========================================================================
     Inicialização do Aplicativo
     ========================================================================== */

  // Inicializa paleta
  generatePalette();
  // Carrega favoritas
  loadSavedPalettes();

});
