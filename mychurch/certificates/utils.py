# # certificates/utils.py

# from io import BytesIO
# from reportlab.lib.pagesizes import A4, landscape
# from reportlab.pdfgen import canvas
# from reportlab.lib import colors
# from reportlab.lib.utils import ImageReader
# import base64
# from datetime import datetime
# import math

# def decode_base64_image(base64_string):
#     """Decode Base64 image string to BytesIO object"""
#     if not base64_string:
#         return None
    
#     # Remove data URL prefix if present
#     if 'base64,' in base64_string:
#         base64_string = base64_string.split('base64,')[1]
    
#     try:
#         image_data = base64.b64decode(base64_string)
#         return BytesIO(image_data)
#     except Exception as e:
#         print(f"Error decoding Base64 image: {e}")
#         return None

# def draw_flower(c, x, y, size=20, color=colors.darkgoldenrod):
#     """Draw a decorative flower at given position"""
#     petals = 8
#     petal_size = size * 0.6
#     center_size = size * 0.3
    
#     # Draw petals
#     for i in range(petals):
#         angle = (i / petals) * 2 * math.pi
#         petal_x = x + math.cos(angle) * petal_size
#         petal_y = y + math.sin(angle) * petal_size
        
#         # Draw each petal as a small circle
#         c.setFillColor(color)
#         c.setStrokeColor(color)
#         c.setLineWidth(0.5)
#         c.circle(petal_x, petal_y, size * 0.25, fill=1)
    
#     # Draw inner circle
#     c.setFillColor(colors.gold)
#     c.setStrokeColor(colors.gold)
#     c.setLineWidth(1)
#     c.circle(x, y, center_size, fill=1)
    
#     # Draw inner dot
#     c.setFillColor(colors.Color(0.98, 0.92, 0.73))  # Golden background color
#     c.circle(x, y, center_size * 0.4, fill=1)
    
#     # Draw small decorative dots between petals
#     for i in range(petals):
#         angle = (i / petals) * 2 * math.pi + math.pi/petals
#         dot_x = x + math.cos(angle) * (petal_size * 0.5)
#         dot_y = y + math.sin(angle) * (petal_size * 0.5)
#         c.setFillColor(colors.gold)
#         c.circle(dot_x, dot_y, size * 0.08, fill=1)

# def draw_corner_decoration(c, x, y, size=40):
#     """Draw a decorative corner with flowers and swirls"""
#     # Outer decorative swirl
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(1.5)
    
#     # Draw swirl lines
#     points = 20
#     for i in range(points):
#         angle = (i / points) * math.pi / 2
#         r = size * (1 - i/points * 0.3)
#         cx = x + r * math.cos(angle)
#         cy = y + r * math.sin(angle)
        
#         # Draw small dots along the swirl
#         c.setFillColor(colors.darkgoldenrod)
#         c.circle(cx, cy, 1.5, fill=1)
    
#     # Draw flowers at corner
#     draw_flower(c, x + size * 0.2, y + size * 0.2, size * 0.5)
#     draw_flower(c, x + size * 0.6, y + size * 0.1, size * 0.35)
#     draw_flower(c, x + size * 0.1, y + size * 0.6, size * 0.35)

# def generate_certificate_pdf(certificate):
#     buffer = BytesIO()
    
#     # Create PDF with landscape A4
#     c = canvas.Canvas(buffer, pagesize=landscape(A4))
#     width, height = landscape(A4)
    
#     # ===== BACKGROUND - Golden Color =====
#     c.setFillColor(colors.Color(0.98, 0.92, 0.73))  # Light golden background
#     c.rect(0, 0, width, height, fill=1)
    
#     # ===== OUTER BORDER - Elegant Border with Corner Decorations =====
#     # Main thick border
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(2)
#     c.rect(35, 35, width-70, height-70)
    
#     # Inner thin border
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(0.5)
#     c.rect(50, 50, width-100, height-100)
    
#     # ===== CORNER DECORATIONS =====
#     # Top-Left Corner
#     draw_corner_decoration(c, 45, height-45, 50)
    
#     # Top-Right Corner
#     draw_corner_decoration(c, width-45, height-45, 50)
    
#     # Bottom-Left Corner
#     draw_corner_decoration(c, 45, 45, 50)
    
#     # Bottom-Right Corner
#     draw_corner_decoration(c, width-45, 45, 50)
    
#     # ===== HEADER SECTION: Logo Left (Circled), Heading Center, Person Image Right (Circled) =====
    
