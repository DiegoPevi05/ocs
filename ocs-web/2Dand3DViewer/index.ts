// Import Three.js
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { addGrid, updateGrid } from './grid';
import { addCursor,updatePositionCursor, createCursorCoordinates, setupInputs, toogleViewCursor, updateCoordinatesDisplay, updateCursor, updateCursorCoordinates } from './cursor';
import { drawPreviewLine, drawCircle, updatePreviewLine, updatePreviewCircle} from './objects';
import { generateDimensionsInputs, createDimensionElements,  updateDimensionElementsForLines, updateDimensionElementsForPoles} from './dimensions';
import { cleanUpPreviewElements } from './helper';
import { Font, FontLoader } from 'three-stdlib';
import { addVia } from './via';
import { addVane } from './vane';
import { addPoles } from './pole';
import { addPole, addCantileverSupport } from '../../poles/viewer/common';
import {addCantileverLinks, addRail,addAxisLine} from '../../cantilevers/viewer/common';
import { add3DVia, add3DAxisLine, add3DVane } from './common';


import { addViaAndTickLabels, addPoleLabels, addCantileverLabels } from './labels';

export default class LocationViewer {

  private index:number;
  private defaultCircleRadius: number;
  private pkProps:PkProps;
  private fontsProps:FontsProps;
  private colors: {vane: number, via: number, cantilever: number, pole: number, dimensions:number};
  private font: Font|undefined;
  private container?: HTMLElement;
  private scene: THREE.Scene;
  private options: LocationViewerOptions;
  private camera?: THREE.PerspectiveCamera|THREE.OrthographicCamera;
  private controls?: OrbitControls;
  private renderer?: THREE.WebGLRenderer;
  private locationData: LocationParams | null;
  private grid: { current: THREE.Group, horizontalLines: THREE.Line[], verticalLines: THREE.Line[], spacing: number };
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private cursorGroup?: THREE.Group;
  private dimensionGroup = new THREE.Group();
  private dimensionInput: HTMLInputElement;
  private dimensionInputAngle: HTMLInputElement;
  private dimensionInputPk:HTMLInputElement;
  private coordinatesElement = {current: undefined as HTMLSpanElement | undefined};
  private circles:LocationCircles = { current: [] };
  private lines:LocationLines = { current: [] };
  private firstPoint = {current: { point: undefined as THREE.Vector3 | undefined , selectedItem: undefined as  THREE.Mesh | undefined } };
  private previewLineRef = { current: undefined as THREE.Line | undefined };
  private previewCircleRef = { current: undefined as THREE.Mesh | undefined };
  private previeSelectedRef = { current: [] as THREE.Mesh[] };
  private isDrawing: boolean;
  private isSelecting: boolean;
  private isPoleCreating = { current: false  };
  private width: number = 0;
  private height: number = 0;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseClick: (e: MouseEvent) => void;
  private boundOnMouseZoom: (e: WheelEvent) => void;
  private boundOnScreenDrag: (e: MouseEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private catenaryType:string;

  constructor(
    index:number,
    locationData: LocationParams | null,
    options: LocationViewerOptions,
    container?: HTMLElement,
    catenaryType:string
  ) {

    this.index = index;

    this.catenaryType = catenaryType;
    this.fontsProps = { 
      via: { 
        label: { size: 800, offset: 0 } , 
        thick: { size:500, offset: 1600 } 
      }, 
      pole: {
        type:{
          size:600,
          offset:1500,
          color:0xffff00
        },
        pv:{
          size:100,
          offset:1000,
          color:0xffff00
        },
        coordinates:{
          lines:{
            horizontal:5000,
            vertical:10000
          },
          size:800,
          offset:800,
          color:0xffa500
        },
        name:{
          size:800,
          offset:6000,
          color:0xffffff,
          border_color:0xff0000,
          circlePadding:400
        },
      },
      cantilever:{
        name:{
          size:300,
          offset:1000,
          color:0xffff00
        },
        zig_zag:{
          size:300,
          offset:300,
          arrowLength:1000,
          headLength:150,
          color:0x00BFFF
        }
      }
    };
    this.pkProps = { width: 3000, step:20000  };
    this.defaultCircleRadius = 125;
    this.colors = {vane: 0xff00ff, via: 0x00BFFF, cantilever: 0xff00ff, pole: 0xffffff, dimensions: 0xffffff};
    this.grid = { current: new THREE.Group(), horizontalLines: [], verticalLines: [], spacing: 250 };
    this.locationData = locationData;
    this.options = options;
    this.scene = new THREE.Scene();
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDrawing = this.options.draw.pole || this.options.draw.vane || this.options.draw.via || this.options.draw.cantilever;
    this.isSelecting = this.options.selection.pole || this.options.selection.vane || this.options.selection.via || this.options.selection.cantilever;
    this.isPoleCreating = { current: false };

    this.scene.background = new THREE.Color('#333333');
    this.setupRenderer();
    this.addLights();
    this.addCameraAndControls();
    this.addAxisHelper();
    this.boundOnMouseMove               = (e: MouseEvent) => this.onMouseMove(e);
    this.boundOnMouseClick              = (e: MouseEvent) => this.onMouseClick(e);
    this.boundOnMouseZoom               = (e: WheelEvent) => this.onMouseZoom(e);
    this.boundOnScreenDrag              = (e: MouseEvent) => this.onScreenDrag(e);
    this.boundOnMouseDown               = (e: MouseEvent) => this.onMouseDown(e);
    this.boundOnMouseUp                 = (e: MouseEvent) => this.onMouseUp(e);
    this.init();
  }

  private init(): Promise<void> {

      this.addLoaderLocation();

      try {

        this.initializeEnvironment();

        this.render();

        this.renderObjects();

        if(this.options.camera !== "perspective"){

          const { dimensionInput, dimensionInputAngle, dimensionInputPk }  = generateDimensionsInputs();

          this.dimensionInput = dimensionInput;

          this.dimensionInputAngle = dimensionInputAngle;

          this.dimensionInputPk = dimensionInputPk;

          createDimensionElements(this.dimensionGroup, this.scene, this.colors.dimensions);

        }

      } catch (e) {

        console.error("Failed to initialize:", e);

      }

      this.removeLoaderLocation();
  }

  private async initializeEnvironment(): Promise<void> {
    if(!this.container || !this.scene) return;

    if(this.options.camera !== "perspective"){
      this.cursorGroup                    = addCursor(this.container, this.scene);
      addGrid(this.scene, this.grid, this.height, this.width);
      this.coordinatesElement.current             = createCursorCoordinates(this.container);
      this.addEventListeners();
    }



    this.font = await new Promise<Font>((resolve, reject) => {
      const loader = new FontLoader();
      loader.load(
        '/fonts/helvetiker_regular.typeface.json',
        (font) => {
          resolve(font as Font);
        },
        (progress) => console.log('Loading font:', progress),
        (error) => {
          console.error('Font loading error:', error);
          reject(error);
        }
      );
    });

    await this.renderLabels();
  
  }

  private handleAddViaToLocation = (newVia: ViaParams): void => {
    if (!this.locationData) return;

    const index = this.locationData.vias.findIndex(v => v.external_id === newVia.external_id);

    if (index !== -1) {
      // Update existing via
      this.locationData.vias[index] = newVia;
    } else {
      // Add new via
      this.locationData.vias.push(newVia);
    }

    window.dispatchEvent(new CustomEvent('newLocationElement', { detail: { elementType: 'via', elementData: newVia } }));

  }

  private handleAddPoleToLocation = (viaId: number, newPole:PoleDataContent):void => {

    if (!this.locationData) return;

    const index = this.locationData.vias.findIndex(v => v.id === viaId);

    if(index === -1) return;

    this.locationData.vias[index].poles.push(newPole);

    window.dispatchEvent(new CustomEvent('newLocationElement', { detail: { elementType: 'pole', elementData: newPole } }));

  }

  private handleAddCantileverToLocation = (viaId: number, newCantileverWithPole:PoleDataContent):void => {

    if (!this.locationData) return;

    const index = this.locationData.vias.findIndex(v => v.id === viaId);

    const poleIndex = this.locationData.vias[index].poles.findIndex(p => p.pole.id === newCantileverWithPole.pole.id);

    if(index === -1) return;

    this.locationData.vias[index].poles[poleIndex] = newCantileverWithPole;

    window.dispatchEvent(new CustomEvent('newLocationElement', { detail: { elementType: 'cantilever', elementData: newCantileverWithPole } }));

  }

  private handleAddVaneToLocation = (newVane:VaneDataContent):void => {

    if (!this.locationData) return;

    this.locationData.vanes.push(newVane);

    window.dispatchEvent(new CustomEvent('newLocationElement', { detail: { elementType: 'vane', elementData: newVane } }));

  }




  private handleupdateDimensionElements(event: MouseEvent): void {

    if(this.options.draw.pole){
      if(event){
        updateDimensionElementsForPoles(
          this.dimensionGroup,
          event,
          this.scene,
          this.camera,
          this.container,
          this.dimensionInput,
          this.dimensionInputPk,
          this.dimensionInputAngle,
          this.colors.dimensions,
          this.lines,
          this.grid.spacing,
          this.options,
          this.previewCircleRef
        );
      }else{
        updateDimensionElementsForPoles(
          this.dimensionGroup,
          null,
          this.scene,
          this.camera,
          this.container,
          this.dimensionInput,
          this.dimensionInputPk,
          this.dimensionInputAngle,
          this.colors.dimensions,
          this.lines,
          this.grid.spacing,
          this.options,
          this.previewCircleRef
        );
      }
    }else{
      updateDimensionElementsForLines(
        this.dimensionGroup,
        this.firstPoint,
        this.cursorGroup,
        this.scene,
        this.camera,
        this.container,
        this.dimensionInput,
        this.dimensionInputAngle,
        this.dimensionInputPk,
        this.colors.dimensions,
      );
    }
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
    this.addCameraAndControls();
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
    this.width = 100000;
    this.height = this.width / aspectRatio;


    let camera:THREE.PerspectiveCamera|THREE.OrthographicCamera;

    if (this.options.camera === 'perspective') {

      camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.001, 1000000);

    }else{

      const near = 0.0001;
      const far = 1000000;

      camera = new THREE.OrthographicCamera(
        0,
        this.width,
        this.height,
        0,
        near,
        far
      );
    }
    return camera;

  }

