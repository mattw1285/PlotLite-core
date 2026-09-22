const map = L.map('map').setView([54.5,-2.5],6);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{y}/{x}',
    {
        maxZoom:19,
        attribution:'Tiles &copy; OpenStreetMap'
    }
).addTo(map);

map.pm.addControls({
  position:'topleft',
  drawMarker:true,
  drawPolyline:true,
  drawPolygon:true,
  drawRectangle:true,
  drawCircle:false,
  drawCircleMarker:false,
  drawText:false,
  editMode:true,
  dragMode:true,
  cutPolygon:false,
  removalMode:true,
  rotateMode:false
});

let project = {name:'Untitled',layers:[]};
let activeLayerId=null;
let selected={layerId:null,featureId:null};
let rendered=new Map();
let undoStack=[];
let redoStack=[];

function uid(){return crypto.randomUUID ? crypto.randomUUID() : Date.now()+'-'+Math.random()}
function clone(x){return JSON.parse(JSON.stringify(x))}
function color(){
  const a=['#2563eb','#16a34a','#dc2626','#9333ea','#ea580c','#0891b2','#ca8a04'];
  return a[Math.floor(Math.random()*a.length)]
}
function activeLayer(){return project.layers.find(x=>x.id===activeLayerId)}
function layerById(id){return project.layers.find(x=>x.id===id)}

function snapshot(){
  undoStack.push(clone(project));
  if(undoStack.length>50) undoStack.shift();
  redoStack=[];
}
function restore(p){
  project=clone(p);
  activeLayerId=project.layers[0]?.id||null;
  selected={layerId:null,featureId:null};
  render();
}

function undo(){
  if(!undoStack.length)return;
  redoStack.push(clone(project));
  restore(undoStack.pop());
}
function redo(){
  if(!redoStack.length)return;
  undoStack.push(clone(project));
  restore(redoStack.pop());
}

function addLayer(name){
  if(!name){
    name=prompt('Layer name','New Layer');
    if(!name)return;
  }
  const l={id:uid(),name:name.trim(),visible:true,color:color(),features:[]};
  project.layers.push(l);
  activeLayerId=l.id;
  snapshot();
  render();
}

function renderLayers(){
  const el=document.getElementById('layers');
  el.innerHTML='';
  project.layers.forEach(l=>{
    const row=document.createElement('div');
    row.className='layer '+(l.id===activeLayerId?'selected':'');
    row.onclick=()=>{activeLayerId=l.id;renderLayers();updateStatus()};

    const sw=document.createElement('span');
    sw.className='swatch';sw.style.background=l.color;

    const name=document.createElement('span');
    name.className='layer-name';name.textContent=l.name;

    const eye=document.createElement('button');
    eye.textContent=l.visible?'◉':'○';
    eye.title='Visibility';
    eye.onclick=e=>{
      e.stopPropagation();l.visible=!l.visible;renderMap();renderLayers();
    };

    const del=document.createElement('button');
    del.textContent='×';del.title='Delete layer';
    del.onclick=e=>{
      e.stopPropagation();
      if(project.layers.length===1){alert('Keep at least one layer.');return}
      if(!confirm('Delete "'+l.name+'"?'))return;
      project.layers=project.layers.filter(x=>x.id!==l.id);
      activeLayerId=project.layers[0].id;
      selected={layerId:null,featureId:null};
      snapshot();render();
    };

    row.append(sw,name,eye,del);el.appendChild(row);
  });
  document.getElementById('layer-count').textContent=project.layers.length;
}

function featureStyle(l){
  return {color:l.color,weight:2,fillOpacity:.25};
}

function renderMap(){
  rendered.forEach(x=>map.removeLayer(x));
  rendered.clear();

  project.layers.forEach(l=>{
    if(!l.visible)return;
    const group=L.geoJSON(
      {type:'FeatureCollection',features:l.features},
      {
        style:()=>featureStyle(l),
        pointToLayer:(f,ll)=>L.circleMarker(ll,{
          radius:7,color:l.color,fillColor:l.color,fillOpacity:.85,weight:2
        }),
        onEachFeature:(f,leaf)=>{
          leaf.on('click',e=>{
            L.DomEvent.stopPropagation(e);
            selected={layerId:l.id,featureId:f.id};
            activeLayerId=l.id;
            renderLayers();renderProperties();renderMap();
          });
        }
      }
    );
    group.addTo(map);
    rendered.set(l.id,group);

    if(selected.layerId===l.id){
      group.eachLayer(leaf=>{
        if(leaf.feature?.id===selected.featureId){
          if(leaf.setStyle)leaf.setStyle({color:'#ff0000',weight:4,fillOpacity:.35});
          if(leaf.setRadius)leaf.setRadius(9);
        }
      });
    }
  });
  updateStatus();
}

