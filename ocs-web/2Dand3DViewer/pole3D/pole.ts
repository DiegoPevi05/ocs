// Import Three.js
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {addCantileverLinks,addDimensions,addRail,addAxisLine, onFieldActive, onFieldInactive} from '../../cantilevers/viewer/common';
import { addPole } from './common';

export default class Pole {
  private container?: HTMLElement;
  private scene: THREE.Scene;
  private poleData: PoleDataContent|null;
  private options: PoleViewerOptions;
  private position: THREE.Vector3;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private renderer?: THREE.WebGLRenderer;

  constructor(
    poleData: PoleDataContent|null,
    options: PoleViewerOptions,
    container?: HTMLElement,
  ) {

    this.poleData = poleData;
    this.options = options;
    this.scene = new THREE.Scene();
    this.position = new THREE.Vector3(
      this.poleData?.pole.params.position.x ?? 0,
      this.poleData?.pole.params.position.y ?? 0,
      this.poleData?.pole.params.position.z ?? 0
    );
    this.container = container;

    if(this.container){
      this.scene.background = new THREE.Color('#ffffff');
      this.setupRenderer();
      this.addLights();
      this.addObjects();
      this.addCameraAndControls();
    }

    this.addAxisHelper();
    this.render();
  }

  private setupRenderer(): void {
    if (!this.container) return;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    if (!this.renderer || !this.camera || !this.container) return;

    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  public updateRenderer():void {
    this.onResize();
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(1, 2, 3);
    this.scene.add(directionalLight);
  }

  private addAxisHelper(): void {
    const axesHelper = new THREE.AxesHelper(500); // Adjust size as needed
    this.scene.add(axesHelper); // Add it to the scene at the origin
  }

  private addCameraAndControls(): void {
    if (!this.container) return;

    const aspectRatio = this.container.offsetWidth / this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.001, 15000);

    this.controls = new OrbitControls(this.camera, this.renderer!.domElement);

    this.updateCameraAndControls();
  }


  private addDefaultDimensions():void {
    if(!this.poleData) return;

    if (
      this.options.labels.find(
        (label) =>
          label.id == this.poleData?.pole.id &&
          label.type == "pole" &&
          label.state
      )
    ) {
      this.poleData.dimensions.map((dim)=>{
        this.addDimensions(dim);
      })
    }
  }

  private addDimensions(dimension:Dimensions){
    addDimensions(this.scene,dimension);
  }

  private updateCameraAndControls(): void {
    // Optional: Adjust camera and controls based on new data
    if (!this.camera || !this.controls || !this.poleData) return;

    this.camera.position.set(this.poleData.pole.params.model.measures.height*0.5, this.poleData.pole.params.model.measures.height*0.5, this.poleData.pole.params.model.measures.height);
    let initialTarget = new THREE.Vector3(this.poleData.pole.params.model.measures.height*0.2, this.poleData.pole.params.model.measures.height*0.5, 0);
    this.camera.lookAt(initialTarget);

    if (this.options.type === '2D') {
      this.camera.position.set(
        this.poleData.pv.z/2,
        this.poleData.pole.params.bottom_fixed_height + this.poleData.pole.params.fixing_distance/2,
        this.poleData.pole.params.bottom_fixed_height + this.poleData.pole.params.fixing_distance/2 * 0.4
      );
      initialTarget = new THREE.Vector3(
        this.poleData.pv.z/2,
        this.poleData.pole.params.bottom_fixed_height + this.poleData.pole.params.fixing_distance/2,
        0
      );
      this.camera.lookAt(initialTarget);
      this.camera.lookAt(initialTarget);
    }

    if (this.options.type === 'preview') {

      this.camera.position.set(
        this.poleData.pole.params.model.measures.height*0.5, 
        this.poleData.pole.params.model.measures.height*0.5, 
        this.poleData.pole.params.model.measures.height*0.85);

      initialTarget = new THREE.Vector3(
        this.poleData.pole.params.model.measures.height*0.3, 
        this.poleData.pole.params.model.measures.height*0.4, 
        0);
      this.camera.lookAt(initialTarget);

    }

    this.controls.target.copy(initialTarget);
    this.controls.update();

  }

  private addPole():void{
    if(!this.poleData) return;

    addPole(
      this.poleData.pole.external_id,
      this.scene,
      this.poleData.position,
      this.poleData.pole.params.esc,
      this.poleData.pole.params.model,
      { x: 1, y: 0, z: 0 }
    );
  }

