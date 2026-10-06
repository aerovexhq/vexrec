use vexrec_core::config::{CameraAnchor, CameraConfig};

pub struct CameraPipelineBuilder;

impl CameraPipelineBuilder {
    pub fn build_camera_branch(
        config: &CameraConfig,
        screen_width: u32,
        screen_height: u32,
    ) -> Option<(String, (i32, i32))> {
        if !config.enabled {
            return None;
        }

        let device = config.device_path.as_deref().unwrap_or("/dev/video0");
        let (cam_w, cam_h) = (config.width, config.height);

        let (xpos, ypos) = match config.anchor {
            CameraAnchor::TopLeft => (config.margin as i32, config.margin as i32),
            CameraAnchor::TopRight => (
                (screen_width.saturating_sub(cam_w + config.margin)) as i32,
                config.margin as i32,
            ),
            CameraAnchor::BottomLeft => (
                config.margin as i32,
                (screen_height.saturating_sub(cam_h + config.margin)) as i32,
            ),
            CameraAnchor::BottomRight => (
                (screen_width.saturating_sub(cam_w + config.margin)) as i32,
                (screen_height.saturating_sub(cam_h + config.margin)) as i32,
            ),
        };

        let branch = format!(
            "v4l2src device=\"{}\" ! videoconvert ! videoscale ! video/x-raw,width={},height={} ! ",
            device, cam_w, cam_h
        );

        Some((branch, (xpos, ypos)))
    }
}
