import { Cantilever } from "./Cantilever.server";

// Define a subclass CantileverGerman, inheriting from Cantilever.
class CantileverGerman extends Cantilever {
  // Additional property specific to CantileverGerman.
  public stay_tube:{
    alpha:number;
    tube:SteelTube;
    isolator:Isolator;
    mw_support:{
      wireSupport:WireSupport,
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
    swivel_clip:SwivelClip;
    eye_clamp:EyeClamp|null;
  };
  public links:CantileverLink[];
  public dimensions:Dimensions[];
  // Constructor to initialize the CantileverGerman properties.
  
  //Internal Fields
  //bracket tube
  private bottom_pole_fixed_point: {x:number, y:number, z:number};
  private bottom_fixed_point:{ x:number, y:number, z:number};
  private inferior_tube_angle: {angle:number};
  private bottom_isolator_point: { x:number, y:number, z:number};
  private upper_eye_clamp_clevis_fixed_point: { x:number, y:number, z:number};
  private upper_eye_clamp_clevis_stainless_stell_point: { x:number, y:number, z:number};

  //stay tube
  private wire_support_fixed_point: {x:number, y:number, z:number};
  private upper_pole_fixed_point: { x:number, y:number, z:number};
  private upper_fixed_point: { x:number, y:number, z:number};
  private upper_tube_eye_clamp_tube_fixed_point: { x:number, y:number, z:number};
  private upper_tube_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private upper_tube_end_point: { x:number, y:number, z:number};
  private upper_isolator_point: { x:number, y:number, z:number};

  //registe arm
  private register_arm_bracket_bottom_point: { x:number, y:number, z:number};
  private register_arm_bracket_upper_point: { x:number, y:number, z:number};
  private register_arm_bracket_upper_fixed_point: { x:number, y:number, z:number};
  private register_arm_eye_clamp_point: { x:number, y:number, z:number};
  private register_arm_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private register_arm_hook_end_fitting_point: { x:number, y:number, z:number};

  //steady arm
  private steady_arm_fixed_point: { x:number, y:number, z:number};
  private steady_arm_eye_clamp_point: { x:number, y:number, z:number};
  private steady_arm_eye_clamp_fixed_point: { x:number, y:number, z:number};
  private steady_arm_end_point: { x:number, y:number, z:number};
  private steady_arm_hook_clamp_point: { x:number, y:number, z:number};
  private steady_arm_hook_fixed_point: { x:number, y:number, z:number};
  private intersection_steady_arm_fixed_point: { x:number, y:number, z:number};
  private steady_arm_hook_end_fitting_point: { x:number, y:number, z:number};


  //calculations
  private intersection_point: { x:number, y:number, z:number};
  private intersection_tube_fixed_point: { x:number, y:number, z:number};
  private intersection_register_arm_fixed_point: { x:number, y:number, z:number};

  constructor(
    model:ModelInterface,
    poleModel:PoleModelInterface,
    esc:number,
    contact_wire_height: number,
    bottom_fixed_height:number,
    fixing_distance:number,
    system_height: number,
    zig_zag:number,
    track:Track,
    pantograph:Pantrograph,
    support_offset:number,
    u:number,
    pv:{ x:number, y:number, z:number },
    stay_tube:{
      alpha:number;
      tube:SteelTube;
      isolator:Isolator;
      mw_support:{
        wireSupport:WireSupport,
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
      swivel_clip:SwivelClip;
      eye_clamp:EyeClamp|null;
    }




  ) {
    // Call the parent constructbior to initialize inherited properties.
    super(
      poleModel,
      esc,
      system_height,
      contact_wire_height, 
      bottom_fixed_height,
      fixing_distance,
      zig_zag, 
      track,
      pantograph,
      support_offset,
      u,
      pv ,
      model
    );
    this.stay_tube = stay_tube;
    this.bracket_tube = bracket_tube;
    this.register_arm = register_arm;
    this.steady_arm = steady_arm;
    this.links = [];
    this.dimensions = [];


    //initialize this values to eliminate recursive calls
    //Bracket Tube
    this.bottom_pole_fixed_point =  this.getBottomPoleFixedPoint();
    this.bottom_fixed_point =  this.getBottomFixedPoint();

     //Stay Tube
    this.upper_pole_fixed_point = this.getUpperPoleFixedPoint();
    this.upper_fixed_point =  this.getUpperFixedPoint();
    this.stay_tube.alpha = this.getAngleOfStayTube();
    this.wire_support_fixed_point = this.getWireSupportFixedPoint();
    this.upper_tube_eye_clamp_tube_fixed_point  = this.getUpperTubeEyeClampTubeFixedPoint();
    this.upper_tube_eye_clamp_fixed_point = this.getUpperTubeEyeClampFixedPoint();
    this.upper_tube_end_point = this.getUpperTubeEndPoint();
    this.upper_isolator_point = this.getUpperIsolatorPoint();
    //end stay stube

    //Bracket Tube
    this.inferior_tube_angle = this.getInferiorTubeAngle();
    this.bottom_isolator_point = this.getBottomIsolatorPoint();
    this.upper_eye_clamp_clevis_fixed_point = this.getUpperEyeClampClevisFixedPoint();
    this.upper_eye_clamp_clevis_stainless_stell_point = this.getUpperEyeClampClevisStainlesStellPoint();

    //steady arm
    this.steady_arm_fixed_point = this.getSteadyArmFixedPoint();
    this.steady_arm_eye_clamp_point = this.getSteadyArmEyeClampPoint();
    this.steady_arm_eye_clamp_fixed_point = this.getSteadyArmEyeClampFixedPoint();
    this.steady_arm_end_point = this.getSteadyArmEndPoint();
    this.steady_arm_hook_clamp_point = this.getSteadyArmHookClampPoint();
    this.steady_arm_hook_fixed_point = this.getSteadyArmHookClampFixedPoint();

    // register Arm
    this.register_arm_bracket_bottom_point = this.getRegisterArmDropperBracketBottomPoint();
    this.register_arm_bracket_upper_point = this.getRegisterArmDropperBracketUpperPoint();
    this.register_arm_bracket_upper_fixed_point = this.getRegisterArmDropperBracketUpperFixedPoint();
    this.register_arm_eye_clamp_point = this.getRegisterArmEyeClampPoint();
    this.register_arm_eye_clamp_fixed_point = this.getRegisterArmEyeClampFixedPoint();
  
    //global calculations
    this.intersection_point = this.getIntersectionPoint();
    this.intersection_tube_fixed_point = this.getIntersectionTubeFixedPoint();
    this.intersection_register_arm_fixed_point = this.getIntersectionRegisterArmFixedPoint();
    this.intersection_steady_arm_fixed_point = this.getIntersectionSteadyArmFixedPoint();

    // register Arm
    this.register_arm_hook_end_fitting_point =  this.getRegisterArmHookEndFittingPoint();
    //steady Arm
    this.steady_arm_hook_end_fitting_point = this.getSteadyArmHookEndFittingPoint();

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

  getAngleOfStayTube():number {

    let upper_angle = this.radiansToDegress(Math.acos(this.getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint() / this.getDistanceBewteenUpperFixedPointAndMw()));
    let complete_angle = this.getAngleBetweenTwoPoints(this.mw_axis,this.upper_fixed_point);

    let stay_tube_angle = complete_angle - upper_angle;

    return Number(stay_tube_angle.toFixed(2));

  }

  getDistanceBewteenUpperFixedPointAndMw():number {

    return this.getDistanceBetweenTwoPoints(this.mw_axis,this.upper_fixed_point);
  }

  getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint():number {


    return Math.sqrt( Math.pow(this.getDistanceBewteenUpperFixedPointAndMw(),2) - Math.pow(this.stay_tube.mw_support.wireSupport.h,2));
  }

  getWireSupportFixedPoint():{x:number, y:number, z:number} {

     let x_axis = this.upper_fixed_point.x + this.getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint() * Math.cos(this.degreesToRadians(this.stay_tube.alpha));

     let y_axis = this.upper_fixed_point.y + this.getDistanceBetweenUpperFixedPointAndWireSupportFixedPoint() * Math.sin(this.degreesToRadians(this.stay_tube.alpha));

     let z_axis = this.pv.z;

    //let x_axis = this.getWireSupportDistanceFromFixedPoint() * Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha)) + this.getSwivelClevisUtilLength(this.stay_tube.swivel_bracket,this.stay_tube.swivel_clevis); 

    //let y_axis =  this.mw_axis.y - (1/Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha)))*this.stay_tube.mw_support.wireSupport.h;

    return { x: x_axis, y:y_axis ,z : z_axis}
  }


  getUpperTubeEndPoint():{x:number, y:number, z:number}{
    let x_axis =  this.wire_support_fixed_point.x + this.stay_tube.mw_support.end_distance* Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha));

    let y_axis =  this.wire_support_fixed_point.y + this.stay_tube.mw_support.end_distance* Math.sin(this.degreesToRadians(360 + this.stay_tube.alpha));

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis, z:z_axis  }
  }


