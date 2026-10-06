use vexrec_core::config::VexrecConfig;
use vexrec_core::geometry::{Point, Rect};

#[test]
fn test_default_config() {
    let config = VexrecConfig::default();
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

#[test]
fn test_ensure_unique_path() {
    let tmp_dir = std::env::temp_dir().join(format!("vexrec_test_{}", std::process::id()));
    let _ = std::fs::create_dir_all(&tmp_dir);

    let base_file = tmp_dir.join("Vexrec_test.png");
    // When file does not exist, returns original path
    assert_eq!(vexrec_core::ensure_unique_path(&base_file), base_file);

    // Create base file
    std::fs::write(&base_file, b"test").unwrap();
    let collision_1 = vexrec_core::ensure_unique_path(&base_file);
    assert_eq!(collision_1, tmp_dir.join("Vexrec_test-1.png"));

    // Create -1 file
    std::fs::write(&collision_1, b"test").unwrap();
    let collision_2 = vexrec_core::ensure_unique_path(&base_file);
    assert_eq!(collision_2, tmp_dir.join("Vexrec_test-2.png"));

    // Create -2 file
    std::fs::write(&collision_2, b"test").unwrap();
    let collision_3 = vexrec_core::ensure_unique_path(&base_file);
    assert_eq!(collision_3, tmp_dir.join("Vexrec_test-3.png"));

    let _ = std::fs::remove_dir_all(&tmp_dir);
}
