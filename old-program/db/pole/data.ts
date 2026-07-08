export const OptionsPoleGermanData:{ id:number, model:PoleModelInterface }[] = [
  {
    id:1,
    model:{
      code:"GY",
      type:{
        shape:'RECTANGLE',
        cantileverConfiguration:'NONE',
      },
      measures:{
        height:8500,
        width:594,
        length:200,
        thickness:5,
        bottom_screw:32.1
      },
      name:'2W200',
      icon:'pole_section'
    },
  },
]

export const OptionsPoleBrazilianData:{id:number, model:PoleModelInterface}[] = [
  {
    id:1,
    model:{
      code:"BR",
      type:{
        shape:'RECTANGLE',
        cantileverConfiguration:'NONE',
      },
      measures:{
        height:8500,
        width:593,
        length:200,
        thickness:5,
        bottom_screw:32.1
      },
      name:'2W200',
      icon:'pole_section'
    },
  },
  {
    id:2,
    model:{
      code:"BR",
      type:{
        shape:'RECTANGLE',
        cantileverConfiguration:'NONE',
      },
      measures:{
        height:8500,
        width:594,
        length:251,
        thickness:5,
        bottom_screw:35.8
      },
      name:'2W500',
      icon:'pole_section'
    },
  },
  {
    id:3,
    model:{
      code:"BR",
      type:{
        shape:'RECTANGLE',
        cantileverConfiguration:'NONE',
      },
      measures:{
        height:12500,
        width:595,
        length:309,
        thickness:5,
        bottom_screw:35.8
      },
      name:'2W310',
      icon:'pole_section'
    },
  },
]

export const OptionsPoleData:{ id:number, model:PoleModelInterface }[] = [
  ...OptionsPoleGermanData,
  ...OptionsPoleBrazilianData,
]

export function getPolesOptions(code:string):{ id:number, model:PoleModelInterface }[] {
  if(code == "BR"){
    return OptionsPoleBrazilianData;
  }else if(code == "GY"){
    return OptionsPoleGermanData;
  }else{
    return OptionsPoleData;
  }
}

export const DefaultsGermanPoles:PolePropertiesParams[] = [
    {
      position: {x:0, y:0, z:0},
      model:{
        code:"BR",
        type:{
          shape:'RECTANGLE',
          cantileverConfiguration:'NONE',
        },
        measures:{
          height:8500,
          width:593,
          length:200,
          thickness:5,
          bottom_screw:32.1
        },
        name:'2W200',
        icon:'pole_section'
      },
      cat_separation:1000,
      support_offset:90,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      esc:720,
      pv:2100,
      pk:0
    }
]

export const DefaultsBrazilianPoles:PolePropertiesParams[] = [
    {
      position: {x:0, y:0, z:0},
      model:{
        code:"BR",
        type:{
          shape:'RECTANGLE',
          cantileverConfiguration:'NONE',
        },
        measures:{
          height:8500,
          width:593,
          length:200,
          thickness:5,
          bottom_screw:32.1
        },
        name:'2W200',
        icon:'pole_section'
      },
      cat_separation:1000,
      support_offset:90,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      esc:720,
      pv:{x:0,y:3390,z:0},
      pk:0
    },
    {
      position: {x:0, y:0, z:0},
      model:{
        code:"BR",
        type:{
          shape:'RECTANGLE',
          cantileverConfiguration:'NONE',
        },
        measures:{
          height:8500,
          width:594,
          length:251,
          thickness:5,
          bottom_screw:35.8
        },
        name:'2W500',
        icon:'pole_section'
      },
      cat_separation:1000,
      support_offset:90,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      esc:720,
      pv:{x:0,y:3390,z:0},
      pk:0
    },
    {
      position: {x:0, y:0, z:0},
      model:{
        code:"BR",
        type:{
          shape:'RECTANGLE',
          cantileverConfiguration:'NONE',
        },
        measures:{
          height:12500,
          width:595,
          length:309,
          thickness:5,
          bottom_screw:35.8
        },
        name:'2W310',
        icon:'pole_section'
      },
      cat_separation:1000,
      support_offset:90,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      esc:720,
      pv:{x:0,y:3390,z:0},
      pk:0
    }
]

export function getDefaultsPoles(code:string):PolePropertiesParams[] {
  if(code == "BR"){
    return DefaultsBrazilianPoles;
  }else if(code == "GY"){
    return DefaultsGermanPoles;
  }else{
    return DefaultsPoles;
  }
}

export const DefaultsPoles: PolePropertiesParams[] = [
  ...DefaultsGermanPoles,
  ...DefaultsBrazilianPoles
]
