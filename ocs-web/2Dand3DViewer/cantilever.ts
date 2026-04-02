import * as THREE from 'three';
import { doLinesIntersect, generateUniqueId, vec3ToObj, objToVec3, isPointOnSegment, checkLineIntersection } from './helper';
import { Font } from 'three-stdlib';
import {getDefaultsCantilevers, getCantileversOptions} from "../../../db/cantilever/data.ts";
import { addCantileverLabels} from './labels.ts';

export function addCantilevers(
    viaLine:{
      id:number;
      pk:number;
      start: { x:number, y:number, z:number };
      end: { x:number, y:number, z:number };
    },
    poleDatacontent:PoleDataContent,
    pole: THREE.Group,  
    color: number,
) {
    // 1) Remove any old cantilever_group on this pole:
    const oldGroup = pole.children.find(
      (c) => c.userData?.type === 'cantilever_group'
    );
    if (oldGroup) {
      pole.remove(oldGroup);
    }

    // 2) Now build a fresh one:
    if(!poleDatacontent.cantilevers || poleDatacontent.cantilevers.length === 0) return null;

    const poleCantilevers:THREE.Group = new THREE.Group();

    const start = objToVec3(viaLine.start); // THREE.Vector3
    const end   = objToVec3(viaLine.end);   // THREE.Vector3
    const point = pole.position.clone();    // THREE.Vector3

    const lineDir = new THREE.Vector3().subVectors(end, start);
    const startToPoint = new THREE.Vector3().subVectors(point, start);

    let t = startToPoint.dot(lineDir) / lineDir.lengthSq();

    const perpendicularPoint = new THREE.Vector3()
      .copy(start)
      .add(lineDir.multiplyScalar(t));

    const direction = new THREE.Vector3()
        .subVectors(perpendicularPoint, point)   // (end − start)
        .normalize();

    const perpDirection = new THREE.Vector3()
        .subVectors(end, start)   // (end − start)
        .normalize();

    const poleTotalOffest = poleDatacontent.pole.params.support_offset + 
      poleDatacontent.pole.params.model.measures.width/2;

    const polePerpOffset = poleDatacontent.cantilevers.length > 1 ? poleDatacontent.pole.params.cat_separation : 0;

    const totalLengthOffset = poleDatacontent.cantilevers.length > 1 ? (polePerpOffset * (poleDatacontent.cantilevers.length - 1))  : 0; 

    const polePerpOffsets = [];

    if (poleDatacontent.cantilevers.length > 1) {
      for (let i = -totalLengthOffset / 2; i <= totalLengthOffset / 2; i += polePerpOffset) {
        polePerpOffsets.push(i);
      }
    } else {
      polePerpOffsets.push(0);
    }

    poleDatacontent.cantilevers.map((cat,index) => {
      const geometry              = new THREE.BufferGeometry();
      const material              = new THREE.LineBasicMaterial({ color: color });

      const newStartWorld = pole.position.clone()
      .add(direction.clone().multiplyScalar(poleTotalOffest))
      .add(perpDirection.clone().multiplyScalar(polePerpOffsets[index]));

      const zig = cat.cantilever.params.zig_zag;

      const newEndWorld = perpendicularPoint.clone()
      .add(direction.clone().multiplyScalar(zig))
      .add(perpDirection.clone().multiplyScalar(polePerpOffsets[index]));

      const newStartLocal = pole.worldToLocal(newStartWorld.clone());
      const newEndLocal   = pole.worldToLocal(newEndWorld.clone());

      const points                = [newStartLocal, newEndLocal];
      geometry.setFromPoints(points);
      const line                  = new THREE.Line(geometry, material);

      line.userData.start         = newStartLocal;
      line.userData.end           = newEndLocal;
      line.userData.wStart        = newStartWorld;
      line.userData.wEnd          = newEndWorld;
      line.userData.type          = 'cantilever';
      line.userData.external_id   = cat.cantilever.external_id;
      line.userData.id            = cat.cantilever.id;
      line.userData.zig_zag       = zig;
      line.userData.pole_id       = cat.cantilever.pole_id;
      line.userData.color         = color;
      line.name                   = "cantilever_"+cat.cantilever.id;

      poleCantilevers.add(line);

    })

    if (poleDatacontent.cantilevers.length > 1) {

      const geometry              = new THREE.BufferGeometry();
      const material              = new THREE.LineBasicMaterial({ color: color });

      const firstLimitWorld = pole.position.clone()
      .add(direction.clone().multiplyScalar(poleTotalOffest))
      .add(perpDirection.clone().multiplyScalar(polePerpOffsets[0]));

      const secondLimitWorld = pole.position.clone()
      .add(direction.clone().multiplyScalar(poleTotalOffest))
      .add(perpDirection.clone().multiplyScalar(polePerpOffsets[polePerpOffsets.length - 1]));

      const firstLimitLocal = pole.worldToLocal(firstLimitWorld.clone());
      const secondLimitLocal   = pole.worldToLocal(secondLimitWorld.clone());

      const points                = [firstLimitLocal, secondLimitLocal];
      geometry.setFromPoints(points);
      const cantilever_support                  = new THREE.Line(geometry, material);

      cantilever_support.userData.start         = firstLimitLocal;
      cantilever_support.userData.end           = secondLimitLocal;
      cantilever_support.userData.type          = 'cantilever_support';

      poleCantilevers.add(cantilever_support);
    }

    poleCantilevers.userData.type = 'cantilever_group'

    return poleCantilevers;

}


  export async function handleCantileverCreation(
    line: THREE.Line, 
    lines: LocationLines, 
    scene: THREE.Scene, 
    cursorPosition: { x: number, y: number }, 
    font: Font|undefined, 
    locationData: LocationParams,
    onCantileverCreated: (viaId: number, newCantilever:CantileverLocationParams) => void,
    fontsProps:FontsProps,
    catenaryType:string,
    firstSelection:THREE.Group|undefined,
    secondSelection:THREE.Line|undefined
  ) {

    let via:ViaParams|null = null;

    if(!firstSelection || !secondSelection || secondSelection.userData.type != 'via') return;

    const via_id = secondSelection.userData.via_id;
    const line_id = firstSelection.userData.line_id;
    const pole_id = firstSelection.userData.id;
    const pole_external_id = firstSelection.userData.external_id;

    via = locationData.vias.find(v => v.id === via_id);

    const cantileverDefaultTypes  = getDefaultsCantilevers(catenaryType);
    const cantileverModelTypes    = getCantileversOptions(catenaryType);

    const {poleDatacontent, external_id } = await showCantileverNamePrompt(
      cursorPosition,
      line,
      cantileverModelTypes,
      cantileverDefaultTypes,
      via,
      pole_external_id,
      pole_id
    );

    if (!poleDatacontent) {
      return;
    }

    onCantileverCreated(via.id, poleDatacontent);

    const viaLine = via.params.lines.find((l) => l.id == line_id );

    const cantileversGroupCreated = addCantilevers(
        viaLine,
        poleDatacontent,
        firstSelection,
        line.userData.color
    );

    if(cantileversGroupCreated){

      lines.current.push(
        {
          line: cantileversGroupCreated,
          type: 'cantilever'
        }
      );

      firstSelection.add(cantileversGroupCreated);

      addCantileverLabels(cantileversGroupCreated,font,fontsProps);

      window.dispatchEvent(
        new CustomEvent('projectTypeMessage', {
          detail: { type: 'success', message: 'cantilever.create.success', params: { id:external_id } }
        })
      );

    }

  }

  // Update the show functions to use the modal manager
  async function showCantileverNamePrompt(
    cursorPosition: { x: number, y: number }, 
    lineData: THREE.Line,
    cantileverModelTypes:{ id:number, model:ModelInterface }[],
    cantileverDefaultTypes:Partial<CantileverParams>[],
    via:ViaParams,
    external_id:string,
    pole_id:number
): Promise<ViaParams|null> {
    return cantileverModalManager.showModal(
      cursorPosition,
      lineData,
      cantileverModelTypes,
      cantileverDefaultTypes,
      via,
      external_id,
      pole_id
    );
  }

  // Create a modal manager that can be accessed globally
  export const cantileverModalManager = {
    showModal: async (
      cursorPosition,
      lineData,
      cantileverModelTypes,
      cantileverDefaultTypes,
      via,
      pole_external_id,
      pole_id
    ) => {
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
            const inputExternalId  = form.querySelector('.external_id');
            const external_id      = inputExternalId ? inputExternalId.value : '';

            const inputZigZag      = form.querySelector('.zig_zag');
            const zig_zag          = inputZigZag ? Number(inputZigZag.value) : 0;

            const select = form.querySelector('select');
            const value = select ? select.value : '';

            const cantileverTypeSelected = cantileverModelTypes.find((type) => type.id == Number(value));

            if(!cantileverTypeSelected) return;

            let cantileverData = cantileverDefaultTypes.find((cantileverdf) => 
              cantileverdf.params.model.type.configuration == cantileverTypeSelected.model.type.configuration &&
              cantileverdf.params.model.type.contactWireConfiguration == cantileverTypeSelected.model.type.contactWireConfiguration
            );

            if(!cantileverData) return;

            cantileverData.params.pv = vec3ToObj(lineData.userData.end);
            cantileverData.params.zig_zag = zig_zag;


            const response = await fetch(`/api/via/cantilever/add?id=${via.id}&projectId=${via.project_id}`, {
              method: 'POST',
              body: JSON.stringify(
                { 
                  pole_id:pole_id,
                  external_id: external_id, 
                  newCantilever: cantileverData.params,
                }
              )
            });

            const poleDatacontent = await response.json();

            overlay.remove();
            modal.remove();
            resolve({poleDatacontent:poleDatacontent, external_id:external_id });

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
            <input type="text" placeholder="cantilever name" class="external_id" required />
            <input type="text" placeholder="Zig-Zag" class="zig_zag" required />
            <select required class="w-full p-1 mb-2">
              ${cantileverModelTypes?.map(type => `<option value="${type.id}">${type.model.type.configuration} - ${type.model.type.contactWireConfiguration} </option>`).join('')}
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
