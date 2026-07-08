// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {setMeshColor, addAxisLine,addRail,addCantileverLinks, DefaultDimension, addDimensions, onFieldActive, onFieldInactive, addPantograph, addOffsetPantograph, addPoints } from './common';
import { addPole } from '~/components/poles/viewer/common';

export default class Cantilever {
  private container?: HTMLElement;
  private scene: THREE.Scene;
  private cantileverData: CantileverDataContent|null;
  private options: CantileverViewerOptions;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  public renderer?: THREE.WebGLRenderer;

  //select objects
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedObject: THREE.Object3D | null;

  constructor(
    cantileverData: CantileverDataContent|null,
    options: CantileverViewerOptions,
    container?: HTMLElement
  ) {
    this.cantileverData = cantileverData;
    this.options = options;
    this.scene = new THREE.Scene();
    this.container = container;

    if (this.container) {
      this.scene.background = new THREE.Color('#ffffff');
      this.setupRenderer();
      this.addCameraAndControls();
      this.addLights();
      this.addObjects();
    }

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedObject = null;

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

  private addDefaultPole():void{
    if(this.cantileverData == null) return;

    addPole(
      "default_pole",
      this.scene,
      { 
        x:0, 
        y: 0, 
        z:0
      },
      this.cantileverData.cantilever.params.esc,
      this.cantileverData.cantilever.params.poleModel,
      { x: 1, y: 0, z: 0 }
    )

    if(this.options.labels){

      addDimensions(this.scene,{
        start:{
          x:- this.cantileverData.cantilever.params.poleModel.measures.width,
          y:0,
          z:0
        },
        end:{
          x:-this.cantileverData.cantilever.params.poleModel.measures.width,
          y:this.cantileverData.cantilever.params.bottom_fixed_height,
          z:0
        },
        groupId:"bottom_fixed_height",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-50
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      addDimensions(this.scene,{
        start:{
          x:-this.cantileverData.cantilever.params.poleModel.measures.width,
          y:0,
          z:0
        },
        end:{
          x:-this.cantileverData.cantilever.params.poleModel.measures.width,
          y:-this.cantileverData.cantilever.params.esc,
          z:0
        },
        groupId:"esc",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:40
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      addDimensions(this.scene,{
        start:{
          x:-this.cantileverData.cantilever.params.poleModel.measures.width,
          y:- this.cantileverData.cantilever.params.esc + this.cantileverData.cantilever.params.poleModel.measures.bottom_screw,
          z:0
        },
        end:{
          x:- this.cantileverData.cantilever.params.poleModel.measures.width,
          y:this.cantileverData.cantilever.params.poleModel.measures.height - this.cantileverData.cantilever.params.esc + this.cantileverData.cantilever.params.poleModel.measures.bottom_screw,
          z:0
        },
        groupId:"pole_height",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });
      addDimensions(this.scene,{
        start:{
          x:- this.cantileverData.cantilever.params.poleModel.measures.width,
          y:this.cantileverData.cantilever.params.bottom_fixed_height,
          z:0
        },
        end:{
          x:- this.cantileverData.cantilever.params.poleModel.measures.width,
          y:this.cantileverData.cantilever.params.bottom_fixed_height + this.cantileverData.cantilever.params.fixing_distance,
          z:0
        },
        groupId:"fixing_distance",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-50
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });
    }
  }

  private addAxisLine(){
    if(!this.cantileverData) return;

    addAxisLine(
      this.scene,
      this.cantileverData.pv,
      this.cantileverData.via_axis,
      this.cantileverData.cantilever.params.system_height,
      this.cantileverData.cw,
      this.cantileverData.mw,
      this.cantileverData.cantilever.params.u
    )



  }

  private addPantograph(){
    if(!this.cantileverData) return;

    addPantograph(
      this.scene,
      this.cantileverData.pv,
      this.cantileverData.via_axis,
      this.cantileverData.cantilever.params.pantograph.length
    )
    addOffsetPantograph(
      this.scene,
      this.cantileverData.pv,
      this.cantileverData.via_axis,
      this.cantileverData.cantilever.params.pantograph.length,
      this.cantileverData.cantilever.params.pantograph.gauge
    )
  }

  private addRail(): void {
    if(!this.cantileverData) return;

    addRail(
      this.scene,
      this.cantileverData.pv,
      this.cantileverData.cantilever.params.u,
      this.cantileverData.cantilever.params.track.gauge,
      this.cantileverData.cantilever.params.track.sleepers,
      this.cantileverData.cantilever.params.track.skate,
      this.cantileverData.cantilever.params.curve_radius_direction
    )

  }



  private onMouseClick(event: MouseEvent): void {

    if(!this.camera || !this.container || !this.options.measure) return;

    // Get the bounding box of the container
    const rect = this.container.getBoundingClientRect();

    // Calculate normalized mouse coordinates relative to the container
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      intersects.map((intersect)=> {
        const clickedObject = intersect.object;

        if (this.selectedObject) {

          if(this.selectedObject.userData.type != 'axis'){

            setMeshColor(this.selectedObject, this.selectedObject.userData.color); // Highlight the clicked object
          }
          //here should remove the diomension
          if(this.selectedObject.userData.type == 'link' || this.selectedObject.userData.type == 'pole'){
            const group = this.scene.getObjectByName(`selected_${this.selectedObject.userData.id}`);
            if (group) {
              this.scene.remove(group);
              group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.geometry.dispose();
                  if (child.material instanceof THREE.Material) {
                    child.material.dispose();
                  }
                }
              });
            }
          }
        }

        if (clickedObject !== this.selectedObject) {
          this.selectedObject = clickedObject;

          if(this.selectedObject.userData.type != 'axis'){
            setMeshColor(this.selectedObject, 0xff0000); // Reset previously selected
          }

          if(this.selectedObject.userData.type == 'link' || this.selectedObject.userData.type == 'pole'){

            let dimension = { 
              ...DefaultDimension, 
              start: { 
                x: this.selectedObject.userData.start.x, 
                y: this.selectedObject.userData.start.y, 
                z: this.selectedObject.userData.start.z 
              }, 
              end: { 
                x: this.selectedObject.userData.end.x, 
                y: this.selectedObject.userData.end.y, 
                z: this.selectedObject.userData.end.z 
              }, 
              groupId:`selected_${this.selectedObject.userData.id}`
            };

            this.addDimensions(dimension);

          }

        } else {
          this.selectedObject = null;
        }
      })

    }else if(this.selectedObject){

      if(this.selectedObject.userData.type != 'axis'){

        setMeshColor(this.selectedObject, this.selectedObject.userData.color); // Highlight the clicked object
      }
      //here should remove the diomension
      if(this.selectedObject.userData.type == 'link' || this.selectedObject.userData.type == 'pole'){
        const group = this.scene.getObjectByName(`selected_${this.selectedObject.userData.id}`);
        if (group) {
          this.scene.remove(group);
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
          });
        }
      }
      
      this.selectedObject = null;
    }
  }

  private onFieldActive(id:string):void{
    onFieldActive(this.scene,id);
  }
  private onFieldInactive(id:string):void{
    onFieldInactive(this.scene,id)
  }

  public addEventListeners(): void {
    if(!this.container) return;
    this.container.addEventListener('click', this.onMouseClick.bind(this));
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

  private addCantileverLinks(): void {

    if(!this.cantileverData) return;

    addCantileverLinks(this.scene,this.cantileverData);
  }

  private addDefaultDimensions():void {

    if(!this.cantileverData) return;

    if(this.options.labels){
      this.cantileverData.dimensions.map((dim)=>{
        this.addDimensions(dim);
      })
    }
  }

  private addDimensions(dimension:Dimensions){
    addDimensions(this.scene,dimension);
  }

  private addPoints():void{
    if(!this.cantileverData) return;

    addPoints(this.scene, this.cantileverData.points);
  }

  private addCameraAndControls(): void {
    if (!this.container) return;

    const aspectRatio = this.container.offsetWidth / this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.001, 10000);

    this.controls = new OrbitControls(this.camera, this.renderer!.domElement);

    this.updateCameraAndControls();
  }

  private updateCameraAndControls(): void {
    // Optional: Adjust camera and controls based on new data
    if (!this.camera || !this.controls || !this.cantileverData) return;

    this.camera.position.set(this.cantileverData.mw.y * 0.5, this.cantileverData.mw.y * 0.5, this.cantileverData.mw.y * 0.7);
    let initialTarget = new THREE.Vector3(this.cantileverData.mw.y * 0.2, this.cantileverData.mw.y * 0.5, 0);
    this.camera.lookAt(initialTarget);

    if (this.options.type === '2D') {
      this.camera.position.set(
        this.cantileverData.centers.cantilever_center.x,
        this.cantileverData.centers.cantilever_center.y,
        this.cantileverData.centers.cantilever_center.y * 0.4
      );
      initialTarget = new THREE.Vector3(
        this.cantileverData.centers.cantilever_center.x,
        this.cantileverData.centers.cantilever_center.y,
        0
      );
      this.camera.lookAt(initialTarget);
    }

    if(this.options.type === 'preview'){
      this.camera.position.set(
        this.cantileverData.mw.y * 0.5, 
        this.cantileverData.mw.y * 0.5, 
        this.cantileverData.mw.y * 1.1);

      initialTarget = new THREE.Vector3(
        this.cantileverData.mw.y * 0.3, 
        this.cantileverData.mw.y * 0.5, 
        0);
      this.camera.lookAt(initialTarget);
    }

    this.controls.target.copy(initialTarget);
    this.controls.enableRotate = this.options.type !== '2D';
    this.controls.update();
  }

  public updateCantileverData(
    newCantileverData: CantileverDataContent, 
    options:CantileverViewerOptions
  ): void {

    let oldOptions = this.options;

      
    this.options = options;

    this.cantileverData = newCantileverData;
    this.scene.clear();
    this.addObjects();
    this.addAxisHelper();
    this.addLights();

    // Update the data
    if(oldOptions.type != options.type){
      this.updateCameraAndControls();
    }

  }

  private addObjects():void {
    this.addCantileverLinks();
    this.addDefaultDimensions();
    this.addRail();
    this.addAxisLine();
    this.addPantograph();
    this.addDefaultPole();
    this.addPoints();
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


