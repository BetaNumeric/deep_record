const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  const fields = new Map(), controls = [{disabled:false},{disabled:false}];
  for (const [name,value] of Object.entries({start:'1265',end:'12.65',duration:'2',fps:'30',easing:'smooth',format:'video'})) {
    fields.set('recorder-'+name,{value});
  }
  for (const name of ['status','stop','download']) fields.set('recorder-'+name,{});
  fields.set('recorder-loop',{checked:false});
  fields.set('recorder-form',{querySelectorAll:()=>controls});
  fields.set('recorder-guard',{hidden:true});
  fields.set('zoom-recorder',{hidden:false});
  fields.set('about-data',{close(){}});
  const source = {width:800,height:600,getBoundingClientRect:()=>({left:0,top:0,width:1280,height:600})};
  let removed = 0;
  const output = {remove(){removed++;},getContext:()=>({drawImage(){}})};
  const frames = new Map(); let nextFrame = 0;
  const context = vm.createContext({
    Blob, TextEncoder, URL, performance:{now:()=>0}, setTimeout, width:1280,height:600,shift:15,MAX_SCROLL_VALUE:15000000000,
    scrollValue:25,showCursor:true,selectedData:1,redrawRequested:false,startupError:null,
    data:[{}, {displayName:'Atmospheric CO₂'}],currentYear:2026,
    document:{body:{append(){}},getElementById:id=>fields.get(id),querySelector:()=>source,createElement:()=>output},
    chartHeaderHeight:()=>50,panelTargetY:position=>position===0 ? 300 : 50,
    looping:true,isLooping:()=>context.looping,noLoop:()=>{context.looping=false;},loop:()=>{context.looping=true;},
    maximumZoom:()=>context.MAX_SCROLL_VALUE*Math.max(1,1000/Math.max(1,context.width-context.shift)),
    setZoom:value=>{context.scrollValue=value;},redraw(){},mouseReleased(){},resetChartTouch(){},closeTimelineDetails(){},
    requestAnimationFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},
    cancelAnimationFrame:id=>frames.delete(id),
    VideoEncoder:class {}
  });
  vm.runInContext(fs.readFileSync('js/recorder.js','utf8'),context);
  return {context,fields,source,controls,frames,removed:()=>removed,run:code=>vm.runInContext(code,context)};
}

async function finishRecording(app, job, fps) {
  for (let turns=0;app.run('zoomRecorder.active') && turns<200;turns++) {
    await new Promise(resolve=>setImmediate(resolve));
    for (const [id,callback] of [...app.frames]) {app.frames.delete(id);callback(turns*1000/fps);}
  }
  assert.equal(app.run('zoomRecorder.active'),null,'recording finishes');
  await job;
}

test('recording interpolation keeps exact endpoints, is monotonic and supports both directions', () => {
  const app=harness();
  for (const [start,end] of [[1,1e10],[1e10,1]]) for (const easing of ['smooth','steady']) {
    assert.equal(app.context.recordingZoomAt(start,end,0,easing),start);
    assert.equal(app.context.recordingZoomAt(start,end,1,easing),end);
    const values=Array.from({length:101},(_,index)=>app.context.recordingZoomAt(start,end,index/100,easing));
    assert.ok(values.every((value,index)=>value>0 && (!index || (end>start ? value>=values[index-1] : value<=values[index-1]))));
    assert.ok(Math.abs(app.context.recordingZoomAt(start,end,0.5,easing)-1e5)<1e-8);
  }
  assert.equal(app.context.recordingZoomAt(100,10000,0,'steady'),100);
  assert.ok(Math.abs(app.context.recordingZoomAt(100,10000,0.25,'steady')/100-Math.sqrt(10))<1e-10);
});

test('loop motion returns smoothly through the same scales with an exact turning point at every frame rate', () => {
  const app=harness();
  for (const [start,end] of [[1,1e10],[1e10,1]]) for (const easing of ['smooth','steady']) {
    const zoom=fraction=>app.context.recordingZoomAt(start,end,fraction,easing,true);
    assert.equal(zoom(0),start);
    assert.equal(zoom(0.5),end);
    assert.equal(zoom(1),start);
    for (let index=0;index<=50;index++) assert.ok(Math.abs(Math.log(zoom(index/100)/zoom(1-index/100)))<1e-12);
    for (const count of [15,30,60]) {
      const values=Array.from({length:count},(_,index)=>zoom(app.context.recordingFrameFraction(index,count,true)));
      const turn=Math.floor((count-1)/2);
      assert.equal(values[0],start); assert.equal(values[turn],end); assert.equal(values.at(-1),start);
      assert.ok(values.every((value,index)=>!index || (index<=turn ? (end>start ? value>=values[index-1] : value<=values[index-1])
        : (end>start ? value<=values[index-1] : value>=values[index-1]))));
    }
  }
});

