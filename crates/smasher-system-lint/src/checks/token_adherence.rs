// ABOUTME: Ported lint-tokens.mjs rules: flags raw colors and un-tokenized spacing/etc.
// ABOUTME: Native Rust regex, no subprocess.

use std::path::Path;

use regex::Regex;

// Properties where a bare size number should be a var(--token) instead.
// Mirrors lint-tokens.mjs's SPACING_PROPERTIES. font-size is intentionally excluded —
// the token rule covers color, radius, spacing-scale, and shadow values, not
// typography scale.
const SPACING_PROPERTIES: &[&str] = &[
    "color",
    "background",
    "background-color",
    "border-color",
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "outline",
    "outline-color",
    "box-shadow",
    "border-radius",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "gap",
    "row-gap",
    "column-gap",
];

// Raw values allowed without a token (e.g. hairline borders).
const ALLOWED_RAW_VALUES: &[&str] = &["1px", "0", "0px"];

struct Declaration {
    property: String,
    value: String,
}

fn strip_comments(css: &str) -> String {
    Regex::new(r"(?s)/\*.*?\*/")
        .unwrap()
        .replace_all(css, "")
        .into_owned()
}

fn find_declarations(css: &str) -> Vec<Declaration> {
    let rule_body_re = Regex::new(r"\{[^{}]*\}").unwrap();
    let mut declarations = Vec::new();

    for rule_match in rule_body_re.find_iter(css) {
        let body = rule_match.as_str();
        let inner = &body[1..body.len() - 1];
        for raw in inner.split(';') {
            let trimmed = raw.trim();
            if trimmed.is_empty() {
                continue;
            }
            let Some(colon_index) = trimmed.find(':') else {
                continue;
            };
            declarations.push(Declaration {
                property: trimmed[..colon_index].trim().to_string(),
                value: trimmed[colon_index + 1..].trim().to_string(),
            });
        }
    }

    declarations
}

/// Lints a CSS string for raw hex/rgb colors and un-tokenized spacing/radius/shadow
/// values, per the same rules `design-kit/test/lint-tokens.mjs` enforces on the kit's
/// own `components.css`.
pub fn lint_css(css: &str) -> Vec<String> {
    let hex_color = Regex::new(r"#[0-9a-fA-F]{3,8}\b").unwrap();
    let raw_color_fn = Regex::new(r"\b(rgb|rgba|hsl|hsla)\(").unwrap();
    let size_token = Regex::new(r"\b\d+(?:\.\d+)?(?:px|rem|em)\b").unwrap();

    let mut violations = Vec::new();
    let stripped = strip_comments(css);

    for Declaration { property, value } in find_declarations(&stripped) {
        if hex_color.is_match(&value) {
            violations.push(format!(
                "{property}: {value} — raw hex color, use a var(--token) instead"
            ));
            continue;
        }
        if raw_color_fn.is_match(&value) {
            violations.push(format!(
                "{property}: {value} — raw color function, use a var(--token) instead"
            ));
            continue;
        }
        if SPACING_PROPERTIES.contains(&property.as_str()) {
            for size_match in size_token.find_iter(&value) {
                let matched = size_match.as_str();
                if !ALLOWED_RAW_VALUES.contains(&matched) {
                    violations.push(format!(
                        "{property}: {value} — raw size \"{matched}\", use a var(--token) instead"
                    ));
                }
            }
        }
    }

    violations
}

/// Pulls the CSS to check out of a candidate directory: `<style>` block(s) from
/// `index.html`, plus the contents of any top-level `*.css` file, concatenated.
pub fn extract_css(candidate_dir: &Path) -> String {
    let mut css = String::new();

    let index_html_path = candidate_dir.join("index.html");
    if let Ok(html) = std::fs::read_to_string(&index_html_path) {
        let style_re = Regex::new(r"(?s)<style[^>]*>(.*?)</style>").unwrap();
        for captures in style_re.captures_iter(&html) {
            css.push_str(&captures[1]);
            css.push('\n');
        }
    }

    if let Ok(entries) = std::fs::read_dir(candidate_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|ext| ext.to_str()) == Some("css")
                && let Ok(contents) = std::fs::read_to_string(&path)
            {
                css.push_str(&contents);
                css.push('\n');
            }
        }
    }

    css
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn raw_hex_color_flagged() {
        let violations = lint_css("a { color: #ff0000; }");
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("raw hex color"));
    }

    #[test]
    fn raw_color_function_flagged() {
        let violations = lint_css("a { background: rgba(0, 0, 0, 0.5); }");
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("raw color function"));
    }

    #[test]
    fn untokenized_spacing_flagged() {
        let violations = lint_css("a { padding: 12px; }");
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("raw size"));
    }

    #[test]
    fn allowed_1px_border_not_flagged() {
        let violations = lint_css("a { border: 1px solid var(--border-color); }");
        assert!(violations.is_empty());
    }

    #[test]
    fn var_token_values_never_flagged() {
        let violations = lint_css("a { padding: var(--space-md); color: var(--text-color); }");
        assert!(violations.is_empty());
    }

    #[test]
    fn excluded_property_font_size_never_flagged() {
        let violations = lint_css("a { font-size: 14px; }");
        assert!(violations.is_empty());
    }

    #[test]
    fn extract_css_pulls_style_block_and_ignores_unrelated_html() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("index.html"),
            "<html><head><style>a { color: red; }</style></head><body><p>hello</p></body></html>",
        )
        .unwrap();

        let css = extract_css(dir.path());

        assert!(css.contains("color: red"));
        assert!(!css.contains("hello"));
    }

    #[test]
    fn extract_css_includes_top_level_css_files() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("index.html"), "<html></html>").unwrap();
        fs::write(dir.path().join("styles.css"), "b { margin: 4px; }").unwrap();

        let css = extract_css(dir.path());

        assert!(css.contains("margin: 4px"));
    }
}
