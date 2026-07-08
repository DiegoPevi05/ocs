export const OptionsCantileverGermanData:{ id:number, model:ModelInterface }[] = [
  {
    id:1,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"TDP<2.2",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_1',
    },
  },
  {
    id:2,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"TDP<2.2",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_1',
    },
  },
  {
    id:3,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"SBA",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_4',
    },
  },
  {
    id:4,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"SBA",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_4',
    },
  },
  {
    id:5,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"TDP>2.2",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_3',
    },
  },
  {
    id:6,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"TDP>2.2",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_3',
    },
  },
  {
    id:7,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"CAI",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_2',
    },
  },
  {
    id:8,
    model:{
      code:"GY",
      name:"German",
      type:{
        configuration:"CAI",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_2',
    },
  },

]



export const OptionsCantileverBrazilianData:{ id:number, model:ModelInterface }[] = [
  /*{
    id:1,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"TDP<2.2",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_1',
    },
  },
  {
    id:2,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"TDP<2.2",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_1',
    },
  },*/
  {
    id:3,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"SBA",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_4',
    },
  },
  {
    id:4,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"SBA",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_4',
    },
  },
  {
    id:5,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"TDP>2.2",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_3',
    },
  },
  {
    id:6,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"TDP>2.2",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_3',
    },
  },
  {
    id:7,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"CAI",
        contactWireConfiguration:'SINGLE',
      },
      icon:'cantilever_gy_type_2',
    },
  },
  {
    id:8,
    model:{
      code:"BR",
      name:"Brazilian",
      type:{
        configuration:"CAI",
        contactWireConfiguration:'DOUBLE',
      },
      icon:'cantilever_gy_type_2',
    },
  },
]

export const OptionsCantileverData:{ id:number, model:ModelInterface }[] = [
  ...OptionsCantileverGermanData,
  ...OptionsCantileverBrazilianData
];

export function getCantileversOptions(code:string):{ id:number, model:ModelInterface }[] {
  if(code == "BR"){
    return OptionsCantileverBrazilianData;
  }else if(code == "GY"){
    return OptionsCantileverGermanData;
  }else{
    return OptionsCantileverBrazilianData;
  }
}

export const DefaultsGermanCantilevers:Partial<CantileverParams>[] = [
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"TDP<2.2",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_1',
      },
      pole_height:8500,
      esc:720,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z: 0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2102-2",
          designation:"Hook end fitting 26/26.9",
          weight:1,
          operating_load:6,
          failing_operating_load:18,
          a:73,
          d:28.5,
          L:118
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"TDP<2.2",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_1',
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2102-2",
          designation:"Hook end fitting 26/26.9",
          weight:1,
          operating_load:6,
          failing_operating_load:18,
          a:73,
          d:28.5,
          L:118
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"SBA",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_4'
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55,
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:100,
        eye_clamp_distance:200,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2005-0",
          designation:"Swivel clip holder 42/42.4-16R",
          weight:0.36,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:45,
          A:61,
          B:90,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"SBA",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_4'
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:100,
        eye_clamp_distance:200,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2005-0",
          designation:"Swivel clip holder 42/42.4-16R",
          weight:0.36,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:45,
          A:61,
          B:90,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"TDP>2.2",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_3',
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:4,
        eye_clamp_distance:200,
        drop_bracket_distance:500,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:191,
          x1:60,
          x2:40,
          double_wire_separation_x:0,
          double_wire_separation_z:0,
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:1000,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          tube_length:40,//mm
          eye_tube_length:70,//mm
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"TDP>2.2",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_3',
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:4,
        eye_clamp_distance:200,
        drop_bracket_distance:500,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:191,
          x1:60,
          x2:40,
          double_wire_separation_x:40,
          double_wire_separation_z:90,
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:1000,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.75,
          B:16.25,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"CAI",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_2',
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:-4,
        eye_clamp_distance:450,
        drop_bracket_distance:150,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:191,
          x1:60,
          x2:40,
          double_wire_separation_x:0,
          double_wire_separation_z:0,
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:4,
        length:1000,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.75,
          B:16.25,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:10
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"GY",
        name:"German",
        type:{
          configuration:"CAI",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_2',
      },
      esc:720,
      pole_height:8500,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: 150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:60.3,
            h:121,
            x:55
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:-4,
        eye_clamp_distance:450,
        drop_bracket_distance:150,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:191,
          x1:60,
          x2:40,
          double_wire_separation_x:40,
          double_wire_separation_z:90,
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:42.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:70//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:110
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:4,
        length:1000,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.75,
          B:16.25,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:100,
          B:94,
          C:0
        }
      }
    }
  },
]