#     # ===== LOGO IMAGE IN CIRCLE (Top-Left) =====
#     logo_size = 65
#     logo_x = 90
#     logo_y = height - 105
#     logo_center_x = logo_x + logo_size/2
#     logo_center_y = logo_y + logo_size/2
#     logo_radius = logo_size/2
    
#     if certificate.logo_image:
#         logo_bytes = decode_base64_image(certificate.logo_image)
#         if logo_bytes:
#             try:
#                 logo_img = ImageReader(logo_bytes)
                
#                 # Save graphics state for clipping
#                 c.saveState()
                
#                 # Create circular clipping path
#                 p = c.beginPath()
#                 p.circle(logo_center_x, logo_center_y, logo_radius)
#                 c.clipPath(p, stroke=0, fill=0)
                
#                 # Draw the image - slightly larger to fill the circle
#                 img_size = logo_size * 1.1
#                 img_x = logo_x - (img_size - logo_size) / 2
#                 img_y = logo_y - (img_size - logo_size) / 2
                
#                 c.drawImage(logo_img, img_x, img_y, 
#                            width=img_size, height=img_size, 
#                            preserveAspectRatio=True)
                
#                 # Restore graphics state
#                 c.restoreState()
                
#                 # Draw circle border on top
#                 c.setStrokeColor(colors.darkgoldenrod)
#                 c.setLineWidth(2)
#                 p2 = c.beginPath()
#                 p2.circle(logo_center_x, logo_center_y, logo_radius)
#                 c.drawPath(p2)
                
#             except Exception as e:
#                 print(f"Error drawing logo: {e}")
#                 # Draw placeholder if image fails
#                 c.setFillColor(colors.lightgrey)
#                 p = c.beginPath()
#                 p.circle(logo_center_x, logo_center_y, logo_radius)
#                 c.drawPath(p, fill=1)
#                 c.setFillColor(colors.grey)
#                 c.setFont("Helvetica", 8)
#                 c.drawCentredString(logo_center_x, logo_center_y - 4, "LOGO")
#         else:
#             # Draw placeholder if decoding fails
#             c.setFillColor(colors.lightgrey)
#             p = c.beginPath()
#             p.circle(logo_center_x, logo_center_y, logo_radius)
#             c.drawPath(p, fill=1)
#             c.setFillColor(colors.grey)
#             c.setFont("Helvetica", 8)
#             c.drawCentredString(logo_center_x, logo_center_y - 4, "LOGO")
#     else:
#         # Draw empty circle
#         c.setStrokeColor(colors.darkgoldenrod)
#         c.setLineWidth(2)
#         p = c.beginPath()
#         p.circle(logo_center_x, logo_center_y, logo_radius)
#         c.drawPath(p)
    
#     # ===== PERSON IMAGE IN CIRCLE (Top-Right) =====
#     person_size = 65
#     person_x = width - 155
#     person_y = height - 105
#     person_center_x = person_x + person_size/2
#     person_center_y = person_y + person_size/2
#     person_radius = person_size/2
    
#     if certificate.person_image:
#         person_bytes = decode_base64_image(certificate.person_image)
#         if person_bytes:
#             try:
#                 person_img = ImageReader(person_bytes)
                
#                 # Save graphics state for clipping
#                 c.saveState()
                
#                 # Create circular clipping path
#                 p = c.beginPath()
#                 p.circle(person_center_x, person_center_y, person_radius)
#                 c.clipPath(p, stroke=0, fill=0)
                
#                 # Draw the image - slightly larger to fill the circle
#                 img_size = person_size * 1.1
#                 img_x = person_x - (img_size - person_size) / 2
#                 img_y = person_y - (img_size - person_size) / 2
                
#                 c.drawImage(person_img, img_x, img_y, 
#                            width=img_size, height=img_size, 
#                            preserveAspectRatio=True)
                
#                 # Restore graphics state
#                 c.restoreState()
                
#                 # Draw circle border on top
#                 c.setStrokeColor(colors.darkgoldenrod)
#                 c.setLineWidth(2)
#                 p2 = c.beginPath()
#                 p2.circle(person_center_x, person_center_y, person_radius)
#                 c.drawPath(p2)
                
