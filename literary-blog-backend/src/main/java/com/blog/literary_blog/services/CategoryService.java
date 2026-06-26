package com.blog.literary_blog.services;

import com.blog.literary_blog.models.Category;
import com.blog.literary_blog.repositories.CategoryRepository;
import com.blog.literary_blog.utils.SlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private String generateUniqueSlug(String name) {
        String baseSlug = SlugGenerator.generateSlug(name);
        String slug = baseSlug;
        int counter = 1;
        while (categoryRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    public Category createCategory(String name) {
        log.info("Creating category: {}", name);
        Category category = Category.builder()
                .name(name)
                .slug(generateUniqueSlug(name))
                .build();
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, String name) {
        log.info("Updating category: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setName(name);
        category.setSlug(generateUniqueSlug(name));
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        log.info("Deleting category: {}", id);
        categoryRepository.deleteById(id);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
    }
}
