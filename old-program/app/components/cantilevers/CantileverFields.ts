export const sections: { 
  name:string;
  section: string; 
  defaultOpen: boolean, 
  subSection: {
    name:string | null;
    title?:string;
    fields: {
      key:string;
      classNameContainer?: string;
      classNameLabel?: string;
      classNameInput?: string;
      handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      size?: 'sm' | 'default' | 'lg'; // Custom `size` prop that applies consistently across variants
      header?: string;
      units?: string;
      placeholder:string;
      value:string;
      help?:{
        header: string;
        description: string;
        ref:string;
        image: string;
      };
      elementId?:string;
      inputType?:'text'|'selector';
      options?:{value:string, label:string }[];
    }[] 
  }[] 
}[] = [ 
  {
    name:"main_params",
    section:"cantilever.fields.params.main_params.name",
    defaultOpen:true,
    subSection:[
      {
        name:null,
        fields:[
            {
              key:"system_height",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.system_height", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.system_height",
              value:"params.system_height",
              help:{
                header:"cantilever.fields.params.main_params.system_height",
                description:"cantilever.fields.params.main_params.system_height_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"system_height"
          },
          {
              key:"contact_wire_height",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.contact_wire_height", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.contact_wire_height",
              value:"params.contact_wire_height",
              help:{
                header:"cantilever.fields.params.main_params.contact_wire_height",
                description:"cantilever.fields.params.main_params.contact_wire_height_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png"  : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"contact_wire_height"
          },
          {
              key:"contact_wire_vertical_offset",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.contact_wire_vertical_offset", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.contact_wire_vertical_offset",
              value:"params.contact_wire_vertical_offset",
              help:{
                header:"cantilever.fields.params.main_params.contact_wire_vertical_offset",
                description:"cantilever.fields.params.main_params.contact_wire_vertical_offset_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png"  : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"contact_wire_vertical_offset"
          },
          {
              key:"zig_zag",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.zig_zag", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.zig_zag",
              value:"params.zig_zag",
              help:{
                header:"cantilever.fields.params.main_params.zig_zag",
                description:"cantilever.fields.params.main_params.zig_zag_description",
                ref:"C",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"zig_zag"
          },
          {
              key:"params.pv",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.pv", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.pv",
              value:"params.pv",
              help:{
                header:"cantilever.fields.params.main_params.pv",
                description:"cantilever.fields.params.main_params.pv_description",
                ref:"D",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"pv"
          },
          {
              key:"esc",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.esc", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.esc",
              value:"params.esc",
              help:{
                header:"cantilever.fields.params.main_params.esc",
                description:"cantilever.fields.params.main_params.esc_description",
                ref:"H",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png"  : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"esc"
          },
          {
              key:"params.bottom_fixed_height",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.bottom_fixed_height", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.bottom_fixed_height",
              value:"params.bottom_fixed_height",
              help:{
                header:"cantilever.fields.params.main_params.bottom_fixed_height",
                description:"cantilever.fields.params.main_params.bottom_fixed_height_description",
                ref:"O",
                image: process.env.NODE_ENV === "production" ? "/public/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"contact_wire_gap"

          },
          {
              key:"params.fixing_distance",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.fixing_distance", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.fixing_distance",
              value:"params.fixing_distance",
              help:{
                header:"cantilever.fields.params.main_params.fixing_distance",
                description:"cantilever.fields.params.main_params.fixing_distance_description",
                ref:"F",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"fixing_distance"
          },
          {
              key:"params.u",
              classNameContainer:"col-span-1 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.u", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.u",
              value:"params.u",
              help:{
                header:"cantilever.fields.params.main_params.u",
                description:"cantilever.fields.params.main_params.u_description",
                ref:"G",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"track_elevation"
          },
          {
              key:"params.curve_radius_direction",
              classNameContainer:"col-span-1 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.curve_radius_direction", 
              units: "",
              placeholder: "cantilever.fields.params.main_params.curve_radius_direction",
              value:"params.curve_radius_direction",
              help:{
                header:"cantilever.fields.params.main_params.curve_radius_direction",
                description:"cantilever.fields.params.main_params.curve_radius_direction_description",
                ref:"G",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"track_elevation",
              inputType:'selector',
              options:[
                { value:'inside', label:'cantilever.fields.params.main_params.curve_radius_direction_inside' },
                { value:'outside', label:'cantilever.fields.params.main_params.curve_radius_direction_outside' }
              ]
          },
          {
              key:"params.stay_tube.alpha",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"pointer-events-none",
              header: "cantilever.fields.params.main_params.stay_tube_inclination", 
              units: "cantilever.fields.params.main_params.degrees",
              placeholder: "cantilever.fields.params.main_params.stay_tube_inclination",
              value:"params.stay_tube.alpha",
              help:{
                header:"cantilever.fields.params.main_params.stay_tube_inclination",
                description:"cantilever.fields.params.main_params.stay_tube_inclination_description",
                ref:"L",
                image:process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png"  : "/public/images/helpers/cantilevers/main_params.png",
              }
          },
          {
              key:"params.steady_arm.alpha",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.stay_arm_angle", 
              units: "cantilever.fields.params.main_params.degrees",
              placeholder: "cantilever.fields.params.main_params.stay_arm_angle",
              value:"params.steady_arm.alpha",
              help:{
                header:"cantilever.fields.params.main_params.stay_arm_angle",
                description:"cantilever.fields.params.main_params.stay_arm_angle_description",
                ref:"I",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              }
          },
          {
              key:"params.register_arm.alpha",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.register_arm_angle", 
              units: "cantilever.fields.params.main_params.degrees",
              placeholder: "cantilever.fields.params.main_params.register_arm_angle",
              value:"params.register_arm.alpha",
              help:{
                header:"cantilever.fields.params.main_params.register_arm_angle",
                description:"cantilever.fields.params.main_params.register_arm_angle_description",
                ref:"J",
                image:process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              }
          },
          {
              key:"params.steady_arm.length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.main_params.steady_arm_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.main_params.steady_arm_length",
              value:"params.steady_arm.length",
              help:{
                header:"cantilever.fields.params.main_params.steady_arm_length",
                description:"cantilever.fields.params.main_params.steady_arm_length_description",
                ref:"K",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/main_params.png" : "/public/images/helpers/cantilevers/main_params.png",
              },
              elementId:"steady_arm"
          }
        ]
      },
    ],
  },
  {
    name:"stay_tube",
    section:"cantilever.fields.params.stay_tube.name",
    defaultOpen:false,
    subSection:[
      {
        name:"tube",
        title:"cantilever.fields.params.stay_tube.tube",
        fields:[
          {
              key:"params.stay_tube.tube.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.tube_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.tube_diameter",
              value:"params.stay_tube.tube.d",
              help:{
                header:"cantilever.fields.params.stay_tube.tube_diameter",
                description:"cantilever.fields.params.stay_tube.tube_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/tube.png": "/public/images/helpers/cantilevers/tube.png",
              },
              elementId:'link_102'
          },
        ]
      },
      {
        name:"isolator",
        title:"cantilever.fields.params.stay_tube.isolator",
        fields:[
          {
              key:"params.stay_tube.isolator.eye_length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.full_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.full_length",
              value:"params.stay_tube.isolator.eye_length",
              help:{
                header:"cantilever.fields.params.stay_tube.full_length",
                description:"cantilever.fields.params.stay_tube.full_length_description",
                ref:"L",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/insulator.png" : "/public/images/helpers/cantilevers/insulator.png",
              },
              elementId:"link_101"
          },
          {
              key:"params.stay_tube.isolator.tube_length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.tube_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.tube_length",
              value:"params.stay_tube.isolator.tube_length",
              help:{
                header:"cantilever.fields.params.stay_tube.tube_length",
                description:"cantilever.fields.params.stay_tube.tube_length_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/insulator.png" : "/public/images/helpers/cantilevers/insulator.png",
              },
              elementId:"link_101"
          },
        ]
      },
      {
        name:"eye_clamp",
        title:"cantilever.fields.params.stay_tube.eye_clamp",
        fields:[
          {
              key:"params.stay_tube.mw_support.eye_clamp_distance",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.distance_eye_clamp", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.distance_eye_clamp",
              value:"params.stay_tube.mw_support.eye_clamp_distance",
              help:{
                header:"cantilever.fields.params.stay_tube.distance_eye_clamp",
                description:"cantilever.fields.params.stay_tube.distance_eye_clamp_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/stay_tube.png" : "/public/images/helpers/cantilevers/stay_tube.png",
              },
              elementId:'link_104'
          },
          {
              key:"params.stay_tube.eye_clamp.h",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.eye_clamp_tube_to_pin_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.eye_clamp_tube_to_pin_length",
              value:"params.stay_tube.eye_clamp.h",
              help:{
                header:"cantilever.fields.params.stay_tube.eye_clamp_tube_to_pin_length",
                description:"cantilever.fields.params.stay_tube.eye_clamp_tube_to_pin_length_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/eye_clamp_55.png" : "/public/images/helpers/cantilevers/eye_clamp_55.png",
              },
              elementId:'link_104'
          }
        ]
      },
      {
        name:"wire_support",
        title:"cantilever.fields.params.stay_tube.wire_support",
        fields:[
          {
              key:"params.stay_tube.mw_support.end_distance",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.end_distance", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.end_distance",
              value:"params.stay_tube.mw_support.end_distance",
              help:{
                header:"cantilever.fields.params.stay_tube.end_distance",
                description:"cantilever.fields.params.stay_tube.end_distance_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/stay_tube.png" : "/public/images/helpers/cantilevers/stay_tube.png",
              },
              elementId:'link_106'
          },
          {
              key:"params.stay_tube.mw_support.wireSupport.B",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.vertical_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.vertical_length",
              value:"params.stay_tube.mw_support.wireSupport.B",
              help:{
                header:"cantilever.fields.params.stay_tube.vertical_length",
                description:"cantilever.fields.params.stay_tube.vertical_length_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/wire_support.png" : "/public/images/helpers/cantilevers/wire_support.png",
              },
              elementId:'link_106'
          },
        ]
      },
      {
        name:"fixed_point",
        title:"cantilever.fields.params.stay_tube.fixed_point",
        fields:[
          {
              key:"params.stay_tube.swivel_bracket.x_pin",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.pole_swivel_pin", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.pole_swivel_pin",
              value:"params.stay_tube.swivel_bracket.x_pin",
              help:{
                header:"cantilever.fields.params.stay_tube.pole_swivel_pin",
                description:"cantilever.fields.params.stay_tube.pole_swivel_pin_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_bracket_clevis.png" : "/public/images/helpers/cantilevers/swivel_bracket_clevis.png",
              },
              elementId:'link_100'
          },
          {
              key:"params.stay_tube.swivel_clevis.pin_eye",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.stay_tube.pin_to_pin", 
              units: "mm",
              placeholder: "cantilever.fields.params.stay_tube.pin_to_pin",
              value:"params.stay_tube.swivel_clevis.pin_eye",
              help:{
                header:"cantilever.fields.params.stay_tube.pin_to_pin",
                description:"cantilever.fields.params.stay_tube.pin_to_pin_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_bracket_clevis.png" : "/public/images/helpers/cantilevers/swivel_bracket_clevis.png",
              },
              elementId:'link_100'
          }
        ]
      }
    ]  
  },
  {
    name:"bracket_tube",
    section:"cantilever.fields.params.bracket_tube.name",
    defaultOpen:false,
    subSection:[
      {
        name:"tube",
        title:"cantilever.fields.params.bracket_tube.tube",
        fields:[
          {
              key:"params.bracket_tube.tube.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.tube_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.tube_diameter",
              value:"params.bracket_tube.tube.d",
              help:{
                header:"cantilever.fields.params.bracket_tube.tube_diameter",
                description:"cantilever.fields.params.bracket_tube.tube_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/tube.png" : "/public/images/helpers/cantilevers/tube.png",
              },
              elementId:'link_99'
          },
        ]
      },
      {
        name:"isolator",
        title:"cantilever.fields.params.bracket_tube.isolator",
        fields:[
          {
              key:"params.stay_tube.isolator.eye_length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.full_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.full_length",
              value:"params.stay_tube.isolator.eye_length",
              help:{
                header:"cantilever.fields.params.bracket_tube.full_length",
                description:"cantilever.fields.params.bracket_tube.full_length_description",
                ref:"L",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/insulator.png" : "/public/images/helpers/cantilevers/insulator.png",
              },
              elementId:'link_98'
          },
          {
              key:"params.stay_tube.isolator.tube_length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.tube_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.tube_length",
              value:"params.stay_tube.isolator.tube_length",
              help:{
                header:"cantilever.fields.params.bracket_tube.tube_length",
                description:"cantilever.fields.params.bracket_tube.tube_length_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/insulator.png" : "/public/images/helpers/cantilevers/insulator.png",
              },
              elementId: 'link_98'
          }
        ]
      },
      {
        name:"fixed_point",
        title:"cantilever.fields.params.bracket_tube.fixed_point",
        fields:[
          {
              key:"params.bracket_tube.swivel_bracket.x_pin",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.pole_swivel_pin", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.pole_swivel_pin",
              value:"params.bracket_tube.swivel_bracket.x_pin",
              help:{
                header:"cantilever.fields.params.bracket_tube.pole_swivel_pin",
                description:"cantilever.fields.params.bracket_tube.pole_swivel_pin_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_bracket_clevis.png" : "/public/images/helpers/cantilevers/swivel_bracket_clevis.png",
              },
              elementId:'link_96'
          },
          {
              key:"params.bracket_tube.swivel_clevis.pin_eye",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.pin_to_pin", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.pin_to_pin",
              value:"params.bracket_tube.swivel_clevis.pin_eye",
              help:{
                header:"cantilever.fields.params.bracket_tube.pin_to_pin",
                description:"cantilever.fields.params.bracket_tube.pin_to_pin_description",
                ref:"B",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_bracket_clevis.png" : "/public/images/helpers/cantilevers/swivel_bracket_clevis.png",
              },
              elementId:'link_96'
          }
        ]
      },
      {
        name:"clevis_end_fitting",
        title:"cantilever.fields.params.bracket_tube.clevis_end_fitting",
        fields:[
          {
              key:"params.bracket_tube.clevis_end_fitting.L",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.clevis_end_fitting_full_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.clevis_end_fitting_full_length",
              value:"params.bracket_tube.clevis_end_fitting.L",
              help:{
                header:"cantilever.fields.params.bracket_tube.clevis_end_fitting_full_length",
                description:"cantilever.fields.params.bracket_tube.clevis_end_fitting_full_length_description",
                ref:"L",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_fitting_2.png" : "/public/images/helpers/cantilevers/hook_end_fitting_2.png",
              },
              elementId:"link_97"
          },
          {
              key:"params.bracket_tube.clevis_end_fitting.a",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.clevis_end_fitting_tube_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.clevis_end_fitting_tube_length",
              value:"params.bracket_tube.clevis_end_fitting.a",
              help:{
                header:"cantilever.fields.params.bracket_tube.clevis_end_fitting_tube_length",
                description:"cantilever.fields.params.bracket_tube.clevis_end_fitting_tube_length_description",
                ref:"A",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_fitting_2.png" : "/public/images/helpers/cantilevers/hook_end_fitting_2.png",
              },
              elementId:"link_97"
          },
        ]
      },
      {
        name:"eye_clamp",
        title:"cantilever.fields.params.bracket_tube.eye_clamp",
        fields:[
          {
              key:"params.stay_tube.eye_clamp.h",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.bracket_tube.tube_to_pin_length", 
              units: "mm",
              placeholder: "cantilever.fields.params.bracket_tube.tube_to_pin_length",
              value:"params.stay_tube.eye_clamp.h",
              help:{
                header:"cantilever.fields.params.bracket_tube.tube_to_pin_length",
                description:"cantilever.fields.params.bracket_tube.tube_to_pin_length_description",
                ref:"H",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/eye_clamp_70.png" : "/public/images/helpers/cantilevers/eye_clamp_70.png",
              },
              elementId:'link_77'
          }
        ]
      }
    ]
  },
  {
    name: "register_arm",
    section: "cantilever.fields.params.register_arm.name",
    defaultOpen: false,
    subSection: [
      {
        name:"tube",
        title:"cantilever.fields.params.register_arm.tube",
        fields:[
          {
              key:"params.register_arm.tube.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.register_arm.tube_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.register_arm.tube_diameter",
              value:"params.register_arm.tube.d",
              help:{
                header:"cantilever.fields.params.register_arm.tube_diameter",
                description:"cantilever.fields.params.register_arm.tube_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/tube.png" : "/public/images/helpers/cantilevers/tube.png",
              },
              elementId:'link_75'
          },
        ]
      },
      {
        name:"stainless_steel",
        title:"cantilever.fields.params.register_arm.stainless_steel_wire_rope_diameter",
        fields:[
          {
              key:"params.register_arm.stainless_steel_wire_rope.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.register_arm.stainless_steel_wire_rope_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.register_arm.stainless_steel_wire_rope_diameter",
              value:"params.register_arm.stainless_steel_wire_rope.d",
              help:{
                header:"cantilever.fields.params.register_arm.stainless_steel_wire_rope_diameter",
                description:"cantilever.fields.params.register_arm.stainless_steel_wire_rope_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/stainless_steel_wire_rope.png" : "/public/images/helpers/cantilevers/stainless_steel_wire_rope.png",
              },
              elementId:'link_74'
          },
        ]
      },
      {
        name:"eye_clamp",
        title: "cantilever.fields.params.register_arm.eye_clamp",
        fields: [
          {
            key: "params.register_arm.eye_clamp_distance",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.eye_clamp_distance",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.eye_clamp_distance",
            value: "params.register_arm.eye_clamp_distance",
            help: {
              header: "cantilever.fields.params.register_arm.eye_clamp_distance",
              description: "cantilever.fields.params.register_arm.eye_clamp_distance_description",
              ref: "C",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/register_arm.png" : "/public/images/helpers/cantilevers/register_arm.png"
            },
            elementId:'link_73'
          },
          {
            key: "params.register_arm.eye_clamp.h",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.eye_clamp_tube_to_pin_length",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.eye_clamp_tube_to_pin_length",
            value: "params.register_arm.eye_clamp.h",
            help: {
              header: "cantilever.fields.params.register_arm.eye_clamp_tube_to_pin_length",
              description: "cantilever.fields.params.register_arm.eye_clamp_tube_to_pin_length_description",
              ref: "H",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/eye_clamp_70.png" : "/public/images/helpers/cantilevers/eye_clamp_70.png"
            },
            elementId:'link_73'
          }
        ]
      },
      {
        name:"hook_end_fitting",
        title: "cantilever.fields.params.register_arm.hook_end_fitting",
        fields: [
          {
            key: "params.register_arm.hook_end_fitting.L",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.full_length",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.full_length",
            value: "params.register_arm.hook_end_fitting.L",
            help: {
              header: "cantilever.fields.params.register_arm.full_length",
              description: "cantilever.fields.params.register_arm.full_length_description",
              ref: "L",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_fitting_2.png" : "/public/images/helpers/cantilevers/hook_end_fitting_2.png"
            },
            elementId:'link_76'
          },
          {
            key: "params.register_arm.hook_end_fitting.a",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.tube_length",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.tube_length",
            value: "params.register_arm.hook_end_fitting.a",
            help: {
              header: "cantilever.fields.params.register_arm.tube_length",
              description: "cantilever.fields.params.register_arm.tube_length_description",
              ref: "L",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_fitting_2.png" : "/public/images/helpers/cantilevers/hook_end_fitting_2.png"
            },
            elementId:'link_76'
          },
        ]
      },
      {
        name:"drop_bracket",
        title: "cantilever.fields.params.register_arm.drop_bracket",
        fields: [
          {
            key: "params.register_arm.drop_bracket_distance",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.drop_bracket_distance",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.drop_bracket_distance",
            value: "params.register_arm.drop_bracket_distance",
            help: {
              header: "cantilever.fields.params.register_arm.drop_bracket_distance",
              description: "cantilever.fields.params.register_arm.drop_bracket_distance_description",
              ref: "D",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/register_arm.png" : "/public/images/helpers/cantilevers/register_arm.png"
            },
            elementId:'link_70'
          },
          {
            key: "params.register_arm.drop_bracket.x1",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.drop_bracket_x1",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.drop_bracket_x1",
            value: "params.register_arm.drop_bracket.x1",
            help: {
              header: "cantilever.fields.params.register_arm.drop_bracket_x1",
              description: "cantilever.fields.params.register_arm.drop_bracket_x1_description",
              ref: "B",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/dropper_bracket.png" : "/public/images/helpers/cantilevers/dropper_bracket.png"
            },
            elementId:'link_70'
          },
          {
            key: "params.register_arm.drop_bracket.x2",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.drop_bracket_x2",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.drop_bracket_x2",
            value: "params.register_arm.drop_bracket.x2",
            help: {
              header: "cantilever.fields.params.register_arm.drop_bracket_x2",
              description: "cantilever.fields.params.register_arm.drop_bracket_x2_description",
              ref: "108",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/dropper_bracket.png" : "/public/images/helpers/cantilevers/dropper_bracket.png"
            },
            elementId:'link_70'
          },
          {
            key: "params.register_arm.drop_bracket.h",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.drop_bracket_h",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.drop_bracket_h",
            value: "params.register_arm.drop_bracket.h",
            help: {
              header: "cantilever.fields.params.register_arm.drop_bracket_h",
              description: "cantilever.fields.params.register_arm.drop_bracket_h_description",
              ref: "A",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/dropper_bracket.png" : "/public/images/helpers/cantilevers/dropper_bracket.png"
            },
            elementId:'link_69'
          }
        ]
      },
      {
        name: "double_wire_configuration",
        title: "cantilever.fields.params.register_arm.double_wire_configuration",
        fields: [
          {
            key: "params.register_arm.drop_bracket.double_wire_separation_x",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.double_wire_separation_x",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.double_wire_separation_x",
            value: "params.register_arm.drop_bracket.double_wire_separation_x",
            help: {
              header: "cantilever.fields.params.register_arm.double_wire_separation_x",
              description: "cantilever.fields.params.register_arm.double_wire_separation_x_description",
              ref: "C",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/dropper_bracket.png" : "/public/images/helpers/cantilevers/dropper_bracket.png"
            }
          },
          {
            key: "params.register_arm.drop_bracket.double_wire_separation_z",
            classNameContainer: "col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "cantilever.fields.params.register_arm.double_wire_separation_z",
            units: "mm",
            placeholder: "cantilever.fields.params.register_arm.double_wire_separation_x",
            value: "params.register_arm.drop_bracket.double_wire_separation_z",
            help: {
              header: "cantilever.fields.params.register_arm.double_wire_separation_z",
              description: "cantilever.fields.params.register_arm.double_wire_separation_z_description",
              ref: "D",
              image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/dropper_bracket.png" : "/public/images/helpers/cantilevers/dropper_bracket.png"
            }
          }
        ]
      }
    ]
  },
  {
    "name":"steady_arm",
    "section": "cantilever.fields.params.steady_arm.name",
    "defaultOpen": false,
    "subSection": [
      {
        name:"tube",
        title:"cantilever.fields.params.steady_arm.tube",
        fields:[
          {
              key:"params.steady_arm.tube.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.steady_arm.tube_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.steady_arm.tube_diameter",
              value:"params.steady_arm.tube.d",
              help:{
                header:"cantilever.fields.params.steady_arm.tube_diameter",
                description:"cantilever.fields.params.steady_arm.tube_diameter_description",
                ref:"d",
                image:process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/tube.png" : "/public/images/helpers/cantilevers/tube.png",
              }
          },
        ]
      },
      {
        name:"stainless_steel",
        title:"cantilever.fields.params.steady_arm.stainless_steel_wire_rope.diameter",
        fields:[
          {
              key:"params.steady_arm.stainless_steel_wire_rope.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.steady_arm.stainless_steel_wire_rope_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.steady_arm.stainless_steel_wire_rope_diameter",
              value:"params.steady_arm.stainless_steel_wire_rope.d",
              help:{
                header:"cantilever.fields.params.steady_arm.stainless_steel_wire_rope_diameter",
                description:"cantilever.fields.params.steady_arm.stainless_steel_wire_rope_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/stainless_steel_wire_rope.png" : "/public/images/helpers/cantilevers/stainless_steel_wire_rope.png",
              }
          },
        ]
      },
      {
        name:"eye_clamp",
        "title": "cantilever.fields.params.steady_arm.eye_clamp",
        "fields": [
          {
            "key": "params.steady_arm.eye_clamp_distance",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_distance",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_distance",
            "value": "params.steady_arm.eye_clamp_distance",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_distance",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_distance_description",
              "ref": "A",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            }
          },
          {
            "key": "params.steady_arm.eye_clamp.h",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_tube_to_pin_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_tube_to_pin_length",
            "value": "params.steady_arm.eye_clamp.h",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_tube_to_pin_length",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_tube_to_pin_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/eye_clamp_70.png" : "/public/images/helpers/cantilevers/eye_clamp_70.png"
            }
          }
        ]
      },
      {
        "name":"swivel_clip",
        "title": "cantilever.fields.params.steady_arm.swivel_clip",
        "fields": [
          {
            "key": "params.steady_arm.end_distance",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.end_distance",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.end_distance",
            "value": "params.steady_arm.end_distance",
            "help": {
              "header": "cantilever.fields.params.steady_arm.end_distance",
              "description": "cantilever.fields.params.steady_arm.end_distance_description",
              "ref": "C",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            }
          },
          {
            "key": "params.steady_arm.swivel_clip.cw_height",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.center_to_cw",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.center_to_cw",
            "value": "params.steady_arm.swivel_clip.A",
            "help": {
              "header": "cantilever.fields.params.steady_arm.center_to_cw",
              "description": "cantilever.fields.params.steady_arm.center_to_cw_description",
              "ref": "A",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_clip.png" : "/public/images/helpers/cantilevers/swivel_clip.png"
            }
          },
          {
            "key": "params.steady_arm.swivel_clip.cw_angle",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.angel_to_cw",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.angel_to_cw",
            "value": "params.steady_arm.swivel_clip.C",
            "help": {
              "header": "cantilever.fields.params.steady_arm.angel_to_cw",
              "description": "cantilever.fields.params.steady_arm.angel_to_cw_description",
              "ref": "C",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_clip.png" : "/public/images/helpers/cantilevers/swivel_clip.png"
            }
          },
          {
            "key": "params.steady_arm.swivel_clip.tube_offset",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_offset",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_offset",
            "value": "params.steady_arm.swivel_clip.B",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_offset",
              "description": "cantilever.fields.params.steady_arm.tube_offset_description",
              "ref": "B",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_clip.png" : "/public/images/helpers/cantilevers/swivel_clip.png"
            }
          }
        ]
      },
      {
        "name":"eye_clamp_contact_wire",
        "title": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire",
        "fields": [
          {
            "key": "params.steady_arm.eye_clamp_contact_wire.double_separation",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_double_separation",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_double_separation",
            "value": "params.steady_arm.eye_clamp_contact_wire.double_separation",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_double_separation",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_double_separation_description",
              "ref": "C",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            }
          },
          {
            "key": "params.steady_arm.eye_clamp_contact_wire.A",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_a",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_a",
            "value": "params.steady_arm.eye_clamp_contact_wire.A",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_a",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_a_description",
              "ref": "C",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            }
          },
          {
            "key": "params.steady_arm.eye_clamp_contact_wire.B",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_b",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_b",
            "value": "params.steady_arm.eye_clamp_contact_wire.B",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_b",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_b_description",
              "ref": "B",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_clip.png" : "/public/images/helpers/cantilevers/swivel_clip.png"
            }
          },
          {
            "key": "params.steady_arm.eye_clamp_contact_wire.C",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_c",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_c",
            "value": "params.steady_arm.eye_clamp_contact_wire.C",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_c",
              "description": "cantilever.fields.params.steady_arm.eye_clamp_contact_wire_c_description",
              "ref": "C",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/swivel_clip.png" : "/public/images/helpers/cantilevers/swivel_clip.png"
            }
          },
        ]
      },
      {
        "name":"hook_end_fitting",
        "title": "cantilever.fields.params.steady_arm.hook_end_fitting",
        "fields": [
          {
            "key": "params.steady_arm.hook_end_fitting.L",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.full_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.full_length",
            "value": "params.steady_arm.hook_end_fitting.L",
            "help": {
              "header": "cantilever.fields.params.steady_arm.full_length",
              "description": "cantilever.fields.params.steady_arm.full_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_4'
          },
          {
            "key": "params.steady_arm.hook_end_fitting.a",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_length",
            "value": "params.steady_arm.hook_end_fitting.a",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_length",
              "description": "cantilever.fields.params.steady_arm.tube_length_description",
              "ref": "W",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_4'
          }
        ]
      },
      {
        "name":"hook_end_clamp",
        "title": "cantilever.fields.params.steady_arm.hook_end_clamp",
        "fields": [
          {
            "key": "params.steady_arm.hook_end_clamp.tube_length",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_length",
            "value": "params.steady_arm.hook_end_clamp.X",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_length",
              "description": "cantilever.fields.params.steady_arm.tube_length_description",
              "ref": "X",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png": "/public/images/helpers/cantilevers/hook_end_clamp.png"
            }
          },
          {
            "key": "params.steady_arm.hook_end_clamp.eye_tube_length",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.eye_tube_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.eye_tube_length",
            "value": "params.steady_arm.hook_end_clamp.H",
            "help": {
              "header": "cantilever.fields.params.steady_arm.eye_tube_length",
              "description": "cantilever.fields.params.steady_arm.eye_tube_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            }
          },
          {
            "key": "params.steady_arm.hook_end_clamp.tube_axis_clamp",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_axis_clamp",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_axis_clamp",
            "value": "params.steady_arm.hook_end_clamp.Y",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_axis_clamp",
              "description": "cantilever.fields.params.steady_arm.tube_axis_clamp_description",
              "ref": "Y",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            }
          },
          {
            "key": "params.steady_arm.hook_end_clamp.tube_axis_intersection_center_plane",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_axis_intersection_center_plane",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_axis_intersection_center_plane",
            "value": "params.steady_arm.hook_end_clamp.A",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_axis_intersection_center_plane",
              "description": "cantilever.fields.params.steady_arm.tube_axis_intersection_center_plane_description",
              "ref": "A",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            }
          },
          {
            "key": "params.steady_arm.hook_end_clamp.tube_axis_to_center_of_clamp",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.steady_arm.tube_axis_to_center_of_clamp",
            "units": "mm",
            "placeholder": "cantilever.fields.params.steady_arm.tube_axis_to_center_of_clamp",
            "value": "params.steady_arm.hook_end_clamp.B",
            "help": {
              "header": "cantilever.fields.params.steady_arm.tube_axis_to_center_of_clamp",
              "description": "cantilever.fields.params.steady_arm.tube_axis_to_center_of_clamp_description",
              "ref": "B",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            }
          }
        ]
      }
    ]
  },
  {
    name:"reinforcement",
    section:"cantilever.fields.params.reinforcement.name",
    defaultOpen:false,
    subSection:[
      {
        name:"tube",
        title:"cantilever.fields.params.reinforcement.tube",
        fields:[
          {
              key:"params.reinforcement.tube.d",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.reinforcement.tube_diameter", 
              units: "mm",
              placeholder: "cantilever.fields.params.reinforcement.tube_diameter",
              value:"params.stay_tube.tube.d",
              help:{
                header:"cantilever.fields.params.reinforcement.tube_diameter",
                description:"cantilever.fields.params.reinforcement.tube_diameter_description",
                ref:"d",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/tube.png": "/public/images/helpers/cantilevers/tube.png",
              },
              elementId:'link_154'
          },
        ]
      },
      {
        name:"upper_eye_clamp",
        "title": "cantilever.fields.params.reinforcement.upper_eye_clamp",
        "fields": [
          {
            "key": "params.reinforcement.upper_eye_clamp_distance",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.upper_eye_clamp_distance",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.upper_eye_clamp_distance",
            "value": "params.reinforcement.upper_distance_offset",
            "help": {
              "header": "cantilever.fields.params.reinforcement.upper_eye_clamp_distance",
              "description": "cantilever.fields.params.reinforcement.upper_eye_clamp_distance_description",
              "ref": "A",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            },
            elementId:'link_150'
          },
          {
            "key": "params.reinforcement.upper_eye_clamp.h",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.upper_eye_clamp_tube_to_pin_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.upper_eye_clamp_tube_to_pin_length",
            "value": "params.reinforcement.upper_eye_clamp.h",
            "help": {
              "header": "cantilever.fields.params.reinforcement.upper_eye_clamp_tube_to_pin_length",
              "description": "cantilever.fields.params.reinforcement.upper_eye_clamp_tube_to_pin_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/upper_eye_clamp_70.png" : "/public/images/helpers/cantilevers/upper_eye_clamp_70.png"
            },
            elementId:'link_150'
          }
        ]
      },
      {
        "name":"upper_hook_end_fitting",
        "title": "cantilever.fields.params.reinforcement.upper_hook_end_fitting",
        "fields": [
          {
            "key": "params.reinforcement.upper_hook_end_fitting.L",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.upper_hook_full_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.upper_hook_full_length",
            "value": "params.reinforcement.upper_hook_end_fitting.L",
            "help": {
              "header": "cantilever.fields.params.reinforcement.upper_hook_full_length",
              "description": "cantilever.fields.params.reinforcement.upper_hook_full_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_152'
          },
          {
            "key": "params.reinforcement.upper_hook_end_fitting.a",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.upper_hook_tube_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.upper_hook_tube_length",
            "value": "params.reinforcement.upper_hook_end_fitting.a",
            "help": {
              "header": "cantilever.fields.params.reinforcement.upper_hook_tube_length",
              "description": "cantilever.fields.params.reinforcement.upper_hook_tube_length_description",
              "ref": "W",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_152'
          }
        ]
      },
      {
        name:"bottom_eye_clamp",
        "title": "cantilever.fields.params.reinforcement.bottom_eye_clamp",
        "fields": [
          {
            "key": "params.reinforcement.bottom_eye_clamp_distance",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.bottom_eye_clamp_distance",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.bottom_eye_clamp_distance",
            "value": "params.reinforcement.bottom_distance_offset",
            "help": {
              "header": "cantilever.fields.params.reinforcement.bottom_eye_clamp_distance",
              "description": "cantilever.fields.params.reinforcement.bottom_eye_clamp_distance_description",
              "ref": "A",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/contact_wire.png" : "/public/images/helpers/cantilevers/contact_wire.png"
            },
            elementId:'link_151'
          },
          {
            "key": "params.reinforcement.bottom_eye_clamp.h",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.bottom_eye_clamp_tube_to_pin_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.bottom_eye_clamp_tube_to_pin_length",
            "value": "params.reinforcement.bottom_eye_clamp.h",
            "help": {
              "header": "cantilever.fields.params.reinforcement.bottom_eye_clamp_tube_to_pin_length",
              "description": "cantilever.fields.params.reinforcement.bottom_eye_clamp_tube_to_pin_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/bottom_eye_clamp_70.png" : "/public/images/helpers/cantilevers/bottom_eye_clamp_70.png"
            },
            elementId:'link_151'
          }
        ]
      },
      {
        "name":"bottom_hook_end_fitting",
        "title": "cantilever.fields.params.reinforcement.bottom_hook_end_fitting",
        "fields": [
          {
            "key": "params.reinforcement.bottom_hook_end_fitting.L",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.bottom_hook_full_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.bottom_hook_full_length",
            "value": "params.reinforcement.bottom_hook_end_fitting.L",
            "help": {
              "header": "cantilever.fields.params.reinforcement.bottom_hook_full_length",
              "description": "cantilever.fields.params.reinforcement.bottom_hook_full_length_description",
              "ref": "H",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_153'
          },
          {
            "key": "params.reinforcement.bottom_hook_end_fitting.a",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.reinforcement.bottom_hook_tube_length",
            "units": "mm",
            "placeholder": "cantilever.fields.params.reinforcement.bottom_hook_tube_length",
            "value": "params.reinforcement.bottom_hook_end_fitting.a",
            "help": {
              "header": "cantilever.fields.params.reinforcement.bottom_hook_tube_length",
              "description": "cantilever.fields.params.reinforcement.bottom_hook_tube_length_description",
              "ref": "W",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/hook_end_clamp.png" : "/public/images/helpers/cantilevers/hook_end_clamp.png"
            },
            elementId:'link_153'
          }
        ]
      },
    ]
  },
  {
    name:"track_params",
    section:"cantilever.fields.params.track_params.name",
    defaultOpen:false,
    subSection:[
      {
        name:null,
        fields:[
          {
              key:"params.track.gauge",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.track_params.gauge", 
              units: "mm",
              placeholder: "cantilever.fields.params.track_params.gauge",
              value:"params.track.gauge",
              help:{
                header:"cantilever.fields.params.track_params.gauge",
                description:"cantilever.fields.params.track_params.gauge_description",
                ref:"G",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/track.png" : "/public/images/helpers/cantilevers/track.png",
              },
              elementId:'sleeper'
          },
          {
              key:"params.track.sleepers.width",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.track_params.sleepers_width", 
              units: "mm",
              placeholder: "cantilever.fields.params.track_params.sleepers_width",
              value:"params.track.sleepers.width",
              help:{
                header:"cantilever.fields.params.track_params.sleepers_width",
                description:"cantilever.fields.params.track_params.sleepers_width_description",
                ref:"W",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/track.png" : "/public/images/helpers/cantilevers/track.png",
              },
              elementId:'sleeper'
          },
          {
              key:"params.track.sleepers.height",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.track_params.sleepers_height", 
              units: "mm",
              placeholder: "cantilever.fields.params.track_params.sleepers_height",
              value:"params.track.sleepers.height",
              help:{
                header:"cantilever.fields.params.track_params.sleepers_height",
                description:"cantilever.fields.params.track_params.sleepers_height_description",
                ref:"H",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/track.png" : "/public/images/helpers/cantilevers/track.png",
              },
              elementId:'sleeper'
          },
          {
            "key": "params.track.skate.ht",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.track_params.skate_ht",
            "units": "mm",
            "placeholder": "cantilever.fields.params.track_params.skate_ht",
            "value": "params.track.skate.ht",
            "help": {
              "header": "cantilever.fields.params.track_params.skate_ht",
              "description": "cantilever.fields.params.track_params.skate_ht_description",
              "ref": "HT",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/skate.png" : "/public/images/helpers/cantilevers/skate.png"
            },
            elementId:'skate'
          },
          {
            "key": "params.track.skate.w",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.track_params.skate_w",
            "units": "mm",
            "placeholder": "cantilever.fields.params.track_params.skate_w",
            "value": "params.track.skate.w",
            "help": {
              "header": "cantilever.fields.params.track_params.skate_w",
              "description": "cantilever.fields.params.track_params.skate_w_description",
              "ref": "W",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/skate.png" : "/public/images/helpers/cantilevers/skate.png"
            },
            elementId:'skate'
          },
          {
            "key": "params.track.skate.hw",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.track_params.skate_hw",
            "units": "mm",
            "placeholder": "cantilever.fields.params.track_params.skate_hw",
            "value": "params.track.skate.hw",
            "help": {
              "header": "cantilever.fields.params.track_params.skate_hw",
              "description": "cantilever.fields.params.track_params.skate_hw_description",
              "ref": "HW",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/skate.png" : "/public/images/helpers/cantilevers/skate.png"
            },
            elementId:'skate'
          },
          {
            "key": "params.track.skate.bw",
            "classNameContainer": "col-span-2 gap-y-2",
            "classNameLabel": "",
            "classNameInput": "",
            "header": "cantilever.fields.params.track_params.skate_bw",
            "units": "mm",
            "placeholder": "cantilever.fields.params.track_params.skate_bw",
            "value": "params.track.skate.bw",
            "help": {
              "header": "cantilever.fields.params.track_params.skate_bw",
              "description": "cantilever.fields.params.track_params.skate_bw_description",
              "ref": "BW",
              "image": process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/skate.png" : "/public/images/helpers/cantilevers/skate.png"
            },
            elementId:'skate'
          }
        ]
      },
    ],
  },
  {
    name:"pantograph_params",
    section:"cantilever.fields.params.pantograph.name",
    defaultOpen:false,
    subSection:[
      {
        name:null,
        fields:[
          {
              key:"params.pantograph.length",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.pantograph.length", 
              units: "mm",
              placeholder: "cantilever.fields.params.pantograph.length",
              value:"params.pantograph.length",
              help:{
                header:"cantilever.fields.params.pantograph.length",
                description:"cantilever.fields.params.pantograph.length_description",
                ref:"P",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/pantograph.png" : "/public/images/helpers/cantilevers/pantograph.png",
              },
              elementId:'sleeper'
          },
          {
              key:"params.pantograph.gauge",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "cantilever.fields.params.pantograph.gauge", 
              units: "mm",
              placeholder: "cantilever.fields.params.pantograph.gauge",
              value:"params.pantograph.gauge",
              help:{
                header:"cantilever.fields.params.pantograph.gauge",
                description:"cantilever.fields.params.pantograph.gauge_description",
                ref:"H",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/cantilevers/pantograph.png" : "/public/images/helpers/cantilevers/pantograph.png",
              },
              elementId:'sleeper'
          },
        ]
      },
    ],
  },
]
