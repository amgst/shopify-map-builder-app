// Load OpenLayers CSS and JS
if (!document.querySelector('link[href*="openlayers"]')) {
  const olCSS = document.createElement('link');
  olCSS.rel = 'stylesheet';
  olCSS.href = 'https://cdn.jsdelivr.net/npm/ol@v8.2.0/ol.css';
  document.head.appendChild(olCSS);
}

if (!window.ol) {
  const olJS = document.createElement('script');
  olJS.src = 'https://cdn.jsdelivr.net/npm/ol@v8.2.0/dist/ol.js';
  olJS.onload = () => initAllMapBuilders();
  document.head.appendChild(olJS);
} else {
  initAllMapBuilders();
}

// Customer-facing Map Builder JavaScript
class MapBuilder {
  constructor(blockId) {
    this.blockId = blockId;
    this.config = window.mapBuilderConfig[blockId];
    this.map = null;
    this.capturedImage = null;
    this.currentZoom = 12;
    this.currentCenter = [-74.006, 40.7128]; // NYC default
    this.overlays = [];
    this.history = [];
    this.historyIndex = -1;
    this.draggedElement = null;
    
    this.init();
  }

  init() {
    this.initMap();
    this.bindEvents();
  }

  initMap() {
    const mapElement = document.getElementById(`map-${this.blockId}`);
    if (!mapElement || !window.ol) return;

    // Create OpenLayers map
    this.map = new ol.Map({
      target: `map-${this.blockId}`,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat(this.currentCenter),
        zoom: this.currentZoom
      }),
      controls: []
    });

    // Apply engraving-style filter
    mapElement.style.filter = 'grayscale(100%) contrast(150%) brightness(0.8)';
    
    // Ensure map fits container
    setTimeout(() => {
      this.map.updateSize();
    }, 100);
  }

  bindEvents() {
    // Product type change
    const productSelect = document.getElementById(`product-type-${this.blockId}`);
    if (productSelect) {
      productSelect.addEventListener('change', () => this.updateMapAspectRatio());
    }

    // Orientation change
    const orientationSelect = document.getElementById(`orientation-${this.blockId}`);
    if (orientationSelect) {
      orientationSelect.addEventListener('change', () => this.updateMapAspectRatio());
    }

    // Zoom controls
    const zoomIn = document.querySelector(`#map-builder-${this.blockId} .zoom-in`);
    const zoomOut = document.querySelector(`#map-builder-${this.blockId} .zoom-out`);
    
    if (zoomIn) zoomIn.addEventListener('click', () => this.zoomIn());
    if (zoomOut) zoomOut.addEventListener('click', () => this.zoomOut());

    // Compass toggle
    const compassBtn = document.getElementById(`add-compass-${this.blockId}`);
    if (compassBtn) {
      compassBtn.addEventListener('click', () => this.toggleCompass());
    }

    // Capture map
    const captureBtn = document.getElementById(`capture-map-${this.blockId}`);
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.captureMap());
    }

    // Location search
    const searchBtn = document.getElementById(`search-btn-${this.blockId}`);
    const searchInput = document.getElementById(`location-search-${this.blockId}`);
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchLocation());
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.searchLocation();
      });
    }

    // Add text
    const addTextBtn = document.getElementById(`add-text-${this.blockId}`);
    if (addTextBtn) {
      addTextBtn.addEventListener('click', () => this.addText());
    }

    // Icon buttons
    const iconBtns = document.querySelectorAll(`#map-builder-${this.blockId} .icon-btn`);
    iconBtns.forEach(btn => {
      btn.addEventListener('click', () => this.addIcon(btn.dataset.icon));
    });

    // Undo/Redo
    const undoBtn = document.getElementById(`undo-${this.blockId}`);
    const redoBtn = document.getElementById(`redo-${this.blockId}`);
    const clearBtn = document.getElementById(`clear-all-${this.blockId}`);
    
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());

    // Add to cart
    const addToCartBtn = document.getElementById(`add-to-cart-${this.blockId}`);
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => this.addToCart());
    }
  }

  updateMapAspectRatio() {
    // Keep map at fixed height for better UX, aspect ratio only affects final capture
    if (this.map) {
      setTimeout(() => this.map.updateSize(), 100);
    }
  }

  zoomIn() {
    if (this.map) {
      const view = this.map.getView();
      const zoom = view.getZoom();
      view.setZoom(zoom + 1);
    }
  }

  zoomOut() {
    if (this.map) {
      const view = this.map.getView();
      const zoom = view.getZoom();
      view.setZoom(zoom - 1);
    }
  }



  captureMap() {
    if (!this.map) return;

    this.map.once('rendercomplete', () => {
      const mapCanvas = this.map.getViewport().querySelector('canvas');
      const canvas = document.getElementById(`preview-canvas-${this.blockId}`);
      const ctx = canvas.getContext('2d');
      
      // Get selected product dimensions
      const productType = document.getElementById(`product-type-${this.blockId}`).value;
      const orientation = document.getElementById(`orientation-${this.blockId}`).value;
      
      let aspectRatio = this.getAspectRatio(productType, orientation);
      
      // Set canvas size for 300 DPI (3600x1374 for 2.62:1 at 12x4.57 inches)
      const baseWidth = 3600;
      canvas.width = baseWidth;
      canvas.height = Math.round(baseWidth / aspectRatio);
      
      // Create high-contrast black and white map
      this.renderBlackWhiteMap(ctx, mapCanvas, canvas.width, canvas.height);
      
      // Add all overlays with proper scaling
      this.renderOverlays(ctx, canvas.width, canvas.height);
      
      // Convert to true black and white (no grays)
      this.convertToTrueBlackWhite(ctx, canvas.width, canvas.height);
      
      // Add all overlays
      this.overlays.forEach(overlay => {
        if (overlay.type === 'text') {
          ctx.font = `bold 48px ${overlay.font || 'Arial'}`;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.fillStyle = '#000000';
          
          const rect = overlay.element.getBoundingClientRect();
          const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) / containerRect.width * canvas.width;
          const y = (rect.top - containerRect.top) / containerRect.height * canvas.height;
          
          ctx.textAlign = 'left';
          ctx.strokeText(overlay.text, x, y + 40);
          ctx.fillText(overlay.text, x, y + 40);
        } else if (overlay.type === 'compass') {
          const rect = overlay.element.getBoundingClientRect();
          const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) / containerRect.width * canvas.width + 20;
          const y = (rect.top - containerRect.top) / containerRect.height * canvas.height + 20;
          
          this.drawCompass(ctx, x, y);
        } else if (overlay.type === 'icon') {
          ctx.font = '48px Arial';
          ctx.fillStyle = '#000000';
          
          const rect = overlay.element.getBoundingClientRect();
          const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) / containerRect.width * canvas.width;
          const y = (rect.top - containerRect.top) / containerRect.height * canvas.height;
          
          ctx.fillText(overlay.icon, x, y + 40);
        }
      });
      
      // Generate high-quality JPEG (8-30MB range)
      this.capturedImage = canvas.toDataURL('image/jpeg', 0.98);
      
      // Create cart preview image (smaller, optimized)
      this.createCartPreview();
      
      // Create engraved product mockup
      this.createEngravedPreview();
      
      // Show preview section and canvases
      const previewSection = document.getElementById(`preview-${this.blockId}`);
      const previewCanvas = document.getElementById(`preview-canvas-${this.blockId}`);
      const engravedCanvas = document.getElementById(`engraved-canvas-${this.blockId}`);
      
      previewSection.style.display = 'block';
      previewCanvas.style.display = 'block';
      engravedCanvas.style.display = 'block';
      
      // Log file size for verification
      const sizeInMB = (this.capturedImage.length * 0.75) / (1024 * 1024);
      console.log(`Generated map: ${canvas.width}x${canvas.height}, ${sizeInMB.toFixed(1)}MB`);
    });
    
    this.map.renderSync();
  }
  
  getAspectRatio(productType, orientation) {
    let ratio = 2.62; // Standard
    
    switch(productType) {
      case 'twig': ratio = 4.0; break;
      case 'circle': ratio = 1.0; break;
      case 'stick': ratio = 2.62; break;
      default: ratio = 2.62;
    }
    
    return orientation === 'portrait' && productType !== 'circle' ? 1 / ratio : ratio;
  }
  
  renderBlackWhiteMap(ctx, mapCanvas, width, height) {
    // Fill with black background (water/engraved areas)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    if (!mapCanvas) return;
    
    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Draw and process map
    tempCtx.drawImage(mapCanvas, 0, 0, width, height);
    
    // Get image data for pixel manipulation
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Convert to high-contrast black/white
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Aggressive threshold for land vs water
      const isLand = luminance > 120; // Adjust threshold as needed
      
      if (isLand) {
        // Land = White (not engraved)
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        // Water = Black (engraved)
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
    
    // Put processed image back
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  
  renderOverlays(ctx, width, height) {
    const scaleFactor = width / 800; // Scale from display size to print size
    
    this.overlays.forEach(overlay => {
      if (overlay.type === 'text') {
        this.renderText(ctx, overlay, scaleFactor, width, height);
      } else if (overlay.type === 'compass') {
        this.renderCompass(ctx, overlay, scaleFactor, width, height);
      } else if (overlay.type === 'icon') {
        this.renderIcon(ctx, overlay, scaleFactor, width, height);
      }
    });
  }
  
  renderText(ctx, overlay, scale, canvasWidth, canvasHeight) {
    const rect = overlay.element.getBoundingClientRect();
    const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
    
    const x = (rect.left - containerRect.left) / containerRect.width * canvasWidth;
    const y = (rect.top - containerRect.top) / containerRect.height * canvasHeight;
    
    const fontSize = Math.max(48, 24 * scale);
    ctx.font = `bold ${fontSize}px ${overlay.font || 'Arial'}`;
    
    // White stroke for visibility on dark areas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(6, 3 * scale);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    
    ctx.strokeText(overlay.text, x, y + fontSize * 0.8);
    ctx.fillText(overlay.text, x, y + fontSize * 0.8);
  }
  
  renderCompass(ctx, overlay, scale, canvasWidth, canvasHeight) {
    const rect = overlay.element.getBoundingClientRect();
    const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
    
    const x = (rect.left - containerRect.left) / containerRect.width * canvasWidth + (20 * scale);
    const y = (rect.top - containerRect.top) / containerRect.height * canvasHeight + (20 * scale);
    
    this.drawCompass(ctx, x, y, scale);
  }
  
  renderIcon(ctx, overlay, scale, canvasWidth, canvasHeight) {
    const rect = overlay.element.getBoundingClientRect();
    const containerRect = document.getElementById(`overlay-container-${this.blockId}`).getBoundingClientRect();
    
    const x = (rect.left - containerRect.left) / containerRect.width * canvasWidth;
    const y = (rect.top - containerRect.top) / containerRect.height * canvasHeight;
    
    const fontSize = Math.max(48, 32 * scale);
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, 2 * scale);
    
    ctx.strokeText(overlay.icon, x, y + fontSize * 0.8);
    ctx.fillText(overlay.icon, x, y + fontSize * 0.8);
  }
  
  convertToTrueBlackWhite(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Pure black or white only
      const isWhite = luminance > 127;
      
      data[i] = isWhite ? 255 : 0;
      data[i + 1] = isWhite ? 255 : 0;
      data[i + 2] = isWhite ? 255 : 0;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  drawCompass(ctx, x, y, scale = 1) {
    const radius = 40 * scale;
    
    // Compass circle (white with black border)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3 * (scale || 1);
    ctx.stroke();
    
    // North arrow
    const arrowSize = 8 * (scale || 1);
    ctx.beginPath();
    ctx.moveTo(x, y - radius + (10 * (scale || 1)));
    ctx.lineTo(x - arrowSize, y - (5 * (scale || 1)));
    ctx.lineTo(x, y - (15 * (scale || 1)));
    ctx.lineTo(x + arrowSize, y - (5 * (scale || 1)));
    ctx.closePath();
    ctx.fillStyle = '#000000';
    ctx.fill();
    
    // N letter
    ctx.font = `bold ${16 * (scale || 1)}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('N', x, y + radius - (8 * (scale || 1)));
  }
  
  async searchLocation() {
    const query = document.getElementById(`location-search-${this.blockId}`).value;
    if (!query.trim()) return;
    
    try {
      // Using Nominatim (OpenStreetMap) geocoding service
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lon = parseFloat(result.lon);
        const lat = parseFloat(result.lat);
        
        if (this.map) {
          const view = this.map.getView();
          view.setCenter(ol.proj.fromLonLat([lon, lat]));
          view.setZoom(14);
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for location. Please try again.');
    }
  }

  addText() {
    const textInput = document.getElementById(`custom-text-${this.blockId}`);
    const fontSelect = document.getElementById(`font-select-${this.blockId}`);
    const text = textInput.value.trim();
    
    if (!text) return;
    
    this.saveState();
    
    const textElement = document.createElement('div');
    textElement.className = 'draggable-element text-element';
    textElement.textContent = text;
    textElement.style.fontFamily = fontSelect.value;
    textElement.style.left = '50%';
    textElement.style.top = '80%';
    textElement.style.transform = 'translate(-50%, -50%)';
    
    this.makeDraggable(textElement);
    document.getElementById(`overlay-container-${this.blockId}`).appendChild(textElement);
    
    this.overlays.push({ type: 'text', element: textElement, text, font: fontSelect.value });
    textInput.value = '';
  }

  addIcon(icon) {
    this.saveState();
    
    const iconElement = document.createElement('div');
    iconElement.className = 'draggable-element icon-element';
    iconElement.textContent = icon;
    iconElement.style.left = '20%';
    iconElement.style.top = '20%';
    iconElement.style.fontSize = '24px';
    iconElement.style.width = '40px';
    iconElement.style.height = '40px';
    iconElement.style.display = 'flex';
    iconElement.style.alignItems = 'center';
    iconElement.style.justifyContent = 'center';
    
    this.makeDraggable(iconElement);
    document.getElementById(`overlay-container-${this.blockId}`).appendChild(iconElement);
    
    this.overlays.push({ type: 'icon', element: iconElement, icon });
  }

  toggleCompass() {
    const btn = document.getElementById(`add-compass-${this.blockId}`);
    const existing = this.overlays.find(o => o.type === 'compass');
    
    if (existing) {
      this.saveState();
      existing.element.remove();
      this.overlays = this.overlays.filter(o => o !== existing);
      btn.textContent = 'Add Compass';
    } else {
      this.saveState();
      
      const compassElement = document.createElement('div');
      compassElement.className = 'draggable-element compass-element';
      compassElement.textContent = '⧉';
      compassElement.style.left = '80%';
      compassElement.style.top = '20%';
      
      this.makeDraggable(compassElement);
      document.getElementById(`overlay-container-${this.blockId}`).appendChild(compassElement);
      
      this.overlays.push({ type: 'compass', element: compassElement });
      btn.textContent = 'Remove Compass';
    }
  }

  makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.draggedElement = element;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(element.style.left);
      startTop = parseInt(element.style.top);
      element.style.zIndex = '1001';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging || this.draggedElement !== element) return;
      
      const container = document.getElementById(`overlay-container-${this.blockId}`);
      const rect = container.getBoundingClientRect();
      
      const newLeft = ((startLeft * rect.width / 100) + (e.clientX - startX)) / rect.width * 100;
      const newTop = ((startTop * rect.height / 100) + (e.clientY - startY)) / rect.height * 100;
      
      element.style.left = Math.max(0, Math.min(95, newLeft)) + '%';
      element.style.top = Math.max(0, Math.min(95, newTop)) + '%';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging && this.draggedElement === element) {
        isDragging = false;
        this.draggedElement = null;
        element.style.zIndex = '1000';
      }
    });
  }

  saveState() {
    const state = {
      overlays: this.overlays.map(o => ({
        type: o.type,
        html: o.element.outerHTML,
        data: o
      }))
    };
    
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;
    
    if (this.history.length > 20) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  restoreState(state) {
    const container = document.getElementById(`overlay-container-${this.blockId}`);
    container.innerHTML = '';
    this.overlays = [];
    
    state.overlays.forEach(overlay => {
      const element = document.createElement('div');
      element.outerHTML = overlay.html;
      const newElement = container.lastElementChild;
      this.makeDraggable(newElement);
      this.overlays.push({ ...overlay.data, element: newElement });
    });
  }

  clearAll() {
    this.saveState();
    document.getElementById(`overlay-container-${this.blockId}`).innerHTML = '';
    this.overlays = [];
    document.getElementById(`add-compass-${this.blockId}`).textContent = 'Add Compass';
  }

  createCartPreview() {
    // Create smaller preview for cart display
    const cartCanvas = document.createElement('canvas');
    const cartCtx = cartCanvas.getContext('2d');
    const sourceCanvas = document.getElementById(`preview-canvas-${this.blockId}`);
    
    // Smaller size for cart (300x115 for 2.62:1)
    cartCanvas.width = 300;
    cartCanvas.height = Math.round(300 / this.getAspectRatio(
      document.getElementById(`product-type-${this.blockId}`).value,
      document.getElementById(`orientation-${this.blockId}`).value
    ));
    
    // Draw scaled down version
    cartCtx.drawImage(sourceCanvas, 0, 0, cartCanvas.width, cartCanvas.height);
    
    // Set as cart preview image
    const cartImg = document.getElementById(`cart-preview-${this.blockId}`);
    cartImg.src = cartCanvas.toDataURL('image/jpeg', 0.8);
    cartImg.style.display = 'block';
    
    // Store for cart
    this.cartPreviewImage = cartImg.src;
  }
  
  createEngravedPreview() {
    const engravedCanvas = document.getElementById(`engraved-canvas-${this.blockId}`);
    const engravedCtx = engravedCanvas.getContext('2d');
    const sourceCanvas = document.getElementById(`preview-canvas-${this.blockId}`);
    
    // Set canvas size to match wood base
    engravedCanvas.width = 400;
    engravedCanvas.height = 200;
    engravedCanvas.style.display = 'block';
    
    // Create engraved effect
    engravedCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    engravedCtx.fillRect(0, 0, engravedCanvas.width, engravedCanvas.height);
    
    // Draw map with engraved effect
    engravedCtx.globalCompositeOperation = 'screen';
    engravedCtx.drawImage(sourceCanvas, 0, 0, engravedCanvas.width, engravedCanvas.height);
    engravedCtx.globalCompositeOperation = 'source-over';
    
    // Add subtle wood grain effect
    const gradient = engravedCtx.createLinearGradient(0, 0, engravedCanvas.width, engravedCanvas.height);
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.1)');
    gradient.addColorStop(0.5, 'rgba(160, 82, 45, 0.05)');
    gradient.addColorStop(1, 'rgba(139, 69, 19, 0.1)');
    
    engravedCtx.fillStyle = gradient;
    engravedCtx.globalCompositeOperation = 'multiply';
    engravedCtx.fillRect(0, 0, engravedCanvas.width, engravedCanvas.height);
  }

  async addToCart() {
    if (!this.capturedImage) {
      alert('Please create your map first!');
      return;
    }

    try {
      // Get current product variant ID from the page
      const variantId = this.getProductVariantId();
      
      if (!variantId) {
        alert('Please select a product variant first.');
        return;
      }

      // Add to Shopify cart with custom properties
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', 1);
      formData.append('properties[Custom Map Image]', this.capturedImage);
      formData.append('properties[Cart Preview Image]', this.cartPreviewImage || this.capturedImage);
      formData.append('properties[Map Product Type]', document.getElementById(`product-type-${this.blockId}`).value);
      formData.append('properties[Map Orientation]', document.getElementById(`orientation-${this.blockId}`).value);
      formData.append('properties[Custom Elements]', JSON.stringify(this.overlays.map(o => ({
        type: o.type,
        text: o.text || '',
        icon: o.icon || '',
        font: o.font || 'Arial'
      }))));
      formData.append('properties[_Map Builder]', 'true');
      formData.append('properties[_Cart Image]', this.cartPreviewImage || '');

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Show success message with preview
        this.showCartSuccess();
        
        // Trigger cart drawer or redirect after delay
        setTimeout(() => {
          if (window.theme && window.theme.cartDrawer) {
            window.theme.cartDrawer.open();
          } else {
            window.location.href = '/cart';
          }
        }, 1500);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart. Please try again.');
    }
  }
  
  getProductVariantId() {
    // Try multiple methods to get variant ID
    
    // Method 1: From product form
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (productForm) {
      const variantInput = productForm.querySelector('select[name="id"], input[name="id"]');
      if (variantInput) {
        return variantInput.value;
      }
    }
    
    // Method 2: From variant selector
    const variantSelector = document.querySelector('.product-form__variants select, .variant-selector select');
    if (variantSelector) {
      return variantSelector.value;
    }
    
    // Method 3: From config (fallback)
    return this.config.variantId;
  }
  
  showCartSuccess() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    const cartImg = document.getElementById(`cart-preview-${this.blockId}`);
    if (cartImg) {
      const imgClone = cartImg.cloneNode();
      imgClone.style.cssText = 'width: 60px; height: auto; border-radius: 4px;';
      successDiv.appendChild(imgClone);
    }
    
    const textDiv = document.createElement('div');
    textDiv.innerHTML = '<strong>Added to Cart!</strong><br>Custom map product';
    successDiv.appendChild(textDiv);
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }
}

// Initialize all map builders
function initAllMapBuilders() {
  const mapBuilders = document.querySelectorAll('[id^="map-builder-"]');
  
  mapBuilders.forEach(element => {
    const blockId = element.id.replace('map-builder-', '');
    if (window.mapBuilderConfig && window.mapBuilderConfig[blockId]) {
      new MapBuilder(blockId);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.ol) {
    initAllMapBuilders();
  }
});