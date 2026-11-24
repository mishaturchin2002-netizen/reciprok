const viewport = document.querySelector('#viewport');
const panel = document.querySelector('#state');
const poster = document.querySelector('#poster');
const start = document.querySelector('#start');
const toggles = [...document.querySelectorAll('[data-layer]')];
const reset = document.querySelector('#reset');

start.addEventListener('click', async () => {
  start.disabled = true;
  const message = (text) => {
    const notice = document.createElement('p');
    notice.className = 'notice';
    notice.setAttribute('role','status');
    notice.textContent = text;
    panel.replaceChildren(notice);
  };
  message('Загрузка модели…');
  try {
    const [THREE, { OrbitControls }, { GLTFLoader }, { DRACOLoader }, { RoomEnvironment }] = await Promise.all([
      import('three'), import('three/addons/controls/OrbitControls.js'),
      import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ]);
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(room,0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffefe1,0x748791,1.35));
    const key = new THREE.DirectionalLight(0xffd8ae,2.05);
    key.position.set(4,8,5);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(35,1,.03,70);
    const controls = new OrbitControls(camera,renderer.domElement);
    controls.minDistance = 2.2;
    controls.maxDistance = 22;
    const layers = Object.fromEntries(toggles.map(button => [button.dataset.layer, []]));
    const draco = new DRACOLoader().setDecoderPath('./vendor/draco/').setWorkerLimit(2);
    let model;
    try {
      ({ scene:model } = await new GLTFLoader().setDRACOLoader(draco).loadAsync('./assets/reciprok.glb'));
    } finally {
      draco.dispose();
    }
    scene.add(model);
    model.traverse(object => {
      const group = layers[object.name.split('_')[0]];
      if (group) group.push(object);
    });
    if (Object.values(layers).some(group => !group.length)) throw new Error('Missing model layer');
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    renderer.domElement.setAttribute('aria-label','Трёхмерная модель РЕЦИПРОК');
    viewport.append(renderer.domElement);
    poster.hidden = true;
    panel.hidden = true;
    const draw = () => renderer.render(scene,camera);
    const fit = () => {
      controls.target.copy(center);
      const distance = 8.5 * Math.max(1,1.10/camera.aspect);
      camera.position.copy(center).addScaledVector(new THREE.Vector3(6,3.5,7.6).normalize(),distance);
      controls.update();
      draw();
    };
    let first = true;
    new ResizeObserver(() => {
      const { clientWidth:w,clientHeight:h } = viewport;
      if (!w || !h) return;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w,h,false);
      if (first) { first = false; fit(); } else draw();
    }).observe(viewport);
    controls.addEventListener('change',draw);
    for (const button of toggles) {
      button.disabled = false;
      button.addEventListener('click', () => {
        const next = button.getAttribute('aria-pressed') === 'false';
        button.setAttribute('aria-pressed',String(next));
        layers[button.dataset.layer].forEach(mesh => { mesh.visible = next; });
        draw();
      });
    }
    reset.disabled = false;
    reset.addEventListener('click', () => {
      for (const button of toggles) button.setAttribute('aria-pressed','true');
      Object.values(layers).flat().forEach(mesh => { mesh.visible = true; });
      fit();
    });
  } catch (error) {
    console.error(error);
    message('3D не удалось загрузить. Каркас доступен в галерее, модель можно скачать ниже.');
  }
});