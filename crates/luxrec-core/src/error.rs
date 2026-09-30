use thiserror::Error;

#[derive(Error, Debug)]
pub enum LuxrecError {
    #[error("Portal error: {0}")]
    Portal(String),

    #[error("PipeWire error: {0}")]
    PipeWire(String),

    #[error("Capture pipeline error: {0}")]
    Pipeline(String),

    #[error("Encoding error: {0}")]
    Encoding(String),

    #[error("Audio device error: {0}")]
    Audio(String),

    #[error("Camera device error: {0}")]
    Camera(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Session is not active or already in invalid state: {0}")]
    InvalidSessionState(String),
}

pub type Result<T> = std::result::Result<T, LuxrecError>;
