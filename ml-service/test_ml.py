import requests
import base64
import cv2
import numpy as np

def test_ml_service():
    # Create a test image with some text
    img = np.ones((100, 300, 3), dtype=np.uint8) * 255
    cv2.putText(img, 'TEST123', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    # Convert to base64
    _, buffer = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Send to ML service
    response = requests.post('http://localhost:5001/detect-number-plate', 
                           json={'image': img_base64})
    
    print("Status Code:", response.status_code)
    print("Response:", response.json())

if __name__ == '__main__':
    test_ml_service()