package com.blog.literary_blog.services;

import com.blog.literary_blog.dto.PostDTO;
import com.blog.literary_blog.dto.PostResponseDTO;
import com.blog.literary_blog.models.Category;
import com.blog.literary_blog.models.Post;
import com.blog.literary_blog.models.PostStatus;
import com.blog.literary_blog.repositories.CategoryRepository;
import com.blog.literary_blog.repositories.LikeRepository;
import com.blog.literary_blog.repositories.PostRepository;
import com.blog.literary_blog.utils.SlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final LikeRepository likeRepository;
    private final NotificationService notificationService;

    private PostResponseDTO convertToDTO(Post post) {
        try {
            // Get category names – categories are already loaded via EntityGraph
            List<String> categoryNames = new ArrayList<>();
            if (post.getCategories() != null && !post.getCategories().isEmpty()) {
                categoryNames = post.getCategories().stream()
                        .map(Category::getName)
                        .collect(Collectors.toList());
            }

            long likeCount = likeRepository.countByPostId(post.getId());

            return PostResponseDTO.builder()
                    .id(post.getId())
                    .title(post.getTitle())
                    .slug(post.getSlug())
                    .content(post.getContent())
                    .coverImage(post.getCoverImage())
                    .status(post.getStatus())
                    .publishedAt(post.getPublishedAt())
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .categoryNames(categoryNames)
                    .likeCount(likeCount)
                    .build();
        } catch (Exception e) {
            log.error("Error converting post {} to DTO", post.getId(), e);
            // Fallback
            return PostResponseDTO.builder()
                    .id(post.getId())
                    .title(post.getTitle() != null ? post.getTitle() : "Unknown")
                    .slug(post.getSlug() != null ? post.getSlug() : "unknown")
                    .content("Error loading content")
                    .categoryNames(new ArrayList<>())
                    .likeCount(0L)
                    .build();
        }
    }

    @Transactional
    public PostResponseDTO createPost(PostDTO dto) {
        Post post = new Post();
        post.setTitle(dto.getTitle());
        post.setSlug(generateUniqueSlug(dto.getTitle()));
        post.setContent(dto.getContent());
        post.setCoverImage(dto.getCoverImage());
        post.setStatus(dto.getStatus());
        if (dto.getStatus() == PostStatus.PUBLISHED) {
            post.setPublishedAt(LocalDateTime.now());
        }

        Set<Category> categories = new HashSet<>();
        if (dto.getCategorySlugs() != null) {
            for (String slug : dto.getCategorySlugs()) {
                categoryRepository.findBySlug(slug).ifPresent(categories::add);
            }
        }
        post.setCategories(categories);

        Post saved = postRepository.save(post);
        System.out.println("🔍 Saved post: id=" + saved.getId() + ", status=" + saved.getStatus() + ", slug=" + saved.getSlug());
        if (saved.getStatus() == PostStatus.PUBLISHED && saved.getSlug() != null && !saved.getSlug().isEmpty()) {
            System.out.println("✅ Condition passed – sending notification");
            notificationService.sendNewPostNotification(saved.getTitle(), saved.getSlug());
        } else {
            System.out.println("❌ Condition failed – status=" + saved.getStatus() + ", slug=" + saved.getSlug());
        }
        // Reload with categories
        Post loaded = postRepository.findById(saved.getId()).orElse(saved);
        return convertToDTO(loaded);
    }

    @Transactional
    public PostResponseDTO updatePost(Long id, PostDTO dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setTitle(dto.getTitle());
        post.setSlug(generateUniqueSlug(dto.getTitle()));
        post.setContent(dto.getContent());
        post.setCoverImage(dto.getCoverImage());
        System.out.println("🔍 Before update: status=" + post.getStatus() + ", new status=" + dto.getStatus());
        if (dto.getStatus() == PostStatus.PUBLISHED && post.getStatus() != PostStatus.PUBLISHED) {
            post.setPublishedAt(LocalDateTime.now());
            System.out.println("✅ Status changed to PUBLISHED – sending notification");
            notificationService.sendNewPostNotification(post.getTitle(), post.getSlug());
        }
        post.setStatus(dto.getStatus());

        post.getCategories().clear();
        Set<Category> categories = new HashSet<>();
        if (dto.getCategorySlugs() != null) {
            for (String slug : dto.getCategorySlugs()) {
                categoryRepository.findBySlug(slug).ifPresent(categories::add);
            }
        }
        post.setCategories(categories);

        Post updated = postRepository.save(post);
        Post loaded = postRepository.findById(updated.getId()).orElse(updated);
        return convertToDTO(loaded);
    }

    @Transactional
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    @Transactional
    public List<PostResponseDTO> getAllPosts() {
        log.info("Fetching all posts (including drafts)");
        return postRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PostResponseDTO getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return convertToDTO(post);
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getPublishedPosts(Pageable pageable) {
        Page<Post> page = postRepository.findByStatus(PostStatus.PUBLISHED, pageable);
        List<PostResponseDTO> dtos = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getPostsByCategory(String categorySlug, Pageable pageable) {
        Page<Post> page = postRepository.findPublishedByCategorySlug(categorySlug, pageable);
        List<PostResponseDTO> dtos = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> searchPosts(String query, Pageable pageable) {
        Page<Post> page = postRepository.searchPublishedPosts(query, pageable);
        List<PostResponseDTO> dtos = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PostResponseDTO getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Post not found with slug: " + slug));
        return convertToDTO(post);
    }

    @Transactional
    private String generateUniqueSlug(String title) {
        String baseSlug = SlugGenerator.generateSlug(title);
        if (baseSlug.isEmpty() || baseSlug.equals("post")) {
            baseSlug = "post-" + System.currentTimeMillis();
        }
        String slug = baseSlug;
        int counter = 1;
        while (postRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }
}
