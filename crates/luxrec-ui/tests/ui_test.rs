use image::{ImageBuffer, Rgba};
use luxrec_core::geometry::{Point, Rect};
use luxrec_ui::annotator::{AnnotationCanvas, AnnotationTool};
use luxrec_ui::hud::FloatingHudState;
use luxrec_ui::renderer::AnnotationRenderer;
use luxrec_ui::selection::SelectionManager;

#[test]
fn test_hud_state_toggles() {
    let mut hud = FloatingHudState::new();
    assert!(hud.mic_enabled);
    hud.toggle_mic();
    assert!(!hud.mic_enabled);

    assert!(!hud.camera_pip_enabled);
    hud.toggle_camera_pip();
    assert!(hud.camera_pip_enabled);
}

#[test]
fn test_selection_manager() {
    let mut sm = SelectionManager::new();
    sm.start_selection(Point::new(10, 20));
    sm.update_cursor(Point::new(110, 120));

    let rect = sm.finish_selection().expect("Expected valid rect");
    assert_eq!(rect.x, 10);
    assert_eq!(rect.y, 20);
    assert_eq!(rect.width, 100);
    assert_eq!(rect.height, 100);
}

#[test]
fn test_annotation_renderer() {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(200, 200);
    let mut canvas = AnnotationCanvas::new();

    canvas.add(AnnotationTool::Rectangle {
        rect: Rect::new(10, 10, 50, 50),
        color: [255, 0, 0, 255],
        stroke_width: 2.0,
        fill: Some([0, 255, 0, 128]),
    });

    canvas.add(AnnotationTool::Arrow {
        start: Point::new(100, 100),
        end: Point::new(150, 150),
        color: [0, 0, 255, 255],
        stroke_width: 2.0,
    });

    canvas.add(AnnotationTool::Blur {
        rect: Rect::new(20, 20, 30, 30),
        intensity: 8.0,
    });

    let rendered = AnnotationRenderer::render(&img, &canvas).expect("Rendering failed");
    assert_eq!(rendered.dimensions(), (200, 200));
}