#             except Exception as e:
#                 print(f"Error drawing person image: {e}")
#                 # Draw placeholder if image fails
#                 c.setFillColor(colors.lightgrey)
#                 p = c.beginPath()
#                 p.circle(person_center_x, person_center_y, person_radius)
#                 c.drawPath(p, fill=1)
#                 c.setFillColor(colors.grey)
#                 c.setFont("Helvetica", 8)
#                 c.drawCentredString(person_center_x, person_center_y - 4, "PHOTO")
#         else:
#             # Draw placeholder if decoding fails
#             c.setFillColor(colors.lightgrey)
#             p = c.beginPath()
#             p.circle(person_center_x, person_center_y, person_radius)
#             c.drawPath(p, fill=1)
#             c.setFillColor(colors.grey)
#             c.setFont("Helvetica", 8)
#             c.drawCentredString(person_center_x, person_center_y - 4, "PHOTO")
#     else:
#         # Draw empty circle
#         c.setStrokeColor(colors.darkgoldenrod)
#         c.setLineWidth(2)
#         p = c.beginPath()
#         p.circle(person_center_x, person_center_y, person_radius)
#         c.drawPath(p)
    
#     # ===== HEADING - Top Center =====
#     heading_text = certificate.heading or "SEVENTH-DAY ADVENTIST CHURCH"
#     heading_lines = heading_text.split('\n') if '\n' in heading_text else [heading_text]
    
#     max_line_len = max([len(line) for line in heading_lines]) if heading_lines else 0
    
#     if max_line_len <= 25:
#         heading_font_size = 22
#     elif max_line_len <= 35:
#         heading_font_size = 18
#     elif max_line_len <= 45:
#         heading_font_size = 15
#     else:
#         heading_font_size = 13
    
#     c.setFillColor(colors.Color(0.1, 0.2, 0.4))
#     heading_y = height - 80
    
#     for i, line in enumerate(heading_lines):
#         c.setFont("Helvetica-Bold", heading_font_size - (i * 2) if i > 0 else heading_font_size)
#         c.drawCentredString(width/2, heading_y - (i * 25), line.upper())
    
#     # ===== SUB-HEADING 1: CENTRAL TANZANIA FIELD =====
#     sub_heading1_y = heading_y - (len(heading_lines) * 25) - 10
#     c.setFont("Helvetica-Bold", 16)
#     c.setFillColor(colors.darkgoldenrod)
#     c.drawCentredString(width/2, sub_heading1_y, "CENTRAL TANZANIA FIELD (CTF)")
    
#     # ===== SUB-HEADING 2: IYUMBU SDA CHURCH =====
#     sub_heading2_y = sub_heading1_y - 22
#     c.setFont("Helvetica-Bold", 14)
#     c.setFillColor(colors.Color(0.1, 0.2, 0.4))
#     c.drawCentredString(width/2, sub_heading2_y, "IYUMBU SDA CHURCH")
    
#     # ===== CERTIFICATE TITLE =====
#     title_y = sub_heading2_y - 30
#     c.setFont("Helvetica-Bold", 18)
#     c.setFillColor(colors.darkgoldenrod)
#     c.drawCentredString(width/2, title_y, "THE CERTIFICATE OF LEADERSHIP COMPLETION")
    
#     # ===== SUBTITLE =====
#     subtitle_y = title_y - 25
#     c.setFont("Helvetica", 12)
#     c.setFillColor(colors.black)
#     c.drawCentredString(width/2, subtitle_y, "This certificate is proudly presented to")
    
#     # ===== PERSON NAME =====
#     name_y = subtitle_y - 30
#     name = certificate.person_name.upper() if certificate.person_name else "RECIPIENT NAME"
    
#     if len(name) <= 20:
#         name_font_size = 30
#     elif len(name) <= 30:
#         name_font_size = 24
#     elif len(name) <= 40:
#         name_font_size = 20
#     else:
#         name_font_size = 17
    
#     c.setFont("Helvetica-Bold", name_font_size)
#     c.setFillColor(colors.Color(0.6, 0.1, 0.1))  # Dark red for emphasis
#     c.drawCentredString(width/2, name_y, name)
    
#     # ===== POSITION =====
#     position_y = name_y - 30
#     position = certificate.get_display_position().upper() if certificate.position else "POSITION"
    
#     if len(position) <= 30:
#         position_font_size = 16
#     elif len(position) <= 45:
#         position_font_size = 14
#     else:
#         position_font_size = 12
    
#     c.setFont("Helvetica-Bold", position_font_size)
#     c.setFillColor(colors.Color(0.1, 0.2, 0.4))
#     c.drawCentredString(width/2, position_y, position)
    
