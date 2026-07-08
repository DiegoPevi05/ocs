import { Cantilever } from "./Cantilever.server";

// Define a subclass CantileverGerman, inheriting from Cantilever.
class CantileverBrazilian extends Cantilever {
  // Additional property specific to CantileverGerman.
  public stay_tube:{
    alpha:number;
    tube:SteelTube;
    isolator:Isolator;
    mw_support:{
      wireSupport:BrazilianWireSupport,
      end_distance:number;
      eye_clamp_distance:number;
    };
    eye_clamp:EyeClamp;
    swivel_bracket:SwivelBracket;
    swivel_clevis:SwivelClevis  
  };
  public bracket_tube:{
    tube:SteelTube;
    isolator:Isolator;
    swivel_bracket:SwivelBracket;
    swivel_clevis:SwivelClevis;
    clevis_end_fitting:ClevisEndFitting;
    eye_clamp:EyeClamp;
  };
  public register_arm:{
    alpha:number;
    drop_bracket_distance:number;
    eye_clamp_distance:number;
    tube:SteelTube;
    stainless_steel_wire_rope:StainlessSteelWireRope;
    drop_bracket:DropBracket;
    eye_clamp:EyeClamp;
    hook_end_fitting:HookEndFitting;
  } | null;
  public steady_arm:{
    alpha:number;
    length:number,
    end_distance:number;
    eye_clamp_distance:number|null;
    stainless_steel_wire_rope:StainlessSteelWireRope|null;
    tube:SteelTube;
    hook_end_fitting:HookEndFitting|null;
    hook_end_clamp:HookEndClamp|null;
    swivel_clip:SwivelClip|null;
    eye_clamp:EyeClamp|null;
    eye_clamp_contact_wire:ClampHolderContactWire|null;
  };

  public reinforcement:{
      tube:SteelTube;
      upper_distance_offset:number,
      upper_eye_clamp:EyeClamp;
      upper_hook_end_fitting:HookEndFitting;
      bottom_distance_offset:number,
      bottom_eye_clamp:EyeClamp;
      bottom_hook_end_fitting:HookEndFitting;
    }|null


  public links:CantileverLink[];
  public dimensions:Dimensions[];
  // Constructor to initialize the CantileverGerman properties.
  
  //Internal Fields
  //bracket tube

  private stay_tube_dir: { x:number, y:number, z:number};
  private stay_tube_perp: { x:number, y:number, z:number};
  private stay_tube_points: {x:number, y:number, z:number}[];
  private bottom_pole_fixed_point: {x:number, y:number, z:number};
  private bottom_fixed_point:{ x:number, y:number, z:number};
  private inferior_tube_angle: {angle:number};
  private bracket_tube_dir:{x:number, y:number, z:number};
  private bracket_tube_perp:{x:number, y:number, z:number};

  private bottom_isolator_point: { x:number, y:number, z:number};
  private upper_eye_clamp_clevis_fixed_point: { x:number, y:number, z:number};
  private upper_eye_clamp_clevis_stainless_stell_point: { x:number, y:number, z:number};

  //stay tube
  private wire_support_fixed_point: {x:number, y:number, z:number};
  private wire_support_fixed_point_pp_to_mw:{x:number,y:number,z:number};
  private wire_support_fixed_point_stainless_steel_point:{x:number,y:number,z:number};

  private upper_pole_fixed_point: { x:number, y:number, z:number};
  private upper_fixed_point: { x:number, y:number, z:number};
  private upper_tube_eye_clamp_tube_fixed_point: { x:number, y:number, z:number};
  private upper_tube_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private upper_tube_end_point: { x:number, y:number, z:number};
  private upper_isolator_point: { x:number, y:number, z:number};

  //registe arm
  private register_arm_dir:{x:number, y:number, z:number};
  private register_arm_perp_v:{x:number, y:number, z:number};
  private register_arm_perp_k:{x:number, y:number, z:number};

  private register_arm_bracket_bottom_point: { x:number, y:number, z:number}[];
  private register_arm_bracket_upper_fixed_point: { x:number, y:number, z:number};
  private register_arm_eye_clamp_point: { x:number, y:number, z:number};
  private register_arm_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private register_arm_hook_end_fitting_point: { x:number, y:number, z:number};

  //steady arm

  private steady_arm_dir:{x:number, y:number, z:number};
  private steady_arm_perp_v:{x:number, y:number, z:number};
  private steady_arm_perp_k:{x:number, y:number, z:number};

  private steady_arm_points:{x:number,y:number,z:number}[];
  private steady_arm_y_axis_cw_point:{ x:number, y:number, z:number}[]
  private steady_arm_fixed_point: { x:number, y:number, z:number}[];
  private steady_arm_hook_clamp_point_clamp: {x:number, y:number,z:number}[];
  private steady_arm_eye_clamp_point: { x:number, y:number, z:number};
  private steady_arm_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private steady_arm_end_point: { x:number, y:number, z:number}[];
  private steady_arm_hook_clamp_point: { x:number, y:number, z:number}[];
  private steady_arm_hook_clamp_intersection_support: { x:number, y:number, z:number }[];

  private steady_arm_hook_fixed_point: { x:number, y:number, z:number}[];
  private intersection_steady_arm_fixed_point: { x:number, y:number, z:number};
  private steady_arm_hook_end_fitting_point: { x:number, y:number, z:number};


  //calculations
  private intersection_point: { x:number, y:number, z:number};
  private intersection_tube_fixed_point: { x:number, y:number, z:number};
  private intersection_register_arm_fixed_point: { x:number, y:number, z:number};


  //reinforcement
  private reinforcement_upper_eye_clamp_point:{x:number,y:number,z:number};
  private reinforcement_upper_hook_end_point:{x:number,y:number,z:number};
  private reinforcement_bottom_eye_clamp_point:{x:number,y:number,z:number};
  private reinforcement_bottom_hook_end_point:{x:number,y:number,z:number};
  private reinforcement_upper_fixed_point:{x:number,y:number,z:number};
  private reinforcement_bottom_fixed_point:{x:number,y:number,z:number};

  constructor(
    model:ModelInterface,
    poleModel:PoleModelInterface,
    esc:number,
    contact_wire_vertical_offset:number,
    contact_wire_height: number,
    bottom_fixed_height:number,
    fixing_distance:number,
    system_height: number,
    zig_zag:number,
    track:Track,
    pantograph:Pantrograph,
    support_offset:number,
    u:number,
    curve_radius_direction:'inside'|'outside',
    pv:{ x:number, y:number, z:number },
    stay_tube:{
      alpha:number;
      tube:SteelTube;
      isolator:Isolator;
      mw_support:{
        wireSupport:BrazilianWireSupport,
        end_distance:number;
        eye_clamp_distance:number;
      };
      eye_clamp:EyeClamp;
      swivel_bracket:SwivelBracket;
      swivel_clevis:SwivelClevis  
    },
    bracket_tube:{
      tube:SteelTube;
      isolator:Isolator;
      swivel_bracket:SwivelBracket;
      swivel_clevis:SwivelClevis;
      clevis_end_fitting:ClevisEndFitting;
      eye_clamp:EyeClamp;
    },
    register_arm:{
      alpha:number;
      drop_bracket_distance:number;
      eye_clamp_distance:number;
      tube:SteelTube;
      stainless_steel_wire_rope:StainlessSteelWireRope;
      drop_bracket:DropBracket;
      eye_clamp:EyeClamp;
      hook_end_fitting:HookEndFitting;
    } | null,
    steady_arm:{
      alpha:number;
      length:number,
      end_distance:number;
      eye_clamp_distance:number|null;
      stainless_steel_wire_rope:StainlessSteelWireRope|null;
      tube:SteelTube;
      hook_end_fitting:HookEndFitting|null;
      hook_end_clamp:HookEndClamp|null;
      swivel_clip:SwivelClip|null;
      eye_clamp:EyeClamp|null;
      eye_clamp_contact_wire:ClampHolderContactWire|null;
    },
    reinforcement:{
      tube:SteelTube;
      upper_distance_offset:number,
      upper_eye_clamp:EyeClamp;
      upper_hook_end_fitting:HookEndFitting;
      bottom_distance_offset:number,
      bottom_eye_clamp:EyeClamp;
      bottom_hook_end_fitting:HookEndFitting;
    }|null,
    pole:PolePropertiesParams|null,
    pov:'local'|'global'
  ) {
    // Call the parent constructbior to initialize inherited properties.
    super(
      poleModel,
      esc,
      system_height,
      contact_wire_vertical_offset,
      contact_wire_height, 
      bottom_fixed_height,
      fixing_distance,
      zig_zag, 
      track,
      pantograph,
      support_offset,
      u,
      curve_radius_direction,
      pv ,
      model,
      pole,
      pov
    );
    this.stay_tube = stay_tube;
    this.bracket_tube = bracket_tube;
    this.register_arm = register_arm;
    this.steady_arm = steady_arm;
    this.reinforcement = reinforcement;
    this.links = [];
    this.dimensions = [];


    //initialize this values to eliminate recursive calls
    //Bracket Tube
    //

    this.bottom_pole_fixed_point =  this.getBottomPoleFixedPoint();
    this.bottom_fixed_point =  this.getBottomFixedPoint();

     //Stay Tube
    this.upper_pole_fixed_point = this.getUpperPoleFixedPoint();
    this.upper_fixed_point =  this.getUpperFixedPoint();
    this.stay_tube.alpha = this.getDirOfStayTube();
    this.wire_support_fixed_point = this.getWireSupportFixedPoint();
    this.wire_support_fixed_point_pp_to_mw = this.getWireSupportFixedPointPerpendicularToMW();
    this.wire_support_fixed_point_stainless_steel_point = this.getWireSupportStainlessSteelPoint();
    this.upper_tube_eye_clamp_tube_fixed_point  = this.getUpperTubeEyeClampTubeFixedPoint();
    this.upper_tube_eye_clamp_fixed_point = this.getUpperTubeEyeClampFixedPoint();
    this.upper_tube_end_point = this.getUpperTubeEndPoint();
    this.upper_isolator_point = this.getUpperIsolatorPoint();
    this.stay_tube_points =  this.getMWPoints();
    //end stay stube

    //Bracket Tube
    this.inferior_tube_angle = this.getInferiorTubeAngle();
    this.bottom_isolator_point = this.getBottomIsolatorPoint();
    this.upper_eye_clamp_clevis_fixed_point = this.getUpperEyeClampClevisFixedPoint();

    //steady arm
    this.setSteadyArmDirections();
    this.steady_arm_points = this.getCWPoints();
    this.steady_arm_y_axis_cw_point = this.getSteadyArmYAxisCWPoint();
    this.steady_arm_fixed_point = this.getSteadyArmFixedPoint();
    this.steady_arm_eye_clamp_point = this.getSteadyArmEyeClampPoint();
    this.steady_arm_eye_clamp_fixed_point = this.getSteadyArmEyeClampFixedPoint();
    this.steady_arm_end_point = this.getSteadyArmEndPoint();
    this.steady_arm_hook_clamp_point_clamp = this.getSteadyArmHookClampPointClamp();
    this.steady_arm_hook_clamp_point = this.getSteadyArmHookClampPoint();
    this.steady_arm_hook_clamp_intersection_support = this.getSteadyArmIntersectionHookClampPoint();
    this.steady_arm_hook_fixed_point = this.getSteadyArmHookClampFixedPoint();

    // register Arm
    this.setRegisterArmDirections();
    this.register_arm_bracket_bottom_point = this.getRegisterArmDropperBracketBottomPoint();
    this.register_arm_bracket_upper_fixed_point = this.getRegisterArmDropperBracketUpperFixedPoint();
    this.register_arm_eye_clamp_point = this.getRegisterArmEyeClampPoint();
    this.register_arm_eye_clamp_fixed_point = this.getRegisterArmEyeClampFixedPoint();

    //global calculations
    this.intersection_point = this.getIntersectionPoint();
    const { start, end } = this.getIntersectionTubeFixedPoint();
    this.intersection_tube_fixed_point = start;
    this.intersection_register_arm_fixed_point = end;
    this.intersection_steady_arm_fixed_point = end;

    // register Arm
    this.register_arm_hook_end_fitting_point =  this.getRegisterArmHookEndFittingPoint();
    //steady Arm
    this.steady_arm_hook_end_fitting_point = this.getSteadyArmHookEndFittingPoint();

    //reinforcement
    this.reinforcement_upper_eye_clamp_point = this.getReinforcementUpperEyeClampPoint();
    this.reinforcement_upper_hook_end_point = this.getReinforcementUpperHookEndPoint();
    this.reinforcement_bottom_eye_clamp_point = this.getReinforcementBottomEyeClampPoint();
    this.reinforcement_bottom_hook_end_point = this.getReinforcementBottomHookEndPoint();
    this.reinforcement_upper_fixed_point = this.getReinforcementUpperFixedPoint();
    this.reinforcement_bottom_fixed_point = this.getReinforcementBottomFixedPoint();

  }

  getReinforcementUpperEyeClampPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    return this.addVectors(this.upper_isolator_point,this.scaleVector(this.stay_tube_dir,this.reinforcement.upper_distance_offset)); 

    return {x:x0, y:y0, z:z0}
  }

  getReinforcementUpperHookEndPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    return this.subtractVectors(this.reinforcement_upper_eye_clamp_point,this.scaleVector(this.stay_tube_perp,this.reinforcement.upper_eye_clamp.h)); 

  }

  getReinforcementBottomEyeClampPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    return this.subtractVectors(this.intersection_tube_fixed_point,this.scaleVector(this.bracket_tube_dir,this.reinforcement.bottom_distance_offset)); 

  }

  getReinforcementBottomHookEndPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    return this.subtractVectors(this.reinforcement_bottom_eye_clamp_point,this.scaleVector(this.bracket_tube_perp,this.reinforcement.bottom_eye_clamp.h)); 

  }

  getDirOfReinforcment():number{

    return this.getDirectionVector(this.reinforcement_upper_hook_end_point, this.reinforcement_bottom_hook_end_point);
  }

  getReinforcementBottomFixedPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    let reinformcentDir = this.getDirOfReinforcment();

    let distance      = this.reinforcement.bottom_hook_end_fitting.L - this.reinforcement.bottom_hook_end_fitting.a

    return this.subtractVectors(this.reinforcement_bottom_hook_end_point,this.scaleVector(reinformcentDir,distance)); 

  }

  getReinforcementUpperFixedPoint():{x:number,y:number,z:number}{

    if(!this.reinforcement) return { x:0, y:0, z:0 };

    let reinformcentDir = this.getDirOfReinforcment();

    let distance      = this.reinforcement.bottom_hook_end_fitting.L - this.reinforcement.bottom_hook_end_fitting.a

    return this.addVectors(this.reinforcement_upper_hook_end_point,this.scaleVector(reinformcentDir,distance)); 

    return {x:x0, y:y0, z:z0}
  }



  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************STAY STUBE***********************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/

  /***********************************************************TDP<2.2 - SBA - SINGLE - DOUBLE **********************************************************************************/


  //getWireSupportDistanceFromFixedPoint
  //getWireSupportDistanceFromFixedPoint():number {
  //   let distance_to_mw = this.getDistanceBetweenTwoPoints(this.mw_axis,this.upper_fixed_point);
  //    let distance_to_fixed_point = Math.sqrt( Math.pow(distance_to_mw,2) - Math.pow(this.stay_tube.mw_support.wireSupport.h,2));

  //    let dx = this.mw_axis.x - this.getSwivelClevisUtilLength(this.stay_tube.swivel_bracket,this.stay_tube.swivel_clevis);
  //    return (dx)*(1/Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha))) +  this.stay_tube.mw_support.wireSupport.h*(Math.tan(this.degreesToRadians(360 + this.stay_tube.alpha)));
  //}
  getMWPoints():{x:number,y:number,z:number}[]{

    let points:{x:number,y:number,z:number}[] = [];

    let dirToAdd = this.stay_tube_dir;

    if(this.model.type.configuration == "CAI"){

      dirToAdd = this.invertVectorDirection(this.stay_tube_dir);

    };

    points.push(this.getMwAxis());

    points.push(this.addVectors(this.getMwAxis(),this.scaleVector(dirToAdd, this.stay_tube.mw_support.wireSupport.D)));

    return points;

  }

  getDirOfStayTube():number {

    const H         = this.subtractVectors(this.mw_axis,this.upper_fixed_point);
    const Hlen      = this.lengthVector(H);
    const Blen      = this.stay_tube.mw_support.wireSupport.B;

    if (Blen > Hlen) {
      throw new Error(`B (${Blen}) > hipotenusa (${Hlen})`);
    };

    const Alen  = Math.sqrt(Hlen * Hlen - Blen * Blen);
    const az    = Math.atan2(H.z, H.x);

    const pxz   = Math.hypot(H.x, H.z);
    const elevH = Math.atan2(H.y, pxz);

    const theta = Math.acos(Alen / Hlen);
    const elevA = elevH - theta;

    const dirA: Vector3 = {
      x: Math.cos(az) * Math.cos(elevA),
      y: Math.sin(elevA),
      z: Math.sin(az) * Math.cos(elevA)
    };

    this.stay_tube_dir = dirA;

    const Avec = this.scaleVector(dirA, Alen);
    const Bvec = this.subtractVectors(H, Avec);

    this.stay_tube_perp =  this.normalizeVector(Bvec);

    return this.radiansToDegress(elevA); // { dir: dirA, angle: elevA };

    // 2.8 Vector A y vector B = H − A
    //const Avec = this.scaleVector(dirA, A_len);
    //const Bvec = this.subtractVectors(H, A_vec);

  }


  getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint():number {

    const H         = this.subtractVectors(this.mw_axis,this.upper_fixed_point);
    const Hlen      = this.lengthVector(H);
    const Blen      = this.stay_tube.mw_support.wireSupport.B;

    if (Blen > Hlen) {
      throw new Error(`B (${Blen}) > hipotenusa (${Hlen})`);
    };

    return Math.sqrt(Hlen * Hlen - Blen * Blen);
  }


  getWireSupportFixedPoint():{x:number, y:number, z:number} {

    const Alen = this.getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint();

    let dToFixPoint = Alen - this.stay_tube.mw_support.wireSupport.A;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "SBA"){

      dToFixPoint = Alen - (this.stay_tube.mw_support.wireSupport.A - this.stay_tube.mw_support.wireSupport.D);

    }

    return this.addVectors(this.upper_fixed_point,this.scaleVector(this.stay_tube_dir,dToFixPoint));

  }

  getWireSupportFixedPointPerpendicularToMW():{x:number, y:number, z:number}{

    const Alen = this.getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint();

    return this.addVectors(this.upper_fixed_point,this.scaleVector(this.stay_tube_dir,Alen));

  }

  getWireSupportStainlessSteelPoint():{x:number, y:number, z:number}{

    const invertVector = this.invertVectorDirection(this.scaleVector(this.stay_tube_perp,this.stay_tube.mw_support.wireSupport.C));

    return this.addVectors(this.wire_support_fixed_point,invertVector);

  }


  getUpperTubeEndPoint():{x:number, y:number, z:number}{

    return this.addVectors(this.wire_support_fixed_point,this.scaleVector(this.stay_tube_dir,this.stay_tube.mw_support.end_distance));

  }


  getUpperTubeEyeClampTubeFixedPoint():{x:number,y:number, z:number}{

    const invertVector = this.invertVectorDirection(this.scaleVector(this.stay_tube_dir,this.stay_tube.mw_support.eye_clamp_distance));

    return this.addVectors(this.wire_support_fixed_point,invertVector);
  }


  getUpperIsolatorPoint():{x:number, y:number, z:number}{

    return  this.addVectors(this.upper_fixed_point,this.scaleVector(this.stay_tube_dir,this.getIsolatorUtilLength(this.stay_tube.isolator)));

  }

  getUpperFixedPoint():{x:number,y:number, z:number}{

    const distance = this.getSwivelClevisUtilLength(this.stay_tube.swivel_bracket,this.stay_tube.swivel_clevis);

    return this.getPointFromDirection(this.upper_pole_fixed_point,this.directionPv, distance);

  }


  getUpperPoleFixedPoint():{x:number,y:number, z:number}{

    return this.getPointFromDirection(this.bottom_pole_fixed_point, {x:0,y:1,z:0 } ,this.fixing_distance);
  }

  getUpperTubeEyeClampFixedPoint():{x:number, y:number, z:number}{

    const invertVector = this.invertVectorDirection(this.scaleVector(this.stay_tube_perp,this.stay_tube.eye_clamp.h));

    return  this.addVectors(this.upper_tube_eye_clamp_tube_fixed_point,invertVector);

  }

  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************END STAY TUBE***********************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/


  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************START BRACKET TUBE***********************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/

  /*********************************************************SBA - SINGLE - DOUBLE *************************************************************************************/

  getUpperEyeClampClevisStainlesStellPoint():{x:number, y:number, z:number}{

    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "SBA" || this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

      return  this.addVectors(this.upper_eye_clamp_clevis_fixed_point,this.scaleVector(this.bracket_tube_perp,this.getIsolatorUtilLength(this.bracket_tube.clevis_end_fitting.hook_x_distance)));

    }

    return { x: x0, y:y0, z:z0  }
  }



  /***********************************************************TDP<2.2 - SBA - SINGLE - DOUBLE **********************************************************************************/


  getBottomPoleFixedPoint():{x:number,y:number, z:number}{

    const newPoleHeightModified = {
      x:this.polePosition.x,
      y:this.polePosition.y + this.bottom_fixed_height,
      z:this.polePosition.z
    };

    const distance = this.support_offset + this.poleModel.measures.width/2;

    return this.getPointFromDirection(newPoleHeightModified,this.directionPv,distance);



  }

  getBottomFixedPoint():{x:number,y:number, z:number}{

    const distance = this.bracket_tube.swivel_clevis.pin_eye + this.bracket_tube.swivel_bracket.x_pin;

    return this.getPointFromDirection(this.bottom_pole_fixed_point,this.directionPv, distance);

  }


  getInferiorTubeAngle() {

    const H = this.subtractVectors(this.upper_tube_eye_clamp_fixed_point, this.bottom_fixed_point);
    const Hlen = this.lengthVector(H);

    this.bracket_tube_dir = this.normalizeVector(H);

    const normalPlane = this.normalizeVector(this.crossVectors(this.bracket_tube_dir, this.directionPv ))

    this.bracket_tube_perp = this.normalizeVector(this.crossVectors(this.bracket_tube_dir,this.invertVectorDirection(normalPlane)));

    const az = Math.atan2(H.z, H.x);
    const pxz = Math.hypot(H.x, H.z);
    const elevH = Math.atan2(H.y, pxz);

    return  elevH ;
  }

  getBottomIsolatorPoint(){

    return  this.addVectors(this.bottom_fixed_point,this.scaleVector(this.bracket_tube_dir,this.getIsolatorUtilLength(this.bracket_tube.isolator)));
  }

  getUpperEyeClampClevisFixedPoint():{x:number, y:number, z:number}{

    const invertVector = this.invertVectorDirection(this.scaleVector(this.bracket_tube_dir,this.getClevisEndFittingUtilLength(this.bracket_tube.clevis_end_fitting)));

    return this.addVectors(this.upper_tube_eye_clamp_fixed_point,invertVector);

  }

  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************END BRACKET TUBE***********************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/

  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************START REGISTER ARM**************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/

  setRegisterArmDirections(){

    if(this.register_arm === null) return;

    const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

    let cosAlpha = Math.cos(this.degreesToRadians(this.register_arm.alpha));
    let sinAlpha = Math.sin(this.degreesToRadians(this.register_arm.alpha));

    // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
    //
    const registerArmDir = {
      x: dirXZ.x * cosAlpha,
      y: sinAlpha,
      z: dirXZ.z * cosAlpha,
    };

    // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
    this.register_arm_dir = registerArmDir;

    const normalPlane = this.normalizeVector(this.crossVectors(this.register_arm_dir, this.directionPv ))

    this.register_arm_perp_k = this.invertVectorDirection(normalPlane);

    this.register_arm_perp_v = this.normalizeVector(this.crossVectors(this.register_arm_dir,this.register_arm_perp_k));

  }


  getRegisterArmDropperBracketBottomPoint():{x:number,y:number, z:number}[]{

    if(this.steady_arm_hook_fixed_point.length == 0) return [];

    const points:{x:number,y:number,z:number}[] = []

    if(this.register_arm){
        
      let AngleModified = 360 + this.register_arm.alpha;

      if(this.model.type.configuration == "TDP>2.2" ){

        AngleModified = 180+this.register_arm.alpha;

      }

      const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

      let cosAlpha = Math.cos(this.degreesToRadians(AngleModified));
      let sinAlpha = Math.sin(this.degreesToRadians(AngleModified));

      // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
      const CwXYDir = {
        x: dirXZ.x * cosAlpha,
        y: sinAlpha,
        z: dirXZ.z * cosAlpha,
      };


      if((this.model.type.configuration == "TDP>2.2" ||  this.model.type.configuration == "CAI") && this.steady_arm.hook_end_clamp != null && this.register_arm != null){

        let V0 = this.addVectors(this.steady_arm_hook_fixed_point[0],this.scaleVector(CwXYDir,this.register_arm.drop_bracket.x1));

        if(this.model.type.contactWireConfiguration == "DOUBLE" ){

          let V1 = this.addVectors(this.steady_arm_hook_fixed_point[1],this.scaleVector(CwXYDir,(this.register_arm.drop_bracket.x1 + this.register_arm.drop_bracket.double_wire_separation_x)));

          const V2 = this.subtractVectors(V1,V0);

          const V2len = this.lengthVector(V2);

          const n2V2 = this.normalizeVector(V2);
          
          let V3 = this.getPointFromDirection(V0,n2V2,V2len/2);

          points.push(V3);

          points.push(V0);

          points.push(V1)


        }else{

          points.push(V0);
        }

      }

    }

    return points;

  }


  getRegisterArmDropperBracketUpperFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.register_arm){

      if(this.model.type.configuration == "TDP>2.2" ){

        return this.addVectors(this.register_arm_bracket_bottom_point[0],this.scaleVector(this.invertVectorDirection(this.register_arm_perp_v),this.register_arm.drop_bracket.h));

      }else{

        return this.addVectors(this.register_arm_bracket_bottom_point[0],this.scaleVector(this.register_arm_perp_v,this.register_arm.drop_bracket.h));

      }

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmEyeClampPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.register_arm != null){

      if(this.model.type.configuration == "TDP>2.2" ){

        let distance_eye_clamp = this.register_arm.drop_bracket_distance - this.register_arm.eye_clamp_distance;

        return this.addVectors(this.register_arm_bracket_upper_fixed_point,this.scaleVector(this.register_arm_dir,distance_eye_clamp)); 

      }else if(this.model.type.configuration == "CAI"){

        let distance_eye_clamp = this.register_arm.eye_clamp_distance;

        return this.subtractVectors(this.register_arm_bracket_upper_fixed_point,this.scaleVector(this.register_arm_dir,distance_eye_clamp)); 

      }

    }

    return { x: x0, y:y0  ,z:z0}
  }


  getRegisterArmEyeClampFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;
    
    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      return this.addVectors(this.register_arm_eye_clamp_point,this.scaleVector(this.invertVectorDirection(this.register_arm_perp_v),this.register_arm.eye_clamp.h)); 

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      return this.addVectors(this.register_arm_eye_clamp_point,this.scaleVector(this.register_arm_perp_v,this.register_arm.eye_clamp.h)); 

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmEndPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      return this.addVectors(this.register_arm_bracket_upper_fixed_point,this.scaleVector(this.register_arm_dir,this.register_arm.drop_bracket_distance)); 

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      return this.addVectors(this.register_arm_bracket_upper_fixed_point,this.scaleVector(this.register_arm_dir,this.register_arm.drop_bracket_distance)); 

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmHookEndFittingPoint():{x:number,y:number, z:number}{
    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null && this.register_arm.hook_end_fitting != null){

      let length = this.register_arm.hook_end_fitting.L - this.register_arm.hook_end_fitting.a

      return this.addVectors(this.intersection_register_arm_fixed_point,this.scaleVector(this.register_arm_dir,length)); 

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      let length = this.register_arm.hook_end_fitting.L - this.register_arm.hook_end_fitting.a

      return this.addVectors(this.intersection_register_arm_fixed_point,this.scaleVector(this.register_arm_dir,length)); 

    }

    return { x: x0, y:y0  ,z:z0}

  }


  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************END REGISTER ARM***********************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/




  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************STARY STEADY ARM**************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/



  /*********************************************************SBA - SINGLE - DOUBLE *************************************************************************************/

  getSteadyArmEyeClampPoint():{x:number, y:number, z:number}{

    if(this.model.type.configuration == "SBA" && this.steady_arm.eye_clamp_distance != null){

      return this.addVectors(this.steady_arm_fixed_point[0],this.scaleVector(this.invertVectorDirection(this.steady_arm_dir),this.steady_arm.eye_clamp_distance));

    };

    return { x: 0, y:0, z:0  }
  }

  getSteadyArmEyeClampFixedPoint():{x:number, y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "SBA" && this.steady_arm.eye_clamp != null){

      return this.addVectors(this.steady_arm_eye_clamp_point, this.scaleVector(this.steady_arm_perp_v,this.steady_arm.eye_clamp.h));

    };

    return { x: 0, y:0, z:0  }
  }
  
  /***********************************************************TDP<2.2 - SBA - SINGLE - DOUBLE **********************************************************************************/

  setSteadyArmDirections(){
    const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

    let angle = this.degreesToRadians(this.steady_arm.alpha) 

    let cosAlpha = Math.cos(angle);
    let sinAlpha = Math.sin(angle);

    const steadyArmDir = {
      x: dirXZ.x * cosAlpha,
      y: sinAlpha,
      z: dirXZ.z * cosAlpha,
    };

    // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
    this.steady_arm_dir = steadyArmDir;

    const normalPlane = this.normalizeVector(this.crossVectors(this.steady_arm_dir, this.directionPv ))

    this.steady_arm_perp_k = this.invertVectorDirection(normalPlane);

    this.steady_arm_perp_v = this.normalizeVector(this.crossVectors(this.steady_arm_dir,this.steady_arm_perp_k));


  }


  getCWPoints():{x:number, y:number, z:number}[]{

    const points:{x:number,y:number,z:number}[] = []

    if(this.model.type.contactWireConfiguration == "DOUBLE"){


      if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA"){

        if(this.model.type.configuration == "SBA" && this.steady_arm.eye_clamp_contact_wire){

            let separation = (this.steady_arm.eye_clamp_contact_wire.A + this.steady_arm.eye_clamp_contact_wire.double_separation) - this.steady_arm.eye_clamp_contact_wire.C;

            const pointCw1 =  this.addVectors(this.cw_axis,this.scaleVector(this.steady_arm_dir,separation));

            points.push(pointCw1);

            const pointCw2 =  this.subtractVectors(this.cw_axis,this.scaleVector(this.steady_arm_dir,separation));

            points.push(pointCw2);

        }else{

          const pointCw1 =  this.addVectors(this.cw_axis,this.scaleVector(this.steady_arm_perp_k,this.bracket_tube.eye_clamp.h));

          points.push(pointCw1);

          const pointCw2 =  this.subtractVectors(this.cw_axis,this.scaleVector(this.steady_arm_perp_k,this.bracket_tube.eye_clamp.h));

          points.push(pointCw2);

        }


      }else{

        if(this.steady_arm.swivel_clip && this.register_arm){

          let angle = this.degreesToRadians(this.steady_arm.alpha - this.steady_arm.swivel_clip.C);

          if(this.model.type.configuration == "TDP>2.2"){

            angle = this.degreesToRadians(180 - (this.steady_arm.alpha + this.steady_arm.swivel_clip.C));

          }

          const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

          const cosAlpha = Math.cos(angle);
          const sinAlpha = Math.sin(angle);

          // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
          const CwXYDir = {
            x: dirXZ.x * cosAlpha,
            y: sinAlpha,
            z: dirXZ.z * cosAlpha,
          };

          const vectorDi1 =  this.addVectors(this.cw_axis,this.scaleVector(CwXYDir,this.register_arm.drop_bracket.double_wire_separation_x/2));
          const pointCw1 = this.addVectors(vectorDi1,this.scaleVector(this.steady_arm_perp_k,this.register_arm.drop_bracket.double_wire_separation_z/2)); 

          const vectorDi2 =  this.subtractVectors(this.cw_axis,this.scaleVector(CwXYDir,this.register_arm.drop_bracket.double_wire_separation_x/2));
          const pointCw2 = this.subtractVectors(vectorDi2,this.scaleVector(this.steady_arm_perp_k,this.register_arm.drop_bracket.double_wire_separation_z/2)); 

          points.push(pointCw1);
          points.push(pointCw2);

        }

      }

    }else{

      points.push(this.cw_axis);

    }

    return points;
  }



  getSteadyArmYAxisCWPoint():{x:number, y:number, z:number}[]{

    if(this.model.type.configuration == "SBA") return [];

    const points:{x:number,y:number,z:number}[] = []

    if(!this.steady_arm.swivel_clip) return [];

    let angleModified = this.degreesToRadians(90 + this.steady_arm.alpha - this.steady_arm.swivel_clip.B) ;

    if(this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "TDP<2.2"){

      angleModified = this.degreesToRadians(90 + (this.steady_arm.alpha*-1)  - this.steady_arm.swivel_clip.B) ;

    }

    const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

    const cosAlpha = Math.cos(angleModified);
    const sinAlpha = Math.sin(angleModified);

    // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
    const CwXYDir = {
      x: dirXZ.x * cosAlpha,
      y: sinAlpha,
      z: dirXZ.z * cosAlpha,
    };

    let V0 = this.addVectors(this.steady_arm_points[0],this.scaleVector(CwXYDir,this.steady_arm.swivel_clip.A));

    if(this.model.type.contactWireConfiguration == "DOUBLE"){

      points.push(V0)

      let V1 = this.addVectors(this.steady_arm_points[1],this.scaleVector(CwXYDir,this.steady_arm.swivel_clip.A));

      points.push(V1)

    }else{

      points.push(V0)

    }

    return points;
  }


  getSteadyArmFixedPoint():{x:number, y:number, z:number}[]{


    const points:{x:number,y:number,z:number}[] = []

    if(this.model.type.configuration == "SBA"){

        if(!this.steady_arm.eye_clamp_contact_wire) return [];

        let angleModified = this.degreesToRadians(this.radiansToDegress(Math.atan(this.steady_arm.eye_clamp_contact_wire.B/this.steady_arm.eye_clamp_contact_wire.C)) + this.steady_arm.alpha) ;

        let length = Math.sqrt( Math.pow(this.steady_arm.eye_clamp_contact_wire.B,2) + Math.pow(this.steady_arm.eye_clamp_contact_wire.C,2))

        const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

        const cosAlpha = Math.cos(angleModified);
        const sinAlpha = Math.sin(angleModified);

        // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
        const CwXYDir = {
          x: dirXZ.x * cosAlpha,
          y: sinAlpha,
          z: dirXZ.z * cosAlpha,
        };

        let V0 = this.addVectors(this.steady_arm_points[0],this.scaleVector(CwXYDir,length));

        if(this.model.type.contactWireConfiguration =="DOUBLE"){

          points.push(V0);

          let angleModified2 = this.degreesToRadians( 180 - this.radiansToDegress(Math.atan(this.steady_arm.eye_clamp_contact_wire.B/this.steady_arm.eye_clamp_contact_wire.C)) + this.steady_arm.alpha) ;

          const cosAlpha2 = Math.cos(angleModified2);
          const sinAlpha2 = Math.sin(angleModified2);

          // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
          const CwXYDir2 = {
            x: dirXZ.x * cosAlpha2,
            y: sinAlpha2,
            z: dirXZ.z * cosAlpha2,
          };

          let V1 = this.addVectors(this.steady_arm_points[1],this.scaleVector(CwXYDir2,length));

          points.push(V1);

        }else{

          points.push(V0);

        }


    }else{

        if(!this.steady_arm.swivel_clip || this.steady_arm_y_axis_cw_point.length == 0) return [];

        let angleModified = this.degreesToRadians(this.steady_arm.alpha) ;

        if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration =="TDP>2.2"){

          angleModified = this.degreesToRadians(180 + this.steady_arm.alpha);

        }

        const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

        const cosAlpha = Math.cos(angleModified);
        const sinAlpha = Math.sin(angleModified);

        // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
        const CwXYDir = {
          x: dirXZ.x * cosAlpha,
          y: sinAlpha,
          z: dirXZ.z * cosAlpha,
        };

        let V0 = this.addVectors(this.steady_arm_y_axis_cw_point[0],this.scaleVector(CwXYDir,this.steady_arm.swivel_clip.B));

        if(this.model.type.contactWireConfiguration =="DOUBLE"){

          points.push(V0);

          let V1 = this.addVectors(this.steady_arm_y_axis_cw_point[1],this.scaleVector(CwXYDir,this.steady_arm.swivel_clip.B));

          points.push(V1);

        }else{

          points.push(V0);

        }
    }

    return points; 
  }

  getSteadyArmEndPoint():{x:number, y:number, z:number}[]{

    if(this.steady_arm_fixed_point.length == 0) return [];

    const points:{x:number,y:number,z:number}[] = []

    if(this.model.type.configuration == "SBA"){

      let V0 = this.addVectors(this.steady_arm_fixed_point[0],this.scaleVector(this.steady_arm_dir,this.steady_arm.end_distance));

      points.push(V0);

    }else if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "TDP>2.2"){


      let V0 = this.addVectors(this.steady_arm_fixed_point[0],this.scaleVector(this.steady_arm_dir,this.steady_arm.end_distance));

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

          points.push(V0);

          let V1 = this.addVectors(this.steady_arm_fixed_point[1],this.scaleVector(this.steady_arm_dir,this.steady_arm.end_distance));

          points.push(V1);

      }else{

        points.push(V0);

      }

    }else if(this.model.type.configuration == "CAI"){

      let V0 = this.subtractVectors(this.steady_arm_fixed_point[0],this.scaleVector(this.steady_arm_dir,this.steady_arm.end_distance));


      if(this.model.type.contactWireConfiguration =="DOUBLE" && this.register_arm != null){

        points.push(V0);

        let V1 = this.subtractVectors(this.steady_arm_fixed_point[1],this.scaleVector(this.steady_arm_dir,this.steady_arm.end_distance));

        points.push(V1);

      }else{

        points.push(V0);

      }

    }

    return points
  }



  getSteadyArmHookEndFittingPoint():{x:number,y:number, z:number}{
    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "SBA" && this.steady_arm.hook_end_fitting != null){

      let length = this.steady_arm.hook_end_fitting.L - this.steady_arm.hook_end_fitting.a

      return this.addVectors(this.intersection_register_arm_fixed_point,this.scaleVector(this.steady_arm_dir,length)); 

    }

    return { x: x0, y:y0  ,z:z0}

  }

  /***********************************************************TDP>2.2 - SINGLE - DOUBLE **********************************************************************************/
  getSteadyArmHookClampPointClamp():{x:number,y:number, z:number}[]{

    const points:{x:number,y:number,z:number}[] = []

    if((this.model.type.configuration == "TDP>2.2" ||  this.model.type.configuration == "CAI") && this.steady_arm.hook_end_clamp != null && this.steady_arm.swivel_clip != null){

      let clamp_vertical_distance = this.steady_arm.hook_end_clamp.H * (1/Math.cos(this.degreesToRadians(this.steady_arm.alpha)));   

      let swivel_clip_intersection_distance = this.steady_arm.swivel_clip.A - clamp_vertical_distance;

      let AngleB = 90 + this.steady_arm.swivel_clip.C;
      let lengthB = this.steady_arm.length;

      let lengthA = swivel_clip_intersection_distance;

      // Convert AngleB to radians for trigonometric calculations
      let AngleB_rad = this.degreesToRadians(AngleB);

      // Calculate AngleA
      let AngleA = Math.asin((lengthA * Math.sin(AngleB_rad)) / lengthB);
      let AngleA_deg = this.radiansToDegress(AngleA); // Convert back to degrees if needed

      // Calculate AngleC
      let AngleC = 180 - AngleA_deg - AngleB;

      let finalAngle = (90 - AngleC) + (this.steady_arm.alpha - this.steady_arm.swivel_clip.C);

      if(this.model.type.configuration == "TDP>2.2"){

        finalAngle = (90 - AngleC) + ((this.steady_arm.alpha*-1) - this.steady_arm.swivel_clip.C);

      }

      let AngleModified = this.model.type.configuration == "TDP>2.2" ? 180 - finalAngle : finalAngle;


      const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

      const cosAlpha = Math.cos(this.degreesToRadians(AngleModified));
      const sinAlpha = Math.sin(this.degreesToRadians(AngleModified));

      // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
      const CwXYDir = {
        x: dirXZ.x * cosAlpha,
        y: sinAlpha,
        z: dirXZ.z * cosAlpha,
      };


      let V0 = this.addVectors(this.steady_arm_points[0],this.scaleVector(CwXYDir,this.steady_arm.length));

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        points.push(V0);

        let V1 = this.addVectors(this.steady_arm_points[1],this.scaleVector(CwXYDir,this.steady_arm.length));

        points.push(V1);

      }else{

        points.push(V0);

      }

    }

    return points;
  }

  getSteadyArmHookClampPoint():{x:number,y:number, z:number}[]{

    if(this.steady_arm_fixed_point.length == 0) return [];

    const points:{x:number,y:number,z:number}[] = []

    if((this.model.type.configuration == "TDP>2.2" ||  this.model.type.configuration == "CAI") && this.steady_arm.hook_end_clamp != null){



      let angleBetweenClampAndTube = this.radiansToDegress(Math.atan(this.steady_arm.hook_end_clamp.Y/this.steady_arm.hook_end_clamp.H)); 
      let lengthBetweenClampAndTube = Math.sqrt( Math.pow(this.steady_arm.hook_end_clamp.Y,2) +  Math.pow(this.steady_arm.hook_end_clamp.H,2) );

      let AngleModified = this.model.type.configuration == "TDP>2.2" ? (90 - angleBetweenClampAndTube + this.steady_arm.alpha) : (90 + angleBetweenClampAndTube + this.steady_arm.alpha);

      const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

      const cosAlpha = Math.cos(this.degreesToRadians(AngleModified));
      const sinAlpha = Math.sin(this.degreesToRadians(AngleModified));

      // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
      const CwXYDir = {
        x: dirXZ.x * cosAlpha,
        y: sinAlpha,
        z: dirXZ.z * cosAlpha,
      };

      let V0 = this.addVectors(this.steady_arm_hook_clamp_point_clamp[0],this.scaleVector(CwXYDir,lengthBetweenClampAndTube));

      if(this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm != null){

        points.push(V0);

        let V1 = this.addVectors(this.steady_arm_hook_clamp_point_clamp[1],this.scaleVector(CwXYDir,lengthBetweenClampAndTube));

        points.push(V1);

      }else{

        points.push(V0);
      }

    }

    return points;

  }

  getSteadyArmIntersectionHookClampPoint():{x:number,y:number,z:number}[]{

    if(this.steady_arm_hook_clamp_point.length == 0) return [];

    const points:{x:number,y:number,z:number}[] = []

    if(this.register_arm && this.steady_arm.hook_end_clamp){

      let angleBetweenClampAndSupport = this.model.type.configuration == "TDP>2.2" ? (270 + this.steady_arm.alpha) : (270 + this.steady_arm.alpha); 

      let extension_rotation = this.model.type.configuration == "TDP>2.2" ?  this.steady_arm.hook_end_clamp.A * Math.tan(this.degreesToRadians(this.steady_arm.alpha + this.register_arm.alpha*-1))*-1 : this.steady_arm.hook_end_clamp.A * Math.tan(this.degreesToRadians(this.steady_arm.alpha + this.register_arm.alpha*-1))


      const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

      const cosAlpha = Math.cos(this.degreesToRadians(angleBetweenClampAndSupport));
      const sinAlpha = Math.sin(this.degreesToRadians(angleBetweenClampAndSupport));

      // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
      const CwXYDir = {
        x: dirXZ.x * cosAlpha,
        y: sinAlpha,
        z: dirXZ.z * cosAlpha,
      };

      let V0 = this.addVectors(this.steady_arm_hook_clamp_point[0],this.scaleVector(CwXYDir,(this.steady_arm.hook_end_clamp.H + extension_rotation)));

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        points.push(V0);

        let V1 = this.addVectors(this.steady_arm_hook_clamp_point[1],this.scaleVector(CwXYDir,(this.steady_arm.hook_end_clamp.H + extension_rotation)));

        points.push(V1);

      }else{

        points.push(V0);

      }

    }

    return points;
  }



  getSteadyArmHookClampFixedPoint():{x:number,y:number,z:number}[]{

    if(this.steady_arm_hook_clamp_intersection_support.length == 0) return [];

    const points:{x:number,y:number,z:number}[] = []

    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.register_arm && this.steady_arm.hook_end_clamp != null){

      let angleModified = this.model.type.configuration == "TDP>2.2" ? (180 + this.register_arm.alpha) : this.register_arm.alpha; 

      const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

      const cosAlpha = Math.cos(this.degreesToRadians(angleModified));
      const sinAlpha = Math.sin(this.degreesToRadians(angleModified));

      // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
      const CwXYDir = {
        x: dirXZ.x * cosAlpha,
        y: sinAlpha,
        z: dirXZ.z * cosAlpha,
      };


      let V0 = this.addVectors(this.steady_arm_hook_clamp_intersection_support[0],this.scaleVector(CwXYDir,this.steady_arm.hook_end_clamp.B));

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        points.push(V0);

        let V1 = this.addVectors(this.steady_arm_hook_clamp_intersection_support[1],this.scaleVector(CwXYDir,this.steady_arm.hook_end_clamp.B));

        points.push(V1)

      }else{

        points.push(V0)

      }


    }

    return points;

  }




  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/
  /*********************************************************END STEADY ARM**************************************************************************/

  /*********************************************************GLOBAL CALCULATIONS **************************************************************************/




  getIntersectionPoint():{x:number, y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "SBA"){

      const P1 = this.bottom_fixed_point;
      const P2 = this.steady_arm_end_point[0];
      const D1 = this.getDirectionVector(this.upper_tube_eye_clamp_fixed_point,P1);
      const D2 = this.steady_arm_dir;

      const r = this.subtractVectors(P1, P2);
      const a = this.dotVectors(D1, D1);
      const b = this.dotVectors(D1, D2);
      const c = this.dotVectors(D2, D2);
      const d = this.dotVectors(D1, r);
      const e = this.dotVectors(D2, r);

      const denom = a*c - b*b;
      if (Math.abs(denom) < 1e-6) {
        throw new Error("Lines are (nearly) parallel—no unique intersection.");
      }

      const t1 = (b*e - c*d) / denom;
      const t2 = (a*e - b*d) / denom;

      const pt1 = this.getPointFromDirection(P1, D1, t1);
      const pt2 = this.getPointFromDirection(P2, D2, t2);

      const dist2 = this.lengthVector(this.subtractVectors(pt1, pt2))**2;
      if (dist2 > 1e-6) {
        console.warn("Skew lines: returning midpoint of closest approach");
      }

      const intersectionPoint = {
        x: 0.5*(pt1.x + pt2.x),
        y: 0.5*(pt1.y + pt2.y),
        z: 0.5*(pt1.z + pt2.z),
      };

      return intersectionPoint;

    }else if((this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI") && this.register_arm != null){

      const P1 = this.bottom_fixed_point;
      const P2 = this.register_arm_bracket_upper_fixed_point;
      const D1 = this.getDirectionVector(this.upper_tube_eye_clamp_fixed_point,P1);
      const D2 = this.register_arm_dir;

      const r = this.subtractVectors(P1, P2);
      const a = this.dotVectors(D1, D1);
      const b = this.dotVectors(D1, D2);
      const c = this.dotVectors(D2, D2);
      const d = this.dotVectors(D1, r);
      const e = this.dotVectors(D2, r);

      const denom = a*c - b*b;
      if (Math.abs(denom) < 1e-6) {
        throw new Error("Lines are (nearly) parallel—no unique intersection.");
      }

      const t1 = (b*e - c*d) / denom;
      const t2 = (a*e - b*d) / denom;

      const pt1 = this.getPointFromDirection(P1, D1, t1);
      const pt2 = this.getPointFromDirection(P2, D2, t2);

      const dist2 = this.lengthVector(this.subtractVectors(pt1, pt2))**2;
      if (dist2 > 1e-6) {
        console.warn("Skew lines: returning midpoint of closest approach");
      }

      const intersectionPoint = {
        x: 0.5*(pt1.x + pt2.x),
        y: 0.5*(pt1.y + pt2.y),
        z: 0.5*(pt1.z + pt2.z),
      };

      return intersectionPoint;

    }

    return { x: x0, y:y0  , z:z0}
  }

  /***********************************************************TDP<2.2 - SINGLE   TDP>2.2  SINGLE AND DOUBLE**********************************************************************************/


  getIntersectionTubeFixedPoint():{start:{x:number,y:number, z:number},end:{x:number,y:number, z:number} }{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA"){

      const P1 = this.intersection_point;
      const D1 = this.bracket_tube_dir;

      const P2 = this.intersection_point;
      const D2 = this.steady_arm_dir;

      const D3 = this.bracket_tube_perp;
      const h  = this.bracket_tube.eye_clamp.h;

      const P2_shift = this.subtractVectors(
        this.steady_arm_end_point[0],
        this.scaleVector(D3, h)
      );

      const r = this.subtractVectors(P1, P2_shift);
      const a = this.dotVectors(D1, D1);  // =1 if D1 unit
      const b = this.dotVectors(D1, D2);
      const c = this.dotVectors(D2, D2);  // =1 if D2 unit
      const d = this.dotVectors(D1, r);
      const e = this.dotVectors(D2, r);

      // 2) solve for t1, t2
      const denom = a*c - b*b;
      if (Math.abs(denom) < 1e-6) {
        throw new Error("Lines are (nearly) parallel—no unique intersection");
      }
      const t1 = (b*e - c*d) / denom;

      const start = this.getPointFromDirection(P1, D1, t1);

      const end = this.addVectors(start, this.scaleVector(D3, h));

      return {start, end};

    }else if((this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI") && this.register_arm != null){

      const P1 = this.intersection_point;
      const D1 = this.bracket_tube_dir;

      const P2 = this.intersection_point;
      const D2 = this.register_arm_dir;

      const D3 = this.bracket_tube_perp;
      const h  = this.bracket_tube.eye_clamp.h;

      const P2_shift = this.subtractVectors(
        this.register_arm_bracket_upper_fixed_point,
        this.scaleVector(D3, h)
      );

      const r = this.subtractVectors(P1, P2_shift);
      const a = this.dotVectors(D1, D1);  // =1 if D1 unit
      const b = this.dotVectors(D1, D2);
      const c = this.dotVectors(D2, D2);  // =1 if D2 unit
      const d = this.dotVectors(D1, r);
      const e = this.dotVectors(D2, r);

      // 2) solve for t1, t2
      const denom = a*c - b*b;
      if (Math.abs(denom) < 1e-6) {
        throw new Error("Lines are (nearly) parallel—no unique intersection");
      }
      const t1 = (b*e - c*d) / denom;

      const start = this.getPointFromDirection(P1, D1, t1);

      const end = this.addVectors(start, this.scaleVector(D3, h));

      return {start, end};

    }

    return {start:{ x: x0, y:y0  ,z:z0},  end: { x: x0, y:y0  ,z:z0} }
  }



  /***************************************************************************************************************************************************/
  /***************************************************************************************************************************************************/

  generateResults():{ name:string, diameter:number, thickness:number, length_tube:number, cut_length:number }[]{
    //Stay Stube
    const dimensions = [
      {
        name:"stay_tube",
        diameter:this.stay_tube.tube.d,
        thickness:this.stay_tube.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.upper_isolator_point,this.upper_tube_end_point), 0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.upper_isolator_point,this.upper_tube_end_point),0) + 10  
      },
      {
        name:"bracket_tube",
        diameter:this.bracket_tube.tube.d,
        thickness:this.bracket_tube.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.bottom_isolator_point,this.upper_eye_clamp_clevis_fixed_point),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.bottom_isolator_point,this.upper_eye_clamp_clevis_fixed_point),0) + 10 
      }
    ]

    if(this.model.type.configuration != "CAI" && this.model.type.configuration != "TDP>2.2"){
      dimensions.push({
        name:"steady_arm",
        diameter:this.steady_arm.tube.d,
        thickness:this.steady_arm.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point[0],this.steady_arm_hook_end_fitting_point),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point[0],this.steady_arm_hook_end_fitting_point),0) + 10 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){
        dimensions.push({
          name:"steady_arm",
          diameter:this.steady_arm.tube.d,
          thickness:this.steady_arm.tube.s,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point[0],this.steady_arm_hook_end_fitting_point),0),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point[0],this.steady_arm_hook_end_fitting_point), 0) + 10 
        })
      }
    }else{

      dimensions.push({
        name:"steady_arm",
        diameter:this.steady_arm.tube.d,
        thickness:this.steady_arm.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_fixed_point[0],this.steady_arm_hook_clamp_point[0]),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_fixed_point[0],this.steady_arm_hook_clamp_point[0]),0) + 10 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){
        dimensions.push({
          name:"steady_arm",
          diameter:this.steady_arm.tube.d,
          thickness:this.steady_arm.tube.s,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_fixed_point[1],this.steady_arm_hook_clamp_point[1]),0),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_fixed_point[1],this.steady_arm_hook_clamp_point[1]),0) + 10 
        })
      }

    }

    if(this.model.type.configuration == "SBA"){
      dimensions.push({
        name:"steel_cable",
        diameter:this.steady_arm.stainless_steel_wire_rope?.d ?? 0,
        thickness:0,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.wire_support_fixed_point_stainless_steel_point),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.wire_support_fixed_point_stainless_steel_point),0) + 10 
      })
    }

    if(this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

      dimensions.push({
        name:"steel_cable",
        diameter:this.register_arm?.stainless_steel_wire_rope?.d ?? 0,
        thickness:0,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.wire_support_fixed_point_stainless_steel_point),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.wire_support_fixed_point_stainless_steel_point),0) + 10 
      })

    }

    if(this.model.type.configuration == "CAI" || this.model.type.configuration == "TDP>2.2"){
      dimensions.push({
        name:"register_arm",
        diameter:this.stay_tube.tube.d,
        thickness:this.stay_tube.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_hook_end_fitting_point,this.getRegisterArmEndPoint()),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_hook_end_fitting_point,this.getRegisterArmEndPoint()),0) + 10
      })
    }

    if(this.reinforcement){
      dimensions.push({
        name:"reinforcement",
        diameter:this.reinforcement.tube.d,
        thickness:this.reinforcement.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.reinforcement_upper_fixed_point,this.reinforcement_bottom_fixed_point),0),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.reinforcement_upper_fixed_point,this.reinforcement_bottom_fixed_point),0) + 10
      })

    }

    return dimensions;
  }

  getCenters():{cantilever_center:{x:number,y:number,z:number}, global_center:{x:number,y:number,z:number}}{
    let cantilever_center = {x:0,y:0,z:0};
    let global_center = {x:0,y:0,z:0};

    cantilever_center.x = this.pv.x/2;

    cantilever_center.y = (this.upper_pole_fixed_point.y - this.bottom_pole_fixed_point.y)/2 + this.bottom_pole_fixed_point.y ;
    cantilever_center.z = this.pv.x*0.7;

    global_center.x = this.pv.x;

    global_center.y = this.upper_pole_fixed_point.y/2;

    global_center.z = this.pv.x*0.5;

    return {cantilever_center, global_center};
  }

  addStayTube():void {

    this.links.push({  
      x1: this.upper_pole_fixed_point.x, 
      y1:this.upper_pole_fixed_point.y, 
      z1:this.upper_pole_fixed_point.z, 
      x2:this.upper_fixed_point.x, 
      y2:this.upper_fixed_point.y, 
      z2:this.upper_fixed_point.z,  
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_100'
    });


    this.links.push({  
      x1:this.upper_fixed_point.x, 
      y1:this.upper_fixed_point.y,
      z1:this.upper_fixed_point.z, 
      x2: this.upper_isolator_point.x,
      y2:this.upper_isolator_point.y,
      z2:this.upper_isolator_point.z, 
      shape: "isolator",
      dimensions:{ width: this.stay_tube.isolator.d, height: this.stay_tube.isolator.d  },
      elementId: 'link_101'
    });

    this.links.push({  
      x1:this.upper_isolator_point.x,
      y1:this.upper_isolator_point.y,
      z1:this.upper_isolator_point.z, 
      x2: this.upper_tube_eye_clamp_tube_fixed_point.x,
      y2:this.upper_tube_eye_clamp_tube_fixed_point.y,
      z2:this.upper_tube_eye_clamp_tube_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_102'
    });


    this.links.push({  
      x1: this.upper_tube_eye_clamp_tube_fixed_point.x,
      y1:this.upper_tube_eye_clamp_tube_fixed_point.y,
      z1:this.upper_tube_eye_clamp_tube_fixed_point.z,  
      x2: this.wire_support_fixed_point.x,
      y2:this.wire_support_fixed_point.y,
      z2:this.wire_support_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_103'
    });

    this.links.push({  
      x1: this.upper_tube_eye_clamp_tube_fixed_point.x,
      y1:this.upper_tube_eye_clamp_tube_fixed_point.y ,
      z1:this.upper_tube_eye_clamp_tube_fixed_point.z,  
      x2: this.upper_tube_eye_clamp_fixed_point.x,
      y2:this.upper_tube_eye_clamp_fixed_point.y,
      z2:this.upper_tube_eye_clamp_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_104'
    });

    this.links.push({  
      x1: this.wire_support_fixed_point.x,
      y1:this.wire_support_fixed_point.y,
      z1:this.wire_support_fixed_point.z,  
      x2: this.upper_tube_end_point.x,
      y2:this.upper_tube_end_point.y,
      z2:this.upper_tube_end_point.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_105'
    });

    this.links.push({  
      x1: this.wire_support_fixed_point.x,
      y1:this.wire_support_fixed_point.y,
      z1:this.wire_support_fixed_point.z,  
      x2: this.wire_support_fixed_point_stainless_steel_point.x,
      y2:this.wire_support_fixed_point_stainless_steel_point.y,
      z2:this.wire_support_fixed_point_stainless_steel_point.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_107'
    });

    this.links.push({  
      x1: this.wire_support_fixed_point_pp_to_mw.x,
      y1:this.wire_support_fixed_point_pp_to_mw.y,
      z1:this.wire_support_fixed_point_pp_to_mw.z,  
      x2: this.mw_axis.x,
      y2:this.mw_axis.y,
      z2:this.mw_axis.z, 
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_106'
    });

  }

  addBracketTube():void {

    this.links.push({  
      x1: this.bottom_pole_fixed_point.x,
      y1:this.bottom_pole_fixed_point.y ,
      z1:this.bottom_pole_fixed_point.z,  
      x2: this.bottom_fixed_point.x,
      y2:this.bottom_fixed_point.y,
      z2:this.bottom_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.bracket_tube.tube.d, height: this.bracket_tube.tube.d  },
      elementId: 'link_96'
    });

    this.links.push({  
      x1: this.upper_eye_clamp_clevis_fixed_point.x,
      y1:this.upper_eye_clamp_clevis_fixed_point.y,
      z1:this.upper_eye_clamp_clevis_fixed_point.z,  
      x2: this.upper_tube_eye_clamp_fixed_point.x,
      y2:this.upper_tube_eye_clamp_fixed_point.y,
      z2:this.upper_tube_eye_clamp_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.bracket_tube.tube.d, height: this.bracket_tube.tube.d  },
      elementId: 'link_97'
    });

    this.links.push({  
      x1: this.bottom_fixed_point.x,
      y1:this.bottom_fixed_point.y,
      z1:this.bottom_fixed_point.z,  
      x2: this.bottom_isolator_point.x,
      y2:this.bottom_isolator_point.y,
      z2:this.bottom_isolator_point.z, 
      shape: "isolator",
      dimensions:{ width: this.bracket_tube.isolator.d, height: this.bracket_tube.isolator.d  },
      elementId: 'link_98'
    });


    this.links.push({  
      x1: this.bottom_isolator_point.x,
      y1:this.bottom_isolator_point.y,
      z1:this.bottom_isolator_point.z,  
      x2: this.upper_eye_clamp_clevis_fixed_point.x,
      y2:this.upper_eye_clamp_clevis_fixed_point.y,
      z2:this.upper_eye_clamp_clevis_fixed_point.z, 
      shape: "circle",
      dimensions:{ width: this.bracket_tube.tube.d, height: this.bracket_tube.tube.d  },
      elementId: 'link_99'
    });
  }

  addSteadyArm():void{

    if(this.model.type.configuration == "SBA" && this.steady_arm.stainless_steel_wire_rope){

      this.links.push({  
        x1: this.steady_arm_fixed_point[0].x, 
        y1:this.steady_arm_fixed_point[0].y , 
        z1:this.steady_arm_fixed_point[0].z,  
        x2: this.steady_arm_points[0].x, 
        y2:this.steady_arm_points[0].y, 
        z2:this.steady_arm_points[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_16'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point[0].x, 
        y1:this.steady_arm_fixed_point[0].y , 
        z1:this.steady_arm_fixed_point[0].z,  
        x2: this.steady_arm_end_point[0].x, 
        y2:this.steady_arm_end_point[0].y, 
        z2:this.steady_arm_end_point[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_17'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point[0].x, 
        y1:this.steady_arm_fixed_point[0].y , 
        z1:this.steady_arm_fixed_point[0].z,  
        x2: this.steady_arm_eye_clamp_point.x, 
        y2:this.steady_arm_eye_clamp_point.y, 
        z2:this.steady_arm_eye_clamp_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_18'
      });

      this.links.push({  
        x1: this.steady_arm_hook_end_fitting_point.x, 
        y1:this.steady_arm_hook_end_fitting_point.y , 
        z1:this.steady_arm_hook_end_fitting_point.z,  
        x2: this.steady_arm_eye_clamp_point.x, 
        y2:this.steady_arm_eye_clamp_point.y, 
        z2:this.steady_arm_eye_clamp_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_19'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_point.x, 
        y1:this.steady_arm_eye_clamp_point.y , 
        z1:this.steady_arm_eye_clamp_point.z,  
        x2: this.steady_arm_eye_clamp_fixed_point.x, 
        y2:this.steady_arm_eye_clamp_fixed_point.y, 
        z2:this.steady_arm_eye_clamp_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_20'
      });

      this.links.push({  
        x1: this.intersection_steady_arm_fixed_point.x, 
        y1:this.intersection_steady_arm_fixed_point.y , 
        z1:this.intersection_steady_arm_fixed_point.z,  
        x2: this.steady_arm_hook_end_fitting_point.x, 
        y2:this.steady_arm_hook_end_fitting_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_21'
      });

      this.links.push({  
        x1: this.intersection_tube_fixed_point.x, 
        y1:this.intersection_tube_fixed_point.y , 
        z1:this.intersection_tube_fixed_point.z,  
        x2: this.intersection_steady_arm_fixed_point.x, 
        y2:this.intersection_steady_arm_fixed_point.y, 
        z2:this.intersection_steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_77'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_fixed_point.x, 
        y1:this.steady_arm_eye_clamp_fixed_point.y , 
        z1:this.steady_arm_eye_clamp_fixed_point.z,  
        x2: this.wire_support_fixed_point_stainless_steel_point.x, 
        y2:this.wire_support_fixed_point_stainless_steel_point.y, 
        z2:this.wire_support_fixed_point_stainless_steel_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.stainless_steel_wire_rope.d, height: this.steady_arm.stainless_steel_wire_rope.d  },
        elementId: 'link_23'
      });

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        this.links.push({  
          x1: this.steady_arm_fixed_point[1].x, 
          y1:this.steady_arm_fixed_point[1].y , 
          z1:this.steady_arm_fixed_point[1].z,  
          x2: this.steady_arm_points[1].x, 
          y2:this.steady_arm_points[1].y, 
          z2:this.steady_arm_points[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_21'
        });
      }

    }else if(this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

      this.links.push({  
        x1: this.steady_arm_y_axis_cw_point[0].x, 
        y1:this.steady_arm_y_axis_cw_point[0].y , 
        z1:this.steady_arm_y_axis_cw_point[0].z,  
        x2: this.steady_arm_points[0].x, 
        y2:this.steady_arm_points[0].y, 
        z2:this.steady_arm_points[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_42'
      });

      this.links.push({  
        x1: this.steady_arm_y_axis_cw_point[0].x, 
        y1:this.steady_arm_y_axis_cw_point[0].y , 
        z1:this.steady_arm_y_axis_cw_point[0].z,  
        x2: this.steady_arm_fixed_point[0].x, 
        y2:this.steady_arm_fixed_point[0].y, 
        z2:this.steady_arm_fixed_point[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_43'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_point[0].x, 
        y1:this.steady_arm_hook_clamp_point[0].y , 
        z1:this.steady_arm_hook_clamp_point[0].z,  
        x2: this.steady_arm_fixed_point[0].x, 
        y2:this.steady_arm_fixed_point[0].y, 
        z2:this.steady_arm_fixed_point[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_44'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_intersection_support[0].x, 
        y1:this.steady_arm_hook_clamp_intersection_support[0].y , 
        z1:this.steady_arm_hook_clamp_intersection_support[0].z,  
        x2: this.steady_arm_hook_clamp_point[0].x, 
        y2:this.steady_arm_hook_clamp_point[0].y, 
        z2:this.steady_arm_hook_clamp_point[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_45'
      });


      this.links.push({  
        x1: this.steady_arm_hook_clamp_intersection_support[0].x, 
        y1:this.steady_arm_hook_clamp_intersection_support[0].y , 
        z1:this.steady_arm_hook_clamp_intersection_support[0].z,  
        x2: this.steady_arm_hook_fixed_point[0].x, 
        y2:this.steady_arm_hook_fixed_point[0].y, 
        z2:this.steady_arm_hook_fixed_point[0].z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_46'
      });

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        this.links.push({  
          x1: this.steady_arm_y_axis_cw_point[1].x, 
          y1:this.steady_arm_y_axis_cw_point[1].y , 
          z1:this.steady_arm_y_axis_cw_point[1].z,  
          x2: this.steady_arm_points[1].x, 
          y2:this.steady_arm_points[1].y, 
          z2:this.steady_arm_points[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_47'
        });

        this.links.push({  
          x1: this.steady_arm_y_axis_cw_point[1].x, 
          y1:this.steady_arm_y_axis_cw_point[1].y , 
          z1:this.steady_arm_y_axis_cw_point[1].z,  
          x2: this.steady_arm_fixed_point[1].x, 
          y2:this.steady_arm_fixed_point[1].y, 
          z2:this.steady_arm_fixed_point[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_48'
        });

        this.links.push({  
          x1: this.steady_arm_hook_clamp_point[1].x, 
          y1:this.steady_arm_hook_clamp_point[1].y , 
          z1:this.steady_arm_hook_clamp_point[1].z,  
          x2: this.steady_arm_fixed_point[1].x, 
          y2:this.steady_arm_fixed_point[1].y, 
          z2:this.steady_arm_fixed_point[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_49'
        });



        this.links.push({  
          x1: this.steady_arm_hook_clamp_intersection_support[1].x, 
          y1:this.steady_arm_hook_clamp_intersection_support[1].y , 
          z1:this.steady_arm_hook_clamp_intersection_support[1].z,  
          x2: this.steady_arm_hook_clamp_point[1].x, 
          y2:this.steady_arm_hook_clamp_point[1].y, 
          z2:this.steady_arm_hook_clamp_point[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_50'
        });

        this.links.push({  
          x1: this.steady_arm_hook_clamp_intersection_support[1].x, 
          y1:this.steady_arm_hook_clamp_intersection_support[1].y , 
          z1:this.steady_arm_hook_clamp_intersection_support[1].z,  
          x2: this.steady_arm_hook_fixed_point[1].x, 
          y2:this.steady_arm_hook_fixed_point[1].y, 
          z2:this.steady_arm_hook_fixed_point[1].z, 
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_51'
        });

      }

    }
  }


  addRegisterArm():void{

    if(!this.register_arm) return;

    if(this.model.type.configuration == "TDP>2.2" ||  this.model.type.configuration == "CAI"){

        if(this.model.type.contactWireConfiguration == "SINGLE"){

          this.links.push({  
            x1: this.register_arm_bracket_bottom_point[0].x, 
            y1:this.register_arm_bracket_bottom_point[0].y,
            z1:this.register_arm_bracket_bottom_point[0].z,
            x2: this.steady_arm_hook_fixed_point[0].x,
            y2:this.steady_arm_hook_fixed_point[0].y,
            z2:this.steady_arm_hook_fixed_point[0].z,
            shape: "circle",
            dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
            elementId: 'link_66'
          });

        }else{

          this.links.push({  
            x1: this.register_arm_bracket_bottom_point[1].x, 
            y1:this.register_arm_bracket_bottom_point[1].y,
            z1:this.register_arm_bracket_bottom_point[1].z,
            x2: this.steady_arm_hook_fixed_point[0].x,
            y2:this.steady_arm_hook_fixed_point[0].y,
            z2:this.steady_arm_hook_fixed_point[0].z,
            shape: "circle",
            dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
            elementId: 'link_67'
          });

          this.links.push({  
            x1: this.register_arm_bracket_bottom_point[2].x, 
            y1:this.register_arm_bracket_bottom_point[2].y,
            z1:this.register_arm_bracket_bottom_point[2].z,
            x2: this.steady_arm_hook_fixed_point[1].x,
            y2:this.steady_arm_hook_fixed_point[1].y,
            z2:this.steady_arm_hook_fixed_point[1].z,
            shape: "circle",
            dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
            elementId: 'link_68'
          });

          this.links.push({  
            x1: this.register_arm_bracket_bottom_point[1].x, 
            y1:this.register_arm_bracket_bottom_point[1].y,
            z1:this.register_arm_bracket_bottom_point[1].z,
            x2: this.register_arm_bracket_bottom_point[2].x,
            y2:this.register_arm_bracket_bottom_point[2].y,
            z2:this.register_arm_bracket_bottom_point[2].z,
            shape: "circle",
            dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
            elementId: 'link_69'
          });

        }

        this.links.push({  
          x1: this.register_arm_bracket_bottom_point[0].x, 
          y1:this.register_arm_bracket_bottom_point[0].y,
          z1:this.register_arm_bracket_bottom_point[0].z,
          x2: this.register_arm_bracket_upper_fixed_point.x,
          y2:this.register_arm_bracket_upper_fixed_point.y,
          z2:this.register_arm_bracket_upper_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
          elementId: 'link_70'
        });

        this.links.push({  
          x1: this.register_arm_bracket_upper_fixed_point.x, 
          y1:this.register_arm_bracket_upper_fixed_point.y , 
          z1:this.register_arm_bracket_upper_fixed_point.z,
          x2: this.register_arm_eye_clamp_point.x,
          y2:this.register_arm_eye_clamp_point.y,
          z2:this.register_arm_eye_clamp_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_71'
        });

        this.links.push({  
          x1: this.getRegisterArmEndPoint().x, 
          y1:this.getRegisterArmEndPoint().y , 
          z1:this.getRegisterArmEndPoint().z,  
          x2: this.register_arm_eye_clamp_point.x,
          y2:this.register_arm_eye_clamp_point.y,
          z2:this.register_arm_eye_clamp_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_72'
        });

        this.links.push({  
          x1: this.register_arm_eye_clamp_fixed_point.x,
          y1:this.register_arm_eye_clamp_fixed_point.y,
          z1:this.register_arm_eye_clamp_fixed_point.z,
          x2: this.register_arm_eye_clamp_point.x,
          y2:this.register_arm_eye_clamp_point.y,
          z2:this.register_arm_eye_clamp_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_73'
        });

        this.links.push({  
          x1: this.register_arm_eye_clamp_fixed_point.x, 
          y1:this.register_arm_eye_clamp_fixed_point.y,
          z1:this.register_arm_eye_clamp_fixed_point.z,
          x2: this.wire_support_fixed_point_stainless_steel_point.x,
          y2:this.wire_support_fixed_point_stainless_steel_point.y,
          z2:this.wire_support_fixed_point_stainless_steel_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.stainless_steel_wire_rope.d, height: this.register_arm.stainless_steel_wire_rope.d  },
            elementId: 'link_74'
        });

        this.links.push({  
          x1: this.register_arm_bracket_upper_fixed_point.x,
          y1:this.register_arm_bracket_upper_fixed_point.y,
          z1:this.register_arm_bracket_upper_fixed_point.z,
          x2: this.register_arm_hook_end_fitting_point.x,
          y2:this.register_arm_hook_end_fitting_point.y,
          z2:this.register_arm_hook_end_fitting_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_75'
        });

        this.links.push({  
          x1: this.register_arm_hook_end_fitting_point.x,
          y1:this.register_arm_hook_end_fitting_point.y,
          z1:this.register_arm_hook_end_fitting_point.z,
          x2: this.intersection_register_arm_fixed_point.x,
          y2:this.intersection_register_arm_fixed_point.y,
          z2:this.intersection_register_arm_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_76'
        });

        this.links.push({  
          x1: this.intersection_tube_fixed_point.x,
          y1:this.intersection_tube_fixed_point.y,
          z1:this.intersection_tube_fixed_point.z,
          x2: this.intersection_register_arm_fixed_point.x,
          y2:this.intersection_register_arm_fixed_point.y,
          z2:this.intersection_register_arm_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
            elementId: 'link_77'
        });
    }
  }

  addReinforcement():void{
    if(!this.reinforcement) return;

    this.links.push({  
      x1: this.reinforcement_upper_eye_clamp_point.x, 
      y1:this.reinforcement_upper_eye_clamp_point.y,
      z1:this.reinforcement_upper_eye_clamp_point.z,
      x2: this.reinforcement_upper_hook_end_point.x,
      y2:this.reinforcement_upper_hook_end_point.y,
      z2:this.reinforcement_upper_hook_end_point.z,
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_150'
    });

    this.links.push({  
      x1: this.reinforcement_bottom_eye_clamp_point.x, 
      y1:this.reinforcement_bottom_eye_clamp_point.y,
      z1:this.reinforcement_bottom_eye_clamp_point.z,
      x2: this.reinforcement_bottom_hook_end_point.x,
      y2:this.reinforcement_bottom_hook_end_point.y,
      z2:this.reinforcement_bottom_hook_end_point.z,
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_151'
    });

    this.links.push({  
      x1: this.reinforcement_upper_hook_end_point.x, 
      y1:this.reinforcement_upper_hook_end_point.y,
      z1:this.reinforcement_upper_hook_end_point.z,
      x2: this.reinforcement_upper_fixed_point.x,
      y2:this.reinforcement_upper_fixed_point.y,
      z2:this.reinforcement_upper_fixed_point.z,
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_152'
    });

    this.links.push({  
      x1: this.reinforcement_bottom_fixed_point.x, 
      y1:this.reinforcement_bottom_fixed_point.y,
      z1:this.reinforcement_bottom_fixed_point.z,
      x2: this.reinforcement_bottom_hook_end_point.x,
      y2:this.reinforcement_bottom_hook_end_point.y,
      z2:this.reinforcement_bottom_hook_end_point.z,
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_153'
    });

    this.links.push({  
      x1: this.reinforcement_upper_fixed_point.x, 
      y1:this.reinforcement_upper_fixed_point.y,
      z1:this.reinforcement_upper_fixed_point.z,
      x2: this.reinforcement_bottom_fixed_point.x,
      y2:this.reinforcement_bottom_fixed_point.y,
      z2:this.reinforcement_bottom_fixed_point.z,
      shape: "circle",
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
      elementId: 'link_154'
    });

  }

  generateLinks():CantileverLink[]{
    //upper links
    this.addStayTube();

    //bottom links
    this.addBracketTube();

    //steady arm
    this.addSteadyArm();

    //register arm
    this.addRegisterArm();

    this.addReinforcement();

    return this.links;
  }

  generateDimensions():Dimensions[]{
    //Stay Tube
    this.dimensions.push({  
      start:{
        x:this.upper_isolator_point.x,
        y:this.upper_isolator_point.y,
        z:this.upper_isolator_point.z
      },
      end:{
        x:this.upper_tube_end_point.x,
        y:this.upper_tube_end_point.y,
        z:this.upper_tube_end_point.z
      },
      groupId:"stay_tube",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-350
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({  
      start:{
        x:this.wire_support_fixed_point.x,
        y:this.wire_support_fixed_point.y,
        z:this.wire_support_fixed_point.z
      },
      end:{
        x:this.upper_tube_end_point.x,
        y:this.upper_tube_end_point.y,
        z:this.upper_tube_end_point.z
      },
      groupId:"stay_tube_end",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-200
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({  
      start:{
        x:this.wire_support_fixed_point.x,
        y:this.wire_support_fixed_point.y,
        z:this.wire_support_fixed_point.z
      },
      end:{
        x:this.upper_tube_eye_clamp_tube_fixed_point.x,
        y:this.upper_tube_eye_clamp_tube_fixed_point.y,
        z:this.upper_tube_eye_clamp_tube_fixed_point.z
      },
      groupId:"stay_tube_eye_clamp_distance",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:200
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    //Bracket Tube
    this.dimensions.push({  
      start:{
        x:this.bottom_isolator_point.x,
        y:this.bottom_isolator_point.y,
        z:this.bottom_isolator_point.z
      },
      end:{
        x:this.upper_eye_clamp_clevis_fixed_point.x,
        y:this.upper_eye_clamp_clevis_fixed_point.y,
        z:this.upper_eye_clamp_clevis_fixed_point.z
      },
      groupId:"bracket_tube",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-300
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:100
        }
      }
    });

    this.dimensions.push({  
      start:{
        x:this.bottom_fixed_point.x,
        y:this.bottom_fixed_point.y,
        z:this.bottom_fixed_point.z
      },
      end:{
        x:this.intersection_tube_fixed_point.x,
        y:this.intersection_tube_fixed_point.y,
        z:this.intersection_tube_fixed_point.z
      },
      groupId:"bracket_tube_eye_clamp",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: -150 
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:100
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.bottom_fixed_point.x + 100,
        y:this.bottom_fixed_point.y,
        z:this.bottom_fixed_point.z
      },
      end:{
        x:this.bottom_fixed_point.x + 100,
        y:this.cw_axis.y,
        z:this.bottom_fixed_point.z
      },
      groupId:"contact_wire_gap",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:350
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.pv.x,
        y:this.pv.y,
        z:this.pv.z
      },
      end:{
        x:this.via_axis.x,
        y:this.via_axis.y,
        z:this.via_axis.z
      },
      groupId:"contact_wire_height",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:this.getCenters().cantilever_center.x + 400
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.support_offset + this.poleModel.measures.width/2,
        y:this.pv.y,
        z:this.pv.z
      },
      end:{
        x:this.pv.x - (this.track.gauge/2 + this.track.skate.hw),
        y:this.pv.y,
        z:this.pv.z
      },
      groupId:"pole_skate",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: -200
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:0,
        y:0,
        z:this.pv.z
      },
      end:{
        x:this.pv.x,
        y:this.pv.y,
        z:this.pv.z
      },
      groupId:"pv",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: 800
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.cw_axis.x,
        y:this.cw_axis.y,
        z:this.cw_axis.z
      },
      end:{
        x:this.mw_axis.x,
        y:this.mw_axis.y,
        z:this.mw_axis.z
      },
      groupId:"system_height",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: this.model.type.configuration != "CAI" ? 500 : 150 + (this.getRegisterArmEndPoint().x -  this.cw_axis.x)
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.pv.x - (this.track.gauge/2 + this.track.skate.hw),
        y:0,
        z:this.pv.z
      },
      end:{
        x:this.pv.x - (this.track.gauge/2 + this.track.skate.hw),
        y:this.u,
        z:this.pv.z
      },
      groupId:"track_elevation",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-150
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    this.dimensions.push({
      start:{
        x:this.cw_axis.x,
        y:this.cw_axis.y,
        z:this.cw_axis.z
      },
      end:{
        x:this.via_axis.x,
        y:this.via_axis.y + this.contact_wire_vertical_offset,
        z:this.via_axis.z
      },
      groupId:"zig_zag",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-150
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    //if(this.model.type.configuration == "SBA" || this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

    if(this.model.type.configuration == "SBA"){

      this.dimensions.push({  
        start:{
          x:this.steady_arm_hook_end_fitting_point.x,
          y:this.steady_arm_hook_end_fitting_point.y,
          z:this.steady_arm_hook_end_fitting_point.z
        },
        end:{
          x:this.steady_arm_end_point[0].x,
          y:this.steady_arm_end_point[0].y,
          z:this.steady_arm_end_point[0].z
        },
        groupId:"steady_arm",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-300
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });
      this.dimensions.push({  
        start:{
          x:this.steady_arm_fixed_point[0].x,
          y:this.steady_arm_fixed_point[0].y,
          z:this.steady_arm_fixed_point[0].z
        },
        end:{
          x:this.steady_arm_end_point[0].x,
          y:this.steady_arm_end_point[0].y,
          z:this.steady_arm_end_point[0].z
        },
        groupId:"steady_arm",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-150
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      this.dimensions.push({  
        start:{
          x:this.steady_arm_hook_end_fitting_point.x,
          y:this.steady_arm_hook_end_fitting_point.y,
          z:this.steady_arm_hook_end_fitting_point.z
        },
        end:{
          x:this.steady_arm_fixed_point[0].x,
          y:this.steady_arm_fixed_point[0].y,
          z:this.steady_arm_fixed_point[0].z
        },
        groupId:"steady_arm_end",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-150
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });


    }

    if(this.model.type.configuration == "SBA"){
      this.dimensions.push({  
        start:{
          x:this.steady_arm_eye_clamp_fixed_point.x,
          y:this.steady_arm_eye_clamp_fixed_point.y,
          z:this.steady_arm_eye_clamp_fixed_point.z
        },
        end:{
          x:this.wire_support_fixed_point_stainless_steel_point.x,
          y:this.wire_support_fixed_point_stainless_steel_point.y,
          z:this.wire_support_fixed_point_stainless_steel_point.z
        },
        groupId:"stainless_steel",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:-200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });
    }

    if(this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

      this.dimensions.push({  
        start:{
          x:this.register_arm_eye_clamp_fixed_point.x,
          y:this.register_arm_eye_clamp_fixed_point.y,
          z:this.register_arm_eye_clamp_fixed_point.z
        },
        end:{
          x:this.wire_support_fixed_point_stainless_steel_point.x,
          y:this.wire_support_fixed_point_stainless_steel_point.y,
          z:this.wire_support_fixed_point_stainless_steel_point.z
        },
        groupId:"stainless_steel",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });
      

      this.dimensions.push({  
        start:{
          x:this.register_arm_hook_end_fitting_point.x,
          y:this.register_arm_hook_end_fitting_point.y,
          z:this.register_arm_hook_end_fitting_point.z
        },
        end:{
          x:this.getRegisterArmEndPoint().x,
          y:this.getRegisterArmEndPoint().y,
          z:this.getRegisterArmEndPoint().z
        },
        groupId:"register_arm",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: -200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      if(this.model.type.configuration == "TDP>2.2"){
          this.dimensions.push({  
            start:{
              x:this.register_arm_eye_clamp_point.x,
              y:this.register_arm_eye_clamp_point.y,
              z:this.register_arm_eye_clamp_point.z
            },
            end:{
              x:this.getRegisterArmEndPoint().x,
              y:this.getRegisterArmEndPoint().y,
              z:this.getRegisterArmEndPoint().z
            },
            groupId:"register_arm_eye_clamp",
            line:{
              arrows:{
                arrowHeight:40,
                arrowRadius:15,
                arrowSegments:16
              },
              radius:6,
              offset:{
                orientation:{ x:0,y:0,z:1 },
                distance: -150
              }
            },
            text:{
              size:48,
              height:4,
              offset:{
                orientation:{ x:0,y:1,z:0 },
                distance:50
              }
            }
          });
      }else{

          this.dimensions.push({  
            start:{
              x:this.register_arm_eye_clamp_point.x,
              y:this.register_arm_eye_clamp_point.y,
              z:this.register_arm_eye_clamp_point.z
            },
            end:{
              x:this.register_arm_bracket_upper_fixed_point.x,
              y:this.register_arm_bracket_upper_fixed_point.y,
              z:this.register_arm_bracket_upper_fixed_point.z
            },
            groupId:"register_arm_eye_clamp",
            line:{
              arrows:{
                arrowHeight:40,
                arrowRadius:15,
                arrowSegments:16
              },
              radius:6,
              offset:{
                orientation:{ x:0,y:0,z:1 },
                distance: -50
              }
            },
            text:{
              size:48,
              height:4,
              offset:{
                orientation:{ x:0,y:1,z:0 },
                distance:50
              }
            }
          });

      }


      this.dimensions.push({  
        start:{
          x:this.register_arm_bracket_upper_fixed_point.x,
          y:this.register_arm_bracket_upper_fixed_point.y,
          z:this.register_arm_bracket_upper_fixed_point.z
        },
        end:{
          x:this.getRegisterArmEndPoint().x,
          y:this.getRegisterArmEndPoint().y,
          z:this.getRegisterArmEndPoint().z
        },
        groupId:"register_arm_end",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: -100
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      this.dimensions.push({  
        start:{
          x:this.steady_arm_points[0].x,
          y:this.steady_arm_points[0].y,
          z:this.steady_arm_points[0].z
        },
        end:{
          x:this.steady_arm_hook_clamp_point_clamp[0].x,
          y:this.steady_arm_hook_clamp_point_clamp[0].y,
          z:this.steady_arm_hook_clamp_point_clamp[0].z
        },
        groupId:"steady_arm",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: this.model.type.configuration == "TDP>2.2" ?  -200 : 200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      this.dimensions.push({  
        start:{
          x:this.steady_arm_end_point[0].x,
          y:this.steady_arm_end_point[0].y,
          z:this.steady_arm_end_point[0].z
        },
        end:{
          x:this.steady_arm_fixed_point[0].x,
          y:this.steady_arm_fixed_point[0].y,
          z:this.steady_arm_fixed_point[0].z
        },
        groupId:"steady_arm_end",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: this.model.type.configuration == "TDP>2.2" ?  -200 : 200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

    }

    if(this.reinforcement){

      this.dimensions.push({  
        start:{
          x:this.reinforcement_upper_fixed_point.x,
          y:this.reinforcement_upper_fixed_point.y,
          z:this.reinforcement_upper_fixed_point.z
        },
        end:{
          x:this.reinforcement_bottom_fixed_point.x,
          y:this.reinforcement_bottom_fixed_point.y,
          z:this.reinforcement_bottom_fixed_point.z
        },
        groupId:"reinforcement",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: 200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      this.dimensions.push({  
        start:{
          x:this.upper_isolator_point.x,
          y:this.upper_isolator_point.y,
          z:this.upper_isolator_point.z
        },
        end:{
          x:this.reinforcement_upper_eye_clamp_point.x,
          y:this.reinforcement_upper_eye_clamp_point.y,
          z:this.reinforcement_upper_eye_clamp_point.z
        },
        groupId:"reinforcement_upper_point",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: 200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

      this.dimensions.push({  
        start:{
          x:this.reinforcement_bottom_eye_clamp_point.x,
          y:this.reinforcement_bottom_eye_clamp_point.y,
          z:this.reinforcement_bottom_eye_clamp_point.z
        },
        end:{
          x:this.intersection_tube_fixed_point.x,
          y:this.intersection_tube_fixed_point.y,
          z:this.intersection_tube_fixed_point.z
        },
        groupId:"reinforcement_bottom_point",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance: 200
          }
        },
        text:{
          size:48,
          height:4,
          offset:{
            orientation:{ x:0,y:1,z:0 },
            distance:50
          }
        }
      });

    }

    this.dimensions.push({  
      start:{
        x:this.cw_axis.x,
        y:this.cw_axis.y - this.contact_wire_vertical_offset,
        z:this.cw_axis.z
      },
      end:{
        x:this.cw_axis.x,
        y:this.cw_axis.y,
        z:this.cw_axis.z
      },
      groupId:"contact_wire_vertical_offset",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: 200
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    });

    return this.dimensions;
  }

  generatePoints(): {x: number, y: number, z: number}[] {
    let pointsSet = new Set<string>(); // To store unique points as strings
    let points: {x: number, y: number, z: number}[] = [];

    // Iterate through each link and add both points (x1, y1, z1) and (x2, y2, z2) to the set
    
    this.steady_arm_points.forEach(cw => {
        const point = `${cw.x},${cw.y},${cw.z}`;
        pointsSet.add(point); // Add the starting point of the link
    });

    this.stay_tube_points.forEach(mw => {
        const point = `${mw.x},${mw.y},${mw.z}`;
        pointsSet.add(point); // Add the starting point of the link
    });

    // Convert the set of unique points back into an array of objects {x, y, z}
    pointsSet.forEach(pointStr => {
      const [x, y, z] = pointStr.split(',').map(Number); // Split the string and convert to numbers
      points.push({x, y, z});
    });

    return points;
  }


  // Override the serialize method to include CantileverGerman-specific properties.
  serialize(): string {
    return JSON.stringify({
      contact_wire_height: this.contact_wire_height,
      system_height: this.system_height,
      zig_zag:this.zig_zag,
    });
  }

  // Deserialize data specifically for CantileverGerman.
  static deserialize(data: CantileverBrazilianParams, pole:PolePropertiesParams|null, pov:'local'|'global'): CantileverBrazilian {
    return new CantileverBrazilian(
      data.model,
      data.poleModel,
      data.esc,
      data.contact_wire_vertical_offset,
      data.contact_wire_height,
      data.bottom_fixed_height,
      data.fixing_distance,
      data.system_height,
      data.zig_zag,
      data.track,
      data.pantograph,
      data.support_offset,
      data.u,
      data.curve_radius_direction,
      data.pv,
      data.stay_tube,
      data.bracket_tube,
      data.register_arm,
      data.steady_arm,
      data.reinforcement,
      pole,
      pov,
    );
  }
}

export default CantileverBrazilian;