test('recording validates spans and duration and preserves legitimate zoom limits after rounding', () => {
  const app=harness();
  const options=app.context.recorderOptions();
  assert.ok(Math.abs(options.start-1000)<1e-9); assert.ok(Math.abs(options.end-10)<1e-9);
  assert.equal(options.loop,false);
  app.fields.get('recorder-loop').checked=true;
  assert.equal(app.context.recorderOptions().loop,true);
  app.fields.get('recorder-start').value='0';
  assert.throws(()=>app.context.recorderOptions(),/Choose spans/);
  app.fields.get('recorder-start').value=String(1.265*(1-1e-12));
  assert.equal(app.context.recorderOptions().start,1);
  app.fields.get('recorder-duration').value='0';
  assert.throws(()=>app.context.recorderOptions(),/seconds/);
  app.fields.get('recorder-duration').value='2';
  app.fields.get('recorder-fps').value='1000';
  assert.throws(()=>app.context.recorderOptions(),/fps/);
});

test('recording accepts cosmic spans on a phone and rejects spans beyond the viewport zoom limit', () => {
  const app=harness();app.context.width=375;
  app.fields.get('recorder-start').value='13800000000';
  const options=app.context.recorderOptions();
  assert.ok(options.start>app.context.MAX_SCROLL_VALUE);
  assert.equal(options.start*(375-15)/1000,13800000000);
  app.fields.get('recorder-start').value='15000000000';
  assert.equal(app.context.recorderOptions().start,app.context.maximumZoom());
  app.fields.get('recorder-start').value='15100000000';
  assert.throws(()=>app.context.recorderOptions(),/Choose spans/);
});

test('PNG archive has standard ZIP headers, known CRCs, numbered filenames and offsets', async () => {
  const app=harness();
  const blob=await app.context.recorderZip([{name:'frame-000001.png',blob:new Blob(['123456789'])},
    {name:'settings.json',blob:new Blob(['{}'])}]);
  const bytes=Buffer.from(await blob.arrayBuffer());
  assert.equal(blob.type,'application/zip');
  assert.equal(bytes.readUInt32LE(0),0x04034b50);
  assert.equal(bytes.readUInt32LE(14),0xcbf43926);
  assert.equal(bytes.readUInt16LE(8),0);
  const nameLength=bytes.readUInt16LE(26);
  assert.equal(bytes.toString('utf8',30,30+nameLength),'frame-000001.png');
  const end=bytes.length-22, directory=bytes.readUInt32LE(end+16);
  assert.equal(bytes.readUInt32LE(end),0x06054b50);
  assert.equal(bytes.readUInt16LE(end+10),2);
  assert.equal(bytes.readUInt32LE(directory),0x02014b50);
  assert.equal(bytes.readUInt32LE(directory+42),0);
});

test('encoder startup failure restores the view, cursor, animation and controls without hanging', async () => {
  const app=harness();
  app.run('loadRecordingEncoder=async()=>{throw new Error("Encoder unavailable");}');
  await app.context.startZoomRecording();
  assert.match(app.fields.get('recorder-status').textContent,/Encoder unavailable/);
  assert.equal(app.run('zoomRecorder.active'),null);
  assert.equal(app.context.scrollValue,25);
  assert.equal(app.context.showCursor,true);
  assert.equal(app.context.looping,true);
  assert.equal(app.fields.get('recorder-guard').hidden,true);
  assert.ok(app.controls.every(control=>!control.disabled));
  assert.equal(app.removed(),1);
});

test('stopping a preview cancels pending animation and preserves an originally paused chart', async () => {
  const app=harness(); app.context.looping=false;
  const recording=app.context.startZoomRecording(true);
  assert.equal(app.run('zoomRecorder.active !== null'),true);
  assert.equal(app.context.showCursor,false);
  assert.equal(app.frames.size,1);
  app.context.recorderStop();
  await recording;
  assert.equal(app.frames.size,0);
  assert.equal(app.context.looping,false);
  assert.equal(app.context.showCursor,true);
  assert.equal(app.context.scrollValue,25);
  assert.match(app.fields.get('recorder-status').textContent,/Preview stopped/);
});