#     # ===== ACHIEVEMENT TEXT =====
#     achievement_y = position_y - 25
#     c.setFont("Helvetica", 12)
#     c.setFillColor(colors.black)
#     c.drawCentredString(width/2, achievement_y, "for completing the leadership program with")
#     c.drawCentredString(width/2, achievement_y - 18, "distinction and dedication")
    
#     # ===== WORKING TIME =====
#     if certificate.working_time:
#         working_y = achievement_y - 40
#         c.setFont("Helvetica", 13)
#         c.setFillColor(colors.darkgoldenrod)
#         c.drawCentredString(width/2, working_y, f"Having served faithfully for {certificate.working_time}")
    
#     # ===== ADDITIONAL NOTES =====
#     if certificate.additional_notes:
#         notes_y = achievement_y - 65 if not certificate.working_time else achievement_y - 65
        
#         c.setFont("Helvetica-Oblique", 10)
#         c.setFillColor(colors.darkgoldenrod)
#         c.drawCentredString(width/2, notes_y, "Notes:")
        
#         notes = certificate.additional_notes
#         notes_lines = []
#         words = notes.split()
#         line = ""
#         for word in words:
#             test_line = line + " " + word if line else word
#             if len(test_line) <= 75:
#                 line = test_line
#             else:
#                 notes_lines.append(line)
#                 line = word
#         if line:
#             notes_lines.append(line)
        
#         y_pos = notes_y - 18
#         for line in notes_lines[:3]:
#             c.drawCentredString(width/2, y_pos, line)
#             y_pos -= 14
    
#     # ===== SIGNATURE SECTION =====
#     if certificate.additional_notes:
#         sig_y = 120
#     elif certificate.working_time:
#         sig_y = 125
#     else:
#         sig_y = 130
    
#     # LEFT SIGNATURE - Person's Signature
#     c.setFont("Helvetica-Bold", 10)
#     c.setFillColor(colors.black)
#     c.drawCentredString(210, sig_y + 35, "SIGNED BY")
    
#     c.setStrokeColor(colors.black)
#     c.setLineWidth(1)
#     c.line(80, sig_y, 340, sig_y)
    
#     if certificate.signature_person:
#         sig_bytes = decode_base64_image(certificate.signature_person)
#         if sig_bytes:
#             try:
#                 sig_img = ImageReader(sig_bytes)
#                 c.drawImage(sig_img, 120, sig_y + 5, width=180, height=45, preserveAspectRatio=True)
#             except:
#                 pass
    
#     c.setFont("Helvetica", 8)
#     c.setFillColor(colors.grey)
#     c.drawCentredString(210, sig_y - 15, "(Signature)")
    
#     # RIGHT SIGNATURE - Leader's Signature
#     c.setFont("Helvetica-Bold", 10)
#     c.setFillColor(colors.black)
#     c.drawCentredString(width - 210, sig_y + 35, "CHURCH LEADER")
    
#     c.setStrokeColor(colors.black)
#     c.setLineWidth(1)
#     c.line(width - 340, sig_y, width - 80, sig_y)
    
#     if certificate.leader_signature:
#         sig_bytes = decode_base64_image(certificate.leader_signature)
#         if sig_bytes:
#             try:
#                 sig_img = ImageReader(sig_bytes)
#                 c.drawImage(sig_img, width - 340, sig_y + 5, width=180, height=45, preserveAspectRatio=True)
#             except:
#                 pass
    
#     c.setFont("Helvetica", 8)
#     c.setFillColor(colors.grey)
#     c.drawCentredString(width - 210, sig_y - 15, "(Signature)")
    
#     # ===== CENTER - Date and Certificate Number =====
#     date_str = certificate.issue_date.strftime("%B %d, %Y") if certificate.issue_date else datetime.now().strftime("%B %d, %Y")
#     c.setFont("Helvetica", 10)
#     c.setFillColor(colors.black)
#     c.drawCentredString(width/2, sig_y - 20, f"Issued on: {date_str}")
    
#     c.setFont("Helvetica", 8)
#     c.setFillColor(colors.grey)
#     c.drawCentredString(width/2, sig_y - 35, f"Certificate No: {certificate.certificate_number}")
    
#     # ===== SEAL - Bottom Center Right =====
#     seal_x = width/2 + 250
#     seal_y = sig_y + 25
#     seal_radius = 30
    
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(2)
#     p = c.beginPath()
#     p.circle(seal_x, seal_y, seal_radius)
#     c.drawPath(p)
    
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(1)
#     p = c.beginPath()
#     p.circle(seal_x, seal_y, seal_radius - 3)
#     c.drawPath(p)
    
