import * as THREE from 'three';
import { doLinesIntersect, generateUniqueId, vec3ToObj, objToVec3, isPointOnSegment, checkLineIntersection } from './helper';
import { addViaAndTickLabels } from './labels';
import { Font } from 'three-stdlib';
import {getDefaultsVanes, getVanesOptions} from "../../../db/vane/data.ts";

  export function addVane(
      vane: VaneDataContent,  
      lines: LocationLines, 
      scene: THREE.Scene, 
      color: number
  ) {

      const geometry              = new THREE.BufferGeometry();
      const material              = new THREE.LineBasicMaterial({ color: color });

      const cantilever_1 = scene.getObjectByName("cantilever_"+vane.vane.cantilevers[0].id);
      const cantilever_2 = scene.getObjectByName("cantilever_"+vane.vane.cantilevers[1].id);

      const start                 = cantilever_1.userData.wEnd;
      const end                   = cantilever_2.userData.wEnd;

      const points                = [start, end];

      geometry.setFromPoints(points);

      const line                  = new THREE.Line(geometry, material);
      line.userData.start         = start;
      line.userData.end           = end;
      line.userData.type          = 'via';
      line.userData.external_id   = vane.vane.external_id;
      line.userData.cantilevers   = vane.vane.cantilevers;
      line.userData.color         = color;
      line.name                   = vane.vane.id;


      lines.current.push(
        { 
          line: line, 
          type: 'vane' 
        }
      );

      scene.add(line);

  }


  export async function handleVaneCreation(
    line: THREE.Line, 
    lines: LocationLines, 
    scene: THREE.Scene, 
    cursorPosition: { x: number, y: number }, 
    font: Font|undefined, 
    locationData: LocationParams,
    onVaneCreated: (newVane:VaneLocationParams) => void,
    fontsProps:FontsProps,
    catenaryType:string,
    firstSelection:THREE.Group|undefined,
    secondSelection:THREE.Group|undefined
  ) {

    let via:ViaParams|null = null;

    if(!firstSelection || !secondSelection 
    || firstSelection.userData.type != 'cantilever'
    || secondSelection.userData.type != 'cantilever') return;

    const vaneDefaultTypes  = getDefaultsVanes(catenaryType);
    const vaneModelTypes    = getVanesOptions(catenaryType);

    const {vaneObject, external_id } = await showVaneNamePrompt(
      cursorPosition,
      vaneDefaultTypes,
      vaneModelTypes,
      firstSelection,
      secondSelection,
      locationData
    );

    onVaneCreated(vaneObject);

    lines.current.push(
      {
        line: line,
        type: 'vane'
      }
    );

    scene.add(line);

    window.dispatchEvent(
      new CustomEvent('projectTypeMessage', {
        detail: { type: 'success', message: 'vane.create.success', params: { id:external_id } }
      })
    );

  }


  // Update the show functions to use the modal manager
  async function showVaneNamePrompt(
    position:{ x: number, y: number },
    vaneDefaultTypes:Partial<VaneParams>[],
    vaneModelTypes:{ id:number, model:VaneModelInterface }[],
    object_1:THREE.Group|undefined,
    object_2:THREE.Group|undefined,
    locationData: LocationParams,
  ): Promise<{vaneObject:VaneDataContent, external_id:string}|null> {
    return vaneModalManager.showModal(position, vaneDefaultTypes, vaneModelTypes, object_1, object_2, locationData );
  }

  interface VaneModalManager {
    showModal: (
      position:{ x: number, y: number },
      vaneDefaultTypes:Partial<VaneParams>[],
      vaneModelTypes:{ id:number, model:VaneModelInterface }[],
      object_1:THREE.Group|undefined,
      object_2:THREE.Group|undefined,
      locationData: LocationParams,
      ) => Promise<VaneDataContent|null>;
    hideModal: () => void;
  }
  
  // Create a modal manager that can be accessed globally
  export const vaneModalManager: VaneModalManager = {
    showModal: async (
      position,
      vaneDefaultTypes,
      vaneModelTypes,
      object_1,
      object_2,
      locationData
    ) => {
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
          let external_id     = "";

          const select = form.querySelector('select');
          const value = select ? select.value : '';

          const vaneTypeSelected = vaneModelTypes.find((type) => type.id == Number(value));

          if(!vaneTypeSelected) return;

          let vaneData = vaneDefaultTypes.find((vanedf) => (
            vanedf.params.model.type.configuration == vaneTypeSelected.model.type.configuration && 
            vanedf.params.model.type.contactWireConfiguration == vaneTypeSelected.model.type.contactWireConfiguration
          ));

          if(!vaneData) return;

          const cantilevers = [];

          if(object_1.userData.type === "cantilever"){
            cantilevers.push({ id:object_1.userData.id, external_id:object_1.userData.external_id })
          }else{
            return;
          }

          if(object_2.userData.type === "cantilever"){
            cantilevers.push({ id:object_2.userData.id, external_id:object_2.userData.external_id })
          }else{
            return;
          }
          
          external_id = object_1.userData.external_id+"/"+object_2.userData.external_id;

          const response = await fetch(`/api/via/vane/add?projectId=${locationData.project_id}`, {
            method: 'POST',
            body: JSON.stringify(
              { 
                external_id: external_id, 
                params:vaneData.params,
                cantilevers
              }
            )
          });
          
          const vaneObject = await response.json();

          overlay.remove();
          modal.remove();

          resolve({vaneObject, external_id});
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
            <select required class="w-full p-1 mb-2">
              ${vaneModelTypes?.map(type => `<option value="${type.id}">${type.model.type.configuration}</option>`).join('')}
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
