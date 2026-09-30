use luxrec_core::geometry::{Point, Rect};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnnotationTool {
    Arrow {
        start: Point,
        end: Point,
        color: [u8; 4],
        stroke_width: f32,
    },
    Rectangle {
        rect: Rect,
        color: [u8; 4],
        stroke_width: f32,
        fill: Option<[u8; 4]>,
    },
    Ellipse {
        rect: Rect,
        color: [u8; 4],
        stroke_width: f32,
    },
    Text {
        position: Point,
        content: String,
        color: [u8; 4],
        font_size: f32,
    },
    Blur {
        rect: Rect,
        intensity: f32,
    },
    StepBadge {
        position: Point,
        step: u32,
        color: [u8; 4],
    },
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AnnotationCanvas {
    pub annotations: Vec<AnnotationTool>,
    pub undo_stack: Vec<AnnotationTool>,
}

impl AnnotationCanvas {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, tool: AnnotationTool) {
        self.annotations.push(tool);
        self.undo_stack.clear();
    }

    pub fn undo(&mut self) -> bool {
        if let Some(tool) = self.annotations.pop() {
            self.undo_stack.push(tool);
            true
        } else {
            false
        }
    }

    pub fn redo(&mut self) -> bool {
        if let Some(tool) = self.undo_stack.pop() {
            self.annotations.push(tool);
            true
        } else {
            false
        }
    }

    pub fn clear(&mut self) {
        self.annotations.clear();
        self.undo_stack.clear();
    }
}
