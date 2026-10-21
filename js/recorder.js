// Self-contained recording controls; remove this script and its panel to retire the tool.
const zoomRecorder = { active: null, downloadUrl: null, focus: null };

function recordingZoomAt(start, end, fraction, easing = 'smooth', loop = false) {
  let t = Math.max(0, Math.min(1, fraction));
  if (loop) t = t <= 0.5 ? 2 * t : 2 * (1 - t);
  if (t === 0) return start;
  if (t === 1) return end;
  const progress = easing === 'smooth' ? (1 - Math.cos(Math.PI * t)) / 2 : t;
  return Math.exp(Math.log(start) + (Math.log(end) - Math.log(start)) * progress);
}

function recordingFrameFraction(index, count, loop) {
  if (!loop) return index / (count - 1);
  // Include the exact turning point even when there is an even number of frames.
  const turn = Math.floor((count - 1) / 2);
  return index <= turn ? index / (2 * turn) : 0.5 + (index - turn) / (2 * (count - 1 - turn));
}

function recorderField(name) { return document.getElementById('recorder-' + name); }

function recorderStatus(message) { recorderField('status').textContent = message; }

function recorderOptions() {
  const scale = (width - shift) / 1000;
  let start = Number(recorderField('start').value) / scale;
  let end = Number(recorderField('end').value) / scale;
  const duration = Number(recorderField('duration').value);
  const fps = Number(recorderField('fps').value);
  if (![start, end, duration, fps].every(Number.isFinite)
    || start < 1 - 1e-10 || end < 1 - 1e-10 || start > MAX_SCROLL_VALUE * (1 + 1e-10) || end > MAX_SCROLL_VALUE * (1 + 1e-10)) {
    throw new Error('Choose spans between ' + scale.toPrecision(4) + ' and ' + (scale * MAX_SCROLL_VALUE).toPrecision(4) + ' years.');
  }
  start = Math.max(1, Math.min(MAX_SCROLL_VALUE, start));
  end = Math.max(1, Math.min(MAX_SCROLL_VALUE, end));
  if (duration < 1 || duration > 120 || ![15, 30, 60].includes(fps)) throw new Error('Choose 1–120 seconds and 15, 30 or 60 fps.');
  return { start, end, duration, fps, loop: recorderField('loop').checked,
    easing: recorderField('easing').value, format: recorderField('format').value };
}

function recorderUseView(endpoint) {
  recorderField(endpoint).value = ((width - shift) * scrollValue / 1000).toPrecision(12);
}

function toggleRecorder() {
  const panel = document.getElementById('zoom-recorder');
  if (zoomRecorder.active) return;
  if (!panel.hidden) {
    panel.hidden = true;
    zoomRecorder.focus?.focus({ preventScroll: true });
    return;
  }
  if (!data.length || startupError) return;
  zoomRecorder.focus = document.activeElement;
  closeTimelineDetails();
  document.getElementById('about-data').close();
  if (!recorderField('start').value) {
    recorderUseView('start');
    recorderField('end').value = Math.max((width - shift) / 1000, (width - shift) * scrollValue / 100000).toPrecision(12);
  }
  panel.hidden = false;
  recorderField('start').focus();
}

function recorderStop() {
  const run = zoomRecorder.active;
  if (!run) return;
  run.stopped = true;
  run.finishAnimation?.();
}

function recorderPaint(run, fraction) {
  if (run.source.width !== run.sourceWidth || run.source.height !== run.sourceHeight) {
    throw new Error('Window size changed. Keep its size fixed during export.');
  }
  setZoom(recordingZoomAt(run.options.start, run.options.end, fraction, run.options.easing, run.options.loop));
  data[0].rectY = panelTargetY(0);
  data[selectedData].rectY = panelTargetY(1);
  redraw();
  run.context.drawImage(run.source, 0, run.cropY, run.sourceWidth, run.sourceHeight - run.cropY,
    0, 0, run.output.width, run.output.height);
}

function recorderAnimate(run) {
  return new Promise((resolve, reject) => {
    let start = null, last = -Infinity, frame;
    run.finishAnimation = () => { cancelAnimationFrame(frame); resolve(); };
    const tick = now => {
      try {
        if (run.stopped) { resolve(); return; }
        if (start === null) start = now;
        const fraction = Math.min(1, (now - start) / (run.options.duration * 1000));
        if (now - last >= 1000 / run.options.fps || fraction === 1) {
          recorderPaint(run, fraction);
          recorderStatus((run.preview ? 'Preview ' : 'Recording ') + Math.round(fraction * 100) + '%');
          last = now;
        }
        if (fraction === 1) { resolve(); return; }
        frame = requestAnimationFrame(tick);
      } catch (error) { reject(error); }
    };
    frame = requestAnimationFrame(tick);
  });
}