test('loop preview uses the selected duration for the full outward and return motion', async () => {
  const app=harness();
  app.fields.get('recorder-loop').checked=true;
  const job=app.context.startZoomRecording(true);
  for (const [time,expectedZoom] of [[0,1000],[1000,10],[2000,1000]]) {
    assert.equal(app.frames.size,1);
    const [id,callback]=[...app.frames][0]; app.frames.delete(id); callback(time);
    assert.ok(Math.abs(app.context.scrollValue-expectedZoom)<1e-8);
  }
  await job;
  assert.equal(app.context.scrollValue,25);
  assert.equal(app.frames.size,0);
});

test('PNG loop exports both endpoints, returns to the start and records the loop setting', async () => {
  const app=harness();
  app.fields.get('recorder-format').value='frames';
  app.fields.get('recorder-loop').checked=true;
  app.fields.get('recorder-duration').value='1';
  app.context.exportedFiles=null;
  app.run(`recorderPng=async()=>new Blob([String(scrollValue)]);
    recorderZip=async files=>{exportedFiles=files;return new Blob(['archive']);}`);
  await finishRecording(app,app.context.startZoomRecording(),30);
  const files=app.context.exportedFiles;
  assert.equal(files.length,31);
  assert.ok(Math.abs(Number(await files[0].blob.text())-1000)<1e-8);
  assert.ok(Math.abs(Number(await files[14].blob.text())-10)<1e-8);
  assert.ok(Math.abs(Number(await files[29].blob.text())-1000)<1e-8);
  const settings=JSON.parse(await files.at(-1).blob.text());
  assert.equal(settings.loop,true); assert.equal(settings.frames,30); assert.equal(settings.duration,1);
  assert.equal(settings.startSpanYears,settings.lastSpanYears);
  assert.notEqual(settings.endSpanYears,settings.lastSpanYears);
  URL.revokeObjectURL(app.run('zoomRecorder.downloadUrl'));
});

test('a pending PNG frame yield can stop immediately and a resized source is rejected', async () => {
  const app=harness();
  const run={stopped:false}; app.context.exportRun=run;
  app.run('zoomRecorder.active=exportRun');
  const yielded=app.context.recorderYield(run);
  app.context.recorderStop(); await yielded;
  assert.equal(run.stopped,true); assert.equal(app.frames.size,0);
  assert.throws(()=>app.context.recorderPaint({source:app.source,sourceWidth:2,sourceHeight:2},0.5),/Window size changed/);
});

for (const loop of [false,true]) for (const fps of [15,30]) test(`video encoding submits every frame with exact timing and endpoints (${fps} fps, loop ${loop})`, async () => {
  const app=harness(), encoded=[];
  app.fields.get('recorder-duration').value='1';
  app.fields.get('recorder-fps').value=String(fps);
  app.fields.get('recorder-loop').checked=loop;
  app.context.encoder={
    Quality:class {}, BufferTarget:class {}, Mp4OutputFormat:class {}, WebMOutputFormat:class {},
    getFirstEncodableVideoCodec:async()=> 'avc',
    Output:class {
      constructor({target}){this.target=target;this.state='pending';}
      addVideoTrack(){}
      async start(){this.state='started';}
      async finalize(){this.target.buffer=new Uint8Array([1,2,3]);this.state='finalized';}
      async cancel(){this.state='canceled';}
    },
    CanvasSource:class {async add(timestamp,duration){encoded.push({timestamp,duration,zoom:app.context.scrollValue});}}
  };
  app.run('loadRecordingEncoder=async()=>encoder');
  await finishRecording(app,app.context.startZoomRecording(),fps);
  assert.equal(encoded.length,fps);
  assert.ok(Math.abs(encoded[0].zoom-1000)<1e-8);
  assert.ok(Math.abs(encoded.at(-1).zoom-(loop ? 1000 : 10))<1e-8);
  if (loop) assert.ok(Math.abs(encoded[Math.floor((fps-1)/2)].zoom-10)<1e-8);
  encoded.forEach((frame,index)=>{
    assert.equal(frame.timestamp,index/fps);
    assert.equal(frame.duration,1/fps);
  });
  assert.equal(app.run('zoomRecorder.active'),null);
  assert.equal(app.context.scrollValue,25);
  assert.equal(app.fields.get('recorder-download').hidden,false);
  URL.revokeObjectURL(app.run('zoomRecorder.downloadUrl'));
});
