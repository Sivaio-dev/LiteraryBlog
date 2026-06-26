package com.blog.literary_blog.repositories;

import com.blog.literary_blog.models.Post;
import com.blog.literary_blog.models.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"categories"})
    Optional<Post> findBySlug(String slug);

    @EntityGraph(attributePaths = {"categories"})
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"categories"})
    @Query("SELECT p FROM Post p JOIN p.categories c WHERE c.slug = :categorySlug AND p.status = 'PUBLISHED'")
    Page<Post> findPublishedByCategorySlug(@Param("categorySlug") String categorySlug, Pageable pageable);

    @EntityGraph(attributePaths = {"categories"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Post> searchPublishedPosts(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"categories"})
    Optional<Post> findById(Long id);
}
