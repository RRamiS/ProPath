"""
Render isométrico de habitaciones completas (Blender headless).

Idea central: una sola cámara ortográfica compartida por TODO. La habitación
vacía se renderiza como fondo y cada prop se renderiza aparte, recortado a su
bounding box en pantalla. Como la cámara nunca cambia, los recortes encajan
pixel-perfect sobre el fondo y todas las escalas son coherentes entre sí.

Salida:
  assets/iso/rooms/<venue>.png        fondo (piso + paredes)
  assets/iso/rooms/<venue>/<prop>.png recorte de cada prop
  assets/iso/characters/<role>.png    recorte de cada personaje
  src/room/roomManifest.generated.ts  posiciones normalizadas + mapeo de piso

Uso:
  npm run render:rooms
"""
import json
import math
import os
from pathlib import Path

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
FURN = ROOT / "assets/iso/source/quaternius/furniture/Furniture Pack by @Quaternius/OBJ"
CHARS = ROOT / "assets/iso/source/quaternius/chars/Ultimate Animated Character Pack - Nov 2019/OBJ"
OUT_ROOMS = ROOT / "assets/iso/rooms"
OUT_CHARS = ROOT / "assets/iso/characters"
MANIFEST_TS = ROOT / "src/room/roomManifest.generated.ts"

# Habitación en unidades de mundo: 10 x 10 x 5. El rincón visible es (-5, +5).
ROOM = 5.0
WALL_H = 5.0
RES_X = 1600
RES_Y = 1400
# Ancho proyectado de la caja = (2*ROOM)*sqrt(2); alto = 12.25 con pitch 35.264
ORTHO = 16.2

# ── Paletas por sede ────────────────────────────────────────────────────────
VENUES = {
    "home": {
        "floor": (0.150, 0.104, 0.072),
        "floor_alt": (0.124, 0.086, 0.060),
        "wall_a": (0.118, 0.106, 0.140),
        "wall_b": (0.086, 0.078, 0.106),
        "trim": (0.062, 0.052, 0.044),
        "accent": (0.55, 0.85, 0.25),
    },
    "gym": {
        "floor": (0.082, 0.096, 0.110),
        "floor_alt": (0.066, 0.078, 0.092),
        "wall_a": (0.086, 0.112, 0.126),
        "wall_b": (0.062, 0.082, 0.098),
        "trim": (0.040, 0.052, 0.060),
        "accent": (0.20, 0.80, 0.85),
    },
    "cafe": {
        "floor": (0.140, 0.094, 0.054),
        "floor_alt": (0.116, 0.078, 0.044),
        "wall_a": (0.152, 0.112, 0.072),
        "wall_b": (0.112, 0.082, 0.054),
        "trim": (0.070, 0.048, 0.030),
        "accent": (0.95, 0.65, 0.25),
    },
    "academy": {
        "floor": (0.090, 0.104, 0.130),
        "floor_alt": (0.074, 0.088, 0.114),
        "wall_a": (0.094, 0.122, 0.166),
        "wall_b": (0.066, 0.086, 0.124),
        "trim": (0.042, 0.056, 0.078),
        "accent": (0.30, 0.65, 1.00),
    },
    "arena": {
        "floor": (0.062, 0.050, 0.076),
        "floor_alt": (0.048, 0.040, 0.062),
        "wall_a": (0.086, 0.052, 0.086),
        "wall_b": (0.058, 0.036, 0.062),
        "trim": (0.032, 0.022, 0.036),
        "accent": (1.00, 0.25, 0.45),
    },
}

