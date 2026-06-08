"""Generate app icons for Manny's Plan (sage rounded square + wedding ring)."""
import os
try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("PILLOW_MISSING")

S = 512
SAGE = (46, 74, 63, 255)
IVORY = (241, 237, 228, 255)
GEM = (205, 185, 218, 255)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# rounded background
r = int(S * 0.22)
d.rounded_rectangle([0, 0, S, S], radius=r, fill=SAGE)

# wedding ring (circle outline)
cx, cy = S // 2, int(S * 0.56)
R = int(S * 0.24)
w = int(S * 0.052)
d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=IVORY, width=w)

# gem (diamond) at top of ring
g = int(S * 0.085)
gy = cy - R
d.polygon([(cx, gy - g), (cx + g * 0.8, gy), (cx, gy + g), (cx - g * 0.8, gy)], fill=GEM)
# little sparkle band on the gem
d.line([(cx - g * 0.8, gy), (cx + g * 0.8, gy)], fill=(255, 255, 255, 180), width=max(2, S // 160))

os.makedirs(os.path.join(os.path.dirname(__file__), "icons"), exist_ok=True)
base = os.path.join(os.path.dirname(__file__), "icons")
img.save(os.path.join(base, "icon-512.png"))
img.resize((192, 192), Image.LANCZOS).save(os.path.join(base, "icon-192.png"))
img.resize((180, 180), Image.LANCZOS).save(os.path.join(base, "icon-180.png"))
print("OK icons written to", base)
