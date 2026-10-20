let mouseZoomDrag = null;

function selectComparison(upperIndex) {
  if (!data[upperIndex] || upperIndex < 1) return;
  selectedData = upperIndex;
  updateComparisonControls();
  redrawRequested = true;
}

function updateComparisonControls() {
  if (typeof document === 'undefined') return;
  for (const button of document.querySelectorAll?.('[data-comparison]') || []) {
    const index = Number(button.dataset.comparison);
    const selected = index === selectedData;
    button.disabled = !data[index] || Boolean(startupError);
    button.setAttribute('aria-pressed', String(selected));
    button.style.color = selected ? data[index]?.c?.toString() || '' : '';
  }
  const canvas = document.querySelector?.('canvas');
  if (canvas && data[selectedData]) {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', data[selectedData].displayName + ' compared with global temperature on a shared linear time axis');
  }
}

function initializeControls() {
  const infoButton = document.getElementById('data-info-button');
  const guide = document.getElementById('about-data');
  const buttons = [...document.querySelectorAll('[data-comparison]')];
  for (const button of [...buttons, infoButton]) {
    // Native controls own their pointer and activation keys, keeping chart input separate.
    for (const eventName of ['pointerdown', 'mousedown', 'touchstart', 'wheel']) {
      button.addEventListener(eventName, event => event.stopPropagation());
    }
    button.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
    });
  }
  for (const [index, button] of buttons.entries()) {
    button.addEventListener('click', () => selectComparison(Number(button.dataset.comparison)));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      event.stopPropagation();
      buttons[next].focus();
      selectComparison(Number(buttons[next].dataset.comparison));
    });
  }
  infoButton.addEventListener('click', showDataGuide);
  guide.addEventListener('click', event => {
    if (event.target !== guide) return;
    const bounds = guide.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) guide.close();
  });
  guide.addEventListener('close', () => { redrawRequested = true; });
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', repeatKeyboardZoom);
    window.addEventListener('pointerup', mouseReleased);
    window.addEventListener('pointercancel', mouseReleased);
    window.addEventListener('blur', mouseReleased);
    document.addEventListener('visibilitychange', () => { if (document.hidden) mouseReleased(); });
  }
  initializeTimelineControls();
  updateComparisonControls();
}

function showDataGuide() {
  if (typeof document === 'undefined') return;
  const guide = document.getElementById('about-data');
  if (guide && !guide.open) {
    mouseReleased();
    closeTimelineDetails();
    resetChartTouch();
    guide.showModal();
  }
}

function dataGuideIsOpen() {
  return typeof document !== 'undefined' && document.getElementById('about-data')?.open;
}

function setZoom(value) {
  if (!Number.isFinite(value)) return;
  if (timelineDetailsEvent && !timelineDetailsPinned) closeTimelineDetails();
  scrollValue = constrain(value, 1, MAX_SCROLL_VALUE);
  redrawRequested = true;
}

function repeatKeyboardZoom(input) {
  // p5 ignores repeated keydown events; let the browser's key repeat drive zoom.
  if (input.repeat && ['+', '-', 'a', 'A', 'd', 'D', 'ArrowLeft', 'ArrowRight'].includes(input.key)) {
    keyPressed(input);
  }
}

function keyPressed(input) {
  if (dataGuideIsOpen() || input?.defaultPrevented || input?.ctrlKey || input?.metaKey || input?.altKey) return;
  const pressedKey = input?.key ?? key;
  let direction = 0;
  if (pressedKey === '-' || pressedKey === 'a' || pressedKey === 'A' || pressedKey === 'ArrowLeft') direction = 1;
  if (pressedKey === '+' || pressedKey === 'd' || pressedKey === 'D' || pressedKey === 'ArrowRight') direction = -1;
  if (direction) {
    setZoom(scrollValue + direction * (1 + scrollValue / 50));
    input?.preventDefault();
    return false;
  }
  const presets = [10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 14000000000];
  if (/^[0-9]$/.test(key)) setZoom(presets[Number(key)]);
  if (key === 'C' || key === 'c' || key === ' ') { showCursor = !showCursor; redrawRequested = true; }
}

function mousePressed() {
  mouseReleased();
  if (dataGuideIsOpen()) return;
  if (mouseButton === RIGHT) { showCursor = !showCursor; redrawRequested = true; }
  if (mouseButton === LEFT && !chartTouchMode) {
    mouseZoomDrag = { startX: mouseX, startY: mouseY, horizontal: null, direction: 0, edge: 0, elapsed: 0 };
  }
}

function mouseReleased() {
  mouseZoomDrag = null;
}

function advanceMouseEdgeZoom(elapsedMs) {
  if (!mouseZoomDrag) return;
  if (!mouseIsPressed || chartTouchMode || dataGuideIsOpen()) {
    mouseReleased();
    return;
  }
  const margin = Math.min(MOUSE_EDGE_ZOOM_MARGIN, width / 10);
  let edge = 0;
  if (mouseZoomDrag.horizontal && mouseY > chartHeaderHeight() && mouseY < height) {
    if (mouseX <= margin && mouseZoomDrag.direction < 0) edge = -1;
    else if (mouseX >= width - margin && mouseZoomDrag.direction > 0) edge = 1;
  }
  if (edge !== mouseZoomDrag.edge || !edge) {
    mouseZoomDrag.edge = edge;
    mouseZoomDrag.elapsed = 0;
  }
  if (!edge) return;
  const previous = mouseZoomDrag.elapsed;
  mouseZoomDrag.elapsed += Math.max(0, Math.min(100, elapsedMs || 0));
  const activeMs = Math.max(0, mouseZoomDrag.elapsed - MOUSE_EDGE_ZOOM_DELAY_MS)
    - Math.max(0, previous - MOUSE_EDGE_ZOOM_DELAY_MS);
  if (!activeMs) return;
  const strength = constrain(edge < 0 ? (margin - mouseX) / margin : (mouseX - width + margin) / margin, 0, 1);
  setZoom(scrollValue * Math.pow(2, edge * strength * activeMs / MOUSE_EDGE_ZOOM_DOUBLING_MS));
}

function mouseWheel(event) {
  if (dataGuideIsOpen()) return true;
  // Opposite wheel movements undo one another, even for large trackpad deltas.
  const wheelSteps = event.delta / 100;
  const zoomFactor = Math.pow(1.25, wheelSteps);

  const newScrollValue = scrollValue * zoomFactor;
  setZoom(newScrollValue);

  return false;
}

function mouseMoved() {
  // p5 can update its previous-pointer coordinates before the next draw.
  // Explicitly invalidate the settled view so hover text always follows input.
  redrawRequested = true;
}

function zoomByHorizontalDrag(deltaX, x) {
  let zoomDivisor;
  if (x < width - 200) zoomDivisor = width - x - shift;
  else zoomDivisor = 200;
  zoomDivisor = max(10, abs(zoomDivisor));
  setZoom(scrollValue + deltaX * (scrollValue / zoomDivisor));
}

function mouseDragged() {
  if (dataGuideIsOpen()) return;
  if (mouseZoomDrag) {
    const dx = mouseX - mouseZoomDrag.startX, dy = mouseY - mouseZoomDrag.startY;
    if (mouseZoomDrag.horizontal === null && Math.hypot(dx, dy) >= 6) {
      mouseZoomDrag.horizontal = Math.abs(dx) >= Math.abs(dy);
    }
    if (mouseX !== pmouseX) mouseZoomDrag.direction = Math.sign(mouseX - pmouseX);
  }
  zoomByHorizontalDrag(mouseX - pmouseX, mouseX);
}

function windowResized() {
  resizeChartViewport();
}
