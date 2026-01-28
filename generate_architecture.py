#!/usr/bin/env python3
"""
Generate Exocortex System Architecture Diagram
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle
import matplotlib.colors as mcolors
import numpy as np

# Set up the figure (1920x1080 pixels = 19.2x10.8 inches at 100 DPI)
fig, ax = plt.subplots(figsize=(19.2, 10.8), dpi=100)
ax.set_xlim(0, 1920)
ax.set_ylim(0, 1080)
ax.axis('off')

# Dark theme colors
BG_COLOR = "#1a1a2e"
PANEL_COLOR = "#16213e"
COMPONENT_COLOR = "#0f3460"
HIGHLIGHT_COLOR = "#e94560"
TEXT_COLOR = "#ffffff"
SECONDARY_COLOR = "#533483"
SUCCESS_COLOR = "#2ecc71"
INFO_COLOR = "#3498db"
WARNING_COLOR = "#f39c12"

# Background
ax.add_patch(Rectangle((0, 0), 1920, 1080, facecolor=BG_COLOR, edgecolor=BG_COLOR))

# Title
ax.text(960, 1040, "Exocortex System Architecture", 
        ha='center', va='center', fontsize=28, fontweight='bold', 
        color=TEXT_COLOR, fontfamily='sans-serif')

# Helper function to draw rounded box
def draw_box(x, y, width, height, label, color, subtext=None, icon=None):
    box = FancyBboxPatch((x, y), width, height,
                        boxstyle="round,pad=0.02,rounding_size=10",
                        facecolor=color, edgecolor=TEXT_COLOR, 
                        linewidth=2, alpha=0.9)
    ax.add_patch(box)
    
    # Main label
    ax.text(x + width/2, y + height/2, label, 
            ha='center', va='center', fontsize=14, fontweight='bold', 
            color=TEXT_COLOR, fontfamily='sans-serif')
    
    # Subtext if provided
    if subtext:
        ax.text(x + width/2, y + height/2 - 20, subtext, 
                ha='center', va='center', fontsize=10, 
                color=TEXT_COLOR, fontfamily='sans-serif')
    
    # Icon placeholder (simple symbol)
    if icon:
        ax.text(x + width/2, y + height/2 + 20, icon, 
                ha='center', va='center', fontsize=16, 
                color=TEXT_COLOR, fontfamily='sans-serif')
    
    return box

# Helper function to draw arrow
def draw_arrow(x1, y1, x2, y2, color=TEXT_COLOR, width=2, alpha=0.7):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, 
                              lw=width, alpha=alpha, 
                              shrinkA=10, shrinkB=10))

# Helper function to draw curved arrow
def draw_curved_arrow(x1, y1, x2, y2, color=TEXT_COLOR, width=2, alpha=0.7):
    # Control point for curve
    cx = (x1 + x2) / 2
    cy = max(y1, y2) + 100
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, 
                              lw=width, alpha=alpha,
                              connectionstyle=f'arc3,rad={0.3 if y2 > y1 else -0.3}'))

# Helper function to draw dashed connector
def draw_dashed_arrow(x1, y1, x2, y2, color=TEXT_COLOR, width=1.5, alpha=0.5):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, 
                              lw=width, alpha=alpha, linestyle='--',
                              shrinkA=10, shrinkB=10))

# ========== LAYOUT SECTIONS ==========

# Top: Ingestion Sources (width 1920)
ingestion_y = 950
box_w = 350
box_h = 80
spacing = 20

# Telegram
draw_box(80, ingestion_y, box_w, box_h, "Telegram", HIGHLIGHT_COLOR, 
         subtext="Voice, Commands", icon="📱")
draw_arrow(255, ingestion_y - 10, 255, 850, INFO_COLOR, 3)

# GitHub
draw_box(460, ingestion_y, box_w, box_h, "GitHub", SECONDARY_COLOR, 
         subtext="Commits, PRs, Repos", icon="💻")
draw_arrow(635, ingestion_y - 10, 635, 850, INFO_COLOR, 3)

# RSS
draw_box(840, ingestion_y, box_w, box_h, "RSS", SUCCESS_COLOR, 
         subtext="heronfeed", icon="📰")
draw_arrow(1015, ingestion_y - 10, 1015, 850, INFO_COLOR, 3)

# Webhooks
draw_box(1220, ingestion_y, box_w, box_h, "Webhooks", WARNING_COLOR, 
         subtext="External Events", icon="🔗")
draw_arrow(1395, ingestion_y - 10, 1395, 850, INFO_COLOR, 3)

# Audio Transcription (Processing Pipeline)
draw_box(1550, ingestion_y, 320, 80, "Audio Transcription", INFO_COLOR, 
         subtext="Whisper → Text", icon="🎙️")
draw_arrow(1710, ingestion_y - 10, 1710, 850, INFO_COLOR, 3)

# Middle: Processing Pipelines (width 1920)
processing_y = 750
processing_h = 80

# CLI Router (46 tools)
draw_box(200, processing_y, 380, processing_h, "CLI Router", SECONDARY_COLOR, 
         subtext="46 Tools - Smart Selection", icon="⚡")
draw_dashed_arrow(390, processing_y - 10, 390, 650, TEXT_COLOR, 2)

# Embeddings (chunking + vectors)
draw_box(620, processing_y, 380, processing_h, "Embeddings", INFO_COLOR, 
         subtext="Chunking + Vectors", icon="🧠")
draw_dashed_arrow(810, processing_y - 10, 810, 650, TEXT_COLOR, 2)

# Sub-agent Spawning
draw_box(1040, processing_y, 380, processing_h, "Sub-agent Spawning", SUCCESS_COLOR, 
         subtext="Parallel Processing", icon="👥")
draw_dashed_arrow(1230, processing_y - 10, 1230, 650, TEXT_COLOR, 2)

# Monitoring (Health Checks)
draw_box(1460, processing_y, 380, processing_h, "Monitoring", WARNING_COLOR, 
         subtext="Health Checks", icon="🔍")
draw_dashed_arrow(1650, processing_y - 10, 1650, 650, TEXT_COLOR, 2)

# Core Layers Section (Left side)
core_x = 50
core_y = 400
core_w = 400
core_h = 220

# SSOT (PostgreSQL with pgvector)
draw_box(core_x, core_y + 120, core_w, 60, "SSOT", TEXT_COLOR, 
         subtext="PostgreSQL + pgvector", icon="🗄️")
draw_arrow(core_x + core_w/2, core_y + 120 - 10, core_x + core_w/2, 650, TEXT_COLOR, 2)

# heronclient (Telegram bot)
draw_box(core_x, core_y + 50, core_w, 60, "heronclient", HIGHLIGHT_COLOR, 
         subtext="Telegram Bot", icon="🤖")

# n8n (workflows)
draw_box(core_x, core_y - 20, core_w, 60, "n8n", SECONDARY_COLOR, 
         subtext="Workflows", icon="🔄")
draw_arrow(core_x + core_w/2, core_y - 30, core_x + core_w/2, 650, TEXT_COLOR, 2)

# Core Layers Title
ax.text(core_x + core_w/2, core_y + 155, "Core Layers", 
        ha='center', va='center', fontsize=16, fontweight='bold', 
        color=TEXT_COLOR, fontfamily='sans-serif')

# Storage Section (Center-Left)
storage_x = 500
storage_y = 400
storage_w = 350
storage_h = 250

# Storage boxes
db_box_y = 480
draw_box(storage_x, db_box_y, storage_w, 50, "core.items", TEXT_COLOR, 
         subtext="Tasks/Notes", icon="📝")
draw_arrow(storage_x + storage_w/2, db_box_y + 50, storage_x + storage_w/2, 650, TEXT_COLOR, 2)

db_box_y = 420
draw_box(storage_x, db_box_y, storage_w, 50, "core.documents", TEXT_COLOR, 
         subtext="Content", icon="📄")

db_box_y = 360
draw_box(storage_x, db_box_y, storage_w, 50, "core.events", TEXT_COLOR, 
         subtext="Activity", icon="📊")

db_box_y = 300
draw_box(storage_x, db_box_y, storage_w, 50, "core.embeddings", TEXT_COLOR, 
         subtext="Vectors", icon="🔢")

# Storage Title
ax.text(storage_x + storage_w/2, storage_y + 165, "Storage Layer", 
        ha='center', va='center', fontsize=16, fontweight='bold', 
        color=TEXT_COLOR, fontfamily='sans-serif')

# Cross-cutting Section (Right side)
cross_x = 1200
cross_y = 350
cross_w = 400
cross_h = 200

# Monitoring (cross-cutting)
draw_box(cross_x, cross_y + 120, cross_w, 60, "Monitoring", WARNING_COLOR, 
         subtext="Health Checks & Alerts", icon="📡")
draw_arrow(cross_x + cross_w/2, cross_y + 120 + 80, cross_x + cross_w/2, 650, TEXT_COLOR, 2)

# CLI Router (cross-cutting reference)
draw_box(cross_x, cross_y + 40, cross_w, 60, "CLI Router", SECONDARY_COLOR, 
         subtext="Smart Tool Selection", icon="⚙️")

# Sub-agent Spawning (cross-cutting reference)
draw_box(cross_x, cross_y - 40, cross_w, 60, "Sub-agent Spawning", SUCCESS_COLOR, 
         subtext="Parallel Processing", icon="👥")

# Cross-cutting Title
ax.text(cross_x + cross_w/2, cross_y + 175, "Cross-Cutting Concerns", 
        ha='center', va='center', fontsize=16, fontweight='bold', 
        color=TEXT_COLOR, fontfamily='sans-serif')

# Output/Actions Section (Bottom)
output_y = 100
output_h = 80
output_w = 350

# Telegram Replies
draw_box(80, output_y, output_w, output_h, "Telegram Replies", HIGHLIGHT_COLOR, 
         subtext="Instant Responses", icon="📤")
draw_arrow(255, 850, 255, 180, INFO_COLOR, 3)

# Daily Digests
draw_box(460, output_y, output_w, output_h, "Daily Digests", SUCCESS_COLOR, 
         subtext="Summaries", icon="📅")
draw_arrow(635, 850, 635, 180, INFO_COLOR, 3)

# Monitoring Alerts
draw_box(840, output_y, output_w, output_h, "Monitoring Alerts", WARNING_COLOR, 
         subtext="Real-time Notifications", icon="🚨")
draw_arrow(1015, 850, 1015, 180, INFO_COLOR, 3)

# Admin Dashboard
draw_box(1220, output_y, output_w, output_h, "Admin Dashboard", SECONDARY_COLOR, 
         subtext="Control Panel", icon="🎛️")
draw_arrow(1395, 850, 1395, 180, INFO_COLOR, 3)

# Optional: Add a central processing indicator
ax.add_patch(Circle((960, 650), 40, facecolor=HIGHLIGHT_COLOR, alpha=0.8))
ax.text(960, 650, "ROUTER", ha='center', va='center', 
        fontsize=10, fontweight='bold', color=TEXT_COLOR, fontfamily='sans-serif')

# Add section labels
sections = [
    (960, 900, "INGESTION SOURCES", 16),
    (960, 700, "PROCESSING PIPELINES", 16),
    (600, 500, "STORAGE", 16),
    (1650, 500, "CROSS-CUTTING", 16),
    (960, 150, "OUTPUT/ACTIONS", 16),
]

for x, y, label, size in sections:
    ax.text(x, y, label, ha='center', va='center', fontsize=size, 
            fontweight='bold', color=TEXT_COLOR, fontfamily='sans-serif', alpha=0.6)

# Save the figure
plt.tight_layout()
plt.savefig('/home/debian/clawd/exocortex-architecture.png', 
            dpi=100, facecolor=BG_COLOR, bbox_inches='tight', pad_inches=0.5)
plt.close()

print("Architecture diagram generated successfully!")