function renderProperties(){
  const box=document.getElementById('properties');
  box.innerHTML='';
  const l=layerById(selected.layerId);
  const f=l?.features.find(x=>x.id===selected.featureId);
  if(!f){box.innerHTML='<div class="muted">Click a feature to edit its properties.</div>';return}

  const info=document.createElement('div');
  info.className='muted';
  info.innerHTML='<b>'+f.geometry.type+'</b><br>Layer: '+escape(l.name);
  box.appendChild(info);

  const props=f.properties||{};
  Object.keys(props).forEach(k=>{
    const wrap=document.createElement('div');wrap.className='field';
    const lab=document.createElement('label');lab.textContent=k;
    const inp=document.createElement('input');inp.value=props[k]??'';inp.dataset.key=k;
    wrap.append(lab,inp);box.appendChild(wrap);
  });

  const add=document.createElement('button');
  add.textContent='+ Add property';add.style.width='100%';
  add.onclick=()=>{
    const k=prompt('Property name','name');
    if(!k?.trim()||Object.prototype.hasOwnProperty.call(props,k.trim()))return;
    props[k.trim()]='';renderProperties();
  };
  box.appendChild(add);

  const actions=document.createElement('div');actions.className='actions';
  const save=document.createElement('button');save.textContent='Save';save.className='active';
  save.onclick=()=>{
    box.querySelectorAll('input[data-key]').forEach(i=>props[i.dataset.key]=i.value);
    snapshot();renderMap();renderProperties();
  };
  const del=document.createElement('button');del.textContent='Delete';
  del.onclick=deleteSelected;
  actions.append(save,del);box.appendChild(actions);
}

function deleteSelected(){
  const l=layerById(selected.layerId);
  if(!l)return;
  if(!confirm('Delete selected feature?'))return;
  l.features=l.features.filter(f=>f.id!==selected.featureId);
  selected={layerId:null,featureId:null};
  snapshot();render();
}

map.on('pm:create',e=>{
  const l=activeLayer();
  if(!l){map.removeLayer(e.layer);alert('Select a layer first.');return}
  const f=e.layer.toGeoJSON();
  f.id=uid();f.properties={};
  l.features.push(f);
  map.removeLayer(e.layer);
  selected={layerId:l.id,featureId:f.id};
  snapshot();render();
});

map.on('pm:edit',()=>{
  /*
   * Geoman edits are reconciled by matching geometry bounds/selection
   * on the next refresh. For robust editing, use the feature editor
   * by selecting a feature and then enabling Geoman edit mode.
   */
  syncSelectedGeometry();
});

function syncSelectedGeometry(){
  const l=layerById(selected.layerId);
  const f=l?.features.find(x=>x.id===selected.featureId);
  const group=rendered.get(selected.layerId);
  if(!f||!group)return;

  group.eachLayer(leaf=>{
    if(leaf.feature?.id===f.id && leaf.toGeoJSON){
      f.geometry=leaf.toGeoJSON().geometry;
    }
  });
  snapshot();renderMap();
}

map.on('click',()=>{selected={layerId:null,featureId:null};renderProperties();renderMap()});

map.on('mousemove',e=>{
  document.getElementById('coords').textContent=
    e.latlng.lat.toFixed(5)+', '+e.latlng.lng.toFixed(5);
});

function exportGeoJSON(){
  const fc={
    type:'FeatureCollection',
    features:project.layers.flatMap(l=>l.features)
  };
  download('plotlite.geojson',JSON.stringify(fc,null,2),'application/geo+json');
}

function importGeoJSON(data,name){
  let fs=[];
  if(data.type==='FeatureCollection')fs=data.features||[];
  else if(data.type==='Feature')fs=[data];
  else throw Error('Not valid GeoJSON');

  const l={
    id:uid(),
    name:(name||'Imported').replace(/\.(geo)?json$/i,''),
    visible:true,color:color(),features:[]
  };
  fs.forEach(f=>{
    const x=clone(f);
    x.id=x.id||uid();
    x.properties=x.properties||{};
    l.features.push(x);
  });
  project.layers.push(l);activeLayerId=l.id;

  const tmp=L.geoJSON(data);
  if(tmp.getBounds().isValid())map.fitBounds(tmp.getBounds(),{padding:[30,30]});
  snapshot();render();
}

document.getElementById('file').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    try{importGeoJSON(JSON.parse(r.result),file.name)}
    catch(err){alert('Import failed: '+err.message)}
  };
  r.readAsText(file);e.target.value='';
});

function saveLocal(){
  localStorage.setItem('plotlite-project',JSON.stringify(project));
  alert('Saved in this browser.');
}
function loadLocal(){
  const x=localStorage.getItem('plotlite-project');
  if(!x){alert('No saved project.');return}
  try{project=JSON.parse(x);activeLayerId=project.layers[0]?.id||null;selected={layerId:null,featureId:null};render()}
  catch(e){alert('Could not load saved project.')}
}
function newProject(){
  if(project.layers.some(l=>l.features.length)&&!confirm('Start a new project?'))return;
  project={name:'Untitled',layers:[]};selected={layerId:null,featureId:null};
  addLayer('Features');
  map.setView([54.5,-2.5],6);
}
function download(name,text,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function escape(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function updateStatus(){
  const n=project.layers.reduce((a,l)=>a+l.features.length,0);
  document.getElementById('count').textContent=n+' feature'+(n===1?'':'s');
  document.getElementById('active').textContent='Layer: '+(activeLayer()?.name||'—');
}
function render(){renderLayers();renderMap();renderProperties();updateStatus()}

addLayer('Features');
render();