#     c.setFillColor(colors.darkgoldenrod)
#     c.setStrokeColor(colors.darkgoldenrod)
#     c.setLineWidth(2)
#     c.rect(seal_x - 2, seal_y - 10, 4, 20, fill=1)
#     c.rect(seal_x - 10, seal_y - 2, 20, 4, fill=1)
    
#     # ===== FOOTER - Padded from bottom =====
#     # Footer line 1
#     c.setFont("Helvetica", 8)
#     c.setFillColor(colors.darkgoldenrod)
#     c.drawCentredString(width/2, 78, "This certificate recognizes the completion of leadership training")
    
#     # Footer line 2
#     c.setFont("Helvetica", 7)
#     c.setFillColor(colors.darkgoldenrod)
#     c.drawCentredString(width/2, 66, "May God continue to bless and guide you in your service")
    
#     c.save()
#     buffer.seek(0)
#     return buffer

# def convert_pdf_to_base64(pdf_buffer):
#     """Convert PDF buffer to Base64 string"""
#     pdf_data = pdf_buffer.getvalue()
#     base64_pdf = base64.b64encode(pdf_data).decode('utf-8')
#     return f"data:application/pdf;base64,{base64_pdf}"





# certificates/utils.py

from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
import base64
from datetime import datetime
import math

def decode_base64_image(base64_string):
    """Decode Base64 image string to BytesIO object"""
    if not base64_string:
        return None
    
    # Remove data URL prefix if present
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    
    try:
        image_data = base64.b64decode(base64_string)
        return BytesIO(image_data)
    except Exception as e:
        print(f"Error decoding Base64 image: {e}")
        return None

def draw_flower(c, x, y, size=20, color=colors.darkgoldenrod):
    """Draw a decorative flower at given position"""
    petals = 8
    petal_size = size * 0.6
    center_size = size * 0.3
    
    # Draw petals
    for i in range(petals):
        angle = (i / petals) * 2 * math.pi
        petal_x = x + math.cos(angle) * petal_size
        petal_y = y + math.sin(angle) * petal_size
        
        # Draw each petal as a small circle
        c.setFillColor(color)
        c.setStrokeColor(color)
        c.setLineWidth(0.5)
        c.circle(petal_x, petal_y, size * 0.25, fill=1)
    
    # Draw inner circle
    c.setFillColor(colors.gold)
    c.setStrokeColor(colors.gold)
    c.setLineWidth(1)
    c.circle(x, y, center_size, fill=1)
    
    # Draw inner dot
    c.setFillColor(colors.Color(0.98, 0.92, 0.73))
    c.circle(x, y, center_size * 0.4, fill=1)
    
    # Draw small decorative dots between petals
    for i in range(petals):
        angle = (i / petals) * 2 * math.pi + math.pi/petals
        dot_x = x + math.cos(angle) * (petal_size * 0.5)
        dot_y = y + math.sin(angle) * (petal_size * 0.5)
        c.setFillColor(colors.gold)
        c.circle(dot_x, dot_y, size * 0.08, fill=1)

def draw_corner_decoration(c, x, y, size=40):
    """Draw a decorative corner with flowers and swirls"""
    # Outer decorative swirl
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(1.5)
    
    # Draw swirl lines
    points = 20
    for i in range(points):
        angle = (i / points) * math.pi / 2
        r = size * (1 - i/points * 0.3)
        cx = x + r * math.cos(angle)
        cy = y + r * math.sin(angle)
        
        # Draw small dots along the swirl
        c.setFillColor(colors.darkgoldenrod)
        c.circle(cx, cy, 1.5, fill=1)
    
    # Draw flowers at corner
    draw_flower(c, x + size * 0.2, y + size * 0.2, size * 0.5)
    draw_flower(c, x + size * 0.6, y + size * 0.1, size * 0.35)
    draw_flower(c, x + size * 0.1, y + size * 0.6, size * 0.35)

