// ABOUTME: Guards the Tauri capability manifests: IPC may only be granted to loopback origins.
// ABOUTME: Also pins which plugin permissions a served (remote) origin is allowed to hold.

use std::path::PathBuf;

use serde_json::Value;

fn capabilities() -> Vec<(PathBuf, Value)> {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("capabilities");
    std::fs::read_dir(&dir)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
        .map(|path| {
            let json = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
            (path, json)
        })
        .collect()
}

fn remote_urls(capability: &Value) -> Vec<String> {
    capability["remote"]["urls"]
        .as_array()
        .map(|urls| {
            urls.iter()
                .map(|url| url.as_str().unwrap().to_string())
                .collect()
        })
        .unwrap_or_default()
}

fn permission_ids(capability: &Value) -> Vec<String> {
    capability["permissions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| match p {
            Value::String(id) => id.clone(),
            other => other["identifier"].as_str().unwrap().to_string(),
        })
        .collect()
}

#[test]
fn some_capability_grants_ipc_to_the_served_origin() {
    let remote: Vec<_> = capabilities()
        .into_iter()
        .filter(|(_, cap)| !remote_urls(cap).is_empty())
        .collect();

    assert!(
        !remote.is_empty(),
        "the SPA is served over http://127.0.0.1, so a remote capability is needed for native features"
    );
}

#[test]
fn every_remote_url_is_loopback() {
    for (path, cap) in capabilities() {
        for url in remote_urls(&cap) {
            assert!(
                url.starts_with("http://127.0.0.1:"),
                "{} grants IPC to non-loopback origin {url}",
                path.display()
            );
        }
    }
}

#[test]
fn remote_capabilities_grant_only_native_shim_permissions() {
    const ALLOWED_PREFIXES: [&str; 3] = ["notification:", "dialog:", "fs:"];

    for (path, cap) in capabilities() {
        if remote_urls(&cap).is_empty() {
            continue;
        }
        for id in permission_ids(&cap) {
            assert!(
                ALLOWED_PREFIXES.iter().any(|prefix| id.starts_with(prefix)),
                "{} grants {id} to a remote origin",
                path.display()
            );
        }
    }
}

#[test]
fn served_origin_holds_the_permissions_the_native_shim_calls() {
    // frontend/src/lib/native/index.ts: saveFile -> dialog.save + fs.writeTextFile,
    // loadFile -> dialog.open + fs.readTextFile,
    // showNotification -> notification.sendNotification.
    const NEEDED: [&str; 5] = [
        "dialog:allow-save",
        "fs:allow-write-text-file",
        "dialog:allow-open",
        "fs:allow-read-text-file",
        "notification:default",
    ];
    let granted: Vec<String> = capabilities()
        .into_iter()
        .filter(|(_, cap)| !remote_urls(cap).is_empty())
        .flat_map(|(_, cap)| permission_ids(&cap))
        .collect();

    for id in NEEDED {
        assert!(
            granted.iter().any(|g| g == id),
            "served origin is missing {id}"
        );
    }
}
