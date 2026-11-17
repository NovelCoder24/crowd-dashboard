// Environment Configuration for CrowdFlow Command Center

export const CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  PUSHER_KEY: import.meta.env.VITE_PUSHER_KEY || '98e19deafff5fb2017e8',
  PUSHER_CLUSTER: import.meta.env.VITE_PUSHER_CLUSTER || 'ap2',
  VIDEO_STREAM_URL: import.meta.env.VITE_VIDEO_STREAM_URL || 'http://localhost:5000/video_feed',
  DEFAULT_CAMERA_ID: import.meta.env.VITE_DEFAULT_CAMERA_ID || 'CAM_ZONE_ALPHA',
};

export const ZONES = {
  CAM_ZONE_ALPHA: {
    id: 'CAM_ZONE_ALPHA',
    name: 'Concourse Main',
    code: 'Alpha',
    area_sqm: 25,
    warning_threshold: 3,
    critical_threshold: 5,
    capacity: 250,
    coords: { x: '28%', y: '35%' },
    description: 'Main concourse arterial junction with high throughput.',
  },
  CAM_ZONE_BETA: {
    id: 'CAM_ZONE_BETA',
    name: 'North Concourse',
    code: 'Beta',
    area_sqm: 35,
    warning_threshold: 4,
    critical_threshold: 6,
    capacity: 350,
    coords: { x: '62%', y: '28%' },
    description: 'North passage connecting exhibition halls and dining wing.',
  },
  CAM_ZONE_GAMMA: {
    id: 'CAM_ZONE_GAMMA',
    name: 'Gate 4 Access',
    code: 'Gamma',
    area_sqm: 20,
    warning_threshold: 3,
    critical_threshold: 5,
    capacity: 180,
    coords: { x: '50%', y: '68%' },
    description: 'Primary egress choke point for outdoor transit plaza.',
  },
};
