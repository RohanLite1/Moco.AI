"""
Blender 5.2 Automation Script: Exact Replica of Reference Robotic Puppy Head
Matches the uploaded reference image:
- Smooth, glossy pearlescent white robotic puppy cranium with chubby cheeks
- Forehead crest with curved glowing Cyan LED light notch
- Large, adorable OLED eyes with deep sockets, glowing cyan crescent irises & catchlight glints
- Expressive curved dark robotic eyebrows
- 4 precision sensor pinholes on the nose bridge
- Smooth black button nose & sweet curved mouth seam
- Two-tone floppy curved puppy ears (glossy white outer shell + metallic titanium inner lining)
- Ambient glowing Cyan LED under-jaw seam lights
- Sleek neck joint collar
Exports directly to frontend/public/models/aibo.glb
"""

import bpy
import bmesh
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh, do_unlink=True)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat, do_unlink=True)

def create_pbr_material(name, base_color=(1, 1, 1, 1), roughness=0.15, metallic=0.0, emission_color=(0, 0, 0, 1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = base_color
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
            
        for spec_key in ["Specular IOR Level", "Specular", "Specular Tint"]:
            if spec_key in bsdf.inputs:
                bsdf.inputs[spec_key].default_value = 0.5
                break

        if emission_strength > 0:
            for em_col_key in ["Emission Color", "Emission"]:
                if em_col_key in bsdf.inputs:
                    bsdf.inputs[em_col_key].default_value = emission_color
                    break
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength
                
    return mat

def apply_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

def add_subsurf(obj, levels=2):
    mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    mod.levels = levels
    mod.render_levels = levels

def build_reference_replica():
    # -------------------------------------------------------------------------
    # 1. PBR MATERIALS
    # -------------------------------------------------------------------------
    # Glossy Pearlescent White Ceramic Shell
    mat_white = create_pbr_material(
        "Ref_White_Ceramic",
        base_color=(0.95, 0.96, 0.98, 1.0),
        roughness=0.10,
        metallic=0.05
    )

    # Sleek Metallic Titanium / Graphite (Inner ear, socket trim, eyebrows)
    mat_titanium = create_pbr_material(
        "Ref_Dark_Titanium",
        base_color=(0.14, 0.16, 0.20, 1.0),
        roughness=0.20,
        metallic=0.75
    )

    # Satin Smooth Black Button Nose
    mat_nose = create_pbr_material(
        "Ref_Black_Nose",
        base_color=(0.04, 0.05, 0.07, 1.0),
        roughness=0.30,
        metallic=0.20
    )

    # Deep Glossy Obsidian OLED Screen
    mat_oled_black = create_pbr_material(
        "Ref_OLED_Black",
        base_color=(0.015, 0.02, 0.04, 1.0),
        roughness=0.04,
        metallic=0.10
    )

    # Vibrant Radiant Cyan LED Emission (Eyes, Forehead Notch, Under-Jaw)
    mat_cyan_led = create_pbr_material(
        "Ref_Cyan_LED",
        base_color=(0.0, 0.85, 1.0, 1.0),
        roughness=0.05,
        metallic=0.0,
        emission_color=(0.0, 0.92, 1.0, 1.0),
        emission_strength=4.8
    )

    # Pure White Catchlight Sparkles
    mat_sparkle = create_pbr_material(
        "Ref_Catchlight",
        base_color=(1.0, 1.0, 1.0, 1.0),
        roughness=0.0,
        emission_color=(1.0, 1.0, 1.0, 1.0),
        emission_strength=5.0
    )

    created_objects = []

    # -------------------------------------------------------------------------
    # 2. MAIN SKULL & CHUBBY CHEEKS (Smooth Glossy White)
    # -------------------------------------------------------------------------
    # Main Cranium Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=1.0, location=(0, 0, 0.08))
    skull = bpy.context.active_object
    skull.name = "Ref_Skull"
    # Adorable puppy proportions: slightly wider at cheeks, deep front-to-back
    skull.scale = (1.18, 1.15, 1.08)
    skull.data.materials.append(mat_white)
    apply_smooth(skull)
    add_subsurf(skull, levels=1)
    created_objects.append(skull)

    # Chubby Lower Cheeks & Face Contour
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=28, radius=0.88, location=(0, 0.22, -0.12))
    cheeks = bpy.context.active_object
    cheeks.name = "Ref_Cheeks"
    cheeks.scale = (1.22, 1.12, 0.85)
    cheeks.data.materials.append(mat_white)
    apply_smooth(cheeks)
    add_subsurf(cheeks, levels=1)
    created_objects.append(cheeks)

    # Rounded Soft Puppy Muzzle
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.62, location=(0, 0.72, -0.22))
    muzzle = bpy.context.active_object
    muzzle.name = "Ref_Muzzle"
    muzzle.scale = (1.10, 1.18, 0.78)
    muzzle.data.materials.append(mat_white)
    apply_smooth(muzzle)
    add_subsurf(muzzle, levels=1)
    created_objects.append(muzzle)

    # -------------------------------------------------------------------------
    # 3. FOREHEAD NOTCH & GLOWING CYAN LED CREST LIGHT
    # -------------------------------------------------------------------------
    # Forehead Ridge / Crest Shell Cap
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.68, location=(0, 0.38, 0.76))
    crest_cap = bpy.context.active_object
    crest_cap.name = "Ref_Forehead_Crest_Cap"
    crest_cap.scale = (0.75, 0.95, 0.55)
    crest_cap.data.materials.append(mat_white)
    apply_smooth(crest_cap)
    created_objects.append(crest_cap)

    # Forehead Notch Cutout Trim (Dark titanium recess seam)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.28,
        minor_radius=0.035,
        major_segments=32,
        minor_segments=16,
        location=(0, 0.62, 0.78)
    )
    notch_trim = bpy.context.active_object
    notch_trim.name = "Ref_Forehead_Notch_Trim"
    notch_trim.scale = (0.9, 0.35, 0.6)
    notch_trim.rotation_euler = (math.radians(35), 0, 0)
    notch_trim.data.materials.append(mat_titanium)
    apply_smooth(notch_trim)
    created_objects.append(notch_trim)

    # Luminous Cyan LED Light Bar in Forehead Notch
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.22,
        minor_radius=0.026,
        major_segments=32,
        minor_segments=16,
        location=(0, 0.63, 0.79)
    )
    notch_led = bpy.context.active_object
    notch_led.name = "Ref_Forehead_Notch_LED"
    notch_led.scale = (0.85, 0.30, 0.55)
    notch_led.rotation_euler = (math.radians(35), 0, 0)
    notch_led.data.materials.append(mat_cyan_led)
    apply_smooth(notch_led)
    created_objects.append(notch_led)

    # -------------------------------------------------------------------------
    # 4. LARGE EXPRESSIVE ROBOTIC PUPPY OLED EYES
    # -------------------------------------------------------------------------
    # Look at the reference: the eyes are large, soulfully round, with deep sockets
    eye_x = 0.50
    eye_y = 0.76
    eye_z = 0.12
    eye_r = 0.38

    for side, sign in [("Left", -1), ("Right", 1)]:
        # Dark Titanium Socket Bezel (Outer ring framing the OLED screen)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=eye_r + 0.022,
            minor_radius=0.042,
            major_segments=36,
            minor_segments=16,
            location=(sign * eye_x, eye_y + 0.02, eye_z)
        )
        bezel = bpy.context.active_object
        bezel.name = f"Ref_Eye_Socket_Bezel_{side}"
        bezel.rotation_euler = (math.radians(82), sign * math.radians(16), 0)
        bezel.data.materials.append(mat_titanium)
        apply_smooth(bezel)
        created_objects.append(bezel)

        # Deep Glossy Obsidian OLED Screen Dome
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=36,
            ring_count=28,
            radius=eye_r,
            location=(sign * eye_x, eye_y, eye_z)
        )
        screen = bpy.context.active_object
        screen.name = f"Ref_OLED_Screen_{side}"
        screen.scale = (1.0, 0.42, 1.0)
        screen.rotation_euler = (math.radians(82), sign * math.radians(16), 0)
        screen.data.materials.append(mat_oled_black)
        apply_smooth(screen)
        created_objects.append(screen)

        # Radiant Glowing Cyan Iris Arc / Lower Crescent
        # This gives the signature glowing blue ring seen in the reference image
        bpy.ops.mesh.primitive_torus_add(
            major_radius=eye_r * 0.72,
            minor_radius=0.038,
            major_segments=36,
            minor_segments=16,
            location=(sign * eye_x, eye_y + 0.042, eye_z - 0.04)
        )
        iris_arc = bpy.context.active_object
        iris_arc.name = f"Ref_Cyan_Iris_Arc_{side}"
        iris_arc.rotation_euler = (math.radians(82), sign * math.radians(16), 0)
        iris_arc.scale = (1.0, 1.0, 0.75)
        iris_arc.data.materials.append(mat_cyan_led)
        apply_smooth(iris_arc)
        created_objects.append(iris_arc)

        # Inner pupil ring aperture
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=24,
            ring_count=16,
            radius=eye_r * 0.48,
            location=(sign * eye_x, eye_y + 0.05, eye_z + 0.02)
        )
        pupil = bpy.context.active_object
        pupil.name = f"Ref_Pupil_Core_{side}"
        pupil.scale = (1.0, 0.35, 1.0)
        pupil.data.materials.append(mat_oled_black)
        apply_smooth(pupil)
        created_objects.append(pupil)

        # Major Specular Catchlight Sparkle (Top-right of eye dome)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=12,
            radius=0.052,
            location=(sign * eye_x - sign * 0.07, eye_y + 0.085, eye_z + 0.12)
        )
        sparkle1 = bpy.context.active_object
        sparkle1.name = f"Ref_Catchlight_Main_{side}"
        sparkle1.data.materials.append(mat_sparkle)
        apply_smooth(sparkle1)
        created_objects.append(sparkle1)

        # Secondary Micro-Sparkle (Lower-left glint)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=10,
            radius=0.024,
            location=(sign * eye_x + sign * 0.08, eye_y + 0.085, eye_z - 0.08)
        )
        sparkle2 = bpy.context.active_object
        sparkle2.name = f"Ref_Catchlight_Sub_{side}"
        sparkle2.data.materials.append(mat_sparkle)
        apply_smooth(sparkle2)
        created_objects.append(sparkle2)

        # Cute Curved Dark Eyebrow Mark above Eye
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.18,
            minor_radius=0.026,
            major_segments=24,
            minor_segments=12,
            location=(sign * (eye_x - 0.06), eye_y + 0.08, eye_z + 0.46)
        )
        eyebrow = bpy.context.active_object
        eyebrow.name = f"Ref_Eyebrow_{side}"
        eyebrow.scale = (1.1, 0.4, 0.6)
        eyebrow.rotation_euler = (math.radians(70), sign * math.radians(-18), sign * math.radians(12))
        eyebrow.data.materials.append(mat_titanium)
        apply_smooth(eyebrow)
        created_objects.append(eyebrow)

    # -------------------------------------------------------------------------
    # 5. NOSE BRIDGE SENSOR PINHOLES (4 Tiny Precision Sensor Apertures)
    # -------------------------------------------------------------------------
    sensor_coords = [
        (-0.06, 0.94, 0.16),
        (-0.06, 0.96, 0.10),
        (0.06, 0.94, 0.16),
        (0.06, 0.96, 0.10)
    ]
    for idx, (sx, sy, sz) in enumerate(sensor_coords):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.012,
            depth=0.05,
            vertices=12,
            location=(sx, sy, sz)
        )
        sensor = bpy.context.active_object
        sensor.name = f"Ref_Bridge_Sensor_{idx+1}"
        sensor.rotation_euler = (math.radians(90), 0, 0)
        sensor.data.materials.append(mat_titanium)
        apply_smooth(sensor)
        created_objects.append(sensor)

    # -------------------------------------------------------------------------
    # 6. BUTTON SENSOR NOSE & SWEET MOUTH SEAM
    # -------------------------------------------------------------------------
    # Smooth Satin Black Pebble/Button Nose
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=20,
        radius=0.22,
        location=(0, 1.15, -0.16)
    )
    nose = bpy.context.active_object
    nose.name = "Ref_Button_Nose"
    # Soft rounded triangular/pebble puppy nose shape
    nose.scale = (1.18, 0.68, 0.82)
    nose.data.materials.append(mat_nose)
    apply_smooth(nose)
    created_objects.append(nose)

    # Gentle Curved Downward Mouth Seam
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.22,
        minor_radius=0.012,
        major_segments=24,
        minor_segments=12,
        location=(0, 0.94, -0.36)
    )
    mouth = bpy.context.active_object
    mouth.name = "Ref_Mouth_Seam"
    mouth.scale = (0.85, 0.45, 0.7)
    # Subtle downward arc matching the sweet puppy expression in image
    mouth.rotation_euler = (math.radians(-75), 0, 0)
    mouth.data.materials.append(mat_titanium)
    apply_smooth(mouth)
    created_objects.append(mouth)

    # -------------------------------------------------------------------------
    # 7. TWO-TONE FLOPPY CURVED PUPPY EARS (White Outer + Titanium Inner Rim)
    # -------------------------------------------------------------------------
    for side, sign in [("Left", -1), ("Right", 1)]:
        # Outer Pearlescent White Curved Ear Shell
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=36,
            ring_count=24,
            radius=0.62,
            location=(sign * 1.08, 0.02, 0.04)
        )
        outer_ear = bpy.context.active_object
        outer_ear.name = f"Ref_Outer_Ear_Shell_{side}"
        # Tear-drop floppy ear shape draping down the side of cheek, flaring at tip
        outer_ear.scale = (0.34, 0.68, 1.28)
        outer_ear.rotation_euler = (
            math.radians(-8),
            sign * math.radians(24),
            sign * math.radians(14)
        )
        outer_ear.data.materials.append(mat_white)
        apply_smooth(outer_ear)
        add_subsurf(outer_ear, levels=1)
        created_objects.append(outer_ear)

        # Inner Metallic Titanium Ear Inset / Rim
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=20,
            radius=0.55,
            location=(sign * 1.04, 0.08, 0.02)
        )
        inner_ear = bpy.context.active_object
        inner_ear.name = f"Ref_Inner_Ear_Trim_{side}"
        inner_ear.scale = (0.28, 0.62, 1.18)
        inner_ear.rotation_euler = (
            math.radians(-8),
            sign * math.radians(24),
            sign * math.radians(14)
        )
        inner_ear.data.materials.append(mat_titanium)
        apply_smooth(inner_ear)
        created_objects.append(inner_ear)

    # -------------------------------------------------------------------------
    # 8. UNDER-JAW GLOWING CYAN LED LIGHTS (Ambient Underglow)
    # -------------------------------------------------------------------------
    for side, sign in [("Left", -1), ("Right", 1)]:
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.38,
            minor_radius=0.022,
            major_segments=24,
            minor_segments=12,
            location=(sign * 0.42, 0.28, -0.65)
        )
        jaw_glow = bpy.context.active_object
        jaw_glow.name = f"Ref_Jaw_Underglow_{side}"
        jaw_glow.scale = (0.9, 0.35, 0.6)
        jaw_glow.rotation_euler = (math.radians(12), sign * math.radians(35), 0)
        jaw_glow.data.materials.append(mat_cyan_led)
        apply_smooth(jaw_glow)
        created_objects.append(jaw_glow)

    # -------------------------------------------------------------------------
    # 9. SLEEK ROBOTIC NECK JOINT & COLLAR
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.52,
        depth=0.35,
        vertices=32,
        location=(0, -0.05, -0.85)
    )
    neck = bpy.context.active_object
    neck.name = "Ref_Neck_Joint"
    neck.data.materials.append(mat_white)
    apply_smooth(neck)
    created_objects.append(neck)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.54,
        minor_radius=0.045,
        major_segments=32,
        minor_segments=16,
        location=(0, -0.05, -0.98)
    )
    collar_ring = bpy.context.active_object
    collar_ring.name = "Ref_Collar_Ring"
    collar_ring.data.materials.append(mat_titanium)
    apply_smooth(collar_ring)
    created_objects.append(collar_ring)

    # -------------------------------------------------------------------------
    # 10. ROOT PARENTING & ORIENTATION
    # -------------------------------------------------------------------------
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "Ref_Aibo_Root"

    for obj in created_objects:
        obj.parent = root

    # Orient root so face looks directly forward towards camera (+Z in Three.js)
    root.rotation_euler = (0, 0, math.radians(180))

    return root

def export_glb(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    print(f"Exporting Reference Replica GLB to: {output_path}")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True
    )
    print("Export Reference Replica Complete!")

if __name__ == "__main__":
    reset_scene()
    build_reference_replica()
    output_glb_path = os.path.abspath(r"c:\Users\Hp\Desktop\moco.ai\frontend\public\models\aibo.glb")
    export_glb(output_glb_path)
