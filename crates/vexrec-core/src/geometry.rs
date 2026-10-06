use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

impl Point {
    pub const fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Size {
    pub width: u32,
    pub height: u32,
}

impl Size {
    pub const fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    pub const fn is_empty(&self) -> bool {
        self.width == 0 || self.height == 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl Rect {
    pub const fn new(x: i32, y: i32, width: u32, height: u32) -> Self {
        Self { x, y, width, height }
    }

    pub fn from_points(p1: Point, p2: Point) -> Self {
        let x = p1.x.min(p2.x);
        let y = p1.y.min(p2.y);
        let width = (p1.x - p2.x).unsigned_abs();
        let height = (p1.y - p2.y).unsigned_abs();
        Self { x, y, width, height }
    }

    pub const fn contains(&self, p: Point) -> bool {
        p.x >= self.x
            && p.x < self.x + self.width as i32
            && p.y >= self.y
            && p.y < self.y + self.height as i32
    }

    pub const fn is_empty(&self) -> bool {
        self.width == 0 || self.height == 0
    }
}
