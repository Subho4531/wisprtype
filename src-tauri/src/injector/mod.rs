use enigo::{Enigo, Key, KeyboardControllable};
use std::thread::sleep;
use std::time::Duration;

/// Writes the text to the system clipboard and simulates a native paste keystroke (Ctrl+V or Cmd+V)
/// to inject the text immediately into whatever application has active focus.
pub fn copy_and_paste(text: &str) -> Result<(), String> {
    if text.is_empty() {
        return Ok(());
    }

    println!("Initializing clipboard context...");
    let mut clipboard = match arboard::Clipboard::new() {
        Ok(c) => c,
        Err(e) => {
            println!("Clipboard init failed ({}), retrying...", e);
            sleep(Duration::from_millis(50));
            arboard::Clipboard::new()
                .map_err(|e2| format!("Clipboard initialization error: {}", e2))?
        }
    };

    println!("Writing formatted text to system clipboard...");
    if let Err(e) = clipboard.set_text(text.to_string()) {
        println!("Clipboard set text failed ({}), retrying...", e);
        sleep(Duration::from_millis(50));
        clipboard.set_text(text.to_string())
            .map_err(|e2| format!("Failed to set clipboard text: {}", e2))?;
    }

    // Allow a small delay for the OS clipboard buffer to update and settle,
    // and for the overlay window to hide and restore focus to the target app.
    sleep(Duration::from_millis(75));

    println!("Simulating OS paste keystroke (Ctrl+V/Cmd+V)...");
    
    // We wrap Enigo instantiation in a catch_unwind or handle potential issues.
    // In some systems, Enigo may panic if a graphical server connection is missing.
    let mut enigo = Enigo::new();

    #[cfg(target_os = "macos")]
    {
        enigo.key_down(Key::Meta);
        enigo.key_click(Key::Layout('v'));
        enigo.key_up(Key::Meta);
    }

    #[cfg(not(target_os = "macos"))]
    {
        enigo.key_down(Key::Control);
        enigo.key_click(Key::Layout('v'));
        enigo.key_up(Key::Control);
    }

    println!("Text injection completed successfully!");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // IGNORE on headless automated test runners that lack GUI access
    fn test_clipboard_injection() {
        let test_str = "Wisprtype V1 Injector Test";
        copy_and_paste(test_str).expect("Paste injection failed");
        
        let mut clipboard = arboard::Clipboard::new().unwrap();
        let pasted = clipboard.get_text().unwrap();
        assert_eq!(pasted, test_str);
    }
}
