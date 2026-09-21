"""Editable Cole rig and orthographic sprite study. Run with Blender --background --python."""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT=os.path.join(ROOT,'assets/characters/cole/renders')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
# Muted local colours: lighting is baked only for the comparison, not the game.
def mat(name,color):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF'); shader.inputs['Base Color'].default_value=(*color,1); shader.inputs['Roughness'].default_value=.82
    return m
coat=mat('Charcoal wool',(0.085,.105,.12)); edge=mat('Worn seams',(.17,.20,.21))
lining=mat('Coat lining',(.035,.043,.05)); pants=mat('Trousers',(.055,.066,.08))
boot=mat('Boot leather',(.025,.029,.034)); skin=mat('Skin',(.37,.23,.15))
scarf=mat('Vermilion scarf',(.48,.028,.023)); fold=mat('Scarf shadow',(.24,.012,.012))
brass=mat('Old brass',(.31,.22,.10)); glass=mat('Smoked lenses',(.027,.044,.05))
# Real armature: IK legs, articulated arms, pelvis/spine and separate coat tails.
bpy.ops.object.armature_add(location=(0,0,0)); rig=bpy.context.object; rig.name='Cole_Rig'
bpy.ops.object.mode_set(mode='EDIT'); rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(name,head,tail,parent=None):
    b=rig.data.edit_bones.new(name); b.head=head; b.tail=tail
    if parent: b.parent=rig.data.edit_bones[parent]
    return b
bone('root',(0,0,0),(0,0,.2))
bone('pelvis',(0,0,1.0),(0,0,1.12),'root')
bone('spine',(0,0,1.1),(0,0,1.5),'pelvis')
bone('head',(0,0,1.49),(0,0,1.76),'spine')
for side,y in [('near',-.125),('far',.125)]:
    bone('thigh_'+side,(0,y,1.01),(.035,y,.57),'pelvis')
    bone('shin_'+side,(.035,y,.57),(0,y,.14),'thigh_'+side)
    bone('foot_'+side,(0,y,.14),(.20,y,.14),'shin_'+side)
    bone('upper_'+side,(0,y*1.65,1.45),(.015,y*1.8,1.16),'spine')
    bone('fore_'+side,(.015,y*1.8,1.16),(.04,y*1.8,.93),'upper_'+side)
    bone('tail_'+side,(-.04,y*.8,1.02),(-.06,y*1.15,.70),'pelvis')
bone('scarf',(0,-.02,1.5),(-.23,-.02,1.35),'spine')
bpy.ops.object.mode_set(mode='OBJECT'); rig.show_in_front=True

def bind(obj,name,material):
    obj.data.materials.append(material)
    vg=obj.vertex_groups.new(name=name); vg.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Cole skeleton','ARMATURE'); mod.object=rig
    obj.parent=rig
    return obj

def box(name,loc,scale,material,bn,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Tailored corners','BEVEL'); mod.width=bevel; mod.segments=1
    return bind(o,bn,material)

def ell(name,loc,scale,material,bn):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return bind(o,bn,material)

def segment(name,a,b,r1,r2,material,bn):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r1,radius2=r2,depth=d.length,location=(a+b)/2)
    o=bpy.context.object; o.name=name; o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    return bind(o,bn,material)

ell('Pelvis',(0,0,1.02),(.13,.19,.15),lining,'pelvis')
segment('Coat torso',(0,0,1.02),(0,0,1.45),.18,.225,coat,'spine')
box('Shoulder yoke',(-.025,0,1.43),(.22,.44,.09),coat,'spine')
# Lapels and front seam face forward (+X).
for y in [-.065,.065]:
    o=box('Folded lapel',(.168,y,1.34),(.025,.06,.24),edge,'spine',.005); o.rotation_euler.x= y*2
    box('Pocket welt',(.15,y*1.75,1.12),(.025,.085,.015),edge,'spine',.002)
for z in [1.1,1.21,1.32]: ell('Brass coat button',(.185,0,z),(.018,.018,.018),brass,'spine')
for side,y in [('near',-.125),('far',.125)]:
    segment('Trouser thigh '+side,(0,y,1.0),(.035,y,.56),.086,.095,pants,'thigh_'+side)
    segment('Trouser calf '+side,(.035,y,.56),(0,y,.16),.062,.079,pants,'shin_'+side)
    box('Boot '+side,(.065,y,.085),(.29,.14,.14),boot,'foot_'+side)
    box('Boot sole '+side,(.065,y,.025),(.30,.145,.035),edge,'foot_'+side,.007)
    box('Coat skirt '+side,(-.045,y*.95,.88),(.28,.19,.35),coat,'tail_'+side,.01)
    box('Hem stitching '+side,(-.04,y*1.65,.722),(.24,.012,.016),edge,'tail_'+side,.002)
    segment('Sleeve '+side,(0,y*1.65,1.43),(.015,y*1.8,1.16),.077,.095,coat,'upper_'+side)
    segment('Forearm '+side,(.015,y*1.8,1.16),(.04,y*1.8,.95),.063,.078,coat,'fore_'+side)
    ell('Glove '+side,(.05,y*1.8,.92),(.066,.063,.081),boot,'fore_'+side)
