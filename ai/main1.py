import cv2
import time
import requests
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from ultralytics import YOLO

CAMERA_ID = "CAM_ZONE_ALPHA"
BACKEND_URL = "http://localhost:3000/api/density"
VIDEO_SOURCE = "http://192.0.0.8:8080/video" 

PROCESS_EVERY_N_FRAMES = 5
M2_WIDTH, M2_HEIGHT = 300, 300

print("[INFO] Loading YOLO11-Small (High Accuracy) with ByteTrack...")
model = YOLO('yolo11s.pt')

http_session = requests.Session()
webhook_executor = ThreadPoolExecutor(max_workers=2)

def send_data_to_backend(count, global_density, hotspot_density, status):
    clean_status = status.split(" ")[0] 
    payload = {
        "camera_id": CAMERA_ID,
        "count": int(round(count)),
        "global_density": round(global_density, 2),
        "hotspot_density": int(round(hotspot_density)),
        "status": clean_status
    }
    
    def fire():
        try:
            http_session.post(BACKEND_URL, json=payload, timeout=1)
        except requests.exceptions.RequestException:
            pass

    webhook_executor.submit(fire)

def main():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    if not cap.isOpened():
        print(f"[ERROR] Could not open {VIDEO_SOURCE}. Falling back to webcam...")
        cap = cv2.VideoCapture(0)

    frame_count = 0
    
    last_boxes = []
    smoothed_count = 0.0
    smoothed_global = 0.0
    smoothed_hotspot = 0.0
    
    last_hx1, last_hy1, last_hx2, last_hy2 = 0, 0, 0, 0
    last_status = "NORMAL (SAFE ZONE)"
    last_color = (0, 255, 0)

    while cap.isOpened():
        ret, frame = cap.read()
        
        if not ret:
            print("[WARNING] Video stream dropped. Attempting to reconnect...")
            time.sleep(1)
            cap = cv2.VideoCapture(VIDEO_SOURCE)
            continue

        h, w, _ = frame.shape
        total_area_m2 = (w * h) / (M2_WIDTH * M2_HEIGHT)
        frame_count += 1
        
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            results = model.track(frame, classes=[0], conf=0.15, imgsz=1088, 
                                  persist=True, tracker="bytetrack.yaml", verbose=False)
            
            last_boxes = results[0].boxes.xyxy.cpu().numpy()
            raw_count = len(last_boxes)
            
            grid_cols = int(np.ceil(w / M2_WIDTH))
            grid_rows = int(np.ceil(h / M2_HEIGHT))
            density_grid = np.zeros((grid_rows, grid_cols))
            
            raw_max_local = 0
            if raw_count > 0:
                centers_x = (last_boxes[:, 0] + last_boxes[:, 2]) / 2
                centers_y = (last_boxes[:, 1] + last_boxes[:, 3]) / 2
                
                grid_x_idx = (centers_x // M2_WIDTH).astype(int)
                grid_y_idx = (centers_y // M2_HEIGHT).astype(int)
                
                valid = (grid_x_idx < grid_cols) & (grid_y_idx < grid_rows)
                np.add.at(density_grid, (grid_y_idx[valid], grid_x_idx[valid]), 1)
                
                raw_max_local = np.max(density_grid)
                hotspot_y, hotspot_x = np.unravel_index(np.argmax(density_grid), density_grid.shape)
                last_hx1, last_hy1 = hotspot_x * M2_WIDTH, hotspot_y * M2_HEIGHT
                last_hx2, last_hy2 = last_hx1 + M2_WIDTH, last_hy1 + M2_HEIGHT
            else:
                last_hx1, last_hy1, last_hx2, last_hy2 = 0, 0, 0, 0

            raw_global = raw_count / total_area_m2 if total_area_m2 > 0 else 0

            smoothed_count = (0.5 * smoothed_count) + (0.5 * raw_count)
            smoothed_global = (0.5 * smoothed_global) + (0.5 * raw_global)
            smoothed_hotspot = (0.5 * smoothed_hotspot) + (0.5 * raw_max_local)

            display_hotspot = int(round(smoothed_hotspot))

            if display_hotspot <= 2:
                last_status, last_color = "NORMAL (SAFE ZONE)", (0, 255, 0)
            elif 2 < display_hotspot <= 4:
                last_status, last_color = "WARNING (BOTTLENECK)", (0, 255, 255)
            else:
                last_status, last_color = "CRITICAL ALERT (RISK)", (0, 0, 255)
            
            send_data_to_backend(smoothed_count, smoothed_global, smoothed_hotspot, last_status)

        for box in last_boxes:
            x1, y1, x2, y2 = map(int, box)
            cv2.rectangle(frame, (x1, y1), (x2, y2), last_color, 2)

        if int(round(smoothed_hotspot)) > 2:
            cv2.rectangle(frame, (last_hx1, last_hy1), (last_hx2, last_hy2), (0, 0, 255), 4)
            cv2.putText(frame, f"HOTSPOT: {int(round(smoothed_hotspot))} ppl", 
                        (last_hx1, max(30, last_hy1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)

        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (max(w, 550), 180), (10, 10, 15), -1)
        cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, f"DRISHTI-SAFE | NODE: {CAMERA_ID}", (20, 35), font, 0.9, (255, 255, 255), 2)
        cv2.line(frame, (20, 50), (500, 50), (255, 255, 255), 2)
        
        cv2.putText(frame, f"Total Crowd Count : {int(round(smoothed_count))} People", (20, 85), font, 0.7, (200, 200, 200), 2)
        cv2.putText(frame, f"Global Density    : {smoothed_global:.2f} ppl/m^2", (20, 115), font, 0.7, (200, 200, 200), 2)
        cv2.putText(frame, f"Hotspot Density   : {int(round(smoothed_hotspot))} ppl/m^2", (20, 145), font, 0.7, (0, 165, 255), 2)
        cv2.putText(frame, f"SYSTEM STATUS : {last_status}", (20, 170), font, 0.7, last_color, 2)

        cv2.imshow("Drishti-Safe AI Edge Stream", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()