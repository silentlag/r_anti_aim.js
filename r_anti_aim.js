UI.AddCheckbox("Enabled")
UI.AddDropdown("Yaw base", ["Local view", "At targets"]);
UI.AddSliderInt("Yaw", -180,180);
UI.AddDropdown("Yaw jitter", ["Off", "Offset", "Center", "Random"]);
UI.AddSliderInt("Yaw jitter value", -180, 180);
UI.AddDropdown("Body yaw", ["Opposite", "Static", "Jitter"]);
UI.AddSliderInt("Body yaw value", -180, 180);
UI.AddDropdown("Lower body yaw target", ["Sway", "Opposite", "Eye yaw"]);
UI.AddSliderInt("Fake yaw limit", 0, 60);
UI.AddCheckbox("Freestanding");
UI.AddDropdown("Freestand body yaw", ["Off", "Static", "Crooked"]);
UI.AddCheckbox("Enable jitter when running");
UI.AddCheckbox("Indicate cheat state");
UI.AddDropdown("Anti-aim display mode", ["Real yaw", "Body yaw"]);  
UI.AddHotkey("Lowerize fake yaw limit", "Lowerize fake yaw limit");
UI.AddHotkey("Left", "Left");
UI.AddHotkey("Right", "Right");
UI.AddCheckbox("Expose fake when exploiting");
UI.AddCheckbox("Double Tap Improvments");
var oldTick = 0
var lastPressed = 0
var drawLeft = 0;
var drawRight = 0;
var isHideRealActive = false;
var SetRealYaw = 0;
var SetFakeYaw = 0;
var SetLBYYaw = 0;
var RealSwitch = false;
var FakeSwitch = false;
var LbySwitch = false;
var IsInverter = UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter");
var LowDelta = UI.IsHotkeyActive("Lowerize fake yaw limit");
var drawLeft = 0; drawHideReal = 1;
var drawRight = 0, drawBack = 0;
var left_distance;
var right_distance;
var fontalpha = 0;
var inverter = {
    get: function() {return IsInverted}
}
function deg2rad( degress ) {
    return degress * Math.PI / 180.0;
}
function angle_to_vec( pitch, yaw ) {
    var p = deg2rad( pitch );
    var y = deg2rad( yaw )
    var sin_p = Math.sin( p );
    var cos_p = Math.cos( p );
    var sin_y = Math.sin( y );
    var cos_y = Math.cos( y );
    return [ cos_p * cos_y, cos_p * sin_y, -sin_p ];
}
function trace( entity_id, entity_angles ) {
    var entity_vec = angle_to_vec( entity_angles[0], entity_angles[1] );
    var entity_pos = Entity.GetRenderOrigin( entity_id );
    entity_pos[2] += 50;
    var stop = [ entity_pos[ 0 ] + entity_vec[0] * 8192, entity_pos[1] + entity_vec[1] * 8192, ( entity_pos[2] )  + entity_vec[2] * 8192 ];
    var traceResult = Trace.Line( entity_id, entity_pos, stop );
    if( traceResult[1] == 1.0 )
        return;
    stop = [ entity_pos[ 0 ] + entity_vec[0] * traceResult[1] * 8192, entity_pos[1] + entity_vec[1] * traceResult[1] * 8192, entity_pos[2] + entity_vec[2] * traceResult[1] * 8192 ];
    var distance = Math.sqrt( ( entity_pos[0] - stop[0] ) * ( entity_pos[0] - stop[0] ) + ( entity_pos[1] - stop[1] ) * ( entity_pos[1] - stop[1] ) + ( entity_pos[2] - stop[2] ) * ( entity_pos[2] - stop[2] ) );
    entity_pos = Render.WorldToScreen( entity_pos );
    stop = Render.WorldToScreen( stop );
    if( stop[2] != 1 || entity_pos[2] != 1 )
        return;

    return distance;
}
function RandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}
function getVelocity()
{
    var velocity = Entity.GetProp( Entity.GetLocalPlayer(), "CBasePlayer", "m_vecVelocity[0]" );
    var speed = Math.sqrt( velocity[0] * velocity[0] + velocity[1] * velocity[1] );
    return speed;
}