  private getViasCenter(vias: ViaLocationParams[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const via of vias) {
      for (const line of via.params.lines) {
        const points = [line.start, line.end];
        for (const point of points) {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }
      }
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { min:{x: minX, y: 0, z: minY}, max:{x: maxX, y: 0, z: maxY} ,center:{x: centerX, y:0 , z: centerY} };
  }

  private addCameraAndControls(): void {
    // Optional: Adjust camera and controls based on new data
    if (!this.locationData || !this.container) return;

    this.camera = this.setCamera(this.container);


    let focusPoint = new THREE.Vector3(0, 0, 0);

    if (this.options.camera === 'perspective') {
      // move the camera so it's offset from the focus point
      // (you can tune these offsets however you like)
      const {min, max, center} = this.getViasCenter(this.locationData.vias);

      const angleDegrees = 10;
      const angleRadians = (angleDegrees * Math.PI) / 180;
      const height = max.z * Math.tan(angleRadians);

      this.camera.position.set(min.x*1, height*3 , max.z*0.2);

      focusPoint = new THREE.Vector3(center.x*0.8, height*1.2, center.z*-0.5);

      // make the camera look at that point
      //this.camera.lookAt(center.x, center.y*0.5, center.z);


    }

    // Recreate OrbitControls with the new camera
    this.controls = new OrbitControls(this.camera, this.renderer!.domElement);

    if(this.options.camera === 'perspective' || this.options.type == "preview"){
      this.controls.rotateSpeed = 0.1;
      this.controls.zoomSpeed = 0.1;
      this.controls.target.copy(focusPoint);
      this.controls.update();
    }

    if(this.options.camera == 'orthographic'){

      this.scene.background = new THREE.Color('#333333');

      this.controls.enablePan = true;
      this.controls.enableRotate = false;
      this.controls.enableZoom = true;

    }else{

      this.scene.background = new THREE.Color('#ffffff');

      if(this.options.type == '3D' || this.options.type == "preview"){
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        this.controls.enableZoom = true;
      }

    }

  }

  private renderLabels():void{
    if(!this.lines || !this.lines.current || this.lines.current.length === 0) return;
    this.lines.current.forEach(item => {
      if(item.type === "via"){
        addViaAndTickLabels(
          item.line,
          this.font,
          this.colors.via,
          this.fontsProps,
        );
      }else if(item.type === "cantilever"){
        addCantileverLabels(
          item.line,
          this.font,
          this.fontsProps
        );
      }
    });

    this.circles.current.forEach(item => {
      if(item.type === "pole"){
        addPoleLabels(
          item.circle,
          this.font,
          this.fontsProps
        )
      };
    })
  };

  private renderObjects():void{
      this.renderVias();
  };

  private renderVias():void{
    if(!this.locationData || !this.locationData.vias) return;
    
    if(this.options.camera === "orthographic"){
      this.locationData.vias.forEach(via => {
        addVia(
          via, 
          this.lines, 
          this.scene, 
          this.colors.via, 
          this.pkProps, 
        );

        addPoles(via,this.circles,this.lines,this.scene,this.colors);

      });

      this.locationData.vanes.forEach(vane => {
        addVane(vane,this.lines,this.scene,this.colors.vane)
      })

    }else{

      this.locationData.vanes.forEach(vane => {
        add3DVane(vane,this.scene,this.colors.vane)
      })

      this.locationData.vias.forEach(via => {

        via.params.lines.forEach(line => { 
          add3DVia(
            line.id,
            {x:line.start.x,y:line.start.z,z:line.start.y*-1},
            {x:line.end.x,y:line.end.z,z:line.end.y*-1},
            this.scene,
            this.colors.via
          );
        });

        via.poles.forEach(pole => {
            addPole(
              pole.pole.external_id,
              this.scene,
              {x:pole.position.x, y:pole.position.z, z:pole.position.y*-1 },
              pole.pole.params.esc,
              pole.pole.params.model,
              {x:pole.pv.x, y:pole.pv.z, z:pole.pv.y*-1 }
            );

            if(pole.cantilevers.length > 1){

              addCantileverSupport(
                pole.pole.external_id,
                this.scene,
                pole.pole.params.bottom_fixed_height,
                pole.pole.params.fixing_distance,
                {x:pole.position.x, y:pole.position.z, z:pole.position.y*-1 },
                pole.pole.params.model,
                pole.cantilevers.length,
                pole.pole.params.support_offset,
                pole.pole.params.cat_separation,
                {x:pole.pv.x, y:pole.pv.z, z:pole.pv.y*-1 }
              );
            }

            pole.cantilevers.forEach(cantilever => {

              addCantileverLinks(this.scene,cantilever);

              /*addRail(
                this.scene,
                cantilever.pv,
                cantilever.cantilever.params.u,
                cantilever.cantilever.params.track.gauge,
                cantilever.cantilever.params.track.sleepers,
                cantilever.cantilever.params.track.skate,
                cantilever.cantilever.params.curve_radius_direction
              );
              */

              add3DAxisLine(
                cantilever.cantilever.external_id,
                this.scene,
                cantilever.polePosition,
                cantilever.pv,
                cantilever.via_axis,
                cantilever.cantilever.params.system_height,
                cantilever.cw,
                cantilever.mw,
                cantilever.cantilever.params.u
              );

            });
        });
      });

    }
  };

  private addCoordinates(event: MouseEvent): void {
    if (!this.container || !this.coordinatesElement.current || !this.cursorGroup) return;
      updateCursorCoordinates(event, this.container, this.coordinatesElement.current, this.cursorGroup);
  }

  private removeCursor(event: MouseEvent): void {
    if (!this.container || !this.cursorGroup || !this.coordinatesElement) return;
    toogleViewCursor(this.cursorGroup, this.container, this.coordinatesElement, event);
  }

  private onMouseMoveDrawingCursor(event:MouseEvent):void{

    if(!this.cursorGroup || !this.isDrawing) return;
       
      if(this.options.draw.pole){

        drawCircle(new THREE.Vector3(
          this.cursorGroup.position.x,
          this.cursorGroup.position.y, 
          this.cursorGroup.position.z), 
          this.scene, 
          this.previewCircleRef,
          this.camera,
          this.defaultCircleRadius
        );

      }else if (this.options.draw.vane || this.options.draw.via || this.options.draw.cantilever) {

        if (this.firstPoint.current.point) {

          if(this.options.draw.vane){

              drawPreviewLine(
                this.firstPoint.current.point,
                new THREE.Vector3(
                  this.cursorGroup.position.x,
                  this.cursorGroup.position.y,
                  this.cursorGroup.position.z
                ),
                this.scene,
                this.previewLineRef,
                this.colors.vane,
                'vane'
              );

          }else if(this.options.draw.via){

              drawPreviewLine(
                this.firstPoint.current.point,
                new THREE.Vector3(
                  this.cursorGroup.position.x,
                  this.cursorGroup.position.y, 
                  this.cursorGroup.position.z
                ),
                this.scene,
                this.previewLineRef,
                this.colors.via,
                'via'
              );

          }else if(this.options.draw.cantilever){

              drawPreviewLine(
                this.firstPoint.current.point,
                new THREE.Vector3(
                  this.cursorGroup.position.x,
                  this.cursorGroup.position.y,
                  this.cursorGroup.position.z
                ),
                this.scene, 
                this.previewLineRef,
                this.colors.cantilever,
                'cantilever'
              );

          }

      }

      }
  }


  private onScreenDrag(event:MouseEvent):void{

    if(!this.container || !this.camera || !this.cursorGroup) return;

    updatePositionCursor(
        event, 
        this.container, 
        this.camera, 
        this.cursorGroup, 
        { spacing: this.grid.spacing }, 
        this.circles, 
        this.lines, 
        this.options, 
        this.firstPoint.current
    );

    this.addCoordinates(event);

    updateGrid(this.grid, this.camera, this.container, event);

  }

  private onMouseZoom(event:WheelEvent):void{
    if(!this.container || !this.camera || !this.cursorGroup) return;

    this.addCoordinates(event);
    updateCursor(this.cursorGroup, this.camera.zoom);
    updateGrid(this.grid, this.camera, this.container, event);
  }


  private onMouseDown(event:MouseEvent):void{
    if (event.ctrlKey && this.container) {
      this.container.addEventListener('mousemove', this.boundOnScreenDrag);
    }
  }

  private onMouseUp(event:MouseEvent):void{
    if (this.container) {
      this.container.removeEventListener('mousemove', this.boundOnScreenDrag);
    }
  }

  private onMouseMove(event:MouseEvent):void{
    if(!this.container || !this.camera || !this.cursorGroup) return;

      updatePositionCursor(
        event, 
        this.container, 
        this.camera, 
        this.cursorGroup, 
        { spacing: this.grid.spacing }, 
        this.circles, 
        this.lines, 
        this.options, 
        this.firstPoint.current
      );

      this.addCoordinates(event);
      this.removeCursor(event);
      this.onMouseMoveDrawingCursor(event);

      if(!this.isPoleCreating.current){
        this.handleupdateDimensionElements(event);
      }
  }

  private onMouseClickDrawingCursor(event:MouseEvent):void{
    
    if (event.altKey || event.ctrlKey) return;

    if(!this.cursorGroup || !this.isDrawing || !this.locationData) return;

    if(this.options.draw.pole){

        this.isPoleCreating.current = true;

        const onPoleCreated = (viaId: number, newPole:PoleDataContent) => this.handleAddPoleToLocation(viaId, newPole);

        updatePreviewCircle(
          this.cursorGroup,
          this.previewCircleRef,
          this.scene,
          this.circles,
          event,
          this.font,
          this.locationData,
          onPoleCreated,
          this.fontsProps,
          this.catenaryType,
          this.isPoleCreating
        );

        this.cleanPreviewElements();

    }else{



        const onViaCreated = (via: ViaParams) => this.handleAddViaToLocation(via);
        const onCantileverCreated = (viaId: number, newCantilever:PoleDataContent) => this.handleAddCantileverToLocation(viaId,newCantilever); 
        const onVaneCreated = (newVane:VaneDataContent) => this.handleAddVaneToLocation(newVane);


        if (this.options.draw.vane) {

          updatePreviewLine(
            this.firstPoint, 
            this.cursorGroup, 
            this.previewLineRef,
            this.scene, 
            this.colors.vane,
            'vane',
            this.lines,
            event,
            this.font,
            this.locationData,
            onViaCreated,
            onCantileverCreated,
            onVaneCreated,
            this.pkProps,
            this.fontsProps,
            this.catenaryType,
          );

        }else if (this.options.draw.via) {

          updatePreviewLine(
            this.firstPoint,
            this.cursorGroup,
            this.previewLineRef,
            this.scene,
            this.colors.via,
            'via',
            this.lines,
            event,
            this.font,
            this.locationData,
            onViaCreated,
            onCantileverCreated,
            onVaneCreated,
            this.pkProps,
            this.fontsProps,
            this.catenaryType,
          );

        }else if (this.options.draw.cantilever) {

          updatePreviewLine(
            this.firstPoint,
            this.cursorGroup,
            this.previewLineRef,
            this.scene,
            this.colors.cantilever,
            'cantilever',
            this.lines,
            event,
            this.font,
            this.locationData,
            onViaCreated,
            onCantileverCreated,
            onVaneCreated,
            this.pkProps,
            this.fontsProps,
            this.catenaryType,
          );
        }

        if(!this.firstPoint.current.point){

          this.cleanPreviewElements();

        }

    } 

  }

  private cleanPreviewElements(){
    this.dimensionInput.style.display = 'none';
    this.dimensionInputAngle.style.display = 'none';
    this.dimensionInputPk.style.display = 'none';
    this.dimensionGroup.visible = false;

    this.firstPoint.current.point = undefined;
    this.firstPoint.current.selectedItem = undefined;
    cleanUpPreviewElements([this.previewCircleRef, this.previewLineRef], this.scene);
    this.previeSelectedRef.current = [];
  }


  private onMouseClickSelected(event:MouseEvent):void{
    this.handleIntersection(event);
 }

  private handleIntersection(event: MouseEvent): void {
    if (!this.camera || !this.container || !this.isSelecting) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Check for valid intersections
    for (const intersect of intersects) {
      const object = intersect.object;
      
      if ((object instanceof THREE.Mesh) && object.userData.type) {
        const type = object.userData.type;
        
        if (
          (type === 'cantilever' && this.options.selection.cantilever) ||
          (type === 'via' && this.options.selection.via) ||
          (type === 'vane' && this.options.selection.vane) ||
          (type === 'pole' && this.options.selection.pole)
        ) {
          // Store original color if not already stored
          const material = object.material as THREE.MeshBasicMaterial;
          if (!material.userData.originalColor) {
            material.userData.originalColor = material.color.getHex();
          }
        
          // Highlight selected object
          material.color.setHex(0xffff00); // Yellow highlight
          this.previeSelectedRef.current.push(object);
          break;
        }
      }
    }
  }

  // Add this new helper method
  private resetSelection(): void {
    if (this.previeSelectedRef.current) {
        this.previeSelectedRef.current.forEach(object => {
            const material = object.material as THREE.MeshBasicMaterial;
            if (material && material.userData.originalColor !== undefined) {
                material.color.setHex(material.userData.originalColor);
            }
        });
        this.previeSelectedRef.current = [];
    }
  }

  private onMouseClick(event:MouseEvent):void{
    this.onMouseClickDrawingCursor(event);
    this.onMouseClickSelected(event);
  }

  private handleModalOpen = () => {
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    this.coordinatesElement.current.style.display = 'none';
    document.body.style.cursor = 'default';
  };

  private handleModalClose = () => {
    window.addEventListener('mousemove', this.boundOnMouseMove);
  };


  private addEventListeners():void{
    if(!this.container || !this.camera || !this.cursorGroup) return;
    window.addEventListener('mousemove', this.boundOnMouseMove);
    this.container.addEventListener('wheel', this.boundOnMouseZoom);
    this.container.addEventListener('click', this.boundOnMouseClick);
    this.container.addEventListener('mousedown', this.boundOnMouseDown);
    this.container.addEventListener('mouseup', this.boundOnMouseUp);

    document.addEventListener("modal:open", this.handleModalOpen);
    document.addEventListener("modal:close", this.handleModalClose);

    setupInputs(
      this.firstPoint,
      this.options.draw,
      (x, y) => this.updateCursorPosition(x, y),
      () => this.handleupdateDimensionElements(),
    );

    window.addEventListener('keydown', (e) => {

      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelectedMeshes();
      };

      if (e.key === "Escape" || e.key === "Delete" ) {
        this.cleanPreviewElements();
      };

    });


  }

