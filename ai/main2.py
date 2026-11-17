import cv2
import math
import numpy as np
from collections import defaultdict, deque
from ultralytics import YOLO

# --- CONFIGURATION ---
VIDEO_SOURCE = "http://192.0.0.8:8080/video"
M2_AREA_CONSTANT = 15.5  # Assume the camera covers 15.5 square meters

print("[INFO] Launching Enterprise Command Center...")
model = YOLO('yolo11n.pt')

track_history = defaultdict(lambda: deque(maxlen=30))


def get_status(hotspot):
    if hotspot <= 5:
        return "NORMAL", (0, 255, 0)
    elif 5 < hotspot <= 9:
        return "BOTTLENECK", (0, 255, 255)
    else:
        return "EMERGENCY", (0, 0, 255)


def main():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    if not cap.isOpened(): cap = cv2.VideoCapture(0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.resize(frame, (640, 360))
        results = model.track(frame, classes=[0], persist=True, verbose=False, conf=0.25)

        q1_raw, q2_heat, q3_trail, q4_cluster = frame.copy(), frame.copy(), frame.copy(), frame.copy()
        centers = []
        total_count = 0
        hotspot_val = 0

        if results[0].boxes.id is not None:
            boxes = results[0].boxes.xywh.cpu().numpy()
            track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            total_count = len(track_ids)

            # --- HOTSPOT CALCULATION (Grid Logic) ---
            grid = np.zeros((4, 4))  # Divide 640x360 into 16 zones
            for box in boxes:
                bx, by = int(box[0]), int(box[1])
                centers.append((bx, by))
                grid[min(3, by // 90), min(3, bx // 160)] += 1
            hotspot_val = np.max(grid)

            for box, track_id in zip(boxes, track_ids):
                x, y, w, h = box
                center = (int(x), int(y))
                track_history[track_id].append(center)

                # Q3: Trails
                if len(track_history[track_id]) > 1:
                    pts = np.array(track_history[track_id], np.int32).reshape((-1, 1, 2))
                    cv2.polylines(q3_trail, [pts], False, (0, 255, 0), 2)

        # --- MATH DERIVATION ---
        global_density = total_count / M2_AREA_CONSTANT
        condition, status_color = get_status(hotspot_val)

        # --- Q2: HEATMAP ---
        if centers:
            h_map = np.zeros((360, 640), dtype=np.float32)
            for c in centers: cv2.circle(h_map, c, 50, (1), -1)
            h_map = cv2.GaussianBlur(h_map, (91, 91), 0)
            h_map = np.clip(h_map * 255, 0, 255).astype(np.uint8)
            q2_heat = cv2.addWeighted(frame, 0.5, cv2.applyColorMap(h_map, cv2.COLORMAP_JET), 0.5, 0)

        # --- COMMAND OVERLAY (Q1) ---
        cv2.rectangle(q1_raw, (5, 5), (320, 140), (0, 0, 0), -1)
        cv2.putText(q1_raw, f"TOTAL CROWD: {total_count}", (15, 30), 0, 0.6, (255, 255, 255), 2)
        cv2.putText(q1_raw, f"GLOBAL DENSITY: {global_density:.2f}/m2", (15, 60), 0, 0.6, (255, 255, 255), 1)
        cv2.putText(q1_raw, f"HOTSPOT DENSITY: {int(hotspot_val)}", (15, 90), 0, 0.6, (0, 200, 255), 2)
        cv2.putText(q1_raw, f"CONDITION: {condition}", (15, 120), 0, 0.6, status_color, 2)

        # Assemble Dashboard
        top = np.hstack((q1_raw, q2_heat))
        bottom = np.hstack((q3_trail, q4_cluster))
        cv2.imshow("DRISHTI-SAFE: ENTERPRISE ANALYTICS", np.vstack((top, bottom)))

        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()