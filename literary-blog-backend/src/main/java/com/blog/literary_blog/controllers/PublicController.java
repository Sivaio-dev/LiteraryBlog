package com.blog.literary_blog.controllers;

import com.blog.literary_blog.dto.LikeResponseDTO;
import com.blog.literary_blog.dto.PostResponseDTO;
import com.blog.literary_blog.models.Category;
import com.blog.literary_blog.services.CategoryService;
import com.blog.literary_blog.services.LikeService;
import com.blog.literary_blog.services.PostService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final PostService postService;
    private final LikeService likeService;
    private final CategoryService categoryService;

    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponseDTO>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        log.info("Getting all posts");
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(postService.getPublishedPosts(pageable));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/posts/{slug}")
    public ResponseEntity<PostResponseDTO> getPost(@PathVariable String slug) {
        log.info("Getting post by slug: {}", slug);
        return ResponseEntity.ok(postService.getPostBySlug(slug));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<LikeResponseDTO> toggleLike(@PathVariable Long id, HttpServletRequest request) {
        log.info("Toggling like for post: {}", id);
        likeService.toggleLike(id, request);
        long count = likeService.getLikeCount(id);
        boolean liked = likeService.hasUserLiked(id, request);
        return ResponseEntity.ok(new LikeResponseDTO(count, liked));
    }

    @GetMapping("/posts/{id}/likes")
    public ResponseEntity<LikeResponseDTO> getLikes(@PathVariable Long id, HttpServletRequest request) {
        log.info("Getting likes for post: {}", id);
        long count = likeService.getLikeCount(id);
        boolean liked = likeService.hasUserLiked(id, request);
        return ResponseEntity.ok(new LikeResponseDTO(count, liked));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponseDTO>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Searching posts: {}", q);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.searchPosts(q, pageable));
    }

    @GetMapping("/categories/{slug}/posts")
    public ResponseEntity<Page<PostResponseDTO>> getPostsByCategory(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Getting posts by category: {}", slug);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getPostsByCategory(slug, pageable));
    }

    @GetMapping("/categories/{slug}")
    public ResponseEntity<Category> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.getCategoryBySlug(slug));
    }
}