  private deleteSelectedMeshes(): void {
    this.previeSelectedRef.current.forEach(mesh => {
      // Remove from scene
      this.scene.remove(mesh);
      // Dispose of geometry and material
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    // Clear the selection array
    this.previeSelectedRef.current = [];
  }

  private updateCursorPosition(x: number, y: number): void {
    if (!this.cursorGroup || !this.coordinatesElement.current || !this.camera || !this.container) return;
      updateCoordinatesDisplay(
          x, y,
          this.cursorGroup,
          this.camera,
          this.container,
          this.coordinatesElement.current,
          this.options,
          {
              circleRef: this.previewCircleRef,
              lineRef: this.previewLineRef
          }
      );
    }

  private removeLoaderLocation():void {
    const loading = document.querySelector('.loader-locations-'+this.index)
    if(loading){
      loading.classList.add('out')
    }
  }

  private addLoaderLocation():void {
    const loading = document.querySelector('.loader-locations-'+this.index)
    if(loading){
      loading.classList.remove('out')
    }
  }

  public updateOptionsData(options: LocationViewerOptions): void {

    const olderOptions = this.options;

    if(this.options !== options){

      setupInputs(
        this.firstPoint,
        options.draw,
        (x, y) => this.updateCursorPosition(x, y),
        () => this.handleupdateDimensionElements()
      );

      this.options = options;

      this.isDrawing = options.draw.pole || options.draw.vane || options.draw.via || options.draw.cantilever;

      this.isSelecting = options.selection.pole || options.selection.vane || options.selection.via || options.selection.cantilever;

      this.resetSelection();

      this.cleanPreviewElements();

      if(this.options.camera !== olderOptions.camera){

        this.addLoaderLocation();

        this.cleanUpContent("all");

        this.addCameraAndControls();

        this.renderObjects();

        this.renderLabels();

        if(this.options.camera === "orthographic"){

          addGrid(this.scene, this.grid, this.height, this.width);

        }

        this.removeLoaderLocation();
      };

    }
  }

  public updateLocationData(location:LocationParams){

    this.addLoaderLocation();
    this.cleanUpContent("objects");
    this.locationData = location;
    this.renderObjects();
    this.renderLabels();
    this.removeLoaderLocation();
  }


  private cleanUpContent(type:'objects'|'all'): void {
    if(!this.locationData) return;
    // collect all materials so we can dispose them just once
    const materials = new Set<THREE.Material>();

    /**
    * Recursively clean out an Object3D and all its descendants:
    *  1. Recurse into children (so we do a bottom-up cleanup)
    *  2. Dispose geometry (if any)
    *  3. Collect + remove material(s)
    *  4. Remove this object from its parent
    */

    const cleanObject = (obj: THREE.Object3D) => {
      // 1. clean children first
      obj.children.slice().forEach(child => cleanObject(child));

      // 2. dispose geometry
      //    - works for both Mesh and Line, since both have .geometry
      if ((obj as any).geometry instanceof THREE.BufferGeometry) {
        (obj as any).geometry.dispose();
      }

      // 3. collect material(s)
      const mat = (obj as any).material;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach(m => materials.add(m));
        } else {
          materials.add(mat);
        }
      }

      // 4. detach from parent
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    };

    // Helper to look up by name and kick off our recursion
    const cleanByName = (name: string) => {
      const root = this.scene.getObjectByName(name);
      if (root) cleanObject(root);
    };

    if(this.options.camera === 'perspective'){

      // Clean out all the “via” and “pole” groups you’ve been tracking
      this.lines.current
        .filter(item => item.type === "via")
        .forEach(item => cleanByName(item.line.name));

      this.lines.current
        .filter(item => item.type === "vane")
        .forEach(item => cleanByName(item.line.name));

      this.circles.current
        .filter(item => item.type === "pole")
        .forEach(item => cleanByName(item.circle.name));

      if(type === "all"){

        console.log("test if this is executed");

        if (this.grid.current) {

            console.log(this.grid.current);
            console.log("this should be executed");
            const materials = new Set<THREE.Material>();

            // Dispose geometries and collect materials
            this.grid.current.traverse((child) => {
                if (child instanceof THREE.Line) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => materials.add(mat));
                        } else {
                            materials.add(child.material);
                        }
                    }
                }
            });

