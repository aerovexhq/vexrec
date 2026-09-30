use std::path::PathBuf;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{LuxrecError, Result};
use crate::geometry::Rect;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum SessionState {
    #[default]
    Idle,
    Preparing,
    Recording,
    Paused,
    Finalizing,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetadata {
    pub id: Uuid,
    pub started_at: DateTime<Utc>,
    pub stopped_at: Option<DateTime<Utc>>,
    pub output_file: PathBuf,
    pub target_region: Option<Rect>,
    pub total_frames: u64,
    pub duration_seconds: f64,
}

impl SessionMetadata {
    pub fn new(output_file: PathBuf, target_region: Option<Rect>) -> Self {
        Self {
            id: Uuid::new_v4(),
            started_at: Utc::now(),
            stopped_at: None,
            output_file,
            target_region,
            total_frames: 0,
            duration_seconds: 0.0,
        }
    }

    pub fn complete(&mut self, total_frames: u64, duration_secs: f64) {
        self.stopped_at = Some(Utc::now());
        self.total_frames = total_frames;
        self.duration_seconds = duration_secs;
    }
}

pub struct ActiveSession {
    pub state: SessionState,
    pub metadata: SessionMetadata,
}

impl ActiveSession {
    pub fn start(output_file: PathBuf, region: Option<Rect>) -> Self {
        Self {
            state: SessionState::Recording,
            metadata: SessionMetadata::new(output_file, region),
        }
    }

    pub fn pause(&mut self) -> Result<()> {
        if self.state != SessionState::Recording {
            return Err(LuxrecError::InvalidSessionState(format!(
                "Cannot pause session in state {:?}",
                self.state
            )));
        }
        self.state = SessionState::Paused;
        Ok(())
    }

    pub fn resume(&mut self) -> Result<()> {
        if self.state != SessionState::Paused {
            return Err(LuxrecError::InvalidSessionState(format!(
                "Cannot resume session in state {:?}",
                self.state
            )));
        }
        self.state = SessionState::Recording;
        Ok(())
    }

    pub fn stop(&mut self, total_frames: u64, duration_secs: f64) -> Result<SessionMetadata> {
        if self.state != SessionState::Recording && self.state != SessionState::Paused {
            return Err(LuxrecError::InvalidSessionState(format!(
                "Cannot stop session in state {:?}",
                self.state
            )));
        }
        self.state = SessionState::Finalizing;
        self.metadata.complete(total_frames, duration_secs);
        Ok(self.metadata.clone())
    }
}