def generate_certificate_pdf(certificate):
    """Generate certificate PDF with elegant design"""
    buffer = BytesIO()
    
    # Create PDF with landscape A4
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # ===== BACKGROUND - Golden Color =====
    c.setFillColor(colors.Color(0.98, 0.92, 0.73))  # Light golden background
    c.rect(0, 0, width, height, fill=1)
    
    # ===== OUTER BORDER - Elegant Border with Corner Decorations =====
    # Main thick border
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(2)
    c.rect(35, 35, width-70, height-70)
    
    # Inner thin border
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(0.5)
    c.rect(50, 50, width-100, height-100)
    
    # ===== CORNER DECORATIONS =====
    # Top-Left Corner
    draw_corner_decoration(c, 45, height-45, 50)
    
    # Top-Right Corner
    draw_corner_decoration(c, width-45, height-45, 50)
    
    # Bottom-Left Corner
    draw_corner_decoration(c, 45, 45, 50)
    
    # Bottom-Right Corner
    draw_corner_decoration(c, width-45, 45, 50)
    
    # ===== HEADER SECTION: Logo Left, Heading Center, Person Image Right =====
    
    # ===== LOGO IMAGE IN CIRCLE (Top-Left) =====
    logo_size = 65
    logo_x = 90
    logo_y = height - 105
    logo_center_x = logo_x + logo_size/2
    logo_center_y = logo_y + logo_size/2
    logo_radius = logo_size/2
    
    if certificate.logo_image:
        logo_bytes = decode_base64_image(certificate.logo_image)
        if logo_bytes:
            try:
                logo_img = ImageReader(logo_bytes)
                
                # Save graphics state for clipping
                c.saveState()
                
                # Create circular clipping path
                p = c.beginPath()
                p.circle(logo_center_x, logo_center_y, logo_radius)
                c.clipPath(p, stroke=0, fill=0)
                
                # Draw the image - slightly larger to fill the circle
                img_size = logo_size * 1.1
                img_x = logo_x - (img_size - logo_size) / 2
                img_y = logo_y - (img_size - logo_size) / 2
                
                c.drawImage(logo_img, img_x, img_y, 
                           width=img_size, height=img_size, 
                           preserveAspectRatio=True)
                
                # Restore graphics state
                c.restoreState()
                
                # Draw circle border on top
                c.setStrokeColor(colors.darkgoldenrod)
                c.setLineWidth(2)
                p2 = c.beginPath()
                p2.circle(logo_center_x, logo_center_y, logo_radius)
                c.drawPath(p2)
                
            except Exception as e:
                print(f"Error drawing logo: {e}")
                # Draw placeholder if image fails
                c.setFillColor(colors.lightgrey)
                p = c.beginPath()
                p.circle(logo_center_x, logo_center_y, logo_radius)
                c.drawPath(p, fill=1)
                c.setFillColor(colors.grey)
                c.setFont("Helvetica", 8)
                c.drawCentredString(logo_center_x, logo_center_y - 4, "LOGO")
        else:
            # Draw placeholder if decoding fails
            c.setFillColor(colors.lightgrey)
            p = c.beginPath()
            p.circle(logo_center_x, logo_center_y, logo_radius)
            c.drawPath(p, fill=1)
            c.setFillColor(colors.grey)
            c.setFont("Helvetica", 8)
            c.drawCentredString(logo_center_x, logo_center_y - 4, "LOGO")
    else:
        # Draw empty circle
        c.setStrokeColor(colors.darkgoldenrod)
        c.setLineWidth(2)
        p = c.beginPath()
        p.circle(logo_center_x, logo_center_y, logo_radius)
        c.drawPath(p)
    
    # ===== PERSON IMAGE IN CIRCLE (Top-Right) =====
    person_size = 65
    person_x = width - 155
    person_y = height - 105
    person_center_x = person_x + person_size/2
    person_center_y = person_y + person_size/2
    person_radius = person_size/2
    
    if certificate.person_image:
        person_bytes = decode_base64_image(certificate.person_image)
        if person_bytes:
            try:
                person_img = ImageReader(person_bytes)
                
                # Save graphics state for clipping
                c.saveState()
                
                # Create circular clipping path
                p = c.beginPath()
                p.circle(person_center_x, person_center_y, person_radius)
                c.clipPath(p, stroke=0, fill=0)
                
                # Draw the image - slightly larger to fill the circle
                img_size = person_size * 1.1
                img_x = person_x - (img_size - person_size) / 2
                img_y = person_y - (img_size - person_size) / 2
                
                c.drawImage(person_img, img_x, img_y, 
                           width=img_size, height=img_size, 
                           preserveAspectRatio=True)
                
                # Restore graphics state
                c.restoreState()
                
                # Draw circle border on top
                c.setStrokeColor(colors.darkgoldenrod)
                c.setLineWidth(2)
                p2 = c.beginPath()
                p2.circle(person_center_x, person_center_y, person_radius)
                c.drawPath(p2)
                
            except Exception as e:
                print(f"Error drawing person image: {e}")
                # Draw placeholder if image fails
                c.setFillColor(colors.lightgrey)
                p = c.beginPath()
                p.circle(person_center_x, person_center_y, person_radius)
                c.drawPath(p, fill=1)
                c.setFillColor(colors.grey)
                c.setFont("Helvetica", 8)
                c.drawCentredString(person_center_x, person_center_y - 4, "PHOTO")
        else:
            # Draw placeholder if decoding fails
            c.setFillColor(colors.lightgrey)
            p = c.beginPath()
            p.circle(person_center_x, person_center_y, person_radius)
            c.drawPath(p, fill=1)
            c.setFillColor(colors.grey)
            c.setFont("Helvetica", 8)
            c.drawCentredString(person_center_x, person_center_y - 4, "PHOTO")
    else:
        # Draw empty circle
        c.setStrokeColor(colors.darkgoldenrod)
        c.setLineWidth(2)
        p = c.beginPath()
        p.circle(person_center_x, person_center_y, person_radius)
        c.drawPath(p)
    
    # ===== HEADING - Top Center =====
    heading_text = certificate.heading or "SEVENTH-DAY ADVENTIST CHURCH"
    heading_lines = heading_text.split('\n') if '\n' in heading_text else [heading_text]
    
    max_line_len = max([len(line) for line in heading_lines]) if heading_lines else 0
    
    if max_line_len <= 25:
        heading_font_size = 22
    elif max_line_len <= 35:
        heading_font_size = 18
    elif max_line_len <= 45:
        heading_font_size = 15
    else:
        heading_font_size = 13
    
    c.setFillColor(colors.Color(0.1, 0.2, 0.4))
    heading_y = height - 80
    
    for i, line in enumerate(heading_lines):
        c.setFont("Helvetica-Bold", heading_font_size - (i * 2) if i > 0 else heading_font_size)
        c.drawCentredString(width/2, heading_y - (i * 25), line.upper())
    
    # ===== SUB-HEADING 1: CENTRAL TANZANIA FIELD =====
    sub_heading1_y = heading_y - (len(heading_lines) * 25) - 10
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.darkgoldenrod)
    c.drawCentredString(width/2, sub_heading1_y, "CENTRAL TANZANIA FIELD (CTF)")
    
    # ===== SUB-HEADING 2: IYUMBU SDA CHURCH =====
    sub_heading2_y = sub_heading1_y - 22
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.Color(0.1, 0.2, 0.4))
    c.drawCentredString(width/2, sub_heading2_y, "IYUMBU SDA CHURCH")
    
    # ===== CERTIFICATE TITLE =====
    title_y = sub_heading2_y - 30
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.darkgoldenrod)
    c.drawCentredString(width/2, title_y, "THE CERTIFICATE OF LEADERSHIP COMPLETION")
    
    # ===== SUBTITLE =====
    subtitle_y = title_y - 25
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    c.drawCentredString(width/2, subtitle_y, "This certificate is proudly presented to")
    
    # ===== PERSON NAME =====
    name_y = subtitle_y - 30
    if certificate.person_name:
        name = f"{certificate.person_name.first_name} {certificate.person_name.last_name}".upper()
    else:
        name = "RECIPIENT NAME"
    
    if len(name) <= 20:
        name_font_size = 30
    elif len(name) <= 30:
        name_font_size = 24
    elif len(name) <= 40:
        name_font_size = 20
    else:
        name_font_size = 17
    
    c.setFont("Helvetica-Bold", name_font_size)
    c.setFillColor(colors.Color(0.6, 0.1, 0.1))  # Dark red for emphasis
    c.drawCentredString(width/2, name_y, name)
    
    # ===== POSITION =====
    position_y = name_y - 30
    position = certificate.get_display_position().upper() if certificate.position else "POSITION"
    
    if len(position) <= 30:
        position_font_size = 16
    elif len(position) <= 45:
        position_font_size = 14
    else:
        position_font_size = 12
    
    c.setFont("Helvetica-Bold", position_font_size)
    c.setFillColor(colors.Color(0.1, 0.2, 0.4))
    c.drawCentredString(width/2, position_y, position)
    
    # ===== ACHIEVEMENT TEXT =====
    achievement_y = position_y - 25
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    c.drawCentredString(width/2, achievement_y, "for completing the leadership program with")
    c.drawCentredString(width/2, achievement_y - 18, "distinction and dedication")
    
    # ===== WORKING TIME =====
    if certificate.working_time:
        working_y = achievement_y - 40
        c.setFont("Helvetica", 13)
        c.setFillColor(colors.darkgoldenrod)
        c.drawCentredString(width/2, working_y, f"Having served faithfully for {certificate.working_time}")
    
    # ===== ADDITIONAL NOTES =====
    if certificate.additional_notes:
        notes_y = achievement_y - 65 if not certificate.working_time else achievement_y - 65
        
        c.setFont("Helvetica-Oblique", 10)
        c.setFillColor(colors.darkgoldenrod)
        c.drawCentredString(width/2, notes_y, "Notes:")
        
        notes = certificate.additional_notes
        notes_lines = []
        words = notes.split()
        line = ""
        for word in words:
            test_line = line + " " + word if line else word
            if len(test_line) <= 75:
                line = test_line
            else:
                notes_lines.append(line)
                line = word
        if line:
            notes_lines.append(line)
        
        y_pos = notes_y - 18
        for line in notes_lines[:3]:
            c.drawCentredString(width/2, y_pos, line)
            y_pos -= 14
    
    # ===== SIGNATURE SECTION =====
    if certificate.additional_notes:
        sig_y = 120
    elif certificate.working_time:
        sig_y = 125
    else:
        sig_y = 130
    
    # LEFT SIGNATURE - Person's Signature
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.black)
    c.drawCentredString(210, sig_y + 35, "SIGNED BY")
    
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.line(80, sig_y, 340, sig_y)
    
    if certificate.signature_person:
        sig_bytes = decode_base64_image(certificate.signature_person)
        if sig_bytes:
            try:
                sig_img = ImageReader(sig_bytes)
                c.drawImage(sig_img, 120, sig_y + 5, width=180, height=45, preserveAspectRatio=True)
            except:
                pass
    
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(210, sig_y - 15, "(Signature)")
    
    # RIGHT SIGNATURE - Leader's Signature
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.black)
    c.drawCentredString(width - 210, sig_y + 35, "CHURCH LEADER")
    
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.line(width - 340, sig_y, width - 80, sig_y)
    
    if certificate.leader_signature:
        sig_bytes = decode_base64_image(certificate.leader_signature)
        if sig_bytes:
            try:
                sig_img = ImageReader(sig_bytes)
                c.drawImage(sig_img, width - 340, sig_y + 5, width=180, height=45, preserveAspectRatio=True)
            except:
                pass
    
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(width - 210, sig_y - 15, "(Signature)")
    
    # ===== CENTER - Date and Certificate Number =====
    date_str = certificate.issue_date.strftime("%B %d, %Y") if certificate.issue_date else datetime.now().strftime("%B %d, %Y")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawCentredString(width/2, sig_y - 20, f"Issued on: {date_str}")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(width/2, sig_y - 35, f"Certificate No: {certificate.certificate_number}")
    
    # ===== SEAL - Bottom Center Right =====
    seal_x = width/2 + 250
    seal_y = sig_y + 25
    seal_radius = 30
    
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(2)
    p = c.beginPath()
    p.circle(seal_x, seal_y, seal_radius)
    c.drawPath(p)
    
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(1)
    p = c.beginPath()
    p.circle(seal_x, seal_y, seal_radius - 3)
    c.drawPath(p)
    
    c.setFillColor(colors.darkgoldenrod)
    c.setStrokeColor(colors.darkgoldenrod)
    c.setLineWidth(2)
    c.rect(seal_x - 2, seal_y - 10, 4, 20, fill=1)
    c.rect(seal_x - 10, seal_y - 2, 20, 4, fill=1)
    
    # ===== FOOTER - Padded from bottom =====
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.darkgoldenrod)
    c.drawCentredString(width/2, 78, "This certificate recognizes the completion of leadership training")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.darkgoldenrod)
    c.drawCentredString(width/2, 66, "May God continue to bless and guide you in your service")
    
    c.save()
    buffer.seek(0)
    return buffer

def convert_pdf_to_base64(pdf_buffer):
    """Convert PDF buffer to Base64 string"""
    pdf_data = pdf_buffer.getvalue()
    base64_pdf = base64.b64encode(pdf_data).decode('utf-8')
    return f"data:application/pdf;base64,{base64_pdf}"

def convert_image_to_base64(image_file):
    """Convert uploaded image file to Base64 string"""
    try:
        image_data = image_file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        content_type = image_file.content_type or 'image/png'
        return f"data:{content_type};base64,{base64_image}"
    except Exception as e:
        return None