var scriptitems = ["Misc", "JAVASCRIPT", "Script Items"];

function onUnload() {
    AntiAim.SetOverride(0);
}

var cm_custom_aa = function() { 
    var values = { yawbasecache: UI.GetValue("Yaw base"), at_targets_cache: UI.GetValue("Anti-Aim", "Rage Anti-Aim", "At target"), freestanding: UI.GetValue("Freestanding"), switcher: UI.GetValue("Script items", "Yaw base")}
         if (UI.GetValue(["Enabled"])) {
            AntiAim.SetOverride(1);
            const fired_shots = Entity.GetProp(Entity.GetLocalPlayer(), "CCSPlayer", "m_iShotsFired");
            var local = Entity.GetLocalPlayer();

            var caa_fake = UI.GetValue(scriptitems, "Yaw jitter value");
            var caa_real = UI.GetValue(scriptitems, "Yaw");
            var caa_use_ey = UI.GetValue(scriptitems, "Use eye yaw for LBY");
            var caa_ryaw_offset_val = UI.GetValue(scriptitems, "Body yaw value");
            var caa_fyaw_offset_val = UI.GetValue(scriptitems, "Fake yaw limit");
           
           
            var caa_realyaw_offset = caa_use_ey ? caa_ryaw_offset_val : (caa_ryaw_offset_val * 2);
 
           
            AntiAim.SetFakeOffset(caa_real);

            if (values.switcher == 1) {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "At targets", true);
            } else {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "At targets", values.at_targets_cache);
            }
    
            if(values.freestanding == 1) {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Auto direction", true);
            } else {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Auto direction", false);
            }
           
            if (caa_fake > 0) {
                AntiAim.SetRealOffset(caa_real - caa_fake + caa_realyaw_offset);
                if (caa_fake < caa_fyaw_offset_val) {
                    caa_fyaw_offset_val = caa_fake;
                }
                caa_use_ey ? AntiAim.SetLBYOffset(caa_real - caa_fyaw_offset_val) : AntiAim.SetLBYOffset(caa_real + caa_fake - caa_fyaw_offset_val * 2);
            } else {
                if (caa_fake > caa_fyaw_offset_val) {
                    caa_fyaw_offset_val = caa_fake;
                }
                AntiAim.SetRealOffset(caa_real - caa_fake - caa_realyaw_offset);
                caa_use_ey ? AntiAim.SetLBYOffset(caa_real + caa_fyaw_offset_val) : AntiAim.SetLBYOffset(caa_real + caa_fake + caa_fyaw_offset_val * 2);
            }

            //Yaw base
            if (values.yawbasecache == 1) {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "At targets", true);
            } else {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "At targets", values.at_targets_cache);
            }
            //Yaw
            if (UI.GetValue(["Script items", "Yaw jitter"]) == 0) {
                SetRealYaw = UI.GetValue("Script items", "Yaw");
            }


            //Yaw jitter
            else {
                if (Globals.ChokedCommands() == 0) {
                    if (UI.GetValue("Script items", "Yaw jitter") == 1) {
                        if (RealSwitch) {
                            SetRealYaw = UI.GetValue("Script items", "Yaw");
                        } else {
                            SetRealYaw = UI.GetValue("Script items", "Yaw") + UI.GetValue("Script items", "Yaw jitter value");
                        }
                        RealSwitch = !RealSwitch;
                    } else if (UI.GetValue("Script items", "Yaw jitter") == 2) {
                        if (RealSwitch) {
                            SetRealYaw = UI.GetValue("Script items", "Yaw") - UI.GetValue("Script items", "Yaw jitter value") / 2;
                        } else {
                            SetRealYaw = UI.GetValue("Script items", "Yaw") + UI.GetValue("Script items", "Yaw jitter value") / 2;
                        }
                        RealSwitch = !RealSwitch;
                    } else if (UI.GetValue("Script items", "Yaw jitter") == 3) {
                        SetRealYaw = UI.GetValue("Script items", "Yaw") + RandomInt(UI.GetValue("Script items", "Yaw jitter value") / -2, UI.GetValue("Script items", "Yaw jitter value") / 2);
                    }
                }
            }

            //Body Yaw
            if (Globals.ChokedCommands() == 0) {
            if (UI.GetValue(["Script items", "Enable jitter when running", true]) && getVelocity() > 110) {
              if (FakeSwitch) {
  							SetFakeYaw = UI.GetValue(["Script items", "Body yaw value"]);
  						} else {
  							SetFakeYaw = UI.GetValue(["Script items", "Body yaw value"]) + 60;
  						}
  						FakeSwitch = !FakeSwitch;
            }
            else {

                  if (UI.GetValue(["Body yaw"]) == 0) {
  					SetFakeYaw = 120;
                  } else if (UI.GetValue(["Body yaw"]) == 1) {
                      SetFakeYaw = UI.GetValue(["Body yaw value"]);
                  } else if (UI.GetValue(["Body yaw"]) == 2) {
  					if (!UI.GetValue(["Lowerize fake yaw limit"])) {
  						if (FakeSwitch) {
  							SetFakeYaw = UI.GetValue(["Body yaw value"]);
  						} else {
  							SetFakeYaw = UI.GetValue(["Body yaw value"]) + 60;
  						}
  						FakeSwitch = !FakeSwitch;
  					}
  					else {
  						SetFakeYaw = 60;
  					}
                  }
              }
            }





            //LBY
            //Freestanding
             if (UI.GetValue(["Script items", "Freestanding"]) && UI.GetValue(["Script items", "Freestanding hotkey"])) {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Auto direction"), false;
            } else {
                UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Auto direction"), true;
            }
            var eye_angles = Local.GetViewAngles();
            left_distance = trace( local, [ 0, eye_angles[1] - 22] );
            right_distance = trace( local, [ 0, eye_angles[1] + 22] );
            if (left_distance < 600 && right_distance < 600) {
                if (UI.GetValue(["Script items", "Freestand body yaw"]) == 2) {
                    if ( right_distance < left_distance ) {
                        SetFakeYaw *= -1;
                    }
                }
                else {
                    if ( left_distance < right_distance ) {
                        SetFakeYaw *= -1;
                    }
                }
            }
            
            //Inverter
            
            if (UI.GetValue(["Script items", "Allow to use inverter"])) {
                    if (UI.GetValue(["Anti-Aim", "Fake angles", "Inverter"])) {
                    SetFakeYaw = SetFakeYaw * -1;
                }
            }

			if (fired_shots > 1) {
				SetFakeYaw = SetFakeYaw * -1;
			}


            //Main part
            SetFakeYaw = clamp(SetFakeYaw, UI.GetValue(["Script items", "Fake yaw limit"]) * -1, UI.GetValue(["Script items", "Fake yaw limit"]));
			if (UI.GetValue(["Script items", "Lowerize fake yaw limit"])) {
                if (UI.GetValue(["Lower body yaw target"]) == 1) {
					SetFakeYaw = (UI.GetValue(["Expose fake when exploiting"]) && UI.GetValue(["Rage", "Exploits", "Doubletap"])) ? -42 : 42;
            }
            if (UI.GetValue(["Script items", "Lower body yaw target"]) == 2) {
					SetFakeYaw = (UI.GetValue(["Expose fake when exploiting"]) && UI.GetValue(["Rage", "Exploits", "Doubletap"])) ? 30 : 30;
            }
        }

			if (UI.GetValue(["Script items", "Lower body yaw target"]) == 0) {
                if (Math.floor(Globals.Curtime()) % 5 > 2) {
					SetFakeYaw = UI.GetValue(["Script items", "Fake yaw limit"]);
					SetLBYYaw = UI.GetValue(["Script items", "Fake yaw limit"]) * 2;
				}
				else {
					SetFakeYaw = UI.GetValue(["Script items", "Fake yaw limit"]) * -1;
					SetLBYYaw = UI.GetValue(["Script items", "Fake yaw limit"]) * -2;
				}
            } else if (UI.GetValue(["Script items", "Lower body yaw target"]) == 1) {
                SetLBYYaw = SetFakeYaw * 2;
            } else if (UI.GetValue(["Script items", "Lower body yaw target"]) == 2) {
                SetLBYYaw = SetFakeYaw;
            }
            //SetLBYYaw = clamp(SetLBYYaw, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit") * -2, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit") * 2);
            AntiAim.SetFakeOffset(SetFakeYaw);
            //AntiAim.SetRealOffset(SetRealYaw);
			if (UI.GetValue("Script items", "Lower body yaw target"), 1) {
				UI.SetValue(["Anti-Aim", "Rage Anti-Aim", "Yaw offset", 90]), SetRealYaw - SetFakeYaw;
			}
			else {
        if (isLeftActive || isRightActive) {
          UI.SetValue(["Anti-Aim", "Rage Anti-Aim", "Yaw offset"], SetRealYaw - SetFakeYaw);
        }
        else {
          UI.SetValue(["Anti-Aim", "Rage Anti-Aim", "Yaw offset"], SetRealYaw);
        }
			}
            AntiAim.SetLBYOffset(SetLBYYaw);
        } else {
            AntiAim.SetOverride(0);
        }
    }
    