segment('Neck',(0,0,1.46),(0,0,1.58),.065,.065,skin,'head')
ell('Face',(.015,0,1.66),(.10,.105,.135),skin,'head')
ell('Hair at nape',(-.037,0,1.70),(.086,.109,.102),lining,'head')
box('Nose',(.115,0,1.66),(.064,.06,.056),skin,'head',.009)
box('Dark glasses',(.09,0,1.695),(.063,.208,.042),glass,'head',.004)
box('Fedora crown',(-.01,0,1.815),(.25,.23,.135),coat,'head',.035)
box('Crown crease',(-.015,0,1.884),(.14,.032,.009),lining,'head',.003)
ell('Hat brim',(.017,0,1.754),(.205,.165,.019),lining,'head')
ell('Hat band',(0,0,1.778),(.136,.134,.023),boot,'head')
ell('Scarf wrap',(.015,0,1.51),(.14,.14,.052),scarf,'spine')
box('Scarf front drape',(.18,-.04,1.31),(.035,.09,.38),scarf,'spine',.008)
box('Scarf fold',(.20,-.055,1.31),(.008,.015,.34),fold,'spine',.002)
segment('Trailing scarf',(-.04,-.035,1.49),(-.25,-.035,1.35),.039,.045,scarf,'scarf')
# Foot target orientation holds soles parallel with the ground.
targets={}
for side,y in [('near',-.125),('far',.125)]:
    o=bpy.data.objects.new('Foot_target_'+side,None); bpy.context.collection.objects.link(o); o.location=(0,y,.14); targets[side]=o
    ik=rig.pose.bones['shin_'+side].constraints.new('IK'); ik.target=o; ik.chain_count=2
    rig.pose.bones['thigh_'+side].ik_stretch=0; rig.pose.bones['shin_'+side].ik_stretch=0
    # Foot rest bone points +X; align its local Y to +X in world space.
    o.rotation_euler=(0,0,-math.pi/2)
    rot=rig.pose.bones['foot_'+side].constraints.new('COPY_ROTATION'); rot.target=o
for p in rig.pose.bones: p.rotation_mode='XYZ'
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=128; scene.render.resolution_y=192; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=True
scene.render.fps=24
scene.world.color=(.12,.12,.12)
scene.view_settings.view_transform='Standard'
def light(name,loc,color,power,size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o); o.location=loc; o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
light('Warm street key',(3,-4,5),(1,.79,.58),350,4)
light('Cool alley rim',(-2,3,3),(.25,.62,1),450,3)
light('Soft fill',(1,-5,2),(.55,.69,.8),90,3)
d=bpy.data.cameras.new('Orthographic sprite camera'); camera=bpy.data.objects.new('Orthographic sprite camera',d); bpy.context.collection.objects.link(camera)
camera.location=(3,-8,2.8); target=Vector((0,0,1.0)); camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler(); d.type='ORTHO'; d.ortho_scale=2.25; scene.camera=camera
# All four actions are retained in one named timeline, with keyframes and markers.
clips=[('idle',8,0),('walk',12,12),('sprint',12,28),('stop',8,44)]
for name,count,start in clips:
    scene.timeline_markers.new(name,frame=start+1)
    for i in range(count):
        frame=start+i+1; phase=i/count*math.tau
        running=name=='sprint'; moving=name in ('walk','sprint')
        damp=(1-i/(count-1)) if name=='stop' else 1
        stride=(.40 if running else .25) if moving else (.22*damp if name=='stop' else 0)
        p=rig.pose.bones
        for b in p: b.rotation_euler=(0,0,0); b.location=(0,0,0)
        # Pelvis travel is in place; tiny weight shift, no camera movement.
        p['pelvis'].location.z=(.015 if running else .008)*math.cos(phase*2) if moving else .004*math.sin(phase)
        p['spine'].rotation_euler.y=(.16 if running else .035) if moving else (.10*damp if name=='stop' else .008*math.sin(phase))
        p['head'].rotation_euler.y=-p['spine'].rotation_euler.y*.55
        for idx,(side,y) in enumerate([('near',-.125),('far',.125)]):
            ph=phase+idx*math.pi
            x=math.cos(ph)*stride
            lift=max(0,-math.sin(ph))*(.20 if running else .105) if moving else 0
            if name=='stop': x=(1 if idx==0 else -1)*stride
            targets[side].location=(x,y,.14+lift); targets[side].keyframe_insert('location',frame=frame)
            p['upper_'+side].rotation_euler.y=-math.cos(ph)*(.52 if running else .23) if moving else -.08*damp
            p['fore_'+side].rotation_euler.y=-.70 if running else -.12
            p['tail_'+side].rotation_euler.y=-.06 + (math.cos(ph-.4)*(.19 if running else .08) if moving else .02*math.sin(phase))
        p['scarf'].rotation_euler.y=-.25 if running else .06*math.sin(phase-.6)
        for b in p:
            b.keyframe_insert('rotation_euler',frame=frame); b.keyframe_insert('location',frame=frame)
scene.frame_start=1; scene.frame_end=52; scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'assets/characters/cole/cole-study.blend'))
for name,count,start in clips:
    for i in range(count):
        scene.frame_set(start+i+1); scene.render.filepath=os.path.join(OUT,f'{name}-{i:02}.png'); bpy.ops.render.render(write_still=True)
print('COLE_STUDY_COMPLETE')