# ── Layouts: prop -> builder + transform ────────────────────────────────────
# pos = (x, y, z). rot = grados en Z. Los "wall" van pegados a una pared.
LAYOUTS = {
    "home": [
        ("rug", "rug", (0.6, 0.6, 0.0), 0, "floor"),
        ("bed", "bed", (-3.3, 2.4, 0.0), -90, "floor"),
        ("shelf", "shelf", (-4.3, -1.4, 0.0), 90, "floor"),
        ("rig", "rig", (1.4, 3.5, 0.0), 0, "floor"),
        ("cam", "cam", (3.6, 1.4, 0.0), -25, "floor"),
        ("door", "door", (3.6, 4.92, 0.0), 0, "wall"),
        ("tv", "tv", (-1.2, 4.9, 2.6), 0, "wall"),
        ("board", "board", (-4.9, 1.6, 2.7), 90, "wall"),
        ("window", "window", (-4.9, -2.4, 2.5), 90, "wall"),
        ("poster", "poster", (-3.0, 4.9, 2.9), 0, "wall"),
        ("banner", "banner", (-4.9, 3.6, 3.0), 90, "wall"),
    ],
    "gym": [
        ("rug", "rug", (0.4, 0.2, 0.0), 0, "floor"),
        ("bed", "bench", (-3.2, 1.4, 0.0), -90, "floor"),
        ("shelf", "shelf", (-4.3, -1.8, 0.0), 90, "floor"),
        ("rig", "rig", (1.6, 3.4, 0.0), 0, "floor"),
        ("cam", "cam", (3.8, 0.8, 0.0), -30, "floor"),
        ("door", "door", (3.6, 4.92, 0.0), 0, "wall"),
        ("tv", "tv", (-1.4, 4.9, 2.7), 0, "wall"),
        ("board", "board", (-4.9, 2.0, 2.7), 90, "wall"),
        ("window", "window", (-4.9, -2.2, 2.5), 90, "wall"),
        ("poster", "poster", (-3.2, 4.9, 3.0), 0, "wall"),
        ("banner", "banner", (0.8, 4.9, 3.2), 0, "wall"),
    ],
    "cafe": [
        ("rug", "rug", (0.8, 0.4, 0.0), 0, "floor"),
        ("bed", "sofa", (-3.4, 1.8, 0.0), -90, "floor"),
        ("shelf", "shelf", (-4.3, -1.6, 0.0), 90, "floor"),
        ("rig", "table", (1.6, 2.6, 0.0), 0, "floor"),
        ("cam", "plant", (3.9, 3.6, 0.0), 0, "floor"),
        ("door", "door", (3.4, 4.92, 0.0), 0, "wall"),
        ("tv", "tv", (-1.0, 4.9, 2.6), 0, "wall"),
        ("board", "board", (-4.9, 1.4, 2.7), 90, "wall"),
        ("window", "window", (-4.9, -2.6, 2.4), 90, "wall"),
        ("poster", "poster", (-3.2, 4.9, 2.9), 0, "wall"),
        ("banner", "banner", (-4.9, 3.4, 3.1), 90, "wall"),
    ],
    "academy": [
        ("rug", "rug", (0.4, 0.8, 0.0), 0, "floor"),
        ("bed", "sofa", (3.4, -1.6, 0.0), 180, "floor"),
        ("shelf", "shelf", (-4.3, -1.2, 0.0), 90, "floor"),
        ("rig", "rig", (-0.4, 3.4, 0.0), 0, "floor"),
        ("cam", "cam", (3.8, 1.6, 0.0), -30, "floor"),
        ("door", "door", (3.6, 4.92, 0.0), 0, "wall"),
        ("tv", "tv", (2.0, 4.9, 2.7), 0, "wall"),
        ("board", "board", (-4.9, 1.8, 2.7), 90, "wall"),
        ("window", "window", (-4.9, -2.4, 2.5), 90, "wall"),
        ("poster", "poster", (-3.4, 4.9, 3.0), 0, "wall"),
        ("banner", "banner", (-4.9, 3.8, 3.1), 90, "wall"),
    ],
    "arena": [
        ("rug", "rug", (0.2, 0.4, 0.0), 0, "floor"),
        ("bed", "sofa", (3.2, -2.0, 0.0), 180, "floor"),
        ("shelf", "shelf", (-4.3, -2.0, 0.0), 90, "floor"),
        ("rig", "rig", (-0.6, 3.4, 0.0), 0, "floor"),
        ("cam", "cam", (3.9, 1.2, 0.0), -35, "floor"),
        ("door", "door", (3.4, 4.92, 0.0), 0, "wall"),
        ("tv", "tv", (1.8, 4.9, 2.8), 0, "wall"),
        ("board", "board", (-4.9, 1.2, 2.7), 90, "wall"),
        ("window", "window", (-4.9, -2.8, 2.6), 90, "wall"),
        ("poster", "poster", (-3.2, 4.9, 3.1), 0, "wall"),
        ("banner", "banner", (-4.9, 3.6, 3.2), 90, "wall"),
    ],
}

CHAR_MAP = {
    "player": "Casual_Male.obj",
    "duo": "Casual2_Female.obj",
    "coach": "Worker_Male.obj",
    "rival": "Casual3_Male.obj",
    "manager": "Suit_Male.obj",
}

MATERIAL_COLORS = {
    "darkwood": (0.26, 0.16, 0.10),
    "darkbrown": (0.26, 0.16, 0.10),
    "brown": (0.44, 0.28, 0.15),
    "wood": (0.58, 0.40, 0.22),
    "sheets": (0.80, 0.83, 0.90),
    "pages": (0.88, 0.86, 0.78),
    "white": (0.90, 0.91, 0.94),
    "black": (0.09, 0.10, 0.12),
    "grey": (0.42, 0.44, 0.48),
    "gray": (0.42, 0.44, 0.48),
    "metal": (0.52, 0.55, 0.60),
    "cushion": (0.24, 0.42, 0.52),
    "sofa": (0.30, 0.38, 0.50),
    "fabric": (0.30, 0.40, 0.50),
    "plant": (0.22, 0.52, 0.26),
    "leaf": (0.22, 0.52, 0.26),
    "pot": (0.52, 0.30, 0.17),
    "lamp": (0.95, 0.90, 0.72),
    "glass": (0.52, 0.72, 0.88),
    "vase": (0.66, 0.42, 0.24),
}

