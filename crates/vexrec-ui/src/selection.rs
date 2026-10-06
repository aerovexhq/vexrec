use vexrec_core::geometry::{Point, Rect};

pub struct SelectionManager {
    start_pos: Option<Point>,
    current_pos: Option<Point>,
    is_selecting: bool,
    aspect_ratio: Option<f32>,
}

impl SelectionManager {
    pub fn new() -> Self {
        Self {
            start_pos: None,
            current_pos: None,
            is_selecting: false,
            aspect_ratio: None,
        }
    }

    pub fn start_selection(&mut self, point: Point) {
        self.start_pos = Some(point);
        self.current_pos = Some(point);
        self.is_selecting = true;
    }

    pub fn update_cursor(&mut self, point: Point) {
        if self.is_selecting {
            self.current_pos = Some(point);
        }
    }

    pub fn get_selected_rect(&self) -> Option<Rect> {
        let (p1, p2) = (self.start_pos?, self.current_pos?);
        let mut rect = Rect::from_points(p1, p2);

        if let Some(ratio) = self.aspect_ratio {
            if ratio > 0.0 && rect.height > 0 {
                let target_w = (rect.height as f32 * ratio) as u32;
                rect.width = target_w;
            }
        }

        Some(rect)
    }

    pub fn finish_selection(&mut self) -> Option<Rect> {
        let rect = self.get_selected_rect();
        self.is_selecting = false;
        rect
    }

    pub fn set_aspect_ratio(&mut self, ratio: Option<f32>) {
        self.aspect_ratio = ratio;
    }
}

impl Default for SelectionManager {
    fn default() -> Self {
        Self::new()
    }
}
