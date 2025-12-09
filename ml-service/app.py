import os
# ----------------------------------------------------
# 🔥 FORCE CPU — disable GPU to stop CUDA OOM errors
# ----------------------------------------------------
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:32"

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import easyocr
import re

app = Flask(__name__)
CORS(app)

# Load models (CPU only)
model = YOLO('yolov8n.pt')
reader = easyocr.Reader(['en'], gpu=False)

# ----------------------------------------------
# Helper: Remove number-plate borders
# ----------------------------------------------
def remove_borders(img):
    h, w = img.shape[:2]
    border_thickness_h = int(h * 0.08)
    border_thickness_w = int(w * 0.06)
    return img[border_thickness_h: h - border_thickness_h,
               border_thickness_w: w - border_thickness_w]

# ----------------------------------------------
# MAIN DETECTION FUNCTION
# ----------------------------------------------
def enhanced_number_plate_detection(img):
    print("🚀 Starting ENHANCED number plate detection...")

    best_text = ""
    best_confidence = 0

    # ---------------------------------------------------------
    # Remove borders
    # ---------------------------------------------------------
    img_no_border = remove_borders(img)

    # ---------------------------------------------------------
    # Strategy 1: Full image OCR (primary)
    # ---------------------------------------------------------
    print("🔍 Strategy 1: Full image OCR...")
    ocr_results = reader.readtext(
        img_no_border,
        decoder='beamsearch',
        beamWidth=15,
        contrast_ths=0.01,
        adjust_contrast=0.9,
        width_ths=2.0,
        text_threshold=0.2,
        link_threshold=0.2,
        mag_ratio=2.0
    )

    line_texts = []
    for bbox, text, conf in ocr_results:
        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
        print(f"   📝 Found: '{text}' -> '{cleaned}' (conf: {conf:.3f})")
        if len(cleaned) >= 3:
            line_texts.append(cleaned)
        if (6 <= len(cleaned) <= 12 and any(c.isalpha() for c in cleaned) and
            any(c.isdigit() for c in cleaned) and conf > best_confidence):
            best_text = cleaned
            best_confidence = conf
            print(f"   🎯 POTENTIAL PLATE: {best_text}")

    # ---------------------------------------------------------
    # Strategy 2: Preprocessing + OCR (only if needed)
    # ---------------------------------------------------------
    if not best_text:
        print("🔍 Strategy 2: Preprocessing + OCR...")
        # Only apply CLAHE for faster processing
        lab = cv2.cvtColor(img_no_border, cv2.COLOR_BGR2LAB)
        lab[:, :, 0] = cv2.createCLAHE(clipLimit=3.0).apply(lab[:, :, 0])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        ocr_results = reader.readtext(
            enhanced,
            decoder='beamsearch',
            beamWidth=20,
            contrast_ths=0.01,
            text_threshold=0.1,
            link_threshold=0.1
        )
        for bbox, text, conf in ocr_results:
            cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
            if len(cleaned) >= 4 and conf > best_confidence:
                best_text = cleaned
                best_confidence = conf
                print(f"   🎯 FOUND: {best_text}")

    # ---------------------------------------------------------
    # Strategy 3: YOLO Detection + OCR (only if all above fail)
    # ---------------------------------------------------------
    if not best_text:
        print("🔍 Strategy 3: YOLO detection...")
        results = model(img_no_border, conf=0.3)
        if results[0].boxes is not None:
            for i, box in enumerate(results[0].boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                region = img_no_border[y1:y2, x1:x2]
                if region.size > 0:
                    region = remove_borders(region)
                    ocr_results = reader.readtext(region, contrast_ths=0.01)
                    for bbox, text, region_conf in ocr_results:
                        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
                        if len(cleaned) >= 4 and region_conf > best_confidence:
                            best_text = cleaned
                            best_confidence = region_conf
                            print(f"   🎯 YOLO+OCR: {best_text}")

    # ---------------------------------------------------------
    # FINAL: Combine multi-line OCR (RAW concat)
    # ---------------------------------------------------------
    if len(line_texts) >= 2:
        combined = "".join(line_texts)
        print(f"   🔥 Combined Plate (RAW CONCAT): {combined}")
        best_text = combined
        best_confidence = 0.90

    return best_text, best_confidence

# -------------------------------------------------------------
# API ROUTES
# -------------------------------------------------------------
@app.route('/detect-bike-number', methods=['POST'])
def detect_bike_number():
    try:
        img = None
        if request.content_type == 'application/json':
            data = request.get_json()
            if 'image' in data:
                print("📊 Processing base64 image...")
                image_data = data['image'].split('base64,')[1] if 'base64,' in data['image'] else data['image']
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'success': False, 'message': 'No image data provided', 'bike_number': "-"})

        print(f"🖼️ Image dimensions: {img.shape}")
        detected_text, confidence = enhanced_number_plate_detection(img)

        if detected_text and confidence > 0.1:
            print(f"✅ SUCCESS! Plate: {detected_text} (conf: {confidence:.3f})")
            return jsonify({'success': True, 'bike_number': detected_text, 'confidence': float(confidence), 'message': f'Detected: {detected_text}'})
        else:
            print("❌ No number plate detected")
            return jsonify({'success': True, 'bike_number': detected_text if detected_text else "-", 'confidence': float(confidence), 'message': 'Low confidence or no plate found'})

    except Exception as e:
        print(f"🚫 Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'bike_number': "-"})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Advanced ML Service running'})

if __name__ == '__main__':
     port = int(os.environ.get("PORT", 5001))  # Render will provide PORT
     print(f"🚀 ADVANCED ML Service running on port {port}")
     print(f"✅ Health: http://localhost:{port}/health")
     print(f"✅ Detection: http://localhost:{port}/detect-bike-number")
     app.run(host='0.0.0.0', port=port, debug=False)  # debug=False for production
