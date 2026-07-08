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
      inputType?:'text'|'checkbox'|'selector';
      options?:{value:string, label:string }[];
    }[] 
  }[] 
}[] = [ 
  {
    name:"main_params",
    section:"vane.fields.params.main_params.name",
    defaultOpen:true,
    subSection:[
      {
        name:null,
        fields:[
          {
              key:"external_id",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.external_id", 
              units: "",
              placeholder: "vane.fields.params.main_params.external_id",
              value:"external_id",
              elementId:"external_id"
          },
          {
              key:"params.separation_calculation",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.separation_calculation", 
              units: "",
              placeholder: "vane.fields.params.main_params.separation_calculation",
              value:"params.separation_calculation",
              inputType:"checkbox",
              help:{
                header:"vane.fields.params.main_params.separation_calculation",
                description:"vane.fields.params.main_params.separation_calculation_description",
                ref:"",
                image: process.env.NODE_ENV === "production" ? "/images/helpers/vanes/droppers_calculation_german.PNG" : "/public/images/helpers/vanes/droppers_calculation_german.PNG",
              },
          },
          {
              key:"params.initial_separation",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.initial_separation", 
              units: "mm",
              placeholder: "vane.fields.params.main_params.initial_separation",
              value:"params.initial_separation",
              inputType:"text",
          },
          {
              key:"params.qty_droppers",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.qty_droppers", 
              units: "mm",
              placeholder: "vane.fields.params.main_params.qty_droppers",
              value:"params.qty_droppers",
              inputType:"text",
          },
          {
            key:"params.dropper_weight",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.dropper_weight", 
            units: "kg",
            placeholder: "vane.fields.params.main_params.dropper_weight",
            value:"params.dropper_weight",
            inputType:"text",
          },
          {
            key:"params.arrow",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.arrow", 
            units: "",
            placeholder: "vane.fields.params.main_params.arrow",
            value:"params.arrow",
            inputType:"checkbox",
          },
          {
            key:"params.arrow_length",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.arrow_length", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.arrow_length",
            value:"params.arrow_length",
            inputType:"text",
          },
          {
            key:"params.lifting",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.lifting", 
            units: "",
            placeholder: "vane.fields.params.main_params.lifting",
            value:"params.lifting",
            inputType:"checkbox",
          },
          {
            key:"params.default_properties.lifting_a",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.lifting_a", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.lifting_a",
            value:"params.default_properties.lifting_a",
            inputType:"text",
          },
          {
            key:"params.default_properties.lifting_b",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.lifting_b", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.lifting_b",
            value:"params.default_properties.lifting_b",
            inputType:"text",
          },
          {
            key:"params.calculation_type",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.calculation_type", 
            units: "",
            placeholder: "vane.fields.params.main_params.calculation_type",
            value:"params.calculation_type",
            inputType:"selector",
            options:[{value:"manual", label:"vane.fields.params.main_params.calculation_type_manual"},{value:"automatic", label:"vane.fields.params.main_params.calculation_type_automatic"}]
          },
          {
            key:"params.default_properties.vane_length",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.vane_length", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.vane_length",
            value:"params.default_properties.vane_length",
            inputType:"text",
          },
          {
              key:"pole_name_a",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.default_properties.pole_name_a", 
              units: "",
              placeholder: "vane.fields.params.main_params.default_properties.pole_name_a",
              value:"params.default_properties.pole_name_a",
              elementId:"pole_name_a"
          },
          {
            key:"params.default_properties.contact_wire_height_a",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.contact_wire_height_a", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.contact_wire_height_a",
            value:"params.default_properties.contact_wire_height_a",
            inputType:"text",
          },
          {
            key:"params.default_properties.system_height_a",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.system_height_a", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.system_height_a",
            value:"params.default_properties.system_height_a",
            inputType:"text",
          },
          {
              key:"pole_name_b",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.main_params.default_properties.pole_name_b", 
              units: "",
              placeholder: "vane.fields.params.main_params.default_properties.pole_name_b",
              value:"params.default_properties.pole_name_b",
              elementId:"pole_name_b"
          },
          {
            key:"params.default_properties.contact_wire_height_b",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.contact_wire_height_b", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.contact_wire_height_b",
            value:"params.default_properties.contact_wire_height_b",
            inputType:"text",
          },
          {
            key:"params.default_properties.system_height_b",
            classNameContainer:"col-span-2 gap-y-2",
            classNameLabel:"",
            classNameInput:"",
            header: "vane.fields.params.main_params.default_properties.system_height_b", 
            units: "mm",
            placeholder: "vane.fields.params.main_params.default_properties.system_height_b",
            value:"params.default_properties.system_height_b",
            inputType:"text",
          },
        ]
      },
    ],
  },
  {
    name:"support_wire",
    section:"vane.fields.params.support_wire.name",
    defaultOpen:false,
    subSection:[
      {
        name:null,
        fields:[
          {
              key:"params.support_wire.tension_force",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.support_wire.tension", 
              units: "kgf",
              placeholder: "vane.fields.params.support_wire.tension",
              value:"params.support_wire.tension_force",
              inputType:"text",
          },
          {
              key:"params.support_wire.weight",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.support_wire.weight", 
              units: "kg/mm",
              placeholder: "vane.fields.params.support_wire.weight",
              value:"params.support_wire.weight",
              inputType:"text",
          },
        ]
      },
    ],
  },
  {
    name:"contact_wire",
    section:"vane.fields.params.contact_wire.name",
    defaultOpen:false,
    subSection:[
      {
        name:null,
        fields:[
          {
              key:"params.contact_wire.tension_force",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.contact_wire.tension", 
              units: "kgf",
              placeholder: "vane.fields.params.contact_wire.tension",
              value:"params.contact_wire.tension_force",
              inputType:"text",
          },
          {
              key:"params.contact_wire.weight",
              classNameContainer:"col-span-2 gap-y-2",
              classNameLabel:"",
              classNameInput:"",
              header: "vane.fields.params.contact_wire.weight", 
              units: "kg/mm",
              placeholder: "vane.fields.params.contact_wire.weight",
              value:"params.contact_wire.weight",
              inputType:"text",
          },
        ]
      },
    ],
  },

]
