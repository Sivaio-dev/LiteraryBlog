package com.blog.literary_blog.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class SlugGenerator {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\p{L}\\p{N}\\s-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern MULTIPLE_HYPHENS = Pattern.compile("-+");

    public static String generateSlug(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "post";
        }
        String normalized = input.trim();
        if (containsLatin(input)) {
            normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        }
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        slug = WHITESPACE.matcher(slug).replaceAll("-");
        slug = MULTIPLE_HYPHENS.matcher(slug).replaceAll("-");
        slug = slug.replaceAll("^-+|-+$", "");
        if (slug.isEmpty()) {
            String fallback = input.replaceAll("[^\\p{L}\\p{N}\\s]", "").replaceAll("\\s+", "-");
            if (!fallback.isEmpty()) {
                slug = fallback;
            } else {
                slug = "post-" + System.currentTimeMillis();
            }
        }
        return slug.toLowerCase();
    }
    private static boolean containsLatin(String input) {
        return input.matches(".*[A-Za-z].*");
    }
}
