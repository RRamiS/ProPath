# Créditos de arte

Assets en `assets/iso/`. Uso comercial permitido (CC0). Atribución no obligatoria; se documenta por cortesía.

## Set principal (activo)

- **Quaternius** — Ultimate Animated Character Pack + Furniture Pack  
  Fuente: https://quaternius.com/  
  Licencia: **CC0 1.0**  
  Uso: modelos 3D low-poly → cutouts isométricos PNG (`characters/`, `props/`, `venues/`)  
  Pipeline: `npm run render:iso` → `scripts/blender_render_iso.py` (Blender headless)

## Alternativas / candidatos (no cableados)

- **Supernova Files — Isometric Character** (CC0, PWYW itch)  
  https://supernovafiles.itch.io/isometric-asset-pack  

- **Pixel Isometric Modern Interior** — Cryovex (free + paid, uso comercial)  
  https://cryovex.itch.io/pixel-isometric-modern-interior  

- **CHROME DISTRICT** — Hartley LeRoy / booliebuilds (CC0)  
  https://chromedistrict.xyz/ · https://booliebuilds.itch.io/chrome-district  

- **Isometric home furniture** — Hooded Crow / Sweeetpotatoo (uso libre comercial)  
  https://opengameart.org/content/isometric-pixel-house-furniture  

- **Kenney Furniture Kit** (CC0) — set previo descartado.

## Pipeline

```bash
# Requiere Blender 4+/5 en PATH o ruta fija en el script npm
npm run render:iso
```

`assets/iso/source/` está en `.gitignore` (packs crudos). Los PNG finales en `characters/`, `props/`, `venues/` sí van al repo.
