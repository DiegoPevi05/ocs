import * as THREE from 'three';
import { getPolesOptions, getDefaultsPoles} from "../../../db/pole/data.ts";
import {vec3ToObj, objToVec3, drawCircle, drawRectangle, drawCross, lengthVector, subtractVectors } from './helper';
import { addCantilevers } from './cantilever.ts';
import { addPoleLabels } from './labels.ts';


const createPole = (poleDatacontent:PoleDataContent, via:ViaParams, color:number) => {
    const group = new THREE.Group();

    // 1) Main shape (circle or rectangle)
    const { shape } = poleDatacontent.pole.params.model.type;
    const { width, length } = poleDatacontent.pole.params.model.measures;

    let shapeMesh;
    if (shape === 'CIRCLE') {
      shapeMesh = drawCircle(width, color);
    } else {
      shapeMesh = drawRectangle(width, length, color);
    }
    group.add(shapeMesh);

    // 2) Surrounding red circle of radius 500
    const surroundDiameter = 700 * 2; // radius 500
    const surroundCircle = drawCircle(surroundDiameter, 0xff0000);
    group.add(surroundCircle);

    const centerCross = drawCross(surroundDiameter*1.5, 0xff0000)
    group.add(centerCross);

    // 3) Position group in world space
    const pos = poleDatacontent.position;

    group.position.set(pos.x, pos.y, 0);

    // 4) Rotate group so its local Z-axis (shape normal) aligns with its line direction
    const line = via.params.lines.find(l => l.id === poleDatacontent.pole.line_id);

    let dir = null;

    if (line) {
      const start = objToVec3(line.start);
      const end   = objToVec3(line.end);

      const lineDir = new THREE.Vector3().subVectors(end, start);
      const startToPoint = new THREE.Vector3().subVectors(group.position, start);
      let t = startToPoint.dot(lineDir) / lineDir.lengthSq();

      const perpendicularPoint = new THREE.Vector3()
        .copy(start)
        .add(lineDir.multiplyScalar(t));

      dir = new THREE.Vector3()
          .subVectors(perpendicularPoint, group.position)   // (end − start)
          .normalize();

      const angle = Math.atan2(dir.y, dir.x);

      group.rotation.z = angle;

    }


    
    // 5) Metadata
    group.userData = {
      type: 'pole',
      external_id: poleDatacontent.pole.external_id,
      id: poleDatacontent.pole.id,
      pv: lengthVector(subtractVectors({x:poleDatacontent.position.x,y:poleDatacontent.position.y,z:0},poleDatacontent.pv)),
      pole_type:poleDatacontent.pole.params.model.name,
      line_id:poleDatacontent.pole.line_id,
      dir:dir
    };

    group.name = poleDatacontent.pole.external_id;

    return group;

}

/**
 * Adds one or more poles to the scene based on via.params.poles
 * Each pole is a THREE.Group containing either a circle or rectangle + diagonals,
 * centered at the group's origin, then positioned in world space.
 */
