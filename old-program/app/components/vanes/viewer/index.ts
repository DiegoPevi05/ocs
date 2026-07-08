// Import Three.js
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { addVaneRects, addVaneCurves } from './common';
import {addDimensions} from '~/components/cantilevers/viewer/common';
import { getDistanceBetweenTwoPoints3D } from '~/components/common/common';

export default class Vane {
  private container?: HTMLElement;
  private scene: THREE.Scene;
  private vaneData: VaneDataContent|null;
  private options: VaneViewerOptions;
  private camera?: THREE.PerspectiveCamera|THREE.OrthographicCamera;
  private controls?: OrbitControls;
  private renderer?: THREE.WebGLRenderer;
  private vaneLength:number;
  private initialSystemHeight:number;
  private initialContactWireHeight:number;

  constructor(
    vaneData: VaneDataContent|null,
    options: VaneViewerOptions,
    container?: HTMLElement,
  ) {

    this.vaneData = vaneData;
    this.vaneLength = this.getVaneLength();
    this.initialSystemHeight = this.getInitialSystemHeight();
    this.initialContactWireHeight = this.getInitialContactWireHeight();
    this.options = options;
    this.scene = new THREE.Scene();
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



  private getVaneLength():number{

    return Number(this.vaneData.report_params.vane_length)
    /*getDistanceBetweenTwoPoints3D(
      this.vaneData?.vane.params.poles[0]?.contact_wire_point || {x:0,y:0,z:0},
      this.vaneData?.vane.params.poles[1]?.contact_wire_point || {x:0,y:0,z:0}
    );*/
  }

  private getInitialSystemHeight():number{

    console.log(this.vaneData.links.curves[0].curve[0])

    return (this.vaneData?.links?.curves?.[0]?.curve?.[0]?.y ?? 0) - (this.vaneData?.links?.curves?.[1]?.curve?.[0]?.y ?? 0);
  }

  private getInitialContactWireHeight():number{

    return this.vaneData?.links?.curves?.[1]?.curve?.[0]?.y ?? 0;
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

    if(this.camera instanceof THREE.PerspectiveCamera){
      this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    }

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

  private setCamera(container:HTMLElement):THREE.PerspectiveCamera|THREE.OrthographicCamera{


    const aspectRatio = container.offsetWidth / container.offsetHeight;

    let camera:THREE.PerspectiveCamera|THREE.OrthographicCamera;

    if (this.options.camera === 'perspective') {

      camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.001, 100000);

    }else{

      const frustumMargin = 1000; // Optional padding/margin around the view
      const near = 0.001;
      const far = 100000;
      
      //console.log(this.vaneLength, this.initialContactWireHeight, this.initialSystemHeight);

      camera = new THREE.OrthographicCamera(
        - frustumMargin, // Left
        this.vaneLength + frustumMargin,  // Right
        this.initialContactWireHeight + this.initialSystemHeight + frustumMargin, // Top
        this.initialContactWireHeight - frustumMargin, // Bottom
        near,
        far
      );
    }
    return camera;

  }

  private addDefaultDimensions():void {

    if(!this.vaneData) return;
    if (
      this.options.labels.find(
        (label) =>
          label.id == this.vaneData?.vane.id &&
          label.type == "vane" &&
          label.state
      ) && this.options.camera == 'perspective'
    ) {
      this.vaneData.dimensions.map((dim)=>{
        this.addDimensions(dim);
      })
    }
  }

  private addDimensions(dimension:Dimensions){
    addDimensions(this.scene, dimension)
  }


  private addVaneLinks(): void {

    if(!this.vaneData) return;

    addVaneRects(this.scene,this.vaneData, this.options.camera);
    addVaneCurves(this.scene,this.vaneData, this.options.camera);
  }

  private addCameraAndControls(): void {
    // Optional: Adjust camera and controls based on new data
    if (!this.vaneData || !this.container) return;

    this.camera = this.setCamera(this.container);

    // Recreate OrbitControls with the new camera
    this.controls = new OrbitControls(this.camera, this.renderer!.domElement);

    if(this.options.camera == 'orthographic'){

      //this.camera.position.set(this.vaneData.vane.params.vane_length);
      //// **Center the camera**
      //this.camera.position.set(this.vaneLength/2, (this.initialContactWireHeight + this.initialSystemHeight/2), 0); // Move the camera away along the Z-axis
      //this.camera.lookAt(this.vaneData.vane.params.vane_length/2, 0, 0); // Look at the center of the scene
      // Update camera after changes
      //this.camera.updateProjectionMatrix();
      this.controls.enableRotate = false;
      this.controls.enableZoom = false;

    }else{

        this.camera.position.set(
          (this.initialContactWireHeight + this.initialSystemHeight)*0.5, 
          (this.initialContactWireHeight + this.initialSystemHeight)*0.5,
          (this.initialContactWireHeight + this.initialSystemHeight)*0.7
        );
        let initialTarget = new THREE.Vector3(
          (this.initialContactWireHeight + this.initialSystemHeight)*0.6, 
          (this.initialContactWireHeight + this.initialSystemHeight)*0.6, 
          -this.vaneLength/2
        );
        
        this.camera.lookAt(initialTarget);

        if (this.options.type === '2D') {
          this.camera.position.set(
            this.vaneLength/2,
            (this.initialContactWireHeight + this.initialSystemHeight)/2,
            -this.vaneLength*0.2,
          );
          initialTarget = new THREE.Vector3(
            0,
            (this.initialContactWireHeight + this.initialSystemHeight)/2,
            -this.vaneLength/2*0.8
          );
          this.camera.lookAt(initialTarget);
          this.camera.lookAt(initialTarget);
        }

        /*if (this.options.type === 'preview') {

          this.camera.position.set(
            this.vaneData.vane.params.model.measures.height*0.5, 
            this.vaneData.vane.params.model.measures.height*0.5, 
            this.vaneData.vane.params.model.measures.height*0.85);

          initialTarget = new THREE.Vector3(
            this.vaneData.vane.params.model.measures.height*0.3, 
            this.vaneData.vane.params.model.measures.height*0.4, 
            0);
          this.camera.lookAt(initialTarget);

        }*/


        this.controls.target.copy(initialTarget);
        this.controls.update();
    }

  }

  public updateVaneData(
    vaneData: VaneDataContent,
    options:VaneViewerOptions
  ): void {

    this.options = options;

    this.vaneData = vaneData;
    this.scene.clear();
    this.addObjects();
    this.addAxisHelper();
    this.addLights();

    this.vaneLength = this.getVaneLength();
    this.initialSystemHeight = this.getInitialSystemHeight();
    this.initialContactWireHeight = this.getInitialContactWireHeight();

    // Update the data
    this.addCameraAndControls();

  }

  private addObjects(): void {
    this.addVaneLinks();
    this.addDefaultDimensions();
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
