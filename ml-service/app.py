from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import easyocr
import os
import re

app = Flask(__name__)
CORS(app)

# Load models
model = YOLO('yolov8n.pt')
reader = easyocr.Reader(['en'])

def enhanced_number_plate_detection(img):
    print("🚀 Starting ENHANCED number plate detection...")
    
    best_text = ""
    best_confidence = 0
    
    # Strategy 1: Direct OCR on entire image (for clear number plates)
    print("🔍 Strategy 1: Full image OCR...")
    ocr_results = reader.readtext(
        img,
        decoder='beamsearch',
        beamWidth=15,
        contrast_ths=0.01,
        adjust_contrast=0.9,
        width_ths=2.0,
        text_threshold=0.2,
        link_threshold=0.2,
        mag_ratio=2.0
    )
    
    for bbox, text, conf in ocr_results:
        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
        print(f"   📝 Found: '{text}' -> '{cleaned}' (confidence: {conf:.3f})")
        
        if (6 <= len(cleaned) <= 12 and 
            any(c.isalpha() for c in cleaned) and 
            any(c.isdigit() for c in cleaned) and
            conf > best_confidence):
            
            best_text = cleaned
            best_confidence = conf
            print(f"   🎯 POTENTIAL PLATE: {best_text}")

    # Strategy 2: If no good detection, try with different preprocessing
    if not best_text:
        print("🔍 Strategy 2: Preprocessing + OCR...")
        
        preprocessed_images = [
            img,
            cv2.cvtColor(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR),
        ]
        
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        lab[:,:,0] = cv2.createCLAHE(clipLimit=3.0).apply(lab[:,:,0])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        preprocessed_images.append(enhanced)
        
        for i, proc_img in enumerate(preprocessed_images):
            print(f"   🔄 Processing method {i+1}...")
            ocr_results = reader.readtext(
                proc_img,
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

    # Strategy 3: YOLO object detection
    if not best_text:
        print("🔍 Strategy 3: YOLO object detection...")
        results = model(img, conf=0.3)
        
        if results[0].boxes is not None:
            for i, box in enumerate(results[0].boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                
                print(f"   📦 YOLO detected object {i+1} with confidence: {conf:.3f}")
                
                region = img[y1:y2, x1:x2]
                if region.size > 0:
                    ocr_results = reader.readtext(region, contrast_ths=0.01)
                    for bbox, text, region_conf in ocr_results:
                        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
                        if len(cleaned) >= 4 and region_conf > best_confidence:
                            best_text = cleaned
                            best_confidence = region_conf
                            print(f"   🎯 YOLO+OCR: {best_text}")

    # ⭐⭐⭐ ADDITION: COMBINE MULTI-LINE NUMBER PLATES ⭐⭐⭐
    print("\n🔗 Combining multi-line number plate text...")
    all_texts = []

    ocr_results_full = reader.readtext(img)
    for bbox, text, conf in ocr_results_full:
        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
        if 3 <= len(cleaned) <= 10:
            all_texts.append(cleaned)

    if len(all_texts) >= 2:
        combined = "".join(all_texts)  # If you want space: " ".join(all_texts)
        print(f"   🔥 Combined Plate: {combined}")

        if len(combined) > len(best_text):
            best_text = combined
            best_confidence = 0.90  # Boost confidence


    return best_text, best_confidence



@app.route('/detect-bike-number', methods=['POST'])
def detect_bike_number():
    try:
        img = None
        
        if request.content_type == 'application/json':
            data = request.get_json()
            if 'image' in data:
                print("📊 Processing base64 image...")
                if 'base64,' in data['image']:
                    image_data = data['image'].split('base64,')[1]
                else:
                    image_data = data['image']
                
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({
                'success': False,
                'message': 'No image data provided',
                'bike_number': "-"
            })
        
        print(f"🖼️ Image dimensions: {img.shape}")
        print("🎯 Starting detection process...")
        
        detected_text, confidence = enhanced_number_plate_detection(img)
        
        if detected_text and confidence > 0.1:
            print(f"✅ SUCCESS! Detected: {detected_text} (confidence: {confidence:.3f})")
            return jsonify({
                'success': True,
                'bike_number': detected_text,
                'confidence': float(confidence),
                'message': f'Detected: {detected_text}'
            })
        else:
            print("❌ No number plate detected")
            if detected_text:
                print(f"   ℹ️ Low confidence detection: {detected_text} (confidence: {confidence:.3f})")
                return jsonify({
                    'success': True,
                    'bike_number': detected_text,
                    'confidence': float(confidence),
                    'message': f'Low confidence: {detected_text}'
                })
            else:
                return jsonify({
                    'success': True,
                    'bike_number': "-",
                    'message': 'No number plate detected'
                })
            
    except Exception as e:
        print(f"🚫 Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': str(e),
            'bike_number': "-"
        })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Advanced ML Service running'
    })

if __name__ == '__main__':
    print("🚀 ADVANCED ML Service running on port 5001")
    print("✅ Health: http://localhost:5001/health")
    print("✅ Detection: http://localhost:5001/detect-bike-number")
    app.run(port=5001, debug=True)