  getUpperTubeEyeClampTubeFixedPoint():{x:number,y:number, z:number}{
    let x_axis =  this.wire_support_fixed_point.x - this.stay_tube.mw_support.eye_clamp_distance* Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha));

    let y_axis =  this.wire_support_fixed_point.y - this.stay_tube.mw_support.eye_clamp_distance* Math.sin(this.degreesToRadians(360 + this.stay_tube.alpha));

    let z_axis =  this.pv.z

    return { x: x_axis, y:y_axis , z: z_axis}
  }


  getUpperIsolatorPoint():{x:number, y:number, z:number}{
    let x_axis =  this.upper_fixed_point.x + this.getIsolatorUtilLength(this.stay_tube.isolator) * Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha));

    let y_axis =  this.upper_fixed_point.y + this.getIsolatorUtilLength(this.stay_tube.isolator) * Math.sin(this.degreesToRadians(360 + this.stay_tube.alpha));

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis, z:z_axis  }

  }

  getUpperFixedPoint():{x:number,y:number, z:number}{
    let x_axis = this.upper_pole_fixed_point.x + this.getSwivelClevisUtilLength(this.stay_tube.swivel_bracket,this.stay_tube.swivel_clevis); //this.wire_support_fixed_point.x - this.getWireSupportDistanceFromFixedPoint() * Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha));

    let y_axis = this.upper_pole_fixed_point.y; //this.wire_support_fixed_point.y - this.getWireSupportDistanceFromFixedPoint() * Math.sin(this.degreesToRadians(360 + this.stay_tube.alpha));

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis , z: z_axis  }
  }


  getUpperPoleFixedPoint():{x:number,y:number, z:number}{
    let x_axis =  this.bottom_pole_fixed_point.x; //this.upper_fixed_point.x - this.stay_tube.swivel_clevis.pin_eye - this.stay_tube.swivel_bracket.x_pin;

    let y_axis =  this.bottom_pole_fixed_point.y + this.fixing_distance;//this.upper_fixed_point.y;

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis , z:z_axis  }
  }

  getUpperTubeEyeClampFixedPoint():{x:number, y:number, z:number}{
    let x_axis =  this.upper_tube_eye_clamp_tube_fixed_point.x + this.stay_tube.eye_clamp.h * Math.sin(this.degreesToRadians(360 + this.stay_tube.alpha));

    let y_axis =  this.upper_tube_eye_clamp_tube_fixed_point.y - this.stay_tube.eye_clamp.h * Math.cos(this.degreesToRadians(360 + this.stay_tube.alpha)); 

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis, z: z_axis }
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

      let adjustedAngle = this.degreesToRadians(360 - (90 - this.radiansToDegress(this.inferior_tube_angle.angle) ));

      x0 =  this.upper_eye_clamp_clevis_fixed_point.x + this.bracket_tube.clevis_end_fitting.hook_x_distance * Math.cos(adjustedAngle);

      y0 =  this.upper_eye_clamp_clevis_fixed_point.y + this.bracket_tube.clevis_end_fitting.hook_x_distance * Math.sin(adjustedAngle); 

      z0 = this.pv.z;

    }

    return { x: x0, y:y0, z:z0  }
  }



  /***********************************************************TDP<2.2 - SBA - SINGLE - DOUBLE **********************************************************************************/


  getBottomPoleFixedPoint():{x:number,y:number, z:number}{
    let x_axis =  this.support_offset;//this.upper_pole_fixed_point.x;

    let y_axis =  this.bottom_fixed_height; //this.upper_pole_fixed_point.y -  Math.tan(this.degreesToRadians(360 + this.stay_tube.alpha))*this.mw_axis.x  - this.system_height - 50;

    let z_axis =  this.pv.z;

    return { x: x_axis, y:y_axis, z:z_axis  }
  }

  getBottomFixedPoint():{x:number,y:number, z:number}{
    let x_axis =  this.bottom_pole_fixed_point.x + this.bracket_tube.swivel_clevis.pin_eye + this.bracket_tube.swivel_bracket.x_pin;

    let y_axis =  this.bottom_pole_fixed_point.y;

    let z_axis =  this.pv.z;

    return { x: x_axis, y:y_axis, z: z_axis  }
  }


  getInferiorTubeAngle() {
    let dx = this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x;
    let dy = this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y;

    let angle = Math.atan2(dy, dx); 

    return { angle };
  }

  getBottomIsolatorPoint(){

    let x_axis =  this.bottom_fixed_point.x + this.getIsolatorUtilLength(this.bracket_tube.isolator) * Math.cos(this.inferior_tube_angle.angle);

    let y_axis =  this.bottom_fixed_point.y + this.getIsolatorUtilLength(this.bracket_tube.isolator) * Math.sin(this.inferior_tube_angle.angle); 

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis , z: z_axis   }
  }

  getUpperEyeClampClevisFixedPoint():{x:number, y:number, z:number}{

    let x_axis =  this.upper_tube_eye_clamp_fixed_point.x - this.getClevisEndFittingUtilLength(this.bracket_tube.clevis_end_fitting) * Math.cos(this.inferior_tube_angle.angle);

    let y_axis =  this.upper_tube_eye_clamp_fixed_point.y - this.getClevisEndFittingUtilLength(this.bracket_tube.clevis_end_fitting) * Math.sin(this.inferior_tube_angle.angle); 

    let z_axis = this.pv.z;

    return { x: x_axis, y:y_axis, z:z_axis  }
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


  getRegisterArmDropperBracketBottomPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.steady_arm_hook_fixed_point.x - this.register_arm.drop_bracket.x1 *Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.steady_arm_hook_fixed_point.y + this.register_arm.drop_bracket.x1*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.steady_arm_hook_fixed_point.x + this.register_arm.drop_bracket.x1 *Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.steady_arm_hook_fixed_point.y + this.register_arm.drop_bracket.x1*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

    }

    return { x: x0, y:y0  ,z:z0}

  }

  getRegisterArmDropperBracketUpperPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.register_arm_bracket_bottom_point.x + this.register_arm.drop_bracket.h *Math.cos(this.degreesToRadians(360+90+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_bottom_point.y + this.register_arm.drop_bracket.h*Math.sin(this.degreesToRadians(360+90+this.register_arm.alpha));

      z0 = this.pv.z;
      
    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.register_arm_bracket_bottom_point.x + this.register_arm.drop_bracket.h *Math.cos(this.degreesToRadians(360+90+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_bottom_point.y + this.register_arm.drop_bracket.h*Math.sin(this.degreesToRadians(360+90+this.register_arm.alpha));

      z0 = this.pv.z;

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmDropperBracketUpperFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_point.x + this.register_arm.drop_bracket.x2 *Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_point.y + this.register_arm.drop_bracket.x2*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_point.x - this.register_arm.drop_bracket.x2 *Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_point.y - this.register_arm.drop_bracket.x2*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmEyeClampPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;
    
    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_fixed_point.x + (this.register_arm.drop_bracket_distance - this.register_arm.eye_clamp_distance)*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_fixed_point.y + (this.register_arm.drop_bracket_distance - this.register_arm.eye_clamp_distance)*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_fixed_point.x - (this.register_arm.eye_clamp_distance)*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_fixed_point.y - (this.register_arm.eye_clamp_distance)*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }

    return { x: x0, y:y0  ,z:z0}
  }


  getRegisterArmEyeClampFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;
    
    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.register_arm_eye_clamp_point.x + this.register_arm.eye_clamp.h * Math.cos(this.degreesToRadians(360 + 90 + this.register_arm.alpha));

      y0 =  this.register_arm_eye_clamp_point.y + this.register_arm.eye_clamp.h * Math.sin(this.degreesToRadians(360 + 90 + this.register_arm.alpha)); 

      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.register_arm_eye_clamp_point.x + this.register_arm.eye_clamp.h * Math.cos(this.degreesToRadians(360 + 90 + this.register_arm.alpha));

      y0 =  this.register_arm_eye_clamp_point.y + this.register_arm.eye_clamp.h * Math.sin(this.degreesToRadians(360 + 90 + this.register_arm.alpha)); 

      z0 = this.pv.z;

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getRegisterArmEndPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_fixed_point.x + this.register_arm.drop_bracket_distance*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_fixed_point.y + this.register_arm.drop_bracket_distance*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      x0 =  this.register_arm_bracket_upper_fixed_point.x + this.register_arm.drop_bracket_distance*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.register_arm_bracket_upper_fixed_point.y + this.register_arm.drop_bracket_distance*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

    }

    return { x: x0, y:y0  ,z:z0}
  }

  getIntersectionRegisterArmFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let theta1 = this.radiansToDegress(Math.atan(m1));

      let m2 = Math.tan(this.degreesToRadians(this.register_arm.alpha));
      let b2 = this.register_arm_bracket_upper_fixed_point.y - ((this.register_arm_bracket_upper_fixed_point.x)*m2);

      let m3 = -Math.tan(this.degreesToRadians(90-theta1));
      let b3 = this.intersection_tube_fixed_point.y - ((this.intersection_tube_fixed_point.x)*m3);
      
      x0 = (b3-b2)/(m2-m3);
      y0 = x0*m3 + b3;

      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let theta1 = this.radiansToDegress(Math.atan(m1));

      let m2 = Math.tan(this.degreesToRadians(this.register_arm.alpha));
      let b2 = this.register_arm_bracket_upper_fixed_point.y - ((this.register_arm_bracket_upper_fixed_point.x)*m2);

      let m3 = -Math.tan(this.degreesToRadians(90-theta1));
      let b3 = this.intersection_tube_fixed_point.y - ((this.intersection_tube_fixed_point.x)*m3);
      
      x0 = (b3-b2)/(m2-m3);
      y0 = x0*m3 + b3;

      z0 = this.pv.z;

    }

    return { x: x0, y:y0, z:z0}

  }

  getRegisterArmHookEndFittingPoint():{x:number,y:number, z:number}{
    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null && this.register_arm.hook_end_fitting != null){

      let length = this.register_arm.hook_end_fitting.L - this.register_arm.hook_end_fitting.a

      x0 =  this.intersection_register_arm_fixed_point.x + length*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.intersection_register_arm_fixed_point.y + length*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;
      

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      let length = this.register_arm.hook_end_fitting.L - this.register_arm.hook_end_fitting.a

      x0 =  this.intersection_register_arm_fixed_point.x + length*Math.cos(this.degreesToRadians(360+this.register_arm.alpha));

      y0 =  this.intersection_register_arm_fixed_point.y + length*Math.sin(this.degreesToRadians(360+this.register_arm.alpha));

      z0 = this.pv.z;

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

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "SBA" && this.steady_arm.eye_clamp_distance != null){

      x0 =  this.steady_arm_fixed_point.x - this.steady_arm.eye_clamp_distance * Math.cos(this.degreesToRadians(360 + this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y - this.steady_arm.eye_clamp_distance * Math.sin(this.degreesToRadians(360 + this.steady_arm.alpha)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;

      }

    };

    return { x: x0, y:y0, z:z0  }
  }

  getSteadyArmEyeClampFixedPoint():{x:number, y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "SBA" && this.steady_arm.eye_clamp != null){

      x0 =  this.steady_arm_eye_clamp_point.x + this.steady_arm.eye_clamp.h * Math.cos(this.degreesToRadians(360 + 90 + this.steady_arm.alpha));

      y0 =  this.steady_arm_eye_clamp_point.y + this.steady_arm.eye_clamp.h * Math.sin(this.degreesToRadians(360 + 90 + this.steady_arm.alpha)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;
      }

    };

    return { x: x0, y:y0, z:z0  }
  }
  
  /***********************************************************TDP<2.2 - SBA - SINGLE - DOUBLE **********************************************************************************/
  getIntersectionSteadyArmFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA"){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let theta1 = this.radiansToDegress(Math.atan(m1));

      let m2 = Math.tan(this.degreesToRadians(this.steady_arm.alpha));
      let b2 = this.steady_arm_fixed_point.y - ((this.steady_arm_fixed_point.x)*m2);

      let m3 = -Math.tan(this.degreesToRadians(90-theta1));
      let b3 = this.intersection_tube_fixed_point.y - ((this.intersection_tube_fixed_point.x)*m3);
      
      x0 = (b3-b2)/(m2-m3);
      y0 = x0*m3 + b3;

      z0 = this.pv.z;

    }

    return { x: x0, y:y0, z:z0}

  }

  getSteadyArmFixedPoint():{x:number, y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA" ){

      let angleModified = (180 + this.steady_arm.swivel_clip.cw_angle + this.steady_arm.alpha);

      x0 =  this.cw_axis.x - this.steady_arm.swivel_clip.cw_height * Math.cos(this.degreesToRadians(angleModified));

      y0 =  this.cw_axis.y - this.steady_arm.swivel_clip.cw_height * Math.sin(this.degreesToRadians(angleModified)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration =="DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h; 

      }

    }else if(this.model.type.configuration == "TDP>2.2"){

      let angleModified = (180 + this.steady_arm.swivel_clip.cw_angle + this.steady_arm.alpha);

      x0 =  this.cw_axis.x - this.steady_arm.swivel_clip.cw_height * Math.cos(this.degreesToRadians(angleModified));

      y0 =  this.cw_axis.y - this.steady_arm.swivel_clip.cw_height * Math.sin(this.degreesToRadians(angleModified)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration =="DOUBLE" && this.register_arm != null){

        z0 = this.pv.z +  this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    }else if(this.model.type.configuration == "CAI"){

      let angleModified = (180 + this.steady_arm.swivel_clip.cw_angle + this.steady_arm.alpha);

      x0 =  this.cw_axis.x - this.steady_arm.swivel_clip.cw_height * Math.cos(this.degreesToRadians(angleModified));

      y0 =  this.cw_axis.y - this.steady_arm.swivel_clip.cw_height * Math.sin(this.degreesToRadians(angleModified)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration =="DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    };

    return { x: x0, y:y0, z:z0  }
  }

  getSteadyArmEndPoint():{x:number, y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA"){

      x0 =  this.steady_arm_fixed_point.x + this.steady_arm.end_distance * Math.cos(this.degreesToRadians(360 + this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y + this.steady_arm.end_distance * Math.sin(this.degreesToRadians(360 + this.steady_arm.alpha)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;
      }

    }else if(this.model.type.configuration == "TDP>2.2"){

      x0 =  this.steady_arm_fixed_point.x + this.steady_arm.end_distance * Math.cos(this.degreesToRadians(360 + this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y + this.steady_arm.end_distance * Math.sin(this.degreesToRadians(360 + this.steady_arm.alpha)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration =="DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      };

    }else if(this.model.type.configuration == "CAI"){

      x0 =  this.steady_arm_fixed_point.x - this.steady_arm.end_distance * Math.cos(this.degreesToRadians(360 + this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y - this.steady_arm.end_distance * Math.sin(this.degreesToRadians(360 + this.steady_arm.alpha)); 

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration =="DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      };

    }

    return { x: x0, y:y0, z:z0  }
  }



  getSteadyArmHookEndFittingPoint():{x:number,y:number, z:number}{
    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" && this.steady_arm.hook_end_fitting != null){

      let length = this.steady_arm.hook_end_fitting.L - this.steady_arm.hook_end_fitting.a

      x0 =  this.intersection_steady_arm_fixed_point.x + length*Math.cos(this.degreesToRadians(360+this.steady_arm.alpha));

      y0 =  this.intersection_steady_arm_fixed_point.y + length*Math.sin(this.degreesToRadians(360+this.steady_arm.alpha));

      z0 = this.pv.z;
      
      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;

      }

    }else if(this.model.type.configuration == "SBA" && this.steady_arm.hook_end_fitting != null){

      let length = this.steady_arm.hook_end_fitting.L - this.steady_arm.hook_end_fitting.a

      x0 =  this.intersection_steady_arm_fixed_point.x + length*Math.cos(this.degreesToRadians(360+this.steady_arm.alpha));

      y0 =  this.intersection_steady_arm_fixed_point.y + length*Math.sin(this.degreesToRadians(360+this.steady_arm.alpha));

      z0 = this.pv.z;


      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z +  this.bracket_tube.eye_clamp.h;

      }

    }

    return { x: x0, y:y0  ,z:z0}

  }

  /***********************************************************TDP>2.2 - SINGLE - DOUBLE **********************************************************************************/

  getSteadyArmHookClampPoint():{x:number,y:number, z:number}{
    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.steady_arm.hook_end_clamp != null){

      x0 =  this.steady_arm_fixed_point.x + this.steady_arm.length*Math.cos(this.degreesToRadians(180+this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y + this.steady_arm.length*Math.sin(this.degreesToRadians(180+this.steady_arm.alpha));

      z0 = this.pv.z;
      
      if(this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    }else if(this.model.type.configuration == "CAI" && this.steady_arm.hook_end_clamp != null){

      x0 =  this.steady_arm_fixed_point.x + this.steady_arm.length*Math.cos(this.degreesToRadians(this.steady_arm.alpha));

      y0 =  this.steady_arm_fixed_point.y + this.steady_arm.length*Math.sin(this.degreesToRadians(this.steady_arm.alpha));

      z0 = this.pv.z;
      
      if(this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    }

    return { x: x0, y:y0  ,z:z0}

  }



  getSteadyArmHookClampFixedPoint():{x:number,y:number,z:number}{

    let x0 = 0;

    let y0 = 0;

    let z0 = 0;

    if(this.model.type.configuration == "TDP>2.2" && this.steady_arm.hook_end_clamp != null){

      x0 =  this.steady_arm_hook_clamp_point.x + this.steady_arm.hook_end_clamp.eye_tube_length*Math.cos(this.degreesToRadians(360-90+this.steady_arm.alpha));

      y0 =  this.steady_arm_hook_clamp_point.y + this.steady_arm.hook_end_clamp.eye_tube_length*Math.sin(this.degreesToRadians(360-90+this.steady_arm.alpha));

      z0 = this.pv.z;
      
      if(this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    }else if(this.model.type.configuration == "CAI" && this.steady_arm.hook_end_clamp != null){

      x0 =  this.steady_arm_hook_clamp_point.x + this.steady_arm.hook_end_clamp.eye_tube_length*Math.cos(this.degreesToRadians(360-90+this.steady_arm.alpha));

      y0 =  this.steady_arm_hook_clamp_point.y + this.steady_arm.hook_end_clamp.eye_tube_length*Math.sin(this.degreesToRadians(360-90+this.steady_arm.alpha));

      z0 = this.pv.z;
      
      if(this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm != null){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;

      }

    }

    return { x: x0, y:y0  ,z:z0}

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

    if(this.model.type.configuration == "TDP<2.2"){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let b1 = (this.bottom_fixed_point.y)- ((this.bottom_fixed_point.x)*m1);

      let m2 = Math.tan(this.degreesToRadians(this.steady_arm.alpha));
      let b2 = this.steady_arm_end_point.y - ((this.steady_arm_end_point.x)*m2);

      x0 = (b1-b2)/(m2-m1);

      y0 = x0*m1 + b1;

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;
      }

    }else if(this.model.type.configuration == "SBA"){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let b1 = (this.bottom_fixed_point.y)- ((this.bottom_fixed_point.x)*m1);

      let m2 = Math.tan(this.degreesToRadians(this.steady_arm.alpha));
      let b2 = this.steady_arm_end_point.y - ((this.steady_arm_end_point.x)*m2);

      x0 = (b1-b2)/(m2-m1);

      y0 = x0*m1 + b1;

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.bracket_tube.eye_clamp.h;
      }

    }else if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let b1 = (this.bottom_fixed_point.y)- ((this.bottom_fixed_point.x)*m1);

      let m2 = Math.tan(this.degreesToRadians(this.register_arm.alpha));
      let b2 = this.register_arm_bracket_upper_fixed_point.y - ((this.register_arm_bracket_upper_fixed_point.x)*m2);

      x0 = (b1-b2)/(m2-m1);

      y0 = x0*m1 + b1;

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;
      }

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      let m1 = (this.upper_tube_eye_clamp_fixed_point.y - this.bottom_fixed_point.y)/(this.upper_tube_eye_clamp_fixed_point.x - this.bottom_fixed_point.x)
      let b1 = (this.bottom_fixed_point.y)- ((this.bottom_fixed_point.x)*m1);

      let m2 = Math.tan(this.degreesToRadians(this.register_arm.alpha));
      let b2 = this.register_arm_bracket_upper_fixed_point.y - ((this.register_arm_bracket_upper_fixed_point.x)*m2);

      x0 = (b1-b2)/(m2-m1);

      y0 = x0*m1 + b1;

      z0 = this.pv.z;

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        z0 = this.pv.z + this.register_arm.drop_bracket.double_wire_separation_z/2;
      }

    }

    return { x: x0, y:y0  , z:z0}
  }

  /***********************************************************TDP<2.2 - SINGLE   TDP>2.2  SINGLE AND DOUBLE**********************************************************************************/


  getIntersectionTubeFixedPoint():{x:number,y:number, z:number}{

    let x0 = 0;
    let y0 = 0;
    let z0 = 0;

    if(this.model.type.configuration == "TDP<2.2" || this.model.type.configuration == "SBA"){

      let length_1 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.bottom_fixed_point);
      let length_2 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.steady_arm_end_point);

      let angle_bracket_tube = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.upper_tube_eye_clamp_fixed_point);
      let angle_steady_arm_bottom_fixed_point = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.steady_arm_fixed_point);

      let theta2 = angle_bracket_tube - angle_steady_arm_bottom_fixed_point;
      let theta1 =  Math.asin((length_1*Math.sin(this.degreesToRadians(theta2)))/(length_2))
      let theta3 = 180 - (theta2 + this.radiansToDegress(theta1));

      let CA = this.bracket_tube.eye_clamp.h*Math.cos(this.degreesToRadians(180-theta3))/Math.sin(this.degreesToRadians(180-theta3));

      x0 = Math.abs(CA*Math.cos(this.degreesToRadians(angle_bracket_tube)))  + this.intersection_point.x;
      y0 = Math.abs(CA*Math.sin(this.degreesToRadians(angle_bracket_tube))) + this.intersection_point.y;
      z0 = this.pv.z;

    }else if(this.model.type.configuration == "TDP>2.2" && this.register_arm != null){

      let length_1 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.bottom_fixed_point);
      let length_2 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.register_arm_bracket_upper_fixed_point);


      let angle_bracket_tube = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.upper_tube_eye_clamp_fixed_point);
      let angle_register_arm_bottom_fixed_point = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.register_arm_bracket_upper_fixed_point);

      let theta2 = angle_bracket_tube - angle_register_arm_bottom_fixed_point;
      let theta1 =  Math.asin((length_1*Math.sin(this.degreesToRadians(theta2)))/(length_2))
      let theta3 = 180 - (theta2 + this.radiansToDegress(theta1));

      let CA = this.bracket_tube.eye_clamp.h*Math.cos(this.degreesToRadians(180-theta3))/Math.sin(this.degreesToRadians(180-theta3));

      x0 = Math.abs(CA*Math.cos(this.degreesToRadians(angle_bracket_tube)))  + this.intersection_point.x;
      y0 = Math.abs(CA*Math.sin(this.degreesToRadians(angle_bracket_tube))) + this.intersection_point.y;
      z0 = this.pv.z;

    }else if(this.model.type.configuration == "CAI" && this.register_arm != null){

      let length_1 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.bottom_fixed_point);
      let length_2 = this.getDistanceBetweenTwoPoints(this.intersection_point, this.register_arm_bracket_upper_fixed_point);


      let angle_bracket_tube = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.upper_tube_eye_clamp_fixed_point);
      let angle_register_arm_bottom_fixed_point = this.getAngleBetweenTwoPoints(this.bottom_fixed_point, this.register_arm_bracket_upper_fixed_point);

      let theta2 = angle_bracket_tube - angle_register_arm_bottom_fixed_point;
      let theta1 =  Math.asin((length_1*Math.sin(this.degreesToRadians(theta2)))/(length_2))
      let theta3 = 180 - (theta2 + this.radiansToDegress(theta1));

      let CA = this.bracket_tube.eye_clamp.h*Math.cos(this.degreesToRadians(180-theta3))/Math.sin(this.degreesToRadians(180-theta3));

      x0 = Math.abs(CA*Math.cos(this.degreesToRadians(angle_bracket_tube)))  + this.intersection_point.x;
      y0 = Math.abs(CA*Math.sin(this.degreesToRadians(angle_bracket_tube))) + this.intersection_point.y;
      z0 = this.pv.z;

    }


    return { x: x0, y:y0  ,z:z0}
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
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.upper_isolator_point,this.upper_tube_end_point), 2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.upper_isolator_point,this.upper_tube_end_point),-1)  
      },
      {
        name:"bracket_tube",
        diameter:this.bracket_tube.tube.d,
        thickness:this.bracket_tube.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.bottom_isolator_point,this.upper_eye_clamp_clevis_fixed_point),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.bottom_isolator_point,this.upper_eye_clamp_clevis_fixed_point),-1) 
      }
    ]

    if(this.model.type.configuration != "CAI" && this.model.type.configuration != "TDP>2.2"){
      dimensions.push({
        name:"steady_arm",
        diameter:this.steady_arm.tube.d,
        thickness:this.steady_arm.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_end_fitting_point),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_end_fitting_point),-1) 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){
        dimensions.push({
          name:"steady_arm",
          diameter:this.steady_arm.tube.d,
          thickness:this.steady_arm.tube.s,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_end_fitting_point),2),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_end_fitting_point),-1) 
        })
      }
    }else{

      dimensions.push({
        name:"steady_arm",
        diameter:this.steady_arm.tube.d,
        thickness:this.steady_arm.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_clamp_point),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_clamp_point),-1) 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){
        dimensions.push({
          name:"steady_arm",
          diameter:this.steady_arm.tube.d,
          thickness:this.steady_arm.tube.s,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_clamp_point),2),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_end_point,this.steady_arm_hook_clamp_point),-1) 
        })
      }

    }

    if(this.model.type.configuration == "SBA"){
      dimensions.push({
        name:"steel_cable",
        diameter:this.steady_arm.stainless_steel_wire_rope?.d ?? 0,
        thickness:0,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),-1) 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        dimensions.push({
          name:"steel_cable",
          diameter:this.steady_arm.stainless_steel_wire_rope?.d ?? 0,
          thickness:0,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),2),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.steady_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),-1) 
        })
      }
    }

    if(this.model.type.configuration == "TDP>2.2" || this.model.type.configuration == "CAI"){

      dimensions.push({
        name:"steel_cable",
        diameter:this.register_arm?.stainless_steel_wire_rope?.d ?? 0,
        thickness:0,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),-1) 
      })

      if(this.model.type.contactWireConfiguration == "DOUBLE"){

        dimensions.push({
          name:"steel_cable",
          diameter:this.register_arm?.stainless_steel_wire_rope?.d ?? 0,
          thickness:0,
          length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),2),
          cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_eye_clamp_fixed_point,this.upper_eye_clamp_clevis_stainless_stell_point),-1) 
        })
      }
    }

    if(this.model.type.configuration == "CAI" || this.model.type.configuration == "TDP>2.2"){
      dimensions.push({
        name:"register_arm",
        diameter:this.stay_tube.tube.d,
        thickness:this.stay_tube.tube.s,
        length_tube:this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_hook_end_fitting_point,this.getRegisterArmEndPoint()),2),
        cut_length: this.roundToDecimals(this.getDistanceBetweenTwoPoints(this.register_arm_hook_end_fitting_point,this.getRegisterArmEndPoint()),-1)
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
      dimensions:{ width: this.stay_tube.tube.d, height: this.stay_tube.tube.d  },
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
      dimensions:{ width: this.bracket_tube.tube.d, height: this.bracket_tube.tube.d  },
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

    if(this.model.type.configuration == "TDP<2.2" && this.model.type.contactWireConfiguration == "SINGLE"){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x,
        y2:this.cw_axis.y,
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_1'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_fixed_point.z,  
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_2'
      });

      this.links.push({  
        x1: this.intersection_tube_fixed_point.x,
        y1:this.intersection_tube_fixed_point.y,
        z1:this.intersection_tube_fixed_point.z,  
        x2: this.intersection_steady_arm_fixed_point.x,
        y2:this.intersection_steady_arm_fixed_point.y,
        z2:this.intersection_steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_3'
      });

      this.links.push({  
        x1: this.intersection_steady_arm_fixed_point.x,
        y1:this.intersection_steady_arm_fixed_point.y,
        z1:this.intersection_steady_arm_fixed_point.z,  
        x2: this.steady_arm_hook_end_fitting_point.x,
        y2:this.steady_arm_hook_end_fitting_point.y,
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_4'
      });

      this.links.push({  
        x1: this.steady_arm_hook_end_fitting_point.x,
        y1:this.steady_arm_hook_end_fitting_point.y,
        z1:this.steady_arm_hook_end_fitting_point.z,  
        x2: this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_5'
      });


    }else if(this.model.type.configuration == "TDP<2.2" && this.model.type.contactWireConfiguration == "DOUBLE"){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_6'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y ,
        z1:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h),
        x2: this.cw_axis.x,
        y2:this.cw_axis.y,
        z2:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_7'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y ,
        z1:this.steady_arm_fixed_point.z, 
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_8'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h),
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z - (2 * this.bracket_tube.eye_clamp.h),
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_9'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1:this.intersection_point.z ,  
        x2: this.intersection_point.x, 
        y2:this.intersection_point.y, 
        z2:this.intersection_point.z  - this.bracket_tube.eye_clamp.h,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_10'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1:this.intersection_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.intersection_point.x, 
        y2:this.intersection_point.y, 
        z2:this.intersection_point.z - this.bracket_tube.eye_clamp.h, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_11'
      });

      this.links.push({  
        x1: this.intersection_point.x,
        y1: this.intersection_point.y ,
        z1: this.intersection_point.z,
        x2: this.steady_arm_hook_end_fitting_point.x,
        y2: this.steady_arm_hook_end_fitting_point.y,
        z2: this.steady_arm_hook_end_fitting_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_12'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1: this.intersection_point.y , 
        z1: this.intersection_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_hook_end_fitting_point.x, 
        y2: this.steady_arm_hook_end_fitting_point.y, 
        z2: this.steady_arm_hook_end_fitting_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_13'
      });

      this.links.push({  
        x1: this.steady_arm_hook_end_fitting_point.x, 
        y1:this.steady_arm_hook_end_fitting_point.y , 
        z1:this.steady_arm_hook_end_fitting_point.z,  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_14'
      });

      this.links.push({  
        x1: this.steady_arm_hook_end_fitting_point.x, 
        y1:this.steady_arm_hook_end_fitting_point.y , 
        z1:this.steady_arm_hook_end_fitting_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_15'
      });

    }else if(this.model.type.configuration == "SBA" && this.steady_arm.stainless_steel_wire_rope && this.model.type.contactWireConfiguration == "SINGLE"){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_16'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_17'
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
        elementId: 'link_18'
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
        elementId: 'link_19'
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
        elementId: 'link_20'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_point.x, 
        y1:this.steady_arm_eye_clamp_point.y , 
        z1:this.steady_arm_eye_clamp_point.z,  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_21'
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
        elementId: 'link_22'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_fixed_point.x, 
        y1:this.steady_arm_eye_clamp_fixed_point.y , 
        z1:this.steady_arm_eye_clamp_fixed_point.z,  
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x, 
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y, 
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.stainless_steel_wire_rope.d, height: this.steady_arm.stainless_steel_wire_rope.d  },
        elementId: 'link_23'
      });

      this.links.push({  
        x1: this.upper_eye_clamp_clevis_fixed_point.x, 
        y1:this.upper_eye_clamp_clevis_fixed_point.y , 
        z1:this.upper_eye_clamp_clevis_fixed_point.z,  
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x, 
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y, 
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_24'
      });


    }else if(this.model.type.configuration == "SBA" && this.steady_arm.stainless_steel_wire_rope && this.model.type.contactWireConfiguration == "DOUBLE"){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_25'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_26'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.steady_arm_end_point.x, 
        y2:this.steady_arm_end_point.y, 
        z2:this.steady_arm_end_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_27'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_end_point.x, 
        y2:this.steady_arm_end_point.y, 
        z2:this.steady_arm_end_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_28'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1:this.intersection_point.z,  
        x2: this.intersection_point.x, 
        y2:this.intersection_point.y, 
        z2:this.intersection_point.z - this.bracket_tube.eye_clamp.h, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_29'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1:this.intersection_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.intersection_point.x, 
        y2:this.intersection_point.y, 
        z2:this.intersection_point.z - this.bracket_tube.eye_clamp.h, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_30'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1:this.intersection_point.z,  
        x2: this.steady_arm_hook_end_fitting_point.x, 
        y2:this.steady_arm_hook_end_fitting_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_31'
      });

      this.links.push({  
        x1: this.intersection_point.x, 
        y1:this.intersection_point.y , 
        z1: this.intersection_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_hook_end_fitting_point.x, 
        y2:this.steady_arm_hook_end_fitting_point.y,
        z2:this.steady_arm_hook_end_fitting_point.z - (2 * this.bracket_tube.eye_clamp.h),
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_32'
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
        elementId: 'link_33'
      });

      this.links.push({  
        x1: this.steady_arm_hook_end_fitting_point.x, 
        y1:this.steady_arm_hook_end_fitting_point.y , 
        z1:this.steady_arm_hook_end_fitting_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_eye_clamp_point.x, 
        y2:this.steady_arm_eye_clamp_point.y, 
        z2:this.steady_arm_eye_clamp_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_34'
      });


      this.links.push({  
        x1: this.steady_arm_eye_clamp_point.x, 
        y1:this.steady_arm_eye_clamp_point.y , 
        z1:this.steady_arm_eye_clamp_point.z,  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_35'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_point.x, 
        y1:this.steady_arm_eye_clamp_point.y , 
        z1:this.steady_arm_eye_clamp_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_36'
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
        elementId: 'link_37'
      });

      this.links.push({  
        x1:this.steady_arm_eye_clamp_point.x, 
        y1:this.steady_arm_eye_clamp_point.y , 
        z1:this.steady_arm_eye_clamp_point.z - (2 * this.bracket_tube.eye_clamp.h),  
        x2:this.steady_arm_eye_clamp_fixed_point.x, 
        y2:this.steady_arm_eye_clamp_fixed_point.y, 
        z2:this.steady_arm_eye_clamp_fixed_point.z - (2 * this.bracket_tube.eye_clamp.h), 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_38'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_fixed_point.x, 
        y1:this.steady_arm_eye_clamp_fixed_point.y , 
        z1:this.steady_arm_eye_clamp_fixed_point.z,  
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x, 
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y, 
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.stainless_steel_wire_rope.d, height: this.steady_arm.stainless_steel_wire_rope.d  },
        elementId: 'link_39'
      });

      this.links.push({  
        x1: this.steady_arm_eye_clamp_fixed_point.x, 
        y1:this.steady_arm_eye_clamp_fixed_point.y , 
        z1:this.steady_arm_eye_clamp_fixed_point.z - ( 2 * this.bracket_tube.eye_clamp.h),  
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x,
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y,
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.stainless_steel_wire_rope.d, height: this.steady_arm.stainless_steel_wire_rope.d  },
        elementId: 'link_40'
      });

      this.links.push({  
        x1: this.upper_eye_clamp_clevis_fixed_point.x, 
        y1:this.upper_eye_clamp_clevis_fixed_point.y ,
        z1:this.upper_eye_clamp_clevis_fixed_point.z, 
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x,
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y,
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_41'
      });

    }else if(this.model.type.configuration == "TDP>2.2" && this.model.type.contactWireConfiguration == "SINGLE"){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_42'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.steady_arm_end_point.x, 
        y2:this.steady_arm_end_point.y, 
        z2:this.steady_arm_end_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_43'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_point.x, 
        y1:this.steady_arm_hook_clamp_point.y , 
        z1:this.steady_arm_hook_clamp_point.z,  
        x2: this.steady_arm_fixed_point.x, 
        y2:this.steady_arm_fixed_point.y, 
        z2:this.steady_arm_hook_end_fitting_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_44'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_point.x, 
        y1:this.steady_arm_hook_clamp_point.y , 
        z1:this.steady_arm_hook_clamp_point.z,  
        x2: this.steady_arm_hook_fixed_point.x, 
        y2:this.steady_arm_hook_fixed_point.y, 
        z2:this.steady_arm_hook_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_45'
      });

    }else if(this.model.type.configuration == "TDP>2.2" && this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_46'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,  
        x2: this.cw_axis.x, 
        y2:this.cw_axis.y, 
        z2:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_47'
      });


      this.links.push({  
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y ,
        z1:this.steady_arm_fixed_point.z,
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_48'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,  
        x2: this.steady_arm_end_point.x, 
        y2:this.steady_arm_end_point.y , 
        z2:this.steady_arm_end_point.z - this.register_arm.drop_bracket.double_wire_separation_z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_49'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_fixed_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_50'
      });

      this.links.push({ 
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        x2: this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_51'
      });


      this.links.push({ 
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_hook_fixed_point.x,
        y2:this.steady_arm_hook_fixed_point.y,
        z2:this.steady_arm_hook_fixed_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_52'
      });

      this.links.push({  
        x1:this.steady_arm_hook_clamp_point.x, 
        y1:this.steady_arm_hook_clamp_point.y , 
        z1:this.steady_arm_hook_clamp_point.z - this.register_arm.drop_bracket.double_wire_separation_z,  
        x2:this.steady_arm_hook_fixed_point.x,
        y2:this.steady_arm_hook_fixed_point.y,
        z2:this.steady_arm_hook_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_53'
      });


    }else if(this.model.type.configuration == "CAI" && this.model.type.contactWireConfiguration == "SINGLE"){

      this.links.push({ 
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y ,
        z1:this.steady_arm_end_point.z,
        x2: this.cw_axis.x,
        y2:this.cw_axis.y,
        z2:this.cw_axis.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_54'
      });

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_fixed_point.z,  
        x2: this.steady_arm_end_point.x, 
        y2:this.steady_arm_end_point.y, 
        z2:this.steady_arm_end_point.z, 
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_55'
      });

      this.links.push({  
        x1: this.steady_arm_hook_clamp_point.x, 
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_hook_end_fitting_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_56'
      });

      this.links.push({ 
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_hook_fixed_point.x,
        y2:this.steady_arm_hook_fixed_point.y,
        z2:this.steady_arm_hook_fixed_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_57'
      });


    }else if(this.model.type.configuration == "CAI" && this.model.type.contactWireConfiguration == "DOUBLE" && this.register_arm){

      this.links.push({  
        x1: this.steady_arm_fixed_point.x, 
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_end_point.z,
        x2: this.cw_axis.x,
        y2:this.cw_axis.y,
        z2:this.steady_arm_end_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_58'
      });

      this.links.push({ 
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y , 
        z1:this.steady_arm_end_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        x2: this.cw_axis.x,
        y2:this.cw_axis.y,
        z2:this.steady_arm_end_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_59'
      });

      this.links.push({ 
        x1: this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_fixed_point.z,
        x2: this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_60'
      });

      this.links.push({ 
        x1:this.steady_arm_fixed_point.x,
        y1:this.steady_arm_fixed_point.y,
        z1:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        x2:this.steady_arm_end_point.x,
        y2:this.steady_arm_end_point.y,
        z2:this.steady_arm_end_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_61'
      });

      this.links.push({ 
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y ,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_fixed_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_62'
      });

      this.links.push({  
        x1:this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y ,
        z1:this.steady_arm_hook_clamp_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        x2:this.steady_arm_fixed_point.x,
        y2:this.steady_arm_fixed_point.y,
        z2:this.steady_arm_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_63'
      });

      this.links.push({ 
        x1: this.steady_arm_hook_clamp_point.x,
        y1:this.steady_arm_hook_clamp_point.y,
        z1:this.steady_arm_hook_clamp_point.z,
        x2: this.steady_arm_hook_fixed_point.x,
        y2:this.steady_arm_hook_fixed_point.y,
        z2:this.steady_arm_hook_fixed_point.z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_64'
      });

      this.links.push({  
        x1:this.steady_arm_hook_clamp_point.x, 
        y1:this.steady_arm_hook_clamp_point.y , 
        z1:this.steady_arm_hook_clamp_point.z - this.register_arm.drop_bracket.double_wire_separation_z,  
        x2:this.steady_arm_hook_fixed_point.x, 
        y2:this.steady_arm_hook_fixed_point.y, 
        z2:this.steady_arm_hook_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
        shape: "circle",
        dimensions:{ width: this.steady_arm.tube.d, height: this.steady_arm.tube.d  },
        elementId: 'link_65'
      });

    }

  }


  addRegisterArm():void{

    if(!this.register_arm) return;

    if(this.model.type.configuration == "TDP>2.2"){

      if(this.model.type.contactWireConfiguration == "SINGLE"){

        this.links.push({  
          x1: this.register_arm_bracket_bottom_point.x, 
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_66'
        });

      }else if (this.model.type.contactWireConfiguration == "DOUBLE"){

        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_67'
        });

        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y ,
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_68'
        });


        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,
          x2: this.register_arm_bracket_bottom_point.x,
          y2:this.register_arm_bracket_bottom_point.y,
          z2:this.register_arm_bracket_bottom_point.z ,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_69'
        });

        this.links.push({  
          x1: this.register_arm_bracket_bottom_point.x, 
          y1:this.register_arm_bracket_bottom_point.y , 
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,  
          x2: this.register_arm_bracket_bottom_point.x, 
          y2:this.register_arm_bracket_bottom_point.y, 
          z2:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z, 
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_70'
        });
      }
      
      this.links.push({  
        x1: this.register_arm_bracket_bottom_point.x, 
        y1:this.register_arm_bracket_bottom_point.y , 
        z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,
        x2: this.register_arm_bracket_upper_point.x,
        y2:this.register_arm_bracket_upper_point.y,
        z2:this.register_arm_bracket_upper_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_71'
      });

      this.links.push({  
        x1: this.register_arm_bracket_upper_fixed_point.x,
        y1:this.register_arm_bracket_upper_fixed_point.y,
        z1:this.register_arm_bracket_upper_fixed_point.z,
        x2: this.register_arm_bracket_upper_point.x,
        y2:this.register_arm_bracket_upper_point.y,
        z2:this.register_arm_bracket_upper_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_72'
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
          elementId: 'link_73'
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
          elementId: 'link_74'
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
          elementId: 'link_75'
      });

      this.links.push({  
        x1: this.register_arm_eye_clamp_fixed_point.x, 
        y1:this.register_arm_eye_clamp_fixed_point.y,
        z1:this.register_arm_eye_clamp_fixed_point.z,
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x,
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y,
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.stainless_steel_wire_rope.d, height: this.register_arm.stainless_steel_wire_rope.d  },
          elementId: 'link_76'
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
          elementId: 'link_77'
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
          elementId: 'link_78'
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
          elementId: 'link_79'
      });

      this.links.push({ 
        x1: this.upper_eye_clamp_clevis_fixed_point.x,
        y1:this.upper_eye_clamp_clevis_fixed_point.y,
        z1:this.upper_eye_clamp_clevis_fixed_point.z,
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x,
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y,
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.stainless_steel_wire_rope.d, height: this.register_arm.stainless_steel_wire_rope.d  },
          elementId: 'link_80'
      });
    }

    if(this.model.type.configuration == "CAI"){

      if(this.model.type.contactWireConfiguration == "SINGLE"){

        this.links.push({  
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_81'
        });

      }else if (this.model.type.contactWireConfiguration == "DOUBLE"){

        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_82'
        });

        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
          x2: this.steady_arm_hook_fixed_point.x,
          y2:this.steady_arm_hook_fixed_point.y,
          z2:this.steady_arm_hook_fixed_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_83'
        });


        this.links.push({
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,
          x2: this.register_arm_bracket_bottom_point.x,
          y2:this.register_arm_bracket_bottom_point.y,
          z2:this.register_arm_bracket_bottom_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_84'
        });

        this.links.push({ 
          x1: this.register_arm_bracket_bottom_point.x,
          y1:this.register_arm_bracket_bottom_point.y,
          z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,
          x2: this.register_arm_bracket_bottom_point.x,
          y2:this.register_arm_bracket_bottom_point.y,
          z2:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_85'
        });

      }

      this.links.push({  
        x1: this.register_arm_bracket_bottom_point.x,
        y1:this.register_arm_bracket_bottom_point.y,
        z1:this.register_arm_bracket_bottom_point.z - this.register_arm.drop_bracket.double_wire_separation_z/2,
        x2: this.register_arm_bracket_upper_point.x,
        y2:this.register_arm_bracket_upper_point.y,
        z2:this.register_arm_bracket_upper_point.z,
          shape: "circle",
          dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_86'
      });

      this.links.push({ 
        x1: this.register_arm_bracket_upper_fixed_point.x,
        y1:this.register_arm_bracket_upper_fixed_point.y,
        z1:this.register_arm_bracket_upper_fixed_point.z,
        x2: this.register_arm_bracket_upper_point.x,
        y2:this.register_arm_bracket_upper_point.y,
        z2:this.register_arm_bracket_upper_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_87'
      });

      this.links.push({  
        x1: this.register_arm_bracket_upper_fixed_point.x,
        y1:this.register_arm_bracket_upper_fixed_point.y,
        z1:this.register_arm_bracket_upper_fixed_point.z,
        x2: this.register_arm_eye_clamp_point.x,
        y2:this.register_arm_eye_clamp_point.y, 
        z2:this.register_arm_eye_clamp_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.tube.d, height: this.register_arm.tube.d  },
          elementId: 'link_88'
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
          elementId: 'link_89'
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
          elementId: 'link_90'
      });

      this.links.push({ 
        x1: this.register_arm_eye_clamp_fixed_point.x,
        y1:this.register_arm_eye_clamp_fixed_point.y,
        z1:this.register_arm_eye_clamp_fixed_point.z,
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x,
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y,
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z,
        shape: "circle",
        dimensions:{ width: this.register_arm.stainless_steel_wire_rope.d, height: this.register_arm.stainless_steel_wire_rope.d  },
          elementId: 'link_91'
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
          elementId: 'link_92'
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
          elementId: 'link_93'
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
          elementId: 'link_94'
      });

      this.links.push({  
        x1: this.upper_eye_clamp_clevis_fixed_point.x, 
        y1:this.upper_eye_clamp_clevis_fixed_point.y , 
        z1:this.upper_eye_clamp_clevis_fixed_point.z,  
        x2: this.upper_eye_clamp_clevis_stainless_stell_point.x, 
        y2:this.upper_eye_clamp_clevis_stainless_stell_point.y, 
        z2:this.upper_eye_clamp_clevis_stainless_stell_point.z, 
        shape: "circle",
        dimensions:{ width: this.register_arm.stainless_steel_wire_rope.d, height: this.register_arm.stainless_steel_wire_rope.d  },
          elementId: 'link_95'
      });
    }

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
          x:this.bottom_isolator_point.x,
          y:this.bottom_isolator_point.y,
          z:this.bottom_isolator_point.z
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
        x:this.bottom_fixed_point.x,
        y:this.bottom_fixed_point.y,
        z:this.bottom_fixed_point.z
      },
      end:{
        x:this.upper_fixed_point.x,
        y:this.upper_fixed_point.y,
        z:this.upper_fixed_point.z
      },
      groupId:"fixing_distance",
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
          distance:150
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
        y:this.via_axis.y,
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

    if(this.model.type.configuration == "SBA" || this.model.type.configuration == "TDP<2.2"){
      this.dimensions.push({  
        start:{
          x:this.steady_arm_fixed_point.x,
          y:this.steady_arm_fixed_point.y,
          z:this.steady_arm_fixed_point.z
        },
        end:{
          x:this.steady_arm_end_point.x,
          y:this.steady_arm_end_point.y,
          z:this.steady_arm_end_point.z
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
          x:this.steady_arm_hook_end_fitting_point.x,
          y:this.steady_arm_hook_end_fitting_point.y,
          z:this.steady_arm_hook_end_fitting_point.z
        },
        end:{
          x:this.steady_arm_fixed_point.x,
          y:this.steady_arm_fixed_point.y,
          z:this.steady_arm_fixed_point.z
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

    if(this.model.type.configuration == "SBA"){
      this.dimensions.push({  
        start:{
          x:this.steady_arm_eye_clamp_fixed_point.x,
          y:this.steady_arm_eye_clamp_fixed_point.y,
          z:this.steady_arm_eye_clamp_fixed_point.z
        },
        end:{
          x:this.upper_eye_clamp_clevis_stainless_stell_point.x,
          y:this.upper_eye_clamp_clevis_stainless_stell_point.y,
          z:this.upper_eye_clamp_clevis_stainless_stell_point.z
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
          x:this.upper_eye_clamp_clevis_stainless_stell_point.x,
          y:this.upper_eye_clamp_clevis_stainless_stell_point.y,
          z:this.upper_eye_clamp_clevis_stainless_stell_point.z
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

      this.dimensions.push({  
        start:{
          x:this.steady_arm_fixed_point.x,
          y:this.steady_arm_fixed_point.y,
          z:this.steady_arm_fixed_point.z
        },
        end:{
          x:this.steady_arm_hook_clamp_point.x,
          y:this.steady_arm_hook_clamp_point.y,
          z:this.steady_arm_hook_clamp_point.z
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
          x:this.steady_arm_end_point.x,
          y:this.steady_arm_end_point.y,
          z:this.steady_arm_end_point.z
        },
        end:{
          x:this.steady_arm_fixed_point.x,
          y:this.steady_arm_fixed_point.y,
          z:this.steady_arm_fixed_point.z
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

    return this.dimensions;
  }

  generatePoints(): {x: number, y: number, z: number}[] {
    let pointsSet = new Set<string>(); // To store unique points as strings
    let points: {x: number, y: number, z: number}[] = [];

    const links = this.generateLinks();

    // Iterate through each link and add both points (x1, y1, z1) and (x2, y2, z2) to the set
    links.forEach(link => {
        const point1 = `${link.x1},${link.y1},${link.z1}`;
        const point2 = `${link.x2},${link.y2},${link.z2}`;

        pointsSet.add(point1); // Add the starting point of the link
        pointsSet.add(point2); // Add the ending point of the link
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
  static deserialize(data: CantileverGermanParams): CantileverGerman {
    return new CantileverGerman(
      data.model,
      data.poleModel,
      data.esc,
      data.contact_wire_height,
      data.bottom_fixed_height,
      data.fixing_distance,
      data.system_height,
      data.zig_zag,
      data.track,
      data.pantograph,
      data.support_offset,
      data.u,
      data.pv,
      data.stay_tube,
      data.bracket_tube,
      data.register_arm,
      data.steady_arm
    );
  }
}

export default CantileverGerman;
