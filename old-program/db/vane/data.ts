export const OptionsBrazilianVaneData:{ id:number, model:VaneModelInterface }[] = [
  {
    id:1,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"NORMAL",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:2,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"FIXED_POINT",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:3,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"ANCHORED",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:4,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"ISOLATOR",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  }
]

export const OptionsGermanVaneData:{ id:number, model:VaneModelInterface }[] = [
  {
    id:1,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"NORMAL",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:2,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"FIXED_POINT",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:3,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"ANCHORED",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  },
  {
    id:4,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"ISOLATOR",
        contactWireConfiguration:'SINGLE',
      },
      icon:'vane',
    },
  }
]

export const DefaultsOptions: { id:number, model:VaneModelInterface }[] = [
  ...OptionsBrazilianVaneData,
  ...OptionsGermanVaneData
]

export function getVanesOptions(code:string):{ id:number, model:VaneModelInterface }[] {
  if(code == "BR"){
    return OptionsBrazilianVaneData;
  }else if(code == "GY"){
    return OptionsGermanVaneData;
  }else{
    return DefaultsOptions;
  }
}

export const DefaultsBrazilianVanes: Partial<VaneParams>[] = [
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"NORMAL",
          contactWireConfiguration:"SINGLE"
        },
        icon:'vane',
      },
      contact_wire:{
        weight:0.0019, //kg/mm
        tension_force:1600,//kgf
      },
      support_wire:{
        weight:0.0024,
        tension_force:2000,//kgf
      },
      initial_separation:5000,
      qty_droppers:13,
      dropper_weight:0.0006,
      arrow:false,
      arrow_length:0,
      lifting:false,
      calculation_type:'automatic',
      separation_calculation:true,
      default_properties:{
        vane_length:30000,
        contact_wire_height_a:5500,
        system_height_a:1400,
        lifting_a:0,
        contact_wire_height_b:5500,
        system_height_b:1400,
        lifting_b:0,
      },
    }
  }
]



export const DefaultsGermanVanes: Partial<VaneParams>[] = [
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"NORMAL",
          contactWireConfiguration:"SINGLE"
        },
        icon:'vane',
      },
      contact_wire:{
        weight:0.0019, //kg/mm
        tension_force:1600,//kgf
      },
      support_wire:{
        weight:0.0024,
        tension_force:2000,//kgf
      },
      initial_separation:5000,
      qty_droppers:13,
      dropper_weight:0.0006,
      arrow:false,
      arrow_length:0,
      lifting:false,
      calculation_type:'automatic',
      separation_calculation:true,
      default_properties:{
        vane_length:30000,
        contact_wire_height_a:5500,
        system_height_a:1400,
        lifting_a:0,
        contact_wire_height_b:5500,
        system_height_b:1400,
        lifting_b:0,
      },
    }
  }
]

export const DefaultsVanes: Partial<VaneParams>[] = [
  ...DefaultsGermanVanes,
  ...DefaultsBrazilianVanes
]

export function getDefaultsVanes(code:string):Partial<VaneParams>[] {
  if(code == "BR"){
    return DefaultsBrazilianVanes;
  }else if(code == "GY"){
    return DefaultsGermanVanes;
  }else{
    return DefaultsVanes;
  }
}