export function addPoles(
  via: ViaParams,
  circles: LocationCircles,
  lines: LocationLines, 
  scene: THREE.Scene,
  color: {wire: number, via: number, cantilever: number, pole: number, dimensions:number},
) {

  via.poles.forEach(poleDataContent => {
    const poleCreated = createPole(poleDataContent, via, color.pole);
    // 6) Track and add
    circles.current.push({ circle: poleCreated, type: 'pole' });

    scene.add(poleCreated);

    const viaLine = via.params.lines.find((l) => l.id == poleCreated.userData.line_id );

    const poleProperties = via.poles.find((p) => p.id == poleCreated.userData.id);

    const cantileversGroupCreated = addCantilevers(
        viaLine,
        poleDataContent,
        poleCreated,
        color.cantilever
    );

    if(cantileversGroupCreated){

      lines.current.push({ line: cantileversGroupCreated, type: 'cantilever' });

      poleCreated.add(cantileversGroupCreated);

    }

  });
}

  export async function handlePoleCreation(
    pk_line:{ pk:number, line_intersection:THREE.Vector3, line_name:string, via_id:number },
    circles: LocationCircles,
    scene: THREE.Scene, 
    cursorPosition: { x: number, y: number },
    position:THREE.Vector3,
    font: Font|undefined, 
    locationData: LocationParams,
    onpoleCreated: (viaId: number, newPole:PoleLocationParams) => void,
    fontsProps:FontsProps,
    catenaryType:string,
    isPoleCreating:{ current:boolean }
  ) {

    let via:ViaParams|null = null;
    
    const poleModelTypes = getPolesOptions(catenaryType);
    const poleDefaultTypes = getDefaultsPoles(catenaryType);

    const {poleObject, external_id} = await showPoleNamePrompt(position,cursorPosition, locationData, pk_line, poleModelTypes, poleDefaultTypes);

    if (!poleObject) {
      isPoleCreating.current = false;
      return;
    }

    via = locationData.vias.find(v => v.id === pk_line.via_id);

    onpoleCreated(via.id, poleObject);

    const poleCreatedGroup = createPole(poleObject, via);

    circles.current.push(
      {
        circle: poleCreatedGroup,
        type: 'pole'
      }
    );

    scene.add(poleCreatedGroup);

    addPoleLabels(
      poleCreatedGroup,
      font,
      fontsProps,
    );

    window.dispatchEvent(
      new CustomEvent('projectTypeMessage', {
        detail: { type: 'success', message: 'pole.create.success', params: { id:external_id } }
      })
    );

    isPoleCreating.current = false;

  }

  // Update the show functions to use the modal manager
  async function showPoleNamePrompt(
    polePosition:THREE.Vector3, 
    cursorPosition: { x: number, y: number },
    locationData: LocationParams,
    pk_line: { pk:number, line_intersection:THREE.Vector3, line_name:string, via_id:number },
    poleModelTypes:{ id:number, model:PoleModelInterface }[],
    poleDefaultTypes:PoleLocationParams[]
  ): Promise<{poleObject:PoleDataContent,external_id:string }|null> {
    return poleModalManager.showModal(polePosition,cursorPosition, locationData, pk_line, poleModelTypes, poleDefaultTypes);
  }

  // Create a modal manager that can be accessed globally
  export const poleModalManager = {
    showModal: async (polePosition, cursorPosition, locationData, pk_line, poleModelTypes, poleDefaultTypes) => {
      return new Promise((resolve) => {

        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('modal-overlay', 'z-[99]');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);';

        const modal = document.createElement('div');
        modal.classList.add('via-modal', 'z-[100]');
        modal.style.position = 'absolute';
        if(cursorPosition.x > window.innerWidth/2){
          modal.style.right = `${window.innerWidth - cursorPosition.x}px`;
        }else{
          modal.style.left = `${cursorPosition.x}px`;
        }
        if(cursorPosition.y > window.innerHeight/2){
          modal.style.bottom = `${window.innerHeight - cursorPosition.y}px`;
        }else{
          modal.style.top = `${cursorPosition.y}px`;
        }

        
        const form = document.createElement('form');
        form.onsubmit = async (e) => {
          e.preventDefault();
            const inputExternalId = form.querySelector('.external_id');
            const external_id     = inputExternalId ? inputExternalId.value : '';

            const select = form.querySelector('select');
            const value = select ? select.value : '';

            const poleTypeSelected = poleModelTypes.find((type) => type.id == Number(value));

            if(!poleTypeSelected) return;

            let poleData = poleDefaultTypes.find((poledf) => poledf.model.name == poleTypeSelected.model.name );

            if(!poleData) return;

            poleData.position = vec3ToObj(polePosition);

            poleData.pk = pk_line.pk;
            poleData.pv = vec3ToObj(pk_line.line_intersection);

            const via = locationData.vias.find(v => v.id === pk_line.via_id);

            if(!via) return;

            const response = await fetch(`/api/via/pole/add?id=${via.id}&projectId=${via.project_id}`, {
              method: 'POST',
              body: JSON.stringify(
                { 
                  external_id:external_id,
                  line_id: pk_line.line_name,
                  params:poleData
                }
              )
            });
            
            const poleObject = await response.json();

            overlay.remove();
            modal.remove();
            resolve({poleObject, external_id} );
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
  
        form.innerHTML = `
          <div class="w-full h-auto flex flex-col gap-y-2">
            <input type="text" placeholder="Pole Name" class="external_id" required />
            <select required class="w-full p-1 mb-2">
              ${poleModelTypes?.map(type => `<option value="${type.id}">${type.model.name}</option>`).join('')}
            </select>
          </div>
          <div class="btn-container flex justify-around gap-2 mt-2">
            <button type="submit">Create</button>
          </div>
        `;

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
