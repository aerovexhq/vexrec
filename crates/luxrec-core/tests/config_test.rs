use luxrec_core::config::LuxrecConfig;
use luxrec_core::geometry::{Point, Rect};

#[test]
fn test_default_config() {
    let config = LuxrecConfig::default();
    assert_eq!(config.recording.framerate, 60);
    assert!(config.audio.capture_desktop);
    assert!(config.audio.capture_microphone);
    assert!(config.recording.hardware_accel);
}

#[test]
fn test_geometry_containment() {
    let rect = Rect::new(10, 10, 100, 100);
    assert!(rect.contains(Point::new(50, 50)));
    assert!(!rect.contains(Point::new(5, 5)));
    assert!(!rect.contains(Point::new(150, 150)));
}

#[test]
fn test_geometry_from_points() {
    let p1 = Point::new(100, 200);
    let p2 = Point::new(20, 50);
    let rect = Rect::from_points(p1, p2);
    assert_eq!(rect.x, 20);
    assert_eq!(rect.y, 50);
    assert_eq!(rect.width, 80);
    assert_eq!(rect.height, 150);
}
