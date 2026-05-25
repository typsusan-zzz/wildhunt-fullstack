# 荒野追猎素材记录

## AI 生成图片

以下图片使用内置 image generation 工具生成，并复制到了项目内：

- `public/images/cartoon-keyart.png`
- `public/images/cartoon-skill-icons-sheet.png`

提示词：

```text
Create a bright cartoon low-poly forest game key art image for a game called Wild Chase Hunt, no text, no logo. Scene: sunny colorful meadow and forest, cute stylized wolf searching among many deer, playful hide-and-seek mood, clear grass, bushes, mushrooms, flowers, blue stream, warm daylight, soft shadows, charming low-poly 3D mobile game style. Avoid cyberpunk, avoid neon, avoid dark sci-fi. No watermark, no UI, no typography.
```

```text
Create a square 1024x1024 cartoon low-poly game UI icon sheet, no text. Four clean readable mobile skill icons arranged in a 2 by 2 grid with generous spacing: wolf bite, sprint paw trail, scent sniff/search swirl, deer disguise leaf mask. Style: bright forest cartoon, friendly low-poly, warm greens, sky blues, orange accents, crisp silhouettes, dark but not black simple background. Avoid neon cyberpunk, avoid text, no watermark.
```

历史霓虹版素材保留用于对比：

- `public/images/neon-wild-hunt-keyart.png`
- `public/images/skill-icons-sheet.png`

历史提示词：

```text
Create a polished game key art image for a browser prototype called Neon Wild Hunt, no text, no logo. Scene: a low-poly cyber-nature hunting arena at night, a stylized wolf in the foreground with cyan neon rim light, glowing turquoise resource crystals, dark forest, wetland water, purple storm ring in the distance. Visual style: low-poly 3D game concept art, clean readable shapes, dramatic third-person game camera, teal and magenta accents, high contrast, suitable as a loading screen background. No watermark, no UI, no typography.
```

```text
Create a square 1024x1024 game UI icon sheet, no text. Four clean low-poly neon skill icons arranged in a 2 by 2 grid with generous spacing: wolf bite slash, sprint trail, scent tracking spiral, storm survival shield. Style: cyber-nature, teal and magenta glow, dark transparent-looking but actually solid near-black background, crisp readable icon silhouettes, mobile game HUD quality. No watermark, no numbers, no typography.
```

## 下载模型

以下免费 `.glb` 模型下载自 FreePixel 的 3D assets 集合：

- `public/models/wolf.glb`
- `public/models/horse.glb`

来源：

- https://freepixel.art/3d-assets

## Quaternius animated animal models

Replaced the original static animal placeholders with animated CC0 glTF models from Quaternius:

- `public/models/quaternius/Wolf.gltf`
- `public/models/quaternius/Deer.gltf`
- `public/models/quaternius/Stag.gltf`
- `public/models/quaternius/License.txt`

Source:
- https://quaternius.com/packs/ultimateanimatedanimals.html

License:
- CC0 1.0 Universal, public domain dedication
- https://creativecommons.org/publicdomain/zero/1.0/

## Kenney Nature Kit mountain and cliff models

Added CC0 GLB mountain/cliff and tall rock pieces from Eclair Assets' GLB-ready redistribution of Kenney's Nature Kit:

- `public/models/kenney-nature/kenney_nature_kit_glb_cc0_v1.zip`
- `public/models/kenney-nature/License_Kenney.txt`
- `public/models/kenney-nature/cliffs/cliff_large_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_top_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_half_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_blockSlope_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_cornerLarge_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_diagonal_rock.glb`
- `public/models/kenney-nature/cliffs/cliff_steps_rock.glb`
- `public/models/kenney-nature/cliffs/rock_tallA.glb`
- `public/models/kenney-nature/cliffs/rock_tallB.glb`
- `public/models/kenney-nature/cliffs/rock_tallH.glb`
- `public/models/kenney-nature/cliffs/stone_tallA.glb`
- `public/models/kenney-nature/cliffs/stone_tallB.glb`

Sources:
- https://eclair-assets.itch.io/nature-kit-glb-pack-329-free-cc0-3d-models
- https://kenney.nl/assets/nature-kit

License:
- CC0 1.0 Universal, public domain dedication
- https://creativecommons.org/publicdomain/zero/1.0/

The pack page states the models are animated, include glTF format, and are free for personal and commercial projects.

## Quaternius stylized nature models

Added CC0 GLB environment models from Quaternius via Poly Pizza's Stylized Nature MegaKit page:

- `public/models/nature/tree_broad_01.glb`
- `public/models/nature/tree_broad_02.glb`
- `public/models/nature/tree_broad_03.glb`
- `public/models/nature/pine_01.glb`
- `public/models/nature/pine_02.glb`
- `public/models/nature/pine_03.glb`
- `public/models/nature/twisted_tree_01.glb`
- `public/models/nature/bush_01.glb`
- `public/models/nature/bush_flowers_01.glb`
- `public/models/nature/grass_01.glb`
- `public/models/nature/grass_wispy_01.glb`
- `public/models/nature/tall_grass_01.glb`
- `public/models/nature/rock_medium_01.glb`
- `public/models/nature/rock_medium_02.glb`
- `public/models/nature/rock_medium_03.glb`
- `public/models/nature/pebble_round_01.glb`
- `public/models/nature/pebble_square_01.glb`
- `public/models/nature/mushroom_01.glb`
- `public/models/nature/mushroom_laetiporus_01.glb`
- `public/models/nature/plant_01.glb`

Source:
- https://poly.pizza/bundle/Stylized-Nature-MegaKit-T34GZFA0fm
- https://quaternius.com/packs/stylizednaturemegakit.html

License:
- CC0 1.0 Universal, public domain dedication
- https://creativecommons.org/publicdomain/zero/1.0/

FreePixel 页面说明素材可免费用于个人和商业用途。正式公开发布前仍建议人工复核授权页，并尽量替换为更贴合“鹿”的专用模型。
