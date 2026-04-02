import * as THREE from 'three';
import { doLinesIntersect, generateUniqueId, vec3ToObj, objToVec3, isPointOnSegment, checkLineIntersection } from './helper';
import { addViaAndTickLabels } from './labels';
import { Font } from 'three-stdlib';

export function addVia(
    via: ViaParams,  
    lines: LocationLines, 
    scene: THREE.Scene, 
    color: number,
    pkProps:PkProps
) {

  via.params.lines.map(lineObject => {
    const geometry              = new THREE.BufferGeometry();
    const material              = new THREE.LineBasicMaterial({ color: color });
    const start                 = objToVec3(lineObject.start);
    const end                   = objToVec3(lineObject.end);
    const points                = [start, end];

    geometry.setFromPoints(points);

    const line                  = new THREE.Line(geometry, material);
    line.userData.start         = start;
    line.userData.end           = end;
    line.userData.type          = 'via';
    line.userData.external_id   = via.external_id;
    line.userData.via_id        = via.id;
    line.userData.pk            = lineObject.pk;
    line.userData.color         = color;
    line.name                   = lineObject.id;


    lines.current.push(
      { 
        line: line, 
        type: 'via' 
      }
    );

    scene.add(line);

    addPerpendicularTicks(
      line,
      via.external_id,
      pkProps,
      Number(lineObject.pk),
      color
    );

  });
}


  export async function handleViaCreation(
    line: THREE.Line, 
    lines: LocationLines, 
    scene: THREE.Scene, 
    cursorPosition: { x: number, y: number }, 
    font: Font|undefined, 
    locationData: LocationParams,
    onViaCreated: (via: ViaParams) => void,
    pkProps:PkProps,
    fontsProps:FontsProps,
  ) {
    const intersectingVias = checkLineIntersection(line.userData.start, line.userData.end, lines);

    let via:ViaParams|null = null;

    if (intersectingVias.length > 0) {
      const response = await showViaSelectionModal(cursorPosition, intersectingVias, locationData, line);

      line.userData.pk = response.params.lines.find((item_line) => item_line.id == line.name).pk;
      line.userData.external_id = response.external_id;
      via = response;
      
    } else {
      const response = await showViaNamePrompt(cursorPosition, locationData, line);

      line.userData.pk = response.params.lines.find((item_line) => item_line.id == line.name).pk;
      line.userData.external_id = response.external_id;
      via = response;
    }

    if (!line.userData.external_id) {
      scene.remove(line);
      return;
    }

    line.userData.via_id = via.id;

    onViaCreated(via);

    lines.current.push(
      {
        line: line,
        type: 'via'
      }
    );

    scene.add(line);

    addPerpendicularTicks(
      line,
      line.userData.external_id,
      pkProps,
      Number(line.userData.pk),
      line.userData.color
    );

    addViaAndTickLabels(
      line,
      font,
      line.userData.color,
      fontsProps,
    );

    window.dispatchEvent(
      new CustomEvent('projectTypeMessage', {
        detail: { type: 'success', message: 'via.create.success', params: { id:line.userData.external_id } }
      })
    );

  }


  // Update the show functions to use the modal manager
  async function showViaNamePrompt(position: { x: number, y: number }, locationData: LocationParams, lineData: THREE.Line): Promise<ViaParams|null> {
    return viaModalManager.showModal(position, 'new', locationData, lineData);
  }
  
  async function showViaSelectionModal(position: { x: number, y: number }, viaData: { line:THREE.Line, type:'via'|'vane'|'cantilever'|'via_ticks'}[], locationData: LocationParams, lineData: THREE.Line): Promise<ViaParams|null> {
    return viaModalManager.showModal(position, 'selection', locationData, lineData, viaData);
  }


  interface ViaModalManager {
    showModal: (position: { x: number, y: number }, type: 'new' | 'selection', locationData: LocationParams, lineData: THREE.Line, viaData: { line:THREE.Line, type:'via'|'vane'|'cantilever'|'via_ticks'}[]) => Promise<ViaParams|null>;
    hideModal: () => void;
  }
  
  // Create a modal manager that can be accessed globally
  export const viaModalManager: ViaModalManager = {
    showModal: async (position, type, locationData, lineData, viaData?: {line: THREE.Line, type:'via'|'vane'|'cantilever'|'via_ticks'}[]) => {
      return new Promise((resolve) => {

        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('modal-overlay', 'z-[99]');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);';

        const modal = document.createElement('div');
        modal.classList.add('via-modal', 'z-[100]');
        modal.style.position = 'absolute';
        if(position.x > window.innerWidth/2){
          modal.style.right = `${window.innerWidth - position.x}px`;
        }else{
          modal.style.left = `${position.x}px`;
        }
        if(position.y > window.innerHeight/2){
          modal.style.bottom = `${window.innerHeight - position.y}px`;
        }else{
          modal.style.top = `${position.y}px`;
        }
  
        
        const form = document.createElement('form');
        form.onsubmit = async (e) => {
          e.preventDefault();
          if (type === 'new') {
            const inputExternalId = form.querySelector('.external_id');
            const external_id     = inputExternalId ? inputExternalId.value : '';

            const inputPk         = form.querySelector('.start_pk');
            let pk              = inputPk ? Number(inputPk.value) : '';
            pk = pk*1000000;

            const response = await fetch('/api/via', {
              method: 'POST',
              body: JSON.stringify(
                { 
                  external_id: external_id, 
                  location_id: locationData.id,
                  location:locationData.external_id,
                  project: locationData.project,
                  project_id: locationData.project_id, 
                  params: { 
                    lines: [
                      { 
                        id: lineData.name, 
                        pk:pk,
                        start: vec3ToObj(lineData.userData.start), 
                        end: vec3ToObj(lineData.userData.end) 
                      }
                    ] 
                  }, 
                  vanes: [],
                }
              )
            });
            
            const newVia = await response.json();

            overlay.remove();
            modal.remove();
            resolve(newVia);

          } else {
            const select = form.querySelector('select');
            const value = select ? select.value : '';
            

            const viaSelected = viaData.find((via) => via.line.name == value);


            let newPk = 0;

            if(!viaSelected){
              overlay.remove();
              modal.remove();
              resolve(null);
            }

            const viaStart = viaSelected.line.userData.start;
            const viaEnd = viaSelected.line.userData.end;

            const lineStart = lineData.userData.start;
            const lineEnd = lineData.userData.end;

            let newStart, newEnd;

            newPk = Number(viaSelected.line.userData.pk);

            if (isPointOnSegment(lineStart, viaStart, viaEnd)) {
              newStart = lineStart;
              newEnd = lineEnd;
            } else if (isPointOnSegment(lineEnd, viaStart, viaEnd)) {
              newStart = lineEnd;
              newEnd = lineStart;
            } else {
              console.warn("No matching connection found between lineData and viaSelected.");
              return;
            }

            newPk+= viaStart.distanceTo(newStart);

            const via = locationData.vias.find(via => via.external_id === viaSelected.line.userData.external_id);

            if(!via){
              overlay.remove();
              modal.remove();
              resolve(null);
            }

            const newLine = {
              id: lineData.name,
              pk: newPk,
              start: vec3ToObj(newStart),
              end: vec3ToObj(newEnd)
            }

            const response = await fetch(`/api/via/line/add?id=${via.id}&projectId=${locationData.project_id}`, {
              method: 'POST',
              body: JSON.stringify(
                [
                  newLine
                ]
              )
            });

            via.params.lines.push(newLine)

            overlay.remove();
            modal.remove();
            resolve(via);

          }
        };

        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-btn');
        cancelButton.onclick = () => {
            overlay.remove();
            modal.remove();
            resolve(''); // Empty string indicates cancellation
        };
  
        if (type === 'new') {
          form.innerHTML = `
            <div class="w-full h-auto flex flex-col gap-y-2">
              <input type="text" placeholder="Via name" class="external_id" required />
              <input type="text" placeholder="Initial PK (KM)" class="start_pk" required />
            </div>
            <div class="btn-container flex justify-around gap-2 mt-2">
              <button type="submit">Create</button>
            </div>
          `;
        } else {
          form.innerHTML = `
            <p>Add to existing via:</p>
            <select required class="w-full p-1 mb-2">
              ${viaData?.map(via => `<option value="${via.line.name}">${via.line.userData.external_id}</option>`).join('')}
            </select>
            <div class="btn-container flex justify-around gap-2 mt-2">
              <button type="submit" class="flex-1">Add</button>
              <button type="button" class="new-via flex-1">New Via</button>
            </div>
          `;
          
          const newViaButton = form.querySelector('.new-via');
          if (newViaButton) {
            newViaButton.addEventListener('click', () => {
              overlay.remove();
              modal.remove();
              viaModalManager.showModal(position, 'new', locationData, lineData).then(resolve);
            });
          }
        }

        const btnContainer = form.querySelector('.btn-container');
        btnContainer?.appendChild(cancelButton);
        modal.appendChild(form);
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
      });
    },
    hideModal: () => {
        const overlay = document.querySelector('.modal-overlay');
        const modal = document.querySelector('.via-modal');
        if (overlay) overlay.remove();
        if (modal) modal.remove();
    }
  };

