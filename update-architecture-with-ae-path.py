#!/usr/bin/env python3
"""
Update Exocortex architecture diagram to include ae_path
"""

from PIL import Image, ImageDraw, ImageFont

# Load existing diagram
img = Image.open('/home/debian/clawd/exocortex-architecture.png')
draw = ImageDraw.Draw(img)

# Colors
FG = '#eaeaea'
YELLOW = '#f1c400'
CYAN = '#00ffff'

# Font
try:
    font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except:
    font_medium = ImageFont.load_default()

def draw_box(x, y, w, h, color, label, sublabel=None):
    radius = 8
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=color, outline=FG, width=2)
    if label:
        draw.text((x+w//2, y+12), label, fill=FG, anchor='mm', font=font_medium)
    if sublabel:
        draw.text((x+w//2, y+30), sublabel, fill=FG, anchor='mm', font=font_medium)

def draw_arrow(x1, y1, x2, y2, color=FG, width=2):
    draw.line([x1, y1, x2, y2], fill=color, width=width)
    # Arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    head_len = 12
    draw.line([x2, y2, x2 - head_len * math.cos(angle - math.pi/6), 
               y2 - head_len * math.sin(angle - math.pi/6)], 
              fill=color, width=width)
    draw.line([x2, y2, x2 - head_len * math.cos(angle + math.pi/6), 
               y2 - head_len * math.sin(angle + math.pi/6)], 
              fill=color, width=width)

import math

# Add ae_path to output layer (bottom right)
# Position: After Dashboard, before Daily Digest
box_x = 1300  # Right side
box_y = 720   # Bottom layer
box_w = 200
box_h = 60

# Draw ae_path box
draw_box(box_x, box_y, box_w, box_h, YELLOW, "ae_path", "Learning PWA")

# Arrow from SSOT to ae_path
draw_arrow(960, 560, 1300+box_w//2, 720, CYAN, width=2)

# Arrow from ae_path to Output
draw_arrow(1300+box_w//2, 720+60, 1300+box_w//2, 720+100, YELLOW, width=2)

# Update text to show ae_path is integrated
draw.text((960, 20), "EXOCORTEX + ae_path (Learning Dashboard)", fill=FG, anchor='mm', font=font_medium)

# Save updated image
img.save('/home/debian/clawd/exocortex-architecture-with-aepath.png')
print("✓ Updated diagram with ae_path saved")
print("  File: /home/debian/clawd/exocortex-architecture-with-aepath.png")