  private createSupport(position: THREE.Vector3): THREE.Mesh {

    const geometry = new THREE.BoxGeometry(
      (this.poleData?.pole.params.support_offset ?? 0),
      (this.poleData?.pole.params.support_offset ?? 0),
      (this.poleData?.pole.params.cat_separation ?? 0) * ((this.poleData?.cantilevers.length ?? 0) - 1)
    );

    const material = new THREE.MeshStandardMaterial({ color: 0x808080, wireframe: false });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    return mesh;
  }

  private addCantileverSupports():void{
    if(!this.poleData) return;

    if(this.poleData.cantilevers.length <= 1) return;

    // Position for the first support
    const position1 = new THREE.Vector3(
      this.poleData.pole.params.model.measures.width / 2 + this.poleData.pole.params.support_offset / 2,
      this.poleData.pole.params.bottom_fixed_height,
      this.position.z
    );

    // Position for the second support (example adjustment for position)
    const position2 = new THREE.Vector3(
      this.poleData.pole.params.model.measures.width / 2 + this.poleData.pole.params.support_offset / 2,
      this.poleData.pole.params.bottom_fixed_height + this.poleData.pole.params.fixing_distance,
      this.position.z
    );

    // Create and add the first support
    const support1 = this.createSupport(position1);
    this.scene.add(support1);

    // Create and add the second support
    const support2 = this.createSupport(position2);
    this.scene.add(support2);
  }

  private addCantilevers():void{

    if(!this.poleData) return;

    this.poleData.cantilevers.map(cantilever=>{
      addCantileverLinks(this.scene,cantilever);
      addRail(
        this.scene,
        cantilever.pv,
        cantilever.cantilever.params.u,
        cantilever.cantilever.params.track.gauge,
        cantilever.cantilever.params.track.sleepers,
        cantilever.cantilever.params.track.skate,
        cantilever.cantilever.params.curve_radius_direction
      );
      addAxisLine(
        this.scene,
        cantilever.pv,
        cantilever.via_axis,
        cantilever.cantilever.params.system_height,
        cantilever.cw,
        cantilever.mw,
        cantilever.cantilever.params.u
      );

      if (
        this.options.labels.find(
          (label) =>
            label.id == cantilever.cantilever.id &&
            label.type == "cantilever" &&
            label.state
        )
      ) {
        cantilever.dimensions.map((dim) => {
          this.addDimensions(dim);
        });
      }

    })
  }

  private onFieldActive(id:string):void{
    onFieldActive(this.scene,id);
  }
  private onFieldInactive(id:string):void{
    onFieldInactive(this.scene,id)
  }

  public addEventListeners(): void {
    if(!this.container) return;

    // Listen for the selectCantileverObject event
    window.addEventListener('selectCantileverObject', (event) => {
      const customEvent = event as CustomEvent<{ id: string }>; // Explicitly cast to CustomEvent
      const { id } = customEvent.detail;
      if (id) {
        this.onFieldActive(id);
      }
    });

    // Listen for the deselectCantileverObject event
    window.addEventListener('deselectCantileverObject', (event) => {
      const customEvent = event as CustomEvent<{ id: string }>; // Explicitly cast to CustomEvent
      const { id } = customEvent.detail;
      if (id) {
        this.onFieldInactive(id);
      }
    });

  }

  public updatePoleData(
    poleData: PoleDataContent,
    options:PoleViewerOptions
  ): void {

    let oldOptions = this.options;
    this.options = options;

    this.poleData = poleData;
    this.scene.clear();
    this.addObjects();
    this.addAxisHelper();
    this.addLights();

    // Update the data
    if(oldOptions.type != options.type){
      this.updateCameraAndControls();
    }

  }

  private addObjects(): void {
    this.addPole();
    this.addCantileverSupports();
    this.addDefaultDimensions();
    this.addCantilevers();
  }


  public dispose():void {
    this.controls?.dispose();  // Dispose OrbitControls
    this.renderer?.dispose(); // Free WebGL resources
    this.scene.clear();       // Remove all objects from the scene
    this.renderer?.forceContextLoss(); // Explicitly lose the WebGL context
    window.removeEventListener('resize', this.onResize.bind(this)); // Remove resize listener
  }

  private render(): void {
    if (!this.renderer || !this.camera) return;

    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer!.render(this.scene, this.camera!);
    };

    animate();
  }
}
