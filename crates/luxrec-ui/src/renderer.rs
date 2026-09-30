use image::{ImageBuffer, Rgba};
use imageproc::drawing::{
    draw_filled_circle_mut, draw_filled_rect_mut, draw_hollow_circle_mut, draw_hollow_rect_mut,
    draw_line_segment_mut,
};
use imageproc::rect::Rect as ProcRect;
use luxrec_core::error::Result;

use crate::annotator::{AnnotationCanvas, AnnotationTool};

pub struct AnnotationRenderer;

impl AnnotationRenderer {
    /// Renders all annotations in the canvas onto a clone of the provided image buffer
    pub fn render(
        img: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        canvas: &AnnotationCanvas,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let mut rendered = img.clone();

        for tool in &canvas.annotations {
            match tool {
                AnnotationTool::Rectangle {
                    rect,
                    color,
                    stroke_width,
                    fill,
                } => {
                    let rgba_stroke = Rgba(*color);
                    let proc_rect = ProcRect::at(rect.x, rect.y).of_size(rect.width, rect.height);

                    if let Some(fill_color) = fill {
                        let rgba_fill = Rgba(*fill_color);
                        draw_filled_rect_mut(&mut rendered, proc_rect, rgba_fill);
                    }

                    let width = (*stroke_width as i32).max(1);
                    for i in 0..width {
                        let inset_rect = ProcRect::at(rect.x + i, rect.y + i).of_size(
                            rect.width.saturating_sub((i * 2) as u32),
                            rect.height.saturating_sub((i * 2) as u32),
                        );
                        draw_hollow_rect_mut(&mut rendered, inset_rect, rgba_stroke);
                    }
                }

                AnnotationTool::Ellipse {
                    rect,
                    color,
                    stroke_width: _,
                } => {
                    let rgba = Rgba(*color);
                    let center_x = rect.x + (rect.width as i32 / 2);
                    let center_y = rect.y + (rect.height as i32 / 2);
                    let radius = (rect.width.min(rect.height) / 2) as i32;
                    draw_hollow_circle_mut(&mut rendered, (center_x, center_y), radius, rgba);
                }

                AnnotationTool::Arrow {
                    start,
                    end,
                    color,
                    stroke_width: _,
                } => {
                    let rgba = Rgba(*color);
                    // Draw shaft
                    draw_line_segment_mut(
                        &mut rendered,
                        (start.x as f32, start.y as f32),
                        (end.x as f32, end.y as f32),
                        rgba,
                    );

                    // Calculate arrowhead points
                    let dx = (end.x - start.x) as f32;
                    let dy = (end.y - start.y) as f32;
                    let angle = dy.atan2(dx);
                    let arrow_len = 16.0f32;
                    let arrow_angle = std::f32::consts::PI / 6.0; // 30 degrees

                    let x1 = end.x as f32 - arrow_len * (angle - arrow_angle).cos();
                    let y1 = end.y as f32 - arrow_len * (angle - arrow_angle).sin();

                    let x2 = end.x as f32 - arrow_len * (angle + arrow_angle).cos();
                    let y2 = end.y as f32 - arrow_len * (angle + arrow_angle).sin();

                    draw_line_segment_mut(&mut rendered, (end.x as f32, end.y as f32), (x1, y1), rgba);
                    draw_line_segment_mut(&mut rendered, (end.x as f32, end.y as f32), (x2, y2), rgba);
                }

                AnnotationTool::Blur { rect, intensity } => {
                    let block_size = ((*intensity as u32).max(4)).min(32);
                    let (img_w, img_h) = rendered.dimensions();

                    let start_x = (rect.x.max(0) as u32).min(img_w);
                    let start_y = (rect.y.max(0) as u32).min(img_h);
                    let end_x = ((rect.x + rect.width as i32).max(0) as u32).min(img_w);
                    let end_y = ((rect.y + rect.height as i32).max(0) as u32).min(img_h);

                    // Block pixelation effect
                    for by in (start_y..end_y).step_by(block_size as usize) {
                        for bx in (start_x..end_x).step_by(block_size as usize) {
                            let bw = (bx + block_size).min(end_x) - bx;
                            let bh = (by + block_size).min(end_y) - by;

                            // Sample top-left pixel of block
                            let sample_pixel = *rendered.get_pixel(bx, by);

                            for py in by..(by + bh) {
                                for px in bx..(bx + bw) {
                                    rendered.put_pixel(px, py, sample_pixel);
                                }
                            }
                        }
                    }
                }

                AnnotationTool::StepBadge {
                    position,
                    step: _,
                    color,
                } => {
                    let rgba = Rgba(*color);
                    let radius = 14;
                    draw_filled_circle_mut(&mut rendered, (position.x, position.y), radius, rgba);
                    draw_hollow_circle_mut(
                        &mut rendered,
                        (position.x, position.y),
                        radius,
                        Rgba([255, 255, 255, 255]),
                    );
                }

                AnnotationTool::Text { .. } => {
                    // Text rendering can be extended with ab_glyph font rasterizer
                }
            }
        }

        Ok(rendered)
    }
}