export const DefaultsBrazilianCantilevers:Partial<CantileverParams>[] = [
  /*{
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"TDP<2.2",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_1',
      },
      poleModel:{
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
      esc:720,
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z: 0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2102-2",
          designation:"Hook end fitting 26/26.9",
          weight:1,
          operating_load:6,
          failing_operating_load:18,
          a:73,
          d:28.5,
          L:118
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:94,
          B:8,
          C:7.59
        }
      }
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"TDP<2.2",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_1',
      },
      esc:720,
      poleModel:{
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
      contact_wire_height: 4600,
      bottom_fixed_height:4500,
      fixing_distance:1440,
      system_height: 1600,
      zig_zag: -150,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      pv: { x:2150, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 250,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:81,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:356,
          tube_length:89
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:25
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:73,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-4,
        length:0,
        end_distance:40,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2175-0A",
          designation:"Steel tube 26.9x3.6 (3/4“)",
          weight:2.07,
          max_delivery_length:7,
          d:26.9,
          s:3.6
        },
        eye_clamp:null,
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2102-2",
          designation:"Hook end fitting 26/26.9",
          weight:1,
          operating_load:6,
          failing_operating_load:18,
          a:73,
          d:28.5,
          L:118
        },
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:94,
          B:8,
          C:7.59
        }
      }
    }
  },
  */
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"SBA",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_4'
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:200,
      contact_wire_height: 5500,
      bottom_fixed_height:5440,
      fixing_distance:1440,
      system_height: 1200,
      zig_zag: -400,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:0,
      curve_radius_direction:'inside',
      pv: { x:3190, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:60.3,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-6,
        length:0,
        end_distance:200,
        eye_clamp_distance:203,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:26.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:72,//mm
          d:70//mm
        },
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
        swivel_clip:null,
        eye_clamp_contact_wire:{
          id:1,
          order_id:"8WL3508-5",
          designation:"Clamp holder for contact wire",
          weight:0.76,
          operating_load:3.5,
          failing_operating_load:10.5,
          double_separation:1,
          A:51,
          B:84,
          C:35
        },
      },
      reinforcement:null
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"SBA",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_4'
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:200,
      contact_wire_height: 5500,
      bottom_fixed_height:5440,
      fixing_distance:1440,
      system_height: 1200,
      zig_zag: -400,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:0,
      curve_radius_direction:'inside',
      pv: { x:3190, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:55,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:55//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:null,
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2175-4B",
          designation:"Steel tube 60.3x4.0(2“)",
          weight:5.5,
          max_delivery_length:7,
          d:70,
          s:4
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:56,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:75,
          d:62,
          L:122
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-6,
        length:0,
        end_distance:200,
        eye_clamp_distance:203,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        tube:{
          id:1,
          order_id:"8WL2175-2B",
          designation:"Steel tube 42.4x4.0 (1 1/4“)",
          weight:3.79,
          max_delivery_length:7,
          d:26.4,
          s:4
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:72,//mm
          d:70//mm
        },
        hook_end_clamp:null,
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
        swivel_clip:null,
        eye_clamp_contact_wire:{
          id:1,
          order_id:"8WL3508-5",
          designation:"Clamp holder for contact wire",
          weight:0.76,
          operating_load:3.5,
          failing_operating_load:10.5,
          double_separation:1,
          A:51,
          B:84,
          C:35
        },
      },
      reinforcement:null
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"TDP>2.2",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_3',
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:0,
      contact_wire_height: 5500,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      system_height: 1400,
      zig_zag: -250,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      curve_radius_direction:'inside',
      pv: { x:3390, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:55,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:2,
        eye_clamp_distance:200,
        drop_bracket_distance:911,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:163,
          x1:38,
          x2:0,
          double_wire_separation_x:0,
          double_wire_separation_z:0,
        },
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:72,//mm
          d:72//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2170-0",
          designation:"Aluminium tube 70x 6.0",
          weight:3.26,
          max_delivery_length:8,
          d:70,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:70,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:72,
          d:62,
          L:125
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-7.59,
        length:1050,
        end_distance:0,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2161-0",
          designation:"Aluminium tube 26x3.5",
          weight:0.67,
          max_delivery_length:8,
          d:26,
          s:3.5
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.4,
          B:16.72,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:94,
          B:8,
          C:7.59
        },
        eye_clamp_contact_wire:null
      },
      reinforcement:null
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"TDP>2.2",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_3',
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:0,
      contact_wire_height: 5500,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      system_height: 1400,
      zig_zag: -250,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      curve_radius_direction:'inside',
      pv: { x:3390, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:55,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:2,
        eye_clamp_distance:200,
        drop_bracket_distance:911,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:163,
          x1:38,
          x2:0,
          double_wire_separation_x:40,
          double_wire_separation_z:90,
        },
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:72,//mm
          d:72//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2170-0",
          designation:"Aluminium tube 70x 6.0",
          weight:3.26,
          max_delivery_length:8,
          d:70,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:70,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:72,
          d:62,
          L:125
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:-7.59,
        length:1050,
        end_distance:0,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2161-0",
          designation:"Aluminium tube 26x3.5",
          weight:0.67,
          max_delivery_length:8,
          d:26,
          s:3.5
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.4,
          B:16.72,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:94,
          B:8,
          C:7.59
        },
        eye_clamp_contact_wire:null
      },
      reinforcement:null
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"CAI",
          contactWireConfiguration:"SINGLE"
        },
        icon:'cantilever_gy_type_2',
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:0,
      contact_wire_height: 5500,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      system_height: 1400,
      zig_zag: 250,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      curve_radius_direction:'inside',
      pv: { x:3390, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:55,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:-2,
        eye_clamp_distance:600,
        drop_bracket_distance:200,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:163,
          x1:38,
          x2:0,
          double_wire_separation_x:0,
          double_wire_separation_z:0,
        },
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:42.4,//mm
          d:72//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2170-0",
          designation:"Aluminium tube 70x 6.0",
          weight:3.26,
          max_delivery_length:8,
          d:70,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:70,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:72,
          d:62,
          L:125
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:7.59,
        length:1050,
        end_distance:0,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2161-0",
          designation:"Aluminium tube 26x3.5",
          weight:0.67,
          max_delivery_length:8,
          d:26,
          s:3.5
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.75,
          B:16.25,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:94,
          B:8,
          C:7.59
        },
        eye_clamp_contact_wire:null
      },
      reinforcement:null
    }
  },
  {
    params: {
      model:{
        code:"BR",
        name:"Brazilian",
        type:{
          configuration:"CAI",
          contactWireConfiguration:"DOUBLE"
        },
        icon:'cantilever_gy_type_2',
      },
      esc:720,
      poleModel:{
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
      contact_wire_vertical_offset:0,
      contact_wire_height: 5500,
      bottom_fixed_height:5340,
      fixing_distance:1440,
      system_height: 1400,
      zig_zag: 250,
      track: {
        gauge: 1600,
        sleepers: {
          width: 2848,
          height:164 
        },
        skate: {
          ht: 168,
          w: 17,
          hw: 71,
          bw: 153
        }
      },
      pantograph:{
        length:980,
        gauge:150
      },
      support_offset:0,
      u:100,
      curve_radius_direction:'inside',
      pv: { x:3390, y:0,z:0 },
      stay_tube:{
        alpha:4,
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:55,
          eye_length:365,
          tube_length:65
        },
        mw_support:{
          wireSupport:{
            id:1,
            order_id:"8WL2031-4B",
            designation:"Catenary wire support clamp 55-60.3/12",
            weight:2.66,
            operating_load:12,
            failing_operating_load:36,
            d:55,
            A:58,
            B:128,
            C:69,
            D:38
          },
          end_distance:200,
          eye_clamp_distance: 200,
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:84,//mm
          d:60.3//mm
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        }
      },
      register_arm:{
        alpha:-2,
        eye_clamp_distance:600,
        drop_bracket_distance:200,
        stainless_steel_wire_rope:{
          id:1,
          order_id:"8WL7093-2",
          designation:"Wire rope 6",
          weight:0.138,
          min_breaking_force:18.80,
          d:6
        },
        drop_bracket:{
          id:1,
          order_id:"8WL2723-0",
          designation:"Drop bracket 33.7-42.4",
          weight:2.16,
          operating_load:4.3, //Kilo Newtons
          failing_operating_load:12.9,//Kilo Newtons
          d:42.4,//mm
          h:163,
          x1:38,
          x2:0,
          double_wire_separation_x:40,
          double_wire_separation_z:90,
        },
        tube:{
          id:1,
          order_id:"8WL2167-0",
          designation:"Aluminium tube 55x6.0",
          weight:2.5,
          max_delivery_length:8,
          d:55,
          s:6
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2113-5",
          designation:"Eye clamp 32/33.7 to 42/42.4",
          weight:0.85,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:72,//mm
          d:72//mm
        },
        hook_end_fitting:{
          id:1,
          order_id:"8WL2104-5",
          designation:"Hook end fitting 42/42.4",
          weight:1.06,
          operating_load:6,
          failing_operating_load:18,
          a:65,
          d:45,
          L:132
        },
      },
      bracket_tube:{
        tube:{
          id:1,
          order_id:"8WL2170-0",
          designation:"Aluminium tube 70x 6.0",
          weight:3.26,
          max_delivery_length:8,
          d:70,
          s:6
        },
        isolator:{
          id:1,
          order_id:"8WL3088-2C",
          designation:"Composite insulator tongue 21/tube 60.3",
          weight:2.1,
          operating_load:190,
          d:70,
          eye_length:371,
          tube_length:65
        },
        swivel_bracket:{
          id:1,
          order_id:"8WL2125-5",
          designation:"Cantilever swivel bracket",
          weight:0.56,
          operating_load_f1:21.7,
          failing_operating_load_f1:65,
          operating_load_f2:10,
          failing_operating_load_f2:30,
          x_pin:61
        },
        swivel_clevis:{
          id:1,
          order_id:"8WL2126-2",
          designation:"Swivel with clevis 21",
          weight:0.56,
          operating_load:26.7,
          failing_operating_load:80,
          pin_eye:42
        },
        clevis_end_fitting:{
          id:1,
          order_id:"8WL6221-7",
          designation:"Clevis end fitting 60.3",
          weight:1.71,
          operating_load:7.5,
          failing_operating_load:22.5,
          hook_x_distance:62,
          a:72,
          d:62,
          L:125
        },
        eye_clamp:{
          id:1,
          order_id:"8WL2114-7",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:5, //Kilo Newtons
          failing_operating_load:15,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
        },
      },
      steady_arm:{
        alpha:7.59,
        length:1050,
        end_distance:0,
        eye_clamp_distance:null,
        stainless_steel_wire_rope:null,
        tube:{
          id:1,
          order_id:"8WL2161-0",
          designation:"Aluminium tube 26x3.5",
          weight:0.67,
          max_delivery_length:8,
          d:26,
          s:3.5
        },
        eye_clamp:null,
        hook_end_clamp:{
          id:1,
          order_id:"8WL2101-0",
          designation:"Hook end clamp 26",
          weight:0.54,
          operating_load: 6, //Kilo Newtons
          failing_operating_load:18,//Kilo Newtons
          X:5,
          Y:7.5,
          H:70,
          A:13.75,
          B:16.25,
          d:26//mm
        },
        hook_end_fitting:null,
        swivel_clip:{
          id:1,
          order_id:"8WL2004-0",
          designation:"Swivel clip holder 26/26.9-100-R",
          weight:0.4,
          operating_load:2.5,
          failing_operating_load:7.5,
          width:60,
          A:93.74,
          B:8,
          C:7.59
        },
        eye_clamp_contact_wire:null
      },
      reinforcement:null
    }
  },
]

