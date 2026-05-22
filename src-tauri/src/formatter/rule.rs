/// Fast, offline rule-based text cleaning and grammar corrections.
pub fn clean_text(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    // Step 1: Remove multi-word spoken filler phrases case-insensitively
    let phrases = ["like, you know,", "like you know, ", "like you know "];
    let mut cleaned = trimmed.to_string();
    for phrase in phrases {
        cleaned = replace_case_insensitive(&cleaned, phrase, " ");
    }

    // Step 2: Split into words and filter out single-word filler words case-insensitively
    let single_fillers = ["uh", "um", "err", "ah"];
    let words: Vec<&str> = cleaned.split_whitespace().collect();
    let mut filtered_words = Vec::new();

    for word in words {
        // Strip surrounding punctuation temporarily to check if it's a filler
        let cleaned_word = word.trim_matches(|c: char| c == ',' || c == '.' || c == '?' || c == '!' || c == ';');
        let lower_word = cleaned_word.to_lowercase();
        
        if single_fillers.contains(&lower_word.as_str()) {
            continue;
        }
        filtered_words.push(word);
    }

    // Step 3: Reassemble the words
    cleaned = filtered_words.join(" ");

    // Step 4: Capitalize the first letter
    let mut chars = cleaned.chars();
    cleaned = match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    };

    // Step 5: Ensure sentence ends with punctuation (. or ? or !)
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