export function addPerpendicularTicks(
  line:THREE.Line,
  via_external_id:string,
  pkProps:PkProps,
  pk: number,
  color:number
) {

  const positions = line.geometry.attributes.position.array;
  const start = new THREE.Vector3(positions[0], positions[1], positions[2]);
  const end = new THREE.Vector3(positions[3], positions[4], positions[5]);
  // compute main-line direction & length
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();

  // figure out where along the line the first tick falls
  // start “station” is pk; ticks at multiples of step
  const remainder = pk % pkProps.step;
  const firstOffset = remainder === 0 ? 0 : (pkProps.step - remainder);

  // how many ticks will fit
  const totalDistance = length;

  let currentOffset = firstOffset;

  // reference “up” vector to build perp: can be any non-parallel
  const up = new THREE.Vector3(0, 0, 1);
  // if dir is parallel to up, pick another
  if (Math.abs(dir.dot(up)) > 0.999) {
    up.set(1, 0, 0);
  }

  // compute perp direction
  const perp = new THREE.Vector3().crossVectors(dir, up).normalize();

  // for each tick
  while (currentOffset <= totalDistance) {
    // compute center point of tick
    const center = new THREE.Vector3()
      .copy(dir)
      .multiplyScalar(currentOffset)
      .add(start);

    // endpoints of the small line
    const halfWidth = pkProps.width / 2;
    const p1 = new THREE.Vector3()
      .copy(perp)
      .multiplyScalar(halfWidth)
      .add(center);
    const p2 = new THREE.Vector3()
      .copy(perp)
      .multiplyScalar(-halfWidth)
      .add(center);

    // build geometry + material
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat  = new THREE.LineBasicMaterial({ color: color });

    const sub_line = new THREE.Line(geom, mat);
    sub_line.name  = generateUniqueId();
    sub_line.userData.type  = "thick";
    sub_line.userData.pk = currentOffset + pk;
    sub_line.userData.position_1 = p1;
    sub_line.userData.position_2 = p2;

    line.add(sub_line);

    currentOffset += pkProps.step;
  }
}