            // Dispose all unique materials
            materials.forEach(mat => mat.dispose());

            // Remove from scene and clean up
            this.scene.remove(this.grid.current);

            this.grid.current.clear(); // Optional, resets the group

        }

        cleanByName(this.cursorGroup);

      }

    }else{

      this.locationData.vanes.forEach(vaneDataContent => {

        vaneDataContent.links.curves.forEach((item,index) => {
          for(let i = 0; i < (item.curve.length - 1); i++){
            cleanByName(vaneDataContent.vane.id+'_vane_curves_'+index+"_"+i);
          }
        })

        vaneDataContent.links.rects.forEach((item,index) => {
          cleanByName(vaneDataContent.vane.id+'_vane_rects_'+index);
        })

      })

      this.locationData.vias.forEach(via => {

        via.params.lines.forEach(line => { 
          cleanByName(line.id);

        });

        via.poles.forEach(pole => {
          cleanByName(pole.pole.external_id);

          if(pole.cantilevers.length > 1){

            cleanByName(pole.pole.external_id + "_support_1");
            cleanByName(pole.pole.external_id + "_support_2");
          }

          pole.cantilevers.forEach(cantilever => {
            cleanByName("axis_line_desviation_"+cantilever.cantilever.external_id);
            cleanByName("axis_line_centered_"+cantilever.cantilever.external_id);
            cleanByName("axis_line_contact_plane_"+cantilever.cantilever.external_id);
            cleanByName("zero_plane_"+cantilever.cantilever.external_id);
            cleanByName("zero_plane_elevation_"+cantilever.cantilever.external_id);

            cantilever.links.forEach((link)=>{
              cleanByName(link.elementId);
            })
          })
        });

      });

    }

    // finally, dispose every material we collected
    materials.forEach(m => m.dispose());

    // reset your trackers
    this.lines.current = [];
    this.circles.current = [];

  }


  public dispose(): void {
    // Remove event listeners
    
    window.removeEventListener('resize', this.onResize.bind(this));
    window.removeEventListener('mousemove', this.boundOnMouseMove);

    document.removeEventListener("modal:open", this.handleModalOpen);
    document.removeEventListener("modal:close", this.handleModalClose);

    if(this.container){
      this.container.addEventListener('wheel', this.boundOnMouseZoom);
      this.container.removeEventListener('click', this.boundOnMouseClick);
      this.container.removeEventListener('mousedown', this.boundOnMouseDown);
      this.container.removeEventListener('mouseup', this.boundOnMouseUp);
      this.container.removeEventListener('mousemove', this.boundOnScreenDrag);
    }

    // Dispose controls
    this.controls?.dispose();

    // Dispose cursor group
    if (this.cursorGroup) {
      this.cursorGroup.children.forEach(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.scene.remove(this.cursorGroup);
    }

    // Dispose grid
    if (this.grid.current) {
        const materials = new Set<THREE.Material>();

        // Dispose geometries and collect materials
        this.grid.current.traverse((child) => {
            if (child instanceof THREE.Line) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => materials.add(mat));
                    } else {
                        materials.add(child.material);
                    }
                }
            }
        });

        // Dispose all unique materials
        materials.forEach(mat => mat.dispose());

        // Remove from scene and clean up
        this.scene.remove(this.grid.current);
        this.grid.current.clear(); // Optional, resets the group
    }


    this.circles.current = [];

    this.cleanUpContent("objects");


    if(this.dimensionGroup.children){
      this.dimensionGroup.children.forEach(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          child.material.dispose();
        } else if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }
    this.scene.remove(this.dimensionGroup);

    if(this.dimensionInput){
      this.dimensionInput.remove();
    }

    if(this.dimensionInputAngle){
      this.dimensionInputAngle.remove();
    }

    if(this.dimensionInputPk){
      this.dimensionInputPk.remove();
    }

    // Clean up scene
    // Comprehensive scene cleanup
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          (child.material as THREE.Material).dispose();
        }
      }
    }

    // Dispose renderer
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();

    // Remove DOM elements
    if (this.coordinatesElement.current) {
      this.coordinatesElement.current.remove();
    }
  }

  private render(): void {
    if (!this.renderer || !this.camera || !this.scene) return;

    const animate = () => {
      requestAnimationFrame(animate);

      try {
        this.renderer!.render(this.scene, this.camera!);

      } catch (e) {
        console.error("Render error:", e);
      }
    };

    animate();
  }
}
