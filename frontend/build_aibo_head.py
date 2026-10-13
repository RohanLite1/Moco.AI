"""
Blender 5.2 Automation Script: High-Fidelity Robotic Dog Head Model
Generates a complete Sony Aibo styled robotic dog head with:
- Cranium & Skull with glossy ceramic white chassis
- Champagne contoured Faceplate & Snout
- Contoured OLED Eye Sockets with glowing emissive Cyan OLED iris displays
- Rounded Floppy/Paddle Ears with mechanical hinges
- Button Sensor Nose with front camera lens element
- Articulated Jaw Seam & Chin
- Sleek Neck Collar Base Mount
Exports directly to frontend/public/models/aibo.glb
"""

import bpy
import bmesh
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # Remove all collections and objects
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh, do_unlink=True)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat, do_unlink=True)

def create_pbr_material(name, base_color=(1, 1, 1, 1), roughness=0.2, metallic=0.0, emission_color=(0, 0, 0, 1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    
    if bsdf:
        # Base Color
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = base_color
            
        # Roughness
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
            
        # Metallic
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
            
        # Specular IOR Level / Specular
        for spec_key in ["Specular IOR Level", "Specular", "Specular Tint"]:
            if spec_key in bsdf.inputs:
                bsdf.inputs[spec_key].default_value = 0.5
                break

        # Emission
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

def build_model():
    # -------------------------------------------------------------------------
    # 1. PBR MATERIALS
    # -------------------------------------------------------------------------
    mat_white = create_pbr_material("Aibo_White_Chassis", base_color=(0.96, 0.97, 0.98, 1.0), roughness=0.15, metallic=0.12)
    mat_champagne = create_pbr_material("Aibo_Champagne_Face", base_color=(0.86, 0.83, 0.78, 1.0), roughness=0.25, metallic=0.08)
    mat_dark_trim = create_pbr_material("Aibo_Dark_Trim", base_color=(0.04, 0.06, 0.10, 1.0), roughness=0.22, metallic=0.65)
    mat_brown_ear = create_pbr_material("Aibo_Brown_Ear", base_color=(0.24, 0.16, 0.12, 1.0), roughness=0.30, metallic=0.18)
    
    # Glowing OLED Iris Material
    mat_oled_glow = create_pbr_material(
        "Aibo_OLED_Glow",
        base_color=(0.02, 0.75, 0.95, 1.0),
        roughness=0.08,
        metallic=0.1,
        emission_color=(0.0, 0.85, 1.0, 1.0),
        emission_strength=3.2
    )
    mat_oled_pupil = create_pbr_material("Aibo_OLED_Pupil", base_color=(0.01, 0.02, 0.05, 1.0), roughness=0.05, metallic=0.2)
    mat_lens = create_pbr_material("Aibo_Camera_Lens", base_color=(0.01, 0.45, 0.75, 1.0), roughness=0.05, metallic=0.8, emission_color=(0.0, 0.5, 0.9, 1.0), emission_strength=1.5)

    created_objects = []

    # -------------------------------------------------------------------------
    # 2. MAIN CRANIUM / SKULL (Glossy White Ceramic Pearlescent)
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=1.0, location=(0, -0.15, 0.05))
    skull = bpy.context.active_object
    skull.name = "Aibo_Skull"
    skull.scale = (1.12, 1.18, 1.06)
    skull.data.materials.append(mat_white)
    apply_smooth(skull)
    add_subsurf(skull, levels=1)
    created_objects.append(skull)

    # -------------------------------------------------------------------------
    # 3. FRONT FACEPLATE MASK (Champagne Pearlescent)
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.96, location=(0, 0.18, 0.02))
    faceplate = bpy.context.active_object
    faceplate.name = "Aibo_Faceplate"
    faceplate.scale = (1.08, 1.14, 0.98)
    faceplate.data.materials.append(mat_champagne)
    apply_smooth(faceplate)
    add_subsurf(faceplate, levels=1)
    created_objects.append(faceplate)

    # -------------------------------------------------------------------------
    # 4. SNOUT & MUZZLE (Champagne)
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.58, location=(0, 0.82, -0.18))
    snout = bpy.context.active_object
    snout.name = "Aibo_Snout"
    snout.scale = (1.14, 1.28, 0.82)
    snout.data.materials.append(mat_champagne)
    apply_smooth(snout)
    add_subsurf(snout, levels=1)
    created_objects.append(snout)

    # -------------------------------------------------------------------------
    # 5. BUTTON SENSOR NOSE & CAMERA LENS APERTURE
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.18, location=(0, 1.36, -0.05))
    nose = bpy.context.active_object
    nose.name = "Aibo_Nose_Button"
    nose.scale = (1.20, 0.90, 0.86)
    nose.data.materials.append(mat_dark_trim)
    apply_smooth(nose)
    created_objects.append(nose)

    # Camera Lens Rim on Nose tip
    bpy.ops.mesh.primitive_torus_add(major_radius=0.048, minor_radius=0.012, major_segments=24, minor_segments=16, location=(0, 1.48, -0.05))
    lens_rim = bpy.context.active_object
    lens_rim.name = "Aibo_Camera_Rim"
    lens_rim.rotation_euler = (math.radians(90), 0, 0)
    lens_rim.data.materials.append(mat_dark_trim)
    apply_smooth(lens_rim)
    created_objects.append(lens_rim)

    # Glowing Camera Lens Glass
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.038, location=(0, 1.485, -0.05))
    lens_glass = bpy.context.active_object
    lens_glass.name = "Aibo_Camera_Glass"
    lens_glass.scale = (1.0, 0.35, 1.0)
    lens_glass.rotation_euler = (math.radians(90), 0, 0)
    lens_glass.data.materials.append(mat_lens)
    apply_smooth(lens_glass)
    created_objects.append(lens_glass)

    # -------------------------------------------------------------------------
    # 6. MOUTH SEAM & LOWER CHIN
    # -------------------------------------------------------------------------
    # Mouth groove
    bpy.ops.mesh.primitive_cylinder_add(radius=0.009, depth=0.44, vertices=16, location=(0, 1.12, -0.27))
    mouth = bpy.context.active_object
    mouth.name = "Aibo_Mouth_Seam"
    mouth.rotation_euler = (0, math.radians(90), 0)
    mouth.data.materials.append(mat_dark_trim)
    apply_smooth(mouth)
    created_objects.append(mouth)

    # Sculpted Puppy Chin
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.42, location=(0, 0.78, -0.34))
    chin = bpy.context.active_object
    chin.name = "Aibo_Chin"
    chin.scale = (1.10, 1.20, 0.60)
    chin.data.materials.append(mat_champagne)
    apply_smooth(chin)
    created_objects.append(chin)

    # -------------------------------------------------------------------------
    # 7. CONTOURED OLED EYE SOCKETS & GLOWING OLED EYE DISPLAYS
    # -------------------------------------------------------------------------
    eye_offset_x = 0.46
    eye_offset_y = 0.90
    eye_offset_z = 0.22
    eye_radius = 0.25

    for side, sign in [("Left", -1), ("Right", 1)]:
        # Dark Socket Bezel / Ring
        bpy.ops.mesh.primitive_torus_add(
            major_radius=eye_radius + 0.025,
            minor_radius=0.035,
            major_segments=32,
            minor_segments=16,
            location=(sign * eye_offset_x, eye_offset_y + 0.02, eye_offset_z)
        )
        socket_rim = bpy.context.active_object
        socket_rim.name = f"Aibo_Eye_Socket_Rim_{side}"
        socket_rim.rotation_euler = (math.radians(82), sign * math.radians(14), 0)
        socket_rim.data.materials.append(mat_dark_trim)
        apply_smooth(socket_rim)
        created_objects.append(socket_rim)

        # Deep Obsidian OLED Display Screen Plate
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=24,
            radius=eye_radius,
            location=(sign * eye_offset_x, eye_offset_y, eye_offset_z)
        )
        eye_screen = bpy.context.active_object
        eye_screen.name = f"Aibo_OLED_Screen_{side}"
        eye_screen.scale = (1.0, 0.45, 1.0)
        eye_screen.rotation_euler = (math.radians(82), sign * math.radians(14), 0)
        eye_screen.data.materials.append(mat_oled_pupil)
        apply_smooth(eye_screen)
        created_objects.append(eye_screen)

        # Glowing OLED Iris Ring (Radiant Cyan Emission)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=eye_radius * 0.65,
            minor_radius=0.022,
            major_segments=32,
            minor_segments=16,
            location=(sign * eye_offset_x, eye_offset_y + 0.04, eye_offset_z)
        )
        iris_ring = bpy.context.active_object
        iris_ring.name = f"Aibo_OLED_Iris_{side}"
        iris_ring.rotation_euler = (math.radians(82), sign * math.radians(14), 0)
        iris_ring.data.materials.append(mat_oled_glow)
        apply_smooth(iris_ring)
        created_objects.append(iris_ring)

        # Specular Catchlight Sparkle (Gives live organic soul to eyes)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=12,
            radius=0.038,
            location=(sign * eye_offset_x - sign * 0.05, eye_offset_y + 0.065, eye_offset_z + 0.05)
        )
        sparkle = bpy.context.active_object
        sparkle.name = f"Aibo_Eye_Catchlight_{side}"
        sparkle.data.materials.append(create_pbr_material(f"Sparkle_{side}", base_color=(1, 1, 1, 1), emission_color=(1, 1, 1, 1), emission_strength=4.0))
        apply_smooth(sparkle)
        created_objects.append(sparkle)

    # -------------------------------------------------------------------------
    # 8. ROUNDED FLOPPY / PADDLE EARS & MECHANICAL HINGES
    # -------------------------------------------------------------------------
    for side, sign in [("Left", -1), ("Right", 1)]:
        hinge_loc = (sign * 0.95, -0.05, 0.70)
        
        # Cylindrical Ear Hinge Joint
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.14,
            depth=0.18,
            vertices=24,
            location=hinge_loc
        )
        hinge = bpy.context.active_object
        hinge.name = f"Aibo_Ear_Hinge_{side}"
        hinge.rotation_euler = (0, math.radians(90), 0)
        hinge.data.materials.append(mat_dark_trim)
        apply_smooth(hinge)
        created_objects.append(hinge)

        # Sculpted Rounded Paddle Ear
        # We start with a scaled & curved cylinder/sphere deformed into a teardrop paddle
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=24,
            radius=0.55,
            location=(sign * 1.15, -0.08, 0.15)
        )
        ear = bpy.context.active_object
        ear.name = f"Aibo_Ear_Paddle_{side}"
        # Paddle shape: flattened thickness, stretched length, tapered width
        ear.scale = (0.24, 0.65, 1.25)
        # Angled and rotated naturally like soft puppy ears
        ear.rotation_euler = (
            math.radians(-10),
            sign * math.radians(28),
            sign * math.radians(16)
        )
        ear.data.materials.append(mat_brown_ear)
        apply_smooth(ear)
        add_subsurf(ear, levels=1)
        created_objects.append(ear)

    # -------------------------------------------------------------------------
    # 9. CYBER COLLAR & NECK MOUNT BASE
    # -------------------------------------------------------------------------
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.72,
        minor_radius=0.08,
        major_segments=36,
        minor_segments=16,
        location=(0, -0.22, -0.92)
    )
    collar = bpy.context.active_object
    collar.name = "Aibo_Collar_Base"
    collar.scale = (1.1, 1.15, 0.9)
    collar.data.materials.append(mat_dark_trim)
    apply_smooth(collar)
    created_objects.append(collar)

    # Glowing Collar Beacon Ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.74,
        minor_radius=0.02,
        major_segments=36,
        minor_segments=12,
        location=(0, -0.22, -0.92)
    )
    collar_glow = bpy.context.active_object
    collar_glow.name = "Aibo_Collar_Glow_Ring"
    collar_glow.scale = (1.1, 1.15, 0.9)
    collar_glow.data.materials.append(mat_oled_glow)
    apply_smooth(collar_glow)
    created_objects.append(collar_glow)

    # -------------------------------------------------------------------------
    # 10. ROOT PARENT & SCALE NORMALIZATION
    # -------------------------------------------------------------------------
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "Aibo_Root"

    for obj in created_objects:
        obj.parent = root

    # Orient so face points directly forward (+Z) in glTF/Three.js camera view
    root.rotation_euler = (0, 0, math.radians(180))

    return root

def export_glb(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Select all objects to export
    bpy.ops.object.select_all(action='SELECT')
    
    # Export glTF binary (.glb)
    print(f"Exporting GLB to: {output_path}")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True
    )
    print("Export Complete!")

if __name__ == "__main__":
    reset_scene()
    root_obj = build_model()
    
    output_glb_path = os.path.abspath(r"c:\Users\Hp\Desktop\moco.ai\frontend\public\models\aibo.glb")
    export_glb(output_glb_path)
