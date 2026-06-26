package com.blog.literary_blog.controllers;

import com.blog.literary_blog.dto.PostDTO;
import com.blog.literary_blog.dto.CategoryDTO;
import com.blog.literary_blog.dto.PostResponseDTO;
import com.blog.literary_blog.models.Category;
import com.blog.literary_blog.services.CategoryService;
import com.blog.literary_blog.services.PostService;
import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final PostService postService;
    private final CategoryService categoryService;
    private final Cloudinary cloudinary;

    @GetMapping("/posts")
    public ResponseEntity<List<PostResponseDTO>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostResponseDTO> getPostById(@PathVariable Long id) {
        log.info("Fetching post by ID for admin: {}", id);
        return ResponseEntity.ok(postService.getPostById(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/posts")
    public ResponseEntity<PostResponseDTO> createPost(@RequestBody PostDTO dto) {
        log.info("Creating post via admin");
        PostResponseDTO response = postService.createPost(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<PostResponseDTO> updatePost(@PathVariable Long id, @RequestBody PostDTO dto) {
        log.info("Updating post via admin: {}", id);
        PostResponseDTO response = postService.updatePost(id, dto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        log.info("Deleting post via admin: {}", id);
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CategoryDTO dto) {
        log.info("Creating category via admin");
        Category category = categoryService.createCategory(dto.getName());
        return new ResponseEntity<>(category, HttpStatus.CREATED);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO dto) {
        log.info("Updating category via admin: {}", id);
        Category category = categoryService.updateCategory(id, dto.getName());
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("Deleting category via admin: {}", id);
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Uploading image");
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), Map.of());
        String url = uploadResult.get("url").toString();
        return ResponseEntity.ok(Map.of("url", url));
    }
}