COVER_PALETTE = [
    (0.70, 0.22, 0.22),
    (0.22, 0.36, 0.70),
    (0.18, 0.50, 0.32),
    (0.76, 0.53, 0.15),
    (0.46, 0.27, 0.60),
    (0.14, 0.14, 0.17),
]


# ── Utilidades de escena ────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights):
        for block in list(coll):
            if block.users == 0:
                coll.remove(block)


def pick_engine():
    scene = bpy.context.scene
    for name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
        try:
            scene.render.engine = name
            return name
        except Exception:
            continue
    return scene.render.engine


def flat_material(name, rgb, rough=0.55, emission=None, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        bsdf.inputs["Roughness"].default_value = rough
        if emission is not None and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission, 1)
            bsdf.inputs["Emission Strength"].default_value = 2.2
        if alpha < 1.0 and "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
            mat.blend_method = "BLEND"
    return mat


def mk_box(name, size, loc, rgb, rot_z=0.0, rough=0.55, emission=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    obj.rotation_euler = (0, 0, math.radians(rot_z))
    obj.data.materials.append(flat_material(name + "_m", rgb, rough, emission))
    return obj


def mk_cyl(name, radius, depth, loc, rgb, rot=(0, 0, 0), verts=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = tuple(math.radians(a) for a in rot)
    obj.data.materials.append(flat_material(name + "_m", rgb))
    return obj


def shade_flat_smooth(objs):
    for obj in objs:
        for poly in obj.data.polygons:
            poly.use_smooth = False


def world_bounds(objs):
    bpy.context.view_layer.update()
    lo = [1e9] * 3
    hi = [-1e9] * 3
    for obj in objs:
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            for i in range(3):
                lo[i] = min(lo[i], w[i])
                hi[i] = max(hi[i], w[i])
    return lo, hi


def import_obj(path: Path, target_h=None, target_max=None):
    """Importa un OBJ y escala el grupo entero. Sin join: el bounding box de un
    objeto recién unido queda obsoleto y arruina la escala."""
    if hasattr(bpy.ops.wm, "obj_import"):
        bpy.ops.wm.obj_import(filepath=str(path))
    else:
        bpy.ops.import_scene.obj(filepath=str(path))
    objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not objs:
        return []

    lo, hi = world_bounds(objs)
    dims = [hi[i] - lo[i] for i in range(3)]
    s = None
    if target_h and dims[2] > 1e-6:
        s = target_h / dims[2]
    elif target_max:
        s = target_max / (max(dims) or 1)
    if s and abs(s - 1) > 1e-4:
        for obj in objs:
            obj.scale = tuple(v * s for v in obj.scale)
            obj.location = tuple(v * s for v in obj.location)
    bpy.context.view_layer.update()
    return objs


def colorize_obj(obj, fallback=(0.5, 0.42, 0.32)):
    keys = sorted(MATERIAL_COLORS.keys(), key=len, reverse=True)
    if not obj.data.materials:
        obj.data.materials.append(flat_material(obj.name + "_fb", fallback))
        return
    for slot in obj.material_slots:
        mat = slot.material
        if not mat:
            continue
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        name = (mat.name or "").lower().replace(" ", "")
        rgb = fallback
        if "cover" in name:
            digits = "".join(ch for ch in name if ch.isdigit()) or "0"
            rgb = COVER_PALETTE[int(digits) % len(COVER_PALETTE)]
        else:
            for key in keys:
                if key in name:
                    rgb = MATERIAL_COLORS[key]
                    break
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        bsdf.inputs["Roughness"].default_value = 0.5


def drop_to_floor(objs, z=0.0):
    if not objs:
        return
    lo, _ = world_bounds(objs)
    for obj in objs:
        obj.location.z += z - lo[2]


def place(objs, pos, rot_z=0.0, snap_floor=True):
    """Centra el grupo en (x, y) y opcionalmente lo apoya en el piso."""
    if not objs:
        return objs
    bpy.context.view_layer.update()
    xs, ys = [], []
    for obj in objs:
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            xs.append(w.x)
            ys.append(w.y)
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2

    pivot = Vector((cx, cy, 0))
    rot = math.radians(rot_z)
    for obj in objs:
        obj.rotation_euler.z += rot
        rel = obj.location - pivot
        obj.location = pivot + Vector(
            (rel.x * math.cos(rot) - rel.y * math.sin(rot),
             rel.x * math.sin(rot) + rel.y * math.cos(rot),
             rel.z)
        )
    bpy.context.view_layer.update()

    xs, ys = [], []
    for obj in objs:
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            xs.append(w.x)
            ys.append(w.y)
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    for obj in objs:
        obj.location.x += pos[0] - cx
        obj.location.y += pos[1] - cy
    if snap_floor:
        drop_to_floor(objs, pos[2])
    else:
        for obj in objs:
            obj.location.z += pos[2]
    bpy.context.view_layer.update()
    return objs


# ── Builders de props (low poly, estilo Quaternius) ─────────────────────────
def build_rig(pal):
    """Setup gamer: escritorio, monitor doble, teclado, torre RGB, silla."""
    accent = pal["accent"]
    parts = []
    desk = (0.30, 0.22, 0.16)
    parts.append(mk_box("desk_top", (2.6, 1.1, 0.10), (0, 0, 0.78), desk))
    for sx in (-1.15, 1.15):
        parts.append(mk_box(f"desk_leg{sx}", (0.12, 1.0, 0.76), (sx, 0, 0.38), (0.18, 0.14, 0.11)))
    parts.append(mk_box("desk_back", (2.4, 0.08, 0.36), (0, 0.48, 0.55), (0.20, 0.16, 0.12)))

    # Monitores
    for i, (mx, ry) in enumerate(((-0.62, 12), (0.62, -12))):
        stand = mk_box(f"mon_stand{i}", (0.18, 0.16, 0.26), (mx, 0.28, 0.96), (0.10, 0.11, 0.13))
        frame = mk_box(f"mon_frame{i}", (1.16, 0.07, 0.70), (mx, 0.30, 1.45), (0.08, 0.09, 0.11), rot_z=ry)
        screen = mk_box(
            f"mon_screen{i}", (1.06, 0.03, 0.60), (mx, 0.26, 1.45),
            (0.10, 0.35, 0.55), rot_z=ry, emission=(0.15, 0.55, 0.85)
        )
        stand.rotation_euler.z = math.radians(ry)
        parts += [stand, frame, screen]

    parts.append(mk_box("keyboard", (1.10, 0.34, 0.05), (0, -0.20, 0.86), (0.12, 0.13, 0.16)))
    parts.append(mk_box("kb_glow", (1.02, 0.26, 0.02), (0, -0.20, 0.895), accent, emission=accent))
    parts.append(mk_box("mouse", (0.16, 0.24, 0.06), (0.78, -0.22, 0.86), (0.14, 0.15, 0.18)))
    parts.append(mk_box("mousepad", (0.70, 0.42, 0.01), (0.72, -0.22, 0.835), (0.10, 0.10, 0.13)))

    # Torre con tira RGB
    parts.append(mk_box("tower", (0.42, 0.80, 1.05), (1.55, 0.10, 0.52), (0.11, 0.12, 0.15)))
    parts.append(mk_box("tower_rgb", (0.06, 0.66, 0.85), (1.34, 0.10, 0.55), accent, emission=accent))

    # Silla gamer
    cy = -1.45
    parts.append(mk_box("chair_seat", (0.74, 0.72, 0.14), (0, cy, 0.52), (0.13, 0.14, 0.18)))
    parts.append(mk_box("chair_back", (0.74, 0.16, 1.10), (0, cy - 0.30, 1.10), (0.13, 0.14, 0.18)))
    parts.append(mk_box("chair_stripe", (0.18, 0.10, 0.98), (0, cy - 0.38, 1.10), accent))
    parts.append(mk_box("chair_wing_l", (0.12, 0.30, 0.90), (-0.36, cy - 0.22, 1.05), (0.10, 0.11, 0.14)))
    parts.append(mk_box("chair_wing_r", (0.12, 0.30, 0.90), (0.36, cy - 0.22, 1.05), (0.10, 0.11, 0.14)))
    parts.append(mk_cyl("chair_pole", 0.07, 0.46, (0, cy, 0.24), (0.10, 0.11, 0.13)))
    for a in range(5):
        ang = a * (2 * math.pi / 5)
        parts.append(
            mk_box(
                f"chair_foot{a}", (0.46, 0.09, 0.05),
                (math.cos(ang) * 0.23, cy + math.sin(ang) * 0.23, 0.05),
                (0.10, 0.11, 0.13), rot_z=math.degrees(ang),
            )
        )
    return parts


def build_tv(pal):
    parts = [
        mk_box("tv_frame", (2.3, 0.12, 1.32), (0, 0, 0), (0.07, 0.08, 0.10)),
        mk_box("tv_screen", (2.14, 0.04, 1.16), (0, -0.07, 0), (0.12, 0.30, 0.42),
               emission=(0.20, 0.50, 0.70)),
        mk_box("tv_bar", (1.90, 0.02, 0.10), (0, -0.10, -0.42), pal["accent"], emission=pal["accent"]),
    ]
    return parts


def build_board(pal):
    parts = [
        mk_box("board_frame", (2.0, 0.10, 1.40), (0, 0, 0), (0.22, 0.17, 0.12)),
        mk_box("board_face", (1.86, 0.03, 1.26), (0, -0.06, 0), (0.86, 0.87, 0.84)),
    ]
    for i, (dx, dz, w) in enumerate(((-0.4, 0.36, 0.9), (0.2, 0.06, 0.7), (-0.2, -0.28, 1.0))):
        parts.append(mk_box(f"board_line{i}", (w, 0.01, 0.05), (dx, -0.08, dz), (0.20, 0.30, 0.55)))
    parts.append(mk_box("board_dot", (0.12, 0.01, 0.12), (0.62, -0.08, -0.44), pal["accent"]))
    return parts


def build_door(pal):
    parts = [
        mk_box("door_frame", (1.55, 0.16, 3.30), (0, 0, 1.65), (0.20, 0.16, 0.12)),
        mk_box("door_leaf", (1.28, 0.10, 3.05), (0, -0.06, 1.53), (0.34, 0.23, 0.15)),
        mk_box("door_panel", (0.90, 0.02, 1.10), (0, -0.12, 2.10), (0.30, 0.20, 0.13)),
        mk_cyl("door_knob", 0.07, 0.14, (0.48, -0.16, 1.45), (0.72, 0.62, 0.30), rot=(90, 0, 0)),
    ]
    return parts


def build_window(pal):
    parts = [
        mk_box("win_frame", (2.0, 0.14, 1.60), (0, 0, 0), (0.24, 0.20, 0.16)),
        mk_box("win_glass", (1.84, 0.04, 1.44), (0, 0.02, 0), (0.35, 0.55, 0.75),
               emission=(0.30, 0.45, 0.65)),
        mk_box("win_mullion_v", (0.07, 0.06, 1.44), (0, -0.04, 0), (0.24, 0.20, 0.16)),
        mk_box("win_mullion_h", (1.84, 0.06, 0.07), (0, -0.04, 0), (0.24, 0.20, 0.16)),
        mk_box("win_sill", (2.2, 0.28, 0.10), (0, -0.10, -0.84), (0.26, 0.21, 0.17)),
    ]
    return parts


def build_poster(pal):
    parts = [
        mk_box("poster_bg", (0.90, 0.04, 1.24), (0, 0, 0), (0.13, 0.14, 0.18)),
        mk_box("poster_art", (0.74, 0.02, 0.74), (0, -0.03, 0.16), pal["accent"]),
        mk_box("poster_text", (0.56, 0.02, 0.10), (0, -0.03, -0.40), (0.80, 0.82, 0.86)),
    ]
    return parts


def build_banner(pal):
    parts = [
        mk_box("banner_rod", (1.50, 0.08, 0.08), (0, 0, 0.92), (0.35, 0.36, 0.40)),
        mk_box("banner_cloth", (1.32, 0.04, 1.80), (0, 0, 0), (0.14, 0.15, 0.20)),
        mk_box("banner_mark", (0.72, 0.02, 0.72), (0, -0.03, 0.30), pal["accent"]),
        mk_box("banner_stripe", (1.32, 0.02, 0.10), (0, -0.03, -0.60), pal["accent"]),
    ]
    return parts


def build_cam(pal):
    parts = [
        mk_box("cam_body", (0.52, 0.72, 0.40), (0, 0, 1.42), (0.11, 0.12, 0.15)),
        mk_cyl("cam_lens", 0.17, 0.30, (0, -0.44, 1.42), (0.16, 0.17, 0.21), rot=(90, 0, 0)),
        mk_cyl("cam_glass", 0.12, 0.06, (0, -0.60, 1.42), (0.30, 0.55, 0.75)),
        mk_box("cam_rec", (0.07, 0.05, 0.07), (0.20, -0.34, 1.62), (1.0, 0.18, 0.25),
               emission=(1.0, 0.18, 0.25)),
        mk_cyl("cam_mount", 0.06, 0.26, (0, 0, 1.16), (0.20, 0.21, 0.25)),
    ]
    for a in range(3):
        ang = a * (2 * math.pi / 3) + 0.4
        leg = mk_box(
            f"cam_leg{a}", (0.07, 0.07, 1.22),
            (math.cos(ang) * 0.26, math.sin(ang) * 0.26, 0.58), (0.18, 0.19, 0.23)
        )
        leg.rotation_euler = (math.sin(ang) * 0.2, -math.cos(ang) * 0.2, 0)
        parts.append(leg)
    return parts


def build_rug(pal):
    base = pal["floor"]
    rug_col = (min(base[0] + 0.16, 1), min(base[1] + 0.10, 1), min(base[2] + 0.22, 1))
    parts = [
        mk_box("rug_base", (4.2, 3.2, 0.035), (0, 0, 0.018), rug_col),
        mk_box("rug_inner", (3.5, 2.5, 0.02), (0, 0, 0.04), (rug_col[0] * 0.8, rug_col[1] * 0.8, rug_col[2] * 0.9)),
        mk_box("rug_line", (3.0, 0.12, 0.01), (0, 0, 0.052), pal["accent"]),
    ]
    return parts


def build_bed(pal):
    objs = import_obj(FURN / "Bed.obj", target_max=2.6)
    for o in objs:
        colorize_obj(o, (0.46, 0.32, 0.20))
    return objs


def build_shelf(pal):
    objs = import_obj(FURN / "BookCaseLargeBooks.obj", target_h=2.5)
    for o in objs:
        colorize_obj(o, (0.46, 0.32, 0.20))
    return objs


def build_sofa(pal):
    objs = import_obj(FURN / "SofaDouble.obj", target_max=2.6)
    for o in objs:
        colorize_obj(o, (0.30, 0.38, 0.50))
    return objs


def build_table(pal):
    objs = import_obj(FURN / "Table.obj", target_max=2.0)
    for o in objs:
        colorize_obj(o, (0.52, 0.36, 0.20))
    chairs = import_obj(FURN / "ChairCushioned.obj", target_h=1.15)
    for o in chairs:
        colorize_obj(o, (0.30, 0.38, 0.50))
        o.location.y -= 1.25
    return objs + chairs


def build_plant(pal):
    objs = import_obj(FURN / "Plant.obj", target_h=1.6)
    for o in objs:
        colorize_obj(o, (0.24, 0.52, 0.28))
    return objs


def build_bench(pal):
    parts = [
        mk_box("bench_pad", (2.0, 0.72, 0.22), (0, 0, 0.62), (0.20, 0.26, 0.34)),
        mk_box("bench_frame", (1.9, 0.16, 0.12), (0, 0, 0.46), (0.30, 0.32, 0.36)),
    ]
    for sx in (-0.82, 0.82):
        parts.append(mk_box(f"bench_leg{sx}", (0.14, 0.62, 0.50), (sx, 0, 0.25), (0.26, 0.28, 0.33)))
    parts.append(mk_box("bench_rack", (1.5, 0.30, 0.10), (0, 0.55, 0.24), (0.18, 0.19, 0.23)))
    for dx in (-0.5, 0.5):
        parts.append(mk_cyl("bench_plate", 0.26, 0.10, (dx, 0.55, 0.34), (0.14, 0.15, 0.18), rot=(90, 0, 0)))
    return parts


BUILDERS = {
    "rig": build_rig,
    "tv": build_tv,
    "board": build_board,
    "door": build_door,
    "window": build_window,
    "poster": build_poster,
    "banner": build_banner,
    "cam": build_cam,
    "rug": build_rug,
    "bed": build_bed,
    "shelf": build_shelf,
    "sofa": build_sofa,
    "table": build_table,
    "plant": build_plant,
    "bench": build_bench,
}


# ── Habitación, cámara y luces ──────────────────────────────────────────────
def build_room(pal):
    parts = []
    parts.append(mk_box("floor", (ROOM * 2, ROOM * 2, 0.2), (0, 0, -0.1), pal["floor"], rough=0.75))

    # Damero suave sobre el piso
    tile = ROOM * 2 / 8
    for ix in range(8):
        for iy in range(8):
            if (ix + iy) % 2:
                continue
            parts.append(
                mk_box(
                    f"tile{ix}_{iy}", (tile * 0.98, tile * 0.98, 0.02),
                    (-ROOM + tile * (ix + 0.5), -ROOM + tile * (iy + 0.5), 0.005),
                    pal["floor_alt"], rough=0.8,
                )
            )

    parts.append(mk_box("wall_a", (0.22, ROOM * 2, WALL_H), (-ROOM, 0, WALL_H / 2), pal["wall_a"], rough=0.85))
    parts.append(mk_box("wall_b", (ROOM * 2, 0.22, WALL_H), (0, ROOM, WALL_H / 2), pal["wall_b"], rough=0.85))
    parts.append(mk_box("trim_a", (0.28, ROOM * 2, 0.24), (-ROOM, 0, 0.12), pal["trim"]))
    parts.append(mk_box("trim_b", (ROOM * 2, 0.28, 0.24), (0, ROOM, 0.12), pal["trim"]))
    parts.append(mk_box("crown_a", (0.26, ROOM * 2, 0.14), (-ROOM, 0, WALL_H - 0.07), pal["trim"]))
    parts.append(mk_box("crown_b", (ROOM * 2, 0.26, 0.14), (0, ROOM, WALL_H - 0.07), pal["trim"]))
    return parts


def setup_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    bpy.context.scene.camera = cam

    # El centro del contenido proyectado cae en z = WALL_H/2 con este pitch.
    center = Vector((0, 0, WALL_H * 0.5))
    yaw = math.radians(45)
    pitch = math.radians(35.264)
    dist = 40
    cam.location = (
        center.x + dist * math.cos(pitch) * math.sin(yaw),
        center.y - dist * math.cos(pitch) * math.cos(yaw),
        center.z + dist * math.sin(pitch),
    )
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ORTHO
    cam.data.clip_end = 200
    return cam


def setup_world(pal, night=False):
    scene = bpy.context.scene
    pick_engine()
    scene.render.film_transparent = True
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    if hasattr(scene.render, "filter_size"):
        scene.render.filter_size = 1.2

    world = bpy.data.worlds.new("IsoWorld")
    scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    bg = nodes.new("ShaderNodeBackground")
    bg.inputs[0].default_value = (0.16, 0.18, 0.24, 1)
    bg.inputs[1].default_value = 0.55 if not night else 0.3
    out = nodes.new("ShaderNodeOutputWorld")
    links.new(bg.outputs[0], out.inputs[0])


def add_lights():
    bpy.ops.object.light_add(type="SUN", location=(6, -8, 14))
    key = bpy.context.object
    key.data.energy = 3.2
    key.data.angle = math.radians(12)
    key.rotation_euler = (math.radians(48), math.radians(6), math.radians(38))

    bpy.ops.object.light_add(type="AREA", location=(-7, 5, 7))
    fill = bpy.context.object
    fill.data.energy = 420
    fill.data.size = 12
    fill.rotation_euler = (math.radians(-35), 0, math.radians(-40))

    bpy.ops.object.light_add(type="AREA", location=(7, -7, 3.5))
    rim = bpy.context.object
    rim.data.energy = 260
    rim.data.size = 8
    rim.rotation_euler = (math.radians(70), 0, math.radians(150))


def add_shadow_blob(objs, strength=0.42, radius=None):
    """Elipse oscura bajo el objeto: ancla el prop al piso sin ray tracing."""
    if not objs:
        return None
    bpy.context.view_layer.update()
    xs, ys, zs = [], [], []
    for obj in objs:
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            xs.append(w.x)
            ys.append(w.y)
            zs.append(w.z)
    if min(zs) > 0.35:
        return None

    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    if radius:
        rx = ry = radius
    else:
        rx = max((max(xs) - min(xs)) / 2 * 1.18, 0.3)
        ry = max((max(ys) - min(ys)) / 2 * 1.18, 0.3)

    bpy.ops.mesh.primitive_circle_add(vertices=32, radius=1, fill_type="NGON", location=(cx, cy, 0.012))
    blob = bpy.context.object
    blob.name = "shadow_blob"
    blob.scale = (rx, ry, 1)

    mat = bpy.data.materials.new("shadow_blob_m")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    dark = nt.nodes.new("ShaderNodeBsdfDiffuse")
    dark.inputs["Color"].default_value = (0, 0, 0, 1)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    # Fac del gradiente: 1 en el centro, 0 en el borde.
    # Mix: 0 -> negro, 1 -> transparente.
    ramp.color_ramp.elements[0].position = 0.02
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.92
    ramp.color_ramp.elements[1].color = (1 - strength,) * 3 + (1,)

    nt.links.new(coord.outputs["Object"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(dark.outputs[0], mix.inputs[1])
    nt.links.new(trans.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    mat.blend_method = "BLEND"
    if hasattr(mat, "shadow_method"):
        mat.shadow_method = "NONE"
    blob.data.materials.append(mat)
    return blob


# ── Proyección y render con recorte ─────────────────────────────────────────
def screen_bbox(objs, cam, margin=0.006):
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    xs, ys, ds = [], [], []
    for obj in objs:
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            co = world_to_camera_view(scene, cam, w)
            xs.append(co.x)
            ys.append(co.y)
            ds.append(co.z)
    return (
        max(0.0, min(xs) - margin),
        min(1.0, max(xs) + margin),
        max(0.0, min(ys) - margin),
        min(1.0, max(ys) + margin),
        sum(ds) / len(ds),
    )


def render_to(path: Path, border=None):
    scene = bpy.context.scene
    if border:
        x0, x1, y0, y1 = border
        scene.render.use_border = True
        scene.render.use_crop_to_border = True
        scene.render.border_min_x = x0
        scene.render.border_max_x = x1
        scene.render.border_min_y = y0
        scene.render.border_max_y = y1
    else:
        scene.render.use_border = False
        scene.render.use_crop_to_border = False
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def floor_mapping(cam):
    """Mapeo afín (x, y) de piso -> coords normalizadas de pantalla (y hacia abajo)."""
    scene = bpy.context.scene

    def proj(p):
        co = world_to_camera_view(scene, cam, Vector(p))
        return (co.x, 1.0 - co.y)

    o = proj((0, 0, 0))
    ux = proj((1, 0, 0))
    uy = proj((0, 1, 0))
    return {
        "origin": [round(o[0], 5), round(o[1], 5)],
        "ux": [round(ux[0] - o[0], 5), round(ux[1] - o[1], 5)],
        "uy": [round(uy[0] - o[0], 5), round(uy[1] - o[1], 5)],
        "half": ROOM,
    }


# ── Pipeline principal ──────────────────────────────────────────────────────
def render_venue(venue, pal, layout):
    manifest_props = []

    clear_scene()
    setup_world(pal)
    add_lights()
    cam = setup_camera()
    build_room(pal)
    render_to(OUT_ROOMS / f"{venue}.png")
    mapping = floor_mapping(cam)

    for prop_id, builder_id, pos, rot, plane in layout:
        clear_scene()
        setup_world(pal)
        add_lights()
        cam = setup_camera()

        builder = BUILDERS.get(builder_id)
        if not builder:
            print("missing builder", builder_id)
            continue
        objs = [o for o in builder(pal) if o is not None]
        if not objs:
            print("empty prop", prop_id)
            continue

        snap = plane == "floor"
        place(objs, pos, rot, snap_floor=snap)
        shade_flat_smooth([o for o in objs if o.type == "MESH"])

        blob = add_shadow_blob(objs) if snap else None
        bbox_objs = objs + ([blob] if blob else [])
        x0, x1, y0, y1, depth = screen_bbox(bbox_objs, cam)

        out = OUT_ROOMS / venue / f"{prop_id}.png"
        render_to(out, border=(x0, x1, y0, y1))

        manifest_props.append(
            {
                "id": prop_id,
                "x": round(x0, 5),
                "y": round(1.0 - y1, 5),
                "w": round(x1 - x0, 5),
                "h": round(y1 - y0, 5),
                "depth": round(depth, 4),
                "plane": plane,
                "pos": [pos[0], pos[1]],
            }
        )
        print("WROTE", out)

    manifest_props.sort(key=lambda p: -p["depth"])
    for i, p in enumerate(manifest_props):
        p["z"] = i + 1
        del p["depth"]

    return {"floor": mapping, "props": manifest_props}


def render_characters(pal):
    out = {}
    for role, fname in CHAR_MAP.items():
        src = CHARS / fname
        if not src.exists():
            src = CHARS / "Casual_Male.obj"
        if not src.exists():
            print("missing char", role)
            continue

        clear_scene()
        setup_world(pal)
        add_lights()
        cam = setup_camera()

        objs = import_obj(src, target_h=1.78)
        if not objs:
            continue
        # Los personajes sí traen color en el MTL: solo se corrige la piel.
        for o in objs:
            fix_skin(o)
        place(objs, (0, 0, 0), 0, snap_floor=True)
        shade_flat_smooth(objs)

        blob = add_shadow_blob(objs, strength=0.5, radius=0.42)
        bbox_objs = objs + ([blob] if blob else [])
        x0, x1, y0, y1, _ = screen_bbox(bbox_objs, cam)
        render_to(OUT_CHARS / f"{role}.png", border=(x0, x1, y0, y1))

        # Ancla: dónde cae el pie del personaje dentro de su propio recorte.
        feet = world_to_camera_view(bpy.context.scene, cam, Vector((0, 0, 0)))
        out[role] = {
            "w": round(x1 - x0, 5),
            "h": round(y1 - y0, 5),
            "footX": round((feet.x - x0) / max(x1 - x0, 1e-5), 4),
            "footY": round(((1 - feet.y) - (1 - y1)) / max(y1 - y0, 1e-5), 4),
        }
        print("WROTE", OUT_CHARS / f"{role}.png")
    return out


def fix_skin(obj):
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or "skin" not in (mat.name or "").lower():
            continue
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        c = bsdf.inputs["Base Color"].default_value
        lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        if lum < 0.15:
            bsdf.inputs["Base Color"].default_value = (0.78, 0.58, 0.46, 1)


def write_manifest(rooms, chars):
    lines = [
        "/**",
        " * GENERADO por scripts/blender_render_rooms.py — no editar a mano.",
        " * Coordenadas normalizadas (0..1) sobre el render de la habitación.",
        " */",
        "",
        "export interface RoomPropPlacement {",
        "  id: string;",
        "  x: number;",
        "  y: number;",
        "  w: number;",
        "  h: number;",
        "  z: number;",
        "  plane: 'wall' | 'floor';",
        "  pos: [number, number];",
        "}",
        "",
        "export interface FloorMapping {",
        "  origin: [number, number];",
        "  ux: [number, number];",
        "  uy: [number, number];",
        "  half: number;",
        "}",
        "",
        "export interface RoomPlacement {",
        "  floor: FloorMapping;",
        "  props: RoomPropPlacement[];",
        "}",
        "",
        "export interface CharPlacement {",
        "  w: number;",
        "  h: number;",
        "  footX: number;",
        "  footY: number;",
        "}",
        "",
        f"export const ROOM_ASPECT = {round(RES_X / RES_Y, 4)};",
        "",
        "export const ROOM_PLACEMENT: Record<string, RoomPlacement> = "
        + json.dumps(rooms, indent=2)
        + " as unknown as Record<string, RoomPlacement>;",
        "",
        "export const CHAR_PLACEMENT: Record<string, CharPlacement> = "
        + json.dumps(chars, indent=2)
        + ";",
        "",
    ]
    MANIFEST_TS.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")
    print("WROTE", MANIFEST_TS)


def main():
    print("Blender", bpy.app.version_string)
    only = [v for v in os.environ.get("ISO_VENUES", "").split(",") if v]
    rooms = {}
    for venue, pal in VENUES.items():
        layout = LAYOUTS.get(venue)
        if not layout or (only and venue not in only):
            continue
        print("=== venue", venue)
        rooms[venue] = render_venue(venue, pal, layout)

    chars = render_characters(VENUES["home"])
    write_manifest(rooms, chars)


if __name__ == "__main__":
    main()
