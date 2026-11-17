import cv2
import time
import requests
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from ultralytics import YOLO

# --- CONFIGURATION ---
CAMERA_ID = "CAM_ZONE_ALPHA"
BACKEND_URL = "http://localhost:3000/api/density"
VIDEO_SOURCE = "http://10.98.140.151:8080/video" 

PROCESS_EVERY_N_FRAMES = 5
M2_WIDTH, M2_HEIGHT = 300, 300

print("[INFO] Loading YOLO11-Nano (Smooth-Graph Version)...")
model = YOLO('yolo11n.pt')

http_session = requests.Session()
webhook_executor = ThreadPoolExecutor(max_workers=2)

# --- PERSISTENT STATE ---
# This dictionary keeps data alive between AI processing cycles
current_state = {
    "count": 0.0,
    "global_density": 0.0,
    "hotspot_density": 0.0,
    "status": "NORMAL",
    "boxes": []
}

def send_data_to_backend():
    """Always sends the latest valid state to prevent dashboard drops."""
    payload = {
        "camera_id": CAMERA_ID,
        "count": int(round(current_state["count"])),
        "global_density": round(current_state["global_density"], 2),
        "hotspot_density": int(round(current_state["hotspot_density"])),
        "status": current_state["status"].split(" ")[0]
    }
    
    def fire():
        try:
            http_session.post(BACKEND_URL, json=payload, timeout=0.5)
        except:
            pass
    webhook_executor.submit(fire)

def main():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    if not cap.isOpened():
        print(f"[ERROR] Could not open {VIDEO_SOURCE}. Falling back to webcam...")
        cap = cv2.VideoCapture(0)

    frame_count = 0
    last_hx1, last_hy1, last_hx2, last_hy2 = 0, 0, 0, 0
    last_color = (0, 255, 0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            time.sleep(1)
            cap = cv2.VideoCapture(VIDEO_SOURCE)
            continue

        h, w, _ = frame.shape
        total_area_m2 = (w * h) / (M2_WIDTH * M2_HEIGHT)
        frame_count += 1
        
        # --- AI PROCESSING (Every N Frames) ---
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            results = model.track(frame, classes=[0], conf=0.30, imgsz=640, 
                                  persist=True, tracker="bytetrack.yaml", verbose=False)
            
            if results[0].boxes.id is not None:
                current_state["boxes"] = results[0].boxes.xyxy.cpu().numpy()
                raw_count = len(current_state["boxes"])
                
                # Hotspot Logic
                grid_cols, grid_rows = int(np.ceil(w / M2_WIDTH)), int(np.ceil(h / M2_HEIGHT))
                density_grid = np.zeros((grid_rows, grid_cols))
                
                cx = (current_state["boxes"][:, 0] + current_state["boxes"][:, 2]) / 2
                cy = (current_state["boxes"][:, 1] + current_state["boxes"][:, 3]) / 2
                gx, gy = (cx // M2_WIDTH).astype(int), (cy // M2_HEIGHT).astype(int)
                
                valid = (gx < grid_cols) & (gy < grid_rows)
                np.add.at(density_grid, (gy[valid], gx[valid]), 1)
                
                raw_max = np.max(density_grid)
                hy, hx = np.unravel_index(np.argmax(density_grid), density_grid.shape)
                last_hx1, last_hy1 = hx * M2_WIDTH, hy * M2_HEIGHT
                last_hx2, last_hy2 = last_hx1 + M2_WIDTH, last_hy1 + M2_HEIGHT
            else:
                current_state["boxes"] = []
                raw_count, raw_max = 0, 0

            # EMA Smoothing to prevent zigzag lines
            current_state["count"] = (0.7 * current_state["count"]) + (0.3 * raw_count)
            current_state["global_density"] = (0.7 * current_state["global_density"]) + (0.3 * (raw_count / total_area_m2))
            current_state["hotspot_density"] = (0.7 * current_state["hotspot_density"]) + (0.3 * raw_max)

            # Condition Mapping
            ds = int(round(current_state["hotspot_density"]))
            if ds <= 3: current_state["status"], last_color = "NORMAL", (0, 255, 0)
            elif 3 < ds <= 6: current_state["status"], last_color = "WARNING", (0, 255, 255)
            else: current_state["status"], last_color = "CRITICAL", (0, 0, 255)

            # Send data only after calculation
            send_data_to_backend()

        # --- RENDERING (Every Frame) ---
        for box in current_state["boxes"]:
            x1, y1, x2, y2 = map(int, box)
            cv2.rectangle(frame, (x1, y1), (x2, y2), last_color, 2)

        # Dashboard Overlay UI
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (600, 180), (10, 10, 15), -1)
        cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, f"DRISHTI-SAFE | COUNT: {int(round(current_state['count']))}", (25, 50), font, 0.9, (255, 255, 255), 2)
        cv2.putText(frame, f"DENSITY: {current_state['global_density']:.2f} ppl/m2", (25, 100), font, 0.7, (200, 200, 200), 1)
        cv2.putText(frame, f"STATUS: {current_state['status']}", (25, 150), font, 0.8, last_color, 2)

        cv2.imshow("Drishti-Safe AI Edge Stream", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()