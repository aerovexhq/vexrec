fn main() {
    println!("cargo:rerun-if-changed=frontend/dist");
    println!("cargo:rerun-if-changed=tauri.conf.json");
    tauri_build::build();
}
