pub mod config;
pub mod error;
pub mod formats;
pub mod geometry;
pub mod session;

pub use config::{VexrecConfig, LuxrecConfig};
pub use error::{VexrecError, LuxrecError, Result};
pub use formats::{AudioCodec, ContainerFormat, ImageFormat, VideoCodec, VideoQuality};
pub use geometry::{Point, Rect, Size};
pub use session::{ActiveSession, SessionMetadata, SessionState};