export const DefaultsCantilevers: Partial<CantileverParams>[] = [
  ...DefaultsGermanCantilevers,
  ...DefaultsBrazilianCantilevers
];

export function getDefaultsCantilevers(code:string):Partial<CantileverParams>[] {
  if(code == "BR"){
    return DefaultsBrazilianCantilevers;
  }else if(code == "GY"){
    return DefaultsGermanCantilevers;
  }else{
    return DefaultsCantilevers;
  }
}

export const DefaultsBrazilianCantileverAditionals:Partial<CantileverBrazilianParams>[] = [
  {
    reinforcement:{
      tube:{
        id:1,
        order_id:"8WL2167-0",
        designation:"Aluminium tube 55x6.0",
        weight:2.5,
        max_delivery_length:8,
        d:55,
        s:6
      },
      upper_distance_offset:150,
      upper_eye_clamp:{
          id:1,
          order_id:"8WL2115-4",
          designation:"Eye clamp 60.3",
          weight:1.10,
          operating_load:7, //Kilo Newtons
          failing_operating_load:21,//Kilo Newtons
          h:79,//mm
          d:60.3//mm
      },
      upper_hook_end_fitting:{
        id:1,
        order_id:"8WL2104-5",
        designation:"Hook end fitting 42/42.4",
        weight:1.06,
        operating_load:6,
        failing_operating_load:18,
        a:65,
        d:45,
        L:132
      },
      bottom_distance_offset:150,
      bottom_eye_clamp:{
        id:1,
        order_id:"8WL2113-5",
        designation:"Eye clamp 32/33.7 to 42/42.4",
        weight:0.85,
        operating_load:5, //Kilo Newtons
        failing_operating_load:15,//Kilo Newtons
        h:79,//mm
        d:72//mm
      },
      bottom_hook_end_fitting:{
        id:1,
        order_id:"8WL2104-5",
        designation:"Hook end fitting 42/42.4",
        weight:1.06,
        operating_load:6,
        failing_operating_load:18,
        a:65,
        d:45,
        L:132
      },
    }
  }
]

