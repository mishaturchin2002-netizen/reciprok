"""Batch V6 geometry by functional layer and material for browser toggles."""
from pathlib import Path
import bpy
import bmesh

root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root.parent/"FINAL_RELEASE/CAD/Reciprok_V6.blend"))
bridge=list(bpy.data.collections["BRIDGE"].objects)
bpy.ops.object.select_all(action="DESELECT")
groups={}
for o in bridge:
    label="deck" if o["group"]=="Deck" else "rail" if o["group"]=="Guard" else "supports" if o["group"]=="DeckSupports" else "core"
    groups.setdefault((label,o["material_key"]),[]).append(o)
palette={"GLULAM":(.55,.29,.12),"DECK":(.26,.12,.049),"GALV":(.48,.53,.53),"STEEL":(.13,.17,.20),
         "ORANGE":(.76,.27,.12),"CONCRETE":(.46,.45,.41),"GUARD_MESH":(.25,.26,.27),"DECK_EDGE":(.13,.15,.16)}
for (label,key),parts in groups.items():
    bm=bmesh.new()
    for obj in parts:
        bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000002)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    mesh=bpy.data.meshes.new(label+"_"+key)
    bm.to_mesh(mesh)
    bm.free()
    mat=bpy.data.materials.new(label+"_"+key)
    mat.use_nodes=True
    bs=mat.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*palette[key],1)
    bs.inputs["Metallic"].default_value=.38 if key in ("GALV","STEEL","GUARD_MESH","DECK_EDGE") else 0
    bs.inputs["Roughness"].default_value=.57
    mesh.materials.append(mat)
    obj=bpy.data.objects.new(label+"_"+key,mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/"assets/reciprok.glb"),use_selection=True,
    export_texcoords=False,export_draco_mesh_compression_enable=True,
    export_draco_position_quantization=17)