"""
Generate BUETracker icon: open book + gear, dark navy theme.
Produces: build/icon.png (512x512) and build/icon.ico (multi-size)
"""
from PIL import Image, ImageDraw
import math
import os

SIZE = 512
RADIUS = 72  # Rounded corner radius

BG        = (13, 17, 23)        # #0d1117 dark navy
BOOK_L    = (20, 30, 48)        # left page dark blue
BOOK_R    = (26, 38, 58)        # right page slightly lighter
SPINE     = (16, 185, 129)      # #10b981 emerald
LINE_L    = (38, 65, 56)        # left page line colour
LINE_R    = (28, 52, 42)        # right page line colour
GEAR_COL  = (245, 158, 11)      # #f59e0b amber
GEAR_HOLE = BG
WHITE     = (220, 230, 240)


def rounded_rect_mask(size, radius):
    """Create a rounded-rectangle alpha mask."""
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def make_icon(size=512):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 512  # scale factor

    # ── Background ──────────────────────────────────────────────────────────
    d.rounded_rectangle([0, 0, size - 1, size - 1],
                        radius=int(96 * s), fill=BG + (255,))

    # ── Book pages ──────────────────────────────────────────────────────────
    # Left page polygon (trapezoidal, slight perspective)
    left_page = [
        (int(112*s), int(145*s)),   # top-left
        (int(248*s), int(140*s)),   # top-right (spine)
        (int(248*s), int(400*s)),   # bottom-right (spine)
        (int(128*s), int(378*s)),   # bottom-left
    ]
    d.polygon(left_page, fill=BOOK_L)

    # Right page polygon
    right_page = [
        (int(264*s), int(140*s)),   # top-left (spine)
        (int(400*s), int(145*s)),   # top-right
        (int(384*s), int(378*s)),   # bottom-right
        (int(264*s), int(400*s)),   # bottom-left (spine)
    ]
    d.polygon(right_page, fill=BOOK_R)

    # ── Book spine ───────────────────────────────────────────────────────────
    spine_x0, spine_x1 = int(246*s), int(266*s)
    spine_y0, spine_y1 = int(132*s), int(408*s)
    d.rectangle([spine_x0, spine_y0, spine_x1, spine_y1], fill=SPINE)

    # Rounded top cap on spine
    d.ellipse([spine_x0, spine_y0 - int(6*s), spine_x1, spine_y0 + int(6*s)], fill=SPINE)

    # ── Page borders (outline) ───────────────────────────────────────────────
    lw = max(2, int(3 * s))
    for poly, col in [(left_page, SPINE), (right_page, SPINE)]:
        d.polygon(poly, outline=col)

    # ── Text lines on left page ──────────────────────────────────────────────
    left_lines = [
        ((int(140*s), int(195*s)), (int(230*s), int(192*s))),
        ((int(140*s), int(218*s)), (int(230*s), int(216*s))),
        ((int(140*s), int(241*s)), (int(220*s), int(239*s))),
        ((int(140*s), int(270*s)), (int(230*s), int(268*s))),
        ((int(140*s), int(293*s)), (int(225*s), int(292*s))),
        ((int(140*s), int(316*s)), (int(230*s), int(315*s))),
        ((int(140*s), int(339*s)), (int(210*s), int(338*s))),
    ]
    for p1, p2 in left_lines:
        d.line([p1, p2], fill=LINE_L, width=lw + 1)

    # ── Text lines on right page ─────────────────────────────────────────────
    right_lines = [
        ((int(282*s), int(192*s)), (int(370*s), int(195*s))),
        ((int(282*s), int(216*s)), (int(370*s), int(218*s))),
        ((int(282*s), int(239*s)), (int(360*s), int(241*s))),
        ((int(282*s), int(268*s)), (int(370*s), int(270*s))),
        ((int(282*s), int(292*s)), (int(365*s), int(293*s))),
        ((int(282*s), int(315*s)), (int(370*s), int(316*s))),
        ((int(282*s), int(338*s)), (int(348*s), int(339*s))),
    ]
    for p1, p2 in right_lines:
        d.line([p1, p2], fill=LINE_R, width=lw + 1)

    # ── Gear (bottom-right) ───────────────────────────────────────────────────
    gx, gy = int(366*s), int(360*s)   # gear centre
    gr = int(44*s)                      # gear outer radius
    tooth_w = int(14*s)
    tooth_h = int(16*s)
    num_teeth = 8

    # Draw 8 teeth as rounded rects radiating outward
    for i in range(num_teeth):
        angle = math.radians(i * 360 / num_teeth)
        cx = gx + math.cos(angle) * (gr - tooth_h // 2)
        cy = gy + math.sin(angle) * (gr - tooth_h // 2)
        # Tooth rectangle, rotated
        half_w, half_h = tooth_w // 2, tooth_h // 2
        # corners before rotation
        pts = [
            (-half_w, -half_h),
            ( half_w, -half_h),
            ( half_w,  half_h),
            (-half_w,  half_h),
        ]
        rotated = [
            (cx + math.cos(angle)*x - math.sin(angle)*y,
             cy + math.sin(angle)*x + math.cos(angle)*y)
            for x, y in pts
        ]
        d.polygon(rotated, fill=GEAR_COL)

    # Gear body disc
    d.ellipse([gx - gr + tooth_h, gy - gr + tooth_h,
               gx + gr - tooth_h, gy + gr - tooth_h], fill=GEAR_COL)

    # Gear centre hole
    hole_r = int(16*s)
    d.ellipse([gx - hole_r, gy - hole_r, gx + hole_r, gy + hole_r], fill=BG + (255,))

    # Dark circle behind gear (blends into bg, makes gear pop)
    bg_circ_r = int(60*s)
    gear_bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gbd = ImageDraw.Draw(gear_bg)
    gbd.ellipse([gx - bg_circ_r, gy - bg_circ_r,
                 gx + bg_circ_r, gy + bg_circ_r], fill=BG + (220,))
    img = Image.alpha_composite(img, gear_bg)

    # Redraw gear on top after compositing bg circle
    d2 = ImageDraw.Draw(img)
    for i in range(num_teeth):
        angle = math.radians(i * 360 / num_teeth)
        cx = gx + math.cos(angle) * (gr - tooth_h // 2)
        cy = gy + math.sin(angle) * (gr - tooth_h // 2)
        half_w, half_h = tooth_w // 2, tooth_h // 2
        pts = [(-half_w,-half_h),(half_w,-half_h),(half_w,half_h),(-half_w,half_h)]
        rotated = [
            (cx + math.cos(angle)*x - math.sin(angle)*y,
             cy + math.sin(angle)*x + math.cos(angle)*y)
            for x, y in pts
        ]
        d2.polygon(rotated, fill=GEAR_COL)
    d2.ellipse([gx - gr + tooth_h, gy - gr + tooth_h,
                gx + gr - tooth_h, gy + gr - tooth_h], fill=GEAR_COL)
    d2.ellipse([gx - hole_r, gy - hole_r, gx + hole_r, gy + hole_r], fill=BG + (255,))

    # ── Emerald glow top of spine ─────────────────────────────────────────────
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gw, gh = int(100*s), int(10*s)
    gd.ellipse([int(256*s) - gw, int(128*s) - gh,
                int(256*s) + gw, int(128*s) + gh], fill=SPINE + (60,))
    img = Image.alpha_composite(img, glow)

    # ── Apply rounded mask ────────────────────────────────────────────────────
    mask = rounded_rect_mask(size, int(96 * s))
    img.putalpha(mask)

    return img


# ── Build all sizes ──────────────────────────────────────────────────────────
os.makedirs("build", exist_ok=True)
os.makedirs("public", exist_ok=True)

icon_512 = make_icon(512)
icon_512.save("build/icon.png", "PNG")

# Multi-size ICO (Windows requires 16, 32, 48, 64, 128, 256)
sizes = [256, 128, 64, 48, 32, 16]
ico_images = []
for sz in sizes:
    im = make_icon(sz)
    # Convert to RGBA then to palette for small sizes
    ico_images.append(im.resize((sz, sz), Image.LANCZOS))

icon_512.save(
    "build/icon.ico",
    format="ICO",
    sizes=[(sz, sz) for sz in sizes],
    append_images=ico_images[1:]
)

# Also update public/icon.png and public/icon.ico (used by electron/main.cjs)
icon_512.save("public/icon.png", "PNG")
icon_512.save(
    "public/icon.ico",
    format="ICO",
    sizes=[(sz, sz) for sz in sizes],
    append_images=ico_images[1:]
)

print("✓ build/icon.png  (512x512)")
print("✓ build/icon.ico  (256,128,64,48,32,16)")
print("✓ public/icon.png")
print("✓ public/icon.ico")
print("Done!")
