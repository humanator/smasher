// ABOUTME: Regex-based tag/attribute checks: button/input/dialog/list-row conventions.
// ABOUTME: Flags candidate markup that doesn't use the design kit's component classes.

use regex::Regex;

fn attr_value<'a>(tag: &'a str, attr: &str) -> Option<&'a str> {
    let re = Regex::new(&format!(r#"{}\s*=\s*"([^"]*)""#, regex::escape(attr))).unwrap();
    re.captures(tag).map(|c| c.get(1).unwrap().as_str())
}

fn has_class(tag: &str, class: &str) -> bool {
    attr_value(tag, "class")
        .map(|classes| classes.split_whitespace().any(|c| c == class))
        .unwrap_or(false)
}

/// True if `attr` appears as a standalone attribute token (e.g. bare `hidden`, not
/// substring-matched inside another attribute's value).
fn has_bare_attr(tag: &str, attr: &str) -> bool {
    let re = Regex::new(&format!(r"(?:^|\s){}(?:\s|=|/?>)", regex::escape(attr))).unwrap();
    re.is_match(tag)
}

/// Runs all four kit-component-usage rules against raw candidate HTML text, returning
/// one violation per offending element, naming the tag.
///
/// - `<button>` must carry `.btn`
/// - a text `<input>` (no `type` or `type="text"`) must carry `.input`
/// - `role="button"` must carry `.list-row-action`
/// - `role="dialog"` must carry `aria-modal="true"` and `hidden`
pub fn check_kit_usage(html: &str) -> Vec<String> {
    let mut violations = Vec::new();
    let tag_re = Regex::new(r"<[a-zA-Z][^>]*>").unwrap();
    let tag_name_re = Regex::new(r"^<([a-zA-Z][a-zA-Z0-9-]*)").unwrap();

    for tag_match in tag_re.find_iter(html) {
        let tag = tag_match.as_str();
        let Some(tag_name) = tag_name_re
            .captures(tag)
            .map(|c| c[1].to_lowercase())
        else {
            continue;
        };

        if tag_name == "button" && !has_class(tag, "btn") {
            violations.push(format!("{tag} — <button> missing .btn class"));
        }

        if tag_name == "input" {
            let is_text_input = matches!(attr_value(tag, "type"), None | Some("text"));
            if is_text_input && !has_class(tag, "input") {
                violations.push(format!("{tag} — text <input> missing .input class"));
            }
        }

        match attr_value(tag, "role") {
            Some("button") if !has_class(tag, "list-row-action") => {
                violations.push(format!(
                    "{tag} — role=\"button\" element missing .list-row-action class"
                ));
            }
            Some("dialog") => {
                let has_aria_modal = attr_value(tag, "aria-modal") == Some("true");
                let has_hidden = has_bare_attr(tag, "hidden");
                if !has_aria_modal || !has_hidden {
                    violations.push(format!(
                        "{tag} — role=\"dialog\" element missing aria-modal=\"true\" and/or hidden"
                    ));
                }
            }
            _ => {}
        }
    }

    violations
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn button_with_btn_class_passes() {
        let violations = check_kit_usage(r#"<button class="btn btn-primary">Save</button>"#);
        assert!(violations.is_empty());
    }

    #[test]
    fn button_without_btn_class_fails() {
        let violations = check_kit_usage(r#"<button style="color: red">Save</button>"#);
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("button"));
    }

    #[test]
    fn text_input_with_input_class_passes() {
        let violations = check_kit_usage(r#"<input class="input" type="text" />"#);
        assert!(violations.is_empty());
    }

    #[test]
    fn bare_text_input_fails() {
        let violations = check_kit_usage(r#"<input type="text" />"#);
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("input"));
    }

    #[test]
    fn input_with_no_type_attr_is_treated_as_text() {
        let violations = check_kit_usage(r#"<input />"#);
        assert_eq!(violations.len(), 1);
    }

    #[test]
    fn non_text_input_type_is_out_of_scope() {
        let violations = check_kit_usage(r#"<input type="checkbox" />"#);
        assert!(violations.is_empty());
    }

    #[test]
    fn role_button_with_list_row_action_class_passes() {
        let violations = check_kit_usage(
            r#"<li role="button" tabindex="0" class="list-row-action">Row</li>"#,
        );
        assert!(violations.is_empty());
    }

    #[test]
    fn bare_role_button_fails() {
        let violations = check_kit_usage(r#"<li role="button" tabindex="0">Row</li>"#);
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("list-row-action"));
    }

    #[test]
    fn role_dialog_with_aria_modal_and_hidden_passes() {
        let violations =
            check_kit_usage(r#"<div role="dialog" aria-modal="true" hidden>Dialog</div>"#);
        assert!(violations.is_empty());
    }

    #[test]
    fn role_dialog_alone_fails() {
        let violations = check_kit_usage(r#"<div role="dialog">Dialog</div>"#);
        assert_eq!(violations.len(), 1);
        assert!(violations[0].contains("aria-modal"));
    }

    #[test]
    fn role_dialog_with_aria_modal_but_no_hidden_fails() {
        let violations = check_kit_usage(r#"<div role="dialog" aria-modal="true">Dialog</div>"#);
        assert_eq!(violations.len(), 1);
    }

    #[test]
    fn clean_document_produces_no_violations() {
        let html = r#"
            <button class="btn">Save</button>
            <input class="input" type="text" />
            <li role="button" tabindex="0" class="list-row-action">Row</li>
            <div role="dialog" aria-modal="true" hidden>Dialog</div>
        "#;
        assert!(check_kit_usage(html).is_empty());
    }
}