function player_connect(){
    lastPressed = Global.Tickcount();
    oldTick = Global.Tickcount();
}

var sx = Global.GetScreenSize()[0] / 2;
var sy = Global.GetScreenSize()[1] / 2;
var dtactive = false;
var hasinverted = false;
var cachey = 0;
var cacheyj = 0;
var cacheyjv = 0;
var cacheby = 0;
var cachebyv = 0;
var cachelby = 0;
var cachefyl = 0;
function onDraw() {
        if(!World.GetServerString() || Entity.IsAlive(Entity.GetLocalPlayer()) == false) return;
        
        var font = Render.AddFont("Verdana", 8, 400);
        var fontbig = Render.AddFont("Calibrib.ttf", 18, 700);
        var offset = 0;
        var flip = false;
        if (UI.GetValue(["Anti-aim display mode"]) == 1) {
            if (UI.GetValue(["Script items", "Freestand body yaw"]) != 0 && UI.GetValue(["Script items", "Freestanding body yaw hotkey"])) {
                if (left_distance < 600 && right_distance < 600) {
                    if (fontalpha < 1)
                        fontalpha += Globals.Frametime() * 8;   
                }
                else {
                    if (fontalpha > 0)
                        fontalpha -= Globals.Frametime() * 8;
                }
            }
            
            else {
                fontalpha = 1;
            }
            if (UI.GetValue("Freestand body yaw") == 0) {
                    if (UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter"))
                        flip = true;
                    else
                        flip = false;
            }
            else {
                if (UI.GetValue(["Freestanding body yaw hotkey"])) {
                    if (left_distance < right_distance && UI.GetValue(["Freestand body yaw"]) != 0)
                        flip = false;
                    else
                        flip = true;
                }
                else {
                    if (left_distance < right_distance && UI.GetValue(["Freestand body yaw"]) != 0)
                        flip = true;
                    else
                        flip = false;
                }
            }
            
        }
        else {
            if (leftWasPressed || rightWasPressed) {
                if (fontalpha < 1)
                fontalpha += Globals.Frametime() * 8;
            }
                
            else {
                if (fontalpha > 0)
                fontalpha -= Globals.Frametime() * 8;
            }   

            if (leftWasPressed)
                flip = true;
        }

        if (UI.GetValue(["Rage", "Exploits", "Double tap"])) {
            if (!dtactive) {
                dtactive = true;
                var cachey = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Yaw");
                var cacheyj = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Yaw jitter");
                var cacheyjv = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Yaw jitter value");
                var cacheby = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Body yaw");
                var cachebyv = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Body yaw value");
                var cachelby = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Lower body yaw target");
                var cachefyl = UI.GetValue("Misc", "JAVASCRIPT", "Script items", "Fake yaw limit");
            }
            
            if (!leftWasPressed && !rightWasPressed) {
                 //left
                if (UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter")) {
					if (UI.IsHotkeyActives(["Misc", "JAVASCRIPT", "Script items", "Lowerize fake yaw limit"]))
						UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw"], -45);
					else
						UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw"], 30);
                }
                //right
                else {
                    UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw"], -45);
                }
            }
            
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw jitter"], 0);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw jitter value"], 0);
            if (offset == 90 && offset == -90)
                UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Lower body yaw target"], 2);
            else
                UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Lower body yaw target"], cachelby);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Fake yaw limit"], 60);
        }
        else if (!UI.GetValue(["Rage", "Exploits", "Double tap"]) && dtactive) {
            dtactive = false;
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw"], 0);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw jitter"], cacheyj);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Yaw jitter value"], cacheyjv);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Lower body yaw target"], cachelby);
            UI.SetValue(["Misc", "JAVASCRIPT", "Script items", "Fake yaw limit"], cachefyl);
        }
        
        Render.StringCustom(sx-50, sy - 13, 1,  "<", flip ? [189, 74, 120, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120], fontbig);
        if (UI.GetValue(["Anti-aim display mode"]) == 0) {
            if (UI.GetValue(["Anti-aim display mode"]) == 1)
             Render.StringCustom(sx+50, sy - 13, 1,  ">", (drawLeft || drawRight) ? (!flip ? [189, 74, 120, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120]) : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120], fontbig);
        }
        Render.StringCustom(sx+50, sy - 13, 1,  ">", (!flip ? [189, 74, 120, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120]), fontbig);
        if (UI.GetValue(["Indicate cheat state"])) {
        Render.StringCustom(sx + 1, sy + 50 + 1 + offset, 1, UI.IsHotkeyActive("Script items", "Lowerize fake yaw limit") ? "LOW DELTA" : (UI.GetValue(["Enable jitter when running"]) && getVelocity() > 110) ? "JITTER WALK" : "IDEAL YAW", [0, 0, 0, 225], font);
        Render.StringCustom(sx, sy + 50 + offset, 1, UI.IsHotkeyActive("Script items", "Lowerize fake yaw limit") ? "LOW DELTA" : (UI.GetValue(["Enable jitter when running"]) && getVelocity() > 110) ? "JITTER WALK" : "IDEAL YAW", [230, 156, 21, 255], font);
        offset += 10;
        if (UI.GetValue(["Freestand body yaw"]) == 0) {
            if (UI.GetValue(["Anti-aim display mode"]) == 0) {
                Render.StringCustom(sx + 1, sy + 52 + 1 + offset, 1, (UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter")) ? "LEFT" : "RIGHT", [0, 0, 0, 255], font);
                Render.StringCustom(sx, sy + 52 + offset, 1, (UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter")) ? "LEFT" : "RIGHT", [156, 121, 224, 255], font);
                offset += 10;
            }
            else if (UI.GetValue(["Anti-aim display mode"]) == 1 && (leftWasPressed || rightWasPressed)) {
                Render.StringCustom(sx + 1, sy + 52 + 1 + offset, 1, leftWasPressed ? "LEFT" : "RIGHT", [0, 0, 0, 255], font);
                Render.StringCustom(sx, sy + 52 + offset, 1, leftWasPressed ? "LEFT" : "RIGHT", [156, 121, 224, 255], font);
                offset += 10;
            }
            else {
                Render.StringCustom(sx + 1, sy + 52 + 1 + offset, 1, "FAKE YAW", [0, 0, 0, 255], font);
                Render.StringCustom(sx, sy + 52 + offset, 1, "FAKE YAW", [156, 121, 224, 255], font);
                offset += 10;
            }
        }
        else {
            Render.StringCustom(sx + 1, sy + 52 + 1 + offset, 1, "DYNAMIC", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 52 + offset, 1, "DYNAMIC", [156, 121, 224, 255], font);
            offset += 10;
        }
        if (UI.IsHotkeyActive("Rage", "Exploits", "Doubletap")) {
            Render.StringCustom(sx + 1, sy + 53.2 + 1 + offset, 1, "DT", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 53.2 + offset, 1, "DT", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.IsHotkeyActive("Rage", "Exploits", "Hide shots")) {
            Render.StringCustom(sx + 1, sy + 54 + 1 + offset, 1, "ONSHOT", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 54 + offset, 1, "ONSHOT", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.IsHotkeyActive("Rage", "General", "Force safe point")) {
            Render.StringCustom(sx + 1, sy + 54 + 1 + offset, 1, "SAFE", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 54 + offset, 1, "SAFE", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.IsHotkeyActive("Rage", "General", "Force body aim")) {
            Render.StringCustom(sx + 1, sy + 54 + 1 + offset, 1, "BAIM", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 54 + offset, 1, "BAIM", [224, 99, 60, 255], font);
            offset += 10;
        }
        if (UI.IsHotkeyActive("Script items", "Minimum Damage Override")) {
            Render.StringCustom(sx + 1, sy + 54 + 1 + offset, 1, "DMG", [0, 0, 0, 255], font);
            Render.StringCustom(sx, sy + 54 + offset, 1, "DMG", [232, 232, 232, 255], font);
            offset += 10;
        }
    }
}

function weapon_fire() {

}

var print_color = [89, 119, 255, 255];
var print_color2 = [112, 137, 255, 255];

Cheat.PrintColor(print_color, "wishcord - r_anti_aim.js\n")
Cheat.PrintColor(print_color2, "Build  02.06.2022\n")



Global.RegisterCallback("CreateMove","cm_custom_aa");
Global.RegisterCallback("Draw", "onDraw");
Global.RegisterCallback("weapon_fire", "EVENT_WEAPON_FIRE");
Cheat.RegisterCallback("Unload", "onUnload");
Cheat.RegisterCallback("weapon_fire", "weapon_fire");
Cheat.RegisterCallback("player_connect_full", "player_connect")
Cheat.RegisterCallback("CreateMove", "_TBC_CREATE_MOVE");
Cheat.RegisterCallback("FRAME_NET_UPDATE_START", "_FrameNetUpdateStart");


var time, delay, fillbar, shotsfired;

function can_shift_shot(ticks_to_shift) {
	
    var me = Entity.GetLocalPlayer(); var wpn = Entity.GetWeapon(me);

    if (me == null || wpn == null)
        return false;

    var tickbase = Entity.GetProp(me, "CCSPlayer", "m_nTickBase"); var curtime = Globals.TickInterval() * (tickbase-ticks_to_shift)

    if (curtime < Entity.GetProp(me, "CCSPlayer", "m_flNextAttack"))
        return false;

    if (curtime < Entity.GetProp(wpn, "CBaseCombatWeapon", "m_flNextPrimaryAttack"))
        return false;

    return true;
}

function _TBC_CREATE_MOVE() {
	localplayer_index = Entity.GetLocalPlayer( );
    localplayer_weapon = Entity.GetWeapon(localplayer_index);
    weapon_name = Entity.GetName(localplayer_weapon);
    var is_charged = Exploit.GetCharge()
    if (UI.GetValue("Script items", "Double Tap Improvments", true) && (weapon_name == "scar 20" || weapon_name == "g3sg1" || weapon_name == "awp" || weapon_name == "ssg 08" || weapon_name == "desert eagle")) {
	pistol = weapon_name == "p2000" || weapon_name == "five seven" || weapon_name == "p250" || weapon_name == "usp s" || weapon_name == "dual berettas" || weapon_name == "cz75 auto"  || weapon_name == "tec 9" || weapon_name == "glock 18" || weapon_name == "desert eagle";	
	pistol ? value = 11 : value = 3	
    Exploit[(is_charged != 1 ? "Enable" : "Disable") + "Recharge"]()

    if (can_shift_shot(value != 0 ? value : 14) && is_charged != 1) {
        Exploit.DisableRecharge();
        Exploit.Recharge()
    }
  } else {
	Exploit.EnableRecharge();
  }	
}

function _FrameNetUpdateStart( )
{
    Exploit.OverrideShift(value);
}

function EVENT_WEAPON_FIRE()
{
    iShotsFired = Event.GetInt("userid"); iShotsFired_index = Entity.GetEntityFromUserID(iShotsFired);
 
    if(Entity.GetLocalPlayer() == iShotsFired_index)
    {
        if(UI.IsHotkeyActive("Rage", "GENERAL", "Exploits", "Doubletap", "Enabled") && UI.GetValue("Script items", "Double Tap Improvments", true))
        {			
            if(shotsfired == 0)
            {
                time = Globals.Curtime();
                delay = time+0.3;
                fillbar = 0;
            }            
        }    
    }    
}
function lowdelta()
{
 var abcd = UI.IsHotkeyActive("Script items", "Lowerize fake yaw limit")
 if (abcd) UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Jitter offset", 34) == UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Yaw offset", -11) == UI.SetValue("Anti-Aim", "Fake Angels", "LBY mode", 2)
 else UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Jitter offset", 8) == UI.SetValue("Anti-Aim", "Rage Anti-Aim", "Yaw offset", 0) == UI.SetValue("Anti-Aim", "Fake Angels", "LBY mode", 1)
}

Global.RegisterCallback("CreateMove", "lowdelta");


//frametick switch
var frame = 0;

function fakelags()
{
    frame++;    if(frame == 50) frame = 1;   
    if (frame >= 25 && frame <= 50)    UI.SetValue( "Anti-Aim", "Fake-Lag", "Enabled", true );   
    else UI.SetValue( "Anti-Aim", "Fake-Lag", "Enabled", false );
}

Global.RegisterCallback("CreateMove", "fakelags");

var drawLeft = 0; drawNotActive = 1;
var drawRight = 0;

var leftWasPressed = false; var rightWasPressed = false;

var oldTick = 0
var lastPressed = 0
var isNotActive = false

function ManualAA(){
    isLeftActive = UI.IsHotkeyActive( "Misc", "JAVASCRIPT", "Script items", "Left" );
    isRightActive = UI.IsHotkeyActive( "Misc", "JAVASCRIPT", "Script items", "Right" );
    isInverter = UI.IsHotkeyActive("Anti-Aim", "Fake angles", "Inverter");

    if(isLeftActive && leftWasPressed == false)
    {
        lastPressed = Global.Tickcount();
        isNotActive = false;
        leftWasPressed = true;
        rightWasPressed = false;
        drawLeft = 1;
        drawRight = 0;
        UI.SetValue( "Yaw", -90 );
    } else if( isLeftActive && leftWasPressed == true && Global.Tickcount() > lastPressed + 16 ) {
        isNotActive = true;
        oldTick = Global.Tickcount();
    }

    if(isRightActive && rightWasPressed == false)
    {
        lastPressed = Global.Tickcount();
        isNotActive = false;
        leftWasPressed = false;
        rightWasPressed = true;
        drawLeft = 0;
        drawRight = 1;
        UI.SetValue( "Yaw", 90 );
 
    } else if(isRightActive && rightWasPressed == true && Global.Tickcount() > lastPressed + 16){
        isNotActive = true;
        oldTick = Global.Tickcount();
    }

    if (isNotActive) {
        if (Global.Tickcount() > oldTick + 16)  {
            rightWasPressed = false;
            leftWasPressed = false;
            oldTick = Global.Tickcount();
        }
 
        drawLeft = 0;
        drawRight = 0;
        UI.SetValue("Yaw", 0 );
    }

    }
function player_connect(){
    lastPressed = Global.Tickcount();
    oldTick = Global.Tickcount();
}

Cheat.RegisterCallback("CreateMove", "ManualAA");