function recorderPng(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode a PNG frame.')), 'image/png'));
}

function recorderYield(run) {
  return new Promise(resolve => {
    const frame = requestAnimationFrame(() => { run.finishAnimation = null; resolve(); });
    run.finishAnimation = () => { cancelAnimationFrame(frame); run.finishAnimation = null; resolve(); };
  });
}

async function recorderFrames(run) {
  const frames = [], count = Math.max(2, Math.round(run.options.duration * run.options.fps));
  let bytes = 0;
  for (let index = 0; index < count && !run.stopped; index++) {
    recorderPaint(run, recordingFrameFraction(index, count, run.options.loop));
    const blob = await recorderPng(run.output);
    bytes += blob.size;
    if (bytes > 256 * 1024 * 1024) throw new Error('Frames exceed 256 MB. Use video, a shorter duration or a smaller window.');
    frames.push({ name: 'frame-' + String(index + 1).padStart(6, '0') + '.png', blob });
    recorderStatus('Frames ' + (index + 1) + ' / ' + count);
    await recorderYield(run);
  }
  if (!frames.length) return null;
  frames.push({ name: 'settings.json', blob: new Blob([JSON.stringify({
    fps: run.options.fps, frames: frames.length, requestedDuration: run.options.duration,
    startSpanYears: run.options.start * (width - shift) / 1000,
    endSpanYears: run.options.end * (width - shift) / 1000,
    lastSpanYears: scrollValue * (width - shift) / 1000,
    duration: frames.length / run.options.fps, referenceYear: currentYear,
    easing: run.options.easing, loop: run.options.loop, stoppedEarly: run.stopped,
    width: run.output.width, height: run.output.height, dataset: data[selectedData].displayName
  }, null, 2)], { type: 'application/json' }) });
  recorderStatus('Packing PNG frames…');
  return { blob: await recorderZip(frames), extension: 'zip' };
}

async function loadRecordingEncoder() { return import('../vendor/mediabunny/mediabunny.min.mjs'); }

async function recorderVideo(run) {
  if (typeof VideoEncoder === 'undefined') throw new Error('Video export needs WebCodecs on HTTPS or localhost. Choose PNG frames instead.');
  recorderStatus('Preparing video encoder…');
  const { Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat, CanvasSource, Quality,
    getFirstEncodableVideoCodec } = await loadRecordingEncoder();
  const quality = new Quality('high');
  const codec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'vp8'], {
    width: run.output.width, height: run.output.height, frameRate: run.options.fps, quality
  });
  if (!codec) throw new Error('No video encoder supports this size. Try a smaller window or PNG frames.');
  const mp4 = codec === 'avc', target = new BufferTarget();
  const output = new Output({ target, format: mp4 ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat() });
  const source = new CanvasSource(run.output, { codec, quality, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: run.options.fps });
  let added = 0;
  try {
    await output.start();
    const count = Math.max(2, Math.round(run.options.duration * run.options.fps));
    for (let index = 0; index < count && !run.stopped; index++) {
      recorderPaint(run, recordingFrameFraction(index, count, run.options.loop));
      await source.add(index / run.options.fps, 1 / run.options.fps);
      added++;
      recorderStatus('Video frames ' + added + ' / ' + count);
      await recorderYield(run);
    }
    if (!added) { await output.cancel(); return null; }
    recorderStatus('Finishing video…');
    await output.finalize();
    return { blob: new Blob([target.buffer], { type: mp4 ? 'video/mp4' : 'video/webm' }), extension: mp4 ? 'mp4' : 'webm' };
  } catch (error) {
    if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel();
    throw error;
  }
}

