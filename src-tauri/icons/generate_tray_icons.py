import os
from PIL import Image, ImageDraw

def create_icon(state_name, color, draw_func, size=32):
    # Create an RGBA image with transparent background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Execute state-specific drawing logic
    draw_func(draw, size, color)
    
    # Save the icon
    icon_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(icon_dir, f"tray_{state_name}.png")
    img.save(file_path, "PNG")
    print(f"Generated: {file_path}")

# Drawing functions for each state icon

def draw_idle(draw, size, color):
    # Crisp white microphone outline
    # Mic capsule (rounded rectangle)
    draw.rounded_rectangle([11, 6, 20, 19], radius=4, outline=color, width=2)
    # Stand (U-shape)
    draw.arc([8, 12, 23, 22], start=0, end=180, fill=color, width=2)
    # Stem
    draw.line([16, 22, 16, 26], fill=color, width=2)
    # Base
    draw.line([11, 26, 21, 26], fill=color, width=2)

def draw_recording(draw, size, color):
    # Vibrant red glowing microphone capsule
    # Outer glow (soft red circle)
    draw.ellipse([3, 3, 28, 28], fill=(239, 68, 68, 40))
    # Inner red mic capsule
    draw.rounded_rectangle([11, 6, 20, 19], radius=4, fill=color, outline=color, width=2)
    # Stand
    draw.arc([8, 12, 23, 22], start=0, end=180, fill=color, width=2)
    draw.line([16, 22, 16, 26], fill=color, width=2)
    draw.line([11, 26, 21, 26], fill=color, width=2)

def draw_transcribing(draw, size, color):
    # Cyan processing wave/circle
    # Let's draw three modern vertical waveform bars
    # Left bar
    draw.rounded_rectangle([9, 10, 12, 22], radius=1, fill=color)
    # Center bar
    draw.rounded_rectangle([14, 5, 17, 27], radius=1, fill=color)
    # Right bar
    draw.rounded_rectangle([19, 9, 22, 23], radius=1, fill=color)

def draw_formatting(draw, size, color):
    # Purple premium sparkle/star
    # Center point (16, 16)
    # Top-to-bottom and left-to-right flare lines, plus inner polygon for diamond star
    points = [
        (16, 4),    # Top
        (18, 13),   # Top-Right inner
        (28, 16),   # Right
        (18, 19),   # Bottom-Right inner
        (16, 28),   # Bottom
        (14, 19),   # Bottom-Left inner
        (4, 16),    # Left
        (14, 13),   # Top-Left inner
    ]
    draw.polygon(points, fill=color, outline=color)
    # Add a small helper sparkle in the top-right quadrant
    draw.ellipse([22, 6, 25, 9], fill=color)

def draw_success(draw, size, color):
    # Emerald green thick checkmark
    # Start (8, 15) -> (14, 21) -> (24, 9)
    draw.line([8, 15, 14, 21], fill=color, width=3, joint="round")
    draw.line([14, 21, 24, 9], fill=color, width=3, joint="round")

def draw_error(draw, size, color):
    # Red exclamation warning triangle
    points = [
        (16, 5),   # Top
        (28, 26),  # Bottom-Right
        (4, 26),   # Bottom-Left
    ]
    draw.polygon(points, fill=color)
    # Exclamation mark inside (white)
    draw.line([16, 11, 16, 19], fill=(255, 255, 255, 255), width=2)
    draw.ellipse([15, 22, 17, 24], fill=(255, 255, 255, 255))

if __name__ == "__main__":
    # Color scheme
    colors = {
        "idle": (255, 255, 255, 220),          # Soft white
        "recording": (239, 68, 68, 255),       # Tailwind Red-500
        "transcribing": (34, 211, 238, 255),   # Tailwind Cyan-400
        "formatting": (168, 85, 247, 255),     # Tailwind Purple-500
        "success": (16, 185, 129, 255),        # Tailwind Emerald-500
        "error": (248, 113, 113, 255),         # Tailwind Red-400
    }
    
    # Generate 32x32 size icons
    create_icon("idle", colors["idle"], draw_idle, size=32)
    create_icon("recording", colors["recording"], draw_recording, size=32)
    create_icon("transcribing", colors["transcribing"], draw_transcribing, size=32)
    create_icon("formatting", colors["formatting"], draw_formatting, size=32)
    create_icon("success", colors["success"], draw_success, size=32)
    create_icon("error", colors["error"], draw_error, size=32)
    
    print("All system tray icons successfully generated!")
