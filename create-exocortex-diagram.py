#!/usr/bin/env python3
"""
Create Exocortex architecture diagram
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Create canvas
width, height = 1920, 1080
img = Image.new('RGB', (width, height), color='#1a1a2e')
draw = ImageDraw.Draw(img)

# Colors
BG = '#1a1a2e'
FG = '#eaeaea'
ACCENT = '#00d4ff'
GREEN = '#00ff88'
PURPLE = '#9b59b6'
ORANGE = '#e74c3c'
BLUE = '#3498db'
YELLOW = '#f1c40f'
PINK = '#ff69b4'
GRAY = '#34495e'

# Font (try to use default)
try:
    font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
    font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
    font_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 32)
except:
    font_small = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_large = ImageFont.load_default()
    font_title = ImageFont.load_default()

def draw_box(x, y, w, h, color, label, sublabel=None, icon=None):
    """Draw a rounded box with label"""
    radius = 10
    # Outer box
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=color, outline=FG, width=2)
    # Title
    if label:
        draw.text((x+w//2, y+15), label, fill=FG, anchor='mm', font=font_medium)
    if sublabel:
        draw.text((x+w//2, y+35), sublabel, fill=FG, anchor='mm', font=font_small)
    if icon:
        draw.text((x+w//2, y+h//2+10), icon, fill=FG, anchor='mm', font=font_large)

def draw_arrow(x1, y1, x2, y2, color=FG, width=2, label=None):
    """Draw arrow between points"""
    # Line
    draw.line([x1, y1, x2, y2], fill=color, width=width)
    # Arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    head_len = 15
    draw.line([x2, y2, x2 - head_len * math.cos(angle - math.pi/6), 
               y2 - head_len * math.sin(angle - math.pi/6)], 
              fill=color, width=width)
    draw.line([x2, y2, x2 - head_len * math.cos(angle + math.pi/6), 
               y2 - head_len * math.sin(angle + math.pi/6)], 
              fill=color, width=width)
    # Label
    if label:
        mid_x = (x1 + x2) // 2
        mid_y = (y1 + y2) // 2
        draw.rectangle([mid_x-30, mid_y-12, mid_x+30, mid_y+12], fill=BG)
        draw.text((mid_x, mid_y), label, fill=color, anchor='mm', font=font_small)

def draw_connection_line(x1, y1, x2, y2, color=FG, width=2):
    """Draw curved connection line"""
    ctrl_x = x1 + (x2 - x1) // 2
    ctrl_y = y1 + (y2 - y1) // 2
    draw.line([x1, y1, ctrl_x, ctrl_y, x2, y2], fill=color, width=width)

# Title
draw.text((width//2, 50), "EXOCORTEX SYSTEM ARCHITECTURE", fill=FG, anchor='mm', font=font_title)

# Central layers (vertical stack)
layer_x = width // 2 - 150
layer_width = 300
layer_height = 80

# Row 1: Ingestion Sources (Top)
ingestion_y = 120
draw_box(layer_x - 300, ingestion_y, layer_width, layer_height, PURPLE, "Telegram", "Voice + Commands", "📱")
draw_box(layer_x + 300, ingestion_y, layer_width, layer_height, PURPLE, "GitHub", "Commits + PRs", "💻")
draw_box(layer_x, ingestion_y, layer_width, layer_height, PURPLE, "RSS Feed", "heronfeed", "📡")

# Row 2: Processing Pipelines
process_y = 240
draw_box(layer_x - 400, process_y, layer_width, layer_height, ORANGE, "Audio Pipeline", "Whisper", "🎤")
draw_box(layer_x - 100, process_y, layer_width, layer_height, ORANGE, "CLI Router", "46 Tools", "🛠️")
draw_box(layer_x + 200, process_y, layer_width, layer_height, ORANGE, "Embeddings", "Chunking + Vectors", "🧠")

# Row 3: Core Processing
core_y = 360
draw_box(layer_x, core_y, layer_width, layer_height, BLUE, "heronclient", "Bot + WebSocket", "🤖")
draw_box(layer_x + 300, core_y, layer_width, layer_height, BLUE, "n8n", "Workflows", "⚙️")

# Row 4: SSOT Storage
storage_y = 480
draw_box(layer_x, storage_y, layer_width, layer_height, GREEN, "PostgreSQL", "SSOT + pgvector", "💾")

# Row 5: Storage Tables
tables_y = 600
draw_box(layer_x - 400, tables_y, 120, 60, GREEN, "items", "tasks/notes", "")
draw_box(layer_x - 250, tables_y, 120, 60, GREEN, "documents", "content", "")
draw_box(layer_x - 100, tables_y, 120, 60, GREEN, "events", "activity", "")
draw_box(layer_x + 50, tables_y, 120, 60, GREEN, "embeddings", "vectors", "")
draw_box(layer_x + 200, tables_y, 120, 60, GREEN, "capsules", "context", "")

# Row 6: Output/Actions
output_y = 720
draw_box(layer_x - 300, output_y, layer_width, layer_height, YELLOW, "Telegram", "Replies + Alerts", "💬")
draw_box(layer_x, output_y, layer_width, layer_height, YELLOW, "Dashboard", "Monitoring", "📊")
draw_box(layer_x + 300, output_y, layer_width, layer_height, YELLOW, "Daily Digest", "Reports", "📋")

# Row 7: Monitoring Layer
monitor_y = 840
draw_box(layer_x, monitor_y, layer_width, layer_height, PINK, "Monitoring", "Health Checks", "⚠️")
draw_box(layer_x + 300, monitor_y, layer_width, layer_height, PINK, "CLI Registry", "Tool Catalog", "🔍")

# Arrows: Ingestion → Processing
draw_arrow(layer_x, ingestion_y+80, layer_x-100, process_y-10, PURPLE)  # Telegram → CLI Router
draw_arrow(layer_x+300, ingestion_y+80, layer_x+200, process_y-10, PURPLE)  # GitHub → Embeddings
draw_arrow(layer_x-300, ingestion_y+80, layer_x-400, process_y-10, PURPLE)  # RSS → Audio

# Arrows: Processing → Core
draw_arrow(layer_x-100, process_y+80, layer_x, core_y-10, ORANGE)  # CLI Router → heronclient
draw_arrow(layer_x+200, process_y+80, layer_x, core_y-10, ORANGE)  # Embeddings → heronclient
draw_arrow(layer_x-400, process_y+80, layer_x, core_y-10, ORANGE)  # Audio → heronclient

# Arrows: n8n connections
draw_arrow(layer_x+300, core_y+80, layer_x+300, storage_y-10, BLUE)  # n8n → SSOT
draw_arrow(layer_x, core_y+80, layer_x, storage_y-10, BLUE)  # heronclient → SSOT

# Arrows: SSOT → Tables (fan out)
for i in range(5):
    x_offset = i * 150 - 300
    draw_arrow(layer_x, storage_y+80, layer_x + x_offset, tables_y-10, GREEN)

# Arrows: Tables → Output
draw_arrow(layer_x-400, tables_y+60, layer_x-300, output_y-10, GREEN)  # items → Telegram
draw_arrow(layer_x-250, tables_y+60, layer_x, output_y-10, GREEN)  # documents → Dashboard
draw_arrow(layer_x-100, tables_y+60, layer_x+300, output_y-10, GREEN)  # events → Digest

# Cross-cutting: Monitoring everywhere
# Heronclient → Monitoring
draw_arrow(layer_x-50, core_y+80, layer_x, monitor_y-10, PINK, width=1)
# SSOT → Monitoring
draw_arrow(layer_x+50, storage_y+80, layer_x, monitor_y-10, PINK, width=1)
# CLI Registry → Monitoring
draw_arrow(layer_x+300, monitor_y+80, layer_x+300, process_y-10, PINK, width=1)

# Legend
legend_y = 980
draw_box(50, legend_y, 200, 70, BG, "Legend", None, None)
draw.rectangle([60, legend_y+20, 90, legend_y+30], fill=PURPLE, outline=FG)
draw.text((100, legend_y+25), "Ingestion", fill=FG, font=font_small)
draw.rectangle([60, legend_y+40, 90, legend_y+50], fill=ORANGE, outline=FG)
draw.text((100, legend_y+45), "Processing", fill=FG, font=font_small)

draw_box(280, legend_y, 200, 70, BG, "Legend", None, None)
draw.rectangle([290, legend_y+20, 320, legend_y+30], fill=BLUE, outline=FG)
draw.text((300, legend_y+25), "Core", fill=FG, font=font_small)
draw.rectangle([290, legend_y+40, 320, legend_y+50], fill=GREEN, outline=FG)
draw.text((300, legend_y+45), "Storage", fill=FG, font=font_small)

draw_box(510, legend_y, 200, 70, BG, "Legend", None, None)
draw.rectangle([520, legend_y+20, 550, legend_y+30], fill=YELLOW, outline=FG)
draw.text((530, legend_y+25), "Output", fill=FG, font=font_small)
draw.rectangle([520, legend_y+40, 550, legend_y+50], fill=PINK, outline=FG)
draw.text((530, legend_y+45), "Monitoring", fill=FG, font=font_small)

# Footer
draw.text((width//2, height-20), "Exocortex: Unified Knowledge + Action System", fill=FG, anchor='mm', font=font_small)

# Save
img.save('/home/debian/clawd/exocortex-architecture.png')
print("✓ Image saved to /home/debian/clawd/exocortex-architecture.png")
print(f"  Size: {width}x{height}")
