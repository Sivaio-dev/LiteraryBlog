package com.blog.literary_blog.repositories;

import com.blog.literary_blog.models.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    long countByPostId(Long postId);
    Optional<Like> findByPostIdAndVisitorIdentifier(Long postId, String visitorIdentifier);
}