async function startZoomRecording(preview = false) {
  if (zoomRecorder.active) return;
  let run;
  try {
    if (!data.length || startupError) throw new Error('Wait for the charts to load.');
    const options = recorderOptions();
    const source = document.querySelector('canvas');
    const output = document.createElement('canvas');
    const cropY = Math.round(chartHeaderHeight() * source.height / height);
    output.width = Math.floor(source.width / 2) * 2;
    output.height = Math.floor((source.height - cropY) / 2) * 2;
    if (!output.width || !output.height) throw new Error('The chart is too small to record.');
    run = { options, source, sourceWidth: source.width, sourceHeight: source.height,
      output, context: output.getContext('2d'), cropY, preview, stopped: false,
      saved: { zoom: scrollValue, cursor: showCursor, looping: isLooping() } };
    zoomRecorder.active = run;
    document.getElementById('recorder-guard').hidden = false;
    document.getElementById('zoom-recorder').hidden = false;
    recorderField('form').querySelectorAll('input, select, button').forEach(control => { control.disabled = true; });
    recorderField('stop').disabled = false;
    recorderField('download').hidden = true;
    closeTimelineDetails();
    document.getElementById('about-data').close();
    mouseReleased();
    resetChartTouch();
    showCursor = false;
    noLoop();
    let result = null;
    if (preview) { recorderPaint(run, 0); await recorderAnimate(run); }
    else if (options.format === 'frames') result = await recorderFrames(run);
    else result = await recorderVideo(run);
    if (result) {
      if (zoomRecorder.downloadUrl) URL.revokeObjectURL(zoomRecorder.downloadUrl);
      zoomRecorder.downloadUrl = URL.createObjectURL(result.blob);
      const link = recorderField('download');
      link.href = zoomRecorder.downloadUrl;
      link.download = 'the-record-' + new Date().toISOString().slice(0, 19).replaceAll(':', '-') + '.' + result.extension;
      link.textContent = 'Save ' + (result.extension === 'zip' ? 'PNG frames (.zip)' : 'video (.' + result.extension + ')');
      link.hidden = false;
    }
    recorderStatus(preview ? (run.stopped ? 'Preview stopped.' : 'Preview finished.')
      : run.stopped ? (result ? 'Stopped. Save the partial recording below.' : 'Stopped before any frames were saved.')
        : 'Finished. Save your recording below.');
  } catch (error) {
    recorderStatus(error.message || String(error));
  } finally {
    if (run) {
      run.output.remove();
      showCursor = run.saved.cursor;
      setZoom(run.saved.zoom);
      zoomRecorder.active = null;
      document.getElementById('recorder-guard').hidden = true;
      recorderField('form').querySelectorAll('input, select, button').forEach(control => { control.disabled = false; });
      recorderField('stop').disabled = true;
      if (run.saved.looping) loop();
      redrawRequested = true;
      redraw();
    }
  }
}

async function recorderZip(files) {
  const table = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
    return value >>> 0;
  });
  const parts = [], directory = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name), bytes = new Uint8Array(await file.blob.arrayBuffer());
    let crc = 0xffffffff;
    for (const byte of bytes) crc = table[(crc ^ byte) & 255] ^ crc >>> 8;
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = new Uint8Array(30), view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(12, 33, true);
    view.setUint32(14, crc, true); view.setUint32(18, bytes.length, true); view.setUint32(22, bytes.length, true);
    view.setUint16(26, name.length, true);
    parts.push(header, name, file.blob);
    const entry = new Uint8Array(46), central = new DataView(entry.buffer);
    central.setUint32(0, 0x02014b50, true); central.setUint16(4, 20, true); central.setUint16(6, 20, true);
    central.setUint16(14, 33, true); central.setUint32(16, crc, true);
    central.setUint32(20, bytes.length, true); central.setUint32(24, bytes.length, true);
    central.setUint16(28, name.length, true); central.setUint32(42, offset, true);
    directory.push(entry, name);
    offset += header.length + name.length + bytes.length;
  }
  const size = directory.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true);
  endView.setUint32(12, size, true); endView.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: 'application/zip' });
}

function initializeZoomRecorder() {
  const panel = document.getElementById('zoom-recorder');
  const guard = document.getElementById('recorder-guard');
  for (const name of ['pointerdown', 'mousedown', 'touchstart', 'wheel', 'keydown']) {
    for (const element of [panel, guard]) element.addEventListener(name, input => input.stopPropagation());
  }
  recorderField('close').addEventListener('click', () => { if (zoomRecorder.active) recorderStop(); else toggleRecorder(); });
  recorderField('stop').addEventListener('click', recorderStop);
  recorderField('preview').addEventListener('click', () => { if (recorderField('form').reportValidity()) startZoomRecording(true); });
  recorderField('form').addEventListener('submit', input => { input.preventDefault(); startZoomRecording(); });
  panel.querySelectorAll('[data-recorder-view]').forEach(button => button.addEventListener('click', () => recorderUseView(button.dataset.recorderView)));
  window.addEventListener('keydown', input => {
    if (zoomRecorder.active) {
      input.preventDefault();
      input.stopImmediatePropagation();
      if (input.key === 'Escape') recorderStop();
    } else if (input.key === 'Escape' && !panel.hidden) {
      input.preventDefault(); input.stopImmediatePropagation(); toggleRecorder();
    } else if (input.shiftKey && input.code === 'KeyR' && !input.ctrlKey && !input.metaKey && !input.altKey && !input.repeat) {
      input.preventDefault(); input.stopImmediatePropagation(); toggleRecorder();
    }
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) recorderStop(); });
}

if (typeof window !== 'undefined') initializeZoomRecorder();
