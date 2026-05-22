/// Fast, offline rule-based text cleaning and grammar corrections.
pub fn clean_text(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    // Step 1: Remove common spoken filler words
    let fillers = [" uh, ", " uh ", " um, ", " um ", " err, ", " err ", " ah, ", " ah ", " like, you know, "];
    let mut cleaned = trimmed.to_string();
    
    // Case-insensitive filler word removal
    for filler in fillers {
        let clean_filler = filler.trim_matches(',');
        // Simple case insensitive replace
        cleaned = replace_case_insensitive(&cleaned, clean_filler, " ");
    }

    // Step 2: Normalize spaces
    cleaned = cleaned.split_whitespace().collect::<Vec<&str>>().join(" ");

    // Step 3: Capitalize the first letter
    let mut chars = cleaned.chars();
    cleaned = match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    };

    // Step 4: Ensure sentence ends with punctuation (. or ? or !)
    if let Some(last_char) = cleaned.chars().last() {
        if last_char != '.' && last_char != '?' && last_char != '!' && last_char != ',' {
            cleaned.push('.');
        }
    }

    cleaned
}

fn replace_case_insensitive(text: &str, target: &str, replacement: &str) -> String {
    let mut result = String::new();
    let mut last_index = 0;
    let text_lower = text.to_lowercase();
    let target_lower = target.to_lowercase();

    while let Some(index) = text_lower[last_index..].find(&target_lower) {
        let abs_index = last_index + index;
        result.push_str(&text[last_index..abs_index]);
        result.push_str(replacement);
        last_index = abs_index + target.len();
    }
    result.push_str(&text[last_index..]);
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_text_grammar() {
        let raw = "   uh hello this is a test um of wisprtype.   ";
        let cleaned = clean_text(raw);
        assert_eq!(cleaned, "Hello this is a test of wisprtype.");
    }

    #[test]
    fn test_clean_text_punctuation() {
        let raw = "hello world";
        let cleaned = clean_text(raw);
        assert_eq!(cleaned, "Hello world.");
    }
}
