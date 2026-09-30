use ashpd::desktop::screencast::{CursorMode, Screencast, SourceType};
use ashpd::desktop::screenshot::Screenshot;
use ashpd::desktop::PersistMode;
use ashpd::url::Url;
use ashpd::WindowIdentifier;
use luxrec_core::error::{LuxrecError, Result};
use std::os::fd::OwnedFd;
use tracing::info;

pub struct PortalCaptureStream {
    pub pipewire_fd: OwnedFd,
    pub node_id: u32,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

pub struct PortalClient;

impl PortalClient {
    pub fn new() -> Self {
        Self
    }

    /// Requests a screencast session via XDG Desktop Portal ScreenCast.
    /// Returns the PipeWire file descriptor and the stream node id.
    pub async fn request_screencast(
        &self,
        include_cursor: bool,
    ) -> Result<Vec<PortalCaptureStream>> {
        info!("Requesting ScreenCast session via XDG Desktop Portal");
        let proxy = Screencast::new()
            .await
            .map_err(|e| LuxrecError::Portal(format!("Failed to connect to ScreenCast portal: {e}")))?;

        let session = proxy
            .create_session()
            .await
            .map_err(|e| LuxrecError::Portal(format!("Failed to create ScreenCast session: {e}")))?;

        let cursor_mode = if include_cursor {
            CursorMode::Embedded
        } else {
            CursorMode::Hidden
        };

        proxy
            .select_sources(
                &session,
                cursor_mode,
                SourceType::Monitor | SourceType::Window,
                true,
                None,
                PersistMode::DoNot,
            )
            .await
            .map_err(|e| LuxrecError::Portal(format!("Source selection failed: {e}")))?;

        let response = proxy
            .start(&session, &WindowIdentifier::default())
            .await
            .map_err(|e| LuxrecError::Portal(format!("Failed to start screencast session: {e}")))?
            .response()
            .map_err(|e| LuxrecError::Portal(format!("Portal response error: {e}")))?;

        let streams = response.streams();
        if streams.is_empty() {
            return Err(LuxrecError::Portal("No screen or window stream was granted by user".to_string()));
        }

        let pipewire_fd = proxy
            .open_pipe_wire_remote(&session)
            .await
            .map_err(|e| LuxrecError::Portal(format!("Failed to open PipeWire remote: {e}")))?;

        let mut results = Vec::new();
        for s in streams {
            let node_id = s.pipe_wire_node_id();
            let size = s.size();
            info!(node_id, ?size, "Acquired PipeWire stream node from portal");
            let fd_clone = pipewire_fd
                .try_clone()
                .map_err(LuxrecError::Io)?;
            results.push(PortalCaptureStream {
                pipewire_fd: fd_clone,
                node_id,
                width: size.map(|(w, _)| w as u32),
                height: size.map(|(_, h)| h as u32),
            });
        }

        Ok(results)
    }

    /// Requests a single screenshot via the Screenshot portal interface
    pub async fn request_screenshot(&self, interactive: bool) -> Result<Url> {
        info!(interactive, "Requesting Screenshot via XDG Desktop Portal");
        let response = Screenshot::request()
            .interactive(interactive)
            .send()
            .await
            .map_err(|e| LuxrecError::Portal(format!("Screenshot request failed: {e}")))?
            .response()
            .map_err(|e| LuxrecError::Portal(format!("Screenshot response error: {e}")))?;

        let uri = response.uri().clone();
        info!(uri = %uri, "Acquired screenshot from portal");
        Ok(uri)
    }
}

impl Default for PortalClient {
    fn default() -> Self {
        Self::new()
    }
